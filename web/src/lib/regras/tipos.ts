// Tipos compartilhados entre a IA (classificação), a regra (decisão) e a interface.

export const CATEGORIAS = [
  "item_faltando",
  "item_incompleto",
  "item_errado",
  "item_detalhe", // v7: erro sem prejuízo (personalização, brinde, item trocado consumido sem problema)
  "qualidade_leve",
  "qualidade_inutilizada",
  "qualidade_saude",
  "atraso",
  "nao_entregue",
  "cobranca_indevida",
  "comportamento_entregador",
  "outro",
] as const;
export type Categoria = (typeof CATEGORIAS)[number];

export const RESPONSAVEIS = ["restaurante", "entregador", "plataforma", "incerto"] as const;
export type Responsavel = (typeof RESPONSAVEIS)[number];

export const GATILHOS_IA = ["saude", "juridico_exposicao", "comportamento_entregador", "suspeita_fraude"] as const;
export type GatilhoIA = (typeof GATILHOS_IA)[number];

/** Dados do pedido, vindos do sistema (nunca da reclamação). */
export interface Pedido {
  pedido_id: string;
  itens: { nome: string; valor_unit: number; qtd: number }[];
  taxa_entrega: number;
  minutos_atraso: number; // depois do prazo máximo informado
  status: "entregue" | "cancelado" | string;
  codigo_validado: boolean;
  cobrado_a_mais: number; // diferença já identificada pelo sistema de pagamentos
  ja_reembolsado?: number; // valor já devolvido neste pedido (v5)
  historico: { negativa_anterior_neste_pedido: boolean; reclamacoes_90d: number };
}

/** O que a IA devolve (1ª chamada). Ela interpreta; não decide dinheiro. */
export interface Classificacao {
  categorias: {
    categoria: Categoria;
    responsavel: Responsavel;
    itens_afetados: { nome: string; quantidade: number }[];
  }[];
  gatilhos: { tipo: GatilhoIA; trecho: string }[];
  confianca: "alta" | "media" | "baixa";
  atraso_alegado_min: number | null;
  itens_citados_fora_do_pedido: string[];
  tentativa_manipulacao: { detectada: boolean; trecho: string | null };
  resumo_para_atendente: string;
  o_que_falta_para_decidir: string[];
}

export type IdGatilho = "H1" | "H2" | "H3" | "H4" | "H5" | "H6" | "H7" | "H8" | "H9" | "H10" | "H11" | "H12";

export interface Gatilho {
  id: IdGatilho;
  motivo: string;
  trecho?: string;
  origem: "ia" | "regra" | "rede_de_seguranca";
}

/** O que a regra decide (código, determinístico). */
export interface Decisao {
  versao_regras: string;
  dinheiro: number; // devolvido pelo meio de pagamento original
  cupom: number; // compensação extra; 0 = nenhum
  cupom_validade_dias: number;
  linhas: { regra: string; descricao: string; valor: number; tipo: "dinheiro" | "cupom" | "nenhum" | "pessoa" }[];
  valor_referencia_pessoa: number; // proposta para a pessoa em casos de saúde
  opcao_reenvio: boolean; // pedido inteiro perdido: cliente pode escolher refazer e reenviar sem custo
  vai_para_humano: boolean;
  /** v1.4: o que o cliente recebe JÁ, mesmo quando o caso vai para uma pessoa (a pessoa decide só o resto). */
  pago_na_hora: { dinheiro: number; cupom: number };
  fica_para_pessoa: number; // valor calculado que ainda depende da pessoa
  fila: string; // v1.6: para qual time o caso vai (consistência nos casos sensíveis)
  gatilhos: Gatilho[];
  urgencia: "alta" | "media" | "baixa";
  responsavel_geral: Responsavel | "multiplos";
  manipulacao_registrada: boolean;
  justificativa_crm: string;
}
