# -*- coding: utf-8 -*-
"""Nombres de archivo, la carpeta de salida y qué exportaciones previas acompañan a una nueva en el HTML."""
import io
import json
import os
from datetime import datetime

from sa_model import SCHEMA
from sa_model.exports import (dumps, ensure_folder, export_stem, exports_in, latest_html, model_stem, output_folder,
                              parse_stem, previous_models, sanitize, write_text)


def test_sanitize_windows_names():
    assert sanitize('A<b>c:d"e/f\\g|h?i*j') == "A_b_c_d_e_f_g_h_i_j"
    assert sanitize("tab\there") == "tab_here"
    assert sanitize("final. ") == "final"
    assert sanitize("CON") == "_CON"
    assert sanitize("com1.algo") == "_com1.algo"
    assert sanitize("") == "modelo"
    assert sanitize("Sucursal Reforma · Esquemático") == "Sucursal Reforma · Esquemático"


def test_model_stem_drops_the_rvt_and_the_folder():
    assert model_stem("Sucursal Reforma.rvt") == "Sucursal Reforma"
    assert model_stem("Sucursal.RVT") == "Sucursal"
    assert model_stem("C:\\Proyectos\\HSBC\\Sucursal: Centro.rvt") == "Sucursal_ Centro"
    assert model_stem("Modelo sin guardar") == "Modelo sin guardar"


def test_the_export_name_and_back():
    when = datetime(2026, 10, 29, 9, 5)
    stem = export_stem("Sucursal Reforma", "Esquemático", when)
    assert stem == "Sucursal Reforma · Esquemático · 2026-10-29 0905"
    assert parse_stem(stem) == ("Sucursal Reforma", "Esquemático", "2026-10-29 0905")
    # un modelo con el separador en su nombre sigue leyéndose
    assert parse_stem("A · B · Concepto · 2026-01-01 1200") == ("A · B", "Concepto", "2026-01-01 1200")
    assert parse_stem("Sucursal · Otra etapa · 2026-01-01 1200") is None
    assert parse_stem("Sucursal · Concepto · ayer") is None
    assert parse_stem("Sucursal") is None


def test_output_folder():
    assert output_folder(os.path.join("C:", "Users", "x", "Documents")) == \
        os.path.join("C:", "Users", "x", "Documents", "HSBC Space Analytics")


def _export(folder, model, stage, stamp, file_name="Sucursal.rvt", schema=SCHEMA, ext=".json", body=None):
    path = os.path.join(folder, "{0} · {1} · {2}{3}".format(model, stage, stamp, ext))
    if body is None:
        body = dumps({"schema": schema, "source": {"file": file_name, "stage": stage, "exported_at": stamp}})
    write_text(path, body)
    return path


def test_previous_models_takes_the_latest_of_each_other_stage(tmp_path):
    folder = str(tmp_path)
    _export(folder, "Sucursal", "Concepto", "2026-01-10 0900")
    _export(folder, "Sucursal", "Concepto", "2026-02-01 1000")       # la última de Concepto
    _export(folder, "Sucursal", "Esquemático", "2026-03-01 1000")    # la etapa que se exporta ahora: fuera
    _export(folder, "Sucursal", "Documentación", "2026-02-15 0800")
    _export(folder, "Sucursal", "Desarrollo", "2026-04-01 1200", body="{ roto")             # ilegible: la anterior
    _export(folder, "Sucursal", "Desarrollo", "2026-03-20 1200")
    _export(folder, "Sucursal", "Documentación", "2026-05-01 0800", schema="otro@2")         # otro contrato: fuera
    _export(folder, "Otra sucursal", "Concepto", "2026-06-01 0800")                        # otro modelo
    _export(folder, "Sucursal", "Concepto", "2026-07-01 0800", ext=".html", body="<html>")  # no es .json
    found = previous_models(folder, "Sucursal", "Esquemático", "Sucursal.rvt")
    assert [(m["source"]["stage"], m["source"]["exported_at"]) for m in found] == [
        ("Concepto", "2026-02-01 1000"), ("Desarrollo", "2026-03-20 1200"), ("Documentación", "2026-02-15 0800")]


def test_previous_models_of_the_same_revit_file_only(tmp_path):
    folder = str(tmp_path)
    _export(folder, "Sucursal", "Concepto", "2026-02-01 1000", file_name="sucursal.RVT")  # el mismo, en otra caja
    _export(folder, "Sucursal", "Desarrollo", "2026-02-01 1000", file_name="Sucursal.rfa")
    found = previous_models(folder, "sucursal", "Esquemático", "Sucursal.rvt")
    assert [m["source"]["stage"] for m in found] == ["Concepto"]
    assert len(previous_models(folder, "Sucursal", "Esquemático")) == 2  # sin file_name no filtra por archivo


def test_no_folder_no_previous(tmp_path):
    assert previous_models(str(tmp_path / "no existe"), "Sucursal", "Concepto") == []
    assert latest_html(str(tmp_path / "no existe"), "Sucursal") is None


def test_latest_html_of_this_model(tmp_path):
    folder = str(tmp_path)
    _export(folder, "Sucursal", "Concepto", "2026-02-01 1000", ext=".html", body="<html>")
    newest = _export(folder, "Sucursal", "Desarrollo", "2026-03-01 0900", ext=".html", body="<html>")
    _export(folder, "Sucursal", "Esquemático", "2026-09-01 0900")  # un .json más nuevo no cuenta
    _export(folder, "Sucursal Norte", "Concepto", "2026-12-01 0900", ext=".html", body="<html>")
    assert latest_html(folder, "Sucursal") == newest
    assert [e[1] for e in exports_in(folder, "Sucursal", ".html")] == ["Desarrollo", "Concepto"]


def test_writes_utf8_without_escaping(tmp_path):
    folder = ensure_folder(str(tmp_path / "HSBC Space Analytics"))
    ensure_folder(folder)  # otra vez: ya existe
    path = os.path.join(folder, "x.json")
    write_text(path, dumps({"name": "Bóveda </script>", "n": 1.5}))
    with io.open(path, encoding="utf-8") as f:
        text = f.read()
    assert text == '{"name":"Bóveda </script>","n":1.5}'
    assert json.loads(text)["name"] == "Bóveda </script>"
