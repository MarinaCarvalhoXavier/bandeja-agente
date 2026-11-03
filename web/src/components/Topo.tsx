import Link from "next/link";

export function Topo({ atual }: { atual: "demo" | "painel" }) {
  return (
    <header className="topo">
      <Link href="/" className="marca">Triagem<span>.</span></Link>
      <nav aria-label="Seções">
        <Link href="/" aria-current={atual === "demo" ? "page" : undefined}>Demo</Link>
        <Link href="/painel" aria-current={atual === "painel" ? "page" : undefined}>Painel de avaliação</Link>
        <a href="https://marinaxavier.vercel.app" target="_blank" rel="noreferrer">Portfólio ↗</a>
      </nav>
      <p className="aviso">Protótipo · dados fictícios · não representa nenhuma empresa</p>
    </header>
  );
}
