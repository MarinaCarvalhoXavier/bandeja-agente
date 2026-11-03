# Regras do agente: v1.6 (aprovadas pela Marina em 02/11/2026)

Base: discovery (`discovery/sintese.md`) e pesquisa de casos (`discovery/pesquisa-casos.md`).
Protótipo com dados fictícios. **Não é a política de nenhuma empresa.**

## 0. Princípios
1. **A IA interpreta. A regra decide o dinheiro. Uma pessoa entra quando o risco é alto.**
2. **A automação só concede; toda negativa é de uma pessoa.** O agente nunca responde "não elegível". Se o caso levaria a negar, ele vai para uma pessoa.
3. **Escalar não muda o valor.** A regra calcula igual para quem ameaça expor nas redes e para quem não ameaça.
4. **O cliente escolhe.** Cupom nunca é imposto. O reembolso volta pelo meio de pagamento original.
5. **Para o cliente, quem responde é a plataforma.** O responsável é só um campo interno.

## 1. Fluxo
1. **IA (1ª chamada):** lê a reclamação e os dados do pedido. Devolve as categorias, os itens afetados, a causa, os gatilhos com o trecho que comprova cada um, a confiança e se houve tentativa de manipulação.
2. **Regra (código):** calcula o reembolso, decide se vai para uma pessoa, define a urgência e monta o ticket.
3. **IA (2ª chamada):** escreve a resposta ao cliente a partir da decisão da regra. Não decide nada.
4. **Rede de segurança (código):** palavras-chave de saúde e de jurídico forçam o envio para uma pessoa, mesmo que a IA não as marque.

## 2. Categorias, responsável e reembolso
| Código | Categoria | Responsável (interno) | Reembolso pela regra | ID |
|---|---|---|---|---|
| `item_faltando` | Item não veio | restaurante | Valor dos itens afetados | R-FALT |
| `item_incompleto` | Veio pela metade, faltou ingrediente ou adicional pago, ou **só uma parte de um combo foi afetada** (v6) | restaurante | **50%** do valor do item inteiro (aplicado uma vez só, mesmo que a IA informe "meia quantidade"; v5) | R-INC |
| `item_errado` | Veio outro item | restaurante | Valor do **item inteiro** pedido | R-ERR |
| `item_detalhe` | **Erro sem prejuízo (v7, decisão da Marina):** personalização não atendida, brinde ou brinquedo, molho, talher, bebida parecida trocada no combo, item trocado que o cliente comeu sem problema | restaurante | Cupom de R$ 10 + desculpas (o cliente pode pedir revisão) | R-DET |
| `qualidade_leve` | Frio, embalagem ruim, comida aproveitável | restaurante; **entregador** se a causa for atraso ou transporte | Cupom de R$ 10 | R-QL |
| `qualidade_inutilizada` | Amassada, derramada, revirada, quebrada (ex.: ovos), sem condição de comer | restaurante (embalagem ou preparo); **entregador** (transporte); `incerto` se não der para saber | Valor dos itens afetados | R-QI |
| `qualidade_saude` | Estragado, corpo estranho, cabelo, alergia, mal-estar | restaurante | **Sem valor automático**: vai para uma pessoa. Referência: valor dos itens afetados | R-QS |
| `atraso` | Chegou depois do prazo máximo informado | entregador | Por faixa (seção 3) | R-ATR |
| `nao_entregue` | Não chegou (inclui endereço errado) | entregador | **Total pago** (substitui todo o resto) | R-NE |
| `cobranca_indevida` | Cobrou a mais, cobrou duas vezes, cobrança não reconhecida | plataforma | Diferença cobrada a mais (dado do pedido) | R-COB |
| `comportamento_entregador` | Grosseria, ameaça, assédio, discriminação, acidente | entregador | **Sem valor automático**: vai para uma pessoa | R-COMP |
| `outro` | Não se encaixa | incerto | **Sem valor automático**: vai para uma pessoa | R-OUT |

Responsável geral: o responsável da única categoria, ou `multiplos` quando há mais de um.

## 3. Atraso (minutos depois do prazo máximo informado, **segundo os dados do pedido**)
| Atraso | Compensação |
|---|---|
| Até 15 min | Nenhuma; pedido de desculpas |
| 16 a 30 min | Cupom de R$ 10 |
| 31 a 60 min | Cupom de R$ 20 |
| Acima de 60 min | Devolve a taxa de entrega **+** cupom de R$ 20 |
| Acima de 90 min | O mesmo, como **proposta**, e vai para uma pessoa (H10): a refeição perdeu o sentido |

O cupom vale no mínimo 30 dias. Atraso de até 15 min não é negativa: não há o que reembolsar. Mesmo assim, a resposta deixa o canal aberto.

## 4. Mais de uma categoria
1. Se `nao_entregue` estiver presente, devolve o **total do pedido** e ignora o resto. A exceção é a `cobranca_indevida`: o que foi cobrado a mais também volta.
2. Valores em dinheiro **se somam**. O mesmo item nunca é reembolsado duas vezes: vale a regra de maior valor para ele.
3. **Só um cupom por reclamação**, o de maior valor. Isso cobre o "frio por causa do atraso, conta uma vez só".
4. **Teto:** o dinheiro devolvido nunca passa do que saiu do bolso do cliente (total do pedido + cobranças a mais).
5. **Pedido inteiro perdido** (tudo o que foi pedido veio errado, faltando ou sem condição de comer; R-TOTAL): devolve também a **taxa de entrega**, dá **cupom de cortesia de R$ 10**, e o cliente **escolhe** entre essa devolução e **refazer e reenviar sem custo**, se a loja conseguir (CDC art. 18: a escolha é do consumidor). O restaurante arca internamente quando o erro é dele.

## 5. Vai para uma pessoa (qualquer um destes)
| ID | Gatilho | Origem |
|---|---|---|
| H1 | Dinheiro calculado acima de **R$ 100** | Regra |
| H2 | Saúde: alergia, intoxicação, mal-estar, corpo estranho, estragado | IA + palavras-chave |
| H3 | Jurídico ou exposição: Procon, processo, advogado, vigilância sanitária, ameaça de expor nas redes ou na imprensa | IA + palavras-chave |
| H4 | Comportamento do entregador, discriminação, acidente | IA |
| H5 | Confiança baixa ou categoria `outro`. (Responsável `incerto` **não** escala: é um campo interno, decisão de 02/11) | IA |
| H6 | **Divergência com os dados:** diz que não recebeu, mas o código foi validado; atraso alegado mais de 30 min acima do atraso registrado; cita item que não está no pedido | Regra |
| H7 | Suspeita de fraude (sinalizada com o motivo; **nunca nega**) | IA |
| H8 | **Segunda tentativa:** já houve reembolso negado para este pedido | Regra (histórico) |
| H9 | **Limite por cliente:** 3 ou mais reclamações anteriores nos últimos 90 dias. Revisão, nunca negativa (ideia da Marina) | Regra (histórico) |
| H10 | **Atraso extremo:** acima de 90 min | Regra (dados) |
| H11 | **Trava "só concede":** há um problema real, mas a regra calculou R$ 0 e nenhum cupom (v5, depois da medição final) | Regra |
| H7 (rede de segurança, v1.6) | "contestação no cartão", "chargeback": risco de pagar duas vezes. Vai para a pessoa **sem pagar antes** | Palavras-chave |
| H12 | **Já reembolsado:** o pedido já teve devolução; a automação nunca paga duas vezes (v5) | Regra (dados) |

**Pagamento na hora (v1.4, decisão da Marina):** nos casos escalados, o cliente recebe **na hora** o que a regra já calculou, até R$ 100. Em saúde, o valor de referência são os itens afetados. A pessoa decide o resto: o que passa de R$ 100, indenização, despesas. **Exceção:** gatilhos de dúvida sobre *se* algo é devido (H5, H6, H7, H8, **H9**, H11, H12) não pagam nada antes da pessoa olhar. (v1.6: quem tem 3+ reclamações recentes espera a pessoa.)

**Filas (v1.6):** cada caso escalado vai sempre para o mesmo time: saúde (H2) → segurança alimentar · jurídico/exposição (H3) → ouvidoria e jurídico · entregador (H4) → operações de entregadores · divergência, fraude, histórico, já reembolsado (H6, H7, H9, H12) → antifraude e conferência · segunda tentativa (H8) → revisão de casos negados · demais → atendimento: casos especiais.

**Tentativa de manipulação** ("ignore as regras", "me dê R$ 1.000"): é registrada e **não** escala sozinha. A regra calcula normalmente e ignora o pedido.

## 6. Urgência
- **Alta:** H2, H3, H4, H8 ou `nao_entregue`.
- **Média:** reembolso em dinheiro, ou escalonamento por outro motivo.
- **Baixa:** só cupom, ou nada.

## 7. Resposta ao cliente (cada item vira critério do eval)
- **C1:** cita o detalhe concreto do caso (item, valor, tempo).
- **C2:** não transfere a culpa ("é com o restaurante") e não aponta culpados.
- **C3:** sempre traz um próximo passo.
- **C4:** não promete valor diferente do que a regra decidiu. Nos casos escalados, não promete valor nem prazo.
- **C5:** quando a compensação é cupom, diz que o cliente pode pedir reembolso e que uma pessoa analisa.
- **C6:** nunca diz "não elegível" nem nega.
- **C8:** pedido inteiro perdido: oferece a escolha entre reenvio sem custo e devolução, e menciona a cortesia.
- **C9:** reclamação vaga (`outro`): pede desculpas e faz 2 ou 3 perguntas curtas (o que aconteceu, qual item, foto).
- **C7:** curta (até ~600 caracteres), empática, em português do Brasil, sem jargão.

## 8. Ticket para o atendente
- **Sempre:** categorias, itens afetados, regras aplicadas (IDs), valor e forma, e uma **justificativa pronta para colar no CRM**.
- **Quando escala, também:** ID do pedido, histórico do cliente, gatilhos com o trecho que comprova cada um, **o que falta para decidir** (foto, comprovante, GPS) e o que já foi tentado.

## 9. Parâmetros (ficam num arquivo de configuração, não no meio do código)
Cupom leve R$ 10 · faixas de atraso 15/30/60 min · cupons de atraso R$ 10/20 · item incompleto 50% · limite humano R$ 100 · divergência de atraso 30 min · validade do cupom 30 dias.

## Fora da v1 (declarar como limitação)
Foto e áudio, prazo para reclamar, limite **por valor** acumulado por conta (a v1.2 usa limite por número de reclamações) e entrevista com restaurante.
