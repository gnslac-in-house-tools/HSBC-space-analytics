# Estándar de parámetros `SA_`

Los modelos de Revit que llegan a la app traen nombres de familia distintos, tipos distintos y parámetros propios de
cada proyecto. Lo único que podemos pedir y controlar es **un parámetro compartido que llevan las familias**. Este
documento define esa librería: qué parámetros son, en qué categorías van, qué valores aceptan y qué indicador alimenta
cada uno.

> Fuente única: `revit/standard/biblioteca.json`. De ahí salen el archivo de parámetros compartidos
> (`revit/standard/SA_Parametros.txt`, con `python revit/standard/generar.py`) y el script que etiqueta modelos
> (`revit/tools/sa_etiquetar.py`). Si cambia la librería, cambia ahí y se regenera; una prueba
> (`revit/tests/test_biblioteca.py`) vigila que este documento, el JSON y el `.txt` digan lo mismo.

## La regla

1. **Manda el parámetro.** Si un elemento trae `SA_Servicio` o un room trae `SA_Zona`, la app los toma por lo que
   dicen, aunque el nombre de la familia diga otra cosa. `SA_Servicio = Ninguno` apaga una pieza que se llama «ATM».
2. **Sin parámetro, el nombre.** Si falta, la app sigue usando el nombre de familia o de room (la heurística de
   siempre) para no romper modelos viejos.
3. **Se sabe cuál de las dos se usó.** El análisis cuenta cuántos elementos se identificaron por parámetro y cuántos
   por nombre (`spatial().via`): un modelo en estándar tiene el segundo número en cero.
4. **Lo que no se declara no se inventa.** Si el modelo no tiene ATM, el tema dice «Sin datos»; no se rellena un 0.

## La librería

Todos los nombres empiezan con `SA_`; el exportador (`sa_params`) recoge cualquier parámetro con ese prefijo, de tipo o
de instancia. Grupo de parámetros compartidos: `SpaceAnalytics`. El GUID de cada parámetro sale de su nombre
(UUID v5), así que es el mismo en todos los modelos y en todas las regeneraciones del archivo.

### Identificación: qué es cada cosa

| Parámetro | Tipo de dato | Va en | Categorías | Valores | Alimenta |
|---|---|---|---|---|---|
| `SA_Servicio` | Texto | Tipo | Mobiliario, Sistemas de mobiliario, Carpintería, Equipo especializado, Modelos genéricos | `ATM`, `Caja`, `Asesoria`, `Asesor`, `Host`, `Ninguno` | Orientación, Espera y capacidad, Privacidad, Seguridad |
| `SA_Rol` | Texto | Tipo o instancia | Las de arriba, Puertas y Rooms | `Personal`, `Entrada`, `Bóveda`, `Espera` | Seguridad, accesos públicos, Confort |
| `SA_Zona` | Texto | Instancia | Rooms | `Autoservicio`, `Espera`, `Asesoria`, `Boveda`, `Personal`, `Cliente` | Confort, Eficiencia, área pública contra área de personal |

- **`SA_Servicio`**: `ATM` cajero automático · `Caja` ventanilla del cajero · `Asesoria` asiento del cliente en la mesa
  de asesoría · `Asesor` escritorio del asesor (orienta el asiento) · `Host` módulo de bienvenida o recepción ·
  `Ninguno` no es un servicio.
- **`SA_Rol`**: `Personal` puesto con vista (caja, mostrador, guardia) · `Entrada` puerta de acceso público · `Bóveda`
  destino de la ruta de efectivo · `Espera` mobiliario o room de espera.
- **`SA_Zona`**: `Autoservicio` zona de ATMs · `Espera` fila y espera · `Asesoria` salas y lounge de asesoría ·
  `Boveda` · `Personal` back office y áreas solo de personal · `Cliente` área pública sin servicio específico.

Las mayúsculas y los acentos no importan al leer (`Asesoría` = `asesoria`).

### Sustentabilidad: de qué está hecho

Todos van en el **tipo** y en las categorías de mobiliario y obstáculos, más Pisos y Muros.

| Parámetro | Tipo de dato | Valores | Alimenta |
|---|---|---|---|
| `SA_GWP` | Número | kgCO₂e por pieza; kgCO₂e/m² en pisos y muros | Carbono, Circularidad |
| `SA_GWP_Base` | Número | Mismas unidades: el carbono de la alternativa genérica | Carbono (reducción contra la base) |
| `SA_Reciclado` | Número | 0 a 100 (%) | Circularidad |
| `SA_Reutilizado` | Entero | `1` pieza reutilizada, `0` nueva | Carbono, Circularidad |
| `SA_EPD` | Entero | `1` si el `SA_GWP` sale de una EPD verificada | Carbono (confiabilidad) |
| `SA_VOC` | Número | g/L; `0` si es de bajas emisiones | Tabla de familias |
| `SA_NRC` | Número | 0 a 1 | Tabla de familias |
| `SA_Opaco` | Entero | `1` si un muro cortina no es vidrio | Seguridad (vista), Confort (luz) |

`SA_GWP_Base` es la novedad de este estándar: antes la «base genérica» salía de una tabla en el código con los nombres
de familia de la sucursal de muestra. Con el parámetro, cada familia dice contra qué se compara.

## Qué necesita cada tema

| Tema | Mínimo para que dé un número | Sin eso |
|---|---|---|
| Orientación | Un `SA_Servicio` = `ATM`, `Caja` o `Host`, y un acceso | Sin datos |
| Espera y capacidad | Al menos un servicio de `ATM`, `Caja` o `Asesoria` (la demanda es un supuesto fijo) | Sin datos |
| Privacidad | `ATM`, `Caja` o `Asesoria` | Sin datos |
| Seguridad | Puestos de personal (`SA_Rol = Personal`, o `Caja`, `Asesor`, `Host`); la ruta del efectivo pide además una `Boveda` | Se mide solo desde los accesos y se avisa |
| Confort ambiental | Rooms con `SA_Zona` = `Autoservicio`, `Espera` o `Asesoria`, y vidrio al exterior | Sin datos por zona |
| Carbono | `SA_GWP` en los tipos (y `SA_GWP_Base` para medir la reducción) | Sin datos |
| Circularidad | `SA_GWP` y `SA_Reciclado` o `SA_Reutilizado` | Sin datos |
| Eficiencia | Rooms de cliente (`SA_Zona`) y al menos un servicio | Sin datos |

Además, siempre: niveles, rooms colocados con área > 0, pisos, muros y puertas (`docs/space-model.md`).

## Cómo ponerlos en un modelo de Revit

1. **Cargar el archivo.** Administrar → Parámetros compartidos → Examinar → `revit/standard/SA_Parametros.txt`.
2. **Vincularlos.** Administrar → Parámetros de proyecto → Nuevo → Usar parámetro compartido → elegir `SA_…`. Marcar
   *Tipo* o *Instancia* según la columna «Va en» y las categorías de la tabla. (O correr `revit/tools/etiquetar.py`, que
   hace este paso y el siguiente por regla.)
3. **Llenar.** En el tipo de cada familia de servicio, `SA_Servicio`; en cada room, `SA_Zona`; en los tipos con
   información ambiental, `SA_GWP` y compañía.
4. **Para que viaje con la familia**, abrir el `.rfa`, cargar el mismo archivo de parámetros compartidos, agregarlos
   como parámetros de familia (de tipo) y volver a cargar la familia en el proyecto. Es la forma de no repetir el paso 3
   en cada proyecto.
5. **Exportar** con el botón de Space Analytics. Los parámetros salen en `types[...].params` (tipo) y en `params`
   del elemento (instancia).

## Etiquetar modelos que ya existen

`revit/tools/etiquetar.py` abre un `.rvt` con Revit sin ventanas, crea y vincula la librería completa, asigna valores
según un archivo de reglas, guarda una **copia** del modelo con los parámetros (el original no se toca) y exporta el
`space-model.json`. Un archivo de reglas dice, por categoría, familia, tipo o nombre de room, qué valor lleva cada
parámetro:

```json
{ "en": ["OST_Furniture"], "familia": "ATM", "param": { "SA_Servicio": "ATM", "SA_GWP": 520 }, "nota": "cajeros" }
{ "en": "rooms", "nombre": "^Lobby$", "param": { "SA_Zona": "Espera" }, "nota": "lobby" }
```

    python revit/tools/etiquetar.py inventario <modelo.rvt> <salida>        # qué trae el modelo
    python revit/tools/etiquetar.py etiquetar  <modelo.rvt> <salida> reglas.json

## Los dos modelos de muestra, ya en estándar

`racadvancedsampleproject.rvt` (una escuela de tres pisos) y `racbasicsampleproject.rvt` (una casa) se abrieron en
Revit 2027 con `etiquetar.py`, que creó los 11 parámetros, los vinculó a sus categorías y los llenó con las reglas de
`revit/standard/reglas/`. Cada uno dejó una copia `.rvt` con los parámetros (los originales de Descargas no se
tocaron) y el `space-model.json` que ahora son las muestras de la app (`app/samples/`).

| | Escuela (`rac-advanced.json`) | Casa (`rac-basic.json`) |
|---|---|---|
| Cómo se abre | La app la abre por omisión | `app/index.html#muestra=casa` |
| Nivel que se mide | 01 - Entry Level | Level 1 |
| Experiencia / Sustentabilidad | 67 / 35 | 47 / 35 |
| Identificados por parámetro / por nombre | 46 / 0 | 10 / 0 |
| Temas con datos (Experiencia, Sustentabilidad) | 5 de 5, 3 de 3 | 5 de 5, 3 de 3 |
| Rooms con `SA_Zona` | 88 de 91 | 14 de 14 |
| Tipos con parámetros `SA_` | 19 | 22 |

Lo que declaran las reglas:

- **Rooms** (`SA_Zona`): vestíbulo, cafetería y lounge → `Espera`; conferencia, laboratorio, biblioteca →
  `Asesoria`; oficinas, bodegas y cuartos técnicos → `Personal`; aulas, pasillos, escaleras y baños → `Cliente`. En la
  casa: sala → `Espera`, cocina-comedor → `Asesoria`, vestíbulo y pasillo → `Cliente`, recámaras, baños y servicios →
  `Personal`.
- **Servicios** (`SA_Servicio`): la mesa redonda con sillas (escuela) y la mesa de comedor (casa) → `Asesoria`; la isla
  de cocina (casa) → `Caja`. No hay ATM ni host: **ninguno de los dos edificios tiene algo que lo sea**, y el estándar
  no inventa uno. Por eso Orientación se mide sin esos dos y sus métricas dicen «—».
- **Accesos** (`SA_Rol = Entrada`): las puertas de vidrio de fachada (escuela) y las «Entrance door» (casa).
- **Espera** (`SA_Rol = Espera`): sillas, bancos y sofás.
- **Sustentabilidad**: `SA_GWP`, `SA_GWP_Base` y `SA_Reciclado` en sillas, mesas, sofás, columnas, pisos y muros.
  `SA_Opaco = 0` en los muros cortina.

> **Son datos de demostración.** Una escuela y una casa no son una sucursal: los servicios son sustitutos que sirven
> para ejercitar el estándar de punta a punta, y los valores de carbono son de orden de magnitud, no de una EPD
> (`SA_EPD` queda sin valor, así que el cálculo se marca como «Genérico»). Los números de la tabla no son un
> resultado de diseño. Para una sucursal real, las reglas se reemplazan por los valores del fabricante.

### Hallazgos que salieron al hacerlo

1. **El exportador perdía todos los rooms de la casa.** Sus 14 rooms están en una fase anterior a la final
   («Learning Content») y el lector descartaba los de «otra fase»: salía un modelo sin rooms. Ahora, si la fase final no
   tiene ninguno colocado, lee los de la fase que más tiene (`collect.py`, `_room_phase`).
2. **La casa abría en «Foundation»**, un nivel con solo un piso. Ahora la app abre el primer nivel que tiene rooms.
3. **Eficiencia daba 0 cuando no había servicios**, y con eso Sustentabilidad marcaba «Atención» sin datos. Ahora dice
   «Sin datos».
4. **En Revit 2027 `ElementId.IntegerValue` ya no existe** (es `.Value`), y pyRevit cambia `%TEMP%` en cada corrida: la
   configuración del script va en `%LOCALAPPDATA%\HSBC Space Analytics\etiquetar\`.

### Por qué no por IFC

Se consideró descomponer el `.rvt`, pasarlo a IFC y reconstruirlo. No hace falta y pierde información: Revit ya guarda
los parámetros compartidos en cada familia, el exportador de la extensión los lee tal cual (todo lo que empieza con
`SA_`) y un IFC los convertiría en propiedades que habría que volver a mapear. Etiquetar dentro de Revit y exportar con el
mismo exportador deja un solo camino.

## Archivos

| Archivo | Para qué |
|---|---|
| `revit/standard/biblioteca.json` | La librería: parámetros, tipos de dato, categorías, valores. Fuente única |
| `revit/standard/SA_Parametros.txt` | El archivo de parámetros compartidos que se carga en Revit |
| `revit/standard/generar.py` | Genera el `.txt` desde el JSON, con GUID estables |
| `revit/tools/sa_etiquetar.py` | Script que corre dentro de Revit: crea, vincula, asigna, guarda copia y exporta |
| `revit/tools/etiquetar.py` | Lanza Revit con un `.rvt` y espera el resultado |
| `revit/tools/muestra.py` | Convierte una exportación en una muestra de la app (`app/samples/*.js`) |
| `revit/standard/reglas/` | Las reglas de etiquetado de cada modelo de muestra |
| `app/engine.js` | `serviceOf`, `zoneOf`, `saParam`: la lectura con parámetro primero y nombre de respaldo |
