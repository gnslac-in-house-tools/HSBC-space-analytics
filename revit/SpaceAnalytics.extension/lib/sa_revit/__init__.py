# -*- coding: utf-8 -*-
"""Space Analytics, la parte que toca Revit: el único paquete de la extensión que importa Autodesk.Revit (un test lo
vigila; la UI, pyrevit.forms, va en los botones). IronPython 2.7 bajo pyRevit, Revit 2025 a 2027: ElementId.Value,
nunca IntegerValue (ya no existe en 2026+), salvo como respaldo en common.id_value.

Solo lee: nada aquí abre una transacción.

- common:  ids, nombres, parámetros y el modelo que se lee (anfitrión o vínculo, con su transformación)
- collect: los colectores; entregan registros crudos en pies que sa_model.document convierte al contrato
- shell:   la carpeta Documentos y abrir un archivo con su programa
"""
