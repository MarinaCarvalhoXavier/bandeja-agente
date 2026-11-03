# Pesquisa de fontes — mini discovery (01/11/2026)

Legenda de confiabilidade:
- **[lido]** = abri a página e li o conteúdo.
- **[busca]** = veio só do resumo de um buscador; **conferir antes de publicar qualquer número**.
- Todos os números de empresas são **autodeclarados** por elas, sem verificação independente.

---

## 1. Escala do problema (iFood)

| Dado | Valor | Fonte |
|---|---|---|
| Pedidos por mês | +180 milhões | [Consumidor Moderno, 25/02/2026] [lido] |
| Contatos com o atendimento por mês | +3,4 milhões (≈ 1,9% dos pedidos, conta minha) | idem |
| Concentração | +30% dos contatos entre 20h e 22h; em dia de chuva, até 5.000 conversas abertas por minuto | idem |
| Pós-entrega (pedido errado, danificado etc.) | 38% do volume de atendimento | [Canaltech, 13/11/2025] [lido] |
| Reclamações no Reclame Aqui em 6 meses | 136.712; o iFood foi a empresa mais reclamada do país | [A Tarde, 28/05/2025] [lido] |
| Motivos no Reclame Aqui | problemas com reembolso 5.770 · mau atendimento 1.486 · qualidade do serviço 1.447 · atraso 858 · propaganda enganosa 456 · cobrança indevida 378 | **NÃO CONFIRMADO: a matéria do A Tarde não traz esses números (conferido em 02/11). Não usar.** |

**Leitura:** o maior motivo de reclamação pública não é o incidente (atraso, item faltando), e sim **o tratamento do reembolso**. Se o dado se confirmar, ele aparece quase 7 vezes mais que atraso.

## 2. O que já é automatizado (importante para o enquadramento)

- **O iFood já usa IA no atendimento.** A agente **Rosie** resolve sozinha **76% dos casos de pedido errado**, lê fotos enviadas pelo cliente em tempo real, consulta o histórico de pedidos, concede cupons e ajuda em cancelamentos. Desde que entrou, o tempo de atendimento caiu 74% e o caso leva cerca de 10 minutos. Os casos mais complexos ficam com pessoas, sob "supervisão contínua". [Canaltech; Mobile Time, 14/11/2025] [lido]
- Uma executiva do iFood diz que **60% a 70% do atendimento é feito por IA** em todos os canais. [busca, data não confirmada]
- Os atendentes humanos (muitos terceirizados) contam com IAs de apoio: **Ivy** (analisa as interações) e **Luma** (reforços de treinamento). As dores citadas pela própria empresa: picos extremos, pressão emocional, **"ruído de interpretação" afetando a consistência** e um modelo reativo. [Consumidor Moderno] [lido]
- **99Food:** num relato público, um atendente humano disse ao cliente que **quem decide se cabe reembolso é uma IA**, e o chat automático respondeu "não elegível para reembolso". [Reclame Aqui, via busca]

**Consequência para o projeto:** "triagem com IA" não é novidade para o iFood. Um avaliador de lá vai pensar na Rosie na hora. O protótipo precisa deixar claro **o que explora de diferente**. Ver a síntese.

## 3. Regras e práticas que aparecem nas respostas das plataformas

Vêm das respostas públicas no Reclame Aqui [busca]. São padrões observados, não a política oficial:
- **Regra dos 10 minutos:** se o entregador chega e o cliente não retira o pedido em 10 min, o pedido é cancelado sem reembolso. Gera muita disputa de versão ("o entregador nunca veio").
- **Código de entrega:** se o cliente passou o código, a plataforma considera o pedido entregue e costuma negar o reembolso, mesmo quando o cliente diz que não recebeu.
- **Preparo iniciado:** depois que o preparo começa, a loja pode ficar com até 100% do valor de um cancelamento.
- **Exigência de prova:** fotos e nota fiscal. Um relato reclama de ter que "provar a ausência" de itens.
- **Voucher no lugar de reembolso:** cliente recebe a oferta de voucher de R$ 8 e acha insuficiente.
- **Estorno:** Pix em até 24h; cartão em até 2 faturas.
- **Negociação loja–cliente:** o iFood criou ferramentas para o restaurante negociar o reembolso parcial de itens não entregues, aceito em 71% das vezes. [Mercado & Consumo, 2024, citado no PROMPT]

## 4. Lado do restaurante e fraude

- Restaurantes reclamam de reembolsos descontados do repasse e de contestações recusadas mesmo com imagem de câmera. A Abrabar fala em bloquear por CPF clientes que comprovadamente aplicam golpe. [busca]
- Há fraude dos dois lados: **cliente** que diz não ter recebido, **entregador** que some com o pedido ou faz golpe na maquininha (o iFood já foi multado em R$ 2,5 milhões pelo "golpe do entregador" no Procon-SP), e **plataforma** que descredencia cliente por suspeita. [busca: Tecnoblog, Diário do Nordeste]
- Não encontrei dado consolidado sobre a frequência de reembolso fraudulento.

## 5. Direito do consumidor (precisa de conferência no texto oficial do CDC)

[busca: Procon-ES, Procon-JF, blogs jurídicos]
- **Responsabilidade solidária:** restaurante, entregador e aplicativo respondem juntos perante o cliente, e o cliente não precisa provar quem errou (art. 18 citado; conferir).
- **Atraso:** o cliente pode cancelar com devolução integral, exigir a entrega ou aceitar outro produto (art. 35 citado).
- **Pedido errado ou danificado:** recusar e ser reembolsado, pedir nova entrega ou um desconto proporcional.
- **Crédito no app:** o cliente **não é obrigado a aceitar** crédito ou cupom no lugar do reembolso pelo meio de pagamento.
- Na prática, os clientes citam Procon e Juizado Especial com frequência.

## 6. Outras plataformas

- **99Food:** nota 7,5/10 no Reclame Aqui (fev a jul/2026), 76,3% resolvidas. A Senacon abriu processo por omissão de taxas (jun/2026), e iFood e Keeta foram notificados em maio. [busca]
- **Keeta e Rappi:** pouco dado público de consumidor. As reclamações sobre a Rappi no Reclame Aqui são em boa parte de entregadores e da RappiPay. [busca]

---

## Fontes
- [Consumidor Moderno — iFood escala resolução (25/02/2026)](https://consumidormoderno.com.br/ifood-escalar-resolucao-questoes/)
- [Canaltech — iFood reforça IA de atendimento (13/11/2025)](https://canaltech.com.br/apps/ifood-reforca-ia-de-atendimento-a-clientes-de-olho-na-black-friday/)
- [Mobile Time — Rosie lê imagens (14/11/2025)](https://www.mobiletime.com.br/noticias/14/11/2025/ia-ifood-imagens/)
- [A Tarde — iFood é a empresa com mais reclamações (28/05/2025)](https://atarde.com.br/economia/ifood-e-empresa-com-mais-reclamacoes-do-brasil-nos-ultimos-seis-meses-aponta-plataforma-1329186)
- [TI Inside — 880 agentes de IA no iFood (19/09/2025)](https://tiinside.com.br/19/09/2025/ifood-alcanca-880-agentes-de-inteligencia-artificial-ativos-por-semana/)
- [Mercado & Consumo — ferramentas de acordo (2024)](https://mercadoeconsumo.com.br/10/06/2024/foodservice/ifood-cria-novas-ferramentas-de-acordo-entre-clientes-e-restaurantes/)
- [Tecnoblog — iFood multado por golpe do entregador](https://tecnoblog.net/noticias/ifood-multado-golpe-entregador-procon-sp/)
- [Diário do Nordeste — golpe deixa restaurantes no prejuízo](https://diariodonordeste.verdesmares.com.br/negocios/golpe-no-ifood-deixa-restaurantes-no-prejuizo-app-estuda-cobrar-taxa-de-cancelamento-do-cliente-1.3233691)
- [Rosenbaum Advocacia — direitos no delivery](https://www.rosenbaum.adv.br/delivery-conheca-os-seus-direitos/)
- [Reclame Aqui — página do iFood](https://www.reclameaqui.com.br/empresa/ifood/) (bloqueia leitura automática; dados via busca)
- [Reclame Aqui — página da 99Food](https://www.reclameaqui.com.br/empresa/99food/)
- Reclamações individuais: ver as URLs em `analise-reclamacoes.csv`
