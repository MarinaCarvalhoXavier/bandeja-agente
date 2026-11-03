import type { Metadata } from "next";
import { PaginaBandeja } from "@/components/PaginaBandeja";

export const metadata: Metadata = { title: "Avaliação — triagem de reclamações" };

// /painel abre a mesma página, já na aba "Avaliação".
export default function Painel() {
  return <PaginaBandeja aba="avaliacao" />;
}
