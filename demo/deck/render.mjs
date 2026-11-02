// Captura cada diapositiva de slides.html (1920×1080 a 1.5×) y anota dónde van los videos y enlaces nativos.
// Salida: ../material/deck/slides/sNN.jpg y slides.json (sección, notas, texto, cajas en píxeles de 1920×1080)
import { chromium } from 'playwright';
import { mkdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const OUT = resolve(import.meta.dirname, '../material/deck/slides');
mkdirSync(OUT, { recursive: true });
const browser = await chromium.launch({ channel: 'msedge' });
try {
  const page = await browser.newPage({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 1.5 });
  await page.goto(pathToFileURL(resolve(import.meta.dirname, 'slides.html')).href);
  await page.waitForFunction(() => document.documentElement.dataset.listo === '1');
  await page.evaluate(() => { document.body.classList.add('h-quieto'); return document.fonts.ready; });
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(600);
  const sections = await page.$$('section.s');
  const meta = [];
  for (const [i, s] of sections.entries()) {
    const file = `s${String(i + 1).padStart(2, '0')}.jpg`;
    await s.screenshot({ path: `${OUT}/${file}`, type: 'jpeg', quality: 92 });
    meta.push(await s.evaluate((el, file) => {
      const o = el.getBoundingClientRect();
      const box = (e) => { const r = e.getBoundingClientRect(); return { x: r.left - o.left, y: r.top - o.top, w: r.width, h: r.height }; };
      return {
        file,
        seccion: el.dataset.seccion,
        notas: el.dataset.notas ?? '',
        titulo: (el.querySelector('h1, h2')?.innerText ?? '').replace(/\s+/g, ' ').trim(),
        texto: el.innerText.replace(/\s+/g, ' ').trim().slice(0, 900),
        videos: [...el.querySelectorAll('[data-video]')].map((e) => ({ file: e.dataset.video, ...box(e) })),
        enlaces: [...el.querySelectorAll('[data-link]')].map((e) => ({ url: e.dataset.link, ...box(e) })),
      };
    }, file));
  }
  writeFileSync(`${OUT}/slides.json`, JSON.stringify(meta, null, 2));
  console.log(`✓ ${meta.length} diapositivas → ${OUT}`);
} finally {
  await browser.close();
}
