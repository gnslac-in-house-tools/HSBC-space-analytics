# -*- coding: utf-8 -*-
"""Lanza Revit con un .rvt, le corre sa_etiquetar.py y espera el resultado. Python 3, fuera de Revit.

    python revit/tools/etiquetar.py inventario  <modelo.rvt> <carpeta de salida>
    python revit/tools/etiquetar.py etiquetar   <modelo.rvt> <carpeta de salida> <reglas.json>

Abre Revit (por omisión 2027), así que conviene tener la máquina libre; al terminar cierra el Revit que abrió. No toca el
.rvt original: la copia etiquetada queda en la carpeta de salida."""
import json, os, subprocess, sys, time

AQUI = os.path.dirname(os.path.abspath(__file__))
REVIT = os.path.dirname(AQUI)
CFG_DIR = os.path.join(os.environ["LOCALAPPDATA"], "HSBC Space Analytics", "etiquetar")  # pyRevit cambia %TEMP% en cada corrida


def main(modo, modelo, salida, reglas=None, year="2027", espera=900):
    os.makedirs(CFG_DIR, exist_ok=True)
    os.makedirs(salida, exist_ok=True)
    log = os.path.join(salida, "log_%s.txt" % modo)
    if os.path.exists(log):
        os.remove(log)
    cfg = {"modo": modo, "modelo": os.path.abspath(modelo), "lib": os.path.join(REVIT, "SpaceAnalytics.extension", "lib"), "estandar": os.path.join(REVIT, "standard"),
           "reglas": os.path.abspath(reglas) if reglas else None, "salida": os.path.abspath(salida)}
    with open(os.path.join(CFG_DIR, "config.json"), "w", encoding="utf-8") as f:
        json.dump(cfg, f, ensure_ascii=False)
    cmd = ["pyrevit", "run", os.path.join(AQUI, "sa_etiquetar.py"), "--revit=" + year]
    print(" ".join(cmd))
    subprocess.Popen(cmd, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    t0 = time.time()
    while not os.path.exists(log) and time.time() - t0 < espera:
        time.sleep(3)
    ok = os.path.exists(log)
    time.sleep(2)
    subprocess.run(["taskkill", "/IM", "Revit.exe", "/F"], capture_output=True)
    if ok:
        print(open(log, encoding="utf-8").read())
    else:
        print("Revit no dejó el log en %d s" % espera)
    return ok


if __name__ == "__main__":
    a = sys.argv[1:]
    sys.exit(0 if main(a[0], a[1], a[2], a[3] if len(a) > 3 else None) else 1)
