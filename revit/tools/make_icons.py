# -*- coding: utf-8 -*-
"""Dibuja los iconos de la extensión con la marca de la app: el anillo de color de app/index.html (`.mark`: gradiente
cónico desde 200° por durazno, rosa, violeta, azul y verde, con el centro hueco). Cada botón lleva en el hueco un
glifo propio (icon.png, e icon.dark.png para el tema oscuro de Revit); `mark.png` es el anillo solo, para la ventana de
Exportar. Trazos en una retícula de 16 x 16, extremos redondos, dibujados a 96 px con 4 x 4 muestras por píxel.
Python puro (zlib para el PNG):

    python revit/tools/make_icons.py
"""
from __future__ import absolute_import, division, print_function

import math
import os
import struct
import zlib

SIZE = 96
SCALE = SIZE / 16.0
WIDTH = 1.35  # unidades de la retícula
SAMPLES = 4
INK = {"icon.png": (54, 58, 66), "icon.dark.png": (222, 226, 232)}

# el anillo: radios en la retícula (en la app, 12 px por fuera y 7 por dentro) y el gradiente cónico
CENTER, R_OUT = 8.0, 7.6
R_IN = R_OUT * 7 / 12.0
FROM_DEG = 200.0
STOPS = [(255, 138, 101), (241, 120, 182), (140, 123, 245), (91, 155, 255), (93, 187, 138), (255, 138, 101)]

HERE = os.path.dirname(os.path.abspath(__file__))
TAB = os.path.join(HERE, "..", "SpaceAnalytics.extension", "SpaceAnalytics.tab")
MARK = os.path.join(TAB, "Analisis.panel", "Exportar.pushbutton", "mark.png")


def _seg_dist(px, py, ax, ay, bx, by):
    dx, dy = bx - ax, by - ay
    l2 = dx * dx + dy * dy
    t = 0.0 if l2 == 0 else max(0.0, min(1.0, ((px - ax) * dx + (py - ay) * dy) / l2))
    return math.hypot(px - (ax + t * dx), py - (ay + t * dy))


def polyline(*points, **kw):
    """Un trazo por los puntos (unidades de la retícula); closed=True une el último con el primero."""
    pts = list(points) + ([points[0]] if kw.get("closed") else [])
    return ("lines", [(pts[i], pts[i + 1]) for i in range(len(pts) - 1)])


# Los glifos, en el hueco del anillo (retícula de 16, y hacia abajo)
GLYPHS = {
    "Analisis.panel/Exportar.pushbutton": [
        # una flecha que sube: el modelo sale de Revit hacia la app
        polyline((8, 10.6), (8, 5.4)),
        polyline((5.9, 7.5), (8, 5.4), (10.1, 7.5)),
    ],
    "Analisis.panel/Abrir.pushbutton": [
        # una flecha que sale en diagonal: abrir en el navegador
        polyline((6, 10), (10, 6)),
        polyline((6.9, 6), (10, 6), (10, 9.1)),
    ],
}


def conic(gx, gy):
    """El color del anillo en el punto: el ángulo se mide como en CSS, desde arriba y en el sentido del reloj."""
    deg = math.degrees(math.atan2(gx - CENTER, -(gy - CENTER)))
    t = ((deg - FROM_DEG) % 360.0) / 360.0 * (len(STOPS) - 1)
    i = min(int(t), len(STOPS) - 2)
    f = t - i
    return tuple(STOPS[i][k] + (STOPS[i + 1][k] - STOPS[i][k]) * f for k in range(3))


def pixel(shapes, ink, x, y):
    """El color (r, g, b, a) del píxel (x, y): el anillo y, encima, los trazos del glifo en `ink`."""
    r = g = b = a = 0.0
    half = WIDTH / 2.0
    for sx in range(SAMPLES):
        for sy in range(SAMPLES):
            gx = (x + (sx + 0.5) / SAMPLES) / SCALE
            gy = (y + (sy + 0.5) / SAMPLES) / SCALE
            if any(_seg_dist(gx, gy, p[0], p[1], q[0], q[1]) <= half for _, segs in shapes for p, q in segs):
                c = ink
            elif R_IN <= math.hypot(gx - CENTER, gy - CENTER) <= R_OUT:
                c = conic(gx, gy)
            else:
                continue
            r += c[0]; g += c[1]; b += c[2]; a += 1
    if not a:
        return (0, 0, 0, 0)
    return (int(round(r / a)), int(round(g / a)), int(round(b / a)), int(round(a / (SAMPLES * SAMPLES) * 255)))


def png(pixels):
    raw = b"".join(b"\x00" + b"".join(struct.pack("4B", *p) for p in row) for row in pixels)

    def chunk(tag, data):
        return struct.pack(">I", len(data)) + tag + data + struct.pack(">I", zlib.crc32(tag + data) & 0xFFFFFFFF)

    return (b"\x89PNG\r\n\x1a\n" + chunk(b"IHDR", struct.pack(">IIBBBBB", SIZE, SIZE, 8, 6, 0, 0, 0))
            + chunk(b"IDAT", zlib.compress(raw, 9)) + chunk(b"IEND", b""))


def draw(path, shapes, ink):
    with open(path, "wb") as f:
        f.write(png([[pixel(shapes, ink, x, y) for x in range(SIZE)] for y in range(SIZE)]))


def main():
    for button, shapes in sorted(GLYPHS.items()):
        folder = os.path.join(TAB, *button.split("/"))
        if not os.path.isdir(folder):
            continue
        for name, ink in INK.items():
            draw(os.path.join(folder, name), shapes, ink)
        print("drew", button)
    draw(MARK, [], INK["icon.png"])
    print("drew mark.png")


if __name__ == "__main__":
    main()
