# -*- coding: utf-8 -*-
"""La ventana de Exportar fuera de Revit: que export.xaml sea XML válido (WPF no perdona un comentario con '--') y
que coincida con lib/export_window.py del botón: cada nombre que el código usa existe en el XAML y cada evento del
XAML tiene su método."""
import ast
import io
import os
import re
import xml.etree.ElementTree as ET

from sa_model import STAGES

HERE = os.path.dirname(os.path.abspath(__file__))
EXTENSION = os.path.normpath(os.path.join(HERE, "..", "SpaceAnalytics.extension"))
BUTTON = os.path.join(EXTENSION, "SpaceAnalytics.tab", "Analisis.panel", "Exportar.pushbutton")
XAML = os.path.join(BUTTON, "export.xaml")
WINDOW = os.path.join(BUTTON, "lib", "export_window.py")
X = "{http://schemas.microsoft.com/winfx/2006/xaml}"


def xaml():
    return ET.parse(XAML).getroot()


def window_class():
    with io.open(WINDOW, encoding="utf-8") as f:
        tree = ast.parse(f.read())
    return next(n for n in tree.body if isinstance(n, ast.ClassDef) and n.name == "ExportWindow")


def test_the_xaml_is_valid_xml_without_a_code_class():
    root = xaml()
    assert root.tag.endswith("Window")
    assert X + "Class" not in root.attrib  # pyRevit carga el XAML sin clase compilada


def test_every_name_the_window_uses_is_in_the_xaml():
    names = set(e.attrib[X + "Name"] for e in xaml().iter() if X + "Name" in e.attrib)
    used = set(n.attr for n in ast.walk(window_class())
               if isinstance(n, ast.Attribute) and isinstance(n.value, ast.Name) and n.value.id == "self")
    methods = set(n.name for n in window_class().body if isinstance(n, ast.FunctionDef))
    own = set()
    for node in ast.walk(window_class()):
        if isinstance(node, ast.Assign):
            for target in node.targets:
                for t in ([target] + list(getattr(target, "elts", []))):
                    if isinstance(t, ast.Attribute):
                        own.add(t.attr)
    inherited = {"Close", "Closing", "Dispatcher", "DragMove", "FindResource", "set_icon", "set_image_source"}
    missing = sorted(used - names - methods - own - inherited)
    assert not missing, missing


def test_every_event_in_the_xaml_has_its_method():
    methods = set(n.name for n in window_class().body if isinstance(n, ast.FunctionDef))
    events = set()
    for e in xaml().iter():
        for k, v in e.attrib.items():
            if k in ("Click", "MouseLeftButtonDown"):
                events.add(v)
    assert events and events <= methods, sorted(events - methods)


def test_one_stage_button_per_stage():
    names = [e.attrib[X + "Name"] for e in xaml().iter() if re.match(r"stage_\d$", e.attrib.get(X + "Name", ""))]
    assert names == ["stage_{0}".format(i) for i in range(len(STAGES))]


def test_the_window_has_the_app_mark():
    with open(os.path.join(BUTTON, "mark.png"), "rb") as f:
        assert f.read(8) == b"\x89PNG\r\n\x1a\n"
