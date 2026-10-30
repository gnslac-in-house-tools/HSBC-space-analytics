# -*- coding: utf-8 -*-
"""Abrir el HTML exportado en el resumen o en la presentación: la URL con su #, el navegador y la página puente."""
import os

from sa_model.launch import BROWSERS, PRESENT, SUMMARY, app_args, bridge_html, file_url, find_browser, profile_dir


def test_file_url_escapes_spaces_and_accents_and_keeps_the_view():
    url = file_url("C:\\Users\\ana\\Documents\\HSBC Space Analytics\\Sucursal · 2026-10-30 1417.html", SUMMARY)
    assert url == ("file:///C:/Users/ana/Documents/HSBC%20Space%20Analytics/"
                   "Sucursal%20%C2%B7%202026-10-30%201417.html#resumen=1")
    assert file_url("C:/a/b.html") == "file:///C:/a/b.html"
    assert file_url("C:/a/b.html", PRESENT).endswith("#present=1")


def test_find_browser_takes_the_first_that_exists():
    env = {"ProgramFiles(x86)": "C:\\PF86", "ProgramFiles": "C:\\PF", "LOCALAPPDATA": "C:\\LA"}
    chrome = os.path.join("C:\\PF", "Google\\Chrome\\Application\\chrome.exe")
    edge = os.path.join("C:\\LA", "Microsoft\\Edge\\Application\\msedge.exe")
    assert find_browser(env, lambda p: p in (chrome, edge)) == edge  # Edge antes que Chrome
    assert find_browser(env, lambda p: p == chrome) == chrome
    assert find_browser(env, lambda p: False) is None
    assert find_browser({}, lambda p: True) is None
    assert BROWSERS[0][1].endswith("msedge.exe")


def test_app_args_narrow_or_maximized():
    assert app_args("file:///C:/a.html#resumen=1", (440, 900)) == '--app="file:///C:/a.html#resumen=1" --window-size=440,900'
    assert app_args("file:///C:/a.html#present=1") == '--app="file:///C:/a.html#present=1" --start-maximized'


def test_its_own_profile_so_the_size_holds():
    profile = profile_dir({"LOCALAPPDATA": "C:/LA"})
    assert profile == os.path.join("C:/LA", "HSBC Space Analytics", "navegador")
    assert profile_dir({}) is None
    args = app_args("file:///C:/a.html", (440, 860), profile)
    assert args.endswith('--user-data-dir="{0}" --no-first-run --no-default-browser-check'.format(profile))


def test_bridge_jumps_to_the_url_with_its_hash():
    page = bridge_html("file:///C:/a%20b.html#resumen=1")
    assert 'location.replace("file:///C:/a%20b.html#resumen=1")' in page
    assert 'content="0;url=file:///C:/a%20b.html#resumen=1"' in page
