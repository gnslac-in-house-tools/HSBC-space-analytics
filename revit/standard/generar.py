# -*- coding: utf-8 -*-
"""Arma SA_Parametros.txt (el archivo de parámetros compartidos de Revit) desde biblioteca.json.
Los GUID salen del nombre del parámetro: regenerar el archivo no cambia nunca el GUID de un parámetro.
    python revit/standard/generar.py"""
import io, json, os, uuid

AQUI = os.path.dirname(os.path.abspath(__file__))
NS = uuid.UUID("6f1f2c8e-5a0b-4c3a-9d54-7a2f0a6b1c01")


def guid(nombre):
    return str(uuid.uuid5(NS, "hsbc-space-analytics/" + nombre))


def biblioteca():
    with io.open(os.path.join(AQUI, "biblioteca.json"), encoding="utf-8") as f:
        return json.load(f)


def txt(lib):
    filas = ["# This is a Revit shared parameter file.", "# Do not edit manually.",
             "*META\tVERSION\tMINVERSION", "META\t2\t1", "*GROUP\tID\tNAME", "GROUP\t1\t" + lib["grupo"],
             "*PARAM\tGUID\tNAME\tDATATYPE\tDATACATEGORY\tGROUP\tVISIBLE\tDESCRIPTION\tUSERMODIFIABLE\tHIDEWHENNOVALUE"]
    for p in lib["parametros"]:
        filas.append("PARAM\t{0}\t{1}\t{2}\t\t1\t1\t{3}\t1\t0".format(guid(p["nombre"]), p["nombre"], p["tipo"], p["que_es"].replace("\t", " ")))
    return "\r\n".join(filas) + "\r\n"


if __name__ == "__main__":
    # Revit lee este archivo en UTF-16 con BOM (como lo escribe él); en UTF-8 sin BOM también lo abre
    with io.open(os.path.join(AQUI, "SA_Parametros.txt"), "w", encoding="utf-8", newline="") as f:
        f.write(txt(biblioteca()))
    print("SA_Parametros.txt:", len(biblioteca()["parametros"]), "parámetros")
