# -*- coding: utf-8 -*-
"""El documento del contrato (docs/space-model.md) a partir de registros crudos falsos, como los entrega sa_revit:
en pies, con ids de texto, ya transformados si vienen de un vínculo."""
import json
from datetime import datetime

import pytest

from sa_model import EXPORTER_VERSION, SCHEMA
from sa_model.document import build, connector, opening, params, resolve_level, source, touched, type_record

F = 1 / 0.3048  # un metro en pies
WHEN = datetime(2026, 10, 29, 18, 20, 5)


def square(x0, y0, side):
    return [(x0 * F, y0 * F), ((x0 + side) * F, y0 * F), ((x0 + side) * F, (y0 + side) * F), (x0 * F, (y0 + side) * F)]


def raw_model():
    return {
        "levels": [
            {"id": "20", "name": "Nivel 2", "elevation": 4 * F},
            {"id": "10", "name": "Nivel 1", "elevation": 0.0},
        ],
        "rooms": [
            {"id": "100", "level_id": "10", "z": 0.0, "name": "Banca", "number": "01", "area": 100 * F * F,
             "loops": [square(0, 0, 10), square(4, 4, 1)], "department": "Atención",
             "params": [("SA_Rol", "Espera", False)]},
            {"id": "101", "level_id": "10", "z": 0.0, "name": "Sin contorno", "number": "02", "area": 1.0, "loops": []},
        ],
        "floors": [
            {"id": "200", "level_id": "10", "type": "900", "loops": [square(0, 0, 10)], "top": 0.0, "area": 100 * F * F},
        ],
        "walls": [
            {"id": "300", "level_id": "10", "type": "901", "path": [(0, 0), (10 * F, 0)], "thickness": 0.2 * F,
             "z": (0.0, 3 * F), "curtain": False},
            {"id": "5:301", "level_id": None, "type": "5:902", "path": [(0, 10 * F), (10 * F, 10 * F)],
             "thickness": 0.05 * F, "z": (4 * F - 0.1, 7 * F), "curtain": True},
            {"id": "302", "level_id": "10", "type": "901", "path": [(0, 0)], "thickness": 0.2 * F, "z": (0, 3 * F)},
        ],
        "doors": [
            {"id": "400", "level_id": "10", "type": "903", "host": "300", "at": (5 * F, 0), "hand": (2, 0, 0),
             "facing": (0, -3, 0), "width": 0.9 * F, "height": 2.1 * F, "z": 0.0, "from_room": None, "to_room": "100",
             "params": [("SA_Rol", "Entrada", False)]},
        ],
        "windows": [
            {"id": "500", "level_id": "10", "type": "904", "host": "300", "at": (2 * F, 0), "hand": (1, 0),
             "facing": (0, 1), "width": 1.2 * F, "height": 1.5 * F, "z": 0.9 * F, "from_room": None, "to_room": None,
             "params": [], "sill": 0.9 * F, "head": None},
        ],
        "obstacles": [
            {"id": "600", "level_id": None, "type": "905", "category": "Furniture",
             "points": [(1 * F, 1 * F), (2 * F, 1 * F), (2 * F, 2 * F), (1 * F, 2 * F), (1.5 * F, 1.5 * F)],
             "box": square(1, 1, 1), "z": (0.0, 0.75 * F), "room": "100", "params": []},
            {"id": "601", "level_id": "10", "type": "906", "category": "Columns", "points": [],
             "box": square(8, 8, 0.4), "z": (0.0, 3 * F), "room": None},
            {"id": "602", "level_id": "10", "type": "907", "category": "Generic", "points": [], "box": None,
             "z": (0.0, 1.0)},
        ],
        "types": {
            "900": {"category": "Floors", "family": "Piso", "name": "Concreto 200", "type_mark": "P01",
                    "materials": [("Concreto", 0.2 * F)], "params": [("SA_GWP", 42.0, False)], "cost": 0.0},
            "901": {"category": "Walls", "family": "Muro básico", "name": "Tabique 200",
                    "materials": [("Yeso", 0.016 * F), ("", 0.175 * F)]},
            "5:902": {"category": "Walls", "family": "Muro cortina", "name": "Vidrio", "params": [("SA_Opaco", 0)]},
            "903": {"category": "Doors", "family": "Puerta", "name": "900 x 2100"},
            "904": {"category": "Windows", "family": "Ventana", "name": "1200 x 1500"},
            "905": {"category": "Furniture", "family": "Banca lounge", "name": "1800 mm", "type_mark": "F01",
                    "cost": 1250.0, "params": [("SA_GWP", 42.0, False), ("SA_Rol", "Espera", False)]},
            "906": {"category": "Columns", "family": "Columna", "name": "400"},
            "907": {"category": "Generic", "family": "Caja", "name": "sin geometría"},
            "999": {"category": "Furniture", "family": "No usado", "name": "x"},
        },
    }


@pytest.fixture
def built():
    src = source("2025", "Sucursal Reforma.rvt", "Esquemático", "Nueva construcción", ["Base building.rvt"], WHEN)
    return build(src, raw_model())


def test_the_root_follows_the_contract(built):
    doc, _ = built
    assert doc["schema"] == SCHEMA == "hsbc-space-analytics/space-model@1"
    assert doc["source"] == {"app": "Revit", "version": "2025", "file": "Sucursal Reforma.rvt",
                             "exported_at": "2026-10-29T18:20:05", "exporter": EXPORTER_VERSION,
                             "stage": "Esquemático", "phase": "Nueva construcción", "links": ["Base building.rvt"]}
    assert sorted(doc) == sorted(["schema", "source", "levels", "rooms", "floors", "walls", "doors", "windows",
                                  "obstacles", "connectors", "types"])
    assert doc["connectors"] == []
    json.dumps(doc, ensure_ascii=False)  # todo serializable


def test_levels_in_metres_sorted_by_elevation(built):
    doc, _ = built
    assert doc["levels"] == [{"id": "10", "name": "Nivel 1", "elevation": 0.0},
                             {"id": "20", "name": "Nivel 2", "elevation": 4.0}]


def test_a_room_with_its_hole_and_its_params(built):
    doc, dropped = built
    assert len(doc["rooms"]) == 1 and dropped["rooms"] == 1
    room = doc["rooms"][0]
    assert room == {"id": "100", "level": "10", "name": "Banca", "number": "01", "area": 100.0,
                    "outline": [[[0, 0], [10, 0], [10, 10], [0, 10]], [[4, 4], [5, 4], [5, 5], [4, 5]]],
                    "department": "Atención", "params": {"SA_Rol": "Espera"}}


def test_a_floor(built):
    doc, _ = built
    assert doc["floors"] == [{"id": "200", "level": "10", "type": "900",
                              "outline": [[[0, 0], [10, 0], [10, 10], [0, 10]]], "top": 0.0, "area": 100.0}]


def test_walls_and_a_curtain_wall_from_a_link(built):
    doc, dropped = built
    assert dropped["walls"] == 1  # el muro sin eje
    host, linked = doc["walls"]
    assert host == {"id": "300", "level": "10", "type": "901", "path": [[0, 0], [10, 0]], "thickness": 0.2,
                    "z": [0.0, 3.0], "curtain": False}
    # sin nivel propio (vínculo): el más alto con elevación <= z inferior + 0.3 m
    assert linked["level"] == "20" and linked["curtain"] is True and linked["id"] == "5:301"
    assert linked["z"] == [3.97, 7.0]


def test_a_door_with_unit_vectors(built):
    doc, _ = built
    door = doc["doors"][0]
    assert door == {"id": "400", "level": "10", "type": "903", "host": "300", "at": [5.0, 0.0], "hand": [1.0, 0.0],
                    "facing": [0.0, -1.0], "width": 0.9, "height": 2.1, "z": 0.0, "from_room": None,
                    "to_room": "100", "params": {"SA_Rol": "Entrada"}}
    assert "sill" not in door


def test_a_window_s_head_comes_from_its_sill_and_height_when_missing(built):
    doc, _ = built
    window = doc["windows"][0]
    assert window["sill"] == 0.9 and window["head"] == 2.4 and window["z"] == 0.9


def test_a_window_without_sill_gets_it_from_its_level():
    levels = [{"id": "10", "name": "N1", "elevation": 3.0}]
    raw = {"id": "1", "level_id": "10", "at": (0, 0), "hand": (1, 0), "facing": (0, 1), "width": F, "height": F,
           "z": 3.8 * F}
    w = opening(raw, levels, window=True)
    assert w["sill"] == 0.8 and w["head"] == 1.8


def test_an_opening_with_no_facing_takes_it_from_its_hand():
    raw = {"id": "1", "at": (0, 0), "hand": (0, 1), "facing": (0, 0), "width": F, "height": F, "z": 0}
    d = opening(raw, [], window=False)
    assert d["hand"] == [0.0, 1.0] and d["facing"] == [-1.0, 0.0] and d["level"] is None
    assert opening(dict(raw, width=None), []) is None


def test_obstacles_footprint_from_geometry_else_bounding_box(built):
    doc, dropped = built
    chair, column = doc["obstacles"]
    assert chair["footprint"] == [[1, 1], [2, 1], [2, 2], [1, 2]]
    assert chair["level"] == "10" and chair["room"] == "100" and chair["category"] == "Furniture"
    assert chair["z"] == [0.0, 0.75] and chair["params"] == {}
    assert column["footprint"] == [[8, 8], [8.4, 8], [8.4, 8.4], [8, 8.4]]
    assert column["room"] is None
    assert dropped["obstacles"] == 1  # sin puntos ni bounding box


def test_types_only_those_used_with_the_contract_s_fields(built):
    doc, _ = built
    assert sorted(doc["types"]) == ["5:902", "900", "901", "903", "904", "905", "906"]
    assert doc["types"]["905"] == {"category": "Furniture", "family": "Banca lounge", "name": "1800 mm",
                                   "type_mark": "F01", "description": "", "manufacturer": "", "model": "",
                                   "cost": 1250.0, "keynote": "", "materials": [],
                                   "params": {"SA_GWP": 42.0, "SA_Rol": "Espera"}}
    assert doc["types"]["900"]["materials"] == [{"name": "Concreto", "thickness": 0.2}]
    assert doc["types"]["901"]["materials"] == [{"name": "Yeso", "thickness": 0.016}, {"name": "", "thickness": 0.175}]
    assert doc["types"]["901"]["cost"] is None
    assert doc["types"]["5:902"]["params"] == {"SA_Opaco": 0}


def test_params_lengths_in_metres_numbers_as_numbers_text_as_text():
    assert params([("SA_Alto", 2 * F, True), ("SA_GWP", 42.5, False), ("SA_EPD", 1, False), ("SA_Rol", "Bóveda", False),
                   ("SA_Nada", None, False), ("SA_Si", True, False)]) == \
        {"SA_Alto": 2.0, "SA_GWP": 42.5, "SA_EPD": 1, "SA_Rol": "Bóveda", "SA_Si": 1}
    assert params(None) == {}


def test_resolve_level():
    levels = [{"id": "a", "elevation": 0.0}, {"id": "b", "elevation": 4.0}, {"id": "c", "elevation": 8.0}]
    assert resolve_level("b", None, levels) == "b"
    assert resolve_level("zz", 4 * F, levels) == "b"  # un id que no es nivel exportado: por z
    assert resolve_level(None, 3.7 * F, levels) == "b"  # 0.3 m por debajo todavía es de ese nivel
    assert resolve_level(None, 3.69 * F, levels) == "a"
    assert resolve_level(None, 100 * F, levels) == "c"
    assert resolve_level(None, -1 * F, levels) is None
    assert resolve_level(None, None, levels) is None


def test_a_type_with_nothing_still_has_every_field():
    assert type_record({}) == {"category": "", "family": "", "name": "", "type_mark": "", "description": "",
                               "manufacturer": "", "model": "", "cost": None, "keynote": "", "materials": [],
                               "params": {}}


LEVELS = [{"id": "10", "name": "N1", "elevation": 0.0}, {"id": "20", "name": "N2", "elevation": 4.0},
          {"id": "30", "name": "N3", "elevation": 8.0}, {"id": "40", "name": "Azotea", "elevation": 12.0}]


def test_a_stair_touches_the_levels_it_joins():
    raw = {"id": "700", "kind": "stair", "type": "908", "points": [], "box": square(2, 2, 3), "z": (0.0, 4 * F),
           "snap": False, "params": [("SA_Rol", "Evacuación", False)]}
    assert connector(raw, LEVELS) == {"id": "700", "kind": "stair", "type": "908",
                                      "footprint": [[2, 2], [5, 2], [5, 5], [2, 5]], "z": [0.0, 4.0],
                                      "levels": ["10", "20"], "params": {"SA_Rol": "Evacuación"}}


def test_a_stair_s_footprint_from_its_geometry_when_there_is_some():
    raw = {"id": "701", "kind": "ramp", "points": [(0, 0), (2 * F, 0), (2 * F, F), (0, F)], "box": square(0, 0, 9),
           "z": (0.0, 0.5 * F)}
    c = connector(raw, LEVELS)
    assert c["footprint"] == [[0, 0], [2, 0], [2, 1], [0, 1]]
    assert c["z"] == [0.0, 0.5] and c["levels"] == ["10"] and c["type"] is None and c["params"] == {}


def test_an_elevator_snaps_to_the_levels_it_serves():
    # de su nivel (0) a lo alto de su caja, con el sobrepaso por encima de N3
    raw = {"id": "5:702", "kind": "elevator", "type": "5:909", "box": square(6, 6, 2), "z": (0.0, 9.5 * F),
           "snap": True}
    c = connector(raw, LEVELS)
    assert c["z"] == [0.0, 8.0] and c["levels"] == ["10", "20", "30"]


def test_an_elevator_on_a_single_level_keeps_its_box():
    raw = {"id": "703", "kind": "elevator", "box": square(6, 6, 2), "z": (4 * F, 6.5 * F), "snap": True}
    c = connector(raw, LEVELS)
    assert c["z"] == [4.0, 6.5] and c["levels"] == ["20"]


def test_a_connector_without_levels_or_shape_or_kind():
    raw = {"id": "704", "kind": "stair", "box": square(0, 0, 1), "z": (-10 * F, -6 * F)}
    assert connector(raw, LEVELS)["levels"] is None
    assert connector(dict(raw, box=None), LEVELS) is None
    assert connector(dict(raw, z=None), LEVELS) is None
    assert connector(dict(raw, kind="tobogán"), LEVELS) is None


def test_touched_with_the_tolerance_of_a_level():
    assert [l["id"] for l in touched([0.3, 3.7], LEVELS)] == ["10", "20"]
    assert [l["id"] for l in touched([0.31, 3.69], LEVELS)] == []


def test_connectors_in_the_document_with_their_types():
    raw = raw_model()
    raw["connectors"] = [
        {"id": "700", "kind": "stair", "type": "908", "box": square(2, 2, 3), "z": (0.0, 4 * F)},
        {"id": "700@20", "kind": "stair", "type": "908", "box": square(2, 2, 3), "z": (4 * F, 8 * F)},
        {"id": "705", "kind": "escalator", "type": "910", "box": None, "z": (0.0, 4 * F)},
    ]
    raw["types"]["908"] = {"category": "Stairs", "family": "Escalera ensamblada", "name": "Concreto"}
    raw["types"]["910"] = {"category": "VerticalCirculation", "family": "Escalera eléctrica", "name": "1000"}
    doc, dropped = build(source("2025", "a.rvt", "Concepto", "", [], WHEN), raw)
    assert [(c["id"], c["z"], c["levels"]) for c in doc["connectors"]] == [
        ("700", [0.0, 4.0], ["10", "20"]), ("700@20", [4.0, 8.0], ["20"])]
    assert dropped["connectors"] == 1  # sin caja ni geometría
    assert doc["types"]["908"]["category"] == "Stairs" and "910" not in doc["types"]
