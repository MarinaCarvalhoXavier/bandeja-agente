// Testa a regra contra os 100 casos: dada a classificação CORRETA (gabarito), a regra precisa chegar
// exatamente ao valor, ao escalonamento, à urgência e ao responsável do gabarito.
// Se este teste falha, o erro é da regra, não da IA.
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { decidir, redeDeSeguranca } from "./motor";
import type { Classificacao, GatilhoIA, Pedido } from "./tipos";

const aqui = path.dirname(fileURLToPath(import.meta.url));
interface CasoArquivo {
  id: number;
  texto: string;
  pedido: Pedido;
  gabarito: {
    categorias: { categoria: Classificacao["categorias"][number]["categoria"]; responsavel: Classificacao["categorias"][number]["responsavel"]; itens: [string, number][] }[];
    responsavel: string;
    gatilhos: string[];
    urgencia: string;
    manipulacao: boolean;
    vai_para_humano: boolean;
    esperado_regra: { dinheiro: number; cupom: number; pago_dinheiro: number; pago_cupom: number };
  };
}
export const CASOS: CasoArquivo[] = JSON.parse(readFileSync(path.join(aqui, "../../../../casos/todos.json"), "utf-8"));

// Extrações que a IA faria e que o gabarito não guarda em campo próprio.
const ATRASO_ALEGADO: Record<number, number> = { 4: 120, 204: 90 };
const ITENS_FORA: Record<number, string[]> = { 74: ["Prato de picanha"], 252: ["Porção de batata"] };
const H_PARA_IA: Record<string, GatilhoIA> = { H2: "saude", H3: "juridico_exposicao", H4: "comportamento_entregador", H7: "suspeita_fraude" };

export function classificacaoDoGabarito(c: CasoArquivo): Classificacao {
  return {
    categorias: c.gabarito.categorias.map((x) => ({
      categoria: x.categoria,
      responsavel: x.responsavel,
      itens_afetados: x.itens.map(([nome, quantidade]) => ({ nome, quantidade })),
    })),
    gatilhos: c.gabarito.gatilhos.filter((h) => H_PARA_IA[h]).map((h) => ({ tipo: H_PARA_IA[h], trecho: "(gabarito)" })),
    confianca: "alta",
    atraso_alegado_min: ATRASO_ALEGADO[c.id] ?? null,
    itens_citados_fora_do_pedido: ITENS_FORA[c.id] ?? [],
    tentativa_manipulacao: { detectada: c.gabarito.manipulacao, trecho: null },
    resumo_para_atendente: "",
    o_que_falta_para_decidir: [],
  };
}

describe("regra v1 contra os 100 casos (classificação do gabarito)", () => {
  it.each(CASOS.map((c) => [c.id, c] as const))("caso %i", (_id, c) => {
    const d = decidir(c.pedido, classificacaoDoGabarito(c), c.texto);
    expect({
      dinheiro: d.dinheiro,
      cupom: d.cupom,
      vai_para_humano: d.vai_para_humano,
      gatilhos: d.gatilhos.map((g) => g.id).sort(),
      urgencia: d.urgencia,
      responsavel: d.responsavel_geral,
      pago_na_hora: d.pago_na_hora,
    }).toEqual({
      dinheiro: c.gabarito.esperado_regra.dinheiro,
      cupom: c.gabarito.esperado_regra.cupom,
      vai_para_humano: c.gabarito.vai_para_humano,
      gatilhos: [...c.gabarito.gatilhos].sort(),
      urgencia: c.gabarito.urgencia,
      responsavel: c.gabarito.responsavel,
      pago_na_hora: { dinheiro: c.gabarito.esperado_regra.pago_dinheiro, cupom: c.gabarito.esperado_regra.pago_cupom },
    });
  });
});

describe("rede de segurança (palavras-chave)", () => {
  it("pega saúde e jurídico mesmo sem a IA", () => {
    expect(redeDeSeguranca("Achei uma BARATA na salada").saude).toBe("barata");
    expect(redeDeSeguranca("vou no Procon amanhã").juridico).toBe("procon");
    expect(redeDeSeguranca("passou mal de madrugada").saude).toBe("passou mal");
  });
  it("não dispara em frases comuns", () => {
    expect(redeDeSeguranca("comentário racista sobre o meu cabelo").saude).toBeNull();
    expect(redeDeSeguranca("pizza fria e atrasada").saude).toBeNull();
    expect(redeDeSeguranca("as pizzas chegaram viradas. festa estragada").saude).toBeNull();
    expect(redeDeSeguranca("acho que o salmão tava estragado").saude).toBe("estragado");
  });
  it("pedido inteiro perdido devolve a taxa, dá cortesia e libera reenvio (caso 25)", () => {
    const c = CASOS.find((x) => x.id === 25)!;
    const d = decidir(c.pedido, classificacaoDoGabarito(c), c.texto);
    expect(d.dinheiro).toBe(42.89); // 36,90 + 5,99 de taxa
    expect(d.cupom).toBe(10);
    expect(d.opcao_reenvio).toBe(true);
  });
  it("v5 (c): incompleto com quantidade 0,5 não paga 25% (caso 80)", () => {
    const c = CASOS.find((x) => x.id === 80)!;
    const ia = classificacaoDoGabarito(c);
    ia.categorias[0].itens_afetados[0].quantidade = 0.5;
    expect(decidir(c.pedido, ia, c.texto).dinheiro).toBe(11);
  });
  it("v5 (a): problema real resolvido com zero vai para uma pessoa (caso 48)", () => {
    const c = CASOS.find((x) => x.id === 48)!;
    const ia = classificacaoDoGabarito(c);
    ia.categorias = [{ categoria: "cobranca_indevida", responsavel: "plataforma", itens_afetados: [] }];
    const d = decidir(c.pedido, ia, c.texto);
    expect(d.dinheiro).toBe(0);
    expect(d.gatilhos.map((g) => g.id)).toEqual(["H11"]);
  });
  it("v5 (b): pedido já reembolsado nunca é pago de novo automaticamente (caso 98)", () => {
    const c = CASOS.find((x) => x.id === 98)!;
    const ia = classificacaoDoGabarito(c);
    ia.categorias = [{ categoria: "nao_entregue", responsavel: "restaurante", itens_afetados: [] }];
    const d = decidir(c.pedido, ia, c.texto);
    expect(d.vai_para_humano).toBe(true);
    expect(d.gatilhos.map((g) => g.id)).toContain("H12");
  });
  it("manipulação não muda o valor", () => {
    const c = CASOS.find((x) => x.id === 49)!;
    const d = decidir(c.pedido, classificacaoDoGabarito(c), c.texto);
    expect(d.dinheiro).toBe(0);
    expect(d.cupom).toBe(10);
    expect(d.manipulacao_registrada).toBe(true);
    expect(d.vai_para_humano).toBe(false);
  });
});
