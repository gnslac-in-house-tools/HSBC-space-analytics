# -*- coding: utf-8 -*-
"""El documento space-model.json (docs/space-model.md, v1) a partir de lo que sa_revit lee.

sa_revit entrega registros crudos en las unidades internas de Revit (pies, pies²) y en coordenadas internas del
proyecto, ya transformados si vienen de un vínculo; aquí se pasan a metros, se redondean a 3 decimales y se arman los
dicts del contrato. Un elemento que se queda sin geometría (un contorno sin área, un muro sin eje) se omite y se cuenta.

Registros crudos (las claves que faltan se toman como None):

- level:    id, name, elevation
- room:     id, level_id, z, name, number, area, loops, department, params
- floor:    id, level_id, type, loops, top, area
- wall:     id, level_id, type, path, thickness, z=(abajo, arriba), curtain
- door:     id, level_id, type, host, at=(x, y), hand=(x, y), facing=(x, y), width, height, z, from_room, to_room, params
- window:   lo mismo que door, más sill y head (sobre el nivel del hueco)
- obstacle: id, level_id, type, category, points=[(x, y)…], box=[(x, y)×4], z=(abajo, arriba), room, params
- connector: id, kind, type, points=[(x, y)…], box=[(x, y)×4], z=(abajo, arriba), snap, params
- type:     category, family, name, type_mark, description, manufacturer, model, cost, keynote,
            materials=[(nombre, espesor)], params

`loops` son lazos cerrados de puntos (x, y); `params`, una lista de (nombre, valor, es_longitud). `level_id` es el id
de un nivel del modelo anfitrión, o None (un elemento de un vínculo, o sin nivel): entonces su nivel es el más alto con
elevación <= z inferior + 0.3 m.

Un conector (escalera, rampa, elevador, escalera eléctrica) no tiene un nivel sino los que toca: los de elevación
entre su z inferior y superior (± 0.3 m). Con `snap` (un elevador o una escalera eléctrica: su z sale de su caja, con
el foso y lo que sobresale arriba) su z se ajusta a las elevaciones del primer y el último nivel que toca, si son al
menos dos.
"""
from __future__ import absolute_import, division, print_function, unicode_literals

from sa_model import EXPORTER_VERSION, SCHEMA
from sa_model import vertical
from sa_model.geometry import footprint, m, m2, outline, point, polygon, polyline, r, rm, unit

LEVEL_TOLERANCE = 0.3  # m: un elemento apoyado un poco por debajo de su nivel sigue siendo de ese nivel
KINDS = ["rooms", "floors", "walls", "doors", "windows", "obstacles", "connectors"]


def _num(value):
    return None if value is None else float(value)


def level(raw):
    return {"id": raw["id"], "name": raw.get("name") or "", "elevation": rm(raw["elevation"])}


def resolve_level(level_id, z_ft, levels):
    """El id del nivel de un elemento: el suyo si es un nivel exportado; si no, el nivel más alto con
    elevación <= z + 0.3 m (z en pies, la cota inferior del elemento). None si no hay ninguno por debajo."""
    if level_id is not None and any(l["id"] == level_id for l in levels):
        return level_id
    if z_ft is None:
        return None
    z = m(z_ft) + LEVEL_TOLERANCE
    below = [l for l in levels if l["elevation"] <= z + 1e-9]
    if not below:
        return None
    return max(below, key=lambda l: l["elevation"])["id"]


def params(raw):
    """[(nombre, valor, es_longitud)] a {nombre: valor}: las longitudes en metros, los números como número, el texto
    como texto. Sin valor (None) no entra."""
    out = {}
    for item in raw or []:
        name, value, is_length = item[0], item[1], item[2] if len(item) > 2 else False
        if value is None:
            continue
        if isinstance(value, bool):
            out[name] = 1 if value else 0
        elif isinstance(value, (int, float)) and not isinstance(value, bool):
            out[name] = rm(value) if is_length else value
        else:
            out[name] = value
    return out


def room(raw, levels):
    shape = outline(raw.get("loops") or [])
    if shape is None:
        return None
    return {
        "id": raw["id"],
        "level": resolve_level(raw.get("level_id"), raw.get("z"), levels),
        "name": raw.get("name") or "",
        "number": raw.get("number") or "",
        "area": r(m2(raw.get("area") or 0)),
        "outline": shape,
        "department": raw.get("department") or None,
        "params": params(raw.get("params")),
    }


def floor(raw, levels):
    shape = outline(raw.get("loops") or [])
    if shape is None or raw.get("top") is None:
        return None
    return {
        "id": raw["id"],
        "level": resolve_level(raw.get("level_id"), raw.get("top"), levels),
        "type": raw.get("type"),
        "outline": shape,
        "top": rm(raw["top"]),
        "area": r(m2(raw.get("area") or 0)),
    }


def _z(raw):
    lo, hi = raw.get("z") or (None, None)
    if lo is None or hi is None:
        return None
    lo, hi = min(lo, hi), max(lo, hi)
    return [rm(lo), rm(hi)]


def wall(raw, levels):
    path = polyline(raw.get("path") or [])
    z = _z(raw)
    if path is None or z is None:
        return None
    return {
        "id": raw["id"],
        "level": resolve_level(raw.get("level_id"), raw["z"][0], levels),
        "type": raw.get("type"),
        "path": path,
        "thickness": rm(raw.get("thickness") or 0),
        "z": z,
        "curtain": bool(raw.get("curtain")),
    }


def _elevation(level_id, levels):
    for l in levels:
        if l["id"] == level_id:
            return l["elevation"]
    return None


def opening(raw, levels, window=False):
    """Una puerta (o una ventana con window=True)."""
    if raw.get("at") is None or raw.get("width") is None or raw.get("height") is None or raw.get("z") is None:
        return None
    lvl = resolve_level(raw.get("level_id"), raw["z"], levels)
    facing = unit(raw["facing"]) if raw.get("facing") is not None else None
    hand = unit(raw["hand"]) if raw.get("hand") is not None else None
    if facing is None and hand is not None:
        facing = [r(-hand[1], 4), r(hand[0], 4)]
    if hand is None and facing is not None:
        hand = [r(facing[1], 4), r(-facing[0], 4)]
    out = {
        "id": raw["id"],
        "level": lvl,
        "type": raw.get("type"),
        "host": raw.get("host"),
        "at": point(raw["at"]),
        "hand": hand or [1.0, 0.0],
        "facing": facing or [0.0, 1.0],
        "width": rm(raw["width"]),
        "height": rm(raw["height"]),
        "z": rm(raw["z"]),
        "from_room": raw.get("from_room"),
        "to_room": raw.get("to_room"),
        "params": params(raw.get("params")),
    }
    if window:
        sill = raw.get("sill")
        if sill is None:
            elevation = _elevation(lvl, levels)
            sill_m = (m(raw["z"]) - elevation) if elevation is not None else 0.0
        else:
            sill_m = m(sill)
        head = raw.get("head")
        head_m = m(head) if head is not None else sill_m + m(raw["height"])
        out["sill"] = r(sill_m)
        out["head"] = r(head_m)
    return out


def obstacle(raw, levels):
    shape = footprint(raw.get("points") or [])
    if shape is None and raw.get("box"):
        shape = polygon(raw["box"])
    z = _z(raw)
    if shape is None or z is None:
        return None
    return {
        "id": raw["id"],
        "level": resolve_level(raw.get("level_id"), raw["z"][0], levels),
        "type": raw.get("type"),
        "category": raw.get("category"),
        "footprint": shape,
        "z": z,
        "room": raw.get("room"),
        "params": params(raw.get("params")),
    }


def touched(z, levels):
    """Los niveles (del contrato) que toca algo que va de z[0] a z[1] (metros), ± 0.3 m, de abajo hacia arriba."""
    lo, hi = z[0] - LEVEL_TOLERANCE - 1e-9, z[1] + LEVEL_TOLERANCE + 1e-9
    return sorted((l for l in levels if lo <= l["elevation"] <= hi), key=lambda l: l["elevation"])


def connector(raw, levels):
    if raw.get("kind") not in vertical.KINDS:
        return None
    shape = footprint(raw.get("points") or [])
    if shape is None and raw.get("box"):
        shape = polygon(raw["box"])
    z = _z(raw)
    if shape is None or z is None:
        return None
    near = touched(z, levels)
    if raw.get("snap") and len(near) >= 2:
        z = [near[0]["elevation"], near[-1]["elevation"]]
    return {
        "id": raw["id"],
        "kind": raw["kind"],
        "type": raw.get("type"),
        "footprint": shape,
        "z": z,
        "levels": [l["id"] for l in near] or None,
        "params": params(raw.get("params")),
    }


def type_record(raw):
    return {
        "category": raw.get("category") or "",
        "family": raw.get("family") or "",
        "name": raw.get("name") or "",
        "type_mark": raw.get("type_mark") or "",
        "description": raw.get("description") or "",
        "manufacturer": raw.get("manufacturer") or "",
        "model": raw.get("model") or "",
        "cost": _num(raw.get("cost")),
        "keynote": raw.get("keynote") or "",
        "materials": [{"name": n or "", "thickness": rm(t or 0)} for n, t in raw.get("materials") or []],
        "params": params(raw.get("params")),
    }


def source(version, file_name, stage, phase, links, when):
    """`source` de la raíz. `when` es un datetime local (sin zona), como lo escribe el contrato."""
    return {
        "app": "Revit",
        "version": "{0}".format(version),
        "file": file_name,
        "exported_at": when.strftime("%Y-%m-%dT%H:%M:%S"),
        "exporter": EXPORTER_VERSION,
        "stage": stage,
        "phase": phase or "",
        "links": list(links or []),
    }


BUILDERS = {
    "rooms": room,
    "floors": floor,
    "walls": wall,
    "doors": lambda raw, levels: opening(raw, levels, window=False),
    "windows": lambda raw, levels: opening(raw, levels, window=True),
    "obstacles": obstacle,
    "connectors": connector,
}


def build(src, raw):
    """El documento completo. `raw` tiene `levels`, una lista por cada clave de KINDS y `types` ({id: tipo crudo}).

    Devuelve (documento, omitidos), con omitidos = {clave: cuántos se quedaron sin geometría}. En `types` solo quedan
    los tipos que usa algún elemento exportado.
    """
    levels = sorted((level(l) for l in raw.get("levels") or []), key=lambda l: (l["elevation"], l["name"]))
    doc = {"schema": SCHEMA, "source": src, "levels": levels}
    dropped = {}
    for key in KINDS:
        made = []
        for item in raw.get(key) or []:
            e = BUILDERS[key](item, levels)
            if e is None:
                dropped[key] = dropped.get(key, 0) + 1
            else:
                made.append(e)
        doc[key] = made
    used = set(e.get("type") for key in KINDS for e in doc[key] if e.get("type") is not None)
    raw_types = raw.get("types") or {}
    doc["types"] = dict((tid, type_record(raw_types.get(tid) or {})) for tid in sorted(used))
    return doc, dropped
