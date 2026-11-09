// Escribe la sucursal de ejemplo que abre la app: una sucursal bancaria de unos 36 × 26 m, de huella irregular (nicho de entrada hacia la calle,
// esquina achaflanada y un muro oblicuo al fondo), en dos niveles, en la forma del contrato.
// Es la sucursal de prueba de los mockups (make-sucursal.js) ampliada: autoservicio con tres ATMs, lobby con host y guardia, fila
// frente a cuatro cajas con barrera blindada, espera, cuatro salas de asesoría, bóveda, back office y un mezzanine de personal
// con su escalera. Trae el estándar de parámetros SA_ completo (docs/parametros-sa.md): cada familia dice qué es con SA_Servicio,
// cada room con SA_Zona, y el carbono con SA_GWP y SA_GWP_Base.
// No es un modelo real: es un ejemplo para probar y mostrar la app sin un modelo de Revit.
//   node app/tests/fixtures/make-sucursal-completa.js
const fs = require('fs');
const path = require('path');

// Metros; x al este, y al norte; el sur (y = 0) es la calle y el escaparate.
const P = (x, y) => [+x.toFixed(3), +y.toFixed(3)];
const rect = (x, y, w, h) => [P(x, y), P(x + w, y), P(x + w, y + h), P(x, y + h)];
const circle = (x, y, r, n = 10) => Array.from({ length: n }, (_, k) => P(x + r * Math.cos(k / n * 2 * Math.PI), y + r * Math.sin(k / n * 2 * Math.PI)));
const H0 = 4.2; // altura de entrepiso
const areaOf = poly => Math.abs(poly.reduce((a, p, i) => { const q = poly[(i + 1) % poly.length]; return a + p[0] * q[1] - q[0] * p[1]; }, 0)) / 2;
const shrink = (poly, d) => { const c = poly.reduce((a, p) => [a[0] + p[0] / poly.length, a[1] + p[1] / poly.length], [0, 0]), w = Math.max(...poly.map(p => p[0])) - Math.min(...poly.map(p => p[0])), h = Math.max(...poly.map(p => p[1])) - Math.min(...poly.map(p => p[1])), k = 1 - d / Math.min(w, h); return poly.map(p => P(c[0] + (p[0] - c[0]) * k, c[1] + (p[1] - c[1]) * k)); };
// la huella: el nicho de la entrada (trapecio hacia la calle), la esquina sureste achaflanada y el muro oeste del fondo en diagonal
const FOOT = [[0, 0], [9, 0], [12, -2], [24, -2], [27, 0], [33, 0], [36, 3], [36, 24], [3, 24], [0, 14]];

function build() {
  let id = 1000;
  const nid = () => String(id++);
  const gwpBase = (g, k = 1.25) => +(g * k).toFixed(1);
  const m = {
    schema: 'hsbc-space-analytics/space-model@1',
    source: { app: 'Revit', version: '2027', file: 'Sucursal de ejemplo.rvt', exported_at: '2026-11-09T18:00:00', exporter: 'fixture', phase: 'Nueva construcción', links: [] },
    levels: [{ id: 'L0', name: 'Planta baja', elevation: 0 }, { id: 'L1', name: 'Mezzanine', elevation: H0 }],
    rooms: [], floors: [], walls: [], doors: [], windows: [], obstacles: [], connectors: [],
    types: {
      T_PORC: { category: 'Floors', family: 'Piso', name: 'Porcelanato alto tráfico 60 × 120', type_mark: 'F05', cost: 1150, materials: [{ name: 'Porcelanato', thickness: 0.012 }], params: { SA_GWP: 16, SA_GWP_Base: 22, SA_Reciclado: 30, SA_EPD: 1, SA_VOC: 0 } },
      T_ALF: { category: 'Floors', family: 'Piso', name: 'Alfombra modular 50 × 50', type_mark: 'F06', cost: 780, materials: [{ name: 'Alfombra nylon reciclado', thickness: 0.008 }], params: { SA_GWP: 9, SA_GWP_Base: 14, SA_Reciclado: 60, SA_EPD: 1, SA_VOC: 0, SA_NRC: 0.25 } },
      T_EXT: { category: 'Walls', family: 'Muro básico', name: 'Exterior concreto 300', type_mark: 'W01', cost: 3800, materials: [{ name: 'Concreto', thickness: 0.25 }, { name: 'Aplanado', thickness: 0.05 }], params: { SA_GWP: 110, SA_GWP_Base: 135, SA_EPD: 0 } },
      T_INT: { category: 'Walls', family: 'Muro básico', name: 'Tablaroca 120', type_mark: 'W02', cost: 950, materials: [{ name: 'Yeso', thickness: 0.0125 }, { name: 'Bastidor', thickness: 0.095 }, { name: 'Yeso', thickness: 0.0125 }], params: { SA_GWP: 25, SA_GWP_Base: 31, SA_Reciclado: 40, SA_EPD: 1, SA_VOC: 0, SA_NRC: 0.1 } },
      T_CW: { category: 'Walls', family: 'Muro cortina', name: 'Fachada vidrio claro', type_mark: 'W03', cost: 6200, materials: [], params: { SA_GWP: 95, SA_GWP_Base: 120, SA_EPD: 1 } },
      T_ESM: { category: 'Walls', family: 'Muro cortina', name: 'Vidrio esmerilado 10 mm', type_mark: 'F04', cost: 4200, materials: [], params: { SA_GWP: 38, SA_GWP_Base: 48, SA_Reciclado: 22, SA_EPD: 1, SA_Opaco: 1 } },
      T_PTA: { category: 'Doors', family: 'Puerta sencilla', name: '900 × 2100', type_mark: 'D01', cost: 5200, materials: [], params: {} },
      T_ENT: { category: 'Doors', family: 'Puerta automática vidrio', name: '1800 × 2400', type_mark: 'D02', cost: 98000, materials: [], params: { SA_Rol: 'Entrada', SA_GWP: 240, SA_GWP_Base: 300, SA_EPD: 1 } },
      T_ATMD: { category: 'Doors', family: 'Puerta vidrio', name: '1200 × 2400', type_mark: 'D03', cost: 42000, materials: [], params: {} },
      T_BOV: { category: 'Doors', family: 'Puerta de bóveda', name: 'UL 608 clase 2', type_mark: 'F08', cost: 690000, materials: [], params: { SA_GWP: 1650, SA_GWP_Base: 1800, SA_Reciclado: 70, SA_EPD: 0 } },
      T_VEN: { category: 'Windows', family: 'Ventana fija', name: '1500 × 1500', type_mark: 'V01', cost: 9800, materials: [], params: { SA_GWP: 70, SA_GWP_Base: 88, SA_EPD: 1 } },
      T_BAN: { category: 'Furniture', family: 'Banca lounge espera', name: '3 plazas · tapiz reciclado', type_mark: 'F01', cost: 18500, materials: [], params: { SA_Rol: 'Espera', SA_GWP: 86, SA_GWP_Base: 120, SA_Reciclado: 62, SA_EPD: 1, SA_VOC: 0, SA_NRC: 0.35 } },
      T_MES: { category: 'Furniture', family: 'Mesa de asesoría', name: 'Ø 1.2 m · roble FSC', type_mark: 'F02', cost: 24800, materials: [], params: { SA_Servicio: 'Asesoria', SA_GWP: 54, SA_GWP_Base: 75, SA_Reciclado: 18, SA_EPD: 1, SA_VOC: 0 } },
      T_ESC: { category: 'Furniture', family: 'Escritorio asesor', name: '1600 × 700', type_mark: 'F11', cost: 21000, materials: [], params: { SA_Servicio: 'Asesor', SA_Rol: 'Personal', SA_GWP: 120, SA_GWP_Base: 150, SA_Reciclado: 35, SA_EPD: 1 } },
      T_BLIND: { category: 'Walls', family: 'Muro cortina', name: 'Cristal blindado nivel III con ventanillas', type_mark: 'W04', cost: 9800, materials: [], params: { SA_GWP: 140, SA_GWP_Base: 175, SA_Reciclado: 9, SA_EPD: 0 } },
      T_CAJ: { category: 'Furniture', family: 'Estación de cajero', name: 'Módulo 1200', type_mark: 'F12', cost: 46000, materials: [], params: { SA_Servicio: 'Caja', SA_Rol: 'Personal', SA_GWP: 160, SA_GWP_Base: 200, SA_Reciclado: 20, SA_EPD: 0 } },
      T_BIEN: { category: 'Furniture', family: 'Módulo de bienvenida', name: 'Isla 1800', type_mark: 'F13', cost: 58000, materials: [], params: { SA_Servicio: 'Host', SA_Rol: 'Personal', SA_GWP: 140, SA_GWP_Base: 190, SA_EPD: 1 } },
      T_GUA: { category: 'Furniture', family: 'Puesto de guardia', name: 'Atril', type_mark: 'F14', cost: 12000, materials: [], params: { SA_Servicio: 'Ninguno', SA_Rol: 'Personal', SA_GWP: 40, SA_GWP_Base: 40 } },
      T_OPS: { category: 'Furniture', family: 'Escritorio de operaciones', name: '1400 × 700', type_mark: 'F15', cost: 14500, materials: [], params: { SA_Servicio: 'Ninguno', SA_Rol: 'Personal', SA_GWP: 95, SA_GWP_Base: 130, SA_Reciclado: 40, SA_EPD: 0 } },
      T_GER: { category: 'Furniture', family: 'Escritorio de gerencia', name: '1800 × 900', type_mark: 'F16', cost: 32000, materials: [], params: { SA_Servicio: 'Ninguno', SA_Rol: 'Personal', SA_GWP: 150, SA_GWP_Base: 190, SA_Reciclado: 30, SA_EPD: 1 } },
      T_CAP: { category: 'Furniture', family: 'Mesa de capacitación', name: '1800 × 600', type_mark: 'F17', cost: 9800, materials: [], params: { SA_Servicio: 'Ninguno', SA_GWP: 48, SA_GWP_Base: 70, SA_Reciclado: 25, SA_EPD: 0 } },
      T_SIL: { category: 'Furniture', family: 'Silla de espera', name: 'Polipropileno reciclado', type_mark: 'F18', cost: 2400, materials: [], params: { SA_Rol: 'Espera', SA_Servicio: 'Ninguno', SA_GWP: 14, SA_GWP_Base: 20, SA_Reciclado: 70, SA_EPD: 1, SA_VOC: 0 } },
      T_MCAF: { category: 'Furniture', family: 'Mesa de centro', name: '1200 × 600', type_mark: 'F19', cost: 4200, materials: [], params: { SA_Servicio: 'Ninguno', SA_GWP: 32, SA_GWP_Base: 45, SA_Reciclado: 20, SA_EPD: 0 } },
      T_SILA: { category: 'Furniture', family: 'Silla de asesoría', name: 'Tapizada', type_mark: 'F20', cost: 3800, materials: [], params: { SA_Servicio: 'Ninguno', SA_GWP: 22, SA_GWP_Base: 30, SA_Reciclado: 35, SA_EPD: 0 } },
      T_SILO: { category: 'Furniture', family: 'Silla operativa', name: 'Giratoria', type_mark: 'F21', cost: 5200, materials: [], params: { SA_Servicio: 'Ninguno', SA_Rol: 'Personal', SA_GWP: 40, SA_GWP_Base: 55, SA_Reciclado: 30, SA_EPD: 0 } },
      T_ATM: { category: 'Equipment', family: 'ATM 24 h', name: 'Frontal empotrado', type_mark: 'F09', cost: 265000, materials: [], params: { SA_Servicio: 'ATM', SA_GWP: 520, SA_GWP_Base: 600, SA_Reciclado: 25, SA_EPD: 0 } },
      T_COL: { category: 'Columns', family: 'Columna concreto', name: '500 × 500', type_mark: 'C01', cost: 0, materials: [], params: { SA_GWP: 210, SA_GWP_Base: 260, SA_EPD: 0 } },
      T_MAC: { category: 'Planting', family: 'Macetero', name: 'Ficus 1.6 m', type_mark: 'P01', cost: 6500, materials: [], params: { SA_GWP: 15, SA_GWP_Base: 15 } },
      T_ESCA: { category: 'Stairs', family: 'Escalera', name: 'Recta 1.2 m', type_mark: 'S01', cost: 180000, materials: [], params: { SA_GWP: 900, SA_GWP_Base: 1100, SA_Reciclado: 30, SA_EPD: 0 } }
    }
  };

  // ---------------------------------------------------------------- rooms
  const zone = {};
  const ROOMS = [
    // nivel, nombre, SA_Zona, x, y, w, h
    ['L0', 'Autoservicio', 'Autoservicio', 0, 0, 9, 9], ['L0', 'Baños', 'Cliente', 0, 9, 9, 5], ['L0', 'Escalera', 'Personal', 0, 14, 9, 10, [[0, 14], [9, 14], [9, 24], [3, 24]]],
    ['L0', 'Lobby', 'Cliente', 9, 0, 18, 9, [[9, 0], [12, -2], [24, -2], [27, 0], [27, 9], [9, 9]]], ['L0', 'Fila', 'Espera', 9, 9, 18, 5], ['L0', 'Cajas', 'Personal', 9, 14, 12, 4],
    ['L0', 'Bóveda', 'Boveda', 9, 18, 6, 6], ['L0', 'Back office', 'Personal', 15, 18, 6, 6], ['L0', 'Pasillo', 'Cliente', 21, 14, 6, 10],
    ['L0', 'Espera', 'Espera', 27, 0, 9, 9, [[27, 0], [33, 0], [36, 3], [36, 9], [27, 9]]],
    ['L0', 'Asesoría 1', 'Asesoria', 27, 9, 9, 3.75], ['L0', 'Asesoría 2', 'Asesoria', 27, 12.75, 9, 3.75], ['L0', 'Asesoría 3', 'Asesoria', 27, 16.5, 9, 3.75], ['L0', 'Asesoría 4', 'Asesoria', 27, 20.25, 9, 3.75],
    ['L1', 'Escalera (mezzanine)', 'Personal', 0, 14, 9, 10, [[0, 14], [9, 14], [9, 24], [3, 24]]], ['L1', 'Gerencia', 'Personal', 9, 14, 6, 10], ['L1', 'Sala de capacitación', 'Personal', 15, 14, 6, 10]
  ];
  const R = {};
  ROOMS.forEach(([lv, n, z, x, y, w, h, poly], k) => {
    const rid = 'R' + k; R[n] = rid;
    const o = poly ? shrink(poly.map(q => P(...q)), 0.3) : rect(x + 0.15, y + 0.15, w - 0.3, h - 0.3);
    m.rooms.push({ id: rid, level: lv, name: n, number: String((lv === 'L0' ? 100 : 200) + k + 1), area: +areaOf(o).toFixed(2), outline: [o], department: '', params: { SA_Zona: z } });
  });

  // ---------------------------------------------------------------- pisos
  m.floors.push({ id: 'FL1', level: 'L0', type: 'T_PORC', outline: [FOOT.map(q => P(...q))], top: 0, area: +areaOf(FOOT).toFixed(2) });
  { const east = [[27, 0], [33, 0], [36, 3], [36, 24], [27, 24]]; m.floors.push({ id: 'FL2', level: 'L0', type: 'T_ALF', outline: [east.map(q => P(...q))], top: 0.01, area: +areaOf(east).toFixed(2) }); }
  { const mz = [[0, 14], [21, 14], [21, 24], [3, 24]]; m.floors.push({ id: 'FL3', level: 'L1', type: 'T_ALF', outline: [mz.map(q => P(...q))], top: H0, area: +areaOf(mz).toFixed(2) }); }

  // ---------------------------------------------------------------- muros
  const W = (level, type, a, b, t, o = {}) => { const z0 = level === 'L0' ? 0 : H0, w = Object.assign({ id: nid(), level, type, path: [P(...a), P(...b)], thickness: t, z: [z0, z0 + H0], curtain: false }, o); m.walls.push(w); return w; };
  // planta baja: fachada con escaparate de vidrio al sur
  const wSW = W('L0', 'T_EXT', [0, 0], [9, 0], 0.3);
  W('L0', 'T_CW', [9, 0], [12, -2], 0.2, { curtain: true });                                       // el nicho de la entrada: costados oblicuos de vidrio
  const cw = W('L0', 'T_CW', [12, -2], [24, -2], 0.2, { curtain: true });                           // y frente de vidrio con la puerta
  W('L0', 'T_CW', [24, -2], [27, 0], 0.2, { curtain: true }); W('L0', 'T_CW', [27, 0], [33, 0], 0.2, { curtain: true });
  W('L0', 'T_CW', [33, 0], [36, 3], 0.2, { curtain: true });                                       // esquina sureste achaflanada, de vidrio
  const wE = W('L0', 'T_EXT', [36, 3], [36, 24], 0.3); const wN = W('L0', 'T_EXT', [36, 24], [3, 24], 0.3);
  W('L0', 'T_EXT', [3, 24], [0, 14], 0.3); W('L0', 'T_EXT', [0, 14], [0, 0], 0.3);                // muro oeste del fondo, oblicuo
  // interiores
  const x9 = W('L0', 'T_INT', [9, 0], [9, 24], 0.12), x27 = W('L0', 'T_INT', [27, 0], [27, 24], 0.12), x21 = W('L0', 'T_INT', [21, 14], [21, 24], 0.12);
  W('L0', 'T_INT', [0, 9], [9, 9], 0.12); W('L0', 'T_INT', [0, 14], [9, 14], 0.12);
  const y18 = W('L0', 'T_INT', [9, 18], [21, 18], 0.12); W('L0', 'T_INT', [15, 18], [15, 24], 0.12);
  W('L0', 'T_INT', [27, 9], [36, 9], 0.12); [12.75, 16.5, 20.25].forEach(y => W('L0', 'T_INT', [27, y], [36, y], 0.12));
  // el muro de ventanillas: cristal blindado entre la fila (y la espera) y las cajas; se ve a través, no se pasa
  W('L0', 'T_BLIND', [9, 14], [21, 14], 0.1, { curtain: true });
  // mezzanine
  const m9 = W('L1', 'T_INT', [9, 14], [9, 24], 0.12), m15 = W('L1', 'T_INT', [15, 14], [15, 24], 0.12);
  W('L1', 'T_EXT', [0, 14], [21, 14], 0.3); W('L1', 'T_EXT', [21, 14], [21, 24], 0.3); W('L1', 'T_EXT', [21, 24], [3, 24], 0.3); W('L1', 'T_EXT', [3, 24], [0, 14], 0.3);

  // ---------------------------------------------------------------- puertas y ventanas
  const room = n => R[n] || null;
  const D = (level, type, at, hand, host, width, from, to, o = {}) => m.doors.push(Object.assign({ id: nid(), level, type, host: host.id, at: P(...at), hand, facing: [-hand[1], hand[0]], width, height: 2.1, z: level === 'L0' ? 0 : H0, from_room: room(from), to_room: room(to), params: {} }, o));
  D('L0', 'T_ENT', [18, -2], [1, 0], cw, 1.8, null, 'Lobby', { height: 2.4 });
  D('L0', 'T_ATMD', [4.5, 0], [1, 0], wSW, 1.2, null, 'Autoservicio', { height: 2.4 });
  D('L0', 'T_PTA', [9, 4.5], [0, 1], x9, 1.6, 'Autoservicio', 'Lobby');
  D('L0', 'T_PTA', [9, 11.5], [0, 1], x9, 0.9, 'Fila', 'Baños');
  D('L0', 'T_PTA', [9, 16], [0, 1], x9, 0.9, 'Cajas', 'Escalera');
  D('L0', 'T_BOV', [12, 18], [1, 0], y18, 1.0, 'Cajas', 'Bóveda');
  D('L0', 'T_PTA', [18, 18], [1, 0], y18, 0.9, 'Cajas', 'Back office');
  D('L0', 'T_PTA', [21, 20.5], [0, 1], x21, 0.9, 'Back office', 'Pasillo');
  D('L0', 'T_PTA', [27, 4.5], [0, 1], x27, 2.0, 'Lobby', 'Espera');
  [['Fila', 'Asesoría 1', 10.9], ['Pasillo', 'Asesoría 2', 14.6], ['Pasillo', 'Asesoría 3', 18.4], ['Pasillo', 'Asesoría 4', 22.1]].forEach(([a, b, y]) => D('L0', 'T_PTA', [27, y], [0, 1], x27, 0.9, a, b));
  D('L1', 'T_PTA', [9, 19], [0, 1], m9, 0.9, 'Escalera (mezzanine)', 'Gerencia');
  D('L1', 'T_PTA', [15, 19], [0, 1], m15, 0.9, 'Gerencia', 'Sala de capacitación');
  const V = (host, at, hand, width) => m.windows.push({ id: nid(), level: 'L0', type: 'T_VEN', host: host.id, at: P(...at), hand, facing: [-hand[1], hand[0]], width, height: 1.5, sill: 0.9, head: 2.4, z: 0.9, from_room: null, to_room: null, params: {} });
  [4.5, 7.5, 10.9, 14.6, 18.4, 22.1].forEach(y => V(wE, [36, y], [0, 1], 1.5));
  [18].forEach(x => V(wN, [x, 24], [1, 0], 1.5));

  // ---------------------------------------------------------------- mobiliario y equipo
  const O = (level, type, category, footprint, z, o = {}) => m.obstacles.push(Object.assign({ id: nid(), level, type, category, footprint, z, room: null, params: {} }, o));
  [2.2, 4.4, 6.6].forEach(y => O('L0', 'T_ATM', 'Equipment', rect(0.4, y - 0.4, 0.8, 0.9), [0, 1.7]));                    // tres ATMs contra el muro oeste del autoservicio
  O('L0', 'T_BIEN', 'Furniture', circle(18, 5, 0.9), [0, 1.0]);                                                              // host al centro del lobby
  O('L0', 'T_GUA', 'Furniture', rect(23, 1.6, 0.5, 0.5), [0, 1.1]);                                                         // guardia junto a la entrada
  [10.5, 13.3, 16.1, 18.9].forEach(x => O('L0', 'T_CAJ', 'Furniture', rect(x, 14.8, 1.2, 1.2), [0, 0.75]));               // cuatro cajas
  // sala de espera: sillas individuales en filas frente a frente con mesa de centro, y dos bancas contra el muro norte
  [28.3, 29.0, 29.7, 30.4, 31.1].forEach(x => { O('L0', 'T_SIL', 'Furniture', rect(x, 1.6, 0.5, 0.5), [0, 0.9]); O('L0', 'T_SIL', 'Furniture', rect(x, 4.7, 0.5, 0.5), [0, 0.9]); });
  [33.0, 33.7].forEach(x => O('L0', 'T_SIL', 'Furniture', rect(x, 1.6, 0.5, 0.5), [0, 0.9])); [33.0, 33.7, 34.4].forEach(x => O('L0', 'T_SIL', 'Furniture', rect(x, 4.7, 0.5, 0.5), [0, 0.9]));
  O('L0', 'T_MCAF', 'Furniture', rect(28.4, 2.9, 1.2, 0.6), [0, 0.45]); O('L0', 'T_MCAF', 'Furniture', rect(33.2, 2.9, 1.2, 0.6), [0, 0.45]);
  [28, 31].forEach(x => O('L0', 'T_BAN', 'Furniture', rect(x, 8.0, 2, 0.8), [0, 0.45]));
  [[9, 12.75], [12.75, 16.5], [16.5, 20.25], [20.25, 24]].forEach(([y0, y1]) => {                                              // cuatro salas de asesoría
    const cy = (y0 + y1) / 2; O('L0', 'T_MES', 'Furniture', circle(30.2, cy, 0.6), [0, 0.75]); O('L0', 'T_ESC', 'Furniture', rect(33.6, cy - 0.8, 0.7, 1.6), [0, 0.75]);
    [cy - 1.05, cy + 0.6].forEach(y => O('L0', 'T_SILA', 'Furniture', rect(29.95, y, 0.45, 0.45), [0, 0.9]));   // sillas del cliente, a los lados de la mesa
    O('L0', 'T_SILO', 'Furniture', rect(34.5, cy - 0.25, 0.5, 0.5), [0, 0.9]);                                    // silla del asesor, tras su escritorio
  });
  [[15.8, 19.2], [15.8, 21.4], [18.3, 19.2], [18.3, 21.4]].forEach(([x, y]) => O('L0', 'T_OPS', 'Furniture', rect(x, y, 1.4, 0.7), [0, 0.75])); // back office
  [[15.8, 19.2], [15.8, 21.4], [18.3, 19.2], [18.3, 21.4]].forEach(([x, y]) => O('L0', 'T_SILO', 'Furniture', rect(x + 0.45, y - 0.55, 0.5, 0.5), [0, 0.9])); // sillas del back office
  [[12, 7], [24, 7], [12, 12], [24, 12]].forEach(([x, y]) => O('L0', 'T_COL', 'Columns', rect(x - 0.25, y - 0.25, 0.5, 0.5), [0, H0]));
  [[10.5, 1.2], [25.5, 1.2], [28, 8], [1.5, 12], [13.5, -0.9], [22.5, -0.9]].forEach(([x, y]) => O('L0', 'T_MAC', 'Planting', circle(x, y, 0.45), [0, 1.6]));
  O('L1', 'T_GER', 'Furniture', rect(11, 21, 1.8, 0.9), [H0, H0 + 0.75]);
  [17, 19, 21].forEach(y => { O('L1', 'T_CAP', 'Furniture', rect(16, y, 4.2, 0.6), [H0, H0 + 0.75]); [16.4, 17.6, 18.8].forEach(x => O('L1', 'T_SILO', 'Furniture', rect(x, y - 0.6, 0.5, 0.5), [H0, H0 + 0.9])); });
  O('L1', 'T_SILO', 'Furniture', rect(11.6, 20.1, 0.5, 0.5), [H0, H0 + 0.9]);

  // ---------------------------------------------------------------- escalera entre niveles
  m.connectors.push({ id: nid(), kind: 'stair', type: 'T_ESCA', footprint: rect(4.5, 15.5, 1.2, 7), z: [0, H0], levels: ['L0', 'L1'], params: {} });
  return m;
}

const m = build();
const sample = path.join(__dirname, '..', '..', 'samples', 'sucursal.js');
fs.mkdirSync(path.dirname(sample), { recursive: true });
fs.writeFileSync(sample, '// Sucursal de ejemplo (app/tests/fixtures/make-sucursal-completa.js): 36 × 24 m en dos niveles, con el estándar de parámetros SA_\n// (docs/parametros-sa.md). No es un modelo real: sirve para probar y mostrar la app sin un modelo de Revit.\nwindow.SA_SAMPLE = ' + JSON.stringify(m) + ';\n');
console.log('escrito samples/sucursal.js', m.rooms.length, 'rooms,', m.obstacles.length, 'obstáculos,', m.doors.length, 'puertas');
