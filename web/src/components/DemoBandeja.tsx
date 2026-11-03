"use client";
import { useEffect, useRef, useState } from "react";
import dados from "@/dados/exemplos.json";
import type { ResultadoTriagem } from "@/lib/agente/triagem";
import type { Pedido } from "@/lib/regras/tipos";

const brl = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const agora = () => new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });

// Exemplos agrupados pelo caminho que cada um mostra.
const GRUPOS: { titulo: string; legenda: string; cor: string; ids: number[] }[] = [
  { titulo: "Resolve sozinho", legenda: "a regra concede na hora", cor: "#1f7a3d", ids: [21, 11, 7] },
  { titulo: "Vai para uma pessoa", legenda: "risco alto ou dúvida", cor: "#b07800", ids: [41, 44, 63, 97] },
  { titulo: "Tenta enganar a IA", legenda: "o valor sai da regra mesmo assim", cor: "#7a4cd9", ids: [49, 92] },
];
const NOMES_CATEGORIA: Record<string, string> = {
  item_faltando: "Item faltando", item_incompleto: "Item incompleto", item_errado: "Item errado", item_detalhe: "Erro sem prejuízo",
  qualidade_leve: "Qualidade (dá para comer)", qualidade_inutilizada: "Comida inutilizada", qualidade_saude: "Risco à saúde",
  atraso: "Atraso", nao_entregue: "Não entregue", cobranca_indevida: "Cobrança indevida",
  comportamento_entregador: "Comportamento do entregador", outro: "Outro",
};
const NOMES_ALERTA: Record<string, string> = { saude: "saúde", juridico_exposicao: "jurídico/exposição", comportamento_entregador: "entregador", suspeita_fraude: "suspeita de fraude" };
const ORIGEM: Record<string, string> = { ia: "apontado pela IA", regra: "detectado pela regra", rede_de_seguranca: "rede de segurança (palavra-chave)" };

type Msg =
  | { tipo: "cli"; texto: string; hora: string; lida: boolean }
  | { tipo: "bot"; texto: string; hora: string }
  | { tipo: "card"; r: ResultadoTriagem }
  | { tipo: "digitando" }
  | { tipo: "foto"; url: string; hora: string };

const SAUDACAO: Msg = { tipo: "bot", texto: "Oi! Aqui é a ajuda da Bandeja. Conta pra gente o que aconteceu com o seu pedido.", hora: "19:40" };

function Status() {
  return (
    <svg width="66" height="12" viewBox="0 0 66 12" aria-hidden="true">
      <rect x="0" y="7" width="3" height="5" rx="1" fill="#1d1a17" /><rect x="5" y="5" width="3" height="7" rx="1" fill="#1d1a17" />
      <rect x="10" y="3" width="3" height="9" rx="1" fill="#1d1a17" /><rect x="15" y="0" width="3" height="12" rx="1" fill="#1d1a17" />
      <path d="M27 4a10 10 0 0 1 14 0l-1.6 1.6a7.7 7.7 0 0 0-10.8 0zM30.2 7.2a5.4 5.4 0 0 1 7.6 0L34 11z" fill="#1d1a17" />
      <rect x="44" y="1" width="19" height="10" rx="3" fill="none" stroke="#1d1a17" opacity=".5" /><rect x="46" y="3" width="13" height="6" rx="1.5" fill="#1d1a17" />
    </svg>
  );
}

export function DemoBandeja() {
  const [msgs, setMsgs] = useState<Msg[]>([SAUDACAO]);
  const [selecionado, setSelecionado] = useState<number | null>(null);
  const [pedidoLivre, setPedidoLivre] = useState(dados.pedidos[0].id);
  const [texto, setTexto] = useState("");
  const [res, setRes] = useState<{ r: ResultadoTriagem; origem: "gravado" | "vivo" } | null>(null);
  const [cartoes, setCartoes] = useState(0); // quantos blocos dos bastidores já acenderam (0-3)
  const [esperandoIA, setEsperandoIA] = useState(false);
  const [rodando, setRodando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [etapaRapida, setEtapaRapida] = useState(0); // 0: primeiras sugestões · 1: depois de responder · 2: encerrado
  const [ocupado, setOcupado] = useState(false); // a Bandeja está respondendo uma resposta rápida
  const [listaAberta, setListaAberta] = useState(true); // a lista encolhe quando a conversa começa
  const [fotosPendentes, setFotosPendentes] = useState<string[]>([]); // anexadas antes de enviar o texto
  const [fotosNaConversa, setFotosNaConversa] = useState(0);
  const inputFoto = useRef<HTMLInputElement>(null);
  const palco = useRef<HTMLElement>(null);
  // Pílulas numa linha só: arrastar com o mouse rola para o lado (no toque, o deslizar já é nativo).
  const trilhoRapidas = useRef<HTMLDivElement>(null);
  const arraste = useRef({ ativo: false, x: 0, scroll: 0, moveu: false });
  const bastidores = useRef<HTMLDivElement>(null);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const conversa = useRef<HTMLDivElement>(null);

  const limpar = () => { timers.current.forEach(clearTimeout); timers.current = []; };
  const depois = (ms: number, f: () => void) => { timers.current.push(setTimeout(f, ms)); };
  useEffect(() => limpar, []);
  useEffect(() => {
    const el = conversa.current; if (!el) return;
    // Modo foto: mostra a conversa a partir da mensagem do cliente (não do fim).
    if (document.documentElement.classList.contains("bj-foto-modo")) {
      const cli = el.querySelector<HTMLElement>(".bj-cli");
      if (cli) el.scrollTop = cli.offsetTop - el.offsetTop - 12;
      return;
    }
    el.scrollTo({ top: el.scrollHeight });
    const t = setTimeout(() => el.scrollTo({ top: el.scrollHeight }), 320); // depois da animação de entrada
    return () => clearTimeout(t);
  }, [msgs]);
  // Link direto: /?ex=41 já envia aquela reclamação (usado no portfólio e em capturas de tela).
  useEffect(() => {
    const q = new URLSearchParams(window.location.search);
    const id = Number(q.get("ex"));
    if (!dados.exemplos.some((e) => e.id === id)) return;
    // ?ex=41&foto=1: estado final na hora, sem animação (para capturas de tela).
    if (q.get("foto") === "1") {
      const e = dados.exemplos.find((x) => x.id === id)!;
      const r = e.gravado as unknown as ResultadoTriagem;
      document.documentElement.classList.add("bj-foto-modo");
      setSelecionado(id); setListaAberta(false); setRes({ r, origem: "gravado" }); setCartoes(3);
      setMsgs([SAUDACAO, { tipo: "cli", texto: e.texto, hora: "19:42", lida: true }, { tipo: "bot", texto: r.resposta_ao_cliente, hora: "19:42" }, { tipo: "card", r }]);
      return;
    }
    escolherExemplo(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const exemplo = dados.exemplos.find((e) => e.id === selecionado);
  const pedidoAtual: Pedido = (exemplo?.pedido ?? dados.pedidos.find((p) => p.id === pedidoLivre)!.pedido) as Pedido;

  // Revela os bastidores um cartão por vez e, no fim, a resposta no chat.
  function revelar(r: ResultadoTriagem, origem: "gravado" | "vivo", inicio = 0) {
    setRes({ r, origem });
    setEsperandoIA(false);
    depois(inicio, () => setCartoes(1));
    depois(inicio + 1100, () => setCartoes(2));
    depois(inicio + 2200, () => setCartoes(3));
    depois(inicio + 3000, () => {
      setMsgs((m) => [...m.filter((x) => x.tipo !== "digitando"), { tipo: "bot", texto: r.resposta_ao_cliente, hora: agora() }, { tipo: "card", r }]);
      setRodando(false);
    });
  }

  function enviar(textoCliente: string, comFotos = false) {
    limpar();
    setErro(null); setRes(null); setCartoes(0); setRodando(true); setEtapaRapida(0); setListaAberta(false);
    // Traz o palco inteiro para a tela (fora do portfólio; dentro do iframe quem rola é a página de fora).
    const el = palco.current;
    if (el && window.self === window.top) { const t = el.getBoundingClientRect(); if (t.top < 0 || t.bottom > window.innerHeight) el.scrollIntoView({ behavior: "smooth", block: "start" }); }
    // Dentro do portfólio: pede para a página de fora rolar até o palco (no celular a lista some e o palco sobe).
    else if (el && window.innerWidth <= 1040) requestAnimationFrame(() => window.parent?.postMessage({ tipo: "bandeja-rolar", topo: Math.round(el.getBoundingClientRect().top + window.scrollY) }, "*"));
    const fotos: Msg[] = comFotos ? fotosPendentes.map((url) => ({ tipo: "foto", url, hora: agora() })) : [];
    setFotosNaConversa(fotos.length); setFotosPendentes([]);
    setMsgs([SAUDACAO, ...fotos, { tipo: "cli", texto: textoCliente, hora: agora(), lida: false }]);
    depois(450, () => setMsgs((m) => m.map((x) => (x.tipo === "cli" ? { ...x, lida: true } : x))));
    depois(700, () => setMsgs((m) => [...m, { tipo: "digitando" }]));
  }

  function escolherExemplo(id: number) {
    const e = dados.exemplos.find((x) => x.id === id)!;
    setSelecionado(id);
    enviar(e.texto);
    revelar(e.gravado as unknown as ResultadoTriagem, "gravado", 1300);
  }

  async function aoVivo(textoCliente: string, pedidoId: number, comFotos = false) {
    enviar(textoCliente, comFotos);
    setEsperandoIA(true);
    try {
      const resp = await fetch("/api/triar", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ texto: textoCliente, pedidoId }) });
      const json = await resp.json();
      if (!resp.ok) throw new Error(json.erro ?? "Falhou.");
      revelar(json, "vivo", 200);
    } catch (e) {
      setEsperandoIA(false); setRodando(false);
      setMsgs((m) => m.filter((x) => x.tipo !== "digitando"));
      setErro(e instanceof Error ? e.message : "Falhou.");
    }
  }

  // Foto: aparece no chat na hora; vai junto quando o texto for enviado. A v1 não analisa imagens.
  function anexarFoto(arquivo: File | undefined) {
    if (!arquivo || rodando) return;
    const url = URL.createObjectURL(arquivo);
    if (res || selecionado) { limpar(); setRes(null); setCartoes(0); setSelecionado(null); setMsgs([SAUDACAO]); }
    setFotosPendentes((f) => [...f, url]);
    setMsgs((m) => [...m, { tipo: "foto", url, hora: agora() }]);
  }

  // Respostas rápidas: o que o cliente provavelmente diria a seguir, conforme a decisão. Toque = mensagem enviada.
  // As respostas da Bandeja a essas pílulas são roteirizadas (não chamam a IA) e seguem as mesmas regras.
  type Rapida = { rotulo: string; cliente?: string; bot: string; foto?: boolean; encerra?: boolean };
  function sugestoes(rr: ResultadoTriagem, etapa: number): Rapida[] {
    const d = rr.decisao, c = rr.classificacao;
    const obrigado: Rapida = { rotulo: "Ok, obrigado", cliente: "Ok, obrigado!", bot: "Nós que agradecemos! Se precisar de algo mais, é só chamar por aqui.", encerra: true };
    const pessoa: Rapida = { rotulo: "Falar com uma pessoa", cliente: "Quero falar com uma pessoa", bot: d.vai_para_humano ? "O seu caso já está com uma pessoa da equipe. Assim que ela analisar, você recebe a resposta aqui no app." : "Claro. Encaminhamos a conversa para uma pessoa da equipe, e você recebe a resposta aqui no app." };
    const foto: Rapida = { rotulo: "Enviar foto", foto: true, bot: "Foto recebida! Ela vai junto para quem estiver analisando o seu caso." };
    if (etapa >= 2) return [];
    if (etapa === 1) return [obrigado, ...(d.vai_para_humano ? [] : [pessoa])];
    if (d.opcao_reenvio && !d.vai_para_humano)
      return [
        { rotulo: "Refazer o pedido", cliente: "Quero que refaçam o pedido", bot: "Combinado! A loja vai refazer o seu pedido sem custo, e avisamos quando sair para entrega. O cupom de cortesia continua na sua conta." },
        { rotulo: "Dinheiro de volta", cliente: "Prefiro o dinheiro de volta", bot: `Pronto! ${brl(d.dinheiro)} voltam pelo seu meio de pagamento original. O cupom de cortesia continua na sua conta.` },
        pessoa,
      ];
    if (c.categorias.some((x) => x.categoria === "outro") || c.confianca === "baixa")
      return [
        { rotulo: "Veio um item diferente", cliente: "Veio um item diferente do que eu pedi", bot: "Agradecemos a explicação! Anotamos aqui e uma pessoa da equipe vai analisar com esse detalhe." },
        { rotulo: "A comida estava ruim", cliente: "A comida estava ruim", bot: "Sentimos muito. Anotamos aqui e uma pessoa da equipe vai analisar com esse detalhe." },
        foto,
      ];
    if (d.vai_para_humano)
      return [
        ...(c.o_que_falta_para_decidir.some((x) => /foto/i.test(x)) ? [foto] : []),
        { rotulo: "Quando terei resposta?", cliente: "Quando vou ter uma resposta?", bot: "Uma pessoa da equipe vai analisar e você recebe a resposta aqui no app. Não conseguimos prometer um horário exato" + (d.urgencia === "alta" ? ", mas casos como o seu têm prioridade." : ".") },
        obrigado,
      ];
    if (d.cupom > 0 && d.dinheiro === 0)
      return [
        { rotulo: "Prefiro reembolso", cliente: "Prefiro reembolso em vez do cupom", bot: "Tudo bem! Encaminhamos o seu pedido de reembolso para uma pessoa da equipe analisar. O cupom continua válido enquanto isso." },
        obrigado,
      ];
    if (d.dinheiro > 0)
      return [
        { rotulo: "Quando o dinheiro cai?", cliente: "Quando o dinheiro cai?", bot: "Volta pelo meio de pagamento original: no Pix, no mesmo dia; no cartão de crédito, em até 2 faturas." },
        obrigado,
      ];
    return [obrigado, pessoa];
  }

  function responderRapida(q: Rapida) {
    if (q.foto) { inputFoto.current?.click(); return; }
    setOcupado(true);
    setMsgs((m) => [...m, { tipo: "cli", texto: q.cliente ?? q.rotulo, hora: agora(), lida: true }]);
    depois(450, () => setMsgs((m) => [...m, { tipo: "digitando" }]));
    depois(1300, () => {
      setMsgs((m) => [...m.filter((x) => x.tipo !== "digitando"), { tipo: "bot", texto: q.bot, hora: agora() }]);
      setEtapaRapida((e) => (q.encerra ? 2 : e + 1)); setOcupado(false);
    });
  }

  // Foto enviada depois da resposta (pela pílula "Enviar foto"): a Bandeja confirma o recebimento.
  function fotoDepoisDaResposta(arquivo: File | undefined) {
    if (!arquivo) return;
    const url = URL.createObjectURL(arquivo);
    setOcupado(true);
    setMsgs((m) => [...m, { tipo: "foto", url, hora: agora() }]);
    depois(450, () => setMsgs((m) => [...m, { tipo: "digitando" }]));
    depois(1300, () => {
      setMsgs((m) => [...m.filter((x) => x.tipo !== "digitando"), { tipo: "bot", texto: "Foto recebida! Ela vai junto para quem estiver analisando o seu caso.", hora: agora() }]);
      setEtapaRapida((e) => e + 1); setOcupado(false);
    });
  }

  // Cada cartão novo dos bastidores rola para dentro da vista (o painel tem a altura do celular).
  useEffect(() => {
    const el = bastidores.current?.querySelector<HTMLElement>(".bj-blocos"); if (!el || cartoes === 0) return;
    const t = setTimeout(() => el.scrollTo({ top: el.scrollHeight, behavior: "smooth" }), 80);
    return () => clearTimeout(t);
  }, [cartoes]);

  const ultimoCard = [...msgs].reverse().find((m) => m.tipo === "card") as Extract<Msg, { tipo: "card" }> | undefined;
  const rapidas = !rodando && !ocupado && ultimoCard ? sugestoes(ultimoCard.r, etapaRapida) : [];

  const r = res?.r;
  const d = r?.decisao;
  const c = r?.classificacao;
  const titulo = !res && !rodando ? "Enquanto a Bandeja digita…" : rodando ? "Enquanto a Bandeja digita…" : `O que aconteceu em ${((r?.uso.ms_total ?? 0) / 1000).toFixed(1).replace(".", ",")} s`;

  return (
    <section ref={palco} className={`bj-palco ${listaAberta ? "lista-aberta" : "lista-fechada"}`} aria-label="Demonstração">
      {/* 1. Opções ao lado do celular: encolhem para um trilho quando a conversa começa */}
      <div className="bj-opcoes">
       <div className="bj-opcoes-cheio" aria-hidden={!listaAberta}>
        <div className="bj-opcoes-cab">
          <h2>Escolha uma reclamação</h2>
          {(res || rodando) && <button className="bj-recolher" onClick={() => setListaAberta(false)} aria-label="Recolher a lista">‹</button>}
        </div>
        {GRUPOS.map((g) => (
          <div key={g.titulo} className="bj-grupo" style={{ ["--g" as string]: g.cor }}>
            <p className="bj-grupo-tit"><b>{g.titulo}</b><span>{g.legenda}</span></p>
            <ul className="bj-lista">
              {g.ids.map((id) => {
                const e = dados.exemplos.find((x) => x.id === id)!;
                return (
                  <li key={id}>
                    <button aria-pressed={selecionado === id} disabled={rodando} onClick={() => escolherExemplo(id)}>
                      <span className="tit">{e.titulo}</span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
        <div className="bj-ou">
          <label htmlFor="ped">Ou escreva a sua no celular, sobre este pedido:</label>
          <select id="ped" value={pedidoLivre} onChange={(e) => { setPedidoLivre(Number(e.target.value)); setSelecionado(null); }}>
            {dados.pedidos.map((p) => <option key={p.id} value={p.id}>{p.nome}</option>)}
          </select>
        </div>
        <p className="bj-dica">Os exemplos mostram uma execução real gravada. A sua mensagem (ou “testar com a IA agora”) chama a IA de verdade: ~8 s. Pode tentar enganá-la. As respostas às pílulas do chat são roteirizadas.</p>
       </div>
       <button className="bj-trilho" onClick={() => setListaAberta(true)} aria-label="Escolher outra reclamação" tabIndex={listaAberta ? -1 : 0}>
         <svg width="20" height="20" viewBox="0 0 20 20" aria-hidden="true"><path d="M4 5h12M4 10h12M4 15h8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>
         <span>Escolher outra reclamação</span>
       </button>
      </div>

      {/* 2. O celular */}
      <div className="bj-cel">
        <div className="bj-ilha" aria-hidden />
        <div className="bj-tela">
          <div className="bj-status"><span>9:41</span><Status /></div>
          <div className="bj-app">
            <span className="voltar" aria-hidden>‹</span><span className="bj-avatar" aria-hidden>b</span>
            <div><b>Ajuda Bandeja</b><small>{pedidoAtual.pedido_id.replace("PED-", "Pedido #")} · {pedidoAtual.itens.map((i) => i.nome).join(", ")}</small></div>
          </div>
          <div className="bj-conversa" ref={conversa} aria-live="polite">
            <span className="bj-data">Hoje</span>
            {msgs.map((m, i) => {
              if (m.tipo === "cli") return <div key={i} className="bj-b bj-cli">{m.texto}<span className="hora">{m.hora} {m.lida ? "✓✓" : "✓"}</span></div>;
              if (m.tipo === "bot") return <div key={i} className="bj-b bj-bot"><span className="quem">Bandeja</span>{m.texto}<span className="hora">{m.hora}</span></div>;
              if (m.tipo === "foto") return (
                <div key={i} className="bj-b bj-cli bj-foto">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={m.url} alt="Foto anexada pelo cliente" /><span className="hora">{m.hora} ✓✓</span>
                </div>
              );
              if (m.tipo === "digitando") return <div key={i} className="bj-digitando" aria-label="Bandeja está digitando"><i /><i /><i /></div>;
              const dd = m.r.decisao;
              const pago = dd.vai_para_humano ? dd.pago_na_hora : { dinheiro: dd.dinheiro, cupom: dd.cupom };
              return (
                <div key={i} className="bj-card">
                  {(pago.dinheiro > 0 || pago.cupom > 0) && !(dd.opcao_reenvio && !dd.vai_para_humano) && (
                    <div className="topo-card"><span className="ok">✓</span><div><b>{pago.dinheiro > 0 ? `${brl(pago.dinheiro)} devolvidos` : `Cupom de ${brl(pago.cupom)}`}</b><br />
                      <span style={{ color: "var(--suave)" }}>{pago.dinheiro > 0 ? "no meio de pagamento original" : `válido por ${dd.cupom_validade_dias} dias`}{pago.dinheiro > 0 && pago.cupom > 0 ? ` · + cupom ${brl(pago.cupom)}` : ""}</span></div></div>
                  )}
                  {dd.opcao_reenvio && !dd.vai_para_humano && (
                    <>
                      <div className="topo-card"><div><b>Duas formas de resolver</b><br /><span style={{ color: "var(--suave)" }}>refazer sem custo ou {brl(dd.dinheiro)} de volta</span></div></div>
                      <div className="linha2">+ cupom de cortesia de {brl(dd.cupom)} nos dois casos</div>
                    </>
                  )}
                  {dd.vai_para_humano && <div className="linha2"><span className="bj-pulso" />Uma pessoa está analisando</div>}
                  {!dd.vai_para_humano && pago.dinheiro === 0 && pago.cupom === 0 && <div className="linha2">Conversa encerrada</div>}
                </div>
              );
            })}
          </div>
          <div className="bj-tela-rodape">
            {rapidas.length > 0 && (
              <div
                className="bj-rapidas" role="group" aria-label="Respostas rápidas" key={`${etapaRapida}-${msgs.length}`} ref={trilhoRapidas}
                onPointerDown={(e) => { if (e.pointerType !== "mouse") return; const el = trilhoRapidas.current!; arraste.current = { ativo: true, x: e.clientX, scroll: el.scrollLeft, moveu: false }; }}
                onPointerMove={(e) => { const a = arraste.current; if (!a.ativo) return; const dx = e.clientX - a.x; if (Math.abs(dx) > 4) a.moveu = true; trilhoRapidas.current!.scrollLeft = a.scroll - dx; }}
                onPointerUp={() => { arraste.current.ativo = false; }}
                onPointerLeave={() => { arraste.current.ativo = false; }}
              >
                {rapidas.map((q) => (
                  <button key={q.rotulo} onClick={(e) => { if (arraste.current.moveu) { e.preventDefault(); arraste.current.moveu = false; return; } responderRapida(q); }}>{q.rotulo}</button>
                ))}
              </div>
            )}
            <form className="bj-digitar" onSubmit={(e) => { e.preventDefault(); const t = texto.trim(); if (t.length < 3 || rodando) return; setSelecionado(null); setTexto(""); aoVivo(t, pedidoLivre, true); }}>
              <button type="button" className="bj-anexo" aria-label="Anexar foto" disabled={rodando} onClick={() => inputFoto.current?.click()}>
                <svg width="22" height="22" viewBox="0 0 24 24" aria-hidden="true"><path d="M4 8.5A2.5 2.5 0 0 1 6.5 6h1.6l1.2-1.7c.3-.5.8-.8 1.4-.8h2.6c.6 0 1.1.3 1.4.8L15.9 6h1.6A2.5 2.5 0 0 1 20 8.5v8a2.5 2.5 0 0 1-2.5 2.5h-11A2.5 2.5 0 0 1 4 16.5z" fill="none" stroke="currentColor" strokeWidth="1.8" /><circle cx="12" cy="12.3" r="3.3" fill="none" stroke="currentColor" strokeWidth="1.8" /></svg>
              </button>
              <input ref={inputFoto} type="file" accept="image/*" hidden onChange={(e) => { const f = e.target.files?.[0]; if (ultimoCard && !rodando) fotoDepoisDaResposta(f); else anexarFoto(f); e.target.value = ""; }} />
              <input aria-label="Escreva sua reclamação" placeholder="Escreva aqui…" value={texto} maxLength={600} onChange={(e) => setTexto(e.target.value)} disabled={rodando} />
              <button className="bj-enviar" aria-label="Enviar" disabled={rodando || texto.trim().length < 3}>↑</button>
            </form>
            <div className="bj-home" aria-hidden />
          </div>
        </div>
      </div>

      {/* Convite: ocupa o lado direito enquanto a lista está aberta; some quando os bastidores entram */}
      <div className="bj-convite" aria-hidden={!listaAberta}>
        <p className="bj-convite-tit">Toda resposta tem um bastidor.</p>
        <p className="bj-convite-sub">{res ? "Escolha outra reclamação e veja um caminho diferente." : "Escolha uma reclamação e veja, passo a passo, o que a IA entendeu, o que a regra decidiu e quando uma pessoa entra."}</p>
        <ul className="bj-convite-passos">
          <li style={{ ["--c" as string]: "#9b6cf0" }}>A IA interpreta</li>
          <li style={{ ["--c" as string]: "#ff6b2c" }}>A regra decide o dinheiro</li>
          <li style={{ ["--c" as string]: "#e0a100" }}>Uma pessoa entra quando o risco é alto</li>
        </ul>
      </div>

      {/* 3. Os bastidores: entram deslizando quando a lista encolhe */}
      <div className="bj-bast-wrap">
      <div className="bj-bastidores" aria-live="polite" ref={bastidores}>
        <div className="bj-bast-cab">
          <h2>{titulo}</h2>
          {res && cartoes >= 3 && !rodando && <span className="meta bj-mono">US$ {r!.uso.custo_usd.toFixed(4)} · {r!.modelo} · prompt {r!.versao_prompt} · regras {d!.versao_regras.split(" ")[0]}</span>}
        </div>

        {!rodando && !res && (
          <div className="bj-vazio">
            Escolha uma reclamação ao lado do celular (ou escreva a sua). Enquanto a Bandeja digita a resposta, aqui aparece o que acontece por trás, uma etapa por vez:
            <ol><li>o que a IA entendeu</li><li>o que a regra decidiu (o dinheiro)</li><li>quem resolve: a automação ou uma pessoa</li></ol>
          </div>
        )}

        <div className="bj-blocos">
          {rodando && cartoes === 0 && <p className="bj-esperando"><span className="bj-girando" />{esperandoIA ? "A IA está lendo a reclamação…" : "Lendo a reclamação…"}</p>}

          {r && c && d && cartoes >= 1 && (
            <article className="bj-etapa ia">
              <header className="bj-etapa-cab">
                <span className="bj-etapa-n bj-mono">01</span>
                <div><p className="bj-etapa-quem bj-mono">IA · {(r.uso.classificar.ms / 1000).toFixed(1).replace(".", ",")} s</p><h3>O que a IA entendeu</h3></div>
              </header>
              <dl className="bj-dados">
                {c.categorias.map((x, i) => (
                  <div key={i}><dt>{i === 0 ? "Problema" : "E também"}</dt><dd>{NOMES_CATEGORIA[x.categoria] ?? x.categoria}{x.itens_afetados.length > 0 && <span className="sub"> · {x.itens_afetados.map((it) => it.nome).join(", ")}</span>}</dd></div>
                ))}
                <div><dt>Confiança</dt><dd>{c.confianca}</dd></div>
                {c.gatilhos.map((g, i) => <div key={`g${i}`}><dt>Alerta</dt><dd>{NOMES_ALERTA[g.tipo]}<q>{g.trecho}</q></dd></div>)}
                {c.tentativa_manipulacao.detectada && <div><dt>Manipulação</dt><dd>detectada e ignorada{c.tentativa_manipulacao.trecho ? <q>{c.tentativa_manipulacao.trecho}</q> : null}</dd></div>}
                {fotosNaConversa > 0 && <div><dt>Foto</dt><dd>{fotosNaConversa === 1 ? "1 anexada" : `${fotosNaConversa} anexadas`}; vai como prova, esta versão não analisa imagens</dd></div>}
                <div><dt>Resumo</dt><dd className="resumo">{c.resumo_para_atendente}</dd></div>
              </dl>
            </article>
          )}
          {r && c && d && cartoes === 1 && <p className="bj-esperando"><span className="bj-girando" />A regra está calculando…</p>}

          {r && d && cartoes >= 2 && (
            <article className="bj-etapa regra">
              <header className="bj-etapa-cab">
                <span className="bj-etapa-n bj-mono">02</span>
                <div><p className="bj-etapa-quem bj-mono">Regra em código · {d.versao_regras.split(" ")[0]}</p><h3>O que a regra decidiu</h3></div>
              </header>
              <div className="bj-recibo bj-mono">
                {d.linhas.map((l, i) => (
                  <div key={i} className="lin"><span className="r">{l.regra}</span><span className="dsc">{l.descricao}</span>
                    <span className="v">{l.tipo === "dinheiro" ? brl(l.valor) : l.tipo === "cupom" ? `cupom ${brl(l.valor)}` : l.tipo === "pessoa" ? "pessoa" : "—"}</span></div>
                ))}
              </div>
              <div className="bj-resultado">
                {d.vai_para_humano ? (
                  <>
                    <div className="principal"><small>Pago na hora</small><strong>{brl(d.pago_na_hora.dinheiro)}</strong></div>
                    <div><small>Cupom</small><b>{d.pago_na_hora.cupom ? brl(d.pago_na_hora.cupom) : "—"}</b></div>
                    <div><small>Fica com a pessoa</small><b>{d.pago_na_hora.dinheiro || d.pago_na_hora.cupom ? (d.fica_para_pessoa ? `+ ${brl(d.fica_para_pessoa)}` : "o que for além") : "a decisão toda"}</b></div>
                  </>
                ) : (
                  <>
                    <div className="principal"><small>Devolução</small><strong>{brl(d.dinheiro)}</strong></div>
                    <div><small>{d.opcao_reenvio ? "Cortesia" : "Cupom"}</small><b>{d.cupom ? brl(d.cupom) : "—"}</b></div>
                    <div><small>Ou</small><b>{d.opcao_reenvio ? "reenvio sem custo" : "—"}</b></div>
                  </>
                )}
              </div>
              <p className="bj-rodape-etapa bj-mono">Dados do pedido, não da mensagem: total {brl(pedidoAtual.itens.reduce((s, i) => s + i.valor_unit * i.qtd, 0) + pedidoAtual.taxa_entrega)} · atraso {pedidoAtual.minutos_atraso ? `${pedidoAtual.minutos_atraso} min` : "nenhum"} · código {pedidoAtual.codigo_validado ? "validado" : "não validado"}</p>
            </article>
          )}
          {r && d && cartoes === 2 && <p className="bj-esperando"><span className="bj-girando" />Decidindo quem resolve…</p>}

          {r && c && d && cartoes >= 3 && (
            <article className={`bj-etapa ${d.vai_para_humano ? "pessoa" : "auto"}`}>
              <header className="bj-etapa-cab">
                <span className="bj-etapa-n bj-mono">03</span>
                <div><p className="bj-etapa-quem bj-mono">Urgência {d.urgencia === "media" ? "média" : d.urgencia}</p><h3>{d.vai_para_humano ? "Vai para uma pessoa" : "Resolvido sozinho"}</h3></div>
                {d.vai_para_humano && d.fila && <span className="bj-fila-tag">{d.fila}</span>}
              </header>
              {d.vai_para_humano ? (
                <dl className="bj-dados">
                  {d.gatilhos.map((g) => <div key={g.id}><dt className="bj-mono">{g.id}</dt><dd>{g.motivo}{g.trecho && <q>{g.trecho}</q>}<span className="origem">{ORIGEM[g.origem]}</span></dd></div>)}
                  <div><dt>Cliente</dt><dd>{d.pago_na_hora.dinheiro || d.pago_na_hora.cupom ? "já recebeu o que a regra calculou; a pessoa decide o resto, com o caso resumido" : "nada é pago antes de uma pessoa olhar: há dúvida sobre o que é devido"}</dd></div>
                  {c.o_que_falta_para_decidir.length > 0 && <div><dt>Falta</dt><dd>{c.o_que_falta_para_decidir.join(", ")}</dd></div>}
                </dl>
              ) : (
                <p className="bj-texto">Nenhum risco que exija uma pessoa: a regra concedeu e o cliente recebe na hora.</p>
              )}
              <details className="bj-crm"><summary>Justificativa pronta para o CRM</summary><p>{d.justificativa_crm}</p></details>
            </article>
          )}
        </div>

        {res && cartoes >= 3 && !rodando && (
          <div className="bj-rodape">
            <span className={`bj-selo-res ${res.origem}`}>{res.origem === "gravado" ? "● gravado de uma execução real" : "● ao vivo agora"}</span>
            {exemplo && <button className="bj-ao-vivo" onClick={() => aoVivo(exemplo.texto, exemplo.id)}>▶ testar esta com a IA agora</button>}
          </div>
        )}
        {erro && <p className="bj-erro" role="alert">{erro}</p>}
      </div>
      </div>
    </section>
  );
}
