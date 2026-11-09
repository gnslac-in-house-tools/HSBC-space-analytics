// Pruebas de los índices de Experiencia y Sustentabilidad (app/indices.js) sobre la sucursal de ejemplo (app/samples/sucursal.js).
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
// con el estándar a medias: sin SA_Servicio ni SA_Zona, así que el motor tiene que identificar por nombre
const sinId = m => { const c = JSON.parse(JSON.stringify(m)); Object.values(c.types).forEach(t => { if (t.params) delete t.params.SA_Servicio; }); c.rooms.forEach(r => { if (r.params) delete r.params.SA_Zona; }); return c; };
const SERVICIOS = ['ATM 24 h', 'Estación de cajero', 'Mesa de asesoría', 'Escritorio asesor', 'Módulo de bienvenida'];
// un edificio sin ATMs, cajas, asesoría ni host y sin parámetros: lo que llega de un modelo que no es una sucursal
const sinServicios = m => { const c = stripSA(m); c.obstacles = c.obstacles.filter(o => !SERVICIOS.includes((c.types[o.type] || {}).family)); return c; };
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

test('sucursal de ejemplo: índices y temas entre 0 y 100, con sus campos para el plano', () => {
  const { r, sp } = run(sample('sucursal.js', 'SA_SAMPLE')), X = PX.score(sp, {});
  assert.ok(X.exp > 0 && X.exp <= 100 && X.sus > 0 && X.sus <= 100, `exp ${X.exp} sus ${X.sus}`);
  THEMES.forEach(k => { const v = X.th[k].all; assert.ok(v != null && inRange(v), `${k}: ${v}`); assert.ok(X.fields[k] && X.fields[k].length === r.G.n, `campo ${k}`); });
  PX.TK.forEach(t => assert.ok(inRange(X.types[t]), t));
  assert.ok(Object.keys(X.m).length === PX.MET.length);
});

test('sucursal de ejemplo: hay puntos de servicio y la entrada alcanza a verlos', () => {
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

test('un modelo sin servicios ni parámetros: no truena y los temas sin datos quedan en null', () => {
  const { sp } = run(sinServicios(sample('sucursal.js', 'SA_SAMPLE'))), X = PX.score(sp, {});
  assert.ok(inRange(X.exp) && inRange(X.sus));
  THEMES.forEach(k => assert.ok(inRange(X.th[k].all), k));
  assert.ok(Array.isArray(X.finds));
});

test('una retícula más fina cambia los puntajes pero los deja dentro de 0 a 100', () => {
  const model = sample('sucursal.js', 'SA_SAMPLE');
  [0.5, 0.25].forEach(c => { const X = PX.score(run(model, c).sp, {}); THEMES.forEach(k => assert.ok(inRange(X.th[k].all), `${k} a ${c} m`)); });
});

test('un servicio que el modelo no trae queda en «Sin datos», no en 0; quitarlo a propósito sí cuenta', () => {
  const demo = PX.score(run(sinServicios(sample('sucursal.js', 'SA_SAMPLE'))).sp, {});
  assert.strictEqual(demo.m.p90E.s, null); assert.strictEqual(demo.m.aband.s, null); assert.strictEqual(demo.th.espera.all, null);
  assert.strictEqual(demo.m.efic.s, null); assert.strictEqual(demo.th.efic.all, null); assert.strictEqual(demo.sus, null); // sin servicios no hay área necesaria que comparar
  assert.ok(demo.cov.exp < 5, `cubre ${demo.cov.exp} de 5`);
  const { sp } = run(sample('sucursal.js', 'SA_SAMPLE')), full = PX.score(sp, {}), none = PX.score(sp, { counts: Object.assign({}, sp.counts, { atm: 0 }) });
  assert.deepStrictEqual(full.cov, { exp: 5, sus: 3 });
  assert.strictEqual(none.m.p90E.s, 0);
});

// --- identificación por parámetros SA_ (docs/parametros-sa.md) ---
// el mismo modelo con los nombres de familia y de room cambiados: lo que es cada cosa lo dicen solo SA_Servicio y SA_Zona
const renamed = () => {
  const m = JSON.parse(JSON.stringify(sample('sucursal.js', 'SA_SAMPLE')));
  Object.values(m.types).forEach((t, i) => { if (t.params && t.params.SA_Servicio) { t.family = 'Familia ' + (i + 100); t.name = 'T' + i; } });
  m.rooms.forEach((rm, i) => { rm.name = 'Sala ' + (i + 1); });
  return m;
};

test('con los nombres cambiados, SA_Servicio y SA_Zona dan los mismos puntajes que los nombres originales', () => {
  const a = run(sinId(sample('sucursal.js', 'SA_SAMPLE'))), b = run(renamed());   // a: por nombre; b: por parámetro
  assert.ok(a.sp.via.nombre > 0 && a.sp.via.param === 0, JSON.stringify(a.sp.via));
  assert.deepStrictEqual(b.sp.counts, a.sp.counts);
  assert.ok(b.sp.via.param > 0 && b.sp.via.nombre === 0, JSON.stringify(b.sp.via));
  const X = PX.score(a.sp, {}), Y = PX.score(b.sp, {});
  THEMES.forEach(k => assert.ok(Math.abs(X.th[k].all - Y.th[k].all) < 1e-9, `${k}: ${X.th[k].all} vs ${Y.th[k].all}`));
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

test('la sucursal de ejemplo trae el estándar completo: todo se identifica por parámetro y la planta baja cubre los 8 temas', () => {
  const m = sample('sucursal.js', 'SA_SAMPLE');
  assert.strictEqual(E.levelsOf(m).length, 2);
  E.levelsOf(m).forEach(l => {
    const r = E.analyze(m, l.id, { cell: 0.5 }), sp = PX.spatial(r, E), X = PX.score(sp, {});
    assert.strictEqual(sp.via.nombre, 0, `${l.name}: ${JSON.stringify(sp.via)}`);   // nada se identificó por nombre
    assert.ok(inRange(X.exp) && inRange(X.sus));
    if (l.name === 'Planta baja') { assert.deepStrictEqual(sp.counts, { atm: 3, caja: 4, ases: 4 }); assert.ok(sp.host); assert.deepStrictEqual(X.cov, { exp: 5, sus: 3 }); assert.ok(sp.cash > 0 && sp.cash < 20); }
  });
});

test('la escalera une los dos niveles: el mezzanine se alcanza desde el acceso de la planta baja', () => {
  const m = sample('sucursal.js', 'SA_SAMPLE');
  assert.strictEqual(m.connectors.length, 1);
  const b = E.building(m, { cell: 0.5 }), up = b.levels.find(l => l.name === 'Mezzanine');
  assert.strictEqual(b.links.length, 1);
  let best = -1, bd = 1e9; for (let c = 0; c < up.res.G.n; c++) { if (!up.res.G.free[c]) continue; const [x, y] = up.res.G.xy(c), d = Math.hypot(x - 12, y - 19); if (d < bd) { bd = d; best = c; } }   // en la Gerencia
  assert.ok(isFinite(b.dist[up.off + best]), 'la Gerencia no se alcanza');
});

test('la misma sucursal sin el estándar cae al nombre de familia y de room y encuentra los mismos servicios', () => {
  const con = run(sample('sucursal.js', 'SA_SAMPLE')).sp, sin = run(sinId(sample('sucursal.js', 'SA_SAMPLE'))).sp;
  assert.deepStrictEqual(sin.counts, con.counts);
  assert.ok(sin.via.param === 0 && sin.via.nombre > 0, JSON.stringify(sin.via));
});
