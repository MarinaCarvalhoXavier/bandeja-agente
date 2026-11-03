import { BotaoSom } from "@/components/BotaoSom";
import Link from "next/link";
import "@/app/bandeja.css";
import { DemoBandeja } from "@/components/DemoBandeja";
import { ComoFunciona } from "@/components/ComoFunciona";
import { PainelConteudo } from "@/components/PainelConteudo";
import { Decisoes } from "@/components/Decisoes";
import { Abas } from "@/components/Abas";

export function AbasBandeja({ aba = "prototipo" }: { aba?: string }) {
  return (
    <Abas
      inicial={aba}
      abas={[
        { id: "prototipo", rotulo: "Protótipo", cor: "#ff6b2c", conteudo: <DemoBandeja /> },
        { id: "como-funciona", rotulo: "Como funciona", cor: "#b994ff", conteudo: <ComoFunciona /> },
        { id: "avaliacao", rotulo: "Avaliação", cor: "#f2c94c", conteudo: <PainelConteudo /> },
        { id: "decisoes", rotulo: "Decisões", cor: "#7fd49b", conteudo: <Decisoes /> },
      ]}
    />
  );
}

export function PaginaBandeja({ aba = "prototipo" }: { aba?: string }) {
  return (
    <div className="bj">
      <header className="bj-topo">
        <Link href="/" className="bj-logo"><i>b</i>Bandeja</Link>
        <span className="bj-selo">Protótipo · dados fictícios · não representa nenhuma empresa</span>
        <nav aria-label="Autora" className="bj-topo-nav"><BotaoSom /><a href="https://marinaxavier.vercel.app" target="_blank" rel="noreferrer">Quem fez ↗</a></nav>
      </header>
      <section className="bj-abre">
        <h1>O que acontece depois que o cliente reclama</h1>
        <p className="bj-sub">Um agente para o atendimento de delivery: a IA interpreta a reclamação, uma regra fixa decide o dinheiro e uma pessoa entra quando o risco é alto.</p>
      </section>
      <AbasBandeja aba={aba} />
    </div>
  );
}
