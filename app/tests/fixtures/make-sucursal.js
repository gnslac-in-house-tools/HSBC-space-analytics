// Escribe la sucursal de prueba (la de los mockups, 30 × 20 m) en la forma del contrato, en dos etapas.
// Es un fixture para probar la app sin modelo de Revit, no un generador de modelos.
// node app/tests/fixtures/make-sucursal.js
const fs = require('fs');
const path = require('path');

const U = 20; // unidades del mockup por metro; su "y" crece hacia abajo
const P = (x, y) => [+(x / U).toFixed(3), +((400 - y) / U).toFixed(3)];
const rectU = (x, y, w, h) => [P(x, y), P(x + w, y), P(x + w, y + h), P(x, y + h)];
const circleU = (x, y, r, n = 10) => Array.from({ length: n }, (_, k) => P(x + r * Math.cos(k / n * 2 * Math.PI), y + r * Math.sin(k / n * 2 * Math.PI)));

function build(stage) {
  const concept = stage === 'Concepto';
  let id = 1000;
  const nid = () => String(id++);
  const m = {
    schema: 'hsbc-space-analytics/space-model@1',
    source: { app: 'Revit', version: '2025', file: 'Sucursal de prueba.rvt', exported_at: '2026-10-29T18:00:00', exporter: 'fixture', stage, phase: 'Nueva construcción', links: [] },
    levels: [{ id: 'L0', name: 'Planta baja', elevation: 0 }, { id: 'L1', name: 'Azotea', elevation: 4.5 }],
    rooms: [], floors: [], walls: [], doors: [], windows: [], obstacles: [],
    types: {
      T_PORC: { category: 'Floors', family: 'Piso', name: 'Porcelanato alto tráfico 60 × 120', type_mark: 'F05', cost: 1150, materials: [{ name: 'Porcelanato', thickness: 0.012 }], params: { SA_GWP: 16, SA_Reciclado: 30, SA_EPD: 1, SA_VOC: 0 } },
      T_ALF: { category: 'Floors', family: 'Piso', name: 'Alfombra modular 50 × 50', type_mark: 'F06', cost: 780, materials: [{ name: 'Alfombra nylon reciclado', thickness: 0.008 }], params: { SA_GWP: 9, SA_Reciclado: 60, SA_EPD: 1, SA_VOC: 0, SA_NRC: 0.25 } },
      T_EXT: { category: 'Walls', family: 'Muro básico', name: 'Exterior concreto 300', type_mark: 'W01', cost: 3800, materials: [{ name: 'Concreto', thickness: 0.25 }, { name: 'Aplanado', thickness: 0.05 }], params: { SA_GWP: 110, SA_EPD: 0 } },
      T_INT: { category: 'Walls', family: 'Muro básico', name: 'Tablaroca 120', type_mark: 'W02', cost: 950, materials: [{ name: 'Yeso', thickness: 0.0125 }, { name: 'Bastidor', thickness: 0.095 }, { name: 'Yeso', thickness: 0.0125 }], params: { SA_GWP: 25, SA_Reciclado: 20 } },
      T_CW: { category: 'Walls', family: 'Muro cortina', name: 'Fachada vidrio claro', type_mark: 'W03', cost: 6200, materials: [], params: { SA_GWP: 95, SA_EPD: 1 } },
      T_ESM: { category: 'Walls', family: 'Muro cortina', name: 'Vidrio esmerilado 10 mm', type_mark: 'F04', cost: 4200, materials: [], params: { SA_GWP: 38, SA_Reciclado: 22, SA_EPD: 1, SA_Opaco: 1 } },
      T_PTA: { category: 'Doors', family: 'Puerta sencilla', name: '900 × 2100', type_mark: 'D01', cost: 5200, materials: [], params: {} },
      T_ENT: { category: 'Doors', family: 'Puerta automática vidrio', name: '1800 × 2400', type_mark: 'D02', cost: 98000, materials: [], params: { SA_Rol: 'Entrada', SA_GWP: 240, SA_EPD: 1 } },
      T_ATMD: { category: 'Doors', family: 'Puerta vidrio', name: '1200 × 2400', type_mark: 'D03', cost: 42000, materials: [], params: {} },
      T_BOV: { category: 'Doors', family: 'Puerta de bóveda', name: 'UL 608 clase 2', type_mark: 'F08', cost: 690000, materials: [], params: { SA_GWP: 1650, SA_Reciclado: 70, SA_EPD: 0 } },
      T_VEN: { category: 'Windows', family: 'Ventana fija', name: '1500 × 1500', type_mark: 'V01', cost: 9800, materials: [], params: { SA_GWP: 70, SA_EPD: 1 } },
      T_BAN: { category: 'Furniture', family: 'Banca lounge espera', name: '3 plazas · tapiz reciclado', type_mark: 'F01', cost: 18500, materials: [], params: { SA_GWP: 86, SA_Reciclado: 62, SA_EPD: 1, SA_VOC: 0, SA_NRC: 0.35, SA_Rol: 'Espera' } },
      T_MES: { category: 'Furniture', family: 'Mesa de asesoría', name: 'Ø 1.2 m · roble FSC', type_mark: 'F02', cost: 24800, materials: [], params: { SA_GWP: 54, SA_Reciclado: 18, SA_EPD: 1, SA_VOC: 0 } },
      T_ESC: { category: 'Furniture', family: 'Escritorio asesor', name: '1600 × 700', type_mark: 'F11', cost: 21000, materials: [], params: { SA_GWP: 120, SA_Reciclado: 35, SA_EPD: 1 } },
      T_BAR: { category: 'Furniture', family: 'Barrera blindada de cajas', name: 'Cristal nivel III · h 1.10 + vidrio', type_mark: 'F03', cost: 312000, materials: [], params: { SA_GWP: 410, SA_Reciclado: 9, SA_EPD: 0 } },
      T_CAJ: { category: 'Furniture', family: 'Estación de cajero', name: 'Módulo 1200', type_mark: 'F12', cost: 46000, materials: [], params: { SA_GWP: 160, SA_Reciclado: 20, SA_EPD: 0 } },
      T_BIEN: { category: 'Furniture', family: 'Módulo de bienvenida', name: 'Isla 1800', type_mark: 'F13', cost: 58000, materials: [], params: { SA_Rol: 'Personal', SA_GWP: 140, SA_EPD: 1 } },
      T_GUA: { category: 'Furniture', family: 'Puesto de guardia', name: 'Atril', type_mark: 'F14', cost: 12000, materials: [], params: { SA_GWP: 40 } },
      T_ATM: { category: 'Equipment', family: 'ATM 24 h', name: 'Frontal empotrado', type_mark: 'F09', cost: 265000, materials: [], params: { SA_GWP: 520, SA_Reciclado: 25, SA_EPD: 0 } },
      T_COL: { category: 'Columns', family: 'Columna concreto', name: '500 × 500', type_mark: 'C01', cost: 0, materials: [], params: {} },
      T_MAC: { category: 'Planting', family: 'Macetero', name: 'Ficus 1.6 m', type_mark: 'P01', cost: 6500, materials: [], params: { SA_GWP: 15 } }
    }
  };
  const ROOMS = [['Bóveda', 0, 0, 90, 90], ['Back office', 90, 0, 210, 120], ['Lounge Premier', 300, 0, 150, 120], ['Asesoría 1', 450, 0, 150, 110], ['Asesoría 2', 450, 110, 150, 110], ['Asesoría 3', 450, 220, 150, 90], ['Autoservicio', 450, 310, 150, 90], ['Cajas', 0, 120, 140, 170], ['ATM 24 h', 0, 290, 150, 110], ['Fila', 140, 130, 90, 160], ['Espera', 240, 150, 180, 130], ['Lobby', 150, 290, 300, 110]];
  ROOMS.forEach(([n, x, y, w, h], k) => {
    const o = rectU(x + 1.5, y + 1.5, w - 3, h - 3);
    m.rooms.push({ id: 'R' + k, level: 'L0', name: n, number: String(101 + k), area: +((w - 3) * (h - 3) / U / U).toFixed(2), outline: [o], department: '', params: {} });
  });
  m.floors.push({ id: 'FL1', level: 'L0', type: 'T_PORC', outline: [rectU(0, 0, 600, 400)], top: 0, area: 600 });
  m.floors.push({ id: 'FL2', level: 'L0', type: 'T_ALF', outline: [rectU(450, 0, 150, 310)], top: 0.01, area: 116.25 });
  const W = (type, a, b, t, o = {}) => { const w = Object.assign({ id: nid(), level: 'L0', type, path: [P(...a), P(...b)], thickness: t, z: [0, 4.2], curtain: false }, o); m.walls.push(w); return w; };
  // fachada: norte, este, oeste opacos; sur con escaparate de vidrio en el lobby
  const wN = W('T_EXT', [0, 0], [600, 0], 0.3), wE = W('T_EXT', [600, 0], [600, 400], 0.3); W('T_EXT', [0, 400], [0, 0], 0.3);
  const wS1 = W('T_EXT', [0, 400], [150, 400], 0.3), cw = W('T_CW', [150, 400], [450, 400], 0.2, { curtain: true }); W('T_EXT', [450, 400], [600, 400], 0.3);
  // interiores
  W('T_INT', [90, 0], [90, 90], 0.3); const wBov = m.walls[m.walls.length - 1];
  W('T_INT', [0, 90], [90, 90], 0.3);
  W('T_INT', [0, 120], [300, 120], 0.12); const wBO = m.walls[m.walls.length - 1];
  W('T_INT', [300, 0], [300, 120], 0.12);
  W('T_INT', [300, 120], [450, 120], 0.12); const wLo = m.walls[m.walls.length - 1];
  const esm = W(concept ? 'T_INT' : 'T_ESM', [450, 0], [450, 310], 0.12, { curtain: !concept });
  W('T_INT', [450, 110], [600, 110], 0.12); W('T_INT', [450, 220], [600, 220], 0.12); W('T_INT', [450, 310], [600, 310], 0.12);
  W('T_INT', [0, 290], [150, 290], 0.12); const wATM = W('T_INT', [150, 290], [150, 400], 0.12);
  W('T_INT', [140, 120], [140, 140], 0.12); W('T_INT', [140, 275], [140, 290], 0.12);
  if (concept) W('T_INT', [140, 140], [140, 275], 0.12, { z: [0, 2.4] });
  const autoW = W('T_INT', [450, 310], [450, 400], 0.12);
  // puertas
  const D = (type, at, hand, host, width, o = {}) => m.doors.push(Object.assign({ id: nid(), level: 'L0', type, host: host.id, at: P(...at), hand, facing: [-hand[1], hand[0]], width, height: 2.1, z: 0, from_room: null, to_room: null, params: {} }, o));
  D('T_ENT', [300, 400], [1, 0], cw, 1.8, { height: 2.4 });
  D('T_ATMD', [75, 400], [1, 0], wS1, 1.2, { height: 2.4 });
  D('T_BOV', [90, 47], [0, 1], wBov, 1.0);
  D('T_PTA', [115, 120], [1, 0], wBO, 0.9);
  D('T_PTA', [270, 120], [1, 0], wBO, 0.9);
  D('T_PTA', [375, 120], [1, 0], wLo, 1.0);
  [55, 165, 265].forEach(y => D('T_PTA', [450, y], [0, 1], esm, 0.9));
  D('T_PTA', [150, 345], [0, 1], wATM, 1.0);
  D('T_PTA', [450, 355], [0, 1], autoW, 1.6);
  // ventanas
  const V = (at, hand, host, width) => m.windows.push({ id: nid(), level: 'L0', type: 'T_VEN', host: host.id, at: P(...at), hand, facing: [-hand[1], hand[0]], width, height: 1.5, sill: 0.9, head: 2.4, z: 0.9, from_room: null, to_room: null, params: {} });
  if (!concept) { [55, 165, 265, 355].forEach(y => V([600, y], [0, 1], wE, 1.5)); }
  [340, 410].forEach(x => V([x, 0], [1, 0], wN, 1.5));
  // obstáculos
  const O = (type, category, footprint, z, o = {}) => m.obstacles.push(Object.assign({ id: nid(), level: 'L0', type, category, footprint, z, room: null, params: {} }, o));
  [[262, 178], [262, 222], [330, 178], [330, 222], [390, 200]].forEach(([x, y]) => O('T_BAN', 'Furniture', rectU(x, y, 40, 16), [0, 0.45]));
  [[525, 55], [525, 165], [525, 265]].forEach(([x, y]) => O('T_MES', 'Furniture', circleU(x, y, 16), [0, 0.75]));
  [[575, 40], [575, 150], [575, 250]].forEach(([x, y]) => O('T_ESC', 'Furniture', rectU(x, y, 14, 32), [0, 0.75]));
  if (!concept) O('T_BAR', 'Furniture', rectU(136, 140, 8, 135), [0, 1.1]);
  [[105, 160], [105, 205], [105, 250]].forEach(([x, y]) => O('T_CAJ', 'Furniture', rectU(x, y, 20, 24), [0, 0.75]));
  O('T_ATM', 'Equipment', rectU(20, 330, 16, 40), [0, 1.7]); O('T_ATM', 'Equipment', rectU(50, 330, 16, 40), [0, 1.7]);
  O('T_BIEN', 'Furniture', circleU(300, 320, 14), [0, 1.0]);
  if (!concept) O('T_GUA', 'Furniture', rectU(350, 372, 10, 10), [0, 1.1]);
  [[230, 140], [420, 140], [230, 290], [420, 290]].forEach(([x, y]) => O('T_COL', 'Columns', rectU(x - 5, y - 5, 10, 10), [0, 4.5]));
  [[180, 380], [420, 380]].forEach(([x, y]) => O('T_MAC', 'Planting', circleU(x, y, 9), [0, 1.6]));
  return m;
}

const out = path.join(__dirname);
const both = [['Concepto', 'sucursal-concepto.json'], ['Esquemático', 'sucursal-esquematico.json']].map(([stage, file]) => {
  const m = build(stage);
  fs.writeFileSync(path.join(out, file), JSON.stringify(m));
  console.log('escrito', file);
  return m;
});
// la misma sucursal para el botón "Ver sucursal de prueba" de la app (se carga con <script>, funciona desde file://)
const sample = path.join(__dirname, '..', '..', 'samples', 'sucursal.js');
fs.mkdirSync(path.dirname(sample), { recursive: true });
fs.writeFileSync(sample, '// Sucursal de prueba (app/tests/fixtures/make-sucursal.js). No es un modelo real.\nwindow.SA_SAMPLE = ' + JSON.stringify({ models: both }) + ';\n');
console.log('escrito samples/sucursal.js');
