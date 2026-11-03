// Parâmetros de negócio (REGRAS.md, seção 9). Mudar valores aqui, nunca no meio do código.
export const CONFIG = {
  versaoRegras: "v1.6 (03/11/2026)",
  cupomQualidadeLeve: 10,
  cupomDetalhe: 10, // v7: erro sem prejuízo
  atraso: {
    semCompensacaoAte: 15, // minutos
    faixa1Ate: 30,
    cupomFaixa1: 10,
    faixa2Ate: 60,
    cupomFaixa2: 20,
    cupomAcimaDe60: 20, // + devolve a taxa de entrega
    pessoaAcimaDe: 90, // atraso extremo: vai para uma pessoa (H10)
  },
  fatorItemIncompleto: 0.5,
  limiteHumano: 100, // R$; acima disso vai para uma pessoa
  divergenciaAtrasoMin: 30, // atraso alegado acima do registrado por mais que isso => divergência
  validadeCupomDias: 30,
  cupomCortesia: 10, // pedido inteiro perdido
  reclamacoesParaRevisao: 3, // reclamações anteriores em 90 dias a partir das quais vai para uma pessoa (H9)
} as const;
