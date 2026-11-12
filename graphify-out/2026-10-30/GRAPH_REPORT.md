# Graph Report - HSBC-space-analytics  (2026-10-30)

## Corpus Check
- 50 files · ~54,583 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 4 file(s) not represented in the graph (top: (none) 3, .ini 1)

## Summary
- 757 nodes · 1548 edges · 49 communities (35 shown, 14 thin omitted)
- Extraction: 95% EXTRACTED · 5% INFERRED · 0% AMBIGUOUS · INFERRED: 73 edges (avg confidence: 0.87)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `3164126c`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- renderViewport
- Space Model Contract & App Shell
- Export Window XAML
- Element Roles & Text
- Analysis Engine (engine.js)
- Plan Geometry Helpers
- ExportWindow
- exports.py
- Document Build Tests
- bundle.py
- export_window.py
- Space Model Document Builder
- Vertical Circulation
- extension_dir
- Revit Element Collector
- Revit Source & Links
- common.py
- Icon Generator
- collect.py
- Engine Tests
- id_value
- Levels & Openings
- Sample Branch Fixture
- launch.py
- Floors & Rooms Outlines
- test_extension.py
- test_bundle.py
- app/app.js
- Brand Icons
- Panel Bundle Config
- Tab Bundle Config
- Test Fixture App
- Breathe Overlay
- Command Palette
- Inspector Panel
- Present Mode
- toast
- el
- CLAUDE.md
- probe
- createRel
- drawSlide
- Paneles laterales: un solo lenguaje
- export_stem
- shell.py
- crossArea

## God Nodes (most connected - your core abstractions)
1. `Window` - 30 edges
2. `renderViewport()` - 25 edges
3. `commands()` - 24 edges
4. `toast()` - 22 edges
5. `renderInspector()` - 22 edges
6. `Collector` - 21 edges
7. `ExportWindow` - 17 edges
8. `space-model.json contract v1` - 17 edges
9. `focus()` - 16 edges
10. `Source` - 15 edges

## Surprising Connections (you probably didn't know these)
- `Fixture #space-model-data marker` --semantically_similar_to--> `#space-model-data JSON placeholder script`  [INFERRED] [semantically similar]
  revit/tests/fixtures/app/index.html → app/index.html
- `Exportar pushbutton (export.xaml + export_window.py)` --semantically_similar_to--> `Themes Aura/Niebla/Noche and Halos/Neutro background`  [INFERRED] [semantically similar]
  revit/README.md → app/index.html
- `Test fixture app/index.html for portable HTML inlining` --semantically_similar_to--> `Space Analytics web app shell (app/index.html)`  [INFERRED] [semantically similar]
  revit/tests/fixtures/app/index.html → app/index.html
- `space-model.json file input / drop zone` --shares_data_with--> `space-model.json contract v1`  [INFERRED]
  app/index.html → docs/space-model.md
- `Familias modal (type table, Excel join, CSV export, isolate/select)` --shares_data_with--> `types{} (ElementType records)`  [INFERRED]
  app/index.html → docs/space-model.md

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **How the app reads the model (grid, cuts, vegetation, connectors, doors)** — docs_space_model_analysis_grid, docs_space_model_movement_cut, docs_space_model_view_cut, docs_space_model_vegetation_model, docs_space_model_interlevel_routing, docs_space_model_door_graph [EXTRACTED 1.00]
- **Multi-stage export comparison via instrument bezel** — docs_space_model_design_stage, app_index_stage_switcher, app_index_astrolabio_instrument, docs_space_model_portable_html, revit_readme_exportar_button [INFERRED 0.85]
- **Revit export to portable HTML pipeline** — revit_readme_exportar_button, revit_readme_sa_revit, revit_readme_sa_model, docs_space_model_space_model_json_contract, docs_space_model_portable_html, app_index_space_model_data, app_index_space_analytics_app [INFERRED 0.85]
- **Space Analytics pyRevit Ribbon Branded Icon Set** — revit_spaceanalytics_extension_spaceanalytics_tab_analisis_panel_abrir_pushbutton_icon, revit_spaceanalytics_extension_spaceanalytics_tab_analisis_panel_abrir_pushbutton_icon_dark, revit_spaceanalytics_extension_spaceanalytics_tab_analisis_panel_exportar_pushbutton_icon, revit_spaceanalytics_extension_spaceanalytics_tab_analisis_panel_exportar_pushbutton_icon_dark, revit_spaceanalytics_extension_spaceanalytics_tab_analisis_panel_exportar_pushbutton_mark [INFERRED 0.85]

## Communities (49 total, 14 thin omitted)

### Community 0 - "renderViewport"
Cohesion: 0.21
Nodes (20): bld(), buildLayers(), commands(), inspHead(), layName(), levelsCard(), renderEmpty(), renderInspector() (+12 more)

### Community 1 - "Space Model Contract & App Shell"
Cohesion: 0.06
Nodes (42): app.js (UI), Astrolabio instrument (pillars, weights, goals, rings, bezel), engine.js (analysis engine), Familias modal (type table, Excel join, CSV export, isolate/select), space-model.json file input / drop zone, Plan tree symbols (canopy, leaf ribs, trunk) styles, Space Analytics web app shell (app/index.html), #space-model-data JSON placeholder script (+34 more)

### Community 2 - "Export Window XAML"
Cohesion: 0.08
Nodes (38): b, box, cancel_btn, counts_panel, dest_path, done_eyebrow, done_lines, done_title (+30 more)

### Community 3 - "Element Roles & Text"
Cohesion: 0.09
Nodes (22): accesses(), entrances(), is_access(), role_of(), unknown_roles(), count_list(), counts(), report() (+14 more)

### Community 4 - "Analysis Engine (engine.js)"
Cohesion: 0.13
Nodes (31): analyze(), boxBlur(), boxOf(), building(), castRay(), connectorsOf(), dijkstra(), fmt() (+23 more)

### Community 5 - "Plan Geometry Helpers"
Cohesion: 0.11
Nodes (19): convex_hull(), _cross(), dedupe(), footprint(), polygon(), polygon_area(), rectangle(), signed_area() (+11 more)

### Community 7 - "exports.py"
Cohesion: 0.15
Nodes (14): dumps(), ensure_folder(), exports_in(), latest_html(), output_folder(), parse_stem(), write_text(), _export() (+6 more)

### Community 8 - "Document Build Tests"
Cohesion: 0.12
Nodes (13): connector(), source(), touched(), built(), raw_model(), square(), test_a_connector_without_levels_or_shape_or_kind(), test_a_stair_s_footprint_from_its_geometry_when_there_is_some() (+5 more)

### Community 9 - "bundle.py"
Cohesion: 0.16
Nodes (10): bundle(), bundle_file(), replace(), BundleError, _local_file(), _read(), result(), test_a_src_outside_app_is_not_inlined() (+2 more)

### Community 10 - "export_window.py"
Cohesion: 0.10
Nodes (6): model_name(), main(), export(), main(), main(), main()

### Community 11 - "Space Model Document Builder"
Cohesion: 0.17
Nodes (14): build(), level(), _num(), obstacle(), params(), type_record(), wall(), _z() (+6 more)

### Community 12 - "Vertical Circulation"
Cohesion: 0.14
Nodes (11): fold(), kind_by_name(), stacked(), stair_z(), test_fold(), test_kind_by_name_in_obstacle_categories(), test_kind_by_name_in_the_vertical_circulation_category(), test_stacked_alone_without_its_base_or_placements() (+3 more)

### Community 13 - "extension_dir"
Cohesion: 0.33
Nodes (4): extension_dir(), find_app(), test_extension_dir_is_the_extension(), test_find_app_next_to_the_extension_or_at_the_repo_root()

### Community 14 - "Revit Element Collector"
Cohesion: 0.13
Nodes (7): Collector, geometry_points(), _room_of(), _tessellated(), is_valid(), number(), sa_params()

### Community 16 - "common.py"
Cohesion: 0.24
Nodes (5): _get(), has_param(), is_length(), name_of(), text()

### Community 17 - "Icon Generator"
Cohesion: 0.21
Nodes (7): conic(), draw(), main(), pixel(), png(), polyline(), _seg_dist()

### Community 18 - "collect.py"
Cohesion: 0.12
Nodes (8): extent_along(), Cancelled, collect(), _demolished(), _elements(), _level_param(), _names(), element_id_param()

### Community 19 - "Engine Tests"
Cohesion: 0.23
Nodes (9): assert, box(), door(), garden(), rect(), test, tower(), tree() (+1 more)

### Community 20 - "id_value"
Cohesion: 0.29
Nodes (3): loaded_links(), final_phase(), id_value()

### Community 21 - "Levels & Openings"
Cohesion: 0.17
Nodes (9): _elevation(), opening(), resolve_level(), m(), unit(), test_a_window_without_sill_gets_it_from_its_level(), test_an_opening_with_no_facing_takes_it_from_its_hand(), test_resolve_level() (+1 more)

### Community 22 - "Sample Branch Fixture"
Cohesion: 0.24
Nodes (9): build(), circleU(), fs, m, out, P(), path, rectU() (+1 more)

### Community 23 - "launch.py"
Cohesion: 0.13
Nodes (11): app_args(), bridge_html(), file_url(), find_browser(), profile_dir(), open_view(), test_app_args_narrow_or_maximized(), test_bridge_jumps_to_the_url_with_its_hash() (+3 more)

### Community 24 - "Floors & Rooms Outlines"
Cohesion: 0.24
Nodes (7): floor(), room(), m2(), outline(), r(), test_outline_puts_the_largest_loop_first_whatever_revit_s_order(), test_rounds_to_three_decimals_and_never_says_minus_zero()

### Community 25 - "test_extension.py"
Cohesion: 0.12
Nodes (20): _defined(), imports(), layout(), test_every_button_has_a_script_a_bundle_and_its_icons(), test_every_button_is_in_its_panel_s_layout(), test_every_icon_is_a_96_px_png(), test_every_panel_is_in_the_tab_s_layout(), test_never_integer_value_outside_the_fallback() (+12 more)

### Community 26 - "test_bundle.py"
Cohesion: 0.23
Nodes (10): data_json(), data_of(), read(), test_a_copy_of_the_app_bundles_the_same(), test_data_json_escapes_every_closing_tag(), test_inlined_code_cannot_close_its_own_script_and_keeps_its_backslashes_and_dollars(), test_local_scripts_are_inlined_and_remote_ones_kept(), test_the_data_goes_in_the_marker_and_reads_back_the_same() (+2 more)

### Community 27 - "app/app.js"
Cohesion: 0.11
Nodes (28): arc(), bullet(), click(), closePal(), drawPal(), gauge(), idxNow(), indexVal() (+20 more)

### Community 28 - "Brand Icons"
Cohesion: 0.48
Nodes (6): Abrir Button Icon (Light Theme), Abrir Button Icon (Dark Theme), Exportar Button Icon (Light Theme), Exportar Button Icon (Dark Theme), Space Analytics Brand Mark (Rainbow Ring), Rainbow Conic-Gradient Ring Brand Identity

### Community 38 - "toast"
Cohesion: 0.18
Nodes (18): addModels(), applyRows(), closeFam(), downloadCSV(), famRows(), levelFor(), loadSample(), loadTable() (+10 more)

### Community 39 - "el"
Cohesion: 0.21
Nodes (15): axoBox(), axoLayers(), css(), drawAxo(), drawLayer3D(), drawOpening(), drawPlan(), drawPlant() (+7 more)

### Community 41 - "probe"
Cohesion: 0.21
Nodes (13): armZone(), axoNav(), cellOf(), clearRooms(), drawZone(), hitElement(), openZone(), placeZone() (+5 more)

### Community 42 - "createRel"
Cohesion: 0.30
Nodes (16): applyHash(), buildInst(), bumpW(), createRel(), focus(), listen(), nodeClick(), removeRel() (+8 more)

### Community 43 - "drawSlide"
Cohesion: 0.43
Nodes (7): deck(), drawSlide(), planKey(), present(), thrFor(), zoneCard(), zoneRelArea()

### Community 44 - "Paneles laterales: un solo lenguaje"
Cohesion: 0.33
Nodes (5): Estructura, Paneles laterales: un solo lenguaje, Piezas, Reglas, Resumen compacto

### Community 45 - "export_stem"
Cohesion: 0.20
Nodes (6): export_stem(), model_stem(), sanitize(), stamp(), test_model_stem_drops_the_rvt_and_the_folder(), test_sanitize_windows_names()

### Community 47 - "crossArea"
Cohesion: 0.50
Nodes (5): crossArea(), donut(), relLeft(), relRooms(), valueAt()

## Ambiguous Edges - Review These
- `Exportar Button Icon (Light Theme)` → `Space Analytics Brand Mark (Rainbow Ring)`  [AMBIGUOUS]
  revit/SpaceAnalytics.extension/SpaceAnalytics.tab/Analisis.panel/Exportar.pushbutton/mark.png · relation: references

## Knowledge Gaps
- **17 isolated node(s):** `Path`, `Image`, `ProgressBar`, `WrapPanel`, `Plan tree symbols (canopy, leaf ribs, trunk) styles` (+12 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 209 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **14 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `ExportWindow` connect `ExportWindow` to `export_window.py`?**
  _High betweenness centrality (0.026) - this node is a cross-community bridge._
- **Are the 3 inferred relationships involving `commands()` (e.g. with `openDigest()` and `present()`) actually correct?**
  _`commands()` has 3 INFERRED edges - model-reasoned connections that need verification._
- **What connects `Path`, `Image`, `ProgressBar` to the rest of the system?**
  _17 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Space Model Contract & App Shell` be split into smaller, more focused modules?**
  _Cohesion score 0.06108597285067873 - nodes in this community are weakly interconnected._
- **Why does `Source` connect `Revit Source & Links` to `common.py`, `collect.py`, `id_value`, `Revit Element Collector`?**
  _High betweenness centrality (0.020) - this node is a cross-community bridge._
- **Should `Export Window XAML` be split into smaller, more focused modules?**
  _Cohesion score 0.0796221322537112 - nodes in this community are weakly interconnected._

### Low-confidence Hints
_AMBIGUOUS edges — the extractor was unsure. Verify before acting on these._

- **What is the exact relationship between `Exportar Button Icon (Light Theme)` and `Space Analytics Brand Mark (Rainbow Ring)`?**
  _Edge tagged AMBIGUOUS (relation: references) - confidence is low._