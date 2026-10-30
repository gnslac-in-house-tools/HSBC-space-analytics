# -*- coding: utf-8 -*-
"""Presentar: el HTML más reciente de este modelo abierto directo en la presentación (#present=1), en una ventana
maximizada sin barras. ← → para avanzar, Esc para volver a la app."""
from __future__ import absolute_import, division, print_function, unicode_literals

from pyrevit import forms, revit

from sa_model import exports, launch
from sa_revit import shell
from sa_revit.common import model_name

TITLE = "Space Analytics · Presentar"


def main():
    doc = revit.doc
    folder = exports.output_folder(shell.documents_folder())
    path = exports.latest_html(folder, exports.model_stem(model_name(doc))) if doc is not None else None
    if not path:
        forms.alert("Todavía no hay exportaciones de este modelo.", sub_msg="Usa Exportar primero.", title=TITLE)
        return
    shell.open_view(path, launch.PRESENT)


main()
