# -*- coding: utf-8 -*-
"""Windows desde Revit: la carpeta Documentos del usuario, abrir un archivo con su programa (el navegador, un .html) y
abrir el HTML exportado en una vista de la app (el resumen o la presentación)."""
from __future__ import absolute_import, division, print_function, unicode_literals

import os

from System import Environment
from System.Diagnostics import Process, ProcessStartInfo
from System.IO import Path

from sa_model import exports, launch


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


def open_view(html, view, size=None):
    """Abre el HTML exportado en una vista de la app (launch.SUMMARY o launch.PRESENT): con Edge o Chrome en modo app,
    del tamaño `size` o maximizada; si no hay ninguno, con la página puente en el navegador de siempre."""
    url = launch.file_url(html, view)
    browser = launch.find_browser(os.environ)
    if browser:
        info = ProcessStartInfo(browser, launch.app_args(url, size, launch.profile_dir(os.environ, view)))
        info.UseShellExecute = False
        Process.Start(info)
        return
    bridge = os.path.join(Path.GetTempPath(), launch.BRIDGE_NAME)
    exports.write_text(bridge, launch.bridge_html(url))
    open_path(bridge)
