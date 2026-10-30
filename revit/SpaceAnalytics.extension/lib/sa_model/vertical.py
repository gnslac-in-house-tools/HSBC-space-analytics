# -*- coding: utf-8 -*-
"""La circulación vertical (`connectors` del contrato, docs/space-model.md), sin Revit: qué es cada pieza por su
nombre y entre qué cotas va una escalera o una rampa a partir de sus niveles y desfases.

Las cotas llegan en pies, absolutas (ya con la transformación del vínculo, si viene de uno): la cota del nivel más su
desfase. Lo que sale también es en pies; sa_model.document lo pasa a metros.
"""
from __future__ import absolute_import, division, print_function, unicode_literals

import re

KINDS = ["stair", "ramp", "elevator", "escalator"]

# La categoría de elevadores y escaleras eléctricas: no está en todas las versiones de la API (se busca con getattr)
VERTICAL_CATEGORY = "OST_VerticalCirculation"

# `category` de la ficha del tipo de un conector que no es también obstáculo
TYPE_CATEGORIES = {"stair": "Stairs", "ramp": "Ramps", "vertical": "VerticalCirculation"}

ACCENTS = {"á": "a", "à": "a", "ä": "a", "â": "a", "é": "e", "è": "e", "ë": "e", "ê": "e", "í": "i", "ì": "i",
           "ï": "i", "î": "i", "ó": "o", "ò": "o", "ö": "o", "ô": "o", "ú": "u", "ù": "u", "ü": "u", "û": "u",
           "ñ": "n", "ç": "c"}

# Sobre el nombre ya doblado (fold): minúsculas, sin acentos, palabras separadas por un espacio
ESCALATOR = re.compile(r"\b(escalators?|escaleras? (electricas?|mecanicas?))\b")
ELEVATOR = re.compile(r"\b(elevador(es)?|elevators?|ascensor(es)?|lifts?)\b")
STAIR = re.compile(r"\b(escaleras?|escalinatas?|stairs?|stairways?)\b")
RAMP = re.compile(r"\b(rampas?|ramps?)\b")


def fold(text):
    """Un nombre para compararlo: minúsculas, sin acentos y con lo que no es letra o número como un espacio
    ("Elevador_Pasajeros-1600kg" -> "elevador pasajeros 1600kg")."""
    low = "".join(ACCENTS.get(c, c) for c in (text or "").lower())
    return re.sub(r"[^a-z0-9]+", " ", low).strip()


def kind_by_name(names, vertical=False):
    """El `kind` de una familia por su nombre de familia o de tipo (`names`): escalator o elevator; None si no dice
    ninguno. Con vertical=True (la categoría de circulación vertical) también reconoce escaleras y rampas, y lo que no
    dice nada es un elevador."""
    words = " | ".join(fold(n) for n in names if n)
    if ESCALATOR.search(words):
        return "escalator"
    if ELEVATOR.search(words):
        return "elevator"
    if not vertical:
        return None
    if STAIR.search(words):
        return "stair"
    if RAMP.search(words):
        return "ramp"
    return "elevator"


def stair_z(base, base_offset=None, top=None, top_offset=None, height=None, up_to=None):
    """(abajo, arriba) de una escalera o rampa: el nivel base más su desfase hasta el nivel superior más el suyo. Sin
    nivel superior (desconectada), abajo + `height`. `up_to` es la cota del "nivel superior de varios pisos" de una
    rampa o escalera antigua: si queda más arriba, la sube hasta ahí (un solo conector que cruza los pisos).

    None si no hay nivel base o no queda una altura positiva.
    """
    if base is None:
        return None
    lo = base + (base_offset or 0.0)
    if top is not None:
        hi = top + (top_offset or 0.0)
    elif height is not None and height > 0:
        hi = lo + height
    else:
        return None
    if up_to is not None and up_to > hi:
        hi = up_to
    if hi <= lo:
        return None
    return (lo, hi)


def stacked(z, base, placements):
    """Las copias de una escalera de varios pisos: la misma escalera, movida en vertical a cada nivel donde se coloca.

    `z` es (abajo, arriba) de la escalera en su nivel `base` (la cota); `placements`, [(clave, cota)] de los niveles
    base de cada copia. Devuelve [(clave, (abajo, arriba))] de abajo hacia arriba; sin `base` o sin colocaciones, la
    escalera sola con clave None.
    """
    if base is None or not placements:
        return [(None, z)]
    out = [(key, (z[0] + level - base, z[1] + level - base)) for key, level in placements if level is not None]
    return sorted(out, key=lambda item: item[1][0]) or [(None, z)]
