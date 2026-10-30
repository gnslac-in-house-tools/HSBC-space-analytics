# -*- coding: utf-8 -*-
"""Dónde y con qué nombre quedan las exportaciones, y cuáles hay ya (docs/space-model.md, "El HTML portátil").

Cada exportación son dos archivos con el mismo nombre en `Documentos\\HSBC Space Analytics\\`:
`<modelo sin .rvt> · <etapa> · <aaaa-mm-dd hhmm>.json` y `.html`. El nombre se sanea para Windows.
"""
from __future__ import absolute_import, division, print_function, unicode_literals

import io
import json
import os
import re

from sa_model import SCHEMA, STAGES

FOLDER_NAME = "HSBC Space Analytics"
SEPARATOR = " · "
STAMP_FORMAT = "%Y-%m-%d %H%M"
_STAMP = re.compile(r"^\d{4}-\d{2}-\d{2} \d{4}$")
_INVALID = re.compile(r'[<>:"/\\|?*\x00-\x1f]')
_RESERVED = set(["CON", "PRN", "AUX", "NUL"] + ["COM%d" % i for i in range(1, 10)] + ["LPT%d" % i for i in range(1, 10)])


def sanitize(name):
    """Un nombre válido de archivo en Windows: sin < > : " / \\ | ? * ni caracteres de control (cambiados por _),
    sin puntos ni espacios al final y sin nombres reservados (CON, NUL, COM1…)."""
    clean = _INVALID.sub("_", name or "").strip().rstrip(". ")
    if not clean:
        return "modelo"
    if clean.split(".")[0].upper() in _RESERVED:
        clean = "_" + clean
    return clean


def model_stem(file_name):
    """El nombre del modelo en los archivos: el del .rvt sin la extensión, saneado."""
    base = os.path.basename((file_name or "").replace("\\", "/").rstrip("/")) if file_name else ""
    if base.lower().endswith(".rvt"):
        base = base[:-4]
    return sanitize(base)


def stamp(when):
    """aaaa-mm-dd hhmm (sin dos puntos: Windows no los admite en un nombre)."""
    return when.strftime(STAMP_FORMAT)


def export_stem(model, stage, when):
    """`<modelo> · <etapa> · <aaaa-mm-dd hhmm>`, saneado; `model` ya es un model_stem."""
    return sanitize(SEPARATOR.join([model, stage, stamp(when)]))


def parse_stem(stem):
    """(modelo, etapa, sello) de un nombre de exportación sin extensión; None si no lo es."""
    parts = stem.rsplit(SEPARATOR, 2)
    if len(parts) != 3 or parts[1] not in STAGES or not _STAMP.match(parts[2]):
        return None
    return parts[0], parts[1], parts[2]


def output_folder(documents):
    """`<Documentos>\\HSBC Space Analytics`."""
    return os.path.join(documents, FOLDER_NAME)


def ensure_folder(folder):
    if not os.path.isdir(folder):
        os.makedirs(folder)
    return folder


def exports_in(folder, model, ext):
    """Las exportaciones de `model` con extensión `ext` (".json", ".html") en `folder`, de la más reciente a la más
    antigua: [(sello, etapa, ruta)]. El modelo se compara sin distinguir mayúsculas, como Windows."""
    if not folder or not os.path.isdir(folder):
        return []
    found = []
    for name in os.listdir(folder):
        stem, e = os.path.splitext(name)
        if e.lower() != ext.lower():
            continue
        parsed = parse_stem(stem)
        if parsed is None or parsed[0].lower() != model.lower():
            continue
        found.append((parsed[2], parsed[1], os.path.join(folder, name)))
    found.sort(key=lambda f: (f[0], f[2]), reverse=True)
    return found


def latest_html(folder, model):
    """La ruta del .html más reciente de `model`; None si no hay."""
    found = exports_in(folder, model, ".html")
    return found[0][2] if found else None


def read_json(path):
    with io.open(path, encoding="utf-8-sig") as f:
        return json.load(f)


def previous_models(folder, model, stage, file_name=None):
    """Las exportaciones con que comparar: de cada etapa distinta de `stage`, la última .json de `model` en `folder`
    que se pueda leer, sea de este contrato y (si se da `file_name`) venga del mismo archivo de Revit. En el orden de
    las etapas (Concepto, Esquemático, Desarrollo, Documentación)."""
    by_stage = {}
    for _, st, path in exports_in(folder, model, ".json"):
        if st == stage or st in by_stage:
            continue
        try:
            data = read_json(path)
        except Exception:
            continue
        if not isinstance(data, dict) or data.get("schema") != SCHEMA:
            continue
        src = data.get("source") or {}
        if file_name is not None and (src.get("file") or "").lower() != file_name.lower():
            continue
        by_stage[st] = data
    return [by_stage[s] for s in STAGES if s in by_stage]


def dumps(document):
    """El .json: UTF-8 sin escapar lo que no es ASCII, compacto (la geometría pesa)."""
    return json.dumps(document, ensure_ascii=False, separators=(",", ":"), sort_keys=False)


def write_text(path, text):
    if isinstance(text, bytes):  # json.dumps de CPython 2 puede dar bytes; IronPython y CPython 3, texto
        text = text.decode("utf-8")
    with io.open(path, "w", encoding="utf-8", newline="\n") as f:
        f.write(text)
