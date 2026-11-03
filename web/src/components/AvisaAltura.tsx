"use client";
import { useEffect } from "react";

// Quando a demo está embutida no portfólio, avisa a página de fora da altura certa do conteúdo.
export function AvisaAltura() {
  useEffect(() => {
    // Mede o próprio conteúdo (não a página): assim a janela do portfólio também ENCOLHE quando a aba é mais curta.
    const raiz = document.querySelector<HTMLElement>(".bj-embed") ?? document.body;
    const avisar = () => window.parent?.postMessage({ tipo: "bandeja-altura", altura: Math.ceil(raiz.getBoundingClientRect().height) }, "*");
    const ro = new ResizeObserver(avisar);
    ro.observe(raiz);
    avisar();
    // A página de fora manda a altura da janela dela: o celular se ajusta a ela (aqui dentro, 100vh seria o próprio iframe).
    const ouvir = (e: MessageEvent) => {
      if (e.data?.tipo === "bandeja-viewport" && typeof e.data.altura === "number")
        document.documentElement.style.setProperty("--vh-pai", `${e.data.altura}px`);
    };
    window.addEventListener("message", ouvir);
    window.parent?.postMessage({ tipo: "bandeja-pronta" }, "*");
    return () => { ro.disconnect(); window.removeEventListener("message", ouvir); };
  }, []);
  return null;
}
