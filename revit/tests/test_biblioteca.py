# -*- coding: utf-8 -*-
"""La librería SA_ (standard/biblioteca.json), el archivo de parámetros compartidos y docs/parametros-sa.md dicen lo mismo."""
import io, os, sys, uuid

AQUI = os.path.dirname(os.path.abspath(__file__))
STD = os.path.join(os.path.dirname(AQUI), "standard")
DOC = os.path.join(os.path.dirname(os.path.dirname(AQUI)), "docs", "parametros-sa.md")
sys.path.insert(0, STD)
import generar  # noqa: E402


def test_cada_parametro_esta_completo():
    lib = generar.biblioteca()
    nombres = [p["nombre"] for p in lib["parametros"]]
    assert len(nombres) == len(set(nombres)) and all(n.startswith("SA_") for n in nombres)
    for p in lib["parametros"]:
        assert p["tipo"] in ("TEXT", "NUMBER", "INTEGER"), p["nombre"]
        assert p["va_en"] in ("tipo", "instancia", "tipo o instancia"), p["nombre"]
        assert p["que_es"] and p["alimenta"] and p["valores"], p["nombre"]
        for parte in p["categorias"].split("+"):
            assert parte in lib["categorias"], (p["nombre"], parte)


def test_el_txt_esta_al_dia_y_los_guid_son_estables():
    lib = generar.biblioteca()
    with io.open(os.path.join(STD, "SA_Parametros.txt"), encoding="utf-8", newline="") as f:
        assert f.read() == generar.txt(lib), "corre: python revit/standard/generar.py"
    for p in lib["parametros"]:
        assert generar.guid(p["nombre"]) == str(uuid.uuid5(generar.NS, "hsbc-space-analytics/" + p["nombre"]))
    assert len({generar.guid(p["nombre"]) for p in lib["parametros"]}) == len(lib["parametros"])


def test_el_documento_menciona_todos_los_parametros():
    with io.open(DOC, encoding="utf-8") as f:
        doc = f.read()
    for p in generar.biblioteca()["parametros"]:
        assert "`%s`" % p["nombre"] in doc, p["nombre"]
