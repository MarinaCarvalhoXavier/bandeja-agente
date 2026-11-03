"use client";

import { useEffect, useState } from "react";
import { aoMudar, carregarPreferencia, ligarSom, somLigado } from "@/lib/som";

// Liga e desliga os sons da demo. Dentro do portfólio (?embed=1) o botão some: quem manda é o botão de som do portfólio.
export function BotaoSom() {
  const [ligado, setLigado] = useState(false);
  useEffect(() => { const sai = aoMudar(setLigado); carregarPreferencia(); setLigado(somLigado()); return sai; }, []);
  return (
    <button type="button" className="bj-som" aria-pressed={ligado} onClick={() => ligarSom(!ligado)} title={ligado ? "Desligar sons" : "Ligar sons"}>
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M11 5 6 9H3v6h3l5 4V5z" />
        {ligado ? <><path d="M15.5 8.5a5 5 0 0 1 0 7" /><path d="M18.5 5.5a9 9 0 0 1 0 13" /></> : <><path d="m16 9 5 6" /><path d="m21 9-5 6" /></>}
      </svg>
      <span>{ligado ? "Som ligado" : "Som desligado"}</span>
    </button>
  );
}

// Dentro do portfólio: segue o botão de som de lá.
export function SomDoPai() {
  useEffect(() => {
    const ouvir = (e: MessageEvent) => { if (e.data?.tipo === "bandeja-som") ligarSom(!!e.data.ligado, false); };
    window.addEventListener("message", ouvir);
    return () => window.removeEventListener("message", ouvir);
  }, []);
  return null;
}
