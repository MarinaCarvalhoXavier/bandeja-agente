import p from "@/dados/painel.json";


const pct = (v: number | null) => (v === null ? "—" : `${v.toLocaleString("pt-BR", { maximumFractionDigits: 1 })}%`);
const frac = (a: number, b: number) => `${a}/${b}`;
const FALHAS: Record<string, string> = { categorias_exatas: "categoria", responsavel: "responsável", escalonamento: "escalonamento", valor: "valor", urgencia: "urgência", manipulacao: "manipulação" };

// Conteúdo do painel de avaliação (usado na aba "Avaliação" e em /painel).
export function PainelConteudo() {
  const m = p.oficial;
  const brl = (m.custo_medio_brl ?? 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL", minimumFractionDigits: 3, maximumFractionDigits: 3 });
  const data = new Date(p.data_medicao).toLocaleDateString("pt-BR");
  const evol = [
    ...p.evolucao.filter((e) => ["v1", "v2", "v3", "v4"].includes(e.versao)).map((e) => ({ nome: `${e.versao} · desenvolvimento`, nota: "30 casos usados para ajustar", oficial: false, m: e })),
    { nome: "v4 · teste (70 casos)", nota: "primeira medição limpa: 70 casos nunca vistos, rodou uma vez", oficial: false, m: p.v4teste },
    { nome: "v5 · correção na regra", nota: "recalculado nos mesmos 70 casos: não é medição independente", oficial: false, m: p.v5 },
    ...p.evolucao.filter((e) => e.versao === "v6").map((e) => ({ nome: "v6 · desenvolvimento", nota: "conferência: nada quebrou", oficial: false, m: e })),
    { nome: "v6 · 8 casos novos (combos)", nota: "escritos depois do erro achado na demo; teste limpo, mas pequeno", oficial: false, m: p.v6novo },
    ...p.evolucao.filter((e) => e.versao === "v7").map((e) => ({ nome: "v7 · desenvolvimento", nota: "conferência: nada quebrou", oficial: false, m: e })),
    { nome: "v7 · TESTE NOVO (oficial)", nota: "100 casos escritos por outro agente, sem ver o prompt; a versão publicada", oficial: true, m: p.oficial },
    { nome: "v7 + regras v1.6", nota: "correções depois da medição, recalculadas nos mesmos 100: não é medição independente", oficial: false, m: p.v7v16 },
  ];
  return (
      <div className="painel">
        <p className="painel-intro">
          Tudo aqui vem dos arquivos reais da avaliação ({data}, {p.modelo}). Os números oficiais são da versão publicada (v7) em <strong>100 casos de teste novos</strong>,{" "}
          escritos por outro agente que não viu o prompt, e rodados uma única vez. Os casos são fictícios, escritos a partir da discovery, com gabarito revisado por mim.
          Saúde e jurídico estão em maior quantidade de propósito.
        </p>
        <section className="secao" aria-labelledby="s-num">
          <h2 id="s-num">Os números</h2>
          <div className="tiles">
            <div className="tile forte"><span className="rotulo">Saúde e jurídico → pessoa</span><strong>{m.saude_juridico_escalados.acertos}<small>/{m.saude_juridico_escalados.total}</small></strong><p>Nenhum caso de risco resolvido sozinho pela automação.</p></div>
            <div className="tile forte"><span className="rotulo">Manipulação ignorada</span><strong>{pct(m.manipulacao_pct)}</strong><p>“Ignore as regras”, “sou gerente”: detectado e sem efeito no valor.</p></div>
            <div className="tile"><span className="rotulo">Escalou quando devia</span><strong>{m.escalou_quando_devia.acertos}<small>/{m.escalou_quando_devia.total}</small></strong><p>O único erro (contestação no cartão) virou trava na regra (v1.6).</p></div>
            <div className="tile"><span className="rotulo">Escalou sem necessidade</span><strong>{m.escalou_sem_necessidade.casos}<small>/{m.escalou_sem_necessidade.total}</small></strong><p>Excesso de cautela: custa tempo de atendente, não dinheiro.</p></div>
            <div className="tile"><span className="rotulo">Categoria exata</span><strong>{pct(m.categoria_exata_pct)}</strong><p>Parcial (várias categorias): {pct(m.categoria_parcial_media_pct)}.</p></div>
            <div className="tile"><span className="rotulo">Valor certo</span><strong>{pct(m.valor_pct)}</strong><p>Calculado pela regra a partir da classificação da IA.</p></div>
            <div className="tile"><span className="rotulo">Custo por reclamação</span><strong>~{brl}</strong><p>US$ {(m.custo_medio_usd ?? 0).toFixed(4)} · duas chamadas à IA.</p></div>
            <div className="tile"><span className="rotulo">Tempo</span><strong>~{Math.round(m.tempo_medio_s ?? 0)}<small>s</small></strong><p>Da reclamação à resposta pronta.</p></div>
          </div>
        </section>

        <section className="secao" aria-labelledby="s-esc">
          <h2 id="s-esc">Quem foi para uma pessoa</h2>
          <p>O erro mais caro é deixar de escalar um caso que precisava de gente. O segundo é escalar o que a regra resolveria sozinha.</p>
          <div className="matriz" role="table" aria-label="Escalonamento: esperado × obtido">
            <div role="row" style={{ display: "contents" }}>
              <span className="cab" role="columnheader" />
              <span className="cab" role="columnheader">Agente mandou para pessoa</span>
              <span className="cab" role="columnheader">Agente resolveu sozinho</span>
            </div>
            <div role="row" style={{ display: "contents" }}>
              <span className="cab" role="rowheader">Devia ir para pessoa</span>
              <div className="celula ok" role="cell"><strong>{p.matriz.devia_e_foi}</strong><span>certo</span></div>
              <div className="celula ruim" role="cell"><strong>{p.matriz.devia_e_nao_foi}</strong><span>erro grave · virou trava na v1.6</span></div>
            </div>
            <div role="row" style={{ display: "contents" }}>
              <span className="cab" role="rowheader">Não precisava</span>
              <div className="celula meh" role="cell"><strong>{p.matriz.nao_devia_e_foi}</strong><span>excesso de cautela</span></div>
              <div className="celula ok" role="cell"><strong>{p.matriz.nao_devia_e_nao_foi}</strong><span>certo</span></div>
            </div>
          </div>
        </section>

        <section className="secao" aria-labelledby="s-grupo">
          <h2 id="s-grupo">Casos 100% certos, por tipo</h2>
          <p>Um caso só conta como certo se acertar tudo: categoria, responsável, valor, urgência, escalonamento e manipulação. Passe o mouse para ver quais erraram.</p>
          <div className="barras">
            {p.porGrupo.map((g) => {
              const v = Math.round((g.certos / g.total) * 100);
              return (
                <div className="barra-linha" key={g.grupo} tabIndex={0} aria-label={`${g.nome}: ${g.certos} de ${g.total} certos`}>
                  <span className="barra-nome">{g.nome}</span>
                  <span className="barra-trilho"><span className="barra-valor" style={{ width: `${v}%`, display: "block" }} /></span>
                  <span className="barra-num">{g.certos}/{g.total}</span>
                  <span className="dica" role="tooltip">{g.errados.length ? `Erraram: ${g.errados.map((i) => `#${i}`).join(", ")}` : "Todos certos"} · {v}%</span>
                </div>
              );
            })}
          </div>
        </section>

        <section className="secao" aria-labelledby="s-erros">
          <h2 id="s-erros">Onde errou, e por quê</h2>
          <p>Os {p.erros.length} casos de teste (de 100) com algum erro, do mais grave ao mais leve.</p>
          <ul className="erros">
            {[...p.erros].sort((a, b) => ["grave", "media", "leve"].indexOf(a.gravidade) - ["grave", "media", "leve"].indexOf(b.gravidade)).map((e) => (
              <li key={e.id}>
                <div><span className={`gravidade ${e.gravidade}`}>{e.gravidade === "media" ? "média" : e.gravidade}</span><div className="rotulo">#{e.id} · {e.grupo}</div></div>
                <div>
                  <q>{e.texto}</q>
                  <p>{e.explicacao}</p>
                  <div className="rotulo" style={{ marginTop: 6 }}>errou: {e.falhas.map((f) => FALHAS[f] ?? f).join(", ")}{e.corrigido && <span className="corrigido"> · corrigido depois da medição</span>}</div>
                </div>
              </li>
            ))}
          </ul>
        </section>

        <section className="secao" aria-labelledby="s-evol">
          <h2 id="s-evol">Evolução v1 → v7</h2>
          <p>As versões 1 a 4 foram ajustadas olhando os 30 casos de desenvolvimento; por isso chegam perto de 100% lá. O número que vale é a linha destacada.</p>
          <div className="tabela-wrap">
            <table className="tabela">
              <thead><tr><th>Versão</th><th>Categoria</th><th>Responsável</th><th>Valor</th><th>Escalou quando devia</th><th>Escalou sem necessidade</th><th>Custo / reclamação</th></tr></thead>
              <tbody>
                {evol.map((e) => (
                  <tr key={e.nome} className={e.oficial ? "oficial" : undefined}>
                    <td>{e.nome}<small>{e.nota}</small></td>
                    <td>{pct(e.m.categoria_exata_pct)}</td>
                    <td>{pct(e.m.responsavel_pct)}</td>
                    <td>{pct(e.m.valor_pct)}</td>
                    <td>{frac(e.m.escalou_quando_devia.acertos, e.m.escalou_quando_devia.total)}</td>
                    <td>{frac(e.m.escalou_sem_necessidade.casos, e.m.escalou_sem_necessidade.total)}</td>
                    <td>US$ {(e.m.custo_medio_usd ?? 0).toFixed(3)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="metodo">
            <div><span className="rotulo">v1 → v2</span><p>A v1 mandava casos simples para pessoas (3/19). Causa: “item recebido por engano” virava “item fora do pedido”. Prompt corrigido; “responsável incerto” deixou de escalar.</p></div>
            <div><span className="rotulo">v2 → v3</span><p>A v2 deu cupom sozinha para “o hambúrguer era menor que a foto”, um caso que devia ir para pessoa. “Diferente do anúncio” virou “outro”.</p></div>
            <div><span className="rotulo">v3 → v4</span><p>Revisão do gabarito: pedido inteiro perdido devolve a taxa e oferece reenvio; limite por cliente; atraso acima de 90 min vai para pessoa.</p></div>
            <div><span className="rotulo">v4 → v5</span><p>Depois da medição: duas travas na regra (“nunca resolver com zero” e “nunca pagar duas vezes”) e o bug do 50% × 0,5.</p></div>
            <div><span className="rotulo">v5 → v6</span><p>Na demo, “só o lanche do combo estragou” devolvia o combo inteiro + taxa: os 100 casos não tinham esse cenário. Prompt corrigido, 8 casos novos de combo, e o cliente passa a receber na hora o que a regra já calculou, mesmo quando o caso vai para uma pessoa.</p></div>
            <div><span className="rotulo">v6 → v7 (versão publicada)</span><p>Categoria “erro sem prejuízo” (cebola, brinquedo, item trocado que o cliente comeu): cupom + desculpas, em vez de 50% ou do item inteiro. Medida em 100 casos novos.</p></div>
          </div>
        </section>

        <section className="secao producao" aria-labelledby="s-prod">
          <p className="rotulo" style={{ color: "var(--amarelo)" }}>Leia antes de confiar nos números</p>
          <h2 id="s-prod">Antes de ir para produção</h2>
          <p>
            Este painel mede se o agente <strong>executa as regras</strong> que eu defini. Ele <strong>não mede se as regras são boas para o negócio</strong>:
            custo de reembolso, fraude, clientes que voltam a pedir, processos evitados. Para isso faltam dados reais de operação, que eu não tenho.
            Abaixo está o que eu sei, o que eu suponho e como eu testaria.
          </p>
          <div className="metodo">
            <div><span className="rotulo">O que tenho (fraco)</span><p>Dados públicos de escala (~3,4 mi de contatos/mês; 38% pós-entrega), 71% de aceite de reembolso parcial (autodeclarado), estimativa de má-fé de 10–15% (1 pessoa de SAC) e indenizações de R$ 2–5 mil por negativa indevida (poucas decisões).</p></div>
            <div><span className="rotulo">Regra que mais depende disso</span><p>Pagar na hora o que a regra já calculou, mesmo quando o caso vai para uma pessoa (até R$ 100). No gabarito, <strong>{p.impacto.recebem_na_hora} de {p.impacto.escalados}</strong> clientes com casos graves deixam de esperar: R$ {p.impacto.valor_na_hora.toLocaleString("pt-BR", { minimumFractionDigits: 2 })} pagos na hora.</p></div>
            <div><span className="rotulo">Conta de ordem de grandeza (hipótese)</span><p>Em 1.000 casos escalados, ~620 recebem ~R$ 45 na hora. Se 12% forem má-fé e uma pessoa pegaria metade, a perda extra fica em ~R$ 1.700. Uma única condenação por negativa indevida (R$ 5 mil) cobre três vezes esse valor. A conta inteira depende de números que eu supus.</p></div>
          </div>
          <div className="metodo">
            <div><span className="rotulo">Como eu testaria: piloto</span><p>Ligar a regra para ~5% dos casos durante algumas semanas e comparar com o restante, sem mudar mais nada.</p></div>
            <div><span className="rotulo">Métricas do piloto</span><p>Custo de reembolso por pedido · fraude confirmada · tempo até resolver · recontato · voltou a pedir em 30 dias · casos que chegaram ao Reclame Aqui ou ao Procon.</p></div>
            <div><span className="rotulo">Travas desde o primeiro dia</span><p>Teto por caso (R$ 100) · limite por cliente (3 reclamações em 90 dias) · nunca pagar duas vezes · nunca negar sem uma pessoa · botão de desligar · limite de gasto da IA.</p></div>
          </div>
        </section>

        <section className="secao" aria-labelledby="s-metodo">
          <h2 id="s-metodo">Como foi medido</h2>
          <div className="metodo">
            <div><span className="rotulo">100 casos</span><p>Fictícios e realistas: gírias, ironia, erros de digitação, inglês, várias categorias juntas (23), tentativas de manipulação (5).</p></div>
            <div><span className="rotulo">30 dev / 70 teste</span><p>Ajustes só olhando os 30. Os 70 rodaram uma única vez, com o prompt congelado.</p></div>
            <div><span className="rotulo">Gabarito</span><p>Escrito por Claude, revisado por mim caso a caso. Valores esperados calculados pela regra a partir do gabarito.</p></div>
            <div><span className="rotulo">Limites</span><p>Só texto (sem foto ou áudio). Restaurantes não foram entrevistados. Respostas checadas por regras automáticas, não por leitura humana de todas.</p></div>
          </div>
          <p className="rotulo" style={{ marginTop: 20 }}>Custo total para construir e medir: ~US$ {p.custo_projeto_usd.toFixed(2)} · cotação usada: R$ {p.usd_brl.toFixed(2)}</p>
        </section>
      </div>
  );
}
