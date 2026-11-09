# -*- coding: utf-8 -*-
"""Convierte un space-model.json exportado (por etiquetar.py o por el botón) en una muestra de la app: app/samples/<archivo>.js.
Compacta los números (3 decimales: milímetros) sin tocar nada más.

    python revit/tools/muestra.py <export.json> <app/samples/archivo.js> <variable> "<descripción>"
"""
import io, json, sys

def main(src, dst, var, desc):
    with io.open(src, encoding="utf-8") as f:
        model = json.load(f, parse_float=lambda s: round(float(s), 3))
    body = json.dumps(model, ensure_ascii=False, separators=(",", ":"))
    with io.open(dst, "w", encoding="utf-8", newline="\n") as f:
        f.write("// " + desc.replace("\n", "\n// ") + "\n")
        f.write("// Público: es un ejemplo de Autodesk, no un proyecto del cliente.\n")
        f.write("window.%s = %s;\n" % (var, body))
    print(dst, round(len(body) / 1024), "KB")

if __name__ == "__main__":
    main(*sys.argv[1:5])
