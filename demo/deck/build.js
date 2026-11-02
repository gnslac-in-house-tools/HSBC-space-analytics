// Presentación del demo de Space Analytics con la identidad Halo (deck-halo de CD Week, variación Perla).
// Material: ../material/capturas (Revit), ../material/deck (assets.mjs) y ../material/clips (app-preview-clip).
// Salida: ../material/space-analytics-demo.pptx
const fs = require('fs');
const path = require('path');
const pptxgen = require('pptxgenjs');

const APPLY_THEME = process.env.PPTX_APPLY_THEME
  ?? path.join(process.env.USERPROFILE ?? '', '.claude/skills/synced/2d962e80-4152-46e8-b6f8-07b560f6f27a_a5fca594-eaca-4453-a869-5be7da194caa/pptx/scripts/apply_theme.js');
const M = path.resolve(__dirname, '../material');
const CAP = (f) => path.join(M, 'capturas', f);
const ART = (f) => path.join(M, 'deck', f);
const CLIP = (f) => path.join(M, 'clips', f);
const OUT = path.join(M, 'space-analytics-demo.pptx');

const THEME = {
  name: 'Halo Perla',
  headFontFace: 'Segoe UI Light',
  bodyFontFace: 'Segoe UI',
  colors: {
    dk1: '1D1E21', lt1: 'FFFFFF', dk2: '5E6166', lt2: 'F2F2F0',
    accent1: 'F27751', accent2: 'B7A6EE', accent3: '85BBEF', accent4: '7FD6C2', accent5: 'EE8FB4', accent6: '3F6FE0',
    hlink: '3F6FE0', folHlink: '5B539B',
  },
};
const MONO = 'Consolas';
const W = 13.333, H = 7.5, MX = 0.6;
const TOTAL = 13;
// Colores de los pilares (app/app.js) y de la paleta Halo: solo en puntos, nunca en franjas
const PILLAR = { flujo: 'F2734B', visib: '3F86F5', seg: '7B68F0', conf: 'E25FA3', sust: '3FA673' };

const pres = new pptxgen();
pres.layout = 'LAYOUT_WIDE';
pres.title = 'Space Analytics · demo';
pres.author = 'Computational Design LATAM';
pres.company = 'Gensler';
pres.theme = { headFontFace: THEME.headFontFace, bodyFontFace: THEME.bodyFontFace };
const C = pres.SchemeColor;

// ---------- layouts
// pptxgenjs convierte las opciones a EMU en su lugar: cada layout necesita objetos nuevos (fábricas, no constantes)
const eyebrowPh = () => ({ placeholder: { options: { name: 'eyebrow', type: 'body', x: MX, y: 0.32, w: 6.5, h: 0.3, fontFace: MONO, fontSize: 9, charSpacing: 2, color: C.text2, margin: 0, valign: 'middle' }, text: '' } });
const footer = () => [
  { text: { text: 'SPACE ANALYTICS · COMPUTATIONAL DESIGN LATAM', options: { x: MX, y: H - 0.5, w: 7, h: 0.3, fontFace: MONO, fontSize: 8, charSpacing: 2, color: C.text2, margin: 0, valign: 'middle' } } },
];
const slideNumber = () => ({ x: W - MX - 1.2, y: H - 0.5, w: 1.2, h: 0.3, fontFace: MONO, fontSize: 8, color: C.text2, align: 'right', margin: 0, valign: 'middle' });

pres.defineSlideMaster({ title: 'PORTADA', background: { color: C.background2 }, objects: [] });
pres.defineSlideMaster({
  title: 'CONTENIDO', background: { color: C.background2 }, slideNumber: slideNumber(),
  objects: [
    eyebrowPh(),
    { placeholder: { options: { name: 'title', type: 'title', x: MX, y: 0.72, w: W - 2 * MX, h: 0.85, fontSize: 32, color: C.text1, align: 'left', margin: 0, valign: 'top' }, text: '' } },
    ...footer(),
  ],
});
pres.defineSlideMaster({
  title: 'FRASE', background: { color: C.background2 }, slideNumber: slideNumber(),
  objects: [
    eyebrowPh(),
    { placeholder: { options: { name: 'title', type: 'title', x: MX, y: 1.9, w: 7.6, h: 2.6, fontSize: 40, color: C.text1, align: 'left', margin: 0, valign: 'top' }, text: '' } },
    { placeholder: { options: { name: 'body', type: 'body', x: MX, y: 4.75, w: 6.4, h: 1.2, fontSize: 15, color: C.text2, align: 'left', margin: 0, valign: 'top' }, text: '' } },
    ...footer(),
  ],
});

// ---------- piezas
const SECTIONS = ['01 EN REVIT', '02 LA APP', '03 SIGUIENTE'];
function nav(slide, active) {
  const runs = SECTIONS.map((s, i) => ({ text: (i === active ? '● ' : '') + s + (i < SECTIONS.length - 1 ? '     ' : ''), options: { bold: i === active, color: i === active ? C.text1 : C.text2 } }));
  slide.addText(runs, { x: W - MX - 5.2, y: 0.32, w: 5.2, h: 0.3, fontFace: MONO, fontSize: 8, charSpacing: 2, align: 'right', margin: 0, valign: 'middle', isTextBox: true, objectName: 'Navegación' });
}
const orb = (slide, name, x, y, d, transparency = 0) => slide.addImage({ path: ART(`orbe-${name}.png`), x, y, w: d, h: d, transparency, objectName: `Halo ${name}`, altText: '' });
function card(slide, x, y, w, h, name, fill = C.background1) {
  slide.addShape(pres.shapes.ROUNDED_RECTANGLE, {
    x, y, w, h, rectRadius: 0.22, fill: { color: fill }, line: { color: 'DEDEDA', width: 0.75 },
    shadow: { type: 'outer', color: '28205A', opacity: 0.08, blur: 14, offset: 4, angle: 90 }, objectName: name,
  });
}
// Imagen dentro de una tarjeta blanca, ajustada a su proporción
function framed(slide, file, pxW, pxH, x, y, maxW, maxH, name, pad = 0.12) {
  const r = pxW / pxH;
  let w = maxW - 2 * pad, h = w / r;
  if (h > maxH - 2 * pad) { h = maxH - 2 * pad; w = h * r; }
  const cw = w + 2 * pad, ch = h + 2 * pad;
  card(slide, x, y, cw, ch, `Marco ${name}`);
  slide.addImage({ path: file, x: x + pad, y: y + pad, w, h, objectName: name, altText: name });
  return { x, y, w: cw, h: ch };
}
const label = (slide, text, x, y, w, opts = {}) => slide.addText(text, { x, y, w, h: 0.28, fontFace: MONO, fontSize: 8.5, charSpacing: 2, color: C.text2, margin: 0, valign: 'middle', isTextBox: true, ...opts });
const body = (slide, text, x, y, w, h, opts = {}) => slide.addText(text, { x, y, w, h, fontSize: 14, color: C.text2, margin: 0, valign: 'top', isTextBox: true, paraSpaceAfter: 6, ...opts });
function stat(slide, value, unit, caption, x, y, w) {
  slide.addText([{ text: value, options: { fontSize: 40, color: C.text1 } }, { text: unit ? ` ${unit}` : '', options: { fontSize: 16, color: C.text2 } }],
    { x, y, w, h: 0.75, fontFace: THEME.headFontFace, margin: 0, valign: 'bottom', isTextBox: true });
  slide.addText(caption, { x, y: y + 0.8, w, h: 0.5, fontSize: 11, color: C.text2, margin: 0, valign: 'top', isTextBox: true });
}
const dot = (slide, color, x, y, d = 0.16) => slide.addShape(pres.shapes.OVAL, { x, y, w: d, h: d, fill: { color }, line: { color, width: 0 } });
const b64 = (file, mime) => `data:${mime};base64,${fs.readFileSync(file).toString('base64')}`;
const content = (sectionTitle) => pres.addSlide({ masterName: 'CONTENIDO', sectionTitle });

// =====================================================================
// 1 · Portada
pres.addSection({ title: 'Portada' });
{
  const s = pres.addSlide({ masterName: 'PORTADA', sectionTitle: 'Portada' });
  orb(s, 'calido', 7.4, -1.6, 6.6);
  orb(s, 'frio', 10.2, 3.9, 4.4);
  orb(s, 'aurora', 6.5, 4.6, 2.2, 15);
  orb(s, 'lila', MX, 0.5, 0.42);
  s.addText([{ text: 'space analytics', options: { breakLine: true } }, { text: 'COMPUTATIONAL DESIGN · LATAM', options: { fontFace: MONO, fontSize: 7, charSpacing: 2, color: C.text2 } }],
    { x: MX + 0.55, y: 0.48, w: 4, h: 0.5, fontSize: 15, color: C.text1, margin: 0, valign: 'middle', isTextBox: true });
  label(s, 'DEMO · PLUGIN DE REVIT + APP', MX, 2.25, 6);
  s.addText('Leer cómo se vive una sucursal antes de construirla', { x: MX, y: 2.6, w: 7.0, h: 2.3, fontFace: THEME.headFontFace, fontSize: 48, color: C.text1, margin: 0, valign: 'top', isTextBox: true });
  body(s, 'Flujo, visibilidad, seguridad, confort y sustentabilidad, medidos sobre el mismo modelo de Revit cada vez que cambia.', MX, 5.05, 5.6, 0.9, { fontSize: 15 });
  label(s, 'RAMÓN GARCÍA · NOVIEMBRE 2026', MX, H - 0.62, 6);
  s.addNotes('Space Analytics: un plugin de Revit que exporta el modelo y una app que lo analiza en el navegador. Hoy lo vemos con el modelo de muestra de Autodesk.');
}

// 2 · La pregunta
{
  const s = pres.addSlide({ masterName: 'FRASE', sectionTitle: 'Portada' });
  s.addText('PARA EMPEZAR', { placeholder: 'eyebrow' });
  s.addText('¿Cómo se va a sentir esta sucursal antes de construirla?', { placeholder: 'title' });
  s.addText('Hoy lo respondemos con criterio y experiencia. Space Analytics lo mide en una retícula sobre el modelo, con metas por pilar, para decidir con datos y no solo con renders.', { placeholder: 'body' });
  orb(s, 'aurora', 8.6, 1.2, 5.6);
  s.addNotes('La pregunta del cliente es cualitativa. La respuesta que damos es medible y se recalcula con cada versión del modelo.');
}

// 3 · Cinco pilares
{
  const s = content('Portada');
  s.addText('QUÉ MIDE', { placeholder: 'eyebrow' });
  s.addText('Cinco pilares, cada uno con su meta', { placeholder: 'title' });
  const P = [
    ['Flujo y Proximidad', PILLAR.flujo, 'Llegar y saber a dónde ir sin pensarlo.', 'Accesibilidad desde el acceso', 'META 65'],
    ['Visibilidad', PILLAR.visib, 'Ver y ser visto en la medida justa.', 'Vista al exterior y entre zonas', 'META 65'],
    ['Seguridad', PILLAR.seg, 'Sentirse protegido sin sentirse vigilado.', 'Vigilancia natural del personal', 'META 70'],
    ['Confort sensorial', PILLAR.conf, 'Un lugar donde bajar la voz y el pulso.', 'Luz natural y calma', 'META 60'],
    ['Sustentabilidad', PILLAR.sust, 'Materiales que cuidan a quien habita y al planeta.', 'Datos de materiales por tipo', 'META 70'],
  ];
  const gap = 0.22, cw = (W - 2 * MX - gap * 4) / 5, y = 2.05, ch = 4.3;
  P.forEach(([name, color, feel, mide, meta], i) => {
    const x = MX + i * (cw + gap);
    card(s, x, y, cw, ch, `Pilar ${name}`);
    dot(s, color, x + 0.25, y + 0.32);
    s.addText(name, { x: x + 0.5, y: y + 0.22, w: cw - 0.65, h: 0.36, fontSize: 13, bold: true, color: C.text1, margin: 0, valign: 'middle', isTextBox: true });
    s.addText(`“${feel}”`, { x: x + 0.25, y: y + 0.8, w: cw - 0.5, h: 1.7, fontFace: THEME.headFontFace, fontSize: 19, color: C.text1, margin: 0, valign: 'top', isTextBox: true });
    s.addText(mide, { x: x + 0.25, y: y + ch - 1.25, w: cw - 0.5, h: 0.6, fontSize: 11, color: C.text2, margin: 0, valign: 'top', isTextBox: true });
    label(s, meta, x + 0.25, y + ch - 0.55, cw - 0.5);
  });
  body(s, 'Cada pilar se calcula por celda de 0.5 m y se compara contra su meta. Con los pesos del cliente forman un índice ponderado.', MX, 6.5, 9, 0.45, { fontSize: 12 });
  s.addNotes('Las frases son las de la app. Las metas son las que usa el motor (Flujo 65, Visibilidad 65, Seguridad 70, Confort 60, Sustentabilidad 70).');
}

// 4 · Cómo funciona
{
  const s = content('Portada');
  s.addText('CÓMO FUNCIONA', { placeholder: 'eyebrow' });
  s.addText('Del modelo a la junta en tres pasos', { placeholder: 'title' });
  const steps = [
    ['1', 'Exportar en Revit', 'Lee rooms, muros, puertas, ventanas, mobiliario y circulaciones verticales. Solo lee: no cambia el modelo.', 'PLUGIN PYREVIT'],
    ['2', 'Un solo archivo', 'Un HTML portátil con la app y los datos dentro, más el space-model.json. Se abre con doble clic, sin instalar nada.', 'DOCUMENTOS\\HSBC SPACE ANALYTICS'],
    ['3', 'Analizar y presentar', 'La app arma la retícula, calcula los cinco pilares y los muestra en tablero, plano, 3D, resumen y presentación.', 'EDGE O CHROME'],
  ];
  const gap = 0.3, cw = (W - 2 * MX - gap * 2) / 3, y = 2.05, ch = 4.25;
  steps.forEach(([n, t, d, tag], i) => {
    const x = MX + i * (cw + gap);
    card(s, x, y, cw, ch, `Paso ${n}`);
    s.addText(n, { x: x + 0.35, y: y + 0.25, w: 1.2, h: 1.1, fontFace: THEME.headFontFace, fontSize: 60, color: C.text1, margin: 0, valign: 'top', isTextBox: true });
    s.addText(t, { x: x + 0.35, y: y + 1.75, w: cw - 0.7, h: 0.45, fontSize: 18, bold: true, color: C.text1, margin: 0, valign: 'top', isTextBox: true });
    body(s, d, x + 0.35, y + 2.3, cw - 0.7, 1.3, { fontSize: 13 });
    label(s, tag, x + 0.35, y + ch - 0.55, cw - 0.7);
  });
  orb(s, 'menta', MX + 2 * (cw + gap) + cw - 1.15, y + 0.3, 0.8);
  s.addNotes('Todo el análisis corre en el navegador. Revit solo exporta; el HTML portátil se puede mandar por correo o Teams.');
}

// =====================================================================
// 5 · El plugin en Revit
pres.addSection({ title: 'En Revit' });
{
  const s = content('En Revit');
  s.addText('01 · EN REVIT', { placeholder: 'eyebrow' });
  s.addText('Una pestaña en Revit, cuatro botones', { placeholder: 'title' });
  nav(s, 0);
  framed(s, CAP('01-revit-cinta-space-analytics.png'), 1920, 1080, MX, 1.85, 8.9, 5.1, 'Revit 2027 con la pestaña Space Analytics');
  const tx = MX + 8.9 + 0.4, tw = W - MX - tx;
  const B = [['Exportar', 'Lleva el modelo a la app.'], ['Abrir', 'La app con la última exportación.'], ['Resumen', 'Un panel angosto junto al modelo.'], ['Presentar', 'La presentación a pantalla completa.']];
  B.forEach(([n, d], i) => {
    const y = 2.0 + i * 1.08;
    orb(s, ['calido', 'frio', 'lila', 'aurora'][i], tx, y + 0.02, 0.42);
    s.addText(n, { x: tx + 0.58, y, w: tw - 0.58, h: 0.36, fontSize: 15, bold: true, color: C.text1, margin: 0, valign: 'middle', isTextBox: true });
    body(s, d, tx + 0.58, y + 0.4, tw - 0.58, 0.55, { fontSize: 12 });
  });
  label(s, 'MODELO DE MUESTRA DE AUTODESK · REVIT 2027', tx, 6.45, tw);
  s.addNotes('Extensión de pyRevit. Funciona en Revit 2025 y 2027; este modelo de muestra está guardado en 2027.');
}

// 6 · Exportar
{
  const s = content('En Revit');
  s.addText('01 · EN REVIT · EXPORTAR', { placeholder: 'eyebrow' });
  s.addText('Exportar tarda un segundo y no toca el modelo', { placeholder: 'title' });
  nav(s, 0);
  const a = framed(s, CAP('02-exportar-inicio.png'), 452, 373, MX, 1.95, 4.0, 3.4, 'Ventana Exportar antes de exportar');
  framed(s, CAP('03-exportar-listo.png'), 452, 485, MX + a.w + 0.3, 1.95, 4.0, 4.6, 'Ventana Exportar con el resultado');
  label(s, 'ANTES', MX, 1.95 + a.h + 0.15, 2);
  const sx = 9.15, sw = (W - MX - sx) / 2;
  stat(s, '91', 'rooms', 'leídos con su nivel y contorno', sx, 2.0, sw - 0.1);
  stat(s, '100', 'puertas', 'que conectan la retícula', sx + sw, 2.0, sw - 0.1);
  stat(s, '180', 'muros', 'que la separan', sx, 3.6, sw - 0.1);
  stat(s, '10', 'circulaciones', 'verticales entre niveles', sx + sw, 3.6, sw - 0.1);
  body(s, 'Si algo no se puede leer, la ventana lo dice: aquí, una puerta sin geometría.', sx, 5.3, W - MX - sx, 0.8, { fontSize: 12 });
  label(s, 'RACADVANCEDSAMPLEPROJECT · EJEMPLO', sx, 6.45, W - MX - sx);
  s.addNotes('Cifras de la exportación real del modelo de muestra de Autodesk (racadvancedsampleproject), no de un proyecto del cliente.');
}

// =====================================================================
// 7 · La app
pres.addSection({ title: 'La app' });
{
  const s = content('La app');
  s.addText('02 · LA APP', { placeholder: 'eyebrow' });
  s.addText('Tablero, plano e inspector en una pantalla', { placeholder: 'title' });
  nav(s, 1);
  const f = framed(s, ART('app-inicio.jpg'), 2880, 1620, MX, 1.8, 9.6, 5.0, 'App con el modelo de muestra');
  const tx = MX + f.w + 0.4, tw = W - MX - tx;
  [['Tablero', 'Los cinco pilares contra su meta, las capas y las prioridades del cliente.'], ['Plano', 'Planta, 3D o dividida, con el pilar pintado celda por celda.'], ['Inspector', 'Por qué sale ese puntaje: métricas, rooms y relaciones.']]
    .forEach(([t, d], i) => {
      const y = 2.0 + i * 1.45;
      s.addText(t, { x: tx, y, w: tw, h: 0.36, fontSize: 15, bold: true, color: C.text1, margin: 0, valign: 'middle', isTextBox: true });
      body(s, d, tx, y + 0.42, tw, 0.95, { fontSize: 12 });
    });
  s.addNotes('Abre directo en el nivel de acceso con el pilar más bajo seleccionado: aquí Seguridad, porque el modelo no tiene puestos de personal marcados.');
}

// 8 · Clip A
function clipSlide(eyebrow, title, clip, poster, points, notes) {
  const s = content('La app');
  s.addText(eyebrow, { placeholder: 'eyebrow' });
  s.addText(title, { placeholder: 'title' });
  nav(s, 1);
  const vw = 8.7, vh = vw * 9 / 16, x = MX, y = 1.8; // termina arriba del pie (7.0")
  card(s, x, y, vw + 0.24, vh + 0.24, 'Marco del clip');
  s.addMedia({ type: 'video', path: CLIP(clip), x: x + 0.12, y: y + 0.12, w: vw, h: vh, cover: b64(CLIP(poster), 'image/jpeg'), objectName: title });
  const tx = x + vw + 0.64, tw = W - MX - tx;
  points.forEach(([big, unit, cap], i) => stat(s, big, unit, cap, tx, 1.95 + i * 1.6, tw));
  label(s, 'CLIP · CLIC PARA REPRODUCIR', tx, 6.45, tw);
  s.addNotes(notes);
}
clipSlide('02 · LA APP · UN CLIC, UN PILAR', 'Un clic en un pilar pinta todo el plano', 'hsbc-pilar.mp4', 'hsbc-pilar-poster.jpg',
  [['33', '/ 100', 'Flujo y Proximidad: requiere atención (meta 65)'], ['36', 'm', 'distancia media desde el acceso (meta ≤ 15 m)'], ['71', 'm', 'la ruta más lejana del nivel']],
  'Clic en Flujo: el plano se pinta con la accesibilidad desde el acceso y el inspector explica el 33. Al final, la misma lectura en la vista dividida 3D. Cifras del modelo de muestra.');

// 9 · Clip B
clipSlide('02 · LA APP · PRIORIDADES DEL CLIENTE', 'Las prioridades del cliente mueven el índice, no el diagnóstico', 'hsbc-prioridades.mp4', 'hsbc-prioridades-poster.jpg',
  [['44.2', '', 'índice ponderado con los pesos de fábrica'], ['49.1', '', 'con más peso a Visibilidad y menos a Seguridad'], ['=', '', 'los puntajes y el plano no cambian']],
  'El peso dice cuánto le importa cada pilar al cliente. Cambia el índice ponderado; el diagnóstico de cada celda sigue igual. Cifras del modelo de muestra.');

// 10 · Resumen junto al modelo
{
  const s = content('La app');
  s.addText('02 · LA APP · RESUMEN', { placeholder: 'eyebrow' });
  s.addText('El resumen se queda junto al modelo', { placeholder: 'title' });
  nav(s, 1);
  const f = framed(s, CAP('06-revit-con-resumen.png'), 1920, 1080, MX, 1.8, 9.6, 5.0, 'Revit con el resumen de la app al lado');
  const tx = MX + f.w + 0.4, tw = W - MX - tx;
  body(s, 'El botón Resumen abre la app en una ventana angosta, como un panel más de Revit: índice, pilares, indicadores fuera de meta y los rooms más bajos.', tx, 2.0, tw, 2.2, { fontSize: 14 });
  body(s, 'Lo calcula la misma app con la última exportación. Si el modelo cambió, se exporta de nuevo.', tx, 4.3, tw, 1.4, { fontSize: 12 });
  label(s, 'VENTANA DE 440 PX', tx, 6.45, tw);
  s.addNotes('Pensado para revisar mientras se modela, sin salir de Revit.');
}

// 11 · Presentar
{
  const s = content('La app');
  s.addText('02 · LA APP · PRESENTAR', { placeholder: 'eyebrow' });
  s.addText('La misma lectura, lista para la junta', { placeholder: 'title' });
  nav(s, 1);
  const gap = 0.3, fw = (W - 2 * MX - gap) / 2;
  const a = framed(s, ART('presentar-1.jpg'), 2880, 1620, MX, 1.85, fw, 4.2, 'Presentación · portada');
  framed(s, ART('presentar-5.jpg'), 2880, 1620, MX + fw + gap, 1.85, fw, 4.2, 'Presentación · pilar Flujo');
  label(s, 'PORTADA: ÍNDICE Y PILARES', MX, 1.85 + a.h + 0.15, fw);
  label(s, 'UN PILAR: QUÉ SE SIENTE, MÉTRICAS Y PLANO', MX + fw + gap, 1.85 + a.h + 0.15, fw);
  body(s, 'Presentar arma las diapositivas con los datos de la exportación: resumen ejecutivo, cómo leer el análisis, indicadores y un pilar por diapositiva.', MX, 6.15, W - 2 * MX, 0.5, { fontSize: 12 });
  s.addNotes('Se abre desde Revit o con la tecla P en la app. Con el arreglo de esta semana abre maximizada aunque el resumen esté abierto.');
}

// =====================================================================
// 12 · Siguiente
pres.addSection({ title: 'Siguiente' });
{
  const s = content('Siguiente');
  s.addText('03 · SIGUIENTE', { placeholder: 'eyebrow' });
  s.addText('Lo que falta para leer una sucursal real', { placeholder: 'title' });
  nav(s, 2);
  const N = [
    ['Un modelo de sucursal', 'Correr el flujo completo con un modelo del proyecto y revisar sus metas con el equipo.', 'calido'],
    ['Puestos de personal', 'Marcar los puestos con SA_Rol = Personal para medir Seguridad y vigilancia natural.', 'lila'],
    ['Tabla de materiales', 'Unir la tabla de Excel por Type Mark (GWP, reciclado, costo) para medir Sustentabilidad.', 'menta'],
  ];
  const gap = 0.3, cw = (W - 2 * MX - gap * 2) / 3, y = 2.05, ch = 4.0;
  N.forEach(([t, d, o], i) => {
    const x = MX + i * (cw + gap);
    card(s, x, y, cw, ch, t);
    orb(s, o, x + 0.32, y + 0.32, 0.75);
    s.addText(t, { x: x + 0.35, y: y + 1.35, w: cw - 0.7, h: 0.45, fontSize: 18, bold: true, color: C.text1, margin: 0, valign: 'top', isTextBox: true });
    body(s, d, x + 0.35, y + 1.9, cw - 0.7, 1.6, { fontSize: 13 });
  });
  s.addNotes('En el modelo de muestra Seguridad sale en 2 y Sustentabilidad sin datos: no son fallas del análisis, son datos que el modelo no trae.');
}

// 13 · Gracias
{
  const s = pres.addSlide({ masterName: 'PORTADA', sectionTitle: 'Siguiente' });
  orb(s, 'calido', 8.1, -1.2, 5.6);
  orb(s, 'frio', 10.6, 4.3, 3.8);
  orb(s, 'menta', 6.9, 4.9, 1.8, 10);
  orb(s, 'lila', MX, 0.5, 0.42);
  s.addText([{ text: 'space analytics', options: { breakLine: true } }, { text: 'COMPUTATIONAL DESIGN · LATAM', options: { fontFace: MONO, fontSize: 7, charSpacing: 2, color: C.text2 } }],
    { x: MX + 0.55, y: 0.48, w: 4, h: 0.5, fontSize: 15, color: C.text1, margin: 0, valign: 'middle', isTextBox: true });
  s.addText('Gracias', { x: MX, y: 2.4, w: 7, h: 1.6, fontFace: THEME.headFontFace, fontSize: 88, color: C.text1, margin: 0, valign: 'top', isTextBox: true });
  label(s, 'EL REPO ES PÚBLICO', MX, 4.45, 6);
  s.addText('github.com/gnslac-in-house-tools/HSBC-space-analytics', { x: MX, y: 4.75, w: 7, h: 0.4, fontSize: 14, color: C.text1, margin: 0, valign: 'middle', isTextBox: true, hyperlink: { url: 'https://github.com/gnslac-in-house-tools/HSBC-space-analytics' } });
  s.addText([{ text: 'Ramón García', options: { bold: true, color: C.text1, breakLine: true } }, { text: 'Computational Designer y AI Builder · Costa Rica', options: { color: C.text2 } }],
    { x: MX, y: 5.45, w: 6, h: 0.7, fontSize: 12, margin: 0, valign: 'top', isTextBox: true });
  label(s, 'SPACE ANALYTICS · COMPUTATIONAL DESIGN LATAM', MX, H - 0.62, 7);
}

(async () => {
  await pres.writeFile({ fileName: OUT });
  const { applyTheme } = require(APPLY_THEME);
  await applyTheme(OUT, THEME);
  console.log(`✓ ${OUT} (${TOTAL} diapositivas)`);
})().catch((e) => { console.error(e); process.exit(1); });
