# -*- coding: utf-8 -*-
"""Abrir el HTML exportado en una vista de la app: el resumen compacto (#resumen=1) o la presentación (#present=1).

Un doble clic (os.startfile) pierde el `#…` de un file://, así que el HTML se abre con Edge (o Chrome) en modo app:
una ventana sin barras, angosta para el resumen y maximizada para la presentación. Va con un perfil propio en
%LOCALAPPDATA%: con el del usuario, si Edge ya está abierto, ignora el tamaño. Si no hay ni Edge ni Chrome, una
página puente en la carpeta temporal salta al HTML con su `#…` en el navegador de siempre.
"""
from __future__ import absolute_import, division, print_function, unicode_literals

import os

try:  # CPython 3
    from urllib.parse import quote
except ImportError:  # IronPython 2.7
    from urllib import quote

SUMMARY = "resumen=1"
PRESENT = "present=1"
SUMMARY_SIZE = (440, 860)  # px: el panel de la app, como un panel de Revit; cabe en una pantalla de 1080
BRIDGE_NAME = "space-analytics-abrir.html"

# donde se instalan Edge y Chrome, por variable de entorno; el primero que exista gana
BROWSERS = [
    ("ProgramFiles(x86)", "Microsoft\\Edge\\Application\\msedge.exe"),
    ("ProgramFiles", "Microsoft\\Edge\\Application\\msedge.exe"),
    ("LOCALAPPDATA", "Microsoft\\Edge\\Application\\msedge.exe"),
    ("ProgramFiles", "Google\\Chrome\\Application\\chrome.exe"),
    ("ProgramFiles(x86)", "Google\\Chrome\\Application\\chrome.exe"),
    ("LOCALAPPDATA", "Google\\Chrome\\Application\\chrome.exe"),
]


def file_url(path, view=None):
    """file:///C:/… con lo que no es ASCII y los espacios escapados (UTF-8), más `#view` si se da."""
    raw = path.replace("\\", "/").lstrip("/").encode("utf-8")  # quote de 2.7 escapa bytes, no caracteres
    url = "file:///" + quote(raw, safe="/:")
    return url + ("#" + view if view else "")


def find_browser(env, isfile=os.path.isfile):
    """La ruta de Edge o Chrome según `env` (os.environ); None si no hay."""
    for var, rel in BROWSERS:
        base = env.get(var)
        if base:
            path = os.path.join(base, rel)
            if isfile(path):
                return path
    return None


def profile_dir(env, view=None):
    """La carpeta del perfil propio del navegador; None si Windows no da %LOCALAPPDATA%. La presentación lleva el
    suyo: con el resumen abierto en el mismo perfil, Edge le pasa la ventana nueva a ese proceso, ignora
    --start-maximized y la abre del tamaño del resumen."""
    base = env.get("LOCALAPPDATA")
    if not base:
        return None
    return os.path.join(base, "HSBC Space Analytics", "navegador-presentar" if view == PRESENT else "navegador")


def app_args(url, size=None, profile=None):
    """Los argumentos de Edge/Chrome para abrir `url` como app: del tamaño `size` (ancho, alto) o maximizada, con el
    perfil `profile` si se da."""
    args = ['--app="{0}"'.format(url)]
    args.append("--window-size={0},{1}".format(*size) if size else "--start-maximized")
    if profile:
        args += ['--user-data-dir="{0}"'.format(profile), "--no-first-run", "--no-default-browser-check"]
    return " ".join(args)


def bridge_html(url):
    """La página puente: salta a `url` (con su #) en cuanto abre."""
    safe = url.replace("&", "&amp;").replace('"', "&quot;")
    return ('<!doctype html><meta charset="utf-8"><title>Space Analytics</title>'
            '<meta http-equiv="refresh" content="0;url={0}">'
            '<script>location.replace({1})</script>').format(safe, '"' + url.replace('"', '\\"') + '"')
