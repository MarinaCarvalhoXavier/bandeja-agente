import "./bandeja.css";
import { AvisaAltura } from "@/components/AvisaAltura";
import { SomDoPai } from "@/components/BotaoSom";
import { PaginaBandeja, AbasBandeja } from "@/components/PaginaBandeja";

// ?embed=1: as abas sem o cabeçalho e o título (o portfólio já tem os dele), para aparecer dentro do portfólio.
// ?aba=como-funciona | avaliacao | decisoes: abre a página já naquela aba.
export default async function Pagina({ searchParams }: { searchParams: Promise<{ embed?: string; aba?: string }> }) {
  const q = await searchParams;
  if (q.embed === "1")
    return (
      <div className="bj bj-embed">
        <AbasBandeja aba={q.aba ?? "prototipo"} />
        <AvisaAltura />
        <SomDoPai />
      </div>
    );
  return <PaginaBandeja aba={q.aba ?? "prototipo"} />;
}
