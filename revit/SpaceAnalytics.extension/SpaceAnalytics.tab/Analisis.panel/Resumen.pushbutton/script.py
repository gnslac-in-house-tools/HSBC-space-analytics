# -*- coding: utf-8 -*-
"""Resumen: el HTML más reciente de este modelo en el resumen compacto de la app (#resumen=1), en una ventana angosta
como un panel: índice, pilares, indicadores fuera de meta, rooms más bajos y el espacio. Lo calcula el motor de la app
con los datos de esa exportación; si el modelo cambió, se exporta de nuevo."""
from __future__ import absolute_import, division, print_function, unicode_literals

from pyrevit import forms, revit

from sa_model import exports, launch
from sa_revit import shell
from sa_revit.common import model_name

TITLE = "Space Analytics · Resumen"


def main():
    doc = revit.doc
    folder = exports.output_folder(shell.documents_folder())
    path = exports.latest_html(folder, exports.model_stem(model_name(doc))) if doc is not None else None
    if not path:
        forms.alert("Todavía no hay exportaciones de este modelo.", sub_msg="Usa Exportar primero.", title=TITLE)
        return
    shell.open_view(path, launch.SUMMARY, launch.SUMMARY_SIZE)


main()
