// Abre la app (archivo local o la URL publicada) y confirma que carga el modelo de muestra sin datos incrustados.
// Uso: node check-app.mjs [url] [captura.png]
import { chromium } from 'playwright';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const url = process.argv[2] || pathToFileURL(resolve(import.meta.dirname, '../../app/index.html')).href;
const shot = process.argv[3];
const b = await chromium.launch({ channel: 'msedge' });
try {
  const p = await b.newPage({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 1.5 });
  const errores = [];
  p.on('pageerror', (e) => errores.push(e.message));
  await p.goto(url);
  await p.waitForFunction(() => /índice/.test(document.getElementById('prio-ix')?.textContent ?? ''), null, { timeout: 60_000 });
  await p.evaluate(() => document.querySelectorAll('.toast').forEach((t) => t.remove()));
  await p.waitForTimeout(1500);
  const info = await p.evaluate(() => ({ titulo: document.title, rooms: window.SA?.S?.res?.rooms?.length ?? null, nivel: window.SA?.S?.res?.level?.name ?? null, url: location.href }));
  console.log(JSON.stringify({ ...info, errores }));
  if (shot) await p.screenshot({ path: shot, type: shot.endsWith('.jpg') ? 'jpeg' : 'png', ...(shot.endsWith('.jpg') ? { quality: 92 } : {}) });
} finally {
  await b.close();
}
