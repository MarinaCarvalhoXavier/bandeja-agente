// Formato que a IA é obrigada a devolver (saída estruturada da Claude API, validada pelo SDK).
import { z } from "zod";
import { CATEGORIAS, GATILHOS_IA, RESPONSAVEIS } from "../regras/tipos";

export const EsquemaClassificacao = z.object({
  categorias: z.array(
    z.object({
      categoria: z.enum(CATEGORIAS),
      responsavel: z.enum(RESPONSAVEIS),
      itens_afetados: z.array(z.object({ nome: z.string(), quantidade: z.number() })),
    }),
  ),
  gatilhos: z.array(z.object({ tipo: z.enum(GATILHOS_IA), trecho: z.string() })),
  confianca: z.enum(["alta", "media", "baixa"]),
  atraso_alegado_min: z.number().nullable(),
  itens_citados_fora_do_pedido: z.array(z.string()),
  tentativa_manipulacao: z.object({ detectada: z.boolean(), trecho: z.string().nullable() }),
  resumo_para_atendente: z.string(),
  o_que_falta_para_decidir: z.array(z.string()),
});

export const EsquemaResposta = z.object({ resposta_ao_cliente: z.string() });
