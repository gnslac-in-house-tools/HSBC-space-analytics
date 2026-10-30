# Space Analytics para Revit

Extensión de pyRevit que exporta un modelo de Revit a `space-model.json` (el contrato: `docs/space-model.md`) más un
HTML portátil: la app de análisis espacial con los datos dentro, que se abre con doble clic sin servidor.
**IronPython 2.7** (el motor por omisión de pyRevit), Revit 2025 a 2027, pyRevit 5 o posterior (probada con 6.5.5).

```
SpaceAnalytics.extension/
  SpaceAnalytics.tab/Analisis.panel/   Exportar · Abrir
    Exportar.pushbutton/   export.xaml + lib/export_window.py: la ventana con el estilo de la app; mark.png
  lib/sa_model/   Python puro, sin Revit: geometría, el documento del contrato, nombres de archivo, el HTML portátil
  lib/sa_revit/   el único paquete que importa Autodesk.Revit.DB: los colectores
tests/            pytest en CPython 3, fuera de Revit
tools/make_icons.py   dibuja los iconos: la marca de la app (el anillo de color) con el glifo de cada botón
```

## Instalar

1. **pyRevit** 5 o posterior: [github.com/pyrevitlabs/pyRevit/releases](https://github.com/pyrevitlabs/pyRevit/releases).
   Abre Revit una vez: aparece la pestaña *pyRevit*.
2. **Agrega esta carpeta**: pestaña pyRevit → *Settings* → *Custom Extension Directories* → agregar
   `<repo>\revit` (la carpeta que *contiene* `SpaceAnalytics.extension`, no la extensión misma) →
   *Save Settings and Reload*. Aparece la pestaña **Space Analytics** con el panel **Análisis**.
3. Deja el motor como está: IronPython. **Ningún `#! python3`** en un script: lo movería a CPython, donde
   `pyrevit.forms` no funciona (un test lo vigila).

El HTML se arma desde la app del repo (`<repo>\app\index.html`); si se copia la extensión sola a otro lugar, pon la
carpeta `app\` dentro de `SpaceAnalytics.extension\` y se usa esa.

## Usar

**Exportar** abre una ventana con el estilo de la app (tema Aura: fondo con halos, tarjetas, botones píldora):

1. Elige la etapa: *Concepto*, *Esquemático*, *Desarrollo* o *Documentación* (viene marcada la de la última
   exportación de este modelo). Cancelar o Esc no hacen nada.
2. Si el modelo tiene vínculos de Revit cargados, marca cuáles incluir (todos por omisión). Sus elementos se llevan a
   las coordenadas del modelo y sus ids van como `"<idDelVínculo>:<idDelElemento>"`.
3. Lee el modelo con su barra de avance (Cancelar o Esc la detienen sin escribir nada). No modifica nada: no abre
   transacciones.
4. Escribe en `Documentos\HSBC Space Analytics\` dos archivos con el mismo nombre,
   `<modelo> · <etapa> · <aaaa-mm-dd hhmm>`:
   - el `.json`, según el contrato;
   - el `.html`, la app con los datos dentro: la exportación nueva y, si hay, la última `.json` de cada **otra** etapa
     del mismo modelo en esa carpeta, para comparar.
5. Muestra el resumen en la misma ventana (cuántos elementos de cada cosa, accesos, avisos: sin rooms, sin puertas
   de acceso, sin pisos, elementos que fallaron) con *Abrir en la app* (Enter), *Abrir carpeta* y *Cerrar*.

**Abrir**: abre el `.html` más reciente de este modelo en esa carpeta. Si no hay ninguno, ofrece abrir la app vacía
para arrastrar uno o varios `.json`.

### Qué conviene tener en el modelo

- Rooms colocados y cerrados (sin ellos no hay grafo de espacios ni rutas), y pisos (la retícula se arma dentro de ellos).
- Parámetros `SA_` opcionales (`SA_Rol`, `SA_GWP`, `SA_Reciclado`, `SA_VOC`, `SA_NRC`, `SA_EPD`, `SA_Opaco`): ver la
  tabla del contrato. Todo parámetro cuyo nombre empiece con `SA_` se exporta: los de tipo en `types`, los de
  instancia en el elemento.
- El *Type Mark* de cada tipo: une la tabla de Excel por objeto con `types` desde la app.
- La circulación vertical (`connectors` del contrato) sale sola de las escaleras (*Stairs*; una escalera de varios
  pisos da una por piso, con id `"<idEscalera>@<idNivel>"` en los pisos que no son el suyo), las rampas (*Ramps*) y la
  categoría *Vertical Circulation*. Un elevador o una escalera eléctrica modelados en otra categoría (modelo genérico,
  equipo especializado…) se reconocen si el nombre de su familia o su tipo dice elevador, elevator, ascensor, lift,
  escalera eléctrica, escalera mecánica o escalator; siguen yendo también como obstáculo. Su `z` va de su nivel a lo
  alto de su caja, ajustada a los niveles que toca: modélalos como una sola pieza por cubo, no una por piso.

## Desarrollar

- Pruebas: `python -m pytest revit/tests` (Python 3 con pytest).
- **Después de cambiar algo en `lib/`, reinicia Revit**: pyRevit conserva los módulos importados durante la sesión; su
  *Reload* solo relee los scripts de los botones y la cinta.
- Un botón nuevo: su carpeta `<Nombre>.pushbutton/` (`script.py`, `bundle.yaml`), una línea en el `layout` del
  `bundle.yaml` de su panel y su glifo en `tools/make_icons.py`; luego `python revit/tools/make_icons.py`.
- La interfaz vive en los botones, nunca en `lib/sa_revit` (un test lo vigila): la ventana de Exportar es
  `export.xaml` más `lib/export_window.py` del botón (pyRevit pone esa `lib/` en el path del script). Para verla sin
  Revit, cárgala en PowerShell con `[Windows.Markup.XamlReader]::Parse` quitando los `Click=`; los tests revisan que
  el XAML sea XML válido y que sus nombres y eventos coincidan con el código.
- Python 2.7 y 3 a la vez: sin f-strings, anotaciones, `nonlocal` ni `super()` sin argumentos; un archivo que no es
  ASCII empieza con `# -*- coding: utf-8 -*-`. `ElementId.Value`, nunca `IntegerValue` (no existe en 2026+;
  `sa_revit.common.id_value` lo usa solo como respaldo).
- `sa_model` no importa Revit, pyRevit, `clr` ni `System`; `sa_revit` no importa `pyrevit` (la UI va en los botones).
