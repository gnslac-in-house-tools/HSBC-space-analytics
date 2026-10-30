# -*- coding: utf-8 -*-
"""Dibuja los iconos de la cinta (icon.png, e icon.dark.png para el tema oscuro de Revit) de cada botón de la pestaña
Space Analytics. Copia de tools/make_icons.py de la extensión GFit: trazos en una retícula de 16 x 16, 1.5 de ancho,
extremos redondos, dibujados a 96 px con 4 x 4 muestras por píxel. Python puro (zlib para el PNG):

    python revit/tools/make_icons.py
"""
from __future__ import absolute_import, division, print_function

import math
import os
import struct
import zlib

SIZE = 96
SCALE = SIZE / 16.0
WIDTH = 1.5  # unidades de la retícula
SAMPLES = 4
INK = {"icon.png": (54, 58, 66), "icon.dark.png": (222, 226, 232)}

HERE = os.path.dirname(os.path.abspath(__file__))
TAB = os.path.join(HERE, "..", "SpaceAnalytics.extension", "SpaceAnalytics.tab")


def _seg_dist(px, py, ax, ay, bx, by):
    dx, dy = bx - ax, by - ay
    l2 = dx * dx + dy * dy
    t = 0.0 if l2 == 0 else max(0.0, min(1.0, ((px - ax) * dx + (py - ay) * dy) / l2))
    return math.hypot(px - (ax + t * dx), py - (ay + t * dy))


def polyline(*points, **kw):
    """Un trazo por los puntos (unidades de la retícula); closed=True une el último con el primero."""
    pts = list(points) + ([points[0]] if kw.get("closed") else [])
    return ("lines", [(pts[i], pts[i + 1]) for i in range(len(pts) - 1)])


def bezier(a, c, b, n=24):
    """Puntos de una curva cuadrática de a a b con control c, para un polyline."""
    out = []
    for i in range(n + 1):
        t = i / float(n)
        out.append(((1 - t) ** 2 * a[0] + 2 * (1 - t) * t * c[0] + t * t * b[0],
                    (1 - t) ** 2 * a[1] + 2 * (1 - t) * t * c[1] + t * t * b[1]))
    return out


def circle(cx, cy, r, filled=False):
    return ("circle", (cx, cy, r, filled))


# Los glifos, en la retícula de 16 (y hacia abajo)
GLYPHS = {
    "Analisis.panel/Exportar.pushbutton": [
        # un ojo: los dos párpados y el iris con su pupila (lo que la app mide: qué se ve desde cada punto)
        polyline(*bezier((1.5, 8), (8, 1.25), (14.5, 8))),
        polyline(*bezier((1.5, 8), (8, 14.75), (14.5, 8))),
        circle(8, 8, 2.4),
        circle(8, 8, 0.6, filled=True),
    ],
    "Analisis.panel/Abrir.pushbutton": [
        # una ventana abierta por su esquina y una flecha que sale de ella: abrir en el navegador
        polyline((7.25, 3), (3, 3), (3, 13), (13, 13), (13, 8.75)),
        polyline((7.75, 8.25), (13, 3)),
        polyline((9, 3), (13, 3), (13, 7)),
    ],
}


def coverage(shapes, x, y):
    """Cuánto del píxel (x, y) cubren los trazos, de 0 a 1."""
    hit = 0
    half = WIDTH / 2.0
    for sx in range(SAMPLES):
        for sy in range(SAMPLES):
            gx = (x + (sx + 0.5) / SAMPLES) / SCALE
            gy = (y + (sy + 0.5) / SAMPLES) / SCALE
            inside = False
            for kind, data in shapes:
                if kind == "lines":
                    inside = any(_seg_dist(gx, gy, a[0], a[1], b[0], b[1]) <= half for a, b in data)
                else:
                    cx, cy, r, filled = data
                    d = math.hypot(gx - cx, gy - cy)
                    inside = d <= r + half if filled else abs(d - r) <= half
                if inside:
                    break
            hit += inside
    return hit / float(SAMPLES * SAMPLES)


def png(pixels):
    raw = b"".join(b"\x00" + b"".join(struct.pack("4B", *p) for p in row) for row in pixels)

    def chunk(tag, data):
        return struct.pack(">I", len(data)) + tag + data + struct.pack(">I", zlib.crc32(tag + data) & 0xFFFFFFFF)

    return (b"\x89PNG\r\n\x1a\n" + chunk(b"IHDR", struct.pack(">IIBBBBB", SIZE, SIZE, 8, 6, 0, 0, 0))
            + chunk(b"IDAT", zlib.compress(raw, 9)) + chunk(b"IEND", b""))


def main():
    for button, shapes in sorted(GLYPHS.items()):
        folder = os.path.join(TAB, *button.split("/"))
        if not os.path.isdir(folder):
            continue
        alpha = [[coverage(shapes, x, y) for x in range(SIZE)] for y in range(SIZE)]
        for name, ink in INK.items():
            pixels = [[ink + (int(round(a * 255)),) for a in row] for row in alpha]
            with open(os.path.join(folder, name), "wb") as f:
                f.write(png(pixels))
        print("drew", button)


if __name__ == "__main__":
    main()
