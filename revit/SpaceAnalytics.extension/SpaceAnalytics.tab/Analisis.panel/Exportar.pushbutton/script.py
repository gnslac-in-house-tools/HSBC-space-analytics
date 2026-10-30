# -*- coding: utf-8 -*-
"""Exportar: el modelo (y los vínculos que se elijan) a space-model.json más el HTML portátil, y abre el HTML.

Solo lee el modelo: no abre transacciones. Los archivos van a Documentos\\HSBC Space Analytics\\ con el nombre
`<modelo> · <etapa> · <aaaa-mm-dd hhmm>` (docs/space-model.md).
"""
from __future__ import absolute_import, division, print_function, unicode_literals

import os
from datetime import datetime

from pyrevit import forms, revit

from sa_model import STAGES
from sa_model import bundle, document, exports, text
from sa_revit import collect, shell
from sa_revit.common import final_phase, model_name, name_of

TITLE = "Space Analytics · Exportar"


def pick_links(doc):
    """Los vínculos cargados que el usuario quiere incluir (todos marcados por omisión); None si cancela."""
    links = collect.loaded_links(doc)
    if not links:
        return []
    items = [forms.TemplateListItem(label, checked=True) for label, _ in links]
    picked = forms.SelectFromList.show(items, title="{0} · Vínculos a incluir".format(TITLE), button_name="Incluir",
                                       multiselect=True)
    if picked is None:
        return None
    picked = set(picked)
    return [inst for label, inst in links if label in picked]


def run_collect(doc, links):
    with forms.ProgressBar(title="Leyendo el modelo… {value} de {max_value}", cancellable=True, step=10) as pb:
        def tick(done, total):
            if pb.cancelled:
                raise collect.Cancelled()
            pb.update_progress(done, max(total, 1))
        return collect.collect(doc, links, tick)


def main():
    doc = revit.doc
    if doc is None or doc.IsFamilyDocument:
        forms.alert("Abre un modelo de proyecto (no una familia) para exportar.", title=TITLE)
        return

    stage = forms.CommandSwitchWindow.show(STAGES, message="¿En qué etapa está este modelo?")
    if not stage:
        return
    links = pick_links(doc)
    if links is None:
        return

    try:
        result = run_collect(doc, links)
    except collect.Cancelled:
        forms.alert("Exportación cancelada. No se escribió nada.", title=TITLE)
        return

    when = datetime.now()
    file_name = model_name(doc)
    phase = final_phase(doc)
    src = document.source(doc.Application.VersionNumber, file_name, stage, name_of(phase) if phase else "",
                          [model_name(inst.GetLinkDocument()) for inst in links], when)
    model, dropped = document.build(src, result.raw)
    for key, n in result.dropped.items():
        dropped[key] = dropped.get(key, 0) + n

    model_stem = exports.model_stem(file_name)
    folder = exports.output_folder(shell.documents_folder())
    stem = exports.export_stem(model_stem, stage, when)
    json_path = os.path.join(folder, stem + ".json")
    try:
        exports.ensure_folder(folder)
        exports.write_text(json_path, exports.dumps(model))
    except (IOError, OSError) as ex:
        forms.alert("No se pudo escribir la exportación.", sub_msg="{0}\n\n{1}".format(json_path, ex), title=TITLE)
        return
    files = [json_path]

    html_path, note, compared = None, None, []
    app = bundle.find_app()
    if app is None:
        note = ("No se encontró la app (app/index.html junto a la extensión ni en la raíz del repo): "
                "solo se escribió el .json. Ábrelo arrastrándolo a la app.")
    else:
        previous = exports.previous_models(folder, model_stem, stage, file_name)
        compared = [p["source"]["stage"] for p in previous]
        try:
            html, _, kept = bundle.bundle_file(app, [model] + previous)
            html_path = os.path.join(folder, stem + ".html")
            exports.write_text(html_path, html)
            files.append(html_path)
            if kept:
                note = "Scripts que el HTML sigue pidiendo fuera (no están en app/): {0}.".format(", ".join(kept))
        except (bundle.BundleError, IOError, OSError) as ex:
            html_path = None
            note = "No se pudo armar el HTML: {0}. Solo se escribió el .json.".format(ex)

    msg, detail = text.summary(model, dropped, result.failures, files, compared, note, result.skipped)
    forms.alert(msg, sub_msg=detail, title=TITLE, warn_icon=bool(text.warnings(model, dropped, result.failures)))
    if html_path:
        shell.open_path(html_path)


main()
