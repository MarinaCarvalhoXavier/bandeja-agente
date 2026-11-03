# Síntese do mini discovery

> Versão de 01/11/2026, atualizada em 02/11 com as entrevistas (seção no fim).
> Base: pesquisa de fontes (`pesquisa-fontes.md`) e 69 títulos de reclamações públicas (`analise-reclamacoes.csv`).

## Como a análise de reclamações foi feita (e os limites dela)

- O Reclame Aqui bloqueia leitura automática. Por isso usei **títulos e trechos que aparecem na busca**, não o texto completo. A classificação é minha, feita a partir do título (e do trecho, quando havia um).
- **27 reclamações vieram de buscas genéricas** ("ifood pedido reclamação" e parecidas). São as únicas usadas para estimar a distribuição. As outras 42 vieram de buscas dirigidas (por exemplo, "reembolso negado" e "cobrança") e servem só para ver padrões.
- **27 é pouco** e o Reclame Aqui é um canal enviesado: quem chega lá já tentou o app e não resolveu. Trate os percentuais como **sinal, não estatística**.
- Não copiei textos. O CSV tem resumos com as minhas palavras e o link de cada reclamação.

## O que encontrei

**1. A dor principal parece ser a resolução, não o incidente.**
- Nas 27 reclamações das buscas genéricas, **17 (63%) reclamam do suporte**: não resolveu, chat encerrado, sem canal para voltar. Em todas as 69, são 71%.
- ~~Levantamento "5.770 reembolso vs 858 atraso"~~: **não confirmado** (a matéria citada não traz esses números; ver `pesquisa-juridica.md`). Não usar.
- Os padrões que mais aparecem: **negativa sem explicação**, **o mesmo tipo de caso aprovado para um e negado para outro**, compensação vista como irrisória (voucher de R$ 8) e exigência de prova difícil de dar.

**2. A triagem de primeira linha já é feita por IA.**
- A Rosie, do iFood, resolve sozinha 76% dos casos de pedido errado. Na 99Food, um atendente disse a um cliente que "quem decide o reembolso é uma IA".
- **Implicação:** o projeto não pode se vender como "automatizar a triagem que hoje é manual". Para o iFood, essa premissa do PROMPT (seção 3, "feito à mão") **está desatualizada**.

**3. Reclamação com mais de um problema é comum.**
- 6 das 27 (22%) têm mais de uma categoria. A combinação mais frequente é **atraso + comida fria ou danificada**.
- Isso confirma que o ponto 4 (como somar reembolsos) importa e que a regra "frio causado por atraso conta uma vez só" vai ser testada de verdade.

**4. Os casos com entregador são os mais difíceis de decidir.**
- Aparecem: código de entrega passado sem receber o pedido, regra dos 10 minutos, entregador que some com o pedido, agressão, ameaça.
- São disputas de **versão contra versão**, nas quais a reclamação sozinha não diz quem tem razão.

**5. Há fraude dos dois lados, e isso aparece nas decisões.**
- 10 das 69 (14%) mostram algum sinal: loja que acusa o cliente, plataforma que descredencia o cliente, entregador que aplica golpe.
- Isso reforça o ponto 7 (divergência entre o que o cliente diz e os dados do pedido vai para uma pessoa).

**6. Saúde e ameaça jurídica são raras nos títulos.**
- Saúde aparece só como "talvez" em 3 casos (cabelo, gosto de estragado, impróprio para consumo). Ameaça jurídica explícita aparece em 1.
- Isso era esperado: são raras, mas caras quando dão errado. No conjunto de teste elas vão estar **sobrerrepresentadas de propósito**, e isso precisa ser dito quando os números forem publicados.

**7. Para o cliente, quem responde é a plataforma.**
- Pelo Código de Defesa do Consumidor (conferir), a responsabilidade é solidária: o cliente não precisa saber quem errou.
- **Implicação:** o campo `responsavel` serve para uso **interno** (quem paga a conta), e a resposta ao cliente nunca deve dizer "a culpa é do restaurante".
- O cliente também não é obrigado a aceitar cupom no lugar de reembolso. Cupom funciona como compensação extra, mas não substitui a devolução de um item que faltou.

## Proposta de reenquadramento (decisão sua)

| | Enquadramento original | Proposta |
|---|---|---|
| Problema | Triagem manual, lenta e inconsistente | A triagem já é automatizada. A dor está em **decisões de reembolso inconsistentes e sem explicação**, e nos casos que voltam |
| Usuário principal | "A operação" | **O atendente que recebe os casos difíceis ou escalados**: precisa decidir rápido, com consistência e com o caso resumido |
| O que o agente entrega | Categoria, responsável, resposta | O mesmo, mais: **decisão com explicação** (qual regra, por quê, o que o cliente pode fazer se discordar) e um **resumo pronto para a pessoa** nos casos escalados |
| Por que IA + regra | Segurança | Segurança **e consistência**: a mesma reclamação sempre gera a mesma decisão, e dá para auditar |
| Relação com o que existe | Não mencionada | Não compete com a Rosie. Explora um princípio de design ("a IA interpreta, a regra decide o dinheiro") e **mostra como medir** se o escalonamento funciona |

**O que muda no build:** pouco. O núcleo é o mesmo. Mudam três coisas:
1. A resposta ao cliente explica a decisão.
2. Os casos escalados ganham um campo de resumo.
3. O conjunto de teste ganha casos de "segunda tentativa" (o cliente já reclamou e teve o pedido negado) e disputas com entregador.

Isso cabe no prazo.

**Risco do reenquadramento:** ele fica mais forte para o iFood, mas exige cuidado para não afirmar nada sobre como a Rosie funciona por dentro. A gente não sabe. O texto do portfólio deve citar apenas o que é público.

## Impacto nos 10 pontos de regra

| Ponto | O que o discovery diz |
|---|---|
| 1–2 Atraso | Nada novo. O Código de Defesa do Consumidor permite cancelar com reembolso integral em atraso, então para atraso muito grande vale considerar uma regra "acima de X min, devolve o pedido inteiro ou vai para uma pessoa" |
| 3 Qualidade | Confirma separar "frio/danificado" de "estragado/cabelo/impróprio" e mandar este último para uma pessoa |
| 4 Várias categorias | Confirmado como comum (~22%). Atraso + frio é a combinação nº 1 |
| 5 Responsável múltiplo | Manter, mas o campo é interno e não aparece na resposta ao cliente |
| 6 Item errado | Manter o valor do item inteiro |
| 7 Divergência | Reforçado pelos sinais de fraude. Incluir "o cliente diz que não recebeu, mas o código de entrega foi validado" como gatilho humano |
| 8 Rede de segurança | Manter |
| 9 Manipulação | Manter |
| 10 Urgência | Considerar "reclamação repetida" (o cliente já teve o pedido negado) como urgência alta |
| **Novo** | O reembolso sai pelo **meio de pagamento original**. Cupom é compensação extra, nunca substitui a devolução de um item |

## Distribuição sugerida para os 100 casos (a confirmar com você)

| Grupo | Casos | Por quê |
|---|---|---|
| Atraso (com ou sem frio) | 14 | Mais frequente na amostra genérica |
| Qualidade (frio, danificado, estragado) | 12 | 2º mais frequente |
| Não entregue (incluindo disputas de código e regra dos 10 min) | 12 | Frequente e com o maior valor de reembolso |
| Item errado | 10 | |
| Item faltando | 10 | |
| Cobrança indevida | 8 | Frequente nas buscas dirigidas |
| Comportamento do entregador | 6 | |
| Saúde e alergia | 10 | Sobrerrepresentado de propósito |
| Jurídico (Procon, processo, exposição pública) | 5 | Sobrerrepresentado de propósito |
| Ambíguos e outros | 6 | |
| Tentativa de manipulação | 4 | Segurança |
| Segunda tentativa (já negado) | 3 | Vem do reenquadramento |

Total: 100. Pelo menos ~22 casos com mais de uma categoria, espalhados pelos grupos.

## O que as entrevistas mostraram (02/11)
Base: 1 pessoa de SAC (`entrevistas/01-sac.md`) e 4 clientes, 3 com conteúdo (`entrevistas/02-clientes.md`). Amostra pequena e de conveniência.

| Pergunta | Resposta |
|---|---|
| 1. A dor do cliente é a resolução ou o incidente? | **Depende do canal.** Quem resolveu pelo app teve resolução rápida e se irritou com o problema ou com o valor. A dor da resolução aparece em quem chega ao Reclame Aqui. Isso confirma o viés do canal: a frase "a dor é a resolução" vale para os casos que **escapam** do fluxo automático, não para todos |
| 2. Decisões inconsistentes? | **Sim (SAC):** com prova ambígua, um atendente dá parcial e outro dá o total para evitar nota baixa. Do lado do cliente, C1 recebeu parcial por um pedido inutilizado e achou injusto |
| 3. O que o atendente precisa num caso escalado? | ID do pedido, histórico do cliente, provas, comprovante, síntese e o que já foi tentado |
| 4. Restaurante | **Não testado** (ninguém de restaurante foi entrevistado) |
| Novo: desconfiança de IA | **3 de 3 clientes que responderam** desconfiam de resposta **genérica ou repetida**. Um teve atendimento por IA no WhatsApp e não resolveu |
| Novo: dor do atendente | Categorizar o ticket e **justificar o reembolso no CRM** depois do atendimento |

**Consequências para o build:**
1. A resposta ao cliente tem que citar o **caso concreto** (item, valor, regra aplicada). Vira critério do eval: "a resposta menciona o detalhe específico do caso?"
2. A saída do agente é o **ticket já preenchido e justificado** (categoria, regra, justificativa), o que ataca a dor nº 1 do atendente.
3. Pedido **inutilizado** (amassado a ponto de não dar para comer, derramado) devolve o valor do item, não um cupom de R$ 10. Duas fontes convergem: o caso C1 e a regra relatada pelo SAC.
4. Suspeita de fraude: o agente **sinaliza e escala, nunca nega**.
5. A resposta ao cliente **nunca transfere a culpa** ("isso é com o restaurante") **nem encerra sem um próximo passo**. Fonte: relato próprio (`entrevistas/03-relato-proprio.md`, viés declarado) e linha 2 do CSV.
6. **Item incompleto** (veio pela metade, faltou um ingrediente pago) precisa de uma regra própria. Decisão da Marina nas regras.
