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
// el mismo modelo como llegaría sin el estándar: sin ningún parámetro SA_
const stripSA = m => { const c = JSON.parse(JSON.stringify(m)); Object.values(c.types).forEach(t => { delete t.params; }); c.rooms.forEach(r => { delete r.params; }); ['doors', 'obstacles'].forEach(k => c[k].forEach(e => { delete e.params; })); return c; };
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
  const demo = PX.score(run(stripSA(sample('racadvancedsampleproject.js', 'SA_DEMO'))).sp, {});
  assert.strictEqual(demo.m.p90E.s, null); assert.strictEqual(demo.m.aband.s, null); assert.strictEqual(demo.th.espera.all, null);
  assert.strictEqual(demo.m.efic.s, null); assert.strictEqual(demo.th.efic.all, null); assert.strictEqual(demo.sus, null); // sin servicios no hay área necesaria que comparar
  assert.ok(demo.cov.exp < 5, `cubre ${demo.cov.exp} de 5`);
  const { sp } = run(sample('sucursal.js', 'SA_SAMPLE')), full = PX.score(sp, {}), none = PX.score(sp, { counts: Object.assign({}, sp.counts, { atm: 0 }) });
  assert.deepStrictEqual(full.cov, { exp: 5, sus: 3 });
  assert.strictEqual(none.m.p90E.s, 0);
});

// --- identificación por parámetros SA_ (docs/parametros-sa.md) ---
const BYNAME = { 'ATM 24 h': 'ATM', 'Estación de cajero': 'Caja', 'Mesa de asesoría': 'Asesoria', 'Escritorio asesor': 'Asesor', 'Módulo de bienvenida': 'Host' };
const ZBYNAME = [[/atm|autoservicio/i, 'Autoservicio'], [/fila|espera/i, 'Espera'], [/asesor|lounge/i, 'Asesoria'], [/b[oó]veda/i, 'Boveda'], [/back office|cajas$/i, 'Personal']];
// el mismo modelo con los nombres de familia y de room cambiados y la identidad solo en los parámetros
const renamed = () => {
  const m = JSON.parse(JSON.stringify(sample('sucursal.js', 'SA_SAMPLE')));
  Object.values(m.types).forEach((t, i) => { const sv = BYNAME[t.family]; if (!sv) return; t.params = Object.assign({}, t.params, { SA_Servicio: sv }); t.family = 'Familia ' + (i + 100); t.name = 'T' + i; });
  m.rooms.forEach((rm, i) => { const z = ZBYNAME.find(([re]) => re.test(rm.name)); rm.params = Object.assign({}, rm.params, z ? { SA_Zona: z[1] } : { SA_Zona: 'Cliente' }); rm.name = 'Sala ' + (i + 1); });
  return m;
};

test('con los nombres cambiados, SA_Servicio y SA_Zona dan los mismos puntajes que los nombres originales', () => {
  const a = run(sample('sucursal.js', 'SA_SAMPLE')), b = run(renamed());
  assert.deepStrictEqual(b.sp.counts, a.sp.counts);
  assert.ok(b.sp.via.param > 0 && b.sp.via.nombre === 0, JSON.stringify(b.sp.via));
  const X = PX.score(a.sp, {}), Y = PX.score(b.sp, {});
  // el carbono queda fuera: su línea base genérica sale del nombre de familia salvo que traiga SA_GWP_Base (prueba siguiente)
  ['orient', 'espera', 'priv', 'seg', 'amb', 'circ', 'efic'].forEach(k => assert.ok(Math.abs(X.th[k].all - Y.th[k].all) < 1e-9, `${k}: ${X.th[k].all} vs ${Y.th[k].all}`));
});

test('si el elemento trae SA_Servicio, el nombre de su familia ya no cuenta', () => {
  const m = JSON.parse(JSON.stringify(sample('sucursal.js', 'SA_SAMPLE')));
  Object.values(m.types).forEach(t => { if (t.family === 'ATM 24 h') t.params = Object.assign({}, t.params, { SA_Servicio: 'Ninguno' }); });
  assert.strictEqual(run(m).sp.counts.atm, 0);
});

test('SA_GWP_Base reemplaza la tabla genérica por nombre de familia', () => {
  const m = renamed(); Object.values(m.types).forEach(t => { if (t.params && t.params.SA_GWP != null) t.params.SA_GWP_Base = t.params.SA_GWP * 2; });
  const X = PX.score(run(m).sp, {});
  assert.ok(Math.abs(X.m.carb.v - 50) < 0.5, `reducción ${X.m.carb.v}`);
});

test('las muestras de Autodesk etiquetadas con el estándar: todo se identifica por parámetro y al menos un nivel cubre los 8 temas', () => {
  [['racadvancedsampleproject.js', 'SA_DEMO'], ['racbasicsampleproject.js', 'SA_BASIC']].forEach(([f, k]) => {
    const m = sample(f, k); let best = 0, bestSus = 0;
    E.levelsOf(m).forEach(l => {
      const r = E.analyze(m, l.id, { cell: 0.5 }); if (!r.sel.rooms.length) return;
      const sp = PX.spatial(r, E), X = PX.score(sp, {});
      assert.strictEqual(sp.via.nombre, 0, `${f} · ${l.name}: ${JSON.stringify(sp.via)}`);   // nada se identificó por nombre
      assert.ok(inRange(X.exp) && inRange(X.sus));
      best = Math.max(best, X.cov.exp); bestSus = Math.max(bestSus, X.cov.sus);
    });
    assert.strictEqual(best, 5, `${f}: el mejor nivel cubre ${best} de 5 temas de Experiencia`); assert.strictEqual(bestSus, 3);
  });
});

test('la misma muestra sin el estándar cae al nombre de familia y de room, y sigue sin inventar servicios', () => {
  const { sp } = run(stripSA(sample('racadvancedsampleproject.js', 'SA_DEMO')));
  assert.ok(sp.via.param === 0 && sp.counts.atm === 0 && sp.counts.caja === 0 && sp.counts.ases === 0, JSON.stringify([sp.via, sp.counts]));
});
