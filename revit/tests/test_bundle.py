# -*- coding: utf-8 -*-
"""El HTML portátil: scripts locales dentro, el marcador con los datos y `</` escapado (docs/space-model.md)."""
import io
import json
import os
import re
import shutil

import pytest

from conftest import FIXTURES
from sa_model.bundle import MARKER, BundleError, bundle, bundle_file, data_json, extension_dir, find_app

APP = os.path.join(FIXTURES, "app")
MODELS = [
    {"schema": "hsbc-space-analytics/space-model@1", "source": {"stage": "Esquemático"},
     "rooms": [{"id": "1", "name": "Caja </script><script>alert(1)</script>", "department": "Bóveda"}]},
    {"schema": "hsbc-space-analytics/space-model@1", "source": {"stage": "Concepto"}, "rooms": []},
]


def read(path):
    with io.open(path, encoding="utf-8") as f:
        return f.read()


@pytest.fixture
def result():
    return bundle_file(os.path.join(APP, "index.html"), MODELS)


def data_of(html):
    found = re.findall(r'<script id="space-model-data" type="application/json">(.*?)</script>', html, re.S)
    assert len(found) == 1
    return found[0]


def test_the_data_goes_in_the_marker_and_reads_back_the_same(result):
    html, _, _ = result
    assert MARKER not in html
    data = data_of(html)
    assert "</" not in data and "<\\/script>" in data
    assert json.loads(data) == {"models": MODELS}  # JSON lee <\/ como </
    assert "Bóveda" in data  # sin escapar lo que no es ASCII


def test_local_scripts_are_inlined_and_remote_ones_kept(result):
    html, inlined, kept = result
    assert inlined == ["js/geometry.js", "./app.js"]
    assert kept == ["https://cdn.example.com/lib@1.0.0/lib.min.js", "missing.js"]
    assert '<script src="https://cdn.example.com/lib@1.0.0/lib.min.js"></script>' in html
    assert '<script src="missing.js"></script>' in html
    assert 'src="js/geometry.js"' not in html and 'src="./app.js"' not in html
    assert read(os.path.join(APP, "js", "geometry.js")).strip() in html
    # el resto de los atributos se queda
    assert '<script type="module">\n// app.js' in html


def test_inlined_code_cannot_close_its_own_script_and_keeps_its_backslashes_and_dollars(result):
    html, _, _ = result
    assert 'const tag = "<\\/script>";' in html
    swap = [l for l in read(os.path.join(APP, "app.js")).splitlines() if l.startswith("const swap")][0]
    assert "\\1" in swap and "\\$1" in swap and "$&" in swap
    assert swap in html  # re.sub no tocó las barras ni los $ del código
    # cada <script> abierto se cierra una sola vez: sin cierres de más dentro del código o los datos
    assert html.lower().count("</script") == read(os.path.join(APP, "index.html")).count("</script>")


def test_the_rest_of_the_page_is_untouched(result):
    html, _, _ = result
    original = read(os.path.join(APP, "index.html"))
    assert html.startswith(original.split("<script", 1)[0])
    assert html.rstrip().endswith("</body>\n</html>")


def test_without_the_marker_it_says_so(tmp_path):
    with pytest.raises(BundleError):
        bundle("<html><body></body></html>", str(tmp_path), MODELS)
    with pytest.raises(BundleError):
        bundle(MARKER + MARKER, str(tmp_path), MODELS)


def test_a_src_outside_app_is_not_inlined(tmp_path):
    app = tmp_path / "app"
    app.mkdir()
    (tmp_path / "secret.js").write_text("secret()", encoding="utf-8")
    html, inlined, kept = bundle('<script src="../secret.js"></script>' + MARKER, str(app), [])
    assert inlined == [] and kept == ["../secret.js"] and "secret()" not in html


def test_single_quotes_bare_src_and_query_strings(tmp_path):
    (tmp_path / "a.js").write_text("A()", encoding="utf-8")
    (tmp_path / "b c.js").write_text("B()", encoding="utf-8")
    page = "<SCRIPT src='a.js?v=2' defer></SCRIPT><script src=b%20c.js></script>" + MARKER
    html, inlined, _ = bundle(page, str(tmp_path), [])
    assert inlined == ["a.js?v=2", "b%20c.js"]
    assert "<script defer>\nA()\n</script>" in html and "<script>\nB()\n</script>" in html


def test_data_json_escapes_every_closing_tag():
    text = data_json([{"a": "</div></SCRIPT></script>"}])
    assert "</" not in text and json.loads(text) == {"models": [{"a": "</div></SCRIPT></script>"}]}


def test_find_app_next_to_the_extension_or_at_the_repo_root(tmp_path):
    ext = tmp_path / "repo" / "revit" / "SpaceAnalytics.extension"
    ext.mkdir(parents=True)
    assert find_app(str(ext)) is None
    root_app = tmp_path / "repo" / "app"
    root_app.mkdir()
    (root_app / "index.html").write_text(MARKER, encoding="utf-8")
    assert find_app(str(ext)) == os.path.normpath(str(root_app / "index.html"))
    (ext / "app").mkdir()
    (ext / "app" / "index.html").write_text(MARKER, encoding="utf-8")
    assert find_app(str(ext)) == os.path.normpath(str(ext / "app" / "index.html"))


def test_extension_dir_is_the_extension():
    assert os.path.basename(extension_dir()) == "SpaceAnalytics.extension"


def test_a_copy_of_the_app_bundles_the_same(tmp_path):
    # la app en otra carpeta: los scripts se buscan junto a su index.html
    shutil.copytree(APP, str(tmp_path / "app"))
    html, inlined, _ = bundle_file(str(tmp_path / "app" / "index.html"), MODELS)
    assert len(inlined) == 2 and json.loads(data_of(html)) == {"models": MODELS}
