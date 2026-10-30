# -*- coding: utf-8 -*-
"""Qué es cada cosa para la app (docs/space-model.md): las categorías de Revit que exporta, la categoría del contrato
de cada una y lo que dicen los parámetros SA_ (sobre todo SA_Rol y qué puerta es un acceso)."""
from __future__ import absolute_import, division, print_function, unicode_literals

# Obstáculos: nombre de BuiltInCategory -> `category` del contrato, en el orden en que se recolectan
OBSTACLE_CATEGORIES = [
    ("OST_Columns", "Columns"),
    ("OST_StructuralColumns", "Columns"),
    ("OST_Furniture", "Furniture"),
    ("OST_FurnitureSystems", "Furniture"),
    ("OST_Casework", "Casework"),
    ("OST_SpecialityEquipment", "Equipment"),
    ("OST_PlumbingFixtures", "Plumbing"),
    ("OST_Planting", "Planting"),
    ("OST_GenericModel", "Generic"),
]

# `category` de la ficha de un tipo que no es obstáculo (en un obstáculo es la suya: Furniture, Columns…)
TYPE_CATEGORIES = {"walls": "Walls", "floors": "Floors", "doors": "Doors", "windows": "Windows"}

# Los nombres de los grupos en el resumen
LABELS = [
    ("levels", "niveles"),
    ("rooms", "rooms"),
    ("floors", "pisos"),
    ("walls", "muros"),
    ("doors", "puertas"),
    ("windows", "ventanas"),
    ("obstacles", "obstáculos"),
    ("types", "tipos"),
]

ROLE = "SA_Rol"
ROLES = ["Personal", "Entrada", "Bóveda", "Espera"]
ENTRANCE = "Entrada"


def role_of(element, types):
    """El SA_Rol de un elemento del documento: el de la instancia y, si no tiene, el de su tipo. None si ninguno."""
    value = (element.get("params") or {}).get(ROLE)
    if value in (None, ""):
        value = ((types.get(element.get("type")) or {}).get("params") or {}).get(ROLE)
    return value if value not in (None, "") else None


def is_access(door):
    """Una puerta con un lado sin room es un acceso (el grafo de la app sale al exterior por ella)."""
    return door.get("from_room") is None or door.get("to_room") is None


def accesses(document):
    return [d for d in document.get("doors", []) if is_access(d)]


def entrances(document):
    """Las puertas con SA_Rol = Entrada (instancia o tipo): los accesos públicos."""
    types = document.get("types", {})
    return [d for d in document.get("doors", []) if role_of(d, types) == ENTRANCE]


def unknown_roles(document):
    """Los valores de SA_Rol que la app no conoce, sin repetir, en el orden en que aparecen."""
    types = document.get("types", {})
    seen = []
    for key in ("doors", "obstacles"):
        for e in document.get(key, []):
            value = role_of(e, types)
            if value is not None and value not in ROLES and value not in seen:
                seen.append(value)
    return seen
