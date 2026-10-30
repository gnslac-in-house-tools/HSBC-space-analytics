# -*- coding: utf-8 -*-
"""La circulación vertical sin Revit: qué es cada familia por su nombre y entre qué cotas va una escalera."""
import pytest

from sa_model.vertical import KINDS, fold, kind_by_name, stacked, stair_z


def test_fold():
    assert fold("Elevador_Pasajeros-1600kg") == "elevador pasajeros 1600kg"
    assert fold("ESCALERA ELÉCTRICA  30°") == "escalera electrica 30"
    assert fold(None) == "" and fold("") == ""


@pytest.mark.parametrize("names, kind", [
    (["Elevador", "Pasajeros"], "elevator"),
    (["M_Elevator-Electric-Center", "1600 kg"], "elevator"),
    (["Ascensor hidráulico", ""], "elevator"),
    (["Caja", "Lift 01"], "elevator"),
    (["ELEVADORES", ""], "elevator"),
    (["Escalera Eléctrica", "30°"], "escalator"),
    (["escaleras mecanicas", ""], "escalator"),
    (["Escalator", "1000 mm"], "escalator"),
    (["Montacargas forklift", ""], None),  # "lift" solo como palabra
    (["Elevation marker", ""], None),
    (["Escalera", "Recta"], None),  # en una categoría de obstáculos, una escalera no es conector
    (["Silla", "Lounge"], None),
])
def test_kind_by_name_in_obstacle_categories(names, kind):
    assert kind_by_name(names) == kind


def test_kind_by_name_in_the_vertical_circulation_category():
    assert kind_by_name(["Escalera eléctrica", ""], vertical=True) == "escalator"
    assert kind_by_name(["Escalera", "Recta"], vertical=True) == "stair"
    assert kind_by_name(["Ramp", "1:12"], vertical=True) == "ramp"
    assert kind_by_name(["Cabina", "Estándar"], vertical=True) == "elevator"  # lo que no dice nada
    assert set(kind_by_name(n, vertical=True) for n in (["a"], ["stair"], ["rampa"], ["escalator"])) == set(KINDS)


def test_stair_z_from_its_levels_and_offsets():
    assert stair_z(0.0, None, 13.0, None) == (0.0, 13.0)
    assert stair_z(10.0, -0.5, 23.0, 1.0) == (9.5, 24.0)
    # sin nivel superior: abajo + su altura
    assert stair_z(10.0, 0.5, None, None, height=6.0) == (10.5, 16.5)
    # el "nivel superior de varios pisos" la sube hasta ahí; uno por debajo no cambia nada
    assert stair_z(0.0, 0.0, 13.0, 0.0, up_to=39.0) == (0.0, 39.0)
    assert stair_z(0.0, 0.0, 13.0, 0.0, up_to=5.0) == (0.0, 13.0)


def test_stair_z_none_without_base_or_height():
    assert stair_z(None, 0.0, 13.0, 0.0) is None
    assert stair_z(0.0, 0.0, None, None) is None
    assert stair_z(0.0, 0.0, None, None, height=0.0) is None
    assert stair_z(13.0, 0.0, 0.0, 0.0) is None  # arriba por debajo de abajo


def test_stacked_copies_of_a_multistory_stair():
    z = (13.5, 26.0)  # en su nivel base, 13.0, con desfase de 0.5
    copies = stacked(z, 13.0, [("n3", 26.0), ("n1", 0.0), ("n2", 13.0), ("sin cota", None)])
    assert copies == [("n1", (0.5, 13.0)), ("n2", (13.5, 26.0)), ("n3", (26.5, 39.0))]


def test_stacked_alone_without_its_base_or_placements():
    assert stacked((0.0, 13.0), None, [("n1", 0.0)]) == [(None, (0.0, 13.0))]
    assert stacked((0.0, 13.0), 0.0, []) == [(None, (0.0, 13.0))]
    assert stacked((0.0, 13.0), 0.0, [("x", None)]) == [(None, (0.0, 13.0))]
