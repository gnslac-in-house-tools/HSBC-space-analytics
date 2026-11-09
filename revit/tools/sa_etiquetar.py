# -*- coding: utf-8 -*-
"""Etiqueta un modelo de Revit con la librería de parámetros SA_ (revit/standard/biblioteca.json) y lo exporta.

Corre dentro de Revit, sin ventanas, con el CLI de pyRevit (lo prepara y lo lanza tools/etiquetar.py):

    pyrevit run revit/tools/sa_etiquetar.py <modelo.rvt> --revit=2027

Lee su configuración de %LOCALAPPDATA%\HSBC Space Analytics\etiquetar\config.json:
    modo     "inventario" (solo cuenta qué trae el modelo) o "etiquetar" (crea y asigna los parámetros, guarda una copia
             del .rvt con ellos y exporta el space-model.json)
    lib      carpeta lib/ de la extensión (sa_model, sa_revit)
    estandar carpeta revit/standard (biblioteca.json y SA_Parametros.txt)
    reglas   .json con las reglas de este modelo (solo en "etiquetar")
    salida   carpeta donde escribe

El modelo original no se toca: el .rvt etiquetado se guarda como copia. Todo queda en <salida>\\log.txt.
IronPython 2.7: nada de f-strings.
"""
from __future__ import absolute_import, division, print_function, unicode_literals

import clr
clr.AddReference("RevitAPI")
clr.AddReference("RevitAPIUI")
clr.AddReference("System")

import io
import json
import os
import re
import sys
import traceback
from datetime import datetime

from System import Guid
from Autodesk.Revit.DB import (BuiltInCategory, BuiltInParameter, ExternalDefinitionCreationOptions, FilteredElementCollector,
                               GroupTypeId, SaveAsOptions, SpecTypeId, StorageType, Transaction)

# pyRevit cambia %TEMP% en cada corrida: la configuración va en una carpeta fija
CONFIG = os.path.join(os.environ.get("LOCALAPPDATA", "."), "HSBC Space Analytics", "etiquetar", "config.json")
LOG = []


def log(*parts):
    line = " ".join(u"{0}".format(p) for p in parts)
    LOG.append(line)


def read_json(path):
    with io.open(path, encoding="utf-8") as f:
        return json.load(f)


def write_text(path, text):
    with io.open(path, "w", encoding="utf-8", newline="") as f:
        f.write(text)


def eid(element_id):
    """El número de un ElementId: .Value desde Revit 2024, .IntegerValue antes."""
    return element_id.Value if hasattr(element_id, "Value") else element_id.IntegerValue


def bic(name):
    return getattr(BuiltInCategory, name)


def get_doc(path):
    """El documento del modelo: el que Revit ya tenga abierto con ese nombre o, si no, lo abre (sube de versión en memoria)."""
    uiapp = __revit__  # noqa: F821  (lo pone pyRevit)
    app = uiapp.Application
    want = os.path.basename(path).lower()
    for d in app.Documents:
        if not d.IsLinked and not d.IsFamilyDocument and (d.PathName or "").lower().endswith(want):
            return app, d
    log("abriendo", path)
    return app, app.OpenDocumentFile(path)


def type_name(t):
    p = t.get_Parameter(BuiltInParameter.SYMBOL_NAME_PARAM)
    return (p.AsString() if p is not None else None) or ""


def room_name(r):
    p = r.get_Parameter(BuiltInParameter.ROOM_NAME)
    return (p.AsString() if p is not None else None) or ""


def elements(doc, cat_name):
    return list(FilteredElementCollector(doc).OfCategory(bic(cat_name)).WhereElementIsNotElementType())


# ------------------------------------------------------------------ inventario
def inventario(doc, cfg, lib):
    out = {"archivo": doc.Title, "version": doc.Application.VersionNumber, "niveles": [], "rooms": [], "categorias": {}}
    from Autodesk.Revit.DB import Level
    for lv in FilteredElementCollector(doc).OfClass(Level):
        out["niveles"].append([lv.Name, round(lv.ProjectElevation * 0.3048, 2)])
    for r in elements(doc, "OST_Rooms"):
        if r.Area > 0:
            lvl = doc.GetElement(r.LevelId)
            out["rooms"].append([room_name(r), r.Number, round(r.Area * 0.092903, 1), lvl.Name if lvl is not None else ""])
    cats = set()
    for k in ("obstaculos", "puertas", "muros"):
        cats.update(lib["categorias"][k])
    cats.update(["OST_Windows", "OST_Floors", "OST_Stairs", "OST_Ramps"])
    for c in sorted(cats):
        try:
            els = elements(doc, c)
        except Exception as ex:  # categoría que esta versión no tiene
            log("sin categoría", c, ex)
            continue
        fams = {}
        for e in els:
            t = doc.GetElement(e.GetTypeId())
            key = u"{0} | {1}".format(getattr(t, "FamilyName", "") if t is not None else "", type_name(t) if t is not None else "")
            fams[key] = fams.get(key, 0) + 1
        if fams:
            out["categorias"][c] = fams
    write_text(os.path.join(cfg["salida"], "inventario.json"), json.dumps(out, ensure_ascii=False, indent=1))
    log("inventario:", len(out["rooms"]), "rooms,", sum(len(v) for v in out["categorias"].values()), "tipos")


# ------------------------------------------------------------------ parámetros
def crear_parametros(app, doc, cfg, lib):
    """Crea los parámetros compartidos de la librería (con su GUID) y los vincula a sus categorías."""
    sys.path.insert(0, cfg["estandar"])
    import generar  # noqa: E402  (revit/standard/generar.py: el GUID sale del nombre)
    tmp = os.path.join(cfg["salida"], "_sa_tmp_parametros.txt")
    write_text(tmp, "# This is a Revit shared parameter file.\r\n*META\tVERSION\tMINVERSION\r\nMETA\t2\t1\r\n*GROUP\tID\tNAME\r\n"
                    "*PARAM\tGUID\tNAME\tDATATYPE\tDATACATEGORY\tGROUP\tVISIBLE\tDESCRIPTION\tUSERMODIFIABLE\tHIDEWHENNOVALUE\r\n")
    old = app.SharedParametersFilename
    app.SharedParametersFilename = tmp
    spec = {"TEXT": SpecTypeId.String.Text, "NUMBER": SpecTypeId.Number, "INTEGER": SpecTypeId.Int.Integer}
    try:
        deffile = app.OpenSharedParameterFile()
        group = deffile.Groups.Create(lib["grupo"])
        t = Transaction(doc, "Space Analytics: parámetros SA_")
        t.Start()
        try:
            for p in lib["parametros"]:
                opts = ExternalDefinitionCreationOptions(p["nombre"], spec[p["tipo"]])
                opts.GUID = Guid(generar.guid(p["nombre"]))
                opts.Description = p["que_es"]
                opts.UserModifiable = True
                dfn = group.Definitions.Create(opts)
                cats = app.Create.NewCategorySet()
                names = []
                for part in p["categorias"].split("+"):
                    names.extend(lib["categorias"][part])
                for n in names:
                    c = doc.Settings.Categories.get_Item(bic(n))
                    if c is not None and c.AllowsBoundParameters:
                        cats.Insert(c)
                por_tipo = p["va_en"] == "tipo"
                binding = app.Create.NewTypeBinding(cats) if por_tipo else app.Create.NewInstanceBinding(cats)
                if doc.ParameterBindings.Contains(dfn):
                    doc.ParameterBindings.ReInsert(dfn, binding, GroupTypeId.Data)
                else:
                    doc.ParameterBindings.Insert(dfn, binding, GroupTypeId.Data)
                log("parámetro", p["nombre"], "en", cats.Size, "categorías,", "tipo" if por_tipo else "instancia")
            t.Commit()
        except Exception:
            t.RollBack()
            raise
    finally:
        app.SharedParametersFilename = old


def poner(param, value):
    if param is None or param.IsReadOnly:
        return False
    st = param.StorageType
    if st == StorageType.String:
        return param.Set(u"{0}".format(value))
    if st == StorageType.Double:
        return param.Set(float(value))
    if st == StorageType.Integer:
        return param.Set(int(value))
    return False


def aplicar_reglas(doc, reglas, lib):
    """Cada regla: {"en": [categorías] | "rooms", "familia": regex, "tipo": regex, "nombre": regex (rooms), "param": {...}}.
    Los parámetros de tipo se ponen una vez por tipo; los de instancia, en cada elemento que cumple."""
    scope = dict((p["nombre"], p["va_en"]) for p in lib["parametros"])
    cuenta = []
    for rg in reglas:
        hechos, vistos = 0, set()
        en = rg["en"] if isinstance(rg["en"], list) else [rg["en"]]
        for cat in en:
            for e in elements(doc, "OST_Rooms" if cat == "rooms" else cat):
                if cat == "rooms":
                    if e.Area <= 0 or not re.search(rg["nombre"], room_name(e), re.I):
                        continue
                    for k, v in rg["param"].items():
                        hechos += 1 if poner(e.LookupParameter(k), v) else 0
                    continue
                t = doc.GetElement(e.GetTypeId())
                if t is None:
                    continue
                if not re.search(rg.get("familia", "."), getattr(t, "FamilyName", "") or "", re.I):
                    continue
                if not re.search(rg.get("tipo", "."), type_name(t), re.I):
                    continue
                for k, v in rg["param"].items():
                    if scope.get(k) == "tipo":
                        if (eid(t.Id), k) in vistos:
                            continue
                        vistos.add((eid(t.Id), k))
                        hechos += 1 if poner(t.LookupParameter(k), v) else 0
                    else:
                        hechos += 1 if poner(e.LookupParameter(k), v) else 0
        cuenta.append((rg.get("nota", ""), hechos))
        log("regla:", rg.get("nota", rg["param"]), "->", hechos, "valores puestos")
    return cuenta


# ------------------------------------------------------------------ exportar
def exportar(doc, cfg, stem):
    sys.path.insert(0, cfg["lib"])
    from sa_model import document, exports
    from sa_revit import collect
    from sa_revit.common import final_phase, model_name, name_of
    result = collect.collect(doc, [], None)
    phase = final_phase(doc)
    src = document.source(doc.Application.VersionNumber, model_name(doc), name_of(phase) if phase else "", [], datetime.now())
    model, dropped = document.build(src, result.raw)
    path = os.path.join(cfg["salida"], stem + ".json")
    exports.write_text(path, exports.dumps(model))
    log("exportado:", path, "| descartados:", dropped, result.dropped)
    log("omitidos:", result.skipped, "| fallos:", len(result.failures))
    for f in result.failures[:8]:
        log("  fallo", f)
    return path


def main():
    cfg = read_json(CONFIG)
    if not os.path.isdir(cfg["salida"]):
        os.makedirs(cfg["salida"])
    try:
        app, doc = get_doc(cfg["modelo"])
        log("modelo:", doc.Title, "| Revit", app.VersionNumber, "| modo", cfg["modo"])
        lib = read_json(os.path.join(cfg["estandar"], "biblioteca.json"))
        stem = re.sub(r"[^\w\-]+", "_", re.sub(r"\.rvt$", "", doc.Title, flags=re.I))
        if cfg["modo"] == "inventario":
            inventario(doc, cfg, lib)
        else:
            crear_parametros(app, doc, cfg, lib)
            t = Transaction(doc, "Space Analytics: etiquetar")
            t.Start()
            try:
                aplicar_reglas(doc, read_json(cfg["reglas"])["reglas"], lib)
                t.Commit()
            except Exception:
                t.RollBack()
                raise
            so = SaveAsOptions()
            so.OverwriteExistingFile = True
            copia = os.path.join(cfg["salida"], stem + "_SA.rvt")
            doc.SaveAs(copia, so)
            log("copia etiquetada:", copia)
            exportar(doc, cfg, stem + "_SA")
        log("LISTO")
    except Exception:
        log("ERROR", traceback.format_exc())
    finally:
        write_text(os.path.join(cfg["salida"], "log_{0}.txt".format(cfg["modo"])), u"\n".join(LOG))


main()
