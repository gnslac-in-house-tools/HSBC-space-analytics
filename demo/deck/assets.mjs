// Imágenes de la presentación: halos de la identidad (PNG transparente) y capturas limpias de la app con el modelo real.
// La app es el HTML portátil del repo del video (app + racadvancedsampleproject embebido). Salida: ../material/deck/
import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';
import { resolve } from 'node:path';

const OUT = resolve(import.meta.dirname, '../material/deck');
const APP = process.env.SA_APP ?? 'file:///C:/dev/HSBC-Space-Analytics-Demo-Video/app-snapshot/index.html';
mkdirSync(OUT, { recursive: true });

// Paleta Halo (halo.css): mantequilla, durazno, coral, rosa, lila, cielo, cobalto, menta
const H = { man: '#F1E17C', dur: '#F8A082', cor: '#F27751', ros: '#EE8FB4', lil: '#B7A6EE', cie: '#85BBEF', cob: '#3F6FE0', men: '#7FD6C2' };
const ORBS = {
  calido: [H.cor, H.ros, H.lil, H.dur, 200],
  aurora: [H.dur, H.cor, H.ros, H.lil, 120],
  frio: [H.cie, H.cob, H.lil, H.men, 240],
  menta: [H.men, H.cie, H.man, H.dur, 60],
  lila: [H.lil, H.ros, H.cie, H.lil, 300],
};

const orbHtml = ([o1, o2, o3, o4, from]) => `<!doctype html><html><body style="margin:0;background:transparent">
<div style="position:relative;width:1000px;height:1000px;margin:100px">
  <div style="position:absolute;inset:0;border-radius:50%;background:conic-gradient(from ${from}deg,${o1},${o2},${o3},${o4},${o1});filter:blur(46px)"></div>
  <div style="position:absolute;inset:6%;border-radius:50%;background:radial-gradient(circle at 34% 30%,rgba(255,255,255,.78),rgba(255,255,255,0) 46%);filter:blur(10px)"></div>
</div></body></html>`;

const browser = await chromium.launch({ channel: 'msedge' });
try {
  const orb = await browser.newPage({ viewport: { width: 1200, height: 1200 }, deviceScaleFactor: 0.5 }); // difuminados: 600 px bastan
  for (const [name, spec] of Object.entries(ORBS)) {
    await orb.setContent(orbHtml(spec));
    await orb.screenshot({ path: `${OUT}/orbe-${name}.png`, omitBackground: true });
  }

  const ready = (p) => p.waitForFunction(() => /índice/.test(document.getElementById('prio-ix')?.textContent ?? ''), null, { timeout: 60_000 });
  const clean = (p) => p.evaluate(() => document.querySelectorAll('.toast').forEach((t) => t.remove()));

  const app = await browser.newPage({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 1.5 });
  await app.goto(APP); await ready(app); await clean(app); await app.waitForTimeout(800);
  await app.screenshot({ path: `${OUT}/app-inicio.jpg`, type: 'jpeg', quality: 90 });
  await app.locator('#pboard button.row', { hasText: 'Flujo' }).click(); await app.waitForTimeout(1500);
  await app.screenshot({ path: `${OUT}/app-flujo.jpg`, type: 'jpeg', quality: 90 });
  await app.getByRole('button', { name: 'Dividida', exact: true }).click(); await app.waitForTimeout(3500);
  await app.screenshot({ path: `${OUT}/app-dividida.jpg`, type: 'jpeg', quality: 90 });

  const pres = await browser.newPage({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 1.5 });
  await pres.goto(`${APP}#present=1`); await ready(pres); await clean(pres); await pres.waitForTimeout(2500);
  for (let i = 1; i <= 5; i++) {
    await pres.screenshot({ path: `${OUT}/presentar-${i}.jpg`, type: 'jpeg', quality: 90 });
    await pres.keyboard.press('ArrowRight'); await pres.waitForTimeout(1500);
  }

  const dg = await browser.newPage({ viewport: { width: 424, height: 860 }, deviceScaleFactor: 2 });
  await dg.goto(`${APP}#resumen=1`); await ready(dg); await clean(dg); await dg.waitForTimeout(2500);
  await dg.screenshot({ path: `${OUT}/resumen.png` });
  console.log(`✓ ${OUT}`);
} finally {
  await browser.close();
}
