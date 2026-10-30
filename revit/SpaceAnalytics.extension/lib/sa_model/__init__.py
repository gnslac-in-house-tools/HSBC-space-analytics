# -*- coding: utf-8 -*-
"""Space Analytics, la parte sin Revit: lo que el botón Exportar arma a partir de lo que sa_revit lee.

Python puro en el subconjunto común a 2.7 y 3: corre dentro de Revit con el IronPython 2.7 de pyRevit y se prueba
fuera con pytest en CPython 3 (revit/tests/). Sin f-strings, anotaciones, `nonlocal` ni `super()` sin argumentos;
nada aquí importa Autodesk, pyrevit, clr ni System (un test lo vigila). Lo que toca Revit está en sa_revit.

El contrato que sigue todo esto: docs/space-model.md (space-model.json v1).

- geometry: pies a metros, redondeo, polígonos, envolvente convexa, área
- document: los registros crudos de sa_revit (en pies) a los dicts del contrato (en metros)
- roles:    categorías del contrato y lo que significan los parámetros SA_ (SA_Rol, accesos)
- exports:  nombres de archivo, la carpeta de salida y las exportaciones previas por etapa
- bundle:   el HTML portátil (la app con los datos dentro)
- text:     el resumen que se muestra al terminar
"""

EXPORTER_VERSION = "0.1.0"
SCHEMA = "hsbc-space-analytics/space-model@1"
STAGES = ["Concepto", "Esquemático", "Desarrollo", "Documentación"]
