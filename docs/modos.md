# Modos Experiencia y Sustentabilidad

La app tiene dos modos: **Experiencia** (cómo vive la sucursal cada tipo de cliente) y **Sustentabilidad** (lo que aportan los
elementos y el espacio, sin depender del usuario). Esta nota dice cómo se ve cada uno, qué cambia en la interfaz al pasar de
uno a otro y cómo nace cada mapa en el plano. Nació como la propuesta `docs/mockups/app-propuesta/` (queda en el historial de git)
y ya es la app: `app/index.html`, `app/app.js` y `app/indices.js`.

## Cómo está armado

- **`app/indices.js`:** el cálculo. Temas por familia, métricas con rango malo → bueno, tipos de cliente, hallazgos por regla
  y espera por Erlang C. Corre sobre el resultado del motor (`engine.js`): `spatial()` una vez por análisis y `score()` cada
  vez que cambian los supuestos. Se prueba con `node --test app/tests/indices.test.js`.
- **`app/app.js`, bloque «modos Experiencia y Sustentabilidad»:** la interfaz. Reemplaza el tablero, el inspector, la leyenda,
  el Resumen, el plano y las slides de la presentación. Las funciones originales quedan como `renderBoardBase`,
  `renderInspectorBase`, `renderLegendBase`, `renderDigestBase`, `renderViewportBase` y `drawSlideBase`, y cada reemplazo las
  llama para lo que no es de estos dos modos (relaciones, pilares de la presentación, estado vacío, Senses).
- **`app/index.html`:** los estilos de las piezas nuevas, al final de su `<style>`, y `<script src="indices.js">`. El
  exportador de Revit (`bundle.py`) incrusta ese script como los demás.
- **Los pilares de antes** (flujo, visibilidad, seguridad, confort, sustentabilidad) siguen en el motor y en la presentación;
  las relaciones se calculan con ellos. El tablero ya no los lista: muestra los 8 temas.
- **Modelo de muestra:** la app abre una sucursal de ejemplo (`app/samples/sucursal.js`), inventada: de huella irregular (entrada en un nicho hacia la calle, esquina
  achaflanada, muro oblicuo al fondo) y en dos niveles, con 3 ATMs, el lobby pegado a la puerta, una sala de espera con cuatro filas de sillas y, entre las
  sillas y las 4 cajas, un pasillo de 1 m frente a las cajas y un muro delgado, del largo de la fila de cajas, que tapa la vista de las sillas; además de una sala de espera lateral, 4 salas de asesoría, host, bóveda, back office y un mezzanine de personal con su escalera, y con el estándar
  `SA_` completo, así que calcula los 8 temas. En un modelo que no traiga servicios, lo que no tiene datos dice «Sin datos» y
  los índices dicen «Índice parcial · 2 de 5 temas con datos». El mezzanine es solo de personal: ahí Experiencia es parcial.

## Reglas (las de `docs/paneles.md`, sin excepciones)

- **Piezas:** `.panel.side`, `.phd`, `.sec` + `.sec-h`, `.row` (y `.s`, `.m`, `.kv`), `.b4`, `.val`, `.pst`, `.hero`, `.seg`,
  `.step`, `details.sec.prio`, `.dots`. Nada estilizado a mano fuera de esta lista y de las piezas nuevas de abajo.
- **Escala de texto:** 10 · 11 · 12.5 · 17 · 20 · 38 px.
- **Una tarjeta por panel:** en el tablero, el tema enfocado (`.row.on`); en el inspector, el puntaje (`.hero`); en el
  Resumen, los dos índices. Los índices del tablero van planos, sin tarjeta.
- **Color:** cada tema tiene el suyo, solo en su ícono, su barra y su marca. El estado siempre es ícono + texto.
- **Raya de la barra = 70** en todo: es el umbral de «Cumple». 40–69 es «Mejorar» y menos de 40, «Atención».

## Piezas nuevas

| Pieza | Clase | Regla |
|---|---|---|
| Índices | `.ix2` > `.ixc` | Dos columnas planas separadas por una línea: eyebrow, `.val.xl`, `.pst`, `.b4.l`, una línea `.meta` de 10 px que dice de qué está hecho. |
| Modo | `.ix2.pxtabs` > `.ixc.pxtab` | Los índices como botones (`aria-pressed`). Activo: palomita (`.pxck`), borde y fondo del color de la familia. El otro: círculo vacío y gris, con su puntaje. Solo en el tablero; en el Resumen van los índices planos. Es la excepción a «índices sin tarjeta». |
| Métrica plegable | `details.pxmd` | La fila es el resumen (nombre, valor, estado, barra); rango, qué mide, origen y conclusión van dentro. |
| Familia | `.eyebrow.pxf` + `.dots` | Los puntos de color de sus temas delante del eyebrow: la misma pieza de las relaciones. |
| Usuario | `.pxus` | Encabezado «Usuario» y un **selector desplegable**: el botón dice quién está elegido (letra o puntos de color, nombre y qué atiende con su duración) y abre una lista flotante de cuatro opciones (Todos · Express · Transaccional · Asesoría), cada una con su letra, qué atiende y cuánto dura, y una palomita en la elegida. La lista flota: abrirla no mueve nada ni agrega scroll. Se cierra al elegir, con Esc o con un clic fuera; funciona con flechas, Inicio, Fin y Tab. Sustituye al segmentado de cuatro botones, que no dejaba claro qué era cada uno. |
| Retícula personalizada | `#px-cb` + `.pxcp` | Tercer botón del tamaño de celda: deslizador de 0.1 a 1 m que solo se aplica con Aceptar, con celdas estimadas y aviso si es fina (menos de 0.3 m) o si el motor la limita. |
| Letra de tipo | `.tl` | 15 px, letra blanca sobre el color del tipo. Marca a quién aplica una métrica. |
| Origen del dato | `.og` | Mono de 10 px con borde: Modelado, Supuesto, Proxy, Genérico, EPD. |
| Métrica del tema | `.row.m.pxm` | Nombre y valor; barra del puntaje con la raya en 70; estado + puntos, rango «bueno · malo», qué mide, origen y tipos. |
| Conclusión | `.pxc` | Solo si la métrica no cumple: la frase con el valor (en tinta) y la sugerencia (en gris). |

## Qué va en cada panel

- **Dos modos:** Experiencia habla del usuario; Sustentabilidad, de los elementos. Los dos índices son el interruptor. El
  modo sale del tema enfocado; cada modo recuerda su último tema y la primera vez abre el de puntaje más bajo.
- **El tablero va sin notas.** Ni «clic: pintarla en el plano», ni «del schedule de Revit», ni «para quién se mide», ni la
  frase bajo el título, ni «por regla» en Hallazgos, ni la línea «Índice potencial…» bajo cada índice. Lo único que avisa es
  «Índice parcial · 2 de 5 temas con datos», cuando faltan datos, y el contador de capas «6 de 7 visibles», que además dice
  el nombre de la capa al pasar el cursor. Las notas se quedan en el inspector, donde explican cómo sale cada número.
- **Tablero (izquierda) en Experiencia:** índices · tipo de cliente + 5 temas · Relaciones · Capas · *Supuestos de demanda*
  (plegado) · *Hallazgos* de esta familia (plegado). Se va *Prioridades del cliente*: la mezcla de clientes ocupa su lugar.
- **Tablero (izquierda) en Sustentabilidad:** índices · 3 temas · Capas · *Hallazgos* de esta familia (plegado).
- **Inspector (derecha):** franja del color del modo en el borde y el nombre del modo como eyebrow. Pregunta del tema ·
  puntaje · *Cómo sale* (por tipo de cliente o por métrica) · *¿Qué pasa si…?* (solo Espera) · *Métricas* · lo que más
  carbono aporta (solo Carbono) · *En el plano*.
- **Resumen de Revit:** índices · los 5 temas · por tipo de cliente · los 3 de sustentabilidad · hallazgos (plegado) ·
  el espacio.

## Sin scroll en laptop

Se decide por alto de ventana, no por pulgadas. Hasta **1100 px**: métricas, *¿Qué pasa si…?* y las notas plegadas, con un
solo plegado abierto por panel; las capas muestran solo sus íconos (opacidad, ruta y marcas detrás de su botón). Hasta
**900 px** (14"): todo más apretado, sin el encabezado del tablero; al abrir un plegado se esconde lo demás para que siga
cabiendo. Hasta **640 px**: sin la pregunta del tema. Lo único que todavía hace scroll son *Hallazgos* y *Supuestos* abiertos.

## Cuando el modelo no trae el dato

Un servicio que el modelo no tiene (0 ATMs, 0 cajas o 0 mesas de asesoría) no se califica como 0: su espera y las salidas sin
atender quedan en **«Sin datos»** y no suman al índice. Quitar un ATM a propósito en «¿Qué pasa si…?» sí cuenta (la espera
se vuelve infinita y el puntaje baja a 0). Cada índice dice cuántos de sus temas tienen datos; si faltan, es **parcial**.

## Color del modo

Los dos paneles laterales llevan el color del modo (morado en Experiencia, verde en Sustentabilidad): un tinte en el
fondo (7 %), el encabezado más intenso (15 %) y una franja de 4 px en el borde izquierdo. El color sale de `--pxm`, que
`pxSync()` pone en `:root` cada vez que cambia el tema enfocado.

## Retícula personalizada

Junto a 0.5 m y 1.0 m hay un tercer botón, **Personalizado**. Abre un deslizador de 0.1 a 1 m (pasos de 0.05) que **solo se
aplica con Aceptar**; Cancelar, Esc o un clic fuera lo cierran sin cambiar nada. Mientras se mueve dice cuántas celdas libres
tendrá el análisis y cuántas veces las de 0.5 m. Avisa:

- **Fina** (menos de 0.3 m): «puede tardar unos segundos más».
- **Muy fina** (0.15 m o menos): «de varios segundos a minutos, según el modelo; la página no responde mientras corre».
- **Nivel grande:** si el motor la va a subir por su límite de 250 000 celdas, dice a cuánto.

El botón muestra el tamaño elegido (`Personalizado · 0.1 m`). Elegir 0.5 o 1.0 en el deslizador equivale a su botón.

**Corrección del motor (`app/engine.js`, también en la app real).** El grafo de circulación comparaba la distancia nueva
(doble precisión) contra la guardada (`Float32Array`). Con celdas como 0.2 o 0.1 m, que no son exactas en Float32, el
redondeo contaba como «mejora» y el mismo costo se volvía a meter al montículo una y otra vez: 940 millones de
relajaciones a 0.2 m (28 s) y más de 9 minutos sin terminar a 0.1 m. Ahora la distancia se redondea a Float32 antes de
comparar (`Math.fround`), en `relax8` y en los saltos entre niveles. En la sucursal de prueba, el análisis completo con la
capa de los índices tarda 0.4 s a 0.2 m y 4.6 s a 0.1 m (unos 10 s en el navegador). La prueba
«una retícula fina no dispara el grafo» lo cuida; las 25 del motor pasan.

**Ojo:** los puntajes cambian con la retícula (de 0.5 a 0.1 m: Experiencia 70 → 67, Privacidad 87 → 73, Confort 57 → 45).
Para comparar sucursales hay que fijar una retícula de referencia.

## Cómo nace cada tema

Al cambiar de tema, de relación o de análisis, las celdas aparecen en el orden que dicta **el mismo dato con el que se
calcula** (`pxOrigin` en `app/app.js`). No es decoración: si el dato cambia, cambia la animación. Cada una marca de
dónde nace (un pulso en cada origen) y lo dice en una frase al pie del plano.

| Tema | De dónde nace | Orden de las celdas | Qué se ve además |
|---|---|---|---|
| Orientación | La entrada | Distancia caminando desde la puerta (`dEnt`), esquivando muros y muebles. | Pulso en cada acceso. |
| Espera | ATM, caja y mesa | Distancia a su punto de servicio, en etapas: Express, luego Transaccional, al final Asesoría. | Pulso en cada punto. La intensidad es la ocupación. |
| Privacidad | Asientos y ventanillas | Un anillo por punto, solo donde hay vista directa, hasta 8 m (como la métrica). | Dentro de cada sala de asesoría no se pinta: la métrica excluye su propia sala. |
| Seguridad | Puestos de personal | Barrido de radar desde el norte. La primera mirada pinta a medias y la última completa: donde se traslapan, se intensifica. | La aguja del radar se detiene en los muros. |
| Confort | Vidrios exteriores | Avance desde el vidrio exterior por lo que no es opaco. | Los vidrios brillan al inicio. Es aproximación visual: el cálculo usa la vista al vidrio. |
| Carbono | Elementos del schedule | Por CO₂ aportado, de mayor a menor; cada piso se asienta desde su centro al llegar su turno. | Los muebles destellan en su turno; el color queda en los pisos, que es donde vive el dato. |
| Circularidad | Material de cada piso | Una vuelta completa alrededor del centro de cada piso, del más grande al más chico. | **Flechas de reciclaje** (♻) que giran en el centro de cada piso y un arco con flecha que cierra el ciclo. |
| Eficiencia | Área de clientes | Cuarto por cuarto desde la entrada, fila por fila, a ritmo parejo. | Contador de m² subiendo en la frase. |

Los pilares de la presentación nacen igual que el tema que miden: **Flujo** como Orientación (es la misma distancia
caminando), **Sustentabilidad** como Carbono, **Confort** como Confort ambiental. **Visibilidad** nace en lo más abierto
(isovista más grande) y termina en los rincones.

### Relaciones: tres actos

Una relación cruza dos temas celda por celda, así que su animación cuenta esa historia en tres actos (`pxPlayRel`):

1. El primer tema nace desde su origen, en su color.
2. El segundo nace desde el suyo. En un **conflicto** se pinta lo que le falta (por ejemplo, poco confort) y en orden
   inverso: primero lo más lejano a su origen.
3. Los dos se apagan y se encienden en rojo las celdas donde se cruzan, de la más fuerte a la más débil. Al final quedan
   los contornos de las que pasan el umbral, como siempre.

| Relación | Acto 1 | Acto 2 | Acto 3 |
|---|---|---|---|
| Zona de estrés (Flujo × Confort, conflicto) | «Por aquí pasa la gente · desde la entrada» | «Aquí falta calma · lejos de la luz y junto al paso» | «Donde se cruzan: zona de estrés» |
| Vigilancia natural (Visibilidad × Seguridad) | «Lo que se ve · desde lo más abierto» | «Lo que vigila el personal · desde cada puesto» (con el radar) | «Donde coinciden: vigilancia natural» |

Las demás relaciones usan los mismos tres actos con frases genéricas («Flujo alto», «Confort bajo», «Donde se cruzan: …»).

### Reglas de las animaciones

- **Duración:** unos 2 s por tema (1.9 a 2.4 s) y 4.6 s por relación; lo anterior se desvanece en 0.26 s.
- **Cuándo:** al cambiar de tema, de relación o de análisis (retícula, nivel). Mover capas, el umbral o hacer zoom no la repite.
- **Interrupción:** si cambias a media animación, arranca la nueva; nunca quedan dos encima.
- **Presentación:** cada slide con planta (pilar o relación) reproduce su animación al entrar.
- **Dónde:** solo en planta, no en 3D. No corre con el Resumen abierto ni con «reducir movimiento» del sistema.
- **Para estudiarlas:** `app/index.html?lento=8` las hace 8 veces más lentas.
- **Técnica:** el calor se pinta en un canvas por acto (`foreignObject`) encima del fondo y debajo de muros y muebles; al
  terminar se cambia por la imagen final ya decodificada, así que no hay salto.

## Números

Todo sale del motor real sobre la sucursal de prueba, salvo los supuestos (mezcla 50/35/15, 30 clientes/h en la hora pico,
60 % de asesoría con cita, tiempos de servicio y paciencia) y los factores genéricos de carbono, que son de ejemplo. La
espera usa Erlang C; la versión final usará una simulación con semilla fija.
