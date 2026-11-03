// Orquestra: IA interpreta → regra decide → IA comunica. Mede custo e tempo de cada etapa.
import Anthropic from "@anthropic-ai/sdk";
import { betaZodOutputFormat } from "@anthropic-ai/sdk/helpers/beta/zod";
import { decidir, brl } from "../regras/motor";
import type { Classificacao, Decisao, Pedido } from "../regras/tipos";
import { EsquemaClassificacao, EsquemaResposta } from "./esquema";
import { SISTEMA_CLASSIFICAR, SISTEMA_RESPONDER, VERSAO_PROMPT } from "./prompts";

export const MODELO = "claude-opus-5-5";
// Preço por 1M de tokens (US$), tabela de 06/10/2026. Cache de leitura: US$ 0,20.
const PRECO = { entrada: 4, saida: 20, cacheLeitura: 0.2, cacheEscrita: 5 };
export const USD_BRL = Number(process.env.USD_BRL ?? 5.4); // conferir a cotação no dia da medição

export interface Uso { entrada: number; saida: number; cache_leitura: number; cache_escrita: number; custo_usd: number; ms: number }
export interface ResultadoTriagem {
  versao_prompt: string;
  modelo: string;
  classificacao: Classificacao;
  decisao: Decisao;
  resposta_ao_cliente: string;
  uso: { classificar: Uso; responder: Uso; custo_usd: number; custo_brl: number; ms_total: number };
}

const cliente = () => new Anthropic(); // lê ANTHROPIC_API_KEY do ambiente (.env.local / Vercel)

function medirUso(u: Anthropic.Beta.Messages.BetaUsage, ms: number): Uso {
  const entrada = u.input_tokens ?? 0, saida = u.output_tokens ?? 0;
  const cache_leitura = u.cache_read_input_tokens ?? 0, cache_escrita = u.cache_creation_input_tokens ?? 0;
  const custo_usd = (entrada * PRECO.entrada + saida * PRECO.saida + cache_leitura * PRECO.cacheLeitura + cache_escrita * PRECO.cacheEscrita) / 1e6;
  return { entrada, saida, cache_leitura, cache_escrita, custo_usd, ms };
}

class RecusaError extends Error {}

async function chamar<T>(sistema: string, conteudo: string, formato: Parameters<typeof betaZodOutputFormat>[0], esforco: "low" | "medium") {
  const t0 = Date.now();
  const r = await cliente().beta.messages.parse({
    model: MODELO,
    max_tokens: 8000,
    betas: ["server-side-fallback-2026-07-01"],
    fallbacks: "default", // se o modelo recusar por política, a API tenta o modelo recomendado
    system: [{ type: "text", text: sistema, cache_control: { type: "ephemeral" } }],
    messages: [{ role: "user", content: conteudo }],
    output_config: { effort: esforco, format: betaZodOutputFormat(formato) },
  });
  if (r.stop_reason === "refusal") throw new RecusaError("O modelo recusou a reclamação.");
  if (!r.parsed_output) throw new Error(`Saída fora do formato (stop_reason: ${r.stop_reason}).`);
  return { dados: r.parsed_output as T, uso: medirUso(r.usage, Date.now() - t0) };
}

export async function classificar(texto: string, pedido: Pedido) {
  const conteudo = `<pedido>\n${JSON.stringify(pedido, null, 1)}\n</pedido>\n\n<reclamacao>\n${texto}\n</reclamacao>`;
  return chamar<Classificacao>(SISTEMA_CLASSIFICAR, conteudo, EsquemaClassificacao, "medium");
}

/** O que a IA de resposta pode ver: só o que o cliente pode saber (sem responsável, sem valor proposto à pessoa). */
function decisaoParaCliente(d: Decisao, c: Classificacao) {
  return {
    problemas: c.categorias.map((x) => ({ categoria: x.categoria, itens: x.itens_afetados.map((i) => i.nome) })),
    vai_para_uma_pessoa: d.vai_para_humano,
    relato_diverge_dos_dados: d.gatilhos.some((g) => g.id === "H6"),
    pedir_detalhes: c.categorias.some((x) => x.categoria === "outro") || c.confianca === "baixa",
    ...(d.opcao_reenvio && !d.vai_para_humano ? { opcao_reenvio: "refazer e reenviar sem custo, se a loja conseguir" } : {}),
    // v6: o cupom de cortesia não é troca por reembolso; só o cupom de compensação é.
    cupom_e_cortesia: d.linhas.some((l) => l.tipo === "cupom" && l.regra === "R-TOTAL"),
    ...(d.vai_para_humano
      ? {
          // v1.4: o que já foi concedido na hora, mesmo com o caso indo para uma pessoa.
          ja_concedido_na_hora: {
            devolucao_em_dinheiro: d.pago_na_hora.dinheiro > 0 ? brl(d.pago_na_hora.dinheiro) : null,
            cupom: d.pago_na_hora.cupom > 0 ? `${brl(d.pago_na_hora.cupom)} (válido por ${d.cupom_validade_dias} dias)` : null,
          },
        }
      : {
          devolucao_em_dinheiro: d.dinheiro > 0 ? brl(d.dinheiro) : null,
          cupom: d.cupom > 0 ? `${brl(d.cupom)} (válido por ${d.cupom_validade_dias} dias)` : null,
          detalhes: d.linhas.filter((l) => l.tipo !== "pessoa").map((l) => l.descricao + (l.valor ? `: ${brl(l.valor)}` : "")),
        }),
  };
}

export async function responder(texto: string, decisao: Decisao, classificacao: Classificacao) {
  const conteudo = `<decisao>\n${JSON.stringify(decisaoParaCliente(decisao, classificacao), null, 1)}\n</decisao>\n\n<reclamacao>\n${texto}\n</reclamacao>`;
  return chamar<{ resposta_ao_cliente: string }>(SISTEMA_RESPONDER, conteudo, EsquemaResposta, "low");
}

export async function triar(texto: string, pedido: Pedido): Promise<ResultadoTriagem> {
  const t0 = Date.now();
  const c = await classificar(texto, pedido);
  const decisao = decidir(pedido, c.dados, texto);
  const r = await responder(texto, decisao, c.dados);
  const custo_usd = c.uso.custo_usd + r.uso.custo_usd;
  return {
    versao_prompt: VERSAO_PROMPT,
    modelo: MODELO,
    classificacao: c.dados,
    decisao,
    resposta_ao_cliente: r.dados.resposta_ao_cliente,
    uso: { classificar: c.uso, responder: r.uso, custo_usd, custo_brl: custo_usd * USD_BRL, ms_total: Date.now() - t0 },
  };
}
