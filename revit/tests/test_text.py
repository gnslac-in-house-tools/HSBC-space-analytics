# -*- coding: utf-8 -*-
"""El resumen al exportar y lo que dicen los roles (SA_Rol, accesos)."""
from sa_model import roles
from sa_model.text import count_list, counts, report, skipped_line, summary, warnings


def doc(**kw):
    base = {"source": {"file": "Sucursal.rvt", "links": []}, "levels": [{"id": "1"}],
            "rooms": [{"id": "r1"}], "floors": [{"id": "f1"}], "walls": [], "windows": [], "obstacles": [],
            "doors": [{"id": "d1", "type": "t1", "from_room": None, "to_room": "r1", "params": {}},
                      {"id": "d2", "type": "t2", "from_room": "r1", "to_room": "r2", "params": {"SA_Rol": "Entrada"}}],
            "types": {"t1": {"params": {"SA_Rol": "Entrada"}}, "t2": {"params": {}}}}
    base.update(kw)
    return base


def test_roles_instance_first_then_type():
    d = doc()
    assert roles.role_of(d["doors"][0], d["types"]) == "Entrada"
    assert roles.role_of({"type": "t2", "params": {}}, d["types"]) is None
    assert roles.role_of({"type": "t1", "params": {"SA_Rol": "Personal"}}, d["types"]) == "Personal"


def test_accesses_and_entrances():
    d = doc()
    assert [x["id"] for x in roles.accesses(d)] == ["d1"]
    assert [x["id"] for x in roles.entrances(d)] == ["d1", "d2"]


def test_unknown_roles():
    d = doc(obstacles=[{"type": None, "params": {"SA_Rol": "Cajero"}}, {"type": None, "params": {"SA_Rol": "Cajero"}},
                       {"type": None, "params": {"SA_Rol": "Bóveda"}}])
    assert roles.unknown_roles(d) == ["Cajero"]


def test_every_obstacle_category_of_the_contract():
    assert sorted(set(c for _, c in roles.OBSTACLE_CATEGORIES)) == sorted(
        ["Columns", "Furniture", "Casework", "Equipment", "Plumbing", "Planting", "Generic"])


def test_counts():
    assert counts(doc()) == "1 niveles · 1 rooms · 1 pisos · 2 puertas · 2 tipos"
    assert counts({"rooms": []}) == "0 rooms"
    assert counts(doc(connectors=[{"id": "c1"}, {"id": "c2"}])) == \
        "1 niveles · 1 rooms · 1 pisos · 2 puertas · 2 circulaciones verticales · 2 tipos"


def test_a_complete_model_has_no_warnings():
    assert warnings(doc()) == []


def test_warnings_for_what_the_app_needs():
    found = warnings(doc(rooms=[], floors=[], doors=[]), dropped={"walls": 2}, failures=[("doors", "5:12", "boom")])
    assert any(w.startswith("Sin rooms") for w in found)
    assert any(w.startswith("Sin puertas:") for w in found)
    assert any(w.startswith("Sin pisos") for w in found)
    assert "Omitidos por no tener geometría: 2 muros." in found
    assert any("1 elementos fallaron" in w and "puertas 5:12: boom" in w for w in found)


def test_no_access_doors():
    d = doc(doors=[{"id": "d", "from_room": "a", "to_room": "b"}])
    assert any(w.startswith("Sin puertas de acceso") for w in warnings(d))


def test_many_failures_are_cut_short():
    failures = [("obstacles", str(i), "x") for i in range(20)]
    (w,) = warnings(doc(), failures=failures)
    assert "20 elementos fallaron" in w and "y 12 más" in w


def test_summary():
    msg, detail = summary(doc(), files=["C:/a.json", "C:/a.html"], skipped={"demolidos": 3, "rooms de otra fase": 0})
    assert msg == "Sucursal.rvt"
    assert "Accesos: 1 (2 con SA_Rol = Entrada)." in detail
    assert "Omitidos a propósito: 3 demolidos." in detail
    assert detail.endswith("Archivos:\nC:/a.json\nC:/a.html")
    assert "Avisos" not in detail
    assert skipped_line({}) is None


def test_report_has_the_summary_in_parts():
    r = report(doc(), files=["C:/a.json"], note="Nota.", skipped={"demolidos": 3})
    assert r["title"] == "Sucursal.rvt"
    assert r["counts"] == count_list(doc()) and "1 rooms" in r["counts"]
    assert r["lines"] == ["Accesos: 1 (2 con SA_Rol = Entrada).", "Omitidos a propósito: 3 demolidos.", "Nota."]
    assert r["warnings"] == [] and r["files"] == ["C:/a.json"]
    assert report(doc(rooms=[]))["warnings"][0].startswith("Sin rooms")
