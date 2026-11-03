// Diário de decisões: a história do projeto, contada como erro → decisão → resultado. Fonte: HISTORICO.md e REGRAS.md.
const MARCOS: { etapa: string; titulo: string; achado: string; decisao: string; resultado?: string; cor: string }[] = [
  {
    etapa: "Discovery", cor: "#8a8178", titulo: "A dor não era a triagem",
    achado: "A triagem de 1ª linha já é feita por IA nas grandes plataformas. Nas reclamações públicas e nas entrevistas, a dor era a decisão de reembolso: inconsistente, sem explicação, e respostas genéricas (citadas por 4 fontes).",
    decisao: "Reenquadrar: o agente entrega a decisão explicada e o ticket já justificado para o atendente (a tarefa que o SAC disse que tiraria da rotina).",
  },
  {
    etapa: "Pesquisa", cor: "#8a8178", titulo: "Negar é o que dá problema",
    achado: "Ação do MPGO contra negativas automáticas, TJSP somando R$ 5 mil a uma negativa de R$ 80, Procon abrindo processo por um caso de R$ 560. Cupom não pode substituir dinheiro (CDC).",
    decisao: "Princípio central: a automação só concede; toda negativa é de uma pessoa. Cupom nunca é imposto.",
  },
  {
    etapa: "Regras v1", cor: "#ffa477", titulo: "A regra quebrou antes da IA",
    achado: "Ao escrever os casos, a regra devolvia só um pagamento num pedido não entregue e cobrado duas vezes. No teste contra os gabaritos, “festa estragada” disparou o alerta de saúde.",
    decisao: "Cobrança indevida sempre volta; “estragado” só conta falando de comida.", resultado: "100/100 gabaritos",
  },
  {
    etapa: "v1 → v3", cor: "#b994ff", titulo: "O tipo de erro mudou",
    achado: "A v1 mandava casos simples para pessoas (3/19). A v2 corrigiu, mas deu cupom sozinha para “o hambúrguer era menor que a foto”, um erro mais grave.",
    decisao: "“Responsável incerto” deixou de escalar; “diferente do anúncio” virou “outro”.", resultado: "dev: escalonamento 100%",
  },
  {
    etapa: "Revisão do gabarito", cor: "#f2c94c", titulo: "A PM revisou os 100 casos",
    achado: "Pedido inteiro perdido devolvia só o item; atraso de 2 h num aniversário era decidido sozinho; quem reclama toda semana não tinha limite.",
    decisao: "Pedido perdido devolve tudo + cortesia, com opção de reenvio; atraso acima de 90 min vai para uma pessoa; 3+ reclamações em 90 dias vão para revisão (nunca negativa).",
  },
  {
    etapa: "Medição final (v4)", cor: "#ffa477", titulo: "70 casos que a IA nunca viu",
    achado: "Categoria 92,9% · saúde e jurídico 12/12 · manipulação 5/5 · escalou quando devia 28/30. Dois erros violavam o próprio princípio: um cliente pagaria duas vezes, outro ficaria sem nada e sem pessoa.",
    decisao: "Duas travas na regra (nunca pagar duas vezes; nunca resolver com zero) e o bug do 50% × 0,5.", resultado: "recalculado: 30/30",
  },
  {
    etapa: "Demo (v6)", cor: "#7fd49b", titulo: "A demo achou o que a avaliação não tinha",
    achado: "Testando a demo: “só o lanche do combo estragou” devolvia o combo inteiro + taxa. Os 100 casos não tinham esse cenário.",
    decisao: "Prompt corrigido, 8 casos novos de combo, e o cliente passa a receber na hora o que a regra já calculou, mesmo quando o caso vai para uma pessoa (26 de 42 casos graves).", resultado: "8/8 casos novos",
  },
  {
    etapa: "Medição final (v7)", cor: "#b994ff", titulo: "100 casos novos, escritos sem ver o prompt",
    achado: "Nem todo erro custa um reembolso: cebola no lanche ou brinquedo que faltou viraram categoria própria (cupom + desculpas). Medido em 100 casos novos: categoria 95% · saúde e jurídico 15/15 · manipulação 4/4 · escalou quando devia 43/44. O erro grave: “já abri contestação no cartão” foi pago na hora, e a empresa pagaria duas vezes.",
    decisao: "Contestação no cartão entrou na rede de segurança e vai para antifraude sem pagar antes. Cliente com histórico de reclamações espera uma pessoa. Cada tipo de risco tem uma fila fixa.", resultado: "recalculado: 44/44",
  },
];

export function Decisoes() {
  return (
    <div className="dz">
      <p className="dz-intro">Como o projeto foi decidido, do discovery à demo. Cada etapa: o que eu achei, o que decidi e o que aconteceu. Os números completos estão na aba Avaliação.</p>
      <ol className="dz-linha">
        {MARCOS.map((m) => (
          <li key={m.etapa} style={{ ["--c" as string]: m.cor }}>
            <span className="dz-etapa bj-mono">{m.etapa}</span>
            <h3>{m.titulo}</h3>
            <p><em>Achei</em>{m.achado}</p>
            <p><em>Decidi</em>{m.decisao}</p>
            {m.resultado && <span className="dz-resultado bj-mono">{m.resultado}</span>}
          </li>
        ))}
      </ol>
      <p className="dz-intro">Próximos passos: separar “item incompleto” em dois níveis (componente principal × detalhe), ler a foto, e um piloto com 5% dos casos para medir custo e fraude de verdade.</p>
    </div>
  );
}
