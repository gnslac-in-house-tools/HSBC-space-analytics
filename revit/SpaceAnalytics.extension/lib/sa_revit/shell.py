# -*- coding: utf-8 -*-
"""Windows desde Revit: la carpeta Documentos del usuario y abrir un archivo con su programa (el navegador, un .html)."""
from __future__ import absolute_import, division, print_function, unicode_literals

import os

from System import Environment
from System.Diagnostics import Process, ProcessStartInfo


def documents_folder():
    """La carpeta Documentos que muestra el Explorador (puede estar redirigida a OneDrive); si Windows no la da,
    %USERPROFILE%\\Documents."""
    try:
        path = Environment.GetFolderPath(Environment.SpecialFolder.MyDocuments)
    except Exception:
        path = None
    return path or os.path.join(os.environ.get("USERPROFILE", os.path.expanduser("~")), "Documents")


def open_path(path):
    """Abre un archivo como un doble clic. os.startfile; si IronPython no lo tiene, Process.Start con
    UseShellExecute (en .NET 8, Revit 2025+, viene apagado por omisión y un .html no abriría)."""
    try:
        os.startfile(path)
        return
    except Exception:
        pass
    info = ProcessStartInfo(path)
    info.UseShellExecute = True
    Process.Start(info)
