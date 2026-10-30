# -*- coding: utf-8 -*-
"""La forma de la extensión (adaptado de los tests de GFit): lo que pyRevit necesita de cada botón, el único paquete
que toca Revit y el subconjunto de Python 2.7 que corre IronPython. Nada más lo vigila: fuera de Revit el código corre
en CPython 3 y los demás tests pasan igual."""
import ast
import io
import os
import re

import pytest

HERE = os.path.dirname(os.path.abspath(__file__))
EXTENSION = os.path.normpath(os.path.join(HERE, "..", "SpaceAnalytics.extension"))
TAB = os.path.join(EXTENSION, "SpaceAnalytics.tab")
OWN = ("sa_model", "sa_revit")


def sources():
    for root, _, files in os.walk(EXTENSION):
        for name in files:
            if name.endswith(".py"):
                path = os.path.join(root, name)
                with io.open(path, encoding="utf-8") as f:
                    yield os.path.relpath(path, EXTENSION).replace(os.sep, "/"), f.read()


SOURCES = sorted(sources())
BUTTONS = sorted(os.path.relpath(r, EXTENSION).replace(os.sep, "/") for r, _, _ in os.walk(EXTENSION)
                 if r.endswith(".pushbutton"))


def imports(text):
    names = []
    for node in ast.walk(ast.parse(text)):
        if isinstance(node, ast.Import):
            names += [a.name for a in node.names]
        elif isinstance(node, ast.ImportFrom) and node.module and node.level == 0:
            names.append(node.module)
    return names


def layout(path):
    with io.open(os.path.join(path, "bundle.yaml"), encoding="utf-8") as f:
        text = f.read()
    return re.findall(r"^\s*-\s*(\S+)\s*$", text, re.M), text


def test_finds_what_it_guards():
    assert "lib/sa_model/document.py" in dict(SOURCES)
    assert "lib/sa_revit/collect.py" in dict(SOURCES)
    assert BUTTONS == ["SpaceAnalytics.tab/Analisis.panel/Abrir.pushbutton",
                       "SpaceAnalytics.tab/Analisis.panel/Exportar.pushbutton"]


@pytest.mark.parametrize("button", BUTTONS)
def test_every_button_has_a_script_a_bundle_and_its_icons(button):
    folder = os.path.join(EXTENSION, button)
    for name in ("script.py", "bundle.yaml", "icon.png", "icon.dark.png"):
        assert os.path.isfile(os.path.join(folder, name)), "{0} has no {1}".format(button, name)


@pytest.mark.parametrize("button", BUTTONS)
def test_every_icon_is_a_96_px_png(button):
    for name in ("icon.png", "icon.dark.png"):
        with open(os.path.join(EXTENSION, button, name), "rb") as f:
            head = f.read(24)
        assert head[:8] == b"\x89PNG\r\n\x1a\n", name
        assert (int.from_bytes(head[16:20], "big"), int.from_bytes(head[20:24], "big")) == (96, 96), name


def test_every_button_is_in_its_panel_s_layout():
    for panel in set(b.rsplit("/", 1)[0] for b in BUTTONS):
        names, _ = layout(os.path.join(EXTENSION, panel))
        mine = sorted(b.rsplit("/", 1)[1][: -len(".pushbutton")] for b in BUTTONS if b.startswith(panel + "/"))
        assert sorted(names) == mine, panel


def test_every_panel_is_in_the_tab_s_layout():
    names, _ = layout(TAB)
    assert sorted(names) == sorted(n[: -len(".panel")] for n in os.listdir(TAB) if n.endswith(".panel"))


def test_the_ribbon_says_what_it_should():
    names, text = layout(TAB)
    assert names == ["Analisis"] and re.search(r"^title:\s*Space Analytics\s*$", text, re.M)
    names, text = layout(os.path.join(TAB, "Analisis.panel"))
    assert names == ["Exportar", "Abrir"] and re.search(r"^title:\s*Análisis\s*$", text, re.M)


def _defined(module):
    """Los nombres que un módulo de lib/ define arriba (y sus submódulos, si es un paquete)."""
    base = os.path.join(EXTENSION, "lib", *module.split("."))
    path = base + ".py" if os.path.isfile(base + ".py") else os.path.join(base, "__init__.py")
    with io.open(path, encoding="utf-8") as f:
        tree = ast.parse(f.read())
    names = set()
    for node in tree.body:
        if isinstance(node, (ast.FunctionDef, ast.ClassDef)):
            names.add(node.name)
        elif isinstance(node, ast.Assign):
            names.update(t.id for t in node.targets if isinstance(t, ast.Name))
        elif isinstance(node, (ast.Import, ast.ImportFrom)):
            names.update((a.asname or a.name).split(".")[0] for a in node.names)
    if os.path.isdir(base):
        names.update(n[:-3] if n.endswith(".py") else n for n in os.listdir(base))
    return names


@pytest.mark.parametrize("path, text", SOURCES)
def test_what_it_takes_from_the_extension_s_own_modules_is_there(path, text):
    # los botones y sa_revit no corren fuera de Revit: un nombre mal escrito solo saldría al hacer clic
    tree = ast.parse(text)
    aliases = {}
    for node in ast.walk(tree):
        if isinstance(node, ast.ImportFrom) and node.module and node.module.split(".")[0] in OWN:
            have = _defined(node.module)
            for a in node.names:
                assert a.name in have, "{0}: {1} has no {2}".format(path, node.module, a.name)
                sub = node.module + "." + a.name
                if os.path.isfile(os.path.join(EXTENSION, "lib", *sub.split(".")) + ".py"):
                    aliases[a.asname or a.name] = sub
        elif isinstance(node, ast.Import):
            for a in node.names:
                if a.name.split(".")[0] in OWN:
                    aliases[a.asname or a.name] = a.name
    for node in ast.walk(tree):
        if isinstance(node, ast.Attribute) and isinstance(node.value, ast.Name) and node.value.id in aliases:
            assert node.attr in _defined(aliases[node.value.id]), \
                "{0}:{1}: {2} has no {3}".format(path, node.lineno, aliases[node.value.id], node.attr)


@pytest.mark.parametrize("path, text", SOURCES)
def test_only_sa_revit_and_the_buttons_touch_revit(path, text):
    revit = [n for n in imports(text) if n.split(".")[0] in ("Autodesk", "pyrevit", "clr", "System", "RevitServices")]
    if path.startswith("lib/sa_model/"):
        assert revit == [], "{0} imports {1}".format(path, revit)
    if path.startswith("lib/sa_revit/"):
        assert "pyrevit" not in [n.split(".")[0] for n in revit], "{0}: the UI belongs to the buttons".format(path)


@pytest.mark.parametrize("path, text", SOURCES)
def test_never_integer_value_outside_the_fallback(path, text):
    # ElementId.IntegerValue ya no existe en Revit 2026+: solo common.id_value lo usa, si Value no existe
    uses = [n.lineno for n in ast.walk(ast.parse(text)) if isinstance(n, ast.Attribute) and n.attr == "IntegerValue"]
    if path == "lib/sa_revit/common.py":
        assert len(uses) == 1
    else:
        assert uses == [], "{0}: IntegerValue at {1}".format(path, uses)


@pytest.mark.parametrize("path, text", SOURCES)
def test_runs_under_ironpython_2_7(path, text):
    # el motor por omisión de pyRevit: un "#! python3" en la primera línea movería el botón a CPython
    assert not text.startswith("#!"), "{0}: no shebang, IronPython runs it".format(path)
    tree = ast.parse(text)
    for node in ast.walk(tree):
        assert not isinstance(node, ast.JoinedStr), "{0}:{1}: an f-string".format(path, node.lineno)
        assert not isinstance(node, ast.Nonlocal), "{0}:{1}: nonlocal".format(path, node.lineno)
        assert not isinstance(node, (ast.AsyncFunctionDef, ast.Await)), "{0}: async".format(path)
        if isinstance(node, (ast.FunctionDef, ast.AsyncFunctionDef)):
            a = node.args
            assert node.returns is None and all(x.annotation is None for x in a.args + a.kwonlyargs), \
                "{0}:{1}: an annotation".format(path, node.lineno)
            assert not a.kwonlyargs, "{0}:{1}: keyword-only arguments".format(path, node.lineno)
        if isinstance(node, ast.AnnAssign):
            raise AssertionError("{0}:{1}: an annotated assignment".format(path, node.lineno))
        if isinstance(node, ast.Call) and isinstance(node.func, ast.Name) and node.func.id == "super":
            assert node.args, "{0}:{1}: super() needs its arguments in Python 2".format(path, node.lineno)
        if isinstance(node, ast.Starred) and not isinstance(getattr(node, "ctx", None), ast.Load):
            raise AssertionError("{0}:{1}: a starred assignment".format(path, node.lineno))
        if isinstance(node, ast.Call) and isinstance(node.func, ast.Name) and node.func.id == "print":
            assert "print_function" in text, "{0}:{1}: print() needs print_function".format(path, node.lineno)
        if isinstance(node, ast.keyword) and node.arg == "exist_ok":
            raise AssertionError("{0}:{1}: exist_ok is Python 3 only".format(path, node.value.lineno))
    if any(ord(c) > 127 for c in text):
        assert "coding: utf-8" in text.splitlines()[0], "{0}: not ASCII, so its first line says utf-8".format(path)
