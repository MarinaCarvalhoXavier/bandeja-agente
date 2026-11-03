// Sons da demo, gerados no navegador (Web Audio): nada para baixar, nenhum arquivo com direito autoral.
// Começam DESLIGADOS. Liga pelo botão de som (ou, dentro do portfólio, pelo botão de som de lá).
// O navegador só toca depois de um clique na página; antes disso, tocar() não faz nada.

export type Som = "enviar" | "receber" | "cartao" | "clique";

let ctx: AudioContext | null = null;
let ligado = false;
const ouvintes = new Set<(v: boolean) => void>();

export function somLigado() { return ligado; }

export function ligarSom(v: boolean, salvar = true) {
  ligado = v;
  if (salvar) try { localStorage.setItem("bandeja-som", v ? "1" : "0"); } catch {}
  ouvintes.forEach((f) => f(v));
  if (v) tocar("clique");
}

export function carregarPreferencia() {
  try { if (localStorage.getItem("bandeja-som") === "1") ligado = true; } catch {}
  ouvintes.forEach((f) => f(ligado));
}

export function aoMudar(f: (v: boolean) => void) { ouvintes.add(f); return () => { ouvintes.delete(f); }; }

function tom(c: AudioContext, freq: number, inicio: number, dur: number, vol: number, tipo: OscillatorType = "sine", freqFim?: number) {
  const o = c.createOscillator(), g = c.createGain(), t = c.currentTime + inicio;
  o.type = tipo;
  o.frequency.setValueAtTime(freq, t);
  if (freqFim) o.frequency.exponentialRampToValueAtTime(freqFim, t + dur);
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(vol, t + 0.008);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g).connect(c.destination);
  o.start(t); o.stop(t + dur + 0.02);
}

export function tocar(nome: Som) {
  if (!ligado || typeof window === "undefined") return;
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  try {
    ctx ??= new AudioContext();
    if (ctx.state === "suspended") void ctx.resume();
    if (nome === "enviar") tom(ctx, 620, 0, 0.09, 0.05, "sine", 1240);                 // "fiu" curto subindo
    if (nome === "receber") { tom(ctx, 784, 0, 0.14, 0.045, "triangle"); tom(ctx, 1175, 0.09, 0.2, 0.04, "triangle"); } // duas notas
    if (nome === "cartao") tom(ctx, 1400, 0, 0.05, 0.018, "sine");                    // tique bem baixo
    if (nome === "clique") tom(ctx, 1000, 0, 0.035, 0.03, "sine", 700);
  } catch {}
}
