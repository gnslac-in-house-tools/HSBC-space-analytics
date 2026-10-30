// Pruebas del motor con modelos mínimos escritos a mano en la forma del contrato (docs/space-model.md).
// node --test app/tests
const test = require('node:test');
const assert = require('node:assert');
const E = require('../engine.js');

const rect = (x0, y0, x1, y1) => [[x0, y0], [x1, y0], [x1, y1], [x0, y1]];
let nid = 1;
const wall = (a, b, o) => Object.assign({ id: 'w' + nid++, level: 'L0', type: 'tw', path: [a, b], thickness: 0.2, z: [0, 3], curtain: false }, o);
const door = (at, hand, o) => Object.assign({ id: 'd' + nid++, level: 'L0', type: 'td', at, hand, facing: [-hand[1], hand[0]], width: 0.9, height: 2.1, z: 0 }, o);

/** Una caja de 12 × 6 m partida por un muro en x = 6: oeste (bóveda) y este (lobby, con la entrada al sur). */
function box(opts) {
  opts = opts || {};
  const m = {
    schema: 'hsbc-space-analytics/space-model@1',
    source: { stage: 'Esquemático', file: 'prueba.rvt' },
    levels: [{ id: 'L0', name: 'Planta baja', elevation: 0 }],
    rooms: [
      { id: 'r1', level: 'L0', name: 'Bóveda', number: '1', area: 36, outline: [rect(0.1, 0.1, 5.9, 5.9)] },
      { id: 'r2', level: 'L0', name: 'Lobby', number: '2', area: 36, outline: [rect(6.1, 0.1, 11.9, 5.9)] }
    ],
    floors: opts.noFloors ? [] : [{ id: 'f1', level: 'L0', type: 'tf', outline: [rect(0, 0, 12, 6)], top: 0, area: 72 }],
    walls: [
      wall([0, 0], [12, 0]), wall([12, 0], [12, 6]), wall([12, 6], [0, 6]), wall([0, 6], [0, 0]),
      wall([6, 0], [6, 6], { id: 'wmid' })
    ],
    doors: [door([9, 0], [1, 0], { id: 'dent', host: 'w1' })],
    windows: [],
    obstacles: [],
    types: {
      tw: { category: 'Walls', family: 'Muro básico', name: 'Genérico 200', params: {} },
      td: { category: 'Doors', family: 'Puerta', name: '900', params: {} },
      tf: { category: 'Floors', family: 'Piso', name: 'Porcelanato', type_mark: 'P01', params: {} },
      tc: { category: 'Furniture', family: 'Mostrador cajas', name: '2400', params: {} },
      tb: { category: 'Furniture', family: 'Banca', name: '1800', params: {} },
      tm: { category: 'Furniture', family: 'Mampara', name: '1800 alto', params: {} }
    }
  };
  m.walls[0].id = 'w1';
  if (!opts.noInnerDoor) m.doors.push(door([6, 3], [0, 1], { id: 'dmid', host: 'wmid' }));
  return m;
}
const cellAt = (r, x, y) => { const G = r.G; return Math.floor((y - G.oy) / G.cell) * G.nx + Math.floor((x - G.ox) / G.cell); };

test('rechaza lo que no es un space-model y normaliza lo que falta', () => {
  const { models, warnings } = E.load([{ schema: 'otra-cosa' }, { schema: 'hsbc-space-analytics/space-model@1', levels: [] }]);
  assert.strictEqual(models.length, 1);
  assert.strictEqual(warnings.length, 1);
  assert.deepStrictEqual(models[0].rooms, []);
  assert.strictEqual(models[0].source.stage, 'Esquemático');
});

test('los muros separan y la puerta conecta', () => {
  const r = E.analyze(box(), 'L0');
  const west = cellAt(r, 3, 3), east = cellAt(r, 9, 3), inWall = cellAt(r, 6, 1.2);
  assert.ok(isFinite(r.G.dEnt[east]), 'el lobby se alcanza');
  assert.ok(isFinite(r.G.dEnt[west]), 'la bóveda se alcanza por la puerta interior');
  assert.ok(r.G.dEnt[west] > r.G.dEnt[east]);
  assert.strictEqual(r.G.free[inWall], 0, 'el muro tapa');
  assert.strictEqual(r.G.unreach, 0);
});

test('sin la puerta interior la bóveda queda inaccesible y lo avisa', () => {
  const r = E.analyze(box({ noInnerDoor: true }), 'L0');
  assert.ok(!isFinite(r.G.dEnt[cellAt(r, 3, 3)]));
  assert.ok(r.G.unreach * r.G.cell * r.G.cell > 20);
  assert.ok(r.warnings.some(w => /no se alcanzan/.test(w)));
});

test('sin pisos usa los rooms y las puertas siguen conectando', () => {
  const r = E.analyze(box({ noFloors: true }), 'L0');
  assert.ok(isFinite(r.G.dEnt[cellAt(r, 3, 3)]));
  assert.ok(r.warnings.some(w => /no tiene pisos/.test(w)));
});

test('la ventana da vista al exterior y el muro ciego no', () => {
  const blind = E.analyze(box(), 'L0');
  assert.strictEqual(blind.G.ext[cellAt(blind, 9, 4)], 0);
  const m = box();
  m.windows.push({ id: 'win', level: 'L0', type: 'tw', host: 'w3', at: [9, 6], hand: [-1, 0], facing: [0, 1], width: 2.4, sill: 0.9, head: 2.4, z: 0.9 });
  const r = E.analyze(m, 'L0');
  assert.ok(r.G.ext[cellAt(r, 9, 4)] > 0.05, 'frente a la ventana se ve afuera');
  assert.strictEqual(r.G.ext[cellAt(r, 3, 3)], 0, 'del otro lado del muro no');
  const high = box();
  high.windows.push({ id: 'win', level: 'L0', type: 'tw', host: 'w3', at: [9, 6], hand: [-1, 0], facing: [0, 1], width: 2.4, sill: 1.6, head: 2.4, z: 1.6 });
  assert.strictEqual(E.analyze(high, 'L0').G.ext[cellAt(r, 9, 4)], 0, 'una ventana alta no cuenta a 1.20 m');
});

test('el muro cortina deja ver y no deja pasar', () => {
  const m = box();
  m.walls[4].curtain = true;
  m.doors = m.doors.filter(d => d.id !== 'dmid');
  const r = E.analyze(m, 'L0');
  assert.ok(!isFinite(r.G.dEnt[cellAt(r, 3, 3)]), 'no se cruza');
  const solid = E.analyze(box({ noInnerDoor: true }), 'L0');
  assert.ok(r.G.iso[cellAt(r, 9, 3)] > solid.G.iso[cellAt(solid, 9, 3)] + 20, 'se ve a través');
});

test('un muro en diagonal no deja escapar la vista', () => {
  const m = box({ noInnerDoor: true });
  m.walls[4] = wall([3, 0], [9, 6], { id: 'wmid' });
  m.doors = [m.doors[0]];
  const r = E.analyze(m, 'L0');
  const G = r.G;
  let leaks = 0;
  for (let k = 0; k < 720; k++) {
    const a = k / 720 * 2 * Math.PI, h = E.castRay(G, 9.25, 1.25, Math.cos(a), Math.sin(a), 30, c => {
      const [x, y] = G.xy(c); if (y - x > -3 + 0.5) leaks++; // el muro es y = x − 3
    });
    void h;
  }
  assert.strictEqual(leaks, 0);
});

test('mueble bajo: tapa el paso y no la vista; mueble alto: tapa los dos', () => {
  const low = box();
  low.obstacles.push({ id: 'o1', level: 'L0', type: 'tb', category: 'Furniture', footprint: rect(8, 2, 10, 4), z: [0, 0.45] });
  const r1 = E.analyze(low, 'L0'), c1 = cellAt(r1, 9, 3);
  assert.strictEqual(r1.G.free[c1], 0);
  assert.strictEqual(r1.G.sight[c1], E.OPEN);
  const high = box();
  high.obstacles.push({ id: 'o2', level: 'L0', type: 'tm', category: 'Furniture', footprint: rect(8, 2, 10, 4), z: [0, 1.8] });
  const r2 = E.analyze(high, 'L0');
  assert.strictEqual(r2.G.sight[cellAt(r2, 9, 3)], E.OPAQUE);
});

test('un mueble más chico que la celda igual cuenta', () => {
  const m = box();
  m.obstacles.push({ id: 'o3', level: 'L0', type: 'tb', category: 'Columns', footprint: rect(9.05, 3.05, 9.2, 3.2), z: [0, 3] });
  const r = E.analyze(m, 'L0');
  assert.strictEqual(r.G.free[cellAt(r, 9.1, 3.1)], 0);
});

test('vigilancia desde la caja, ruta de efectivo y puntos ciegos', () => {
  const m = box();
  m.obstacles.push({ id: 'cj', level: 'L0', type: 'tc', category: 'Furniture', footprint: rect(10, 4.5, 11.5, 5.2), z: [0, 1.05] });
  const r = E.analyze(m, 'L0');
  assert.strictEqual(r.G.staff.length, 1);
  assert.ok(r.G.seen[cellAt(r, 8, 2)] > 0, 'la caja ve el lobby');
  assert.strictEqual(r.G.seen[cellAt(r, 2, 2)], 0, 'no ve detrás del muro');
  assert.ok(r.G.paths.cash && r.G.paths.cash.length > 4, 'hay ruta bóveda → caja');
  const blind = r.metrics.seg.find(x => x[0] === 'Puntos ciegos')[1];
  assert.ok(blind > 20);
});

test('sin puestos de personal vigila desde el acceso y lo dice', () => {
  const r = E.analyze(box(), 'L0');
  assert.ok(r.G.watch.length >= 1 && r.G.watch[0].kind === 'entrance');
  assert.ok(r.warnings.some(w => /Sin puestos de personal/.test(w)));
});

test('sustentabilidad: sin SA_ no hay puntaje; con la tabla de Excel por Type Mark sí', () => {
  const m = box();
  const r0 = E.analyze(m, 'L0');
  assert.strictEqual(r0.scores.sust, null);
  const j = E.applyTable(m, [{ 'Type Mark': 'p01', GWP: '20', Reciclado: '40', EPD: 1 }, { 'Type Mark': 'X9', GWP: 1 }]);
  assert.deepStrictEqual(j, { hit: 1, miss: 1 });
  assert.strictEqual(m.types.tf.params.SA_GWP, 20);
  const r1 = E.analyze(m, 'L0');
  assert.ok(r1.scores.sust > 50 && r1.scores.sust < 100);
  assert.ok(!isNaN(r1.fields.sust[cellAt(r1, 9, 3)]));
});

test('puntajes de 0 a 100 por pilar y por room', () => {
  const r = E.analyze(box(), 'L0');
  ['flujo', 'visib', 'seg', 'conf'].forEach(k => assert.ok(r.scores[k] > 0 && r.scores[k] <= 100, k + ' ' + r.scores[k]));
  assert.strictEqual(r.rooms.length, 2);
  assert.ok(r.rooms.every(x => x.scores.flujo > 0));
});

test('un muro de doble altura corta los dos niveles', () => {
  const m = box();
  m.levels.push({ id: 'L1', name: 'Nivel 1', elevation: 4 });
  m.floors.push({ id: 'f2', level: 'L1', type: 'tf', outline: [rect(0, 0, 12, 6)], top: 4, area: 72 });
  m.walls.push(wall([3, 0], [3, 6], { id: 'tall', z: [0, 8] }));
  const r = E.analyze(m, 'L1');
  assert.strictEqual(r.G.free[cellAt(r, 3, 3)], 0, 'el muro alto aparece arriba');
  assert.strictEqual(r.G.free[cellAt(r, 6, 3)], 1, 'el muro de 3 m no');
});
