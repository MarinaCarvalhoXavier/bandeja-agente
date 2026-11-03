"""Lote 3 (casos 101-108): escritos DEPOIS que a demo achou um erro (só o lanche do combo estragou e a
regra devolveu tudo). Cobrem combos e itens compostos, que o conjunto original não tinha.
Conjunto "novo": teste limpo para a v6 (nenhum ajuste foi feito olhando estes casos).
Rodar: python3 casos/lote3.py  (depois de lote1.py e lote2.py). Gera lote3.json, lote3-revisao.csv e atualiza todos.json."""
import csv, json, os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from lote1 import P, caso, C, regra, LIMITE, pagamento
from lote2 import linha

AQUI = os.path.dirname(os.path.abspath(__file__))
COMBO = "Combo X-burguer (lanche + batata + refri)"

CASOS = [
caso(101, "combo_parcial", "pedi um x-burguer e ele veio todo amassado, tá horrível, incomível",
     [P(COMBO, 39.90)], 4.99,
     {"cats": [C("item_incompleto", "restaurante", [COMBO, 1])], "resp": "restaurante"}, urg="media",
     nota="O caso da demo: só o lanche estragou; batata e refri ok. Parte do combo = incompleto (50%), sem taxa e sem cortesia."),
caso(102, "combo_parcial", "a pizza do combo chegou virada, o recheio grudou todo na tampa. o refri veio de boa",
     [P("Combo pizza média + refri 2L", 54.90)], 6.99,
     {"cats": [C("item_incompleto", "entregador", ["Combo pizza média + refri 2L", 1])], "resp": "entregador"}, urg="media",
     nota="Parte principal do combo inutilizada no transporte = incompleto (50%)."),
caso(103, "combo_inteiro", "o refri estourou dentro da sacola e encharcou tudo, o lanche e a batata viraram uma papa. não deu pra aproveitar nada",
     [P(COMBO, 39.90)], 4.99,
     {"cats": [C("qualidade_inutilizada", "restaurante", [COMBO, 1])], "resp": "restaurante"}, urg="media",
     nota="Controle: o combo INTEIRO se perdeu = pedido inteiro perdido (combo + taxa + cortesia, com opção de reenvio)."),
caso(104, "combo_parcial", "o combo veio sem o refrigerante",
     [P(COMBO, 39.90)], 4.99,
     {"cats": [C("item_incompleto", "restaurante", [COMBO, 1])], "resp": "restaurante"}, urg="media",
     nota="Controle do caso 31 com outra parte do combo."),
caso(105, "combo_controle", "o brownie que eu pedi junto não veio, o combo veio certinho",
     [P(COMBO, 39.90), P("Brownie", 12.00)], 4.99,
     {"cats": [C("item_faltando", "restaurante", ["Brownie", 1])], "resp": "restaurante"}, urg="media",
     nota="Controle: item separado do combo faltando = item faltando (valor inteiro do brownie)."),
caso(106, "combo_parcial", "pedi o combo com coca e mandaram guaraná. não é a mesma coisa né",
     [P("Combo X-burguer com Coca-Cola", 39.90)], 4.99,
     {"cats": [C("item_detalhe", "restaurante")], "resp": "restaurante"}, urg="baixa",
     nota="v7: bebida trocada no combo = erro sem prejuízo (cupom + desculpas)."),
caso(107, "combo_saude", "a salada da marmita fit veio com cheiro de estragado, nem encostei. o frango e o arroz tavam ok",
     [P("Marmita fit (frango + arroz + salada)", 29.90)], 4.99,
     {"cats": [C("qualidade_saude", "restaurante", ["Marmita fit (frango + arroz + salada)", 1])], "resp": "restaurante"}, urg="alta", humano=["H2"],
     nota="Saúde em parte de um item composto: vai para uma pessoa; pela v1.4 a marmita (R$ 29,90) é devolvida na hora."),
caso(108, "combo_parcial", "o combo veio sem a batata e o lanche chegou frio",
     [P(COMBO, 39.90)], 4.99,
     {"cats": [C("item_incompleto", "restaurante", [COMBO, 1]), C("qualidade_leve", "restaurante")], "resp": "restaurante"}, urg="media",
     nota="Duas categorias: incompleto (50%) + cupom pela comida fria."),
]

def main():
    linhas = []
    for c in CASOS:
        r = regra(c); g = c["gabarito"]
        c["conjunto"] = "novo"
        assert (r["dinheiro"] > LIMITE) == ("H1" in g["gatilhos"]), (c["id"], r)
        g["vai_para_humano"] = bool(g["gatilhos"]); g["esperado_regra"] = r; r.update(pagamento(c, r))
        l = linha(c, r); l["PAGO_NA_HORA"] = f'R$ {r["pago_dinheiro"]:.2f}' + (f' + cupom R$ {r["pago_cupom"]}' if r["pago_cupom"] else "")
        linhas.append(l)
    json.dump(CASOS, open(os.path.join(AQUI, "lote3.json"), "w", encoding="utf-8"), ensure_ascii=False, indent=1)
    with open(os.path.join(AQUI, "lote3-revisao.csv"), "w", encoding="utf-8-sig", newline="") as f:
        w = csv.DictWriter(f, fieldnames=list(linhas[0].keys())); w.writeheader(); w.writerows(linhas)
    todos = [c for c in json.load(open(os.path.join(AQUI, "todos.json"), encoding="utf-8")) if c["id"] <= 100] + CASOS
    json.dump(todos, open(os.path.join(AQUI, "todos.json"), "w", encoding="utf-8"), ensure_ascii=False, indent=1)
    for l in linhas: print(l["id"], l["GAB_categorias"][:60], "|", l["REGRA_dinheiro"], l["REGRA_cupom"], "|", l["GAB_vai_para_pessoa"], "| agora:", l["PAGO_NA_HORA"])

if __name__ == "__main__":
    main()
