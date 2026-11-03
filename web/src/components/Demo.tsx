"use client";
import { useEffect, useRef, useState } from "react";
import dados from "@/dados/exemplos.json";
import type { ResultadoTriagem } from "@/lib/agente/triagem";
import type { Pedido } from "@/lib/regras/tipos";
import { Resultado } from "./Resultado";

const MAX = 600;
const brl = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

function CartaoPedido({ p }: { p: Pedido }) {
  const total = p.itens.reduce((s, i) => s + i.valor_unit * i.qtd, 0) + p.taxa_entrega;
  return (
    <div className="caixa">
      <h2 className="rotulo">Dados do pedido · vêm do sistema, não da reclamação</h2>
      <ul className="pedido">
        {p.itens.map((i) => <li key={i.nome}><span>{i.qtd}× {i.nome}</span><span className="num-tab">{brl(i.valor_unit * i.qtd)}</span></li>)}
        <li className="meta"><span>Taxa de entrega</span><span className="num-tab">{brl(p.taxa_entrega)}</span></li>
        <li><strong>Total</strong><strong className="num-tab">{brl(total)}</strong></li>
        <li className="meta"><span>Atraso registrado</span><span>{p.minutos_atraso ? `${p.minutos_atraso} min` : "no horário"}</span></li>
        <li className="meta"><span>Status · código de entrega</span><span>{p.status} · {p.codigo_validado ? "validado" : "não validado"}</span></li>
        {p.historico.reclamacoes_90d > 0 && <li className="meta"><span>Reclamações em 90 dias</span><span>{p.historico.reclamacoes_90d}</span></li>}
      </ul>
    </div>
  );
}

export function Demo() {
  const [modo, setModo] = useState<"exemplo" | "livre">("exemplo");
  const [exId, setExId] = useState(dados.exemplos[0].id);
  const [texto, setTexto] = useState("");
  const [pedidoId, setPedidoId] = useState(dados.pedidos[0].id);
  const [res, setRes] = useState<{ r: ResultadoTriagem; origem: "gravado" | "vivo" } | null>(null);
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const alvoRes = useRef<HTMLDivElement>(null);
  // No celular o resultado fica abaixo da lista: rola até ele quando aparece.
  useEffect(() => {
    if (res && window.innerWidth < 900) alvoRes.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [res]);

  // Link direto para um exemplo já triado: /?ex=21 (usado no portfólio e em capturas de tela).
  useEffect(() => {
    const id = Number(new URLSearchParams(window.location.search).get("ex"));
    const alvo = dados.exemplos.find((e) => e.id === id);
    if (alvo) { setExId(alvo.id); setRes({ r: alvo.gravado as unknown as ResultadoTriagem, origem: "gravado" }); }
  }, []);

  const ex = dados.exemplos.find((e) => e.id === exId)!;
  const pedidoLivre = dados.pedidos.find((p) => p.id === pedidoId)!;

  async function aoVivo(t: string, pid: number) {
    setCarregando(true); setErro(null);
    try {
      const resp = await fetch("/api/triar", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ texto: t, pedidoId: pid }) });
      const json = await resp.json();
      if (!resp.ok) throw new Error(json.erro ?? "Falhou.");
      setRes({ r: json, origem: "vivo" });
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Falhou.");
    } finally { setCarregando(false); }
  }

  return (
    <div className="demo">
      <div className="coluna-entrada">
        <div className="abas" role="group" aria-label="Modo">
          <button aria-pressed={modo === "exemplo"} onClick={() => { setModo("exemplo"); setErro(null); }}>Exemplos</button>
          <button aria-pressed={modo === "livre"} onClick={() => { setModo("livre"); setErro(null); }}>Escrever a minha</button>
        </div>

        {modo === "exemplo" ? (
          <>
            <ul className="exemplos">
              {dados.exemplos.map((e) => (
                <li key={e.id}><button aria-pressed={e.id === exId} onClick={() => { setExId(e.id); setRes(null); setErro(null); }}>
                  <span className="num">#{e.id}</span><span>{e.titulo}</span>
                </button></li>
              ))}
            </ul>
            <div className="caixa"><h2 className="rotulo">Reclamação (fictícia)</h2><p className="citacao">{ex.texto}</p></div>
            <CartaoPedido p={ex.pedido as Pedido} />
            <div className="acoes">
              <button className="botao" onClick={() => { setErro(null); setRes({ r: ex.gravado as unknown as ResultadoTriagem, origem: "gravado" }); }}>Ver triagem</button>
              <button className="botao vazado" disabled={carregando} onClick={() => aoVivo(ex.texto, ex.id)}>{carregando ? "Triando…" : "Rodar ao vivo"}</button>
            </div>
            <p className="nota">“Ver triagem” mostra uma execução real gravada (sem custo). “Rodar ao vivo” chama a IA agora: o resultado pode variar um pouco.</p>
          </>
        ) : (
          <>
            <div className="caixa">
              <label htmlFor="rec" className="rotulo">Sua reclamação, do jeito que um cliente escreveria</label>
              <textarea id="rec" maxLength={MAX} value={texto} onChange={(e) => setTexto(e.target.value)} placeholder="ex.: a pizza chegou fria e faltou o guaraná, absurdo" style={{ marginTop: 8 }} />
              <div className="contador rotulo">{texto.length}/{MAX}</div>
              <label htmlFor="ped" className="rotulo" style={{ display: "block", marginTop: 10 }}>Sobre qual pedido (fictício)?</label>
              <select id="ped" value={pedidoId} onChange={(e) => setPedidoId(Number(e.target.value))} style={{ marginTop: 8 }}>
                {dados.pedidos.map((p) => <option key={p.id} value={p.id}>{p.nome}</option>)}
              </select>
            </div>
            <CartaoPedido p={pedidoLivre.pedido as Pedido} />
            <div className="acoes"><button className="botao" disabled={carregando || texto.trim().length < 3} onClick={() => aoVivo(texto, pedidoId)}>{carregando ? "Triando…" : "Triar"}</button></div>
            <p className="nota">Não escreva dados pessoais. Limite: 5 triagens a cada 10 minutos. Tente enganar a IA, se quiser: o valor sai da regra de qualquer jeito.</p>
          </>
        )}
        {erro && <p className="erro" role="alert">{erro}</p>}
      </div>

      <div ref={alvoRes} style={{ scrollMarginTop: 16 }}>
        {res ? <Resultado r={res.r} origem={res.origem} /> : (
          <div className="vazio">
            <p className="rotulo">O resultado aparece aqui, em quatro partes</p>
            <p>O que a IA entendeu · o que a regra decidiu · quem resolve · o que o cliente lê</p>
          </div>
        )}
      </div>
    </div>
  );
}
