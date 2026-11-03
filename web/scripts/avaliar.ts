// Roda o agente nos casos e salva os resultados para o painel.
// Uso: npx tsx scripts/avaliar.ts --conjunto dev --versao v1 [--limite 3] [--ids 1,4,7]
// GASTA DINHEIRO (Claude API). Só rodar com autorização da Marina.
import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { triar, type ResultadoTriagem, MODELO, USD_BRL } from "../src/lib/agente/triagem";
import type { Pedido } from "../src/lib/regras/tipos";
import { decidir } from "../src/lib/regras/motor";

const aqui = path.dirname(fileURLToPath(import.meta.url));
const raiz = path.resolve(aqui, "../..");
for (const arq of [".env.local", ".env"]) {
  const p = path.join(aqui, "..", arq);
  if (existsSync(p)) for (const l of readFileSync(p, "utf-8").split("\n")) {
    const m = l.match(/^\s*([A-Z_]+)\s*=\s*"?([^"]*)"?\s*$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
  }
}

const arg = (n: string) => { const i = process.argv.indexOf(`--${n}`); return i > -1 ? process.argv[i + 1] : undefined; };
const conjunto = arg("conjunto") ?? "dev";
const versao = arg("versao") ?? "v1";
const limite = Number(arg("limite") ?? Infinity);
const ids = arg("ids")?.split(",").map(Number);

interface Caso {
  id: number; grupo: string; texto: string; conjunto: string; pedido: Pedido;
  gabarito: { categorias: { categoria: string }[]; responsavel: string; gatilhos: string[]; urgencia: string; manipulacao: boolean; vai_para_humano: boolean; esperado_regra: { dinheiro: number; cupom: number; pago_dinheiro?: number; pago_cupom?: number } };
}
const todos: Caso[] = JSON.parse(readFileSync(path.join(raiz, "casos/todos.json"), "utf-8"));
// --completar <arquivo>: só roda os casos que FALHARAM por erro de API (ex.: crédito acabou) e junta com os que já rodaram.
// Não repete nenhum caso que já tem resultado: a medição continua sendo "uma vez por caso".
const completar = arg("completar");
const jaFeitos: { id: number; erro?: string }[] = completar ? JSON.parse(readFileSync(path.join(raiz, "resultados", completar), "utf-8")).casos : [];
const idsFeitos = new Set(jaFeitos.filter((c) => !c.erro).map((c) => c.id));
const casos = todos.filter((c) => (ids ? ids.includes(c.id) : c.conjunto === conjunto)).filter((c) => !idsFeitos.has(c.id)).slice(0, limite);

// Verificações automáticas da resposta (heurísticas; não substituem leitura humana).
// Valores em R$ citados na resposta (ex.: "R$ 26,90" -> 26.9).
// v5 do verificador: aceita "R$ 26,90" (pt-BR) e "R$ 44.90" (respostas em inglês).
const valores = (t: string) => [...t.matchAll(/r\$\s?(\d{1,3}(?:[.,]\d{3})*(?:[.,]\d{2})?)/gi)].map((m) => {
  const v = m[1]; const dec = v.match(/[.,](\d{2})$/);
  return dec ? Number(v.slice(0, -3).replace(/[.,]/g, "") + "." + dec[1]) : Number(v.replace(/[.,]/g, ""));
});

function checarResposta(t: string, r: ResultadoTriagem, textoCliente = "") {
  const n = t.toLowerCase();
  // v3 do verificador (v1.4): num caso escalado, a resposta PODE citar o que foi pago na hora e os valores que o
  // próprio cliente citou; qualquer outro valor é promessa indevida.
  // v4 do verificador: valores que o cliente citou valem mesmo sem "R$" ("foram 340 reais").
  const numerosCliente = [...textoCliente.matchAll(/(\d{1,3}(?:\.\d{3})*(?:,\d{2})?)/g)].map((m) => Number(m[1].replace(/\./g, "").replace(",", ".")));
  const permitidos = new Set([r.decisao.pago_na_hora?.dinheiro ?? 0, r.decisao.pago_na_hora?.cupom ?? 0, ...valores(textoCliente), ...numerosCliente]);
  return {
    C2_sem_culpar: !/(culpa d[oa]|responsabilidade d[oa] (restaurante|loja|entregador)|é com o restaurante|problema do restaurante)/.test(n),
    // v2 do verificador: repetir o valor que o cliente citou não é promessa; só acusa valor ligado a devolução.
    C4_sem_valor_em_escalado: !r.decisao.vai_para_humano || valores(t).every((v) => permitidos.has(v)),
    C6_sem_negativa: !/(não (é )?eleg[ií]vel|não (temos como|podemos) (reembolsar|devolver)|negad)/.test(n),
    C7_tamanho: t.length <= 700,
  };
}

// --repontuar <arquivo>: reaproveita as classificações salvas, recalcula a regra atual e confere contra o gabarito atual.
// Não chama a API (custo zero). Serve para separar o efeito da mudança de regra do efeito da mudança de prompt.
const repontuar = arg("repontuar");
const salvos: Record<number, ResultadoTriagem> = repontuar
  ? Object.fromEntries(JSON.parse(readFileSync(path.join(raiz, "resultados", repontuar), "utf-8")).casos.filter((x: { resultado?: unknown }) => x.resultado).map((x: { id: number; resultado: ResultadoTriagem }) => [x.id, x.resultado]))
  : {};

async function rodarCaso(c: Caso) {
  try {
    let r: ResultadoTriagem;
    if (repontuar) {
      const s = salvos[c.id];
      if (!s) throw new Error("caso não está no arquivo repontuado");
      r = { ...s, decisao: decidir(c.pedido, s.classificacao, c.texto) };
    } else r = await triar(c.texto, c.pedido);
    const g = c.gabarito;
    const ouro = new Set(g.categorias.map((x) => x.categoria));
    const prev = new Set<string>(r.classificacao.categorias.map((x) => x.categoria));
    const inter = [...ouro].filter((x) => prev.has(x)).length;
    const uniao = new Set([...ouro, ...prev]).size;
    return {
      id: c.id, grupo: c.grupo, texto: c.texto,
      esperado: { categorias: [...ouro], responsavel: g.responsavel, vai_para_humano: g.vai_para_humano, gatilhos: g.gatilhos, urgencia: g.urgencia, manipulacao: g.manipulacao, dinheiro: g.esperado_regra.dinheiro, cupom: g.esperado_regra.cupom },
      obtido: { categorias: [...prev], responsavel: r.decisao.responsavel_geral, vai_para_humano: r.decisao.vai_para_humano, gatilhos: r.decisao.gatilhos.map((x) => x.id), urgencia: r.decisao.urgencia, manipulacao: r.decisao.manipulacao_registrada, dinheiro: r.decisao.dinheiro, cupom: r.decisao.cupom },
      acertos: {
        categorias_exatas: inter === ouro.size && ouro.size === prev.size,
        categorias_jaccard: uniao ? inter / uniao : 1,
        responsavel: r.decisao.responsavel_geral === g.responsavel,
        escalonamento: r.decisao.vai_para_humano === g.vai_para_humano,
        valor: r.decisao.dinheiro === g.esperado_regra.dinheiro && r.decisao.cupom === g.esperado_regra.cupom,
        urgencia: r.decisao.urgencia === g.urgencia,
        manipulacao: r.decisao.manipulacao_registrada === g.manipulacao,
        ...(g.esperado_regra.pago_dinheiro !== undefined && r.decisao.pago_na_hora
          ? { pago_na_hora: r.decisao.pago_na_hora.dinheiro === g.esperado_regra.pago_dinheiro && r.decisao.pago_na_hora.cupom === g.esperado_regra.pago_cupom }
          : {}),
      },
      resposta: checarResposta(r.resposta_ao_cliente, r, c.texto),
      resultado: r,
    };
  } catch (e) {
    return { id: c.id, grupo: c.grupo, texto: c.texto, erro: String(e) };
  }
}

async function main() {
  console.log(`${repontuar ? "Repontuando " + repontuar + ":" : "Rodando"} ${casos.length} casos (${ids ? "ids " + ids : conjunto}) com ${MODELO}, versão ${versao}...`);
  const saida: Awaited<ReturnType<typeof rodarCaso>>[] = [];
  const fila = [...casos];
  await Promise.all(Array.from({ length: 3 }, async () => {
    while (fila.length) {
      const c = fila.shift()!;
      const r = await rodarCaso(c);
      saida.push(r);
      const ok = "acertos" in r ? Object.entries(r.acertos!).filter(([k, v]) => k !== "categorias_jaccard" && !v).map(([k]) => k) : ["ERRO"];
      console.log(`#${c.id} ${ok.length ? "✗ " + ok.join(", ") : "✓"}`);
    }
  }));
  if (completar) for (const c of jaFeitos) if (!c.erro) saida.push(c as (typeof saida)[number]);
  saida.sort((a, b) => a.id - b.id);
  const ok = saida.filter((r) => "acertos" in r) as Extract<(typeof saida)[number], { acertos: unknown }>[];
  const pct = (f: (r: (typeof ok)[number]) => boolean, base = ok) => (base.length ? Math.round((base.filter(f).length / base.length) * 1000) / 10 : null);
  const deveriaEscalar = ok.filter((r) => r.esperado.vai_para_humano);
  const saudeJur = ok.filter((r) => r.esperado.gatilhos.some((h) => h === "H2" || h === "H3"));
  const naoDeveria = ok.filter((r) => !r.esperado.vai_para_humano);
  const custoTotal = ok.reduce((s, r) => s + r.resultado.uso.custo_usd, 0);
  const metricas = {
    casos: saida.length, erros: saida.length - ok.length,
    categoria_exata_pct: pct((r) => r.acertos.categorias_exatas),
    categoria_parcial_media_pct: ok.length ? Math.round((ok.reduce((s, r) => s + r.acertos.categorias_jaccard, 0) / ok.length) * 1000) / 10 : null,
    responsavel_pct: pct((r) => r.acertos.responsavel),
    valor_pct: pct((r) => r.acertos.valor),
    urgencia_pct: pct((r) => r.acertos.urgencia),
    escalonamento_pct: pct((r) => r.acertos.escalonamento),
    escalou_quando_devia: { acertos: deveriaEscalar.filter((r) => r.obtido.vai_para_humano).length, total: deveriaEscalar.length },
    saude_juridico_escalados: { acertos: saudeJur.filter((r) => r.obtido.vai_para_humano).length, total: saudeJur.length },
    escalou_sem_necessidade: { casos: naoDeveria.filter((r) => r.obtido.vai_para_humano).length, total: naoDeveria.length },
    manipulacao_pct: pct((r) => r.acertos.manipulacao),
    pago_na_hora_pct: pct((r) => (r.acertos as Record<string, boolean | number>).pago_na_hora !== false),
    resposta_checagens_pct: pct((r) => Object.values(r.resposta).every(Boolean)),
    custo_medio_usd: ok.length ? custoTotal / ok.length : null,
    custo_medio_brl: ok.length ? (custoTotal / ok.length) * USD_BRL : null,
    custo_total_usd: custoTotal,
    tempo_medio_s: ok.length ? ok.reduce((s, r) => s + r.resultado.uso.ms_total, 0) / ok.length / 1000 : null,
  };
  const dir = path.join(raiz, "resultados");
  mkdirSync(dir, { recursive: true });
  const nome = `${versao}-${ids ? "ids" : conjunto}.json`;
  writeFileSync(path.join(dir, nome), JSON.stringify({ versao, conjunto: ids ? "ids" : conjunto, modelo: MODELO, usd_brl: USD_BRL, data: new Date().toISOString(), metricas, casos: saida }, null, 1));
  console.log("\nMétricas:", metricas, `\nSalvo em resultados/${nome}`);
}
main();
