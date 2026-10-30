# -*- coding: utf-8 -*-
"""Los colectores: lo que el contrato (docs/space-model.md) pide de un modelo y de sus vínculos, como registros
crudos en pies que sa_model.document convierte (el formato de cada registro está en su docstring).

Solo lee, sin transacción. Cada elemento va en su propio try: uno roto se cuenta en `failures` y la exportación
sigue. Se omiten los demolidos (PHASE_DEMOLISHED con un id válido), los rooms sin colocar o de otra fase que la final y
las piezas que no tienen geometría.
"""
from __future__ import absolute_import, division, print_function, unicode_literals

from Autodesk.Revit.DB import (BuiltInCategory, FamilyInstance, FilteredElementCollector, GeometryInstance,
                               HostObjAttributes, HostObject, HostObjectUtils, Level, LocationCurve, LocationPoint,
                               Mesh, Options, PlanarFace, RevitLinkInstance, Solid, SpatialElementBoundaryLocation,
                               SpatialElementBoundaryOptions, Wall, WallKind, XYZ)

from sa_model import roles
from sa_model.geometry import extent_along, unit
from sa_revit.common import (Source, element_id_param, has_param, id_value, is_valid, model_name, name_of, number,
                             sa_params, text)

WIDTHS = ["DOOR_WIDTH", "WINDOW_WIDTH", "FAMILY_WIDTH_PARAM", "FURNITURE_WIDTH", "GENERIC_WIDTH"]
HEIGHTS = ["DOOR_HEIGHT", "WINDOW_HEIGHT", "FAMILY_HEIGHT_PARAM", "GENERIC_HEIGHT"]
MAX_MESSAGE = 140

# Los motivos de lo que se deja fuera a propósito, como los dice el resumen
DEMOLISHED = "demolidos"
UNPLACED = "rooms sin colocar o sin área"
OTHER_PHASE = "rooms de otra fase"


class Cancelled(Exception):
    """El usuario canceló desde la barra de progreso (lo lanza el `tick` del botón)."""


def loaded_links(doc):
    """[(etiqueta, RevitLinkInstance)] de los vínculos de Revit cargados, en el orden del modelo. La etiqueta lleva el
    archivo y el id de la instancia (un mismo vínculo puede estar colocado varias veces)."""
    out = []
    for inst in FilteredElementCollector(doc).OfClass(RevitLinkInstance).ToElements():
        link_doc = inst.GetLinkDocument()
        if link_doc is None:
            continue
        out.append(("{0} (id {1})".format(model_name(link_doc), id_value(inst.Id)), inst))
    return out


def _elements(doc, bic_name):
    bic = getattr(BuiltInCategory, bic_name)
    return list(FilteredElementCollector(doc).OfCategory(bic).WhereElementIsNotElementType().ToElements())


def _demolished(element):
    return is_valid(element_id_param(element, "PHASE_DEMOLISHED"))


def _tessellated(curve, src):
    return [src.xy(p) for p in curve.Tessellate()]


def _room_of(src, inst, prop):
    """FromRoom / ToRoom / Room de una FamilyInstance en la fase final de su modelo; su id o None (exterior)."""
    room = None
    try:
        room = getattr(inst, "get_" + prop)(src.phase) if src.phase is not None else getattr(inst, prop)
    except Exception:
        try:
            room = getattr(inst, prop)
        except Exception:
            room = None
    return src.ref(room.Id) if room is not None else None


def geometry_points(element):
    """Los vértices de la geometría de un elemento, en las coordenadas de su modelo: aristas teseladas de los sólidos
    con volumen (entrando en cada GeometryInstance) y vértices de las mallas."""
    out = []
    geom = element.get_Geometry(Options())
    if geom is None:
        return out
    stack = [geom]
    while stack:
        for g in stack.pop():
            if isinstance(g, Solid):
                if g.Volume > 0:
                    for edge in g.Edges:
                        out.extend(edge.Tessellate())
            elif isinstance(g, GeometryInstance):
                inner = g.GetInstanceGeometry()
                if inner is not None:
                    stack.append(inner)
            elif isinstance(g, Mesh):
                out.extend(g.Vertices)
    return out


class Collector(object):
    """Recolecta un modelo y los vínculos elegidos. `tick(hechos, total)` se llama antes de cada elemento (fuera del
    try de cada uno: si lanza Cancelled, la recolección se corta)."""

    def __init__(self, doc, links=None, tick=None):
        self.host = Source(doc)
        self.sources = [self.host] + [Source(inst.GetLinkDocument(), inst) for inst in (links or [])]
        self.tick = tick
        self.boundary = SpatialElementBoundaryOptions()
        self.boundary.SpatialElementBoundaryLocation = SpatialElementBoundaryLocation.Finish
        self.raw = {"levels": [], "rooms": [], "floors": [], "walls": [], "doors": [], "windows": [],
                    "obstacles": [], "types": {}}
        self.failures = []  # (clave, id, mensaje)
        self.dropped = {}   # clave -> sin geometría
        self.skipped = {}   # motivo -> cuántos

    # ---- el recorrido ----

    def _jobs(self, src):
        jobs = [("rooms", None, e) for e in _elements(src.doc, "OST_Rooms")]
        jobs += [("floors", None, e) for e in _elements(src.doc, "OST_Floors")]
        jobs += [("walls", None, e) for e in _elements(src.doc, "OST_Walls")]
        jobs += [("doors", None, e) for e in _elements(src.doc, "OST_Doors")]
        jobs += [("windows", None, e) for e in _elements(src.doc, "OST_Windows")]
        for bic_name, category in roles.OBSTACLE_CATEGORIES:
            jobs += [("obstacles", category, e) for e in _elements(src.doc, bic_name)]
        return jobs

    def run(self):
        for lvl in FilteredElementCollector(self.host.doc).OfClass(Level).ToElements():
            self.raw["levels"].append({"id": self.host.ref(lvl.Id), "name": name_of(lvl),
                                       "elevation": lvl.ProjectElevation})
        work = [(src, job) for src in self.sources for job in self._jobs(src)]
        total = len(work)
        readers = {"rooms": self._room, "floors": self._floor, "walls": self._wall, "doors": self._door,
                   "windows": self._window, "obstacles": self._obstacle}
        for i, (src, (key, category, element)) in enumerate(work):
            if self.tick is not None:
                self.tick(i, total)
            try:
                if key != "rooms" and _demolished(element):
                    self._skip(DEMOLISHED)
                    continue
                record = readers[key](src, element, category)
                if record is None:
                    continue
                if record is False:
                    self.dropped[key] = self.dropped.get(key, 0) + 1
                    continue
                self.raw[key].append(record)
            except Cancelled:
                raise
            except Exception as ex:
                self.failures.append((key, src.ref(element.Id), "{0}".format(ex)[:MAX_MESSAGE]))
        if self.tick is not None:
            self.tick(total, total)
        return self

    def _skip(self, reason):
        self.skipped[reason] = self.skipped.get(reason, 0) + 1

    # ---- los tipos ----

    def _type(self, src, element, category):
        """Registra el tipo del elemento (una sola vez) y devuelve su id del contrato."""
        tid = element.GetTypeId()
        if not is_valid(tid):
            return None
        key = src.ref(tid)
        if key in self.raw["types"]:
            return key
        try:
            self.raw["types"][key] = self._read_type(src, src.doc.GetElement(tid), category)
        except Exception as ex:
            self.raw["types"][key] = {"category": category}
            self.failures.append(("types", key, "{0}".format(ex)[:MAX_MESSAGE]))
        return key

    def _read_type(self, src, t, category):
        if t is None:
            return {"category": category}
        materials = []
        if isinstance(t, HostObjAttributes):  # WallType, FloorType: capas de su estructura compuesta
            cs = t.GetCompoundStructure()
            if cs is not None:
                for layer in cs.GetLayers():
                    mat = src.doc.GetElement(layer.MaterialId) if is_valid(layer.MaterialId) else None
                    materials.append((name_of(mat), layer.Width))
        try:
            family = t.FamilyName
        except Exception:
            family = ""
        cost = number(t, ["ALL_MODEL_COST"])
        return {
            "category": category,
            "family": family,
            "name": name_of(t),
            "type_mark": text(t, ["ALL_MODEL_TYPE_MARK", "WINDOW_TYPE_ID"]),
            "description": text(t, ["ALL_MODEL_DESCRIPTION"]),
            "manufacturer": text(t, ["ALL_MODEL_MANUFACTURER"]),
            "model": text(t, ["ALL_MODEL_MODEL"]),
            "cost": cost if cost is not None else (0.0 if has_param(t, "ALL_MODEL_COST") else None),
            "keynote": text(t, ["KEYNOTE_PARAM"]),
            "materials": materials,
            "params": sa_params(t),
        }

    # ---- cada categoría: un registro crudo, None (fuera a propósito) o False (sin geometría) ----

    def _room(self, src, e, _category):
        if e.Area <= 0:
            self._skip(UNPLACED)
            return None
        phase_id = element_id_param(e, "ROOM_PHASE")
        if src.phase is not None and is_valid(phase_id) and id_value(phase_id) != id_value(src.phase.Id):
            self._skip(OTHER_PHASE)
            return None
        segments = e.GetBoundarySegments(self.boundary)
        loops = []
        for loop in segments or []:
            pts = []
            for seg in loop:
                pts.extend(_tessellated(seg.GetCurve(), src))
            loops.append(pts)
        if not loops:
            return False
        z = src.level_z(e.LevelId)
        if z is None:
            box = src.box(e)
            z = box["z"][0] if box else None
        return {
            "id": src.ref(e.Id),
            "level_id": src.level_ref(e.LevelId),
            "z": z,
            "name": text(e, ["ROOM_NAME"]),
            "number": e.Number or "",
            "area": e.Area,
            "loops": loops,
            "department": text(e, ["ROOM_DEPARTMENT"]) or None,
            "params": sa_params(e),
        }

    def _floor(self, src, e, _category):
        if not isinstance(e, HostObject):
            return False
        face = None
        for ref in HostObjectUtils.GetTopFaces(e):
            candidate = e.GetGeometryObjectFromReference(ref)
            if isinstance(candidate, PlanarFace):
                face = candidate
                break
        if face is None:
            return False
        loops = []
        for loop in face.GetEdgesAsCurveLoops():
            pts = []
            for curve in loop:
                pts.extend(_tessellated(curve, src))
            loops.append(pts)
        return {
            "id": src.ref(e.Id),
            "level_id": src.level_ref(e.LevelId),
            "type": self._type(src, e, roles.TYPE_CATEGORIES["floors"]),
            "loops": loops,
            "top": src.xyz(face.Origin).Z,
            "area": number(e, ["HOST_AREA_COMPUTED"]) or 0.0,
        }

    def _wall(self, src, e, _category):
        if not isinstance(e, Wall):
            return False  # un muro in situ (FamilyInstance) no tiene LocationCurve
        if e.IsStackedWall:
            self._skip("muros apilados (van sus partes)")
            return None
        loc = e.Location
        if not isinstance(loc, LocationCurve):
            return False
        box = src.box(e)
        if box is None:
            return False
        return {
            "id": src.ref(e.Id),
            "level_id": src.level_ref(e.LevelId),
            "type": self._type(src, e, roles.TYPE_CATEGORIES["walls"]),
            "path": _tessellated(loc.Curve, src),
            "thickness": e.Width,
            "z": box["z"],
            "curtain": e.WallType.Kind == WallKind.Curtain,
        }

    def _door(self, src, e, _category):
        return self._opening(src, e, "doors")

    def _window(self, src, e, _category):
        return self._opening(src, e, "windows")

    def _opening(self, src, e, key):
        if not isinstance(e, FamilyInstance):
            return False
        box = src.box(e)
        loc = e.Location
        if isinstance(loc, LocationPoint):
            p = loc.Point
            at = src.xyz(p)
        elif box is not None:
            at = box["center"]
            p = None
        else:
            return False
        hand = src.vec(e.HandOrientation)
        facing = src.vec(e.FacingOrientation)
        host = e.Host
        symbol = e.Symbol
        width = number(e, WIDTHS, positive=True)
        if width is None:
            width = number(symbol, WIDTHS, positive=True)
        height = number(e, HEIGHTS, positive=True)
        if height is None:
            height = number(symbol, HEIGHTS, positive=True)
        if width is None and box is not None:
            direction = unit((hand.X, hand.Y)) or [1.0, 0.0]
            width = extent_along(box["xy"], direction)
        if height is None and box is not None:
            height = box["z"][1] - box["z"][0]
        sill = number(e, ["INSTANCE_SILL_HEIGHT_PARAM"])
        head = number(e, ["INSTANCE_HEAD_HEIGHT_PARAM"])
        z = None
        if sill is not None and p is not None and is_valid(e.LevelId):
            lvl = src.doc.GetElement(e.LevelId)
            if isinstance(lvl, Level):
                z = src.xyz(XYZ(p.X, p.Y, lvl.ProjectElevation + sill)).Z
        if z is None:
            z = box["z"][0] if box is not None else at.Z
        record = {
            "id": src.ref(e.Id),
            "level_id": src.level_ref(e.LevelId),
            "type": self._type(src, e, roles.TYPE_CATEGORIES[key]),
            "host": src.ref(host.Id) if isinstance(host, Wall) else None,
            "at": (at.X, at.Y),
            "hand": (hand.X, hand.Y),
            "facing": (facing.X, facing.Y),
            "width": width,
            "height": height,
            "z": z,
            "from_room": _room_of(src, e, "FromRoom"),
            "to_room": _room_of(src, e, "ToRoom"),
            "params": sa_params(e),
        }
        if key == "windows":
            record["sill"] = sill
            record["head"] = head
        return record

    def _obstacle(self, src, e, category):
        box = src.box(e)
        points = [src.xyz(p) for p in geometry_points(e)]
        if box is None and not points:
            return False
        if box is not None:
            z = box["z"]
        else:
            zs = [p.Z for p in points]
            z = (min(zs), max(zs))
        return {
            "id": src.ref(e.Id),
            "level_id": src.level_ref(e.LevelId),
            "type": self._type(src, e, category),
            "category": category,
            "points": [(p.X, p.Y) for p in points],
            "box": box["rect"] if box is not None else None,
            "z": z,
            "room": _room_of(src, e, "Room") if isinstance(e, FamilyInstance) else None,
            "params": sa_params(e),
        }


def collect(doc, links=None, tick=None):
    """Recolecta `doc` y los vínculos `links` (RevitLinkInstance). Devuelve el Collector, con `raw` (para
    sa_model.document.build), `failures`, `dropped` y `skipped`."""
    return Collector(doc, links, tick).run()
