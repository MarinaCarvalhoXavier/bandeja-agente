import dados from "@/dados/exemplos.json";
import { SISTEMA_CLASSIFICAR, SISTEMA_RESPONDER, VERSAO_PROMPT } from "@/lib/agente/prompts";
import { CONFIG } from "@/lib/regras/config";
import { MODELO } from "@/lib/agente/triagem";

const ETAPAS = [
  { cor: "#8a8178", quem: "Cliente", titulo: "A mensagem chega", entra: "texto livre (e foto, opcional)", sai: "a reclamação + os dados do pedido, vindos do sistema" },
  { cor: "#b994ff", quem: "IA", titulo: "Classifica", entra: "reclamação + pedido", sai: "categorias, itens afetados, alertas com o trecho que comprova, confiança. Não escreve valor." },
  { cor: "#ffa477", quem: "Regra", titulo: "Decide o dinheiro", entra: "a classificação + os dados do pedido", sai: "quanto devolve, cupom, reenvio, quem paga (interno), urgência" },
  { cor: "#f2c94c", quem: "Regra", titulo: "Escolhe quem resolve", entra: "12 gatilhos (H1–H12)", sai: "automático, ou uma pessoa com o caso resumido; paga na hora o que já é do cliente" },
  { cor: "#b994ff", quem: "IA", titulo: "Escreve a resposta", entra: "só a decisão (sem “quem paga”)", sai: "uma mensagem que cita o caso, não culpa ninguém e sempre tem um próximo passo" },
];

const CATEGORIAS = [
  ["Item faltando", "valor do item"],
  ["Item incompleto / parte do combo", `${CONFIG.fatorItemIncompleto * 100}% do item`],
  ["Item errado", "valor do item inteiro"],
  ["Erro sem prejuízo (personalização, brinde, trocado e consumido)", `cupom de R$ ${CONFIG.cupomDetalhe} + desculpas`],
  ["Qualidade (dá para comer)", `cupom de R$ ${CONFIG.cupomQualidadeLeve}`],
  ["Comida inutilizada", "valor do item"],
  ["Pedido inteiro perdido", `tudo + taxa + cortesia de R$ ${CONFIG.cupomCortesia}, ou reenvio`],
  ["Atraso", `até ${CONFIG.atraso.semCompensacaoAte} min: nada · até ${CONFIG.atraso.faixa1Ate}: R$ ${CONFIG.atraso.cupomFaixa1} · até ${CONFIG.atraso.faixa2Ate}: R$ ${CONFIG.atraso.cupomFaixa2} · acima: taxa + R$ ${CONFIG.atraso.cupomAcimaDe60}`],
  ["Não entregue", "total do pedido"],
  ["Cobrança indevida", "o que foi cobrado a mais"],
  ["Risco à saúde · comportamento · outro", "uma pessoa decide"],
];

const GATILHOS = [
  ["H1", `valor acima de R$ ${CONFIG.limiteHumano}`], ["H2", "risco à saúde"], ["H3", "jurídico ou exposição"], ["H4", "comportamento do entregador"],
  ["H5", "confiança baixa ou “outro”"], ["H6", "o relato não bate com os dados"], ["H7", "suspeita de fraude (nunca nega)"], ["H8", "já houve negativa neste pedido"],
  ["H9", `${CONFIG.reclamacoesParaRevisao}+ reclamações em 90 dias`], ["H10", `atraso acima de ${CONFIG.atraso.pessoaAcimaDe} min`], ["H11", "a regra calculou zero para um problema real"], ["H12", "o pedido já foi reembolsado"],
];

export function ComoFunciona() {
  const ex = dados.exemplos.find((e) => e.id === 41)!;
  const json = JSON.stringify(ex.gravado.classificacao, null, 2);
  return (
    <div className="cf">
      <section className="cf-secao">
        <p className="cf-chapeu">O caminho de uma reclamação</p>
        <h2>A IA interpreta. A regra decide o dinheiro. Uma pessoa entra quando o risco é alto.</h2>
        <ol className="cf-fluxo">
          {ETAPAS.map((e, i) => (
            <li key={i} style={{ ["--c" as string]: e.cor }}>
              <span className="cf-quem bj-mono">{String(i + 1).padStart(2, "0")} · {e.quem}</span>
              <b>{e.titulo}</b>
              <span className="cf-io"><em>entra</em>{e.entra}</span>
              <span className="cf-io"><em>sai</em>{e.sai}</span>
            </li>
          ))}
        </ol>
        <p className="cf-nota">Por que separar assim: a IA é ótima para entender texto bagunçado, mas não deve decidir dinheiro. A regra é previsível, testável e dá a mesma resposta para o mesmo caso. Enganar a IA não dá acesso ao dinheiro.</p>
      </section>

      <section className="cf-secao cf-duas">
        <div>
          <p className="cf-chapeu">O que a IA devolve</p>
          <h3>Um formulário fechado, não um texto livre</h3>
          <p className="cf-nota">A IA é obrigada a responder neste formato (validado por código). Não existe campo para valor: mesmo que alguém convença a IA, ela não tem onde escrever “R$ 500”. Exemplo real do caso “cabelo na marmita”:</p>
        </div>
        <pre className="cf-json bj-mono" tabIndex={0}>{json}</pre>
      </section>

      <section className="cf-secao cf-duas">
        <div>
          <p className="cf-chapeu">A regra (código)</p>
          <h3>Quanto devolve, por categoria</h3>
          <table className="cf-tabela">
            <tbody>{CATEGORIAS.map(([c, v]) => <tr key={c}><td>{c}</td><td>{v}</td></tr>)}</tbody>
          </table>
          <p className="cf-nota">Valores fictícios e configuráveis (inspirados em políticas públicas de apps de delivery). Testada contra os 208 gabaritos: 215 testes automáticos.</p>
        </div>
        <div>
          <p className="cf-chapeu">Quem resolve</p>
          <h3>12 gatilhos mandam para uma pessoa</h3>
          <ul className="cf-gatilhos">{GATILHOS.map(([id, t]) => <li key={id}><span className="bj-mono">{id}</span>{t}</li>)}</ul>
          <p className="cf-nota">Cada tipo vai sempre para o mesmo time: saúde → segurança alimentar · jurídico → ouvidoria · entregador → operações · contestação, histórico ou divergência → antifraude.</p>
          <p className="cf-nota">Princípio: <strong>a automação só concede; negar é sempre de uma pessoa</strong>. Quando escala, o cliente já recebe na hora o que a regra calculou (até R$ {CONFIG.limiteHumano}), salvo quando há dúvida sobre se algo é devido.</p>
        </div>
      </section>

      <section className="cf-secao">
        <p className="cf-chapeu">Os prompts, na íntegra · versão {VERSAO_PROMPT} · {MODELO}</p>
        <details className="cf-prompt"><summary>Prompt da IA que classifica</summary><pre className="bj-mono">{SISTEMA_CLASSIFICAR}</pre></details>
        <details className="cf-prompt"><summary>Prompt da IA que responde</summary><pre className="bj-mono">{SISTEMA_RESPONDER}</pre></details>
      </section>

      <section className="cf-secao cf-duas">
        <div>
          <p className="cf-chapeu">Feito com</p>
          <ul className="cf-lista">
            <li>Claude API ({MODELO}) com saída estruturada e fallback do servidor</li>
            <li>Next.js + TypeScript · regra em código puro · testes com Vitest</li>
            <li>Script de avaliação que roda os casos e salva os resultados que o painel lê</li>
            <li>Construído com Claude Code, em 3 dias</li>
          </ul>
        </div>
        <div>
          <p className="cf-chapeu">Limites (declarados)</p>
          <ul className="cf-lista">
            <li>Só lê texto: a foto vai como prova, mas não é analisada</li>
            <li>Casos fictícios; restaurantes não foram entrevistados</li>
            <li>Mede se o agente segue as regras, não se as regras são boas para o negócio (isso pede um piloto)</li>
            <li>~US$ 0,0162 (~R$ 0,087) e ~8 s por reclamação</li>
          </ul>
        </div>
      </section>
    </div>
  );
}
