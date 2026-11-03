// A regra: recebe a interpretação da IA + os dados do pedido e decide dinheiro, escalonamento e urgência.
// Determinística e auditável. Espelha REGRAS.md (v1). A IA nunca decide valor.
import { CONFIG } from "./config";
import type { Classificacao, Decisao, Gatilho, IdGatilho, Pedido, Responsavel } from "./tipos";

const r2 = (v: number) => Math.round(v * 100) / 100;
export const brl = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

// ---------- Rede de segurança: palavras-chave que forçam pessoa mesmo se a IA errar
const normalizar = (t: string) => t.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
const PALAVRAS_SAUDE = [
  "alergi", "alergic", "antialerg", "anafila", "aplv", "celiac", "intoxica", "passei mal", "passou mal",
  "passamos mal", "vomit", "diarreia", "hospital", "pronto-socorro", "podre", "mofo", "mofad",
  "barata", "inseto", "larva", "lesma", "pedaco de plastico", "caco de vidro", "corpo estranho",
  "um cabelo", "cabelo na comida", "cabelo no ",
];
const PALAVRAS_JURIDICO = [
  "procon", "processar", "processo judicial", "advogad", "juizado", "justica", "vigilancia sanitaria",
  "reclame aqui", "consumidor.gov", "expor voces", "vou expor", "viralizar", "imprensa", "denunciar",
];

// "estragado" só conta quando fala de comida ("festa estragada" não é risco à saúde).
const ESTRAGADO = /\b(tava|estava|ta|esta|veio|chegou|comida|gosto de|cheiro de|parecia|meio) estragad/;

// v1.6: contestação no cartão = risco de pagar duas vezes (estorno + reembolso).
const PALAVRAS_FRAUDE = ["contestacao no cartao", "abri contestacao", "abri uma contestacao", "contestei", "chargeback", "disputa no cartao", "abri disputa"];

export function redeDeSeguranca(texto: string) {
  const t = normalizar(texto);
  return {
    fraude: PALAVRAS_FRAUDE.find((p) => t.includes(p)) ?? null,
    saude: PALAVRAS_SAUDE.find((p) => t.includes(p)) ?? (ESTRAGADO.test(t) ? "estragado" : null),
    juridico: PALAVRAS_JURIDICO.find((p) => t.includes(p)) ?? null,
  };
}

// ---------- Decisão
export function decidir(pedido: Pedido, ia: Classificacao, textoReclamacao: string): Decisao {
  const precos = new Map(pedido.itens.map((i) => [normalizar(i.nome), i]));
  const totalPedido = r2(pedido.itens.reduce((s, i) => s + i.valor_unit * i.qtd, 0) + pedido.taxa_entrega);
  const pagoPeloCliente = r2(totalPedido + pedido.cobrado_a_mais);
  const cats = new Set(ia.categorias.map((c) => c.categoria));
  const linhas: Decisao["linhas"] = [];
  const itensForaDoPedido = [...ia.itens_citados_fora_do_pedido];

  let dinheiro = 0;
  let cupom = 0;
  let valorReferencia = 0;
  let pedidoInteiroPerdido = false;

  const valorItens = (itens: { nome: string; quantidade: number }[], fator: number) => {
    let soma = 0;
    const desc: string[] = [];
    for (const it of itens) {
      const p = precos.get(normalizar(it.nome));
      if (!p) { itensForaDoPedido.push(it.nome); continue; }
      // (c) v5: no item incompleto a base é o item inteiro (a IA pode mandar 0,5 para "veio pela metade";
      // os 50% já representam isso e não podem ser aplicados duas vezes).
      const qBruta = fator < 1 ? Math.ceil(it.quantidade) : it.quantidade;
      const q = Math.max(0, Math.min(qBruta, p.qtd));
      const v = r2(p.valor_unit * q * fator);
      soma += v;
      desc.push(`${q}x ${p.nome}`);
    }
    return { soma: r2(soma), desc: desc.join(", ") };
  };

  if (cats.has("nao_entregue")) {
    // R-NE: devolve o total do pedido e ignora o resto, exceto cobrança indevida (dinheiro à parte).
    dinheiro = totalPedido;
    linhas.push({ regra: "R-NE", descricao: "Pedido não entregue: total do pedido", valor: totalPedido, tipo: "dinheiro" });
    if (cats.has("cobranca_indevida") && pedido.cobrado_a_mais > 0) {
      dinheiro = r2(dinheiro + pedido.cobrado_a_mais);
      linhas.push({ regra: "R-COB", descricao: "Cobrança indevida", valor: pedido.cobrado_a_mais, tipo: "dinheiro" });
    }
    if (cats.has("comportamento_entregador"))
      linhas.push({ regra: "R-COMP", descricao: "Comportamento do entregador: análise por uma pessoa", valor: 0, tipo: "pessoa" });
  } else {
    // Valor por item: o mesmo item nunca é pago duas vezes (vale a regra de maior valor).
    const porItem = new Map<string, { valor: number; regra: string; descricao: string }>();
    const cupons: { valor: number; regra: string; descricao: string }[] = [];
    let extra = 0;
    const FATOR: Record<string, [number, string, string]> = {
      item_faltando: [1, "R-FALT", "Item faltando"],
      item_errado: [1, "R-ERR", "Item errado (valor inteiro)"],
      qualidade_inutilizada: [1, "R-QI", "Comida sem condição de consumo"],
      item_incompleto: [CONFIG.fatorItemIncompleto, "R-INC", `Item incompleto (${CONFIG.fatorItemIncompleto * 100}%)`],
    };
    for (const c of ia.categorias) {
      const f = FATOR[c.categoria];
      if (f) {
        for (const it of c.itens_afetados) {
          const { soma, desc } = valorItens([it], f[0]);
          if (!desc) continue;
          const chave = normalizar(it.nome);
          if (soma > (porItem.get(chave)?.valor ?? -1)) porItem.set(chave, { valor: soma, regra: f[1], descricao: `${f[2]}: ${desc}` });
        }
      } else if (c.categoria === "item_detalhe") {
        cupons.push({ valor: CONFIG.cupomDetalhe, regra: "R-DET", descricao: "Erro sem prejuízo (personalização, brinde, item trocado consumido)" });
      } else if (c.categoria === "qualidade_leve") {
        cupons.push({ valor: CONFIG.cupomQualidadeLeve, regra: "R-QL", descricao: "Qualidade (comida aproveitável)" });
      } else if (c.categoria === "atraso") {
        const m = pedido.minutos_atraso, A = CONFIG.atraso;
        if (m <= A.semCompensacaoAte)
          linhas.push({ regra: "R-ATR", descricao: `Atraso registrado de ${m} min (até ${A.semCompensacaoAte} min: sem compensação)`, valor: 0, tipo: "nenhum" });
        else if (m <= A.faixa1Ate) cupons.push({ valor: A.cupomFaixa1, regra: "R-ATR", descricao: `Atraso de ${m} min` });
        else if (m <= A.faixa2Ate) cupons.push({ valor: A.cupomFaixa2, regra: "R-ATR", descricao: `Atraso de ${m} min` });
        else {
          cupons.push({ valor: A.cupomAcimaDe60, regra: "R-ATR", descricao: `Atraso de ${m} min` });
          extra += pedido.taxa_entrega;
          linhas.push({ regra: "R-ATR", descricao: `Atraso acima de ${A.faixa2Ate} min: taxa de entrega devolvida`, valor: pedido.taxa_entrega, tipo: "dinheiro" });
        }
      } else if (c.categoria === "cobranca_indevida") {
        extra += pedido.cobrado_a_mais;
        linhas.push({ regra: "R-COB", descricao: "Cobrança indevida", valor: pedido.cobrado_a_mais, tipo: "dinheiro" });
      } else if (c.categoria === "qualidade_saude") {
        valorReferencia = r2(valorReferencia + valorItens(c.itens_afetados, 1).soma);
        linhas.push({ regra: "R-QS", descricao: "Risco à saúde: decisão de uma pessoa", valor: 0, tipo: "pessoa" });
      } else if (c.categoria === "comportamento_entregador") {
        linhas.push({ regra: "R-COMP", descricao: "Comportamento do entregador: análise por uma pessoa", valor: 0, tipo: "pessoa" });
      } else if (c.categoria === "outro") {
        linhas.push({ regra: "R-OUT", descricao: "Não classificável: análise por uma pessoa", valor: 0, tipo: "pessoa" });
      }
    }
    for (const v of porItem.values()) linhas.push({ regra: v.regra, descricao: v.descricao, valor: v.valor, tipo: "dinheiro" });
    // Só um cupom por reclamação: o de maior valor.
    // R-TOTAL: tudo o que foi pedido veio errado, faltando ou sem condição de comer => devolve também a taxa,
    // dá cortesia e o cliente pode escolher reenvio sem custo (decisão de 02/11).
    const cobertura = new Map<string, number>();
    for (const c of ia.categorias)
      if (c.categoria === "item_errado" || c.categoria === "qualidade_inutilizada" || c.categoria === "item_faltando")
        for (const it of c.itens_afetados) cobertura.set(normalizar(it.nome), (cobertura.get(normalizar(it.nome)) ?? 0) + it.quantidade);
    pedidoInteiroPerdido = pedido.itens.length > 0 && pedido.itens.every((i) => (cobertura.get(normalizar(i.nome)) ?? 0) >= i.qtd);
    if (pedidoInteiroPerdido && !(cats.has("atraso") && pedido.minutos_atraso > CONFIG.atraso.faixa2Ate)) {
      extra += pedido.taxa_entrega;
      linhas.push({ regra: "R-TOTAL", descricao: "Pedido inteiro perdido: taxa de entrega devolvida", valor: pedido.taxa_entrega, tipo: "dinheiro" });
    }
    if (pedidoInteiroPerdido) cupons.push({ valor: CONFIG.cupomCortesia, regra: "R-TOTAL", descricao: "Cortesia (pedido inteiro perdido)" });
    if (cupons.length) {
      const maior = cupons.reduce((a, b) => (b.valor > a.valor ? b : a));
      cupom = maior.valor;
      linhas.push({ regra: maior.regra, descricao: `${maior.descricao}: cupom (só o maior vale)`, valor: maior.valor, tipo: "cupom" });
    }
    const somaItens = [...porItem.values()].reduce((s, v) => s + v.valor, 0);
    dinheiro = r2(Math.min(somaItens + extra, pagoPeloCliente));
  }

  // ---------- Gatilhos
  const gatilhos: Gatilho[] = [];
  const add = (id: IdGatilho, motivo: string, origem: Gatilho["origem"], trecho?: string) => {
    if (!gatilhos.some((g) => g.id === id)) gatilhos.push({ id, motivo, origem, ...(trecho ? { trecho } : {}) });
  };
  const trechoIA = (tipo: string) => ia.gatilhos.find((g) => g.tipo === tipo)?.trecho;
  const rede = redeDeSeguranca(textoReclamacao);

  if (dinheiro > CONFIG.limiteHumano) add("H1", `Valor acima de ${brl(CONFIG.limiteHumano)}`, "regra");
  if (trechoIA("saude") || cats.has("qualidade_saude")) add("H2", "Risco à saúde", "ia", trechoIA("saude"));
  else if (rede.saude) add("H2", `Risco à saúde (palavra-chave: "${rede.saude}")`, "rede_de_seguranca");
  if (trechoIA("juridico_exposicao")) add("H3", "Jurídico ou exposição pública", "ia", trechoIA("juridico_exposicao"));
  else if (rede.juridico) add("H3", `Jurídico ou exposição (palavra-chave: "${rede.juridico}")`, "rede_de_seguranca");
  if (trechoIA("comportamento_entregador") || cats.has("comportamento_entregador"))
    add("H4", "Comportamento do entregador", "ia", trechoIA("comportamento_entregador"));
  // Responsável "incerto" NÃO escala: é campo interno (quem paga) e não muda nada para o cliente (decisão de 02/11).
  if (ia.confianca === "baixa" || cats.has("outro"))
    add("H5", "Classificação incerta (confiança baixa ou categoria 'outro')", "ia");
  if (cats.has("nao_entregue") && pedido.codigo_validado)
    add("H6", "Diz que não recebeu, mas o código de entrega foi validado", "regra");
  else if (ia.atraso_alegado_min !== null && ia.atraso_alegado_min - pedido.minutos_atraso > CONFIG.divergenciaAtrasoMin)
    add("H6", `Atraso alegado (${ia.atraso_alegado_min} min) muito acima do registrado (${pedido.minutos_atraso} min)`, "regra");
  else if (itensForaDoPedido.length)
    add("H6", `Cita item que não está no pedido: ${[...new Set(itensForaDoPedido)].join(", ")}`, "regra");
  if (trechoIA("suspeita_fraude")) add("H7", "Suspeita de fraude: sinalizar, nunca negar", "ia", trechoIA("suspeita_fraude"));
  else if (rede.fraude) add("H7", `Contestação no cartão (palavra-chave: "${rede.fraude}"): risco de pagar duas vezes`, "rede_de_seguranca");
  if (pedido.historico.negativa_anterior_neste_pedido) add("H8", "Segunda tentativa: já houve negativa neste pedido", "regra");
  if (pedido.historico.reclamacoes_90d >= CONFIG.reclamacoesParaRevisao)
    add("H9", `Cliente com ${pedido.historico.reclamacoes_90d} reclamações nos últimos 90 dias (revisão, nunca negativa)`, "regra");
  if (cats.has("atraso") && pedido.minutos_atraso > CONFIG.atraso.pessoaAcimaDe)
    add("H10", `Atraso extremo: ${pedido.minutos_atraso} min (acima de ${CONFIG.atraso.pessoaAcimaDe})`, "regra");

  // (b) v5: se já houve reembolso neste pedido, a automação nunca paga de novo.
  if ((pedido.ja_reembolsado ?? 0) > 0)
    add("H12", `Já houve reembolso de ${brl(pedido.ja_reembolsado!)} neste pedido: não pagar de novo automaticamente`, "regra");
  // (a) v5: trava do princípio "a automação só concede". Problema real + regra calculou nada => pessoa, nunca silêncio.
  const temProblemaQueCompensa = ia.categorias.some((c) => c.categoria !== "atraso" && c.categoria !== "outro");
  if (!gatilhos.length && temProblemaQueCompensa && dinheiro === 0 && cupom === 0)
    add("H11", "A regra não encontrou valor a conceder para um problema real: uma pessoa decide (nunca negar em silêncio)", "regra");

  const ids = new Set(gatilhos.map((g) => g.id));
  // v1.4 (decisão da Marina): o cliente nunca espera pelo que a regra já sabe que é dele.
  // Caso escalado recebe na hora o valor calculado (até o limite); a pessoa decide o resto.
  // Exceção: gatilhos de DÚVIDA sobre se algo é devido (divergência, fraude, segunda tentativa, vago, já reembolsado).
  const DUVIDA: IdGatilho[] = ["H5", "H6", "H7", "H8", "H9", "H11", "H12"]; // v1.6: H9 (histórico) também espera a pessoa
  const base = Math.max(dinheiro, valorReferencia);
  let pagoDinheiro = 0, pagoCupom = 0;
  if (!gatilhos.length) { pagoDinheiro = dinheiro; pagoCupom = cupom; }
  else if (!DUVIDA.some((h) => ids.has(h))) { pagoDinheiro = r2(Math.min(base, CONFIG.limiteHumano)); pagoCupom = cupom; }
  const ficaParaPessoa = gatilhos.length ? r2(base - pagoDinheiro) : 0;
  const vaiParaHumano = gatilhos.length > 0;
  const urgencia: Decisao["urgencia"] =
    ["H2", "H3", "H4", "H8"].some((h) => ids.has(h as IdGatilho)) || cats.has("nao_entregue")
      ? "alta"
      : dinheiro > 0 || vaiParaHumano ? "media" : "baixa";

  const resps = new Set(ia.categorias.map((c) => c.responsavel));
  const responsavel_geral: Decisao["responsavel_geral"] =
    resps.size === 1 ? ([...resps][0] as Responsavel) : resps.size === 0 ? "incerto" : "multiplos";

  const partes = [
    `Categorias: ${ia.categorias.map((c) => c.categoria).join(" + ")}.`,
    ...linhas.map((l) => `${l.regra} – ${l.descricao}${l.tipo === "dinheiro" || l.tipo === "cupom" ? `: ${brl(l.valor)}` : ""}.`),
    dinheiro > 0 ? `Devolução: ${brl(dinheiro)} pelo meio de pagamento original.` : "Sem devolução em dinheiro.",
    cupom > 0 ? `Cupom: ${brl(cupom)} (validade ${CONFIG.validadeCupomDias} dias).` : "",
    vaiParaHumano
      ? `Encaminhado para uma pessoa: ${gatilhos.map((g) => `${g.id} (${g.motivo})`).join("; ")}. Pago na hora: ${brl(pagoDinheiro)}${pagoCupom ? ` + cupom ${brl(pagoCupom)}` : ""}; a pessoa decide o restante${ficaParaPessoa ? ` (${brl(ficaParaPessoa)} calculados)` : ""}.`
      : "Decisão automática.",
    ia.tentativa_manipulacao.detectada ? "Tentativa de manipulação registrada e ignorada." : "",
    `Regras ${CONFIG.versaoRegras}.`,
  ].filter(Boolean);

  return {
    versao_regras: CONFIG.versaoRegras,
    dinheiro,
    cupom,
    cupom_validade_dias: CONFIG.validadeCupomDias,
    linhas,
    valor_referencia_pessoa: valorReferencia,
    opcao_reenvio: pedidoInteiroPerdido,
    pago_na_hora: { dinheiro: pagoDinheiro, cupom: pagoCupom },
    fila: filaPara(gatilhos.map((g) => g.id)),
    fica_para_pessoa: ficaParaPessoa,
    vai_para_humano: vaiParaHumano,
    gatilhos,
    urgencia,
    responsavel_geral,
    manipulacao_registrada: ia.tentativa_manipulacao.detectada,
    justificativa_crm: partes.join(" "),
  };
}

// v1.6: cada tipo de caso sensível vai sempre para o mesmo time, com o seu roteiro (nada de "vai para um, vai para outro").
export function filaPara(ids: IdGatilho[]): string {
  const tem = (...h: IdGatilho[]) => h.some((x) => ids.includes(x));
  if (!ids.length) return "Automático";
  if (tem("H2")) return "Segurança alimentar";
  if (tem("H3")) return "Ouvidoria e jurídico";
  if (tem("H4")) return "Operações de entregadores";
  if (tem("H6", "H7", "H9", "H12")) return "Antifraude e conferência";
  if (tem("H8")) return "Revisão de casos negados";
  return "Atendimento: casos especiais";
}
