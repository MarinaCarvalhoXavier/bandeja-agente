import type { Metadata } from "next";
import localFont from "next/font/local";
import { Martian_Mono } from "next/font/google";
import "./globals.css";

// Mesma identidade do portfólio. Tanker e Switzer: Fontshare (ITF Free Font License), hospedadas aqui.
const tanker = localFont({ variable: "--f-titulo", src: "../fonts/tanker-400.woff2", weight: "400" });
const switzer = localFont({
  variable: "--f-sans",
  src: [
    { path: "../fonts/switzer-400.woff2", weight: "400" },
    { path: "../fonts/switzer-500.woff2", weight: "500" },
    { path: "../fonts/switzer-600.woff2", weight: "600" },
  ],
});
const mono = Martian_Mono({ variable: "--f-mono", subsets: ["latin"], axes: ["wdth"] });
// Identidade nova (demo "Bandeja"): Rubik + IBM Plex Mono.
// Hospedadas aqui (SIL Open Font License), para o build não depender do Google Fonts.
const rubik = localFont({ variable: "--f-rubik", src: "../fonts/rubik-var-latin.woff2", weight: "400 800" });
const plex = localFont({
  variable: "--f-plex",
  src: [
    { path: "../fonts/plexmono-400.woff2", weight: "400" },
    { path: "../fonts/plexmono-500.woff2", weight: "500" },
    { path: "../fonts/plexmono-600.woff2", weight: "600" },
  ],
});

export const metadata: Metadata = {
  title: "Triagem de reclamações — protótipo",
  description: "Agente de triagem de reclamações de delivery: a IA interpreta, a regra decide o dinheiro, uma pessoa entra quando o risco é alto. Protótipo com dados fictícios, por Marina Xavier.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR">
      <body className={`${tanker.variable} ${switzer.variable} ${mono.variable} ${rubik.variable} ${plex.variable}`}>{children}</body>
    </html>
  );
}
