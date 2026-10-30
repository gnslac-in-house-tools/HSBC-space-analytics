# `space-model.json` · contrato v1

Lo que el botón **Exportar** de Revit escribe y lo que la app lee. Es el único punto de unión entre los dos: si cambia,
cambian ambos lados y sube `schema`.

## Reglas generales

- **Metros**, siempre. Revit trabaja en pies internos: el exportador multiplica por `0.3048`.
- **Coordenadas internas del proyecto** (las de la API de Revit: X este, Y norte). Nada de coordenadas compartidas.
- **Z absoluta** (la misma referencia que `Level.ProjectElevation` y los bounding boxes). La app decide qué corta en
  cada nivel; por eso un muro o una columna de doble altura aparece en los dos niveles que atraviesa.
- **Ids como texto**: `"123456"` en el modelo anfitrión, `"<idDelLink>:<idDelElemento>"` en un vínculo. Así caben los
  ids de 64 bits de Revit 2024+ y no chocan entre modelos.
- Polígono = lista de puntos `[x, y]` sin repetir el primero al final. Contorno con huecos = lista de polígonos: el
  primero es el exterior y los demás son huecos.
- Los campos marcados *opcional* pueden faltar o ser `null`. Lo demás siempre viene.
- Se omiten los elementos demolidos en la fase final y los que no tienen geometría.

## Raíz

```json
{
  "schema": "hsbc-space-analytics/space-model@1",
  "source": {
    "app": "Revit", "version": "2025", "file": "Sucursal Reforma.rvt",
    "exported_at": "2026-10-29T18:20:00", "exporter": "0.1.0",
    "phase": "Nueva construcción",
    "links": ["Base building.rvt"]
  },
  "levels": [], "rooms": [], "floors": [], "walls": [], "doors": [], "windows": [], "obstacles": [],
  "connectors": [], "types": {}
}
```

Cada documento es **un** modelo y la app analiza uno a la vez: abrir otro reemplaza al anterior. No hay etapas de
diseño en el contrato. Exportaciones viejas que traían `source.stage` o varios modelos se siguen leyendo: el campo se
ignora y, de varios modelos, la app usa el último y lo avisa.

## Elementos

| Clave | Origen en Revit | Campos |
|---|---|---|
| `levels[]` | `Level` | `id`, `name`, `elevation` |
| `rooms[]` | `OST_Rooms` colocados con área > 0 | `id`, `level`, `name`, `number`, `area` (m²), `outline` (contorno con huecos, de `GetBoundarySegments` en el borde de acabado), `department` *opcional*, `params` *opcional* |
| `floors[]` | `OST_Floors` | `id`, `level` *opcional*, `type`, `outline` (contorno con huecos de la cara superior), `top` (z de la cara superior), `area` |
| `walls[]` | `OST_Walls` con `LocationCurve` | `id`, `level` *opcional*, `type`, `path` (polilínea del eje; un arco viene teselado), `thickness`, `z` = `[abajo, arriba]`, `curtain` (true si es muro cortina: vidrio por omisión) |
| `doors[]` | `OST_Doors` (`FamilyInstance`) | `id`, `level` *opcional*, `type`, `host` *opcional* (id del muro), `at` `[x, y]`, `hand` `[dx, dy]` unitario (a lo largo del muro), `facing` `[dx, dy]` unitario, `width`, `height`, `z` (abajo), `from_room`, `to_room` *opcionales* (ids; null = exterior), `params` *opcional* |
| `windows[]` | `OST_Windows` | igual que `doors`, más `sill` y `head` (alturas sobre el nivel del hueco, en metros) |
| `obstacles[]` | columnas (`OST_Columns`, `OST_StructuralColumns`), mobiliario (`OST_Furniture`, `OST_FurnitureSystems`, `OST_Casework`, `OST_SpecialityEquipment`, `OST_PlumbingFixtures`, `OST_Planting`, `OST_GenericModel`) | `id`, `level` *opcional*, `type`, `category` (`Columns`, `Furniture`, `Casework`, `Equipment`, `Plumbing`, `Planting`, `Generic`), `footprint` (envolvente convexa en planta de su geometría; si falla, el rectángulo de su bounding box), `z` = `[abajo, arriba]`, `room` *opcional*, `params` *opcional* |
| `connectors[]` *opcional* | circulación vertical: escaleras (`OST_Stairs`, una por tramo de una escalera de varios pisos), rampas (`OST_Ramps`), elevadores y escaleras eléctricas (`OST_VerticalCirculation` en las versiones que la tienen, o familias cuyo nombre de familia o tipo diga elevador, elevator, ascensor, lift, escalera eléctrica o escalator) | `id`, `kind` (`stair`, `ramp`, `elevator`, `escalator`), `type`, `footprint` (contorno en planta: el rectángulo de su bounding box si no hay otro), `z` = `[abajo, arriba]` (elevaciones absolutas: en escaleras y rampas, su base y su remate con los desfases; en elevadores, las de los niveles extremos que toca), `levels` *opcional* (ids de los niveles a ±0.30 m de su recorrido, de abajo hacia arriba), `params` *opcional* |

`type` es siempre el id del tipo (`ElementType`) y su ficha va en `types`.

Una escalera de varios pisos (`MultistoryStairs`) sale como un conector por copia. Las copias no tienen id propio en
Revit: la del nivel de la escalera conserva su id y las demás llevan `<id>@<id del nivel>` (por ejemplo `999@123`, o
`5:999@123` si viene de un vínculo).

## `types`

Un objeto por tipo usado, con su id como clave:

```json
"98765": {
  "category": "Furniture", "family": "Banca lounge", "name": "1800 mm",
  "type_mark": "F01", "description": "", "manufacturer": "", "model": "",
  "cost": 1250.0, "keynote": "",
  "materials": [{ "name": "Roble FSC", "thickness": 0.02 }],
  "params": { "SA_GWP": 42.0, "SA_Rol": "Espera" }
}
```

- `cost` es `null` si el tipo no tiene el parámetro Costo (0 si lo tiene vacío).
- `materials` solo aplica a muros y pisos (capas de su estructura compuesta, con espesor en metros). En los demás es `[]`.
- `params` reúne los parámetros cuyo nombre empieza con `SA_`, de tipo o de instancia (en ese caso van en `params` del
  elemento). Los números van como número y el texto como texto.

## Parámetros `SA_` que la app entiende

Son opcionales. Sin ellos la app sigue funcionando: usa heurísticas por nombre y avisa qué supuso.

| Parámetro | Dónde | Qué hace |
|---|---|---|
| `SA_Rol` | instancia o tipo de mobiliario o puerta | `Personal` (puesto con vista: caja, mostrador, recepción, asesor, guardia), `Entrada` (puerta de acceso público), `Bóveda` (destino de la ruta de efectivo), `Espera` |
| `SA_GWP` | tipo | Carbono incorporado: kgCO₂e/m² en pisos y muros, kgCO₂e por pieza en lo demás |
| `SA_Reciclado` | tipo | % de contenido reciclado |
| `SA_VOC` | tipo | g/L, o `0` si es de bajas emisiones |
| `SA_NRC` | tipo | Absorción acústica (0–1) |
| `SA_EPD` | tipo | `1` si tiene EPD verificada |
| `SA_Opaco` | tipo de muro cortina | `1` si no es vidrio: entonces tapa la vista |

La tabla de Excel por objeto se une a `types` por **Type Mark** desde la app. Sus columnas usan los mismos nombres sin
el prefijo (`GWP`, `Reciclado`…).

## Cómo lee la app cada cosa (resumen)

- **Retícula**: celdas de 0.5 m (o 1.0 m) dentro de los pisos del nivel. Si no hay pisos, dentro de los rooms.
- **Corte de movimiento a 0.50 m**:
  - tapan: los muros, el muro cortina, las columnas y todo obstáculo cuya `z` cruce los 0.50 m sobre el nivel;
  - las puertas abren su ancho en el muro que las aloja.
- **Corte de vista a 1.20 m**:
  - tapan: los muros, las columnas y los obstáculos más altos que 1.20 m;
  - dejan ver: el muro cortina y las ventanas cuyo `sill < 1.20 < head`;
  - una visual que sale del edificio a través de vidrio cuenta como **vista al exterior**.
- **Vegetación** (`category = "Planting"`):
  - la copa sale del área de la caja (radio = √área / 2, aunque la caja venga girada) y el tipo, del nombre de familia y
    tipo: palmera, conífera o frondoso; lo que dice arbusto, seto, maceta, etc., o mide menos de 2.5 m, es arbusto;
  - de un árbol solo tapan el tronco (radio 6 % de la copa, entre 0.12 y 0.30 m): bajo la copa se camina y se ve;
  - un arbusto tapa como cualquier obstáculo;
  - un árbol pertenece al nivel donde está plantado, no a todos los que alcanza su copa;
  - se dibuja con su símbolo (copa, nervaduras, tronco) en planta y en 3D.
- **Entre niveles** (`connectors`):
  - cada conector une los niveles seguidos de su lista `levels` (si no viene, los que caen dentro de su `z`), por la
    celda libre más cercana al centro de su contorno en cada nivel;
  - si el modelo no trae conectores, se deducen de rooms de escalera o elevador (nombre con escalera, stair, rampa,
    elevador, ascensor, lift…) apilados en dos niveles seguidos;
  - costo de cada salto, en metros caminados: escalera y escalera eléctrica 1.85 × desnivel, rampa 12 × desnivel,
    elevador 15 m de espera + desnivel;
  - con eso la app arma un grafo de todo el edificio con las distancias desde los accesos reales de cualquier nivel: la
    ruta más larga del edificio y la ruta del acceso a cualquier room, aunque esté en otro nivel. Los puntajes de cada
    nivel no cambian.
- **Puertas**:
  - son las aristas del grafo entre rooms;
  - una puerta con un lado sin room es un acceso;
  - las que tienen `SA_Rol = Entrada` son los accesos públicos (si no hay ninguna, se usan todos los accesos).

## El HTML portátil

El botón Exportar escribe dos archivos en `Documentos\HSBC Space Analytics\` (la carpeta Documentos que reporta Windows, aunque esté en OneDrive) con el mismo nombre
(`<modelo> · <aaaa-mm-dd hhmm>`):

- el `.json`, que sigue este contrato;
- el `.html`, que es la app con los datos dentro y se abre con doble clic sin servidor.

Para armar el `.html`, el exportador:

1. lee `app/index.html`;
2. cambia cada `<script src="X.js"></script>` que apunte a un archivo de `app/` por un `<script>` con su contenido;
3. cambia el marcador exacto `<script id="space-model-data" type="application/json">null</script>` por la misma
   etiqueta con el documento (el mismo del `.json`) dentro, escapando `</` como `<\/`.

El `.html` lleva solo la exportación nueva.

Abierta sin datos, la app pide abrir o arrastrar un `.json`.
