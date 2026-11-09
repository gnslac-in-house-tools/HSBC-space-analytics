/* Índices de Experiencia y Sustentabilidad: temas por familia, métricas con rango malo → bueno, tipos de cliente y hallazgos por regla.
 * Se calcula sobre el resultado del motor real (engine.js). spatial() corre una vez por análisis; score() cada vez
 * que cambian los supuestos (mezcla de clientes, puntos de servicio). Rangos y pesos: por revisar con el equipo. */
(function (root) {
  const TYPES = {
    E: { n: 'Express', s: 'Express', d: 'ATM y depósito', t: '2–5 min', mean: 3.5, c: '#D9773F' },
    T: { n: 'Transaccional', s: 'Transacc.', d: 'Caja', t: '10–25 min', mean: 17.5, c: '#3A7CA5' },
    A: { n: 'Asesoría', s: 'Asesoría', d: 'Con un ejecutivo', t: '30–60+ min', mean: 45, c: '#8C6BC8' }
  };
  const TK = ['E', 'T', 'A'];
  const MIX = { E: .5, T: .35, A: .15 };                       // supuesto: visitas por tipo
  const SVC_MIN = { E: 8 / 3, T: 8, A: 30 };                      // supuesto: tiempo de servicio (media de la triangular: ATM 1·2·5, caja 3·6·15, asesoría 15·25·50 min)
  const PAT = { E: 4, T: 20, A: 15 };                            // supuesto: paciencia en minutos
  const APPT = .6;                                               // supuesto: parte de Asesoría que llega con cita
  const PEAK = 30;                                               // supuesto: clientes por hora en la hora pico (sucursal chica)
  const TW = { E: { orient: .35, espera: .35, priv: .10, seg: .15, amb: .05 }, T: { orient: .20, espera: .35, priv: .15, seg: .15, amb: .15 }, A: { orient: .15, espera: .10, priv: .35, seg: .15, amb: .25 } };
  const SPIW = { carb: .5, circ: .25, efic: .25 };
  // factores genéricos (kgCO₂e por pieza; pisos por m²): ejemplo del mockup, a revisar con Fabiola
  const GENERIC = { 'banca lounge espera': 120, 'mesa de asesoria': 75, 'escritorio asesor': 150, 'barrera blindada de cajas': 410, 'estacion de cajero': 160, 'atm 24 h': 520, 'modulo de bienvenida': 190, 'puesto de guardia': 40, 'macetero': 15, 'piso': 22 };

  const THEMES = [
    { k: 'orient', fam: 'exp', name: 'Orientación', s: 'Orientación', c1: '#3F86F5', c2: '#A8D8FF', f: 587.33, q: 'Al entrar, ¿el cliente ve a dónde ir y cuánto camina hasta su servicio?', unit: 'lo que se ve desde la entrada · más intenso = más cerca', lo: '30 m', hi: '0 m',
      ic: '<circle cx="12" cy="12" r="9"/><path d="m15.5 8.5-2 5-5 2 2-5z"/>' },
    { k: 'espera', fam: 'exp', name: 'Espera y capacidad', s: 'Espera', c1: '#F2734B', c2: '#FFC48C', f: 523.25, q: 'Con la demanda supuesta, ¿cuánto espera cada cliente y alcanzan los puntos de servicio?', unit: 'ocupación de cada servicio en la hora pico', lo: '0 %', hi: '100 %',
      ic: '<circle cx="12" cy="13" r="8"/><path d="M12 9v4l2.5 2M9 2h6"/>' },
    { k: 'priv', fam: 'exp', name: 'Privacidad', s: 'Privacidad', c1: '#E25FA3', c2: '#FFC2DD', f: 783.99, q: '¿Quién alcanza a ver la conversación en asesoría, la ventanilla o la pantalla del ATM?', unit: 'desde dónde se ve una asesoría o una ventanilla', lo: '8 m', hi: '≤ 4 m',
      ic: '<path d="M3 12s3.5-6 9-6 9 6 9 6-3.5 6-9 6-9-6-9-6Z"/><path d="M4 4l16 16"/>' },
    { k: 'seg', fam: 'exp', name: 'Seguridad', s: 'Seguridad', c1: '#7B68F0', c2: '#C9BEFF', f: 659.25, q: '¿El personal ve el área pública y la ruta del efectivo es corta?', unit: 'puestos de personal que ven la celda', lo: 'nadie', hi: '2 o más',
      ic: '<path d="M12 21s7-3.5 7-9V5.5L12 3 5 5.5V12c0 5.5 7 9 7 9Z"/><path d="m9 12 2 2 4-4"/>', alias: 'seg' },
    { k: 'amb', fam: 'exp', name: 'Confort ambiental', s: 'Confort', c1: '#E0A030', c2: '#FFE0A3', f: 698.46, q: 'Donde la gente pasa más tiempo, ¿hay luz natural?', unit: 'luz natural estimada (proxy por vista al vidrio)', lo: 'sin luz', hi: 'bien iluminado',
      ic: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>' },
    { k: 'carb', fam: 'sus', name: 'Carbono incorporado', s: 'Carbono', c1: '#3FA673', c2: '#C8EBB5', f: 880, q: '¿Cuánto CO₂e traen el mobiliario y los acabados, contra una base genérica?', unit: 'desempeño del piso por sus parámetros SA_', lo: 'bajo', hi: 'alto',
      ic: '<path d="M5 19c0-8 5-13 14-14-1 9-6 14-14 14Z"/><path d="M5 19 13 11"/>' },
    { k: 'circ', fam: 'sus', name: 'Circularidad', s: 'Circularidad', c1: '#1F9E8F', c2: '#B5E8E0', f: 987.77, q: '¿Qué parte del material es reutilizado o reciclado?', unit: 'contenido reciclado del piso', lo: '0 %', hi: '100 %',
      ic: '<path d="M20 12a8 8 0 0 1-14 5.3M4 12a8 8 0 0 1 14-5.3"/><path d="M18 3v4h-4M6 21v-4h4"/>' },
    { k: 'efic', fam: 'sus', name: 'Eficiencia del espacio', s: 'Eficiencia', c1: '#8DB33A', c2: '#DDEFB3', f: 1046.5, q: '¿El área de clientes está dimensionada para la ocupación pico?', unit: 'área de clientes que se cuenta', lo: '', hi: 'área de clientes',
      ic: '<rect x="4" y="4" width="16" height="16" rx="2" stroke-dasharray="3 3"/><path d="M9 9h6v6H9z"/>' }
  ];
  const TH = Object.fromEntries(THEMES.map(t => [t.k, t]));
  const FAM = { exp: { n: 'Experiencia del cliente', idx: 'Experiencia', c: '#8C7BF5' }, sus: { n: 'Sustentabilidad', idx: 'Sustentabilidad', c: '#3FA673' } };

  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const lerpS = (x, poor, good) => x == null || isNaN(x) ? null : Math.round(clamp((x - poor) / (good - poor), 0, 1) * 100);
  const f1 = (v, d) => v == null || !isFinite(v) ? '—' : Number(v).toLocaleString('es-MX', { minimumFractionDigits: d || 0, maximumFractionDigits: d || 0 });

  /* ---------------- espacio: una vez por análisis ---------------- */
  function spatial(r, E) {
    const G = r.G, s = r.sel, m = r.model, N = E.norm, A = G.cell * G.cell;
    const tp = o => m.types[o.type] || {};
    // qué es cada room y cada elemento: manda el parámetro SA_ (SA_Zona, SA_Servicio) y, solo si falta, el nombre
    const zk = k => k >= 0 && s.rooms[k] ? E.zoneOf(s.rooms[k]).k : '';
    const staffOnly = k => zk(k) === 'boveda' || zk(k) === 'personal';
    const via = { param: 0, nombre: 0 }, svcs = {};
    s.rooms.forEach(rm => { const z = E.zoneOf(rm); if (z.via) via[z.via]++; });
    s.obstacles.forEach(o => { const v = E.serviceOf(m, o); svcs[o.id] = v.k; if (v.via) via[v.via]++; });
    const svcOf = k => s.obstacles.filter(o => svcs[o.id] === k);
    const pub = c => G.free[c] && isFinite(G.dEnt[c]) && !staffOnly(G.room[c]);
    const near = (x, y, maxD, f) => { let b = -1, bd = maxD; for (let c = 0; c < G.n; c++) { if (!G.free[c] || !isFinite(G.dEnt[c]) || (f && !f(c))) continue; const [p, q] = G.xy(c), d = Math.hypot(p - x, q - y); if (d < bd) { bd = d; b = c; } } return b; };
    const los = (x0, y0, x1, y1) => { const d = Math.hypot(x1 - x0, y1 - y0); if (d < G.cell) return true; const h = E.castRay(G, x0, y0, (x1 - x0) / d, (y1 - y0) / d, d, null); return h.d >= d - G.cell * .75; };
    const cen = o => E.ringCentroid(o.footprint);
    const e0 = G.entrances[0], [ex, ey] = e0 ? G.xy(e0.c) : [0, 0];
    const roomAt = (x, y) => { for (let k = 0; k < s.rooms.length; k++) if (E.inOutline(x, y, s.rooms[k].outline)) return k; return -1; };

    const mk = (o, kind, name, c) => { if (c < 0) return null; const [x, y] = G.xy(c); return { kind, name, o, c, x, y, d: G.dEnt[c], vis: e0 ? los(ex, ey, x, y) : false, room: G.room[c], t: kind === 'atm' ? 'E' : kind === 'ases' ? 'A' : 'T' }; };
    const obs = s.obstacles;
    const atms = svcOf('atm').map((o, i) => { const [x, y] = cen(o); return mk(o, 'atm', `ATM ${i + 1}`, near(x, y, 3, pub)); }).filter(Boolean);
    const tells = svcOf('caja').map((o, i) => { const [x, y] = cen(o), own = roomAt(x, y); return mk(o, 'caja', `Caja ${i + 1}`, near(x, y, 4, c => pub(c) && G.room[c] !== own)); }).filter(Boolean);
    const desks = svcOf('desk');
    const seats = svcOf('ases').map((o, i) => { const [x, y] = cen(o); let ux = 0, uy = 0, bd = 1e9;
      desks.forEach(d => { const [dx, dy] = cen(d), dd = Math.hypot(dx - x, dy - y); if (dd < bd) { bd = dd; ux = (x - dx) / dd; uy = (y - dy) / dd; } });
      const k = roomAt(x, y); return mk(o, 'ases', k >= 0 ? s.rooms[k].name : `Asesoría ${i + 1}`, near(x + ux * 1, y + uy * 1, 2.5, pub)); }).filter(Boolean);
    const host = svcOf('host').map(o => { const [x, y] = cen(o); return mk(o, 'host', 'Host', near(x, y, 3, pub)); }).filter(Boolean)[0] || null;

    // lo que se ve desde la entrada
    const seenEnt = new Uint8Array(G.n);
    if (e0) for (let k = 0; k < 720; k++) { const a = (k + .5) / 720 * 2 * Math.PI; E.castRay(G, ex, ey, Math.cos(a), Math.sin(a), 40, c => { seenEnt[c] = 1; }); }
    const orient = new Float32Array(G.n).fill(NaN);
    for (let c = 0; c < G.n; c++) if (G.free[c] && seenEnt[c]) orient[c] = clamp(1 - G.dEnt[c] / 30, .12, 1);

    // privacidad: m² de área pública que ve cada asiento o ventanilla a menos de 8 m (peso 1 hasta 4 m, baja a 0 en 8 m)
    const priv = new Float32Array(G.n).fill(NaN);
    const expo = p => { const seen = new Set(); for (let k = 0; k < 360; k++) { const a = (k + .5) / 360 * 2 * Math.PI; E.castRay(G, p.x, p.y, Math.cos(a), Math.sin(a), 8, c => seen.add(c)); }
      let a = 0; seen.forEach(c => { if (!pub(c)) return; const [x, y] = G.xy(c), d = Math.hypot(x - p.x, y - p.y); if (d < 1.5 || d > 8) return; if (p.kind === 'ases' && G.room[c] === p.room) return;
        const w = d <= 4 ? 1 : (8 - d) / 4; a += w * A; priv[c] = isNaN(priv[c]) ? w : Math.max(priv[c], w); }); return a; };
    seats.forEach(p => { p.exp = expo(p); }); tells.forEach(p => { p.exp = expo(p); });
    atms.forEach(p => { const [ax, ay] = cen(p.o), L = Math.hypot(p.x - ax, p.y - ay) || 1, ux = (p.x - ax) / L, uy = (p.y - ay) / L; let n = 0;
      for (let c = 0; c < G.n; c++) { if (!pub(c)) continue; const [x, y] = G.xy(c), dx = x - p.x, dy = y - p.y, d = Math.hypot(dx, dy); if (d < .4 || d > 1.5 || dx * ux + dy * uy <= 0) continue; if (los(x, y, p.x, p.y)) n++; } p.sh = n * A; });

    // luz natural en la zona de cada tipo (proxy de la app: vista al vidrio exterior)
    const ZONE = { E: 'auto', T: 'espera', A: 'ases' }, luz = {}, zones = {};
    TK.forEach(t => { let n = 0, l = 0; const ks = new Set(); for (let c = 0; c < G.n; c++) { if (!G.free[c] || zk(G.room[c]) !== ZONE[t]) continue; ks.add(G.room[c]); n++; if (G.day[c] > .5) l++; } luz[t] = n ? l / n * 100 : null; zones[t] = [...ks]; });

    // seguridad: lo que ya mide el motor
    const segRow = n => { const x = r.metrics.seg.find(m => m[0] === n); return x ? x[1] : null; };
    let blindAt = null, bb = -1; const bl = []; for (let c = 0; c < G.n; c++) if (G.free[c] && G.watch.length && G.seen[c] === 0 && pub(c)) bl.push(c);
    bl.forEach(c => { const [x, y] = G.xy(c); let k = 0; bl.forEach(g => { const [p, q] = G.xy(g); if (Math.hypot(p - x, q - y) < 2) k++; }); if (k > bb) { bb = k; blindAt = c; } });

    // gradiente de velocidad: qué tan a la mano está cada servicio contra qué tan rápido es (escala fija de 30 m)
    const CLS = { atm: 3, host: 2, caja: 2, ases: 1 }, gp = [].concat(atms, host ? [host] : [], tells, seats);
    gp.forEach(p => { p.prom = .5 * (p.vis ? 100 : 0) + .5 * (100 - clamp(p.d / 30 * 100, 0, 100)); });
    const rank = a => { const ix = a.map((v, i) => [v, i]).sort((p, q) => p[0] - q[0]), o = new Array(a.length); let i = 0; while (i < ix.length) { let j = i; while (j + 1 < ix.length && ix[j + 1][0] === ix[i][0]) j++; for (let k = i; k <= j; k++) o[ix[k][1]] = (i + j) / 2 + 1; i = j + 1; } return o; };
    const pear = (x, y) => { const n = x.length; if (n < 3) return null; const mx = x.reduce((a, b) => a + b) / n, my = y.reduce((a, b) => a + b) / n; let sxy = 0, sx = 0, sy = 0; for (let k = 0; k < n; k++) { sxy += (x[k] - mx) * (y[k] - my); sx += (x[k] - mx) ** 2; sy += (y[k] - my) ** 2; } return sx && sy ? sxy / Math.sqrt(sx * sy) : 0; };
    const rho = pear(rank(gp.map(p => p.prom)), rank(gp.map(p => CLS[p.kind])));

    // sustentabilidad: del schedule (tipos con SA_GWP); base = mismas cantidades con factores genéricos
    const items = {}; const add = (o, q) => { const t = tp(o), p = t.params || {}; if (p.SA_GWP == null) return; const id = o.type; const it = items[id] || (items[id] = { n: t.family, tipo: t.name, q: 0, u: 0, gwp: +p.SA_GWP, epd: !!+p.SA_EPD, rec: p.SA_Reciclado == null ? 0 : +p.SA_Reciclado / 100, reu: !!+p.SA_Reutilizado, gen: p.SA_GWP_Base != null ? +p.SA_GWP_Base : GENERIC[N(t.family || '')] }); it.q += q; };
    obs.forEach(o => add(o, 1)); s.floors.forEach(f => add(f, f.area || 0));
    const list = Object.values(items).map(it => { const act = it.reu ? 0 : it.q * it.gwp, base = it.q * (it.gen != null ? it.gen : it.gwp); return Object.assign(it, { act, base, src: it.reu ? 'Reutilizado' : it.epd ? 'EPD' : 'Genérico' }); }).sort((a, b) => b.act - a.act);
    const act = list.reduce((a, x) => a + x.act, 0), base = list.reduce((a, x) => a + x.base, 0), epdC = list.filter(x => x.epd).reduce((a, x) => a + x.act, 0);
    const circ = act ? list.reduce((a, x) => a + (x.reu ? x.base : x.act * x.rec), 0) / list.reduce((a, x) => a + (x.reu ? x.base : x.act), 0) * 100 : null;
    const floorA = s.floors.reduce((a, f) => a + (f.area || 0), 0);
    const circF = new Float32Array(G.n).fill(NaN);
    for (let c = 0; c < G.n; c++) if (G.free[c] && G.floor && G.floor[c] >= 0) { const f = s.floors[G.floor[c]], p = (m.types[f.type] || {}).params || {}; if (p.SA_Reciclado != null) circF[c] = clamp(+p.SA_Reciclado / 100, 0, 1); }
    // área de clientes (rooms públicos, sin asesoría ni lounge) y lo que ocupan los muebles ahí
    const custRooms = new Set(); let custA = 0, furnA = 0; s.rooms.forEach((rm, k) => { if (staffOnly(k) || zk(k) === 'ases') return; custRooms.add(k); custA += rm.area || 0; });
    obs.forEach(o => { const [x, y] = cen(o); if (custRooms.has(roomAt(x, y))) furnA += E.ringArea(o.footprint); });
    const efF = new Float32Array(G.n).fill(NaN); for (let c = 0; c < G.n; c++) if (G.free[c] && custRooms.has(G.room[c])) efF[c] = .7;

    const svcRoom = {}; for (let c = 0; c < G.n; c++) { if (!G.free[c]) continue; const z = zk(G.room[c]); svcRoom[c] = z === 'auto' ? 'E' : z === 'espera' ? 'T' : z === 'ases' ? 'A' : null; }
    return { G, via, ent: e0 ? [ex, ey] : null, atms, tells, seats, host, rho, luz, zones, blindAt, gp,
      vig: segRow('Área vigilada'), blind: segRow('Puntos ciegos'), cash: G.paths.cash ? G.paths.cash.length : null, nStaff: G.staff.length,
      fields: { orient, priv, seg: r.fields.seg, amb: G.day, carb: r.fields.sust, circ: circF, efic: efF },
      sus: { list, act, base, red: base ? (1 - act / base) * 100 : null, int: floorA ? act / floorA : null, epd: act ? epdC / act * 100 : null, circ, custA, furnA },
      svcRoom, counts: { atm: atms.length, caja: tells.length, ases: seats.length }, roomOfCell: c => G.room[c] };
  }

  /* ---------------- filas: Erlang C (en la app final, simulación con semilla fija) ---------------- */
  function erlangC(c, a) { if (a >= c) return 1; let sum = 0, term = 1; for (let k = 0; k < c; k++) { if (k > 0) term *= a / k; sum += term; } const top = term * a / c * c / (c - a); return top / (sum + top); }
  function queue(lam, mean, c, pat) { const mu = 60 / mean, a = lam / mu; if (c < 1) return { p90: Infinity, lq: Infinity, ab: 1, a, rho: Infinity }; if (a >= c) return { p90: Infinity, lq: Infinity, ab: 1 - c / a, a, rho: a / c }; const C = erlangC(c, a), r = c * mu - lam; return { p90: C <= .1 ? 0 : Math.log(10 * C) / r * 60, lq: C * a / (c - a), ab: C * Math.exp(-r * pat / 60), a, rho: a / c }; }
  const SRV = { E: 'atm', T: 'caja', A: 'ases' };

  /* ---------------- métricas ---------------- */
  const p90t = v => isFinite(v) ? f1(v, 1) : '> 60';
  const over = 'llegan más clientes de los que se alcanzan a atender: la fila no se vacía';
  const ctr = p => p ? [p.x, p.y] : null;
  const MET = [
    { id: 'atmvis', th: 'orient', n: 'ATMs visibles desde la entrada', ty: { E: .4 }, u: '', d: 0, poor: 0, good: 1, rt: ['ninguno', 'todos'], src: 'Modelado', get: s => s.atms.length ? s.atms.filter(p => p.vis).length / s.atms.length : null, txt: (v, s) => `${s.atms.filter(p => p.vis).length} de ${s.atms.length}`,
      what: 'Cuántos ATMs quedan dentro de lo que se ve al cruzar la puerta (corte de vista a 1.20 m).', msg: (v, s) => `Desde la entrada se ven ${s.atms.filter(p => p.vis).length} de ${s.atms.length} ATMs.`, sug: 'Llevar el autoservicio al campo visual de la entrada.', at: s => ctr(s.atms.find(p => !p.vis) || s.atms[0]) },
    { id: 'hostvis', th: 'orient', n: 'Host visible desde la entrada', ty: { T: .4, A: .6 }, u: '', d: 0, poor: 0, good: 1, rt: ['no', 'sí'], src: 'Modelado', get: s => s.host ? (s.host.vis ? 1 : 0) : null, txt: v => v ? 'Sí' : 'No',
      what: 'Si el módulo de bienvenida se ve al entrar: es el primer punto de orientación de Transaccional y Asesoría.', msg: () => 'El host no se ve desde la entrada.', sug: 'Poner el host en el eje de la entrada.', at: s => ctr(s.host) },
    { id: 'datm', th: 'orient', n: 'Distancia caminando al ATM', ty: { E: .3 }, u: 'm', d: 1, poor: 25, good: 8, src: 'Modelado', get: s => s.atms.length ? Math.min(...s.atms.map(p => p.d)) : null,
      what: 'Ruta más corta de la puerta al ATM más cercano, esquivando muros y muebles.', msg: v => `El ATM más cercano está a ${f1(v, 1)} m de la puerta.`, sug: 'Acercar el autoservicio al acceso.', at: s => ctr(s.atms.slice().sort((a, b) => a.d - b.d)[0]) },
    { id: 'dcaja', th: 'orient', n: 'Distancia caminando a la caja', ty: { T: .3 }, u: 'm', d: 1, poor: 35, good: 12, src: 'Modelado', get: s => s.tells.length ? Math.min(...s.tells.map(p => p.d)) : null,
      what: 'Ruta más corta de la puerta a la ventanilla más cercana, del lado del cliente.', msg: v => `La ventanilla más cercana está a ${f1(v, 1)} m del acceso.`, sug: 'Acortar el recorrido a cajas.', at: s => ctr(s.tells[0]) },
    { id: 'grad', th: 'orient', n: 'Gradiente de velocidad', ty: { E: .3, T: .3, A: .4 }, u: 'ρ', d: 2, poor: -1, good: 1, rt: ['−1, invertido', '+1, ideal'], src: 'Modelado', get: s => s.rho, txt: v => (v > 0 ? '+' : '') + f1(v, 2),
      what: 'Correlación de Spearman entre qué tan a la mano está cada servicio y qué tan rápido es: lo rápido al frente y la asesoría al fondo.', msg: v => v < 0 ? `El gradiente está invertido (ρ ${f1(v, 2)}): la asesoría queda más a la mano que el autoservicio.` : `El gradiente es débil (ρ ${f1(v, 2)}).`, sug: 'Autoservicio al frente, cajas al centro, asesoría al fondo.', at: s => ctr(s.atms[0]) },
    { id: 'p90E', th: 'espera', n: 'P90 de espera en ATM', ty: { E: .7 }, u: 'min', d: 1, poor: 5, good: 1, src: 'Supuesto', get: (s, q) => s.counts.atm ? q.E.p90 : null, txt: p90t,
      what: 'En la hora pico, 9 de cada 10 clientes Express esperan menos que esto.', msg: v => isFinite(v) ? `En la hora pico, 1 de cada 10 clientes Express espera más de ${p90t(v)} min por un ATM.` : `ATM: ${over}.`, sug: 'Probar con un ATM más en «¿Qué pasa si…?».', at: s => ctr(s.atms[0]) },
    { id: 'p90T', th: 'espera', n: 'P90 de espera en caja', ty: { T: .7 }, u: 'min', d: 1, poor: 20, good: 7, src: 'Supuesto', get: (s, q) => s.counts.caja ? q.T.p90 : null, txt: p90t,
      what: 'En la hora pico, 9 de cada 10 clientes Transaccionales esperan menos que esto.', msg: v => isFinite(v) ? `En la hora pico, 1 de cada 10 clientes espera más de ${p90t(v)} min en caja.` : `Cajas: ${over}.`, sug: 'Abrir otra caja en la hora pico.', at: s => ctr(s.tells[0]) },
    { id: 'p90A', th: 'espera', n: 'P90 de espera en asesoría', ty: { A: .7 }, u: 'min', d: 1, poor: 20, good: 5, src: 'Supuesto', get: (s, q) => s.counts.ases ? q.A.p90 : null, txt: p90t,
      what: 'Solo los que llegan sin cita (40 %): en la hora pico, 9 de cada 10 esperan menos que esto.', msg: v => isFinite(v) ? `En asesoría, 1 de cada 10 espera más de ${p90t(v)} min.` : `Asesoría: ${over}.`, sug: 'Más asesores o más citas programadas.', at: s => ctr(s.seats[0]) },
    { id: 'aband', th: 'espera', n: 'Se van sin ser atendidos', ty: { E: .3, T: .3, A: .3 }, u: '%', d: 1, poor: 10, good: 0, src: 'Supuesto', get: (s, q) => q.ab,
      what: 'Clientes cuya espera pasa su paciencia: 4 min Express, 20 Transaccional, 15 Asesoría.', msg: v => `El ${f1(v, 1)} % de los clientes se iría antes de ser atendido.`, sug: 'Ver qué servicio se satura en «¿Qué pasa si…?».', at: s => ctr(s.tells[0]) },
    { id: 'shoulder', th: 'priv', n: 'Área que ve la pantalla del ATM', ty: { E: 1 }, u: 'm²', d: 1, poor: 4, good: 1, src: 'Modelado', get: s => s.atms.length ? s.atms.reduce((a, p) => a + p.sh, 0) / s.atms.length : null,
      what: 'Por ATM: m² de área pública a menos de 1.5 m detrás del usuario desde donde se ve su pantalla.', msg: v => `Por ATM, ${f1(v, 1)} m² detrás del usuario ven la pantalla.`, sug: 'Alas laterales de 1.9 m o girar el equipo hacia el muro.', at: s => ctr(s.atms[0]) },
    { id: 'expT', th: 'priv', n: 'Área que ve las ventanillas', ty: { T: 1 }, u: 'm²', d: 0, poor: 80, good: 20, src: 'Modelado', get: s => s.tells.length ? s.tells.reduce((a, p) => a + p.exp, 0) / s.tells.length : null,
      what: 'Por ventanilla: m² de área pública que la ve a menos de 8 m; pesa completo lo que está a menos de 4 m.', msg: v => `Cada ventanilla se ve desde ${f1(v)} m² de área pública cercana.`, sug: 'Línea de cortesía a 1.5 m y fila de lado, no de frente.', at: s => ctr(s.tells[1] || s.tells[0]) },
    { id: 'expA', th: 'priv', n: 'Área que ve las mesas de asesoría', ty: { A: 1 }, u: 'm²', d: 0, poor: 60, good: 10, src: 'Modelado', get: s => s.seats.length ? s.seats.reduce((a, p) => a + p.exp, 0) / s.seats.length : null,
      what: 'Por mesa: m² de área pública fuera de su sala que ve el asiento del cliente a menos de 8 m. Solo vista; lo acústico llega después.', msg: v => `Cada mesa de asesoría se ve desde ${f1(v)} m² de área pública.`, sug: 'Vidrio esmerilado entre 1.2 y 1.8 m o girar la puerta.', at: s => ctr(s.seats.slice().sort((a, b) => b.exp - a.exp)[0]) },
    { id: 'vig', th: 'seg', n: 'Área pública que ve el personal', ty: { E: .5, T: .5, A: .5 }, u: '%', d: 0, poor: 50, good: 90, src: 'Modelado', get: s => s.vig,
      what: 'Porcentaje del piso libre que alcanza a ver al menos un puesto de personal, a menos de 25 m.', msg: v => `El personal ve el ${f1(v)} % del área.`, sug: 'Abrir la visual del host o del guardia hacia lo que no se ve.', at: s => s.blindAt },
    { id: 'blind', th: 'seg', n: 'Puntos ciegos', ty: { E: .25, T: .25, A: .25 }, u: 'm²', d: 0, poor: 60, good: 0, src: 'Modelado', get: s => s.blind,
      what: 'Área libre que no ve nadie del personal.', msg: v => `${f1(v)} m² no los ve nadie del personal.`, sug: 'Mover un puesto o quitar lo alto que tapa.', at: s => s.blindAt },
    { id: 'cash', th: 'seg', n: 'Ruta del efectivo', ty: { E: .25, T: .25, A: .25 }, u: 'm', d: 1, poor: 25, good: 6, src: 'Modelado', get: s => s.cash,
      what: 'Recorrido más corto de la bóveda a la caja más cercana.', msg: v => `La ruta del efectivo mide ${f1(v, 1)} m.`, sug: 'Acercar la bóveda a cajas.', at: () => null, path: 'cash' },
    { id: 'luzE', th: 'amb', n: 'Luz natural en autoservicio', ty: { E: 1 }, u: '%', d: 0, poor: 20, good: 75, src: 'Proxy', get: s => s.luz.E,
      what: 'Parte de la zona con buena luz natural. Hoy es un proxy (vista al vidrio exterior); después, sDA con Radiance.', msg: v => `Solo el ${f1(v)} % del autoservicio tiene buena luz natural.`, sug: 'Autoservicio junto a la fachada.', zone: 'E' },
    { id: 'luzT', th: 'amb', n: 'Luz natural en fila y espera', ty: { T: 1 }, u: '%', d: 0, poor: 20, good: 75, src: 'Proxy', get: s => s.luz.T,
      what: 'Parte de la fila y la espera con buena luz natural; ahí espera el cliente Transaccional.', msg: v => `Solo el ${f1(v)} % de la fila y la espera tiene buena luz natural.`, sug: 'Llevar la espera hacia la fachada.', zone: 'T' },
    { id: 'luzA', th: 'amb', n: 'Luz natural en asesoría', ty: { A: 1 }, u: '%', d: 0, poor: 20, good: 75, src: 'Proxy', get: s => s.luz.A,
      what: 'Parte de las salas de asesoría y del lounge con buena luz natural; ahí se pasan de 30 a 60 minutos.', msg: v => `Solo el ${f1(v)} % de la asesoría tiene buena luz natural.`, sug: 'Vidrio interior alto o asesoría hacia una fachada.', zone: 'A' },
    { id: 'carb', th: 'carb', n: 'Reducción contra la base genérica', u: '%', d: 0, poor: 0, good: 40, src: 'EPD + genérico', get: s => s.sus.red,
      what: 'Cuánto menos CO₂e que la misma lista de elementos con factores genéricos, nada reutilizado.', msg: v => `El proyecto baja ${f1(v)} % el carbono contra la base genérica.`, sug: 'Pedir EPD de los elementos que más pesan y reutilizar el mostrador.' },
    { id: 'cint', th: 'carb', ctx: true, n: 'Intensidad de carbono', u: 'kgCO₂e/m²', d: 1, src: 'EPD + genérico', get: s => s.sus.int, what: 'Para comparar con otras sucursales. No suma puntos.' },
    { id: 'cepd', th: 'carb', ctx: true, n: 'Carbono respaldado por EPD', u: '%', d: 0, src: 'EPD', get: s => s.sus.epd, what: 'Qué tan confiable es el cálculo: parte del carbono que sale de datos del fabricante. No suma puntos.' },
    { id: 'circ', th: 'circ', n: 'Contenido circular', u: '%', d: 0, poor: 0, good: 60, src: 'Genérico', get: s => s.sus.circ,
      what: 'Parte reciclada o reutilizada del material. Mientras no haya masa por elemento, se pondera por carbono.', msg: v => `El ${f1(v)} % del material es reciclado o reutilizado.`, sug: 'Mobiliario reacondicionado y acabados con más contenido reciclado.' },
    { id: 'efic', th: 'efic', n: 'Área necesaria / área de clientes', u: '', d: 2, poor: .4, good: .8, src: 'Supuesto', get: (s, q) => s.counts.atm + s.counts.caja + s.counts.ases && s.sus.custA ? q.need / s.sus.custA : null, sc: v => v >= .8 && v <= 1 ? 100 : v < .8 ? lerpS(v, .4, .8) : lerpS(v, 1.3, 1), rt: ['0.40, sobra', '0.80–1.00'],
      what: 'Área que pide la ocupación pico (0.9 m² por persona en fila, 1.4 m² por persona atendida, más los muebles) entre el área de clientes. Ideal: 0.80–1.00.', msg: v => v < .8 ? `En la hora pico se usa el ${f1(v * 100)} % del área de clientes: sobra espacio.` : `En la hora pico se necesita el ${f1(v * 100)} % del área de clientes: falta espacio.`, sug: 'Revisar el umbral con Fabiola: en sucursales chicas siempre sobra.' }
  ];
  const MBY = Object.fromEntries(MET.map(m => [m.id, m]));

  function mixW(mix) { if (mix !== 'tiempo') return MIX; const s = TK.reduce((a, t) => a + MIX[t] * TYPES[t].mean, 0), o = {}; TK.forEach(t => { o[t] = MIX[t] * TYPES[t].mean / s; }); return o; }
  const mw0 = (th, t) => { const tot = MET.filter(m => m.th === th && m.ty && m.ty[t]).reduce((a, m) => a + m.ty[t], 0); return tot; };

  /* ---------------- puntaje: cada vez que cambian los supuestos ---------------- */
  function score(sp, o) {
    o = o || {}; const counts = o.counts || sp.counts, lam = PEAK * (o.peak || 1), mw = mixW(o.mix);
    // asesoría: el 60 % llega con cita (no hace fila, pero ocupa asesores); los que llegan sin cita hacen fila con los asesores que quedan libres
    // un servicio que el modelo no trae (0 ATMs, por ejemplo) no se califica: «Sin datos». Bajarlo a 0 en «¿Qué pasa si…?» sí cuenta.
    const q = {}; let ab = 0, abL = 0, need = sp.sus.furnA; TK.forEach(t => { const l = lam * MIX[t], c = counts[SRV[t]], has = sp.counts[SRV[t]] > 0;
      if (t === 'A') { const appt = Math.round(APPT * l * SVC_MIN.A / 60), walk = l * (1 - APPT); q[t] = queue(walk, SVC_MIN.A, Math.max(0, c - appt), PAT.A); q[t].appt = appt; q[t].a += appt; if (has) { ab += walk * q[t].ab; abL += l; } }
      else { q[t] = queue(l, SVC_MIN[t], c, PAT[t]); if (has) { ab += l * q[t].ab; abL += l; } }
      need += (isFinite(q[t].lq) ? q[t].lq : 10) * .9 + Math.min(q[t].a, c) * 1.4; }); q.ab = abL ? ab / abL * 100 : null; q.need = need; q.lam = lam;
    const m = {}; MET.forEach(x => { const v = x.get(sp, q); m[x.id] = { v, s: x.ctx || v == null ? null : x.sc ? x.sc(v) : lerpS(v, x.poor, x.good) }; });
    const th = {}; THEMES.forEach(T => { if (T.fam === 'sus') { const x = MET.find(y => y.th === T.k && !y.ctx); th[T.k] = { all: m[x.id].s }; return; }
      const r = {}; TK.forEach(t => { let w = 0, s = 0; MET.filter(x => x.th === T.k && x.ty && x.ty[t]).forEach(x => { if (m[x.id].s != null) { w += x.ty[t]; s += x.ty[t] * m[x.id].s; } }); r[t] = w ? s / w : null; });
      let w = 0, s = 0; TK.forEach(t => { if (r[t] != null) { w += mw[t]; s += mw[t] * r[t]; } }); r.all = w ? s / w : null; th[T.k] = r; });
    const types = {}; TK.forEach(t => { let w = 0, s = 0; for (const k in TW[t]) if (th[k][t] != null) { w += TW[t][k]; s += TW[t][k] * th[k][t]; } types[t] = w ? s / w : null; });
    const exp = TK.reduce((a, t) => a + mw[t] * (types[t] || 0), 0);
    let sw = 0, ss = 0; for (const k in SPIW) if (th[k].all != null) { sw += SPIW[k]; ss += SPIW[k] * th[k].all; } const sus = sw ? ss / sw : null;
    // espera en la planta: ocupación del servicio de cada zona
    const espera = new Float32Array(sp.G.n).fill(NaN); for (const c in sp.svcRoom) { const t = sp.svcRoom[c]; if (t) espera[c] = clamp(q[t].rho, 0, 1); }
    // hallazgos: una regla fija por métrica; se activa bajo 70 (mejorar) o bajo 40 (atención)
    const imp = x => x.ty ? TK.reduce((a, t) => a + (x.ty[t] ? MIX[t] * TW[t][x.th] * x.ty[t] / mw0(x.th, t) : 0), 0) : SPIW[x.th] * .25;
    const finds = []; MET.forEach(x => { const r = m[x.id]; if (x.ctx || r.s == null || r.s >= 70) return;
      finds.push({ x, sev: r.s < 40 ? 'low' : 'mid', lost: (100 - r.s) * imp(x), msg: x.msg(r.v, sp), sug: x.sug, rule: rule(x), at: x.at ? x.at(sp) : null, zone: x.zone ? sp.zones[x.zone] : null }); });
    const top = sp.sus.list[0]; if (top && top.src === 'Genérico') finds.push({ x: MBY.carb, sev: 'info', lost: 0, msg: `Lo que más carbono aporta (${top.n}) usa un factor genérico.`, sug: 'Pedir su EPD al fabricante.', rule: 'Regla: el elemento con más carbono no tiene EPD.' });
    const so = { low: 0, mid: 1, info: 2 }; finds.sort((a, b) => so[a.sev] - so[b.sev] || b.lost - a.lost);
    // cuántos temas de cada familia tienen datos: con pocos, el índice es parcial y la interfaz lo dice
    const cov = { exp: THEMES.filter(T => T.fam === 'exp' && th[T.k].all != null).length, sus: THEMES.filter(T => T.fam === 'sus' && th[T.k].all != null).length };
    return { q, m, th, types, exp, sus, mw, finds, counts, cov, fields: Object.assign({}, sp.fields, { espera }) };
  }
  /** El texto de la regla: a partir de qué valor la métrica pasa a «Mejorar» y a «Atención». */
  function rule(x) {
    if (x.id === 'efic') return 'Regla: fuera de 0.80–1.00 pasa a «Mejorar»; bajo 0.56 o sobre 1.09, a «Atención».';
    const v = p => x.poor + p * (x.good - x.poor), worse = x.good > x.poor ? 'menos de' : 'más de', fx = p => x.rt && x.poor === 0 && x.good === 1 ? f1(v(p) * 100) + ' %' : f1(v(p), x.d) + (x.u ? ' ' + x.u : '');
    return `Regla: con ${worse} ${fx(.7)} pasa a «Mejorar»; con ${worse} ${fx(.4)}, a «Atención».`;
  }

  const api = { TYPES, TK, MIX, APPT, PEAK, SVC_MIN, PAT, TW, SPIW, THEMES, TH, FAM, MET, MBY, spatial, score, mixW, queue, lerpS };
  if (typeof module !== 'undefined' && module.exports) module.exports = api; else root.SAIndices = api;
})(typeof window !== 'undefined' ? window : this);
