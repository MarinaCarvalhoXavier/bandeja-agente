// Triagem ao vivo (Claude API). Protegida por: limite de tamanho, limite por visitante e chave liga/desliga.
import { NextResponse } from "next/server";
import { triar } from "@/lib/agente/triagem";
import dados from "@/dados/exemplos.json";
import type { Pedido } from "@/lib/regras/tipos";

export const runtime = "nodejs";
export const maxDuration = 60;

const MAX_CARACTERES = 600;
const LIMITE = 5; // triagens
const JANELA_MS = 10 * 60 * 1000; // a cada 10 minutos
// Memória do servidor: vale por instância. A proteção de custo de verdade é o limite de gasto do workspace no console.
const usos = new Map<string, number[]>();

function pedidoPorId(id: number): Pedido | undefined {
  const p = dados.pedidos.find((x) => x.id === id) ?? dados.exemplos.find((x) => x.id === id);
  return p?.pedido as Pedido | undefined;
}

export async function POST(req: Request) {
  if (process.env.DEMO_AO_VIVO === "off" || !process.env.ANTHROPIC_API_KEY)
    return NextResponse.json({ erro: "A triagem ao vivo está desligada agora. Os exemplos gravados continuam disponíveis." }, { status: 503 });

  let corpo: { texto?: unknown; pedidoId?: unknown };
  try { corpo = await req.json(); } catch { return NextResponse.json({ erro: "Pedido inválido." }, { status: 400 }); }
  const texto = typeof corpo.texto === "string" ? corpo.texto.trim() : "";
  const pedido = typeof corpo.pedidoId === "number" ? pedidoPorId(corpo.pedidoId) : undefined;
  if (texto.length < 3) return NextResponse.json({ erro: "Escreva a reclamação." }, { status: 400 });
  if (texto.length > MAX_CARACTERES) return NextResponse.json({ erro: `Máximo de ${MAX_CARACTERES} caracteres.` }, { status: 400 });
  if (!pedido) return NextResponse.json({ erro: "Escolha um pedido." }, { status: 400 });

  const ip = (req.headers.get("x-forwarded-for") ?? "local").split(",")[0].trim();
  const agora = Date.now();
  const recentes = (usos.get(ip) ?? []).filter((t) => agora - t < JANELA_MS);
  if (recentes.length >= LIMITE) {
    const espera = Math.ceil((JANELA_MS - (agora - recentes[0])) / 60000);
    return NextResponse.json({ erro: `Limite de ${LIMITE} triagens a cada 10 minutos. Tente de novo em ~${espera} min, ou veja os exemplos gravados.` }, { status: 429 });
  }
  recentes.push(agora);
  usos.set(ip, recentes);

  try {
    const r = await triar(texto, pedido);
    return NextResponse.json(r);
  } catch (e) {
    console.error("triagem falhou", e);
    return NextResponse.json({ erro: "A IA não respondeu agora. Veja um exemplo gravado enquanto isso." }, { status: 502 });
  }
}
