// Pruebas de los índices de Experiencia y Sustentabilidad (app/indices.js) sobre la sucursal de prueba y el modelo de muestra.
// node --test app/tests
const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const E = require('../engine.js');
const PX = require('../indices.js');

const sample = (file, key) => { const win = {}; vm.runInNewContext(fs.readFileSync(path.join(__dirname, '../samples', file), 'utf8'), { window: win, globalThis: win, self: win }); return win[key]; };
const run = (model, cell) => { const L = E.levelsOf(model)[0], r = E.analyze(model, L.id, { cell: cell || 0.5 }); return { r, sp: PX.spatial(r, E) }; };
const inRange = v => v == null || (v >= 0 && v <= 100);
const THEMES = ['orient', 'espera', 'priv', 'seg', 'amb', 'carb', 'circ', 'efic'];

test('los 8 temas existen, cada uno en una familia, con su pregunta y su color', () => {
  assert.deepStrictEqual(PX.THEMES.map(t => t.k), THEMES);
  PX.THEMES.forEach(t => { assert.ok(t.fam === 'exp' || t.fam === 'sus'); assert.ok(t.q && t.c1 && t.name); });
  assert.strictEqual(PX.THEMES.filter(t => t.fam === 'exp').length, 5);
  assert.strictEqual(PX.THEMES.filter(t => t.fam === 'sus').length, 3);
});

test('los pesos de cada tipo de cliente y de Sustentabilidad suman 1', () => {
  PX.TK.forEach(t => assert.ok(Math.abs(Object.values(PX.TW[t]).reduce((a, b) => a + b, 0) - 1) < 1e-9, t));
  assert.ok(Math.abs(Object.values(PX.SPIW).reduce((a, b) => a + b, 0) - 1) < 1e-9);
  assert.ok(Math.abs(Object.values(PX.MIX).reduce((a, b) => a + b, 0) - 1) < 1e-9);
});

test('sucursal de prueba: índices y temas entre 0 y 100, con sus campos para el plano', () => {
  const { r, sp } = run(sample('sucursal.js', 'SA_SAMPLE')), X = PX.score(sp, {});
  assert.ok(X.exp > 0 && X.exp <= 100 && X.sus > 0 && X.sus <= 100, `exp ${X.exp} sus ${X.sus}`);
  THEMES.forEach(k => { const v = X.th[k].all; assert.ok(v != null && inRange(v), `${k}: ${v}`); assert.ok(X.fields[k] && X.fields[k].length === r.G.n, `campo ${k}`); });
  PX.TK.forEach(t => assert.ok(inRange(X.types[t]), t));
  assert.ok(Object.keys(X.m).length === PX.MET.length);
});

test('sucursal de prueba: hay puntos de servicio y la entrada alcanza a verlos', () => {
  const { sp } = run(sample('sucursal.js', 'SA_SAMPLE'));
  assert.ok(sp.atms.length > 0 && sp.tells.length > 0 && sp.seats.length > 0 && sp.host);
  assert.deepStrictEqual(sp.counts, { atm: sp.atms.length, caja: sp.tells.length, ases: sp.seats.length });
});

test('más ATMs bajan la espera de Express y nunca la suben', () => {
  const { sp } = run(sample('sucursal.js', 'SA_SAMPLE'));
  const a = PX.score(sp, { counts: Object.assign({}, sp.counts, { atm: 1 }) }), b = PX.score(sp, { counts: Object.assign({}, sp.counts, { atm: 4 }) });
  assert.ok(b.q.E.p90 <= a.q.E.p90, `${b.q.E.p90} > ${a.q.E.p90}`);
  assert.ok(b.th.espera.all >= a.th.espera.all - 1e-9);
});

test('mezclar por tiempo en lugar de visitas da más peso a Asesoría', () => {
  assert.ok(PX.mixW('tiempo').A > PX.mixW('visitas').A);
  assert.ok(PX.mixW('tiempo').E < PX.mixW('visitas').E);
});

test('cada hallazgo sale de una regla fija sobre una métrica bajo 70', () => {
  const { sp } = run(sample('sucursal.js', 'SA_SAMPLE')), X = PX.score(sp, {});
  X.finds.forEach(f => { assert.ok(f.rule && f.msg && f.sug); if (f.sev !== 'info') assert.ok(X.m[f.x.id].s < 70, f.x.id); });
});

test('modelo de muestra de Autodesk (sin ATMs ni cajas): no truena y los temas sin datos quedan en null', () => {
  const { sp } = run(sample('racadvancedsampleproject.js', 'SA_DEMO')), X = PX.score(sp, {});
  assert.ok(inRange(X.exp) && inRange(X.sus));
  THEMES.forEach(k => assert.ok(inRange(X.th[k].all), k));
  assert.ok(Array.isArray(X.finds));
});

test('una retícula más fina cambia los puntajes pero los deja dentro de 0 a 100', () => {
  const model = sample('sucursal.js', 'SA_SAMPLE');
  [0.5, 0.25].forEach(c => { const X = PX.score(run(model, c).sp, {}); THEMES.forEach(k => assert.ok(inRange(X.th[k].all), `${k} a ${c} m`)); });
});

test('un servicio que el modelo no trae queda en «Sin datos», no en 0; quitarlo a propósito sí cuenta', () => {
  const demo = PX.score(run(sample('racadvancedsampleproject.js', 'SA_DEMO')).sp, {});
  assert.strictEqual(demo.m.p90E.s, null); assert.strictEqual(demo.m.aband.s, null); assert.strictEqual(demo.th.espera.all, null);
  assert.ok(demo.cov.exp < 5, `cubre ${demo.cov.exp} de 5`);
  const { sp } = run(sample('sucursal.js', 'SA_SAMPLE')), full = PX.score(sp, {}), none = PX.score(sp, { counts: Object.assign({}, sp.counts, { atm: 0 }) });
  assert.deepStrictEqual(full.cov, { exp: 5, sus: 3 });
  assert.strictEqual(none.m.p90E.s, 0);
});
