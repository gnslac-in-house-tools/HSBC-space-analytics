# Graph Report - HSBC-space-analytics  (2026-11-02)

## Corpus Check
- 61 files · ~65,096 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 7 file(s) not represented in the graph (top: (none) 5, .css 1, .ini 1)

## Summary
- 851 nodes · 1684 edges · 52 communities (39 shown, 13 thin omitted)
- Extraction: 95% EXTRACTED · 5% INFERRED · 0% AMBIGUOUS · INFERRED: 90 edges (avg confidence: 0.86)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `a1e29ab4`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- Lenguaje de paneles laterales
- Roles SA_Rol y accesos
- XAML de la ventana Exportar
- Motor de análisis (engine.js)
- Archivos de exportación
- launch.py
- UI de la app (app.js)
- Paquetes sa_model y sa_revit
- Geometría en planta
- Documento: fuente y conectores
- Shell HTML de la app
- Inspector y capas
- Colector de elementos Revit
- Circulación vertical
- Tests de la extensión
- Familias y tabla Excel
- Lectura de tipos y parámetros
- bundle.py
- Construcción del documento
- Ventana ExportWindow
- test_bundle.py
- Fuente del modelo y vínculos
- Relaciones y prioridades
- Generador de íconos
- Dibujo de planta y axonometría
- Tests del motor
- Zonas y sondeo
- build.js
- opening
- build.js
- os
- halo.js
- Modo presentación
- id_value
- Íconos Abrir y Exportar
- Íconos Presentar y Resumen
- revit-ui.ps1
- Métricas de relaciones
- Reglas de graphify
- .run
- Panel Análisis (yaml)
- Pestaña SpaceAnalytics (yaml)
- Fixture de la app
- r
- extension_dir
- Cancelled

## God Nodes (most connected - your core abstractions)
1. `Window` - 30 edges
2. `renderViewport()` - 25 edges
3. `commands()` - 24 edges
4. `toast()` - 22 edges
5. `renderInspector()` - 22 edges
6. `Collector` - 21 edges
7. `ExportWindow` - 17 edges
8. `focus()` - 16 edges
9. `Source` - 15 edges
10. `is_valid()` - 14 edges

## Surprising Connections (you probably didn't know these)
- `Test fixture app/index.html for portable HTML inlining` --conceptually_related_to--> `Portable HTML (app with embedded data)`  [INFERRED]
  revit/tests/fixtures/app/index.html → docs/space-model.md
- `revit/tests pytest suite (CPython 3)` --semantically_similar_to--> `Engine tests (node --test app/tests/engine.test.js)`  [INFERRED] [semantically similar]
  revit/README.md → README.md
- `Fixture #space-model-data marker` --semantically_similar_to--> `Embedded space-model-data JSON script slot`  [INFERRED] [semantically similar]
  revit/tests/fixtures/app/index.html → app/index.html
- `Tablero (left panel)` --conceptually_related_to--> `Analysis pillars (flujo, visibilidad, seguridad, confort, sustentabilidad)`  [INFERRED]
  docs/paneles.md → README.md
- `lib/sa_revit (Revit collectors)` --implements--> `connectors[] (stairs, ramps, elevators, escalators)`  [INFERRED]
  revit/README.md → docs/space-model.md

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **Panels sharing one side-panel language** — app_index_side_panel_language, app_index_pillars_board, app_index_inspector, app_index_summary_panel [EXTRACTED 1.00]
- **Three-panel workspace: pillars board, viewport, inspector** — app_index_pillars_board, app_index_viewport, app_index_inspector [EXTRACTED 1.00]
- **Space Analytics ribbon: Exportar, Abrir, Resumen, Presentar** — revit_readme_exportar_button, revit_readme_abrir_button, revit_readme_resumen_button, revit_readme_presentar_button, docs_space_model_export_folder [EXTRACTED 1.00]
- **Shared side-panel language (tablero, inspector, resumen compacto)** — docs_paneles_tablero, docs_paneles_inspector, docs_paneles_resumen_compacto, docs_paneles_estructura, docs_paneles_piezas [EXTRACTED 1.00]
- **App spatial analysis: grid, movement/view cuts, vegetation, building graph** — docs_space_model_grid, docs_space_model_movement_cut, docs_space_model_view_cut, docs_space_model_vegetation, docs_space_model_building_graph, docs_space_model_doors_graph_edges [EXTRACTED 1.00]
- **Model loading flow (drop/open/embedded space-model.json into engine and app)** — app_index_model_drop_zone, app_index_space_model_data, app_index_space_model_json, app_engine, app_app [INFERRED 0.85]
- **Space Analytics pyRevit Ribbon Branded Icon Set** — revit_spaceanalytics_extension_spaceanalytics_tab_analisis_panel_abrir_pushbutton_icon, revit_spaceanalytics_extension_spaceanalytics_tab_analisis_panel_abrir_pushbutton_icon_dark, revit_spaceanalytics_extension_spaceanalytics_tab_analisis_panel_exportar_pushbutton_icon, revit_spaceanalytics_extension_spaceanalytics_tab_analisis_panel_exportar_pushbutton_icon_dark, revit_spaceanalytics_extension_spaceanalytics_tab_analisis_panel_exportar_pushbutton_mark [INFERRED 0.85]

## Communities (52 total, 13 thin omitted)

### Community 0 - "Lenguaje de paneles laterales"
Cohesion: 0.07
Nodes (40): Panel structure (.panel.side, .phd, .pbody, .sec, .hero), Inspector (right panel), Paneles laterales: un solo lenguaje, Panel pieces (.row, .b4, .val, .pst, .meta, .rc, .ib), Resumen compacto (#resumen=1), Tablero (left panel), Whole-building graph across levels (connector jump costs), connectors[] (stairs, ramps, elevators, escalators) (+32 more)

### Community 1 - "Roles SA_Rol y accesos"
Cohesion: 0.09
Nodes (22): accesses(), entrances(), is_access(), role_of(), unknown_roles(), count_list(), counts(), report() (+14 more)

### Community 2 - "XAML de la ventana Exportar"
Cohesion: 0.08
Nodes (38): b, box, cancel_btn, counts_panel, dest_path, done_eyebrow, done_lines, done_title (+30 more)

### Community 3 - "Motor de análisis (engine.js)"
Cohesion: 0.13
Nodes (31): analyze(), boxBlur(), boxOf(), building(), castRay(), connectorsOf(), dijkstra(), fmt() (+23 more)

### Community 4 - "Archivos de exportación"
Cohesion: 0.10
Nodes (19): dumps(), ensure_folder(), export_stem(), exports_in(), latest_html(), model_stem(), output_folder(), parse_stem() (+11 more)

### Community 5 - "launch.py"
Cohesion: 0.12
Nodes (12): app_args(), bridge_html(), file_url(), find_browser(), profile_dir(), open_view(), test_app_args_narrow_or_maximized(), test_bridge_jumps_to_the_url_with_its_hash() (+4 more)

### Community 6 - "UI de la app (app.js)"
Cohesion: 0.11
Nodes (28): arc(), bullet(), click(), closePal(), drawPal(), gauge(), idxNow(), indexVal() (+20 more)

### Community 7 - "Paquetes sa_model y sa_revit"
Cohesion: 0.14
Nodes (6): model_name(), main(), export(), main(), main(), main()

### Community 8 - "Geometría en planta"
Cohesion: 0.11
Nodes (20): convex_hull(), _cross(), dedupe(), footprint(), polygon(), polygon_area(), polyline(), rectangle() (+12 more)

### Community 9 - "Documento: fuente y conectores"
Cohesion: 0.12
Nodes (14): connector(), source(), touched(), built(), raw_model(), square(), test_a_connector_without_levels_or_shape_or_kind(), test_a_stair_s_footprint_from_its_geometry_when_there_is_some() (+6 more)

### Community 10 - "Shell HTML de la app"
Cohesion: 0.11
Nodes (22): index.html (Space Analytics app shell), Analysis grid cell size (0.5 m / 1.0 m), Breathe analysis overlay (orb, progress rows), Client priorities (pillar weights, weighted index), Command palette (Ctrl K, search quality or action), Excel table join by Type Mark (GWP, Reciclado, VOC, NRC, EPD, Costo), Model families modal (GWP, cost, recycled; CSV export, isolate/select), Inspector panel (focused pillar card, suggested actions) (+14 more)

### Community 11 - "Inspector y capas"
Cohesion: 0.21
Nodes (20): bld(), buildLayers(), commands(), inspHead(), layName(), levelsCard(), renderEmpty(), renderInspector() (+12 more)

### Community 12 - "Colector de elementos Revit"
Cohesion: 0.13
Nodes (7): Collector, geometry_points(), _level_param(), _room_of(), _tessellated(), is_valid(), sa_params()

### Community 13 - "Circulación vertical"
Cohesion: 0.14
Nodes (11): fold(), kind_by_name(), stacked(), stair_z(), test_fold(), test_kind_by_name_in_obstacle_categories(), test_kind_by_name_in_the_vertical_circulation_category(), test_stacked_alone_without_its_base_or_placements() (+3 more)

### Community 14 - "Tests de la extensión"
Cohesion: 0.12
Nodes (20): _defined(), imports(), layout(), test_every_button_has_a_script_a_bundle_and_its_icons(), test_every_button_is_in_its_panel_s_layout(), test_every_icon_is_a_96_px_png(), test_every_panel_is_in_the_tab_s_layout(), test_never_integer_value_outside_the_fallback() (+12 more)

### Community 15 - "Familias y tabla Excel"
Cohesion: 0.16
Nodes (19): addModels(), applyRows(), closeFam(), downloadCSV(), famRows(), levelFor(), loadDemo(), loadSample() (+11 more)

### Community 16 - "Lectura de tipos y parámetros"
Cohesion: 0.15
Nodes (9): extent_along(), collect(), element_id_param(), _get(), has_param(), is_length(), name_of(), number() (+1 more)

### Community 17 - "bundle.py"
Cohesion: 0.17
Nodes (9): bundle(), bundle_file(), replace(), BundleError, _local_file(), _read(), result(), test_a_src_outside_app_is_not_inlined() (+1 more)

### Community 18 - "Construcción del documento"
Cohesion: 0.25
Nodes (10): build(), level(), _num(), obstacle(), params(), type_record(), wall(), _z() (+2 more)

### Community 20 - "test_bundle.py"
Cohesion: 0.20
Nodes (11): data_json(), data_of(), read(), test_a_copy_of_the_app_bundles_the_same(), test_data_json_escapes_every_closing_tag(), test_inlined_code_cannot_close_its_own_script_and_keeps_its_backslashes_and_dollars(), test_local_scripts_are_inlined_and_remote_ones_kept(), test_the_data_goes_in_the_marker_and_reads_back_the_same() (+3 more)

### Community 22 - "Relaciones y prioridades"
Cohesion: 0.30
Nodes (16): applyHash(), buildInst(), bumpW(), createRel(), focus(), listen(), nodeClick(), removeRel() (+8 more)

### Community 23 - "Generador de íconos"
Cohesion: 0.21
Nodes (7): conic(), draw(), main(), pixel(), png(), polyline(), _seg_dist()

### Community 24 - "Dibujo de planta y axonometría"
Cohesion: 0.21
Nodes (15): axoBox(), axoLayers(), css(), drawAxo(), drawLayer3D(), drawOpening(), drawPlan(), drawPlant() (+7 more)

### Community 25 - "Tests del motor"
Cohesion: 0.23
Nodes (9): assert, box(), door(), garden(), rect(), test, tower(), tree() (+1 more)

### Community 26 - "Zonas y sondeo"
Cohesion: 0.21
Nodes (13): armZone(), axoNav(), cellOf(), clearRooms(), drawZone(), hitElement(), openZone(), placeZone() (+5 more)

### Community 27 - "build.js"
Cohesion: 0.10
Nodes (18): H, ORBS, OUT, dependencies, playwright@1.56.1, pptxgenjs@3.12.0, description, name (+10 more)

### Community 28 - "opening"
Cohesion: 0.18
Nodes (9): _elevation(), opening(), resolve_level(), m(), point(), test_a_window_without_sill_gets_it_from_its_level(), test_an_opening_with_no_facing_takes_it_from_its_hand(), test_resolve_level() (+1 more)

### Community 29 - "build.js"
Cohesion: 0.11
Nodes (18): build(), circleU(), fs, m, out, P(), path, rectU() (+10 more)

### Community 30 - "os"
Cohesion: 0.15
Nodes (3): documents_folder(), open_path(), sources()

### Community 31 - "halo.js"
Cohesion: 0.27
Nodes (4): area(), lentes(), montar(), ruta()

### Community 32 - "Modo presentación"
Cohesion: 0.43
Nodes (7): deck(), drawSlide(), planKey(), present(), thrFor(), zoneCard(), zoneRelArea()

### Community 33 - "id_value"
Cohesion: 0.29
Nodes (3): loaded_links(), final_phase(), id_value()

### Community 34 - "Íconos Abrir y Exportar"
Cohesion: 0.48
Nodes (6): Abrir Button Icon (Light Theme), Abrir Button Icon (Dark Theme), Exportar Button Icon (Light Theme), Exportar Button Icon (Dark Theme), Space Analytics Brand Mark (Rainbow Ring), Rainbow Conic-Gradient Ring Brand Identity

### Community 35 - "Íconos Presentar y Resumen"
Cohesion: 0.52
Nodes (7): Presentar button icon (light), Space Analytics brand mark (rainbow gradient ring), Presentar button icon (dark theme), Presentar pushbutton (present / play presentation), Resumen button icon (light), Resumen button icon (dark theme), Resumen pushbutton (summary / indicators chart)

### Community 36 - "revit-ui.ps1"
Cohesion: 0.15
Nodes (12): Assert-Quiet(), Assert-Under(), Click-Smooth(), Move-Smooth(), Wheel(), Click-Ui(), Find-Ui(), Get-RevitDialog() (+4 more)

### Community 37 - "Métricas de relaciones"
Cohesion: 0.50
Nodes (5): crossArea(), donut(), relLeft(), relRooms(), valueAt()

### Community 40 - ".run"
Cohesion: 0.29
Nodes (3): _demolished(), _elements(), _names()

### Community 44 - "r"
Cohesion: 0.18
Nodes (9): floor(), room(), m2(), outline(), r(), unit(), test_outline_puts_the_largest_loop_first_whatever_revit_s_order(), test_rounds_to_three_decimals_and_never_says_minus_zero() (+1 more)

### Community 45 - "extension_dir"
Cohesion: 0.33
Nodes (4): extension_dir(), find_app(), test_extension_dir_is_the_extension(), test_find_app_next_to_the_extension_or_at_the_repo_root()

## Ambiguous Edges - Review These
- `Exportar Button Icon (Light Theme)` → `Space Analytics Brand Mark (Rainbow Ring)`  [AMBIGUOUS]
  revit/SpaceAnalytics.extension/SpaceAnalytics.tab/Analisis.panel/Exportar.pushbutton/mark.png · relation: references

## Knowledge Gaps
- **14 isolated node(s):** `Path`, `Image`, `ProgressBar`, `WrapPanel`, `space-model-data script marker` (+9 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 238 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **13 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `Embedded space-model-data JSON script slot` connect `Shell HTML de la app` to `UI de la app (app.js)`?**
  _High betweenness centrality (0.028) - this node is a cross-community bridge._
- **Are the 3 inferred relationships involving `commands()` (e.g. with `openDigest()` and `present()`) actually correct?**
  _`commands()` has 3 INFERRED edges - model-reasoned connections that need verification._
- **What connects `Path`, `Image`, `ProgressBar` to the rest of the system?**
  _14 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Lenguaje de paneles laterales` be split into smaller, more focused modules?**
  _Cohesion score 0.06826241134751773 - nodes in this community are weakly interconnected._
- **Why does `Test fixture app/index.html for portable HTML inlining` connect `Shell HTML de la app` to `Lenguaje de paneles laterales`?**
  _High betweenness centrality (0.027) - this node is a cross-community bridge._
- **Should `Roles SA_Rol y accesos` be split into smaller, more focused modules?**
  _Cohesion score 0.0931174089068826 - nodes in this community are weakly interconnected._

### Low-confidence Hints
_AMBIGUOUS edges — the extractor was unsure. Verify before acting on these._

- **What is the exact relationship between `Exportar Button Icon (Light Theme)` and `Space Analytics Brand Mark (Rainbow Ring)`?**
  _Edge tagged AMBIGUOUS (relation: references) - confidence is low._