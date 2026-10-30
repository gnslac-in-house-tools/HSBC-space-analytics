# -*- coding: utf-8 -*-
"""Abrir: el HTML más reciente que Exportar escribió de este modelo; si no hay, ofrece la app vacía."""
from __future__ import absolute_import, division, print_function, unicode_literals

from pyrevit import forms, revit

from sa_model import bundle, exports
from sa_revit import shell
from sa_revit.common import model_name

TITLE = "Space Analytics · Abrir"
EMPTY = "Abrir la app vacía"


def main():
    doc = revit.doc
    folder = exports.output_folder(shell.documents_folder())
    model = exports.model_stem(model_name(doc)) if doc is not None else ""
    path = exports.latest_html(folder, model) if model else None
    if path:
        shell.open_path(path)
        return
    app = bundle.find_app()
    if app is None:
        forms.alert("No hay exportaciones de este modelo en:\n{0}".format(folder),
                    sub_msg="Tampoco se encontró la app (app/index.html). Usa Exportar.", title=TITLE)
        return
    picked = forms.alert("No hay exportaciones de este modelo todavía.",
                         sub_msg="Se buscaron en:\n{0}\n\nUsa Exportar, o abre la app vacía y arrastra uno o varios "
                                 ".json.".format(folder),
                         options=[EMPTY, "Cerrar"], title=TITLE)
    if picked == EMPTY:
        shell.open_path(app)


main()
