# -*- coding: utf-8 -*-
"""Nombres de archivo, la carpeta de salida y las exportaciones que ya hay."""
import io
import json
import os
from datetime import datetime

from sa_model.exports import (dumps, ensure_folder, export_stem, exports_in, latest_html, model_stem, output_folder,
                              parse_stem, sanitize, write_text)


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
    stem = export_stem("Sucursal Reforma", when)
    assert stem == "Sucursal Reforma · 2026-10-29 0905"
    assert parse_stem(stem) == ("Sucursal Reforma", "2026-10-29 0905")
    # un modelo con el separador en su nombre sigue leyéndose
    assert parse_stem("A · B · 2026-01-01 1200") == ("A · B", "2026-01-01 1200")
    assert parse_stem("Sucursal · ayer") is None
    assert parse_stem(" · 2026-01-01 1200") is None
    assert parse_stem("Sucursal") is None


def test_output_folder():
    assert output_folder(os.path.join("C:", "Users", "x", "Documents")) == \
        os.path.join("C:", "Users", "x", "Documents", "HSBC Space Analytics")


def _export(folder, model, stamp, ext=".html", body="<html>"):
    path = os.path.join(folder, "{0} · {1}{2}".format(model, stamp, ext))
    write_text(path, body)
    return path


def test_no_folder_no_exports(tmp_path):
    assert exports_in(str(tmp_path / "no existe"), "Sucursal", ".json") == []
    assert latest_html(str(tmp_path / "no existe"), "Sucursal") is None


def test_latest_html_of_this_model(tmp_path):
    folder = str(tmp_path)
    _export(folder, "Sucursal", "2026-02-01 1000")
    newest = _export(folder, "sucursal", "2026-03-01 0900")         # sin distinguir mayúsculas, como Windows
    _export(folder, "Sucursal", "2026-09-01 0900", ext=".json", body="{}")  # un .json más nuevo no cuenta
    _export(folder, "Sucursal Norte", "2026-12-01 0900")             # otro modelo
    _export(folder, "Sucursal", "ayer")                              # no es un nombre de exportación
    assert latest_html(folder, "Sucursal") == newest
    assert [e[0] for e in exports_in(folder, "Sucursal", ".html")] == ["2026-03-01 0900", "2026-02-01 1000"]


def test_writes_utf8_without_escaping(tmp_path):
    folder = ensure_folder(str(tmp_path / "HSBC Space Analytics"))
    ensure_folder(folder)  # otra vez: ya existe
    path = os.path.join(folder, "x.json")
    write_text(path, dumps({"name": "Bóveda </script>", "n": 1.5}))
    with io.open(path, encoding="utf-8") as f:
        text = f.read()
    assert text == '{"name":"Bóveda </script>","n":1.5}'
    assert json.loads(text)["name"] == "Bóveda </script>"
