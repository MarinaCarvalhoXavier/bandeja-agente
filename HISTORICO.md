# Histórico de versões (para contar a evolução no portfólio)

Formato: versão → o que foi medido → erro principal → o que mudou → resultado.

## Regras v1 (02/11/2026)
- **Lacuna encontrada ao escrever os casos:** "não entregue substitui todo o resto" ignorava uma cobrança em dobro no mesmo pedido (caso 65), e o teto "total do pedido" cortava estornos de cobrança tripla (caso 83). **Mudança:** a cobrança indevida sempre volta, e o teto passou a ser o que saiu do bolso do cliente.
- **Teste da regra contra os 100 gabaritos:** 99/100 na primeira rodada. **Erro:** a rede de segurança marcou "festa estragada" como risco à saúde (caso 62); depois, "festa" bateu no padrão "esta estragad". **Mudança:** "estragado" só conta quando fala de comida, com limite de palavra. **Resultado:** 100/100 (`web/src/lib/regras/motor.test.ts`).

## Agente v1 (prompt v1), medido em 02/11/2026
- Modelo: `claude-opus-5-5`. Classificação com esforço `medium`; resposta com esforço `low`. Saída estruturada validada por schema (zod). Fallback do servidor ligado (`fallbacks: "default"`).
- **Teste de fumaça (3 casos):** funcionou de ponta a ponta. US$ 0,10. A resposta do caso 74 confirmou a versão do cliente ("você pediu picanha") contra os dados do pedido.
- **v1 nos 30 casos de desenvolvimento** (`resultados/v1-dev.json`):
  - categoria exata 96,7% (parcial 97,8%) · responsável 86,7% · valor 100% · urgência 100% · escalonamento 90%;
  - escalou 11 de 11 casos que deviam (saúde e jurídico: 4 de 4) · **escalou 3 de 19 casos simples sem necessidade** · manipulação 100%;
  - US$ 0,0138 (~R$ 0,07) por reclamação · ~8,7 s.
- **Erros principais:**
  1. **Escalonamento desnecessário (3 de 19).**
     - Caso 21: a IA pôs o item **recebido** por engano ("x-salada") na lista de "itens fora do pedido", o que disparou o gatilho de divergência.
     - Casos 24 e 77: a IA marcou o responsável como "incerto" (pedido trocado, ovos quebrados), e "incerto" escala sozinho.
  2. **Responsável** (4 erros): "incerto" em item errado (24, 74, 77) e "restaurante" numa reclamação "outro" (97).
  3. **Verificador de resposta:** 2 falsos alarmes (17, 67). A resposta repetiu o valor que o próprio cliente citou ("compra de R$ 340"); não era uma promessa.

## Regras v1.1 + verificador v2 (02/11/2026, decisões da Marina)
- **Responsável "incerto" deixou de escalar sozinho.** É um campo interno (quem paga) e não muda nada para o cliente. Gabarito do caso 13 atualizado.
- **Ovos quebrados (caso 77) = comida inutilizada**, meia dúzia afetada. O valor não muda (R$ 7,45).
- **Verificador C4:** repetir o valor que o cliente citou não conta mais como promessa. Só acusa valor ligado a devolução, reembolso ou cupom.
- **v1 repontuada com a regra nova** (sem chamar a API; `resultados/v1-regras-v2-dev.json`): escalonamento desnecessário caiu de 3/19 para **1/19** só com a mudança de regra. Categoria 100% · responsável 90% · checagens de resposta 100%.

## Agente v2 (prompt v2), medido em 02/11/2026 (`resultados/v2-dev.json`)
- **O que mudou no prompt:**
  - "Itens fora do pedido" passa a ser só o que o cliente diz ter **pedido ou pago**; o item recebido por engano não entra.
  - Item faltando, incompleto ou errado é sempre do restaurante.
  - `outro` tem responsável "incerto".
  - A resposta não confirma a versão do cliente quando ela diverge dos dados.
- **Resultado (30 dev):**
  - categoria 96,7% · responsável 96,7% · valor 96,7% · escalou sem necessidade **0/19** · escalou quando devia **10/11** · saúde e jurídico 4/4 · checagens de resposta 100%;
  - US$ 0,0154 por reclamação · ~8,2 s.
- **Corrigiu:** caso 21 (não escala mais) e caso 74 (a resposta agora diz "uma pessoa vai conferir os dados do pedido", sem confirmar a versão do cliente).
- **Novo erro:** caso 97 ("o hambúrguer era menor que na foto", em inglês). A v1 marcou `outro` e escalou; a v2 marcou `qualidade_leve` e deu cupom de R$ 10 sozinha. É o tipo de erro **mais grave** (deixar de escalar), mesmo sendo um caso barato.
- **Leitura honesta:** em 30 casos, 1 caso = 3,3 pontos. A v2 não é "melhor" em número. **O tipo de erro mudou**: a v1 escalava demais casos simples; a v2 resolveu sozinha um caso ambíguo.

## Agente v3 (prompt v3), medido em 02/11/2026 (`resultados/v3-dev.json`)
- **Decisão da Marina:** "menor que a foto/anúncio" é `outro` e vai para uma pessoa.
- **O que mudou no prompt:** a categoria `outro` passou a incluir "diferente do anunciado ou da foto". Qualidade é o estado da comida, não a promessa do anúncio.
- **Resultado (30 dev):**
  - categoria 100% · responsável 100% · urgência 100% · escalonamento 100% (11/11 que deviam; 0/19 sem necessidade) · saúde e jurídico 4/4 · manipulação 100% · checagens de resposta 100% · valor 96,7%;
  - US$ 0,0151 por reclamação · ~8,1 s.
- **Erro restante:** caso 74 (cliente diz que pediu picanha; o pedido é de frango). A IA listou o frango como item afetado, e a regra calculou R$ 29,90 como **proposta** para a pessoa. O caso já ia para uma pessoa (divergência) e o cliente não vê o valor, então o impacto é baixo. **Não corrigi de propósito**: mais ajuste nos mesmos 30 casos é decorar a prova.
- **Atenção:** 100% em casos de desenvolvimento é esperado depois de três rodadas de ajuste neles. **O número que vale é o da medição final nos 70 casos de teste.**

## Revisão do gabarito pela Marina + regras v1.2 (02/11/2026)
- **Novas regras:**
  - **Pedido inteiro perdido** (R-TOTAL): devolve também a taxa, dá cortesia de R$ 10, e o cliente escolhe entre essa devolução e o reenvio sem custo (CDC art. 18).
  - **Limite por cliente** (H9, ideia da Marina): 3 ou mais reclamações em 90 dias vão para uma pessoa. Revisão, nunca negativa.
  - **Atraso acima de 90 min** (H10) vai para uma pessoa.
- **Gabarito:** caso 71 (pizza menor) virou item incompleto; 28, 45, 55, 61 e 63 ganharam os novos gatilhos. Mantidos 13, 25 (agora com R-TOTAL), 42, 58 e 95.
- **Resposta:** oferece a escolha de reenvio quando o pedido inteiro se perdeu e faz perguntas curtas quando a reclamação é vaga (pedido da Marina no caso 96).
- **v3 repontuada com as regras v1.2** (sem custo; `resultados/v3-regras-v1.2-dev.json`): escalonamento 100% (12/12; 0/18 sem necessidade) · categoria 96,7% · valor 93,3%. **Novo erro:** o caso 71 (pizza média) ainda vinha como item errado, porque o prompt v3 dizia "tamanho" em item errado. **Mudança → prompt v4:** tamanho menor do mesmo produto = item incompleto.

## Agente v4: dev (`resultados/v4-dev.json`) e MEDIÇÃO FINAL (`resultados/v4-teste.json`), 02/11/2026
- **Dev (30):** categoria 100% · responsável 100% · escalonamento 100% (12/12; 0/18) · valor 96,7% (só o caso 74, já conhecido). Respostas novas OK (reenvio, perguntas no caso vago).
- **TESTE (70 casos nunca usados para ajustar; rodou uma vez, prompt congelado). Estes são os números oficiais:**
  - categoria exata **92,9%** (parcial 95%) · responsável **95,7%** · valor **92,9%** · urgência 94,3% · escalonamento **92,9%**;
  - escalou quando devia **28/30** · **saúde e jurídico 12/12** · escalou sem necessidade **3/40** · manipulação **5/5 (100%)** · checagens automáticas de resposta 100%;
  - **US$ 0,0147 (~R$ 0,08) por reclamação** · **~8,2 s**. Custo da medição: US$ 1,03.
- **Queda de dev (100%) para teste (~93%):** é o efeito esperado de ajustar o prompt olhando os mesmos casos. Por isso o número publicado é o do teste.
- **Erros do teste, por gravidade:**
  1. **Caso 98, pagaria duas vezes (o mais grave).** "O restaurante cancelou, o dinheiro já voltou, mas ninguém explica." A IA leu como não entregue, e a regra devolveu R$ 66,89 sozinha. **Causa:** os dados do pedido não têm o campo "já reembolsado", então a regra não tinha como saber.
  2. **Caso 48, ficaria sem nada e sem pessoa.** "Pedido duplicado, chegou tudo em dobro." A IA marcou cobrança indevida, mas não havia cobrança a mais registrada, e o resultado foi R$ 0 sem escalar. **Isso viola o princípio "a automação só concede"**: a regra não tinha uma trava para "resolveu com zero".
  3. **Item incompleto pago pela metade da metade** (casos 30, 80, 86). A IA informou quantidade 0,5 ("veio pela metade"), e a regra aplicou os 50% em cima disso (25%). **Causa:** interação entre duas mudanças minhas (quantidade fracionada, criada para os ovos na v2, e o fator de 50%). O cliente receberia menos do que a regra manda.
  4. **Excesso de cautela (3/40):** vegetariano tratado como saúde (25); "quase 1 hora parado" virou divergência de atraso (18); o caso 82 dobrou o valor (não entregue + cobrança), **mas o limite de R$ 100 segurou e mandou para uma pessoa**.
  5. **Menores:** a responsabilidade pela embalagem veio "incerta" (9); "entregador mentiu" ganhou a categoria comportamento (63).

## Regras v1.3 / "v5" (02/11/2026): correções DEPOIS da medição final (aprovadas pela Marina)
- **(a) Trava "só concede" (H11):** se há um problema real e a regra calculou R$ 0 sem cupom, vai para uma pessoa.
- **(b) Dado "já reembolsado" (H12):** um pedido que já teve devolução nunca é pago de novo automaticamente.
- **(c) Item incompleto:** os 50% incidem sobre o item inteiro, uma vez só.
- **Prompt não mudou** (continua o v4). Testes da regra: 107/107.
- **Recálculo com as classificações salvas da v4** (sem custo; `resultados/v5-regras-repontuado-teste.json`). **NÃO é uma medição independente**, porque as correções foram feitas olhando esses erros:
  - teste: escalou quando devia **30/30** (era 28/30) · valor **97,1%** (era 92,9%) · escalonamento 95,7% · saúde e jurídico 12/12 · sem necessidade 3/40 (não mudou);
  - caso 98: agora vai para uma pessoa em vez de pagar duas vezes. Caso 48: agora vai para uma pessoa em vez de ficar sem nada. Casos 30, 80 e 86: valor certo.
- **Como contar no portfólio:** o número oficial continua sendo o da v4. A v5 é "o que corrigi depois de ver os erros", com o recálculo, deixando claro que ele foi feito nos mesmos casos.
- **Próxima versão (não feita):** separar o item incompleto em dois níveis (componente principal ou adicional pago = 50%; detalhe como picles ou molho = cupom). Isso exige mudar o prompt e fazer uma medição nova.

## Erro achado pela Marina na demo → regras v1.4 + prompt v6 (02/11/2026)
- **O erro:** "pedi um x-burguer e veio amassado, incomível", num pedido em que o combo é um item só. A IA marcou o combo inteiro como inutilizado, e a regra aplicou "pedido inteiro perdido" (combo + taxa + cortesia), embora a batata e o refri estivessem bons.
- **Por que a avaliação não pegou:** os 100 casos não tinham "uma parte do combo estragou". Era uma lacuna do conjunto de teste, não só do prompt.
- **Mudanças:**
  - **Prompt v6:** parte de combo ou item composto = item incompleto.
  - A resposta não oferece trocar a cortesia por reembolso.
  - **Regras v1.4 (decisão da Marina):** pagamento na hora até R$ 100 nos casos escalados, exceto quando há dúvida sobre se algo é devido. No gabarito, 26 de 42 clientes com casos graves recebem na hora (R$ 1.175,61).
- **Avaliação:** 8 casos novos (101–108, `casos/lote3.py`), escritos depois do erro e nunca usados para ajustar. Funcionam como teste limpo da v6. Testes da regra: 115/115.
- **Painel:** nova seção "Antes de ir para produção", que separa o que o painel mede (execução das regras) do que ele não mede (se as regras são boas para o negócio), com hipóteses e um plano de piloto.
- **Resultados da v6 (02/11/2026), custo de US$ 0,66:**
  - **8 casos novos** (`resultados/v6-novo.json`): categoria 100% · valor 100% · pagamento na hora 100% · escalonamento 100% (1/1 que devia; 0/7 sem necessidade) · responsável 6/8 (pizza virada: "restaurante" em vez de "entregador"; refri estourado: "incerto" em vez de "restaurante"; campo interno, sem efeito para o cliente). **O caso da demo (101) agora devolve R$ 19,95** em vez do combo inteiro + taxa.
  - **30 casos de dev** (`resultados/v6-dev.json`): nada quebrou. Categoria 100% · escalonamento 100% · valor 96,7% (o caso 74 de sempre) · pagamento na hora 100%.
  - **Verificador de resposta v3:** a primeira leitura deu 76,7% nas checagens, mas eram falsos alarmes. O verificador acusava qualquer valor em caso escalado, e agora a resposta deve citar o que foi pago na hora. Ajustado para aceitar só o valor pago na hora e os valores que o próprio cliente citou. Resultado: 100%.
  - Exemplos da demo regravados com a v6.
- **Gasto total da API no projeto: ~US$ 3,57.**

## Teste novo para a v6 (lote 4, casos 201–300), escrito em 02/11/2026
- **Por quê:** o número oficial é da v4 (70 casos), mas a demo publicada é a v6. Um teste novo e maior mede a versão real, e cada erro pesa 1 ponto em vez de 1,4.
- **Independência:** os casos foram escritos por um agente separado que **não leu** o prompt, os resultados nem este histórico, só as regras. Mesma distribuição do conjunto original. Gabarito conferido contra a regra: 215/215 testes.
- **Antes de rodar:** revisão do gabarito pela Marina; depois, a v6 roda uma única vez, com o prompt congelado.

## v7 (regras v1.5 + prompt v7): medição no teste novo (lote 4, 100 casos), 02/11/2026
- **Mudança da v7 (decisão da Marina):** categoria `item_detalhe`, "erro sem prejuízo" (personalização, brinde, item trocado consumido sem problema) → cupom de R$ 10 + desculpas.
- **v7 nos 30 de dev** (`resultados/v7-dev.json`): 100% em tudo; US$ 0,48.
- **v7 nos 100 casos novos** (`resultados/v7-novo2.json`). Escritos por um agente que não viu o prompt; gabarito revisado pela Marina; prompt congelado; cada caso rodou uma vez (o crédito acabou no caso 38 e os 62 restantes rodaram depois da recarga, sem repetir nenhum):
  - categoria exata **95%** (parcial 96%) · responsável 98% · valor 98% · urgência 99% · pagamento na hora 95%;
  - **escalonamento 97/100** · escalou quando devia **43/44** · sem necessidade 2/56 · **saúde e jurídico 15/15** · manipulação **4/4** · checagens de resposta 100%;
  - US$ 0,0162 (~R$ 0,087) por reclamação · ~8 s · US$ 1,62 no total.
- **Comparação com a v4** (70 casos): categoria 92,9% → 95% · escalonamento 65/70 (92,9%) → 97/100 · escalou quando devia 28/30 → 43/44.
- **Erros:**
  - **237 (o único que deixou de escalar):** "já abri contestação no cartão, mas se devolverem antes eu cancelo". Risco de pagar duas vezes (estorno + reembolso). A regra pagou na hora.
  - **233:** três pedidos "não chegaram"; foi para uma pessoa (H9), mas pagou na hora, porque H9 não bloqueia o pagamento imediato.
  - **223:** "uma das pizzas carbonizada", sem dizer qual. A IA não apontou o item, a regra calculou zero e **a trava H11 mandou para uma pessoa**: a trava funcionou.
  - **235:** a IA leu "duas horas depois" como atraso alegado e viu divergência; escalou sem necessidade.
  - **244:** "suco sem açúcar veio adoçado". A IA deu "erro sem prejuízo"; o gabarito dizia item errado. **O gabarito contradiz a decisão do caso 295** (pediu sem cebola = erro sem prejuízo).
  - Menores: 259 e 296 (categoria diferente com o mesmo resultado prático), 232 (categoria a mais), 216 (responsável interno).
- **Verificador:** dois falsos alarmes corrigidos ("340 reais" sem R$; "R$ 44.90" numa resposta em inglês).

## Regras v1.6 (03/11/2026), correções DEPOIS da medição v7, aprovadas pela Marina
- **Contestação no cartão** ("contestação", "chargeback", "disputa no cartão") entra na rede de segurança como H7: vai para antifraude **sem pagar antes** (caso 237).
- **H9 (3+ reclamações recentes) espera a pessoa** antes de qualquer pagamento (caso 233).
- **Filas:** cada caso escalado vai sempre para o mesmo time: saúde → segurança alimentar · jurídico → ouvidoria e jurídico · entregador → operações · divergência, fraude, histórico e já reembolsado → antifraude · segunda tentativa → revisão de casos negados.
- **Gabarito 244** corrigido (sem açúcar = erro sem prejuízo, coerente com o caso 295).
- **Recalculado nos mesmos 100 casos** (`resultados/v7-regras-v1.6-novo2.json`, **não é medição independente**): escalou quando devia **44/44** · escalonamento 98% · categoria 96% · valor 99% · pagamento na hora 98%.
- **Pagamento na hora com as regras v1.6 (gabarito, casos 1–100):** 25 de 42 casos graves recebem algo na hora (23 em dinheiro, R$ 1.161,61). Era 26 na v1.4; caiu porque H9 (histórico) passou a esperar uma pessoa.
- **O painel e o case agora usam a v7 (100 casos novos) como número oficial**; a v4 vira histórico.
