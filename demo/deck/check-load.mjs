// Captura la app mientras analiza (para revisar la pantalla de carga). Uso: node check-load.mjs [url] [carpeta]
import { chromium } from 'playwright';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const url = process.argv[2] || pathToFileURL(resolve(import.meta.dirname, '../../app/index.html')).href;
const out = process.argv[3] || '.';
const b = await chromium.launch({ channel: 'msedge' });
try {
  const p = await b.newPage({ viewport: { width: 1600, height: 900 } });
  await p.goto(url);
  for (let i = 0; i < 6; i++) {
    await p.waitForTimeout(i ? 350 : 120);
    await p.screenshot({ path: `${out}/carga-${i}.png` });
  }
  // elementos oscuros, altos y angostos que cruzan la pantalla
  const sospechosos = await p.evaluate(() => [...document.querySelectorAll('body *')].map((e) => {
    const r = e.getBoundingClientRect(), cs = getComputedStyle(e);
    return { tag: e.tagName, id: e.id, cls: e.className?.baseVal ?? e.className, x: Math.round(r.x), w: Math.round(r.width), h: Math.round(r.height), bg: cs.backgroundColor, z: cs.zIndex, pos: cs.position };
  }).filter((o) => o.h > 500 && o.w > 0 && o.w < 12));
  console.log(JSON.stringify(sospechosos, null, 1));
} finally {
  await b.close();
}
