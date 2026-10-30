# -*- coding: utf-8 -*-
"""Lo que todos los colectores necesitan: ids como texto, nombres, parámetros y el modelo que se lee.

Un `Source` es el modelo anfitrión o un vínculo cargado: sabe su documento, su fase final, el prefijo de sus ids
(`"<idInstanciaVínculo>:"` en un vínculo) y la transformación a coordenadas del anfitrión
(`RevitLinkInstance.GetTotalTransform()`).
"""
from __future__ import absolute_import, division, print_function, unicode_literals

import os

from Autodesk.Revit.DB import BuiltInParameter, Element, Level, SpecTypeId, StorageType, XYZ

SA_PREFIX = "SA_"


def id_value(element_id):
    """El número de un ElementId: `Value` (Revit 2024+); `IntegerValue` solo si `Value` no existe (2023 o antes)."""
    try:
        return element_id.Value
    except AttributeError:
        return element_id.IntegerValue


def is_valid(element_id):
    return element_id is not None and id_value(element_id) != -1


def name_of(element):
    """El nombre de un elemento. En un tipo (WallType, FamilySymbol…: ElementType redeclara `Name`) IronPython no lo
    alcanza con `t.Name`; la propiedad de Element sí (como hace pyRevit), y si no, el parámetro de nombre."""
    if element is None:
        return ""
    try:
        return Element.Name.__get__(element) or ""
    except Exception:
        for name in ("SYMBOL_NAME_PARAM", "ALL_MODEL_TYPE_NAME"):
            p = _get(element, name)
            if p is not None and p.AsString():
                return p.AsString()
        return ""


def model_name(doc):
    """El nombre del archivo del modelo ("Sucursal.rvt"); su título si nunca se guardó.

    No doc.Title a secas: que acabe en ".rvt" depende de si Windows muestra las extensiones.
    """
    path = doc.PathName
    if path:
        return os.path.basename(path.replace("\\", "/"))
    title = doc.Title or "Modelo"
    return title if title.lower().endswith(".rvt") else title + ".rvt"


def final_phase(doc):
    """La última fase del modelo (la que el contrato llama `phase`); None si no tiene fases."""
    phases = doc.Phases
    if phases is None or phases.Size == 0:
        return None
    return phases.get_Item(phases.Size - 1)


def _get(element, bip_name):
    bip = getattr(BuiltInParameter, bip_name, None)
    if element is None or bip is None:
        return None
    try:
        return element.get_Parameter(bip)
    except Exception:
        return None


def number(element, bip_names, positive=False):
    """El primer parámetro numérico (Double) con valor de la lista, en unidades internas; None si ninguno."""
    for name in bip_names:
        p = _get(element, name)
        if p is None or not p.HasValue or p.StorageType != StorageType.Double:
            continue
        value = p.AsDouble()
        if positive and value <= 0:
            continue
        return value
    return None


def text(element, bip_names):
    """El primer parámetro de texto con valor de la lista; "" si ninguno."""
    for name in bip_names:
        p = _get(element, name)
        if p is None or not p.HasValue:
            continue
        value = p.AsString() if p.StorageType == StorageType.String else p.AsValueString()
        if value:
            return value
    return ""


def element_id_param(element, bip_name):
    p = _get(element, bip_name)
    if p is None or p.StorageType != StorageType.ElementId:
        return None
    return p.AsElementId()


def has_param(element, bip_name):
    return _get(element, bip_name) is not None


def is_length(definition):
    """Si un parámetro mide longitud (SpecTypeId.Length, en cualquier versión de la especificación)."""
    try:
        data_type = definition.GetDataType()
        if data_type is None or not data_type.TypeId:
            return False
        return data_type.TypeId.split("-")[0] == SpecTypeId.Length.TypeId.split("-")[0]
    except Exception:
        return False


def sa_params(element):
    """[(nombre, valor, es_longitud)] de los parámetros cuyo nombre empieza con SA_ y tienen valor: los números como
    número (en unidades internas; sa_model pasa a metros los de longitud), el texto como texto."""
    out = []
    if element is None:
        return out
    seen = set()
    for p in element.Parameters:
        try:
            name = p.Definition.Name
            if not name or not name.startswith(SA_PREFIX) or name in seen or not p.HasValue:
                continue
            storage = p.StorageType
            if storage == StorageType.Double:
                out.append((name, p.AsDouble(), is_length(p.Definition)))
            elif storage == StorageType.Integer:
                out.append((name, p.AsInteger(), False))
            elif storage == StorageType.String:
                value = p.AsString()
                if value is None:
                    continue
                out.append((name, value, False))
            elif storage == StorageType.ElementId:
                value = p.AsValueString()
                if value is None:
                    continue
                out.append((name, value, False))
            else:
                continue
            seen.add(name)
        except Exception:
            continue
    return out


class Source(object):
    """El modelo que se lee: el anfitrión (link=None) o un vínculo cargado (su RevitLinkInstance)."""

    def __init__(self, doc, link=None):
        self.doc = doc
        self.link = link
        self.transform = link.GetTotalTransform() if link is not None else None
        self.prefix = "{0}:".format(id_value(link.Id)) if link is not None else ""
        self.phase = final_phase(doc)

    @property
    def is_link(self):
        return self.link is not None

    def ref(self, element_id):
        """El id del contrato: "123" en el anfitrión, "<idVínculo>:123" en un vínculo; None si no es válido."""
        if not is_valid(element_id):
            return None
        return "{0}{1}".format(self.prefix, id_value(element_id))

    def level_ref(self, level_id):
        """El id del nivel de un elemento, solo en el anfitrión (los niveles exportados son los suyos): en un vínculo
        es None y sa_model lo deduce de la z del elemento."""
        if self.is_link or not is_valid(level_id):
            return None
        return self.ref(level_id)

    def xyz(self, p):
        return self.transform.OfPoint(p) if self.transform is not None else p

    def vec(self, v):
        return self.transform.OfVector(v) if self.transform is not None else v

    def xy(self, p):
        q = self.xyz(p)
        return (q.X, q.Y)

    def level_z(self, level_id):
        """La cota (pies, en el anfitrión) del nivel `level_id` de este modelo; None si no hay nivel."""
        if not is_valid(level_id):
            return None
        lvl = self.doc.GetElement(level_id)
        if not isinstance(lvl, Level):
            return None
        return self.xyz(XYZ(0, 0, lvl.ProjectElevation)).Z

    def box(self, element):
        """El bounding box del elemento en coordenadas del anfitrión: {xy: las 8 esquinas en planta, rect: las 4 de
        abajo en orden, z: (abajo, arriba), center: XYZ}; None si no tiene."""
        bb = element.get_BoundingBox(None)
        if bb is None:
            return None
        t = bb.Transform
        lo, hi = bb.Min, bb.Max

        def place(x, y, z):
            return self.xyz(t.OfPoint(XYZ(x, y, z)))

        corners = [place(x, y, z) for x in (lo.X, hi.X) for y in (lo.Y, hi.Y) for z in (lo.Z, hi.Z)]
        rect = [place(lo.X, lo.Y, lo.Z), place(hi.X, lo.Y, lo.Z), place(hi.X, hi.Y, lo.Z), place(lo.X, hi.Y, lo.Z)]
        zs = [c.Z for c in corners]
        center = place((lo.X + hi.X) / 2.0, (lo.Y + hi.Y) / 2.0, lo.Z)
        return {
            "xy": [(c.X, c.Y) for c in corners],
            "rect": [(c.X, c.Y) for c in rect],
            "z": (min(zs), max(zs)),
            "center": center,
        }
