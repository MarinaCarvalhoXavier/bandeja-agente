# Bandeja · agente de triagem de reclamações de delivery

**A IA interpreta. A regra decide o dinheiro. Uma pessoa entra quando o risco é alto.**

Protótipo de um agente para o atendimento de delivery. O cliente escreve a reclamação em texto livre; a IA classifica; uma regra em código calcula reembolso, cupom e quem resolve; e a IA escreve a resposta a partir da decisão. Princípio: **a automação só concede; toda negativa é de uma pessoa.**

- Demo: https://bandeja-demo.vercel.app
- Case completo: https://marinaxavier.vercel.app/cases/reclamacoes

Projeto de portfólio, com dados fictícios. Não tem relação com nenhuma empresa.

## Resultados (v7, 100 casos de teste novos)

Os 100 casos foram escritos sem ver o prompt, com excesso proposital de casos difíceis (saúde, jurídico, manipulação, ambíguos). Nenhum ajuste foi feito olhando para eles antes da medição.

| Métrica | Resultado |
|---|---|
| Decisão certa sobre quem resolve (automático × pessoa) | 97/100 |
| Escalou quando devia | 43/44 |
| Escalou sem necessidade | 2/56 |
| Saúde e jurídico foram para uma pessoa | 15/15 |
| Tentativas de manipular a IA sem efeito no valor | 4/4 |
| Categoria certa | 95% |
| Custo e tempo por reclamação | US$ 0,0162 (~R$ 0,087), ~8 s |

O único erro grave foi um cliente que já tinha aberto contestação no cartão e recebeu o pagamento na hora, o que podia levar a empresa a pagar duas vezes. Esse caso virou trava na regra (v1.6). Recalculado nos mesmos 100 casos, deu 44/44, mas isso é recálculo e não uma medição independente. Histórico completo, com todas as versões e ressalvas, em [`HISTORICO.md`](HISTORICO.md).

## Como funciona

1. **A IA classifica** (`web/src/lib/agente/`). Ela devolve um formulário fechado, validado por esquema: categorias, itens afetados, alertas com o trecho que comprova e confiança. Não existe campo para valor.
2. **A regra decide** (`web/src/lib/regras/motor.ts`). É TypeScript puro e determinístico: reembolso por categoria, 12 gatilhos (H1–H12) que mandam o caso para uma pessoa, uma rede de segurança por palavras-chave (saúde, jurídico, fraude) e uma fila fixa por tipo de risco.
3. **A IA responde.** Ela vê só a decisão que pode ser mostrada ao cliente, sem "quem paga".

Regras de negócio completas em [`REGRAS.md`](REGRAS.md).

## Estrutura

```
discovery/    entrevistas (anonimizadas), pesquisa jurídica, de plataformas e de casos públicos
casos/        geradores dos 208 casos com gabarito (lote1–4.py; rodar em ordem) e todos.json
resultados/   saída de cada rodada de avaliação, por versão
web/          app Next.js: demo, painel de avaliação, regra, prompts e scripts
```

## Rodar

```bash
cd web
npm install
cp .env.local.exemplo .env.local   # coloque sua ANTHROPIC_API_KEY
npm run dev                          # demo em http://localhost:3000
npx vitest run                       # 215 testes da regra contra o gabarito
npx tsx scripts/avaliar.ts --conjunto dev --versao teste --limite 3   # avaliação (gasta API)
```

Sem chave, a demo continua funcionando com as respostas gravadas.

## Feito com

Claude API (`claude-opus-5-5`, saída estruturada), Next.js, TypeScript e Vitest. Construído com Claude Code por Marina Xavier, Product Lead no CITi.
