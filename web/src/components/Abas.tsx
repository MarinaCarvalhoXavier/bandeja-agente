"use client";
import { useEffect, useState, type ReactNode } from "react";

export type Aba = { id: string; rotulo: string; cor: string; conteudo: ReactNode };

// Abas de pasta: a aberta sobe e se cola na pasta; as outras ficam pequenas e acendem no hover.
export function Abas({ abas, inicial }: { abas: Aba[]; inicial: string }) {
  const [atual, setAtual] = useState(inicial);
  useEffect(() => {
    const id = new URLSearchParams(window.location.search).get("aba");
    if (id && abas.some((a) => a.id === id)) setAtual(id);
    // Dentro do portfólio, as abas ficam do lado de fora (no visual do portfólio) e mandam a troca por mensagem.
    const ouvir = (e: MessageEvent) => {
      if (e.data?.tipo === "bandeja-aba" && abas.some((a) => a.id === e.data.id)) setAtual(e.data.id);
    };
    window.addEventListener("message", ouvir);
    return () => window.removeEventListener("message", ouvir);
  }, [abas]);
  // A aba aberta fica marcada no <html>: embutida no portfólio, só o Protótipo é claro; o resto segue o visual escuro do portfólio.
  useEffect(() => { document.documentElement.dataset.aba = atual; }, [atual]);
  function abrir(id: string) {
    setAtual(id);
    const url = new URL(window.location.href);
    if (id === abas[0].id) url.searchParams.delete("aba"); else url.searchParams.set("aba", id);
    url.searchParams.delete("ex");
    window.history.replaceState(null, "", url);
  }
  return (
    <div className="bj-pasta">
      <div className="bj-abas" role="tablist" aria-label="Seções do projeto">
        {abas.map((a) => (
          <button key={a.id} role="tab" id={`aba-${a.id}`} aria-selected={atual === a.id} aria-controls={`painel-${a.id}`}
            className="bj-aba" style={{ ["--c" as string]: a.cor }} onClick={() => abrir(a.id)}>
            <i aria-hidden />{a.rotulo}
          </button>
        ))}
      </div>
      {abas.map((a) => (
        <div key={a.id} role="tabpanel" id={`painel-${a.id}`} aria-labelledby={`aba-${a.id}`} hidden={atual !== a.id} className="bj-pasta-corpo">
          {a.conteudo}
        </div>
      ))}
    </div>
  );
}
