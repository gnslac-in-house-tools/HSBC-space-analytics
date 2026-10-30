# -*- coding: utf-8 -*-
"""Geometría en planta: pies a metros, polígonos del contrato, envolvente convexa y área."""
import pytest

from sa_model.geometry import (FOOT, convex_hull, dedupe, extent_along, footprint, m, m2, outline, point, polygon,
                               polygon_area, polyline, r, rectangle, signed_area, unit)

F = 1 / FOOT  # un metro en pies


def test_feet_to_metres():
    assert m(1) == pytest.approx(0.3048)
    assert m(F) == pytest.approx(1)
    assert m2(F * F) == pytest.approx(1)
    assert point((F, 2 * F)) == [1.0, 2.0]


def test_rounds_to_three_decimals_and_never_says_minus_zero():
    assert r(1.23456) == 1.235
    assert r(-0.0004) == 0.0
    assert str(r(-0.0004)) == "0.0"


def test_area_of_squares_and_triangles():
    square = [[0, 0], [4, 0], [4, 4], [0, 4]]
    assert polygon_area(square) == 16
    assert signed_area(square) == 16
    assert signed_area(list(reversed(square))) == -16
    assert polygon_area([[0, 0], [3, 0], [0, 2]]) == 3
    assert polygon_area([[0, 0], [1, 1]]) == 0


def test_area_of_an_l():
    l_shape = [[0, 0], [6, 0], [6, 2], [2, 2], [2, 5], [0, 5]]
    assert polygon_area(l_shape) == 6 * 2 + 2 * 3


def test_drops_repeated_points_and_the_closing_one():
    assert dedupe([[0, 0], [0, 0], [1, 0], [1, 1], [0, 0]]) == [[0, 0], [1, 0], [1, 1]]
    assert dedupe([[0, 0], [1, 0], [1, 0], [0, 0]], closed=False) == [[0, 0], [1, 0], [0, 0]]


def test_a_tessellated_loop_becomes_a_polygon_in_metres():
    # cada curva de un contorno teselada repite su último punto como primero de la siguiente, y el lazo se cierra
    loop = [(0, 0), (10 * F, 0), (10 * F, 0), (10 * F, 5 * F), (10 * F, 5 * F), (0, 5 * F), (0, 0)]
    assert polygon(loop) == [[0, 0], [10, 0], [10, 5], [0, 5]]


def test_points_that_collapse_when_rounded_leave_no_polygon():
    assert polygon([(0, 0), (0.0001, 0), (0, 0.0001)]) is None
    assert polygon([(0, 0), (F, 0), (2 * F, 0)]) is None  # colineales: sin área


def test_outline_puts_the_largest_loop_first_whatever_revit_s_order():
    hole = [(4 * F, 4 * F), (4 * F, 6 * F), (6 * F, 6 * F), (6 * F, 4 * F)]
    outer = [(0, 0), (10 * F, 0), (10 * F, 10 * F), (0, 10 * F)]
    shape = outline([hole, outer, [(0, 0)]])
    assert shape == [[[0, 0], [10, 0], [10, 10], [0, 10]], [[4, 4], [4, 6], [6, 6], [6, 4]]]
    assert outline([]) is None


def test_a_wall_axis_keeps_its_ends():
    assert polyline([(0, 0), (F, 0), (F, 0), (2 * F, F)]) == [[0, 0], [1, 0], [2, 1]]
    assert polyline([(0, 0), (0, 0)]) is None


def test_convex_hull_of_a_square_with_points_inside_and_on_its_edges():
    pts = [(0, 0), (2, 0), (2, 2), (0, 2), (1, 1), (1, 0), (0.5, 0.5), (2, 1), (0, 0)]
    hull = convex_hull(pts)
    assert hull == [[0, 0], [2, 0], [2, 2], [0, 2]]
    assert signed_area(hull) > 0  # antihorario


def test_convex_hull_of_a_cloud():
    import math
    ring = [(math.cos(a / 10.0) * 3, math.sin(a / 10.0) * 3) for a in range(63)]
    inside = [(0.1 * i, -0.05 * i) for i in range(20)]
    hull = convex_hull(inside + ring)
    assert len(hull) == len(set(ring))
    assert polygon_area(hull) == pytest.approx(math.pi * 9, rel=0.01)


def test_convex_hull_of_degenerate_clouds():
    assert convex_hull([]) == []
    assert convex_hull([(1, 1), (1, 1)]) == [[1, 1]]
    assert len(convex_hull([(0, 0), (1, 1), (2, 2)])) == 2
    assert footprint([(0, 0), (1, 1), (2, 2)]) is None


def test_footprint_is_the_hull_in_metres():
    # una silla vista de arriba: patas y asiento, con puntos a varias alturas (solo cuenta la planta)
    pts = [(0, 0), (F, 0), (F, F), (0, F), (0.5 * F, 0.5 * F), (0.5 * F, 1.2 * F)]
    assert footprint(pts) == [[0, 0], [1, 0], [1, 1], [0.5, 1.2], [0, 1]]


def test_rectangle_and_extent():
    rect = rectangle((0, 0), (2, 1))
    assert rect == [(0, 0), (2, 0), (2, 1), (0, 1)]
    assert extent_along(rect, (1, 0)) == 2
    assert extent_along(rect, (0, 1)) == 1
    assert extent_along([], (1, 0)) == 0


def test_unit_vectors_in_plan():
    assert unit((3, 4, 9)) == [0.6, 0.8]
    assert unit((0, 0, 1)) is None
    assert unit((-2, 0)) == [-1.0, 0.0]
