import type { ResultadoTriagem } from "@/lib/agente/triagem";

export const NOMES_CATEGORIA: Record<string, string> = {
  item_faltando: "Item faltando", item_incompleto: "Item incompleto", item_errado: "Item errado", item_detalhe: "Erro sem prejuízo",
  qualidade_leve: "Qualidade (dá para comer)", qualidade_inutilizada: "Comida inutilizada", qualidade_saude: "Risco à saúde",
  atraso: "Atraso", nao_entregue: "Não entregue", cobranca_indevida: "Cobrança indevida",
  comportamento_entregador: "Comportamento do entregador", outro: "Outro / não classificável",
};
const NOMES_RESP: Record<string, string> = { restaurante: "restaurante", entregador: "entregador", plataforma: "plataforma", incerto: "incerto", multiplos: "múltiplos" };
const NOMES_GATILHO_IA: Record<string, string> = { saude: "Saúde", juridico_exposicao: "Jurídico ou exposição", comportamento_entregador: "Comportamento do entregador", suspeita_fraude: "Suspeita de fraude" };
const ORIGEM: Record<string, string> = { ia: "apontado pela IA", regra: "detectado pela regra", rede_de_seguranca: "rede de segurança (palavra-chave)" };

const brl = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

export function Resultado({ r, origem }: { r: ResultadoTriagem; origem: "gravado" | "vivo" }) {
  const { classificacao: c, decisao: d } = r;
  return (
    <div className="resultado" aria-live="polite">
      <div className="origem">
        {origem === "gravado"
          ? <span className="selo gravado">● Resultado gravado de uma execução real</span>
          : <span className="selo vivo">● Ao vivo agora</span>}
        <span className="rotulo">{r.modelo} · prompt {r.versao_prompt} · regras {d.versao_regras}</span>
      </div>

      <section className="bloco ia" aria-labelledby="b-ia">
        <div className="bloco-cabeca"><h2 id="b-ia">1 · O que a IA entendeu</h2><span className="quem">IA · interpreta, não decide valor</span></div>
        <ul className="chips">
          {c.categorias.map((x, i) => (
            <li key={i} className="chip">{NOMES_CATEGORIA[x.categoria] ?? x.categoria}
              {x.itens_afetados.length > 0 && <small>{x.itens_afetados.map((it) => `${it.quantidade}× ${it.nome}`).join(", ")}</small>}
              <small>· resp. {NOMES_RESP[x.responsavel]}</small>
            </li>
          ))}
        </ul>
        <dl className="campos">
          <dt>Confiança</dt><dd>{c.confianca}</dd>
          {c.gatilhos.length > 0 && <><dt>Alertas</dt><dd>{c.gatilhos.map((g) => NOMES_GATILHO_IA[g.tipo]).join(", ")}</dd></>}
          {c.tentativa_manipulacao.detectada && <><dt>Manipulação</dt><dd>Tentativa detectada e ignorada{c.tentativa_manipulacao.trecho ? <> — <q>{c.tentativa_manipulacao.trecho}</q></> : null}</dd></>}
          <dt>Resumo</dt><dd>{c.resumo_para_atendente}</dd>
        </dl>
      </section>

      <section className="bloco regra" aria-labelledby="b-regra">
        <div className="bloco-cabeca"><h2 id="b-regra">2 · O que a regra decidiu</h2><span className="quem">Código · decide o dinheiro</span></div>
        <table className="contas">
          <tbody>
            {d.linhas.map((l, i) => (
              <tr key={i}>
                <td><span className="rid">{l.regra}</span></td>
                <td>{l.descricao}</td>
                <td className="num-tab">{l.tipo === "dinheiro" ? brl(l.valor) : l.tipo === "cupom" ? `cupom ${brl(l.valor)}` : l.tipo === "pessoa" ? "pessoa" : "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="totais">
          {d.vai_para_humano && d.pago_na_hora ? (
            <>
              <div className={`total ${d.pago_na_hora.dinheiro > 0 ? "destaque" : ""}`}><span className="rotulo">Pago na hora</span><strong className="num-tab">{brl(d.pago_na_hora.dinheiro)}</strong></div>
              <div className="total"><span className="rotulo">Cupom na hora</span><strong className="num-tab">{d.pago_na_hora.cupom ? brl(d.pago_na_hora.cupom) : "—"}</strong></div>
              <div className="total"><span className="rotulo">A pessoa decide</span><strong className="num-tab" style={{ fontSize: 22 }}>{d.fica_para_pessoa ? `${brl(d.fica_para_pessoa)} calculados + o resto` : d.pago_na_hora.dinheiro || d.pago_na_hora.cupom ? "o que for além" : "tudo"}</strong></div>
            </>
          ) : (
            <>
              <div className={`total ${d.dinheiro > 0 ? "destaque" : ""}`}><span className="rotulo">Devolução</span><strong className="num-tab">{brl(d.dinheiro)}</strong></div>
              <div className="total"><span className="rotulo">Cupom {d.cupom ? `· ${d.cupom_validade_dias} dias` : ""}</span><strong className="num-tab">{d.cupom ? brl(d.cupom) : "—"}</strong></div>
            </>
          )}
          {d.opcao_reenvio && <div className="total"><span className="rotulo">Ou, se o cliente preferir</span><strong style={{ fontSize: 22 }}>Reenvio sem custo</strong></div>}
        </div>
      </section>

      <section className="bloco pessoa" aria-labelledby="b-pessoa">
        <div className="bloco-cabeca"><h2 id="b-pessoa">3 · Quem resolve</h2><span className="quem">Urgência {d.urgencia}</span></div>
        <div className={`veredito ${d.vai_para_humano ? "humano" : "auto"}`}>
          <span className="icone" aria-hidden>{d.vai_para_humano ? "◐" : "✓"}</span>
          <span>{!d.vai_para_humano
            ? "Resolvido automaticamente: a regra concedeu e o cliente recebe na hora."
            : d.pago_na_hora && (d.pago_na_hora.dinheiro > 0 || d.pago_na_hora.cupom > 0)
              ? "O cliente já recebe o que a regra calculou. Uma pessoa, com o caso resumido, decide o resto."
              : "Vai para uma pessoa antes de qualquer pagamento: há dúvida sobre o que é devido."}</span>
        </div>
        {d.gatilhos.length > 0 && (
          <ul className="gatilhos">
            {d.gatilhos.map((g) => (
              <li key={g.id}><span className="gid">{g.id}</span><div>{g.motivo}{g.trecho && g.trecho !== "(gabarito)" && <q>{g.trecho}</q>}<div className="origem-g">{ORIGEM[g.origem]}</div></div></li>
            ))}
          </ul>
        )}
        {d.vai_para_humano && c.o_que_falta_para_decidir.length > 0 && (
          <dl className="campos"><dt>Falta para decidir</dt><dd>{c.o_que_falta_para_decidir.join(" · ")}</dd></dl>
        )}
        <dl className="campos"><dt>Quem paga (interno)</dt><dd>{NOMES_RESP[d.responsavel_geral]}</dd></dl>
      </section>

      <section className="bloco cliente" aria-labelledby="b-cliente">
        <div className="bloco-cabeca"><h2 id="b-cliente">4 · O que o cliente lê</h2><span className="quem">IA · só comunica a decisão</span></div>
        <div className="balao">{r.resposta_ao_cliente}</div>
        {d.opcao_reenvio && !d.vai_para_humano && <div className="opcoes" aria-label="Opções que o cliente vê"><span>↻ Quero o reenvio</span><span>R$ Quero a devolução</span></div>}
        <details className="crm" style={{ marginTop: 14 }}>
          <summary className="rotulo">Justificativa pronta para o CRM</summary>
          <p>{d.justificativa_crm}</p>
        </details>
      </section>

      <div className="rodape-res">
        <span className="rotulo">Custo desta triagem: US$ {r.uso.custo_usd.toFixed(4)} (~{brl(r.uso.custo_brl)})</span>
        <span className="rotulo">Tempo: {(r.uso.ms_total / 1000).toFixed(1)} s</span>
      </div>
    </div>
  );
}
