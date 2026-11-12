# Graph Report - HSBC-space-analytics  (2026-11-09)

## Corpus Check
- 74 files · ~97,406 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 7 file(s) not represented in the graph (top: (none) 5, .css 1, .ini 1)

## Summary
- 985 nodes · 1994 edges · 60 communities (46 shown, 14 thin omitted)
- Extraction: 94% EXTRACTED · 6% INFERRED · 0% AMBIGUOUS · INFERRED: 119 edges (avg confidence: 0.87)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `bb03a755`
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
- probe
- Collector
- test_extension.py
- sa_etiquetar.py
- toast
- renderBoard
- test_vertical.py
- Construcción del documento
- Ventana ExportWindow
- Estándar de parámetros `SA_`
- Fuente del modelo y vínculos
- focus
- Generador de íconos
- Dibujo de planta y axonometría
- Tests del motor
- commands
- build.js
- opening
- build.js
- os
- halo.js
- drawSlideBase
- collect.py
- Íconos Abrir y Exportar
- Íconos Presentar y Resumen
- revit-ui.ps1
- Modos Experiencia y Sustentabilidad
- Reglas de graphify
- common.py
- Panel Análisis (yaml)
- Pestaña SpaceAnalytics (yaml)
- Fixture de la app
- r
- indices.test.js
- indices.js
- package.json
- ._jobs
- scripts
- io
- Cancelled
- bundle.py
- test_window.py
- test_bundle.py
- os
- extension_dir

## God Nodes (most connected - your core abstractions)
1. `Window` - 30 edges
2. `commands()` - 24 edges
3. `renderViewport()` - 24 edges
4. `toast()` - 22 edges
5. `Collector` - 22 edges
6. `renderInspectorBase()` - 20 edges
7. `focus()` - 18 edges
8. `ExportWindow` - 17 edges
9. `is_valid()` - 15 edges
10. `Source` - 15 edges

## Surprising Connections (you probably didn't know these)
- `Relaciones: tres actos` --references--> `pxPlayRel()`  [INFERRED]
  docs/modos.md → app/app.js
- `Cómo está armado` --references--> `spatial()`  [INFERRED]
  docs/modos.md → app/indices.js
- `Cómo ponerlos en un modelo de Revit` --references--> `params()`  [INFERRED]
  docs/parametros-sa.md → revit/SpaceAnalytics.extension/lib/sa_model/document.py
- `Cómo está armado` --references--> `renderViewportBase()`  [INFERRED]
  docs/modos.md → app/app.js
- `Cómo está armado` --references--> `renderLegendBase()`  [INFERRED]
  docs/modos.md → app/app.js

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

## Communities (60 total, 14 thin omitted)

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
Cohesion: 0.12
Nodes (35): analyze(), boxBlur(), boxOf(), building(), castRay(), connectorsOf(), dijkstra(), fmt() (+27 more)

### Community 4 - "Archivos de exportación"
Cohesion: 0.10
Nodes (19): dumps(), ensure_folder(), export_stem(), exports_in(), latest_html(), model_stem(), output_folder(), parse_stem() (+11 more)

### Community 5 - "launch.py"
Cohesion: 0.12
Nodes (12): app_args(), bridge_html(), file_url(), find_browser(), profile_dir(), open_view(), test_app_args_narrow_or_maximized(), test_bridge_jumps_to_the_url_with_its_hash() (+4 more)

### Community 6 - "UI de la app (app.js)"
Cohesion: 0.12
Nodes (26): arc(), bullet(), click(), closePal(), drawPal(), gauge(), idxNow(), indexVal() (+18 more)

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

### Community 11 - "probe"
Cohesion: 0.21
Nodes (13): armZone(), axoNav(), cellOf(), clearRooms(), drawZone(), hitElement(), openZone(), placeZone() (+5 more)

### Community 12 - "Collector"
Cohesion: 0.13
Nodes (6): Collector, geometry_points(), _room_of(), _tessellated(), number(), sa_params()

### Community 13 - "test_extension.py"
Cohesion: 0.20
Nodes (12): _defined(), imports(), layout(), test_every_button_has_a_script_a_bundle_and_its_icons(), test_every_button_is_in_its_panel_s_layout(), test_every_icon_is_a_96_px_png(), test_every_panel_is_in_the_tab_s_layout(), test_never_integer_value_outside_the_fallback() (+4 more)

### Community 14 - "sa_etiquetar.py"
Cohesion: 0.19
Nodes (15): aplicar_reglas(), bic(), crear_parametros(), eid(), elements(), exportar(), get_doc(), inventario() (+7 more)

### Community 15 - "toast"
Cohesion: 0.17
Nodes (18): addModels(), applyRows(), closeFam(), downloadCSV(), famRows(), fitProj(), levelFor(), loadSample() (+10 more)

### Community 16 - "renderBoard"
Cohesion: 0.17
Nodes (17): hallBlock(), ixBlock(), ixInner(), modeTabs(), pxNow(), pxSetMode(), renderBoard(), renderBoardBase() (+9 more)

### Community 17 - "test_vertical.py"
Cohesion: 0.14
Nodes (11): fold(), kind_by_name(), stacked(), stair_z(), test_fold(), test_kind_by_name_in_obstacle_categories(), test_kind_by_name_in_the_vertical_circulation_category(), test_stacked_alone_without_its_base_or_placements() (+3 more)

### Community 18 - "Construcción del documento"
Cohesion: 0.25
Nodes (10): build(), level(), _num(), obstacle(), params(), type_record(), wall(), _z() (+2 more)

### Community 20 - "Estándar de parámetros `SA_`"
Cohesion: 0.17
Nodes (11): Cómo ponerlos en un modelo de Revit, Estándar de parámetros `SA_`, Etiquetar modelos que ya existen, Hallazgos que salieron al hacerlo, Identificación: qué es cada cosa, La librería, La regla, La sucursal de ejemplo y los modelos de Autodesk (+3 more)

### Community 22 - "focus"
Cohesion: 0.38
Nodes (13): buildInst(), bumpW(), createRel(), focus(), listen(), nodeClick(), removeRel(), renderAll() (+5 more)

### Community 23 - "Generador de íconos"
Cohesion: 0.21
Nodes (7): conic(), draw(), main(), pixel(), png(), polyline(), _seg_dist()

### Community 24 - "Dibujo de planta y axonometría"
Cohesion: 0.21
Nodes (15): axoBox(), axoLayers(), css(), drawAxo(), drawLayer3D(), drawOpening(), drawPlan(), drawPlant() (+7 more)

### Community 25 - "Tests del motor"
Cohesion: 0.23
Nodes (9): assert, box(), door(), garden(), rect(), test, tower(), tree() (+1 more)

### Community 26 - "commands"
Cohesion: 0.16
Nodes (28): applyHash(), bld(), buildLayers(), commands(), inspHead(), layName(), metRow(), openDigest() (+20 more)

### Community 27 - "build.js"
Cohesion: 0.21
Nodes (6): H, ORBS, OUT, playwright@1.56.1, OUT, playwright

### Community 28 - "opening"
Cohesion: 0.18
Nodes (9): _elevation(), opening(), resolve_level(), m(), point(), test_a_window_without_sill_gets_it_from_its_level(), test_an_opening_with_no_facing_takes_it_from_its_hand(), test_resolve_level() (+1 more)

### Community 29 - "build.js"
Cohesion: 0.09
Nodes (28): build(), circleU(), areaOf(), build(), circle(), FOOT, fs, m (+20 more)

### Community 31 - "halo.js"
Cohesion: 0.27
Nodes (4): area(), lentes(), montar(), ruta()

### Community 32 - "drawSlideBase"
Cohesion: 0.15
Nodes (20): crossArea(), deck(), donut(), drawSlide(), drawSlideBase(), planKey(), present(), pxAct() (+12 more)

### Community 33 - "collect.py"
Cohesion: 0.15
Nodes (8): extent_along(), collect(), _demolished(), _level_param(), loaded_links(), element_id_param(), id_value(), is_valid()

### Community 34 - "Íconos Abrir y Exportar"
Cohesion: 0.48
Nodes (6): Abrir Button Icon (Light Theme), Abrir Button Icon (Dark Theme), Exportar Button Icon (Light Theme), Exportar Button Icon (Dark Theme), Space Analytics Brand Mark (Rainbow Ring), Rainbow Conic-Gradient Ring Brand Identity

### Community 35 - "Íconos Presentar y Resumen"
Cohesion: 0.52
Nodes (7): Presentar button icon (light), Space Analytics brand mark (rainbow gradient ring), Presentar button icon (dark theme), Presentar pushbutton (present / play presentation), Resumen button icon (light), Resumen button icon (dark theme), Resumen pushbutton (summary / indicators chart)

### Community 36 - "revit-ui.ps1"
Cohesion: 0.15
Nodes (12): Assert-Quiet(), Assert-Under(), Click-Smooth(), Move-Smooth(), Wheel(), Click-Ui(), Find-Ui(), Get-RevitDialog() (+4 more)

### Community 37 - "Modos Experiencia y Sustentabilidad"
Cohesion: 0.15
Nodes (12): Color del modo, Cuando el modelo no trae el dato, Cómo nace cada tema, Modos Experiencia y Sustentabilidad, Números, Piezas nuevas, Qué va en cada panel, Reglas de las animaciones (+4 more)

### Community 40 - "common.py"
Cohesion: 0.18
Nodes (6): final_phase(), _get(), has_param(), is_length(), name_of(), text()

### Community 44 - "r"
Cohesion: 0.18
Nodes (9): floor(), room(), m2(), outline(), r(), unit(), test_outline_puts_the_largest_loop_first_whatever_revit_s_order(), test_rounds_to_three_decimals_and_never_says_minus_zero() (+1 more)

### Community 45 - "indices.test.js"
Cohesion: 0.14
Nodes (11): assert, fs, path, renamed(), sample(), SERVICIOS, sinServicios(), stripSA() (+3 more)

### Community 48 - "indices.js"
Cohesion: 0.48
Nodes (6): erlangC(), mixW(), queue(), rule(), score(), spatial()

### Community 49 - "package.json"
Cohesion: 0.33
Nodes (6): dependencies, pptxgenjs@3.12.0, description, name, private, pptxgenjs

### Community 53 - "scripts"
Cohesion: 0.33
Nodes (6): scripts, assets, build, deck, media, render

### Community 54 - "io"
Cohesion: 0.17
Nodes (11): data_json(), biblioteca(), guid(), txt(), test_cada_parametro_esta_completo(), test_el_documento_menciona_todos_los_parametros(), test_el_txt_esta_al_dia_y_los_guid_son_estables(), test_data_json_escapes_every_closing_tag() (+3 more)

### Community 56 - "bundle.py"
Cohesion: 0.20
Nodes (8): bundle(), bundle_file(), replace(), BundleError, _local_file(), _read(), test_a_src_outside_app_is_not_inlined(), test_single_quotes_bare_src_and_query_strings()

### Community 58 - "test_window.py"
Cohesion: 0.27
Nodes (8): test_done_page_opens_the_app_the_summary_or_the_presentation(), test_every_event_in_the_xaml_has_its_method(), test_every_name_the_window_uses_is_in_the_xaml(), test_no_stage_picker(), test_the_window_is_narrow_and_the_main_action_is_not_black(), test_the_xaml_is_valid_xml_without_a_code_class(), window_class(), xaml()

### Community 59 - "test_bundle.py"
Cohesion: 0.22
Nodes (9): data_of(), read(), result(), test_a_copy_of_the_app_bundles_the_same(), test_inlined_code_cannot_close_its_own_script_and_keeps_its_backslashes_and_dollars(), test_local_scripts_are_inlined_and_remote_ones_kept(), test_the_data_goes_in_the_marker_and_reads_back_the_same(), test_the_rest_of_the_page_is_untouched() (+1 more)

### Community 61 - "extension_dir"
Cohesion: 0.33
Nodes (4): extension_dir(), find_app(), test_extension_dir_is_the_extension(), test_find_app_next_to_the_extension_or_at_the_repo_root()

## Ambiguous Edges - Review These
- `Exportar Button Icon (Light Theme)` → `Space Analytics Brand Mark (Rainbow Ring)`  [AMBIGUOUS]
  revit/SpaceAnalytics.extension/SpaceAnalytics.tab/Analisis.panel/Exportar.pushbutton/mark.png · relation: references

## Knowledge Gaps
- **14 isolated node(s):** `Path`, `Image`, `ProgressBar`, `WrapPanel`, `space-model-data script marker` (+9 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 276 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **14 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `Estándar de parámetros `SA_`` connect `Estándar de parámetros `SA_`` to `Motor de análisis (engine.js)`?**
  _High betweenness centrality (0.401) - this node is a cross-community bridge._
- **Are the 3 inferred relationships involving `commands()` (e.g. with `openDigest()` and `present()`) actually correct?**
  _`commands()` has 3 INFERRED edges - model-reasoned connections that need verification._
- **What connects `Path`, `Image`, `ProgressBar` to the rest of the system?**
  _14 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Lenguaje de paneles laterales` be split into smaller, more focused modules?**
  _Cohesion score 0.06826241134751773 - nodes in this community are weakly interconnected._
- **Why does `Archivos` connect `Motor de análisis (engine.js)` to `Estándar de parámetros `SA_``?**
  _High betweenness centrality (0.393) - this node is a cross-community bridge._
- **Should `Roles SA_Rol y accesos` be split into smaller, more focused modules?**
  _Cohesion score 0.0931174089068826 - nodes in this community are weakly interconnected._

### Low-confidence Hints
_AMBIGUOUS edges — the extractor was unsure. Verify before acting on these._

- **What is the exact relationship between `Exportar Button Icon (Light Theme)` and `Space Analytics Brand Mark (Rainbow Ring)`?**
  _Edge tagged AMBIGUOUS (relation: references) - confidence is low._