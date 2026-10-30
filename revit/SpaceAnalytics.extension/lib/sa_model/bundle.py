# -*- coding: utf-8 -*-
"""El HTML portátil: la app (app/index.html) con sus scripts y los datos dentro, que se abre con doble clic sin
servidor (docs/space-model.md, "El HTML portátil").

1. lee app/index.html;
2. cambia cada `<script src="X.js"></script>` que apunte a un archivo de app/ por un `<script>` con su contenido;
3. cambia el marcador exacto por la misma etiqueta con `{"models": [...]}` dentro, escapando `</` como `<\\/`.

Las dos sustituciones se hacen en una sola pasada sobre el index.html original: ni el código insertado ni los datos se
vuelven a leer buscando etiquetas.
"""
from __future__ import absolute_import, division, print_function, unicode_literals

import io
import json
import os
import re

try:
    from urllib.parse import unquote
except ImportError:  # Python 2 (IronPython)
    from urllib import unquote

MARKER = '<script id="space-model-data" type="application/json">null</script>'
DATA_OPEN = '<script id="space-model-data" type="application/json">'

_TAG = re.compile(
    "(?P<marker>" + re.escape(MARKER) + ")|(?P<tag><script\\b(?P<attrs>[^>]*)>\\s*</script\\s*>)",
    re.IGNORECASE)
_SRC = re.compile(r"""\s+src\s*=\s*(?:"(?P<dq>[^"]*)"|'(?P<sq>[^']*)'|(?P<bare>[^\s"'>]+))""", re.IGNORECASE)
_SCHEME = re.compile(r"^(?:[a-zA-Z][a-zA-Z0-9+.\-]*:|//)")
_CLOSE = re.compile(r"</(script)", re.IGNORECASE)


class BundleError(Exception):
    pass


def extension_dir():
    """La carpeta SpaceAnalytics.extension (este archivo está en lib/sa_model/)."""
    return os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))


def find_app(ext_dir=None):
    """La ruta de app/index.html: primero `<extensión>/app/`, si no `<extensión>/../../app/` (la raíz del repo).
    None si no está en ninguna."""
    ext_dir = ext_dir or extension_dir()
    for candidate in (os.path.join(ext_dir, "app", "index.html"),
                      os.path.join(ext_dir, os.pardir, os.pardir, "app", "index.html")):
        path = os.path.normpath(candidate)
        if os.path.isfile(path):
            return path
    return None


def data_json(model):
    """El modelo en JSON listo para ir dentro de un <script>: `</` escapado como `<\\/` (JSON lo lee igual)."""
    text = json.dumps(model, ensure_ascii=False, separators=(",", ":"))
    if isinstance(text, bytes):
        text = text.decode("utf-8")
    return text.replace("</", "<\\/")


def _local_file(src, app_dir):
    """La ruta del archivo de app/ al que apunta un src; None si es remoto, no existe o queda fuera de app/."""
    if not src or _SCHEME.match(src):
        return None
    rel = unquote(src.split("#", 1)[0].split("?", 1)[0]).lstrip("/\\")
    if not rel:
        return None
    root = os.path.normcase(os.path.normpath(os.path.abspath(app_dir)))
    path = os.path.normpath(os.path.join(root, rel))
    if not os.path.normcase(path).startswith(root + os.sep) or not os.path.isfile(path):
        return None
    return path


def _read(path):
    with io.open(path, encoding="utf-8-sig") as f:
        return f.read()


def bundle(index_html, app_dir, model):
    """El HTML portátil a partir del texto de index.html. Devuelve (html, insertados, sin_insertar): las rutas src que
    se metieron en el HTML y las que se quedaron como estaban (remotas o que no están en app/).
    BundleError si el marcador no aparece exactamente una vez."""
    count = index_html.count(MARKER)
    if count != 1:
        raise BundleError("app/index.html tiene {0} marcadores de datos (debe tener uno: {1})".format(count, MARKER))
    data = DATA_OPEN + data_json(model) + "</script>"
    inlined, kept = [], []

    def replace(match):
        if match.group("marker"):
            return data if match.group("marker") == MARKER else match.group(0)  # exacto, mayúsculas incluidas
        attrs = match.group("attrs")
        found = _SRC.search(attrs)
        if not found:
            return match.group(0)
        src = found.group("dq") if found.group("dq") is not None else (
            found.group("sq") if found.group("sq") is not None else found.group("bare"))
        path = _local_file(src, app_dir)
        if path is None:
            kept.append(src)
            return match.group(0)
        inlined.append(src)
        code = _CLOSE.sub(lambda m: "<\\/" + m.group(1), _read(path))
        rest = (attrs[:found.start()] + attrs[found.end():]).rstrip()
        return "<script" + rest + ">\n" + code + "\n</script>"

    html = _TAG.sub(replace, index_html)
    return html, inlined, kept


def bundle_file(index_path, model):
    """bundle() leyendo index.html de disco; los scripts se buscan junto a él."""
    return bundle(_read(index_path), os.path.dirname(index_path), model)
