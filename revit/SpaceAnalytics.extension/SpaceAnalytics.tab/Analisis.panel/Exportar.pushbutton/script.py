# -*- coding: utf-8 -*-
"""Exportar: el modelo (y los vínculos que se elijan) a space-model.json más el HTML portátil.

Todo pasa en una ventana con el estilo de la app (export.xaml y lib/export_window.py): se eligen los vínculos, se ve
el avance y al final lo exportado, con los botones para abrir el HTML en la app, en el resumen o en la presentación. Solo lee el modelo: no abre transacciones.
Los archivos van a Documentos\\HSBC Space Analytics\\ con el nombre `<modelo> · <aaaa-mm-dd hhmm>`
(docs/space-model.md).
"""
from __future__ import absolute_import, division, print_function, unicode_literals

import os
from datetime import datetime

from pyrevit import forms, revit, script

from sa_model import bundle, document, exports, launch, text
from sa_revit import collect, shell

import export_window  # lib/ del botón: la interfaz vive en los botones
from sa_revit.common import final_phase, model_name, name_of

TITLE = "Space Analytics · Exportar"


def export(doc, links, tick):
    """Lee el modelo, escribe el .json y el HTML y devuelve el informe para la ventana (text.report más 'html')."""
    result = collect.collect(doc, links, tick)
    when = datetime.now()
    file_name = model_name(doc)
    phase = final_phase(doc)
    src = document.source(doc.Application.VersionNumber, file_name, name_of(phase) if phase else "",
                          [model_name(inst.GetLinkDocument()) for inst in links], when)
    model, dropped = document.build(src, result.raw)
    for key, n in result.dropped.items():
        dropped[key] = dropped.get(key, 0) + n

    model_stem = exports.model_stem(file_name)
    folder = exports.output_folder(shell.documents_folder())
    stem = exports.export_stem(model_stem, when)
    json_path = os.path.join(folder, stem + ".json")
    try:
        exports.ensure_folder(folder)
        exports.write_text(json_path, exports.dumps(model))
    except (IOError, OSError) as ex:
        raise IOError("No se pudo escribir {0}: {1}".format(json_path, ex))
    files = [json_path]

    html_path, note = None, None
    app = bundle.find_app()
    if app is None:
        note = ("No se encontró la app (app/index.html junto a la extensión ni en la raíz del repo): "
                "solo se escribió el .json. Ábrelo arrastrándolo a la app.")
    else:
        try:
            html, _, kept = bundle.bundle_file(app, model)
            html_path = os.path.join(folder, stem + ".html")
            exports.write_text(html_path, html)
            files.append(html_path)
            if kept:
                note = "Scripts que el HTML sigue pidiendo fuera (no están en app/): {0}.".format(", ".join(kept))
        except (bundle.BundleError, IOError, OSError) as ex:
            html_path = None
            note = "No se pudo armar el HTML: {0}. Solo se escribió el .json.".format(ex)

    report = text.report(model, dropped, result.failures, files, note, result.skipped)
    report["html"] = html_path
    return report


def main():
    doc = revit.doc
    if doc is None or doc.IsFamilyDocument:
        forms.alert("Abre un modelo de proyecto (no una familia) para exportar.", title=TITLE)
        return

    file_name = model_name(doc)
    folder = exports.output_folder(shell.documents_folder())
    found = exports.exports_in(folder, exports.model_stem(file_name), ".json")
    hint = "Última: {0}".format(found[0][0]) if found else "Primera exportación de este modelo."

    win = export_window.ExportWindow(script.get_bundle_file("export.xaml"), script.get_bundle_file("mark.png"),
                                     "{0} · Revit {1}".format(file_name, doc.Application.VersionNumber),
                                     hint, collect.loaded_links(doc), folder,
                                     lambda links, tick: export(doc, links, tick), collect.Cancelled)
    win.show_dialog()
    if win.open_view == "summary":
        shell.open_view(win.open_path, launch.SUMMARY, launch.SUMMARY_SIZE)
    elif win.open_view == "present":
        shell.open_view(win.open_path, launch.PRESENT)
    elif win.open_path:
        shell.open_path(win.open_path)


main()
