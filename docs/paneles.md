# Paneles laterales: un solo lenguaje

El tablero (izquierda) y el inspector (derecha) se arman con las mismas piezas. Todo vive en `app/index.html`, en el
bloque «lenguaje de los paneles laterales». Si algo nuevo no cabe en estas piezas, se agrega una pieza aquí antes de
estilizarlo a mano.

## Estructura

| Pieza | Clase | Regla |
|---|---|---|
| Panel | `.panel.side` | Encabezado fijo y cuerpo con scroll. |
| Encabezado | `.phd` | Eyebrow gris (qué es), título de 17 px (cuál es, con su ícono o sus puntos de color), subtítulo de una o dos líneas. Acciones a la derecha. |
| Cuerpo | `.pbody` | Secciones planas (`.sec`) separadas por una línea. Sin tarjetas apiladas. |
| Sección | `.sec` + `.sec-h` | Eyebrow a la izquierda y, a la derecha, una nota gris corta (`.sec-m`) que explica cómo leerla o qué hace el clic. |
| Lo enfocado | `.hero`, `.row.on` | Una sola tarjeta blanca con sombra por panel: el pilar elegido a la izquierda, su puntaje a la derecha. |

## Piezas

| Pieza | Clase | Uso |
|---|---|---|
| Fila | `.row` | Etiqueta a la izquierda; estado y valor a la derecha; segunda línea a todo lo ancho (`.full`). `button.row` si hace algo. Variantes: `.s` (compacta: nombre, barra, valor), `.m` (métrica), `.kv` (dato y texto). |
| Barra | `.b4` | 4 px, relleno del color del pilar (`--c`), raya de la meta (`em`). `.b4.l` (6 px) solo en la tarjeta enfocada. |
| Valor | `.val` | Outfit 20 px; `.xl` 38 px en la tarjeta enfocada; `.s` 14 px en filas compactas. Unidad en `small` (mono 10 px, gris). |
| Estado | `.pst` | Siempre ícono + texto, nunca color solo. Corto en filas (Cumple / Mejorar / Atención); largo en la tarjeta enfocada. |
| Texto secundario | `.meta`, `.sec p` | Manrope 11 px gris; lo importante en `b`. |
| Chip | `.rc` | Relaciones y acciones de texto. `.on` = la que se ve en el plano; `.new` (punteado) = crearla. |
| Botón de ícono | `.ib` | Capas (`.tg`, tachado si está apagada) y el ojo de las métricas (`.sm`). Activo = tinte violeta. |

## Piezas de los modos Experiencia y Sustentabilidad

Viven en el mismo bloque de `app/index.html` y se documentan en `docs/modos.md`: el interruptor de modo (`.ix2.pxtabs`,
con palomita y color del modo), la métrica plegable (`details.pxmd`), el selector de usuario (`.seg.pxty`), el origen del
dato (`.og`), la letra de tipo (`.tl`), la conclusión (`.pxc`), la leyenda de la animación (`.pxcap`) y la retícula
personalizada (`.pxcp`). Los dos paneles llevan el color del modo (`--pxm`): tinte de fondo, encabezado más intenso y
franja de 4 px en el borde. Sin scroll en laptop: por alto de ventana, con plegados (un solo abierto por panel).

## Reglas

- **Escala de texto:** 10 · 11 · 12.5 · 17 · 20 · 38 px. Nada fuera de ella.
- **Color:** la tinta para texto; el color del pilar solo en su ícono, su barra y su marca; el violeta para lo activo.
  Nunca fondos negros en controles.
- **Sin repetir:** cada control vive en un solo panel. Capas, rutas, marcas, pesos e índice, a la izquierda; el detalle
  del pilar o la relación enfocada (métricas, rooms, relacionar con), a la derecha.
- **Mismo nombre en los dos lados:** «Relaciones» y «Relacionar con», «Capas», «Rooms».

## Resumen compacto

`#resumen=1` (o *Resumen compacto* en Ctrl K) muestra solo un panel, a todo lo alto y de 440 px como máximo, con
las mismas piezas: encabezado con la marca, índice en la tarjeta enfocada, pilares en filas, indicadores fuera de
meta (`.row.m`), rooms más bajos (`.row.s`) y el espacio (`.row.kv`). Abajo, *Abrir la app* y *Presentar*. Es lo
que abre el botón Resumen de Revit.
