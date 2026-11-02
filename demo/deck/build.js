// Presentación del demo de Space Analytics con la identidad Halo (deck-halo de CD Week, variación Perla).
// Las diapositivas se diseñan en slides.html y render.mjs las captura (../material/deck/slides/).
// Aquí cada una va como imagen a sangre, con encima lo que debe seguir vivo en PowerPoint:
// los videos (que fix-media.ps1 reinserta para que se reproduzcan solos y en bucle) y los enlaces.
// Salida: ../material/<SA_DECK_NAME o space-analytics-demo.pptx>
const fs = require('fs');
const path = require('path');
const pptxgen = require('pptxgenjs');

const APPLY_THEME = process.env.PPTX_APPLY_THEME
  ?? path.join(process.env.USERPROFILE ?? '', '.claude/skills/synced/2d962e80-4152-46e8-b6f8-07b560f6f27a_a5fca594-eaca-4453-a869-5be7da194caa/pptx/scripts/apply_theme.js');
const M = path.resolve(__dirname, '../material');
const SL = path.join(M, 'deck', 'slides');
const OUT = path.join(M, process.env.SA_DECK_NAME ?? 'space-analytics-demo.pptx'); // otro nombre si el anterior está abierto en PowerPoint
const MEDIA = (f) => ['clips', 'revit'].map((d) => path.join(M, d, f)).find((p) => fs.existsSync(p));

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
const W = 13.333, H = 7.5, K = W / 1920; // píxeles del HTML → pulgadas

const slides = JSON.parse(fs.readFileSync(path.join(SL, 'slides.json'), 'utf8'));
const pres = new pptxgen();
pres.layout = 'LAYOUT_WIDE';
pres.title = 'Space Analytics · demo';
pres.author = 'Computational Design LATAM';
pres.company = 'Gensler';
pres.theme = { headFontFace: THEME.headFontFace, bodyFontFace: THEME.bodyFontFace };
pres.defineSlideMaster({ title: 'HALO', background: { color: pres.SchemeColor.background2 }, objects: [] });

let seccion = null;
for (const s of slides) {
  if (s.seccion !== seccion) { pres.addSection({ title: s.seccion }); seccion = s.seccion; }
  const slide = pres.addSlide({ masterName: 'HALO', sectionTitle: s.seccion });
  slide.addImage({ path: path.join(SL, s.file), x: 0, y: 0, w: W, h: H, objectName: s.titulo || 'Diapositiva', altText: s.texto });
  for (const v of s.videos) {
    const file = MEDIA(v.file);
    if (!file) throw new Error(`No encuentro ${v.file}`);
    const poster = file.replace(/\.mp4$/, '-poster.jpg');
    slide.addMedia({ type: 'video', path: file, x: v.x * K, y: v.y * K, w: v.w * K, h: v.h * K,
      cover: `data:image/jpeg;base64,${fs.readFileSync(poster).toString('base64')}`, objectName: `Video ${v.file}` });
  }
  // enlace: caja transparente encima de la tarjeta dibujada
  for (const l of s.enlaces) {
    slide.addText('', { x: l.x * K, y: l.y * K, w: l.w * K, h: l.h * K, hyperlink: { url: l.url, tooltip: l.url }, fill: { color: 'FFFFFF', transparency: 100 }, line: { type: 'none' }, isTextBox: true, objectName: 'Enlace al repo' });
  }
  if (s.notas) slide.addNotes(s.notas);
}

(async () => {
  await pres.writeFile({ fileName: OUT });
  const { applyTheme } = require(APPLY_THEME);
  await applyTheme(OUT, THEME);
  console.log(`✓ ${OUT} (${slides.length} diapositivas)`);
})().catch((e) => { console.error(e); process.exit(1); });
