# -*- coding: utf-8 -*-
"""Geometría en planta, sin Revit: los puntos llegan ya teselados como tuplas (x, y) en pies internos.

Todo sale en metros redondeado a 3 decimales (docs/space-model.md: "Metros, siempre"). Un polígono es una lista de
puntos [x, y] sin repetir el primero al final; un contorno con huecos, una lista de polígonos con el exterior primero.
"""
from __future__ import absolute_import, division, print_function, unicode_literals

import math

FOOT = 0.3048  # m
DECIMALS = 3
DIRECTION_DECIMALS = 4


def m(feet):
    """Pies internos de Revit a metros."""
    return float(feet) * FOOT


def m2(square_feet):
    """Pies cuadrados a metros cuadrados."""
    return float(square_feet) * FOOT * FOOT


def r(value, decimals=DECIMALS):
    """Redondeo del contrato; nunca -0.0."""
    return round(float(value), decimals) + 0.0


def rm(feet):
    """Pies a metros, redondeado."""
    return r(m(feet))


def point(xy):
    """(x, y) en pies a [x, y] en metros redondeados."""
    return [rm(xy[0]), rm(xy[1])]


def dedupe(points, closed=True):
    """Sin puntos consecutivos repetidos; si es cerrado, sin el primero repetido al final."""
    out = []
    for p in points:
        if not out or out[-1][0] != p[0] or out[-1][1] != p[1]:
            out.append(p)
    if closed:
        while len(out) > 1 and out[0][0] == out[-1][0] and out[0][1] == out[-1][1]:
            out.pop()
    return out


def signed_area(points):
    """Área con signo (fórmula del lazo): positiva si gira en sentido antihorario."""
    n = len(points)
    if n < 3:
        return 0.0
    s = 0.0
    for i in range(n):
        x0, y0 = points[i][0], points[i][1]
        x1, y1 = points[(i + 1) % n][0], points[(i + 1) % n][1]
        s += x0 * y1 - x1 * y0
    return s / 2.0


def polygon_area(points):
    """Área de un polígono simple, sin signo, en las unidades de sus puntos al cuadrado."""
    return abs(signed_area(points))


def polygon(points_ft):
    """Un lazo cerrado en pies a un polígono del contrato en metros; None si no queda área."""
    pts = dedupe([point(p) for p in points_ft], closed=True)
    if len(pts) < 3 or polygon_area(pts) == 0:
        return None
    return pts


def outline(loops_ft):
    """Lazos cerrados en pies a un contorno con huecos: el de mayor área primero (el exterior), luego los huecos.

    Revit no garantiza el orden de los lazos (rooms, caras de pisos); el exterior es el que encierra más área.
    None si no queda ningún polígono.
    """
    polys = [p for p in (polygon(loop) for loop in loops_ft) if p is not None]
    if not polys:
        return None
    return sorted(polys, key=lambda p: -polygon_area(p))


def polyline(points_ft):
    """Una polilínea abierta (el eje de un muro) en metros; None si no quedan dos puntos distintos."""
    pts = dedupe([point(p) for p in points_ft], closed=False)
    return pts if len(pts) >= 2 else None


def _cross(o, a, b):
    return (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0])


def convex_hull(points):
    """Envolvente convexa (cadena monótona de Andrew), en sentido antihorario, sin puntos colineales ni repetidos.

    Menos de 3 puntos no colineales devuelve lo que haya (0, 1 o 2 puntos): quien llama decide qué hacer.
    """
    pts = sorted(set((float(p[0]), float(p[1])) for p in points))
    if len(pts) < 3:
        return [list(p) for p in pts]
    lower = []
    for p in pts:
        while len(lower) >= 2 and _cross(lower[-2], lower[-1], p) <= 0:
            lower.pop()
        lower.append(p)
    upper = []
    for p in reversed(pts):
        while len(upper) >= 2 and _cross(upper[-2], upper[-1], p) <= 0:
            upper.pop()
        upper.append(p)
    hull = lower[:-1] + upper[:-1]
    return [list(p) for p in hull]


def footprint(points_ft):
    """Huella en planta de una nube de puntos en pies: su envolvente convexa en metros; None si no tiene área."""
    hull = convex_hull(points_ft)
    if len(hull) < 3:
        return None
    return polygon(hull)


def rectangle(lo, hi):
    """Las cuatro esquinas (antihorario) de un rectángulo alineado a los ejes, de lo=(x, y) a hi=(x, y)."""
    return [(lo[0], lo[1]), (hi[0], lo[1]), (hi[0], hi[1]), (lo[0], hi[1])]


def unit(v, decimals=DIRECTION_DECIMALS):
    """Un vector (x, y[, z]) a su dirección unitaria en planta [dx, dy]; None si no tiene componente en planta."""
    x, y = float(v[0]), float(v[1])
    length = math.hypot(x, y)
    if length < 1e-9:
        return None
    return [r(x / length, decimals), r(y / length, decimals)]


def extent_along(points, direction):
    """Lo que mide una nube de puntos (x, y) proyectada sobre una dirección unitaria."""
    if not points:
        return 0.0
    d = [p[0] * direction[0] + p[1] * direction[1] for p in points]
    return max(d) - min(d)
