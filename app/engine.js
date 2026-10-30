/* Space Analytics · motor de análisis.
 * Lee uno o varios space-model.json (docs/space-model.md) y calcula, sobre una retícula del nivel elegido:
 * isovistas y vista al exterior (corte a 1.20 m), distancias y tráfico de circulación (corte a 0.50 m),
 * vigilancia natural desde los puestos de personal, confort y sustentabilidad por parámetros SA_.
 * Sin dependencias: corre en el navegador (window.SAEngine) y en Node (module.exports) para las pruebas. */
(function (root) {
  'use strict';

  const SCHEMA = 'hsbc-space-analytics/space-model@';
  const STAGES = ['Concepto', 'Esquemático', 'Desarrollo', 'Documentación'];
  const MOVE_CUT = 0.5, MOVE_LOW = 0.1, SIGHT_CUT = 1.2;
  const OPEN = 0, OPAQUE = 1, GLASS_IN = 2, GLASS_OUT = 3;
  const MAX_CELLS = 250000;

  // ---------- geometría ----------
  function inRing(x, y, ring) {
    let inside = false;
    for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
      const xi = ring[i][0], yi = ring[i][1], xj = ring[j][0], yj = ring[j][1];
      if ((yi > y) !== (yj > y) && x < (xj - xi) * (y - yi) / (yj - yi) + xi) inside = !inside;
    }
    return inside;
  }
  function inOutline(x, y, outline) {
    if (!outline || !outline.length || !inRing(x, y, outline[0])) return false;
    for (let k = 1; k < outline.length; k++) if (inRing(x, y, outline[k])) return false;
    return true;
  }
  function ringArea(r) {
    let a = 0;
    for (let i = 0, j = r.length - 1; i < r.length; j = i++) a += (r[j][0] + r[i][0]) * (r[j][1] - r[i][1]);
    return Math.abs(a / 2);
  }
  function ringCentroid(r) {
    let a = 0, cx = 0, cy = 0;
    for (let i = 0, j = r.length - 1; i < r.length; j = i++) {
      const f = r[j][0] * r[i][1] - r[i][0] * r[j][1];
      a += f; cx += (r[j][0] + r[i][0]) * f; cy += (r[j][1] + r[i][1]) * f;
    }
    if (Math.abs(a) < 1e-9) {
      let sx = 0, sy = 0; r.forEach(p => { sx += p[0]; sy += p[1]; });
      return [sx / r.length, sy / r.length];
    }
    return [cx / (3 * a), cy / (3 * a)];
  }
  function boxOf(points, box) {
    box = box || [Infinity, Infinity, -Infinity, -Infinity];
    points.forEach(p => {
      if (p[0] < box[0]) box[0] = p[0]; if (p[1] < box[1]) box[1] = p[1];
      if (p[0] > box[2]) box[2] = p[0]; if (p[1] > box[3]) box[3] = p[1];
    });
    return box;
  }
  function segDist(px, py, ax, ay, bx, by) {
    const dx = bx - ax, dy = by - ay, L = dx * dx + dy * dy;
    const t = L ? Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / L)) : 0;
    return Math.hypot(px - ax - t * dx, py - ay - t * dy);
  }
  const norm = s => String(s == null ? '' : s).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');

  // ---------- carga ----------
  /** Acepta {models:[...]}, un modelo o una lista. Devuelve {models, warnings}. */
  function load(json) {
    const list = Array.isArray(json) ? json : json && Array.isArray(json.models) ? json.models : [json];
    const models = [], warnings = [];
    list.forEach((m, i) => {
      if (!m || typeof m !== 'object') { warnings.push(`Entrada ${i + 1}: no es un modelo`); return; }
      if (typeof m.schema !== 'string' || m.schema.indexOf(SCHEMA) !== 0) {
        warnings.push(`Entrada ${i + 1}: no es un space-model (schema "${m.schema}")`); return;
      }
      ['levels', 'rooms', 'floors', 'walls', 'doors', 'windows', 'obstacles'].forEach(k => { if (!Array.isArray(m[k])) m[k] = []; });
      if (!m.types || typeof m.types !== 'object') m.types = {};
      m.source = m.source || {};
      if (STAGES.indexOf(m.source.stage) < 0) m.source.stage = STAGES[1];
      m.levels.sort((a, b) => a.elevation - b.elevation);
      models.push(m);
    });
    return { models, warnings };
  }

  /** Niveles con algo que analizar (rooms o pisos), en orden de elevación. */
  function levelsOf(model) {
    return model.levels.filter(L => model.rooms.some(r => r.level === L.id) ||
      model.floors.some(f => f.level === L.id || Math.abs((f.top || 0) - L.elevation) < 0.35));
  }

  function roleOf(model, el) {
    const p = (el.params && el.params.SA_Rol) || (model.types[el.type] && model.types[el.type].params && model.types[el.type].params.SA_Rol);
    if (p) {
      const n = norm(p);
      if (n.indexOf('boveda') >= 0 || n.indexOf('vault') >= 0) return 'vault';
      if (n.indexOf('entrada') >= 0) return 'entrance';
      if (n.indexOf('espera') >= 0) return 'wait';
      if (n.indexOf('personal') >= 0 || n.indexOf('staff') >= 0) return 'staff';
    }
    const t = model.types[el.type] || {}, n = norm((t.family || '') + ' ' + (t.name || ''));
    if (/boveda|vault|caja fuerte|\bsafe\b|tesorer/.test(n)) return 'vault';
    if (/mostrador|counter|teller|cajer|\bcaja\b|recepci|reception|\basesor\b|guard|vigil|workstation|escritorio|\bdesk\b/.test(n)) return 'staff';
    return '';
  }
  const isTeller = (model, el) => /mostrador|counter|teller|cajer|\bcaja\b/.test(norm(((model.types[el.type] || {}).family || '') + ' ' + ((model.types[el.type] || {}).name || '')));
  const isGlassName = (model, el) => /vidrio|glass|cristal|glazed/.test(norm(((model.types[el.type] || {}).family || '') + ' ' + ((model.types[el.type] || {}).name || '')));
  const sp = (model, el, k) => {
    const v = el.params && el.params[k] != null ? el.params[k] : model.types[el.type] && model.types[el.type].params ? model.types[el.type].params[k] : null;
    return v == null || v === '' ? null : v;
  };

  // ---------- selección por nivel ----------
  function select(model, level) {
    const e = level.elevation;
    const above = model.levels.filter(L => L.elevation > e + 1).map(L => L.elevation);
    const top = above.length ? Math.min.apply(null, above) : e + 4;
    const crosses = (z, h) => z && z[0] <= e + h + 1e-6 && z[1] >= e + h - 1e-6;
    const near = el => el.level === level.id || (el.z != null && (Array.isArray(el.z) ? el.z[0] : el.z) >= e - 0.5 && (Array.isArray(el.z) ? el.z[0] : el.z) < top - 0.5);
    return {
      level, e, top,
      rooms: model.rooms.filter(r => r.level === level.id && r.outline && r.outline.length),
      floors: model.floors.filter(f => (f.level === level.id || Math.abs((f.top || 0) - e) < 0.35) && f.outline && f.outline.length),
      walls: model.walls.filter(w => w.path && w.path.length > 1 && w.z && w.z[0] < e + 2.2 && w.z[1] > e + 0.05),
      doors: model.doors.filter(near),
      windows: model.windows.filter(near),
      obstacles: model.obstacles.filter(o => o.footprint && o.footprint.length > 2 && o.z && o.z[0] < e + 2.2 && o.z[1] > e + 0.05),
      wallMoves: w => crosses(w.z, MOVE_CUT),
      wallSight: w => crosses(w.z, SIGHT_CUT),
      obsMoves: o => o.category === 'Columns' || (o.z[0] <= e + MOVE_CUT && o.z[1] >= e + MOVE_LOW),
      obsSight: o => o.category === 'Columns' || crosses(o.z, SIGHT_CUT)
    };
  }

  // ---------- análisis ----------
  /** Los pasos del análisis, para correrlos con pausas (la animación de Re-analizar) o de corrido (analyze). */
  function plan(model, levelId, opts) {
    opts = Object.assign({ cell: 0.5, rays: 64 }, opts || {});
    const level = model.levels.find(L => L.id === levelId) || levelsOf(model)[0] || model.levels[0];
    const ctx = { model, opts, warnings: [] };
    const steps = [
      { label: 'Leyendo modelo de Revit', run: () => readStep(ctx, level) },
      { label: 'Retícula de análisis', run: () => gridStep(ctx) },
      { label: 'Grafo de circulación', run: () => graphStep(ctx) },
      { label: 'Isovistas y vista al exterior', run: () => visibilityStep(ctx) },
      { label: 'Vigilancia natural', run: () => surveillanceStep(ctx) },
      { label: 'Familias y parámetros', run: () => materialsStep(ctx) },
      { label: 'Pilares y relaciones', run: () => pillarsStep(ctx) }
    ];
    return { steps, ctx };
  }
  function analyze(model, levelId, opts) {
    const p = plan(model, levelId, opts);
    p.steps.forEach(s => { s.detail = s.run(); });
    return p.ctx.result;
  }

  function readStep(ctx, level) {
    if (!level) throw new Error('El modelo no tiene niveles');
    ctx.sel = select(ctx.model, level);
    const s = ctx.sel;
    if (!s.rooms.length) ctx.warnings.push('Este nivel no tiene rooms: los puntajes por espacio no estarán disponibles.');
    if (!s.floors.length) ctx.warnings.push('Este nivel no tiene pisos: la retícula usa el contorno de los rooms.');
    const n = s.rooms.length + s.walls.length + s.doors.length + s.windows.length + s.obstacles.length + s.floors.length;
    return `${n.toLocaleString('es-MX')} elem.`;
  }

  function gridStep(ctx) {
    const s = ctx.sel, opts = ctx.opts;
    let regions = s.floors.map(f => f.outline);
    if (!regions.length) regions = s.rooms.map(r => r.outline);
    let box = [Infinity, Infinity, -Infinity, -Infinity];
    regions.forEach(o => boxOf(o[0], box));
    if (!isFinite(box[0])) {
      s.walls.forEach(w => boxOf(w.path, box));
      if (!isFinite(box[0])) throw new Error('Este nivel no tiene pisos, rooms ni muros');
      ctx.warnings.push('Sin pisos ni rooms: se analiza todo el rectángulo de los muros.');
      regions = [[[[box[0], box[1]], [box[2], box[1]], [box[2], box[3]], [box[0], box[3]]]]];
    }
    let cell = opts.cell;
    const area = (box[2] - box[0] + 2) * (box[3] - box[1] + 2);
    while (area / (cell * cell) > MAX_CELLS) cell *= 2;
    if (cell !== opts.cell) ctx.warnings.push(`El nivel es grande: la retícula subió a ${cell} m.`);
    const ox = box[0] - 1, oy = box[1] - 1;
    const nx = Math.ceil((box[2] - box[0] + 2) / cell), ny = Math.ceil((box[3] - box[1] + 2) / cell), n = nx * ny;
    const G = ctx.G = {
      cell, ox, oy, nx, ny, n,
      inside: new Uint8Array(n), move: new Uint8Array(n), sight: new Uint8Array(n),
      room: new Int32Array(n).fill(-1), floor: new Int32Array(n).fill(-1)
    };
    const cx = i => ox + (i + 0.5) * cell, cy = j => oy + (j + 0.5) * cell;
    const span = (b, pad) => [
      Math.max(0, Math.floor((b[0] - pad - ox) / cell)), Math.max(0, Math.floor((b[1] - pad - oy) / cell)),
      Math.min(nx - 1, Math.floor((b[2] + pad - ox) / cell)), Math.min(ny - 1, Math.floor((b[3] + pad - oy) / cell))
    ];
    const fillOutline = (outline, fn) => {
      const [i0, j0, i1, j1] = span(boxOf(outline[0]), 0);
      for (let j = j0; j <= j1; j++) for (let i = i0; i <= i1; i++) if (inOutline(cx(i), cy(j), outline)) fn(j * nx + i);
    };
    // pisos (el más alto gana: el piso terminado sobre la losa) y rooms
    const floorTop = new Float32Array(n).fill(-Infinity);
    if (s.floors.length) s.floors.forEach((f, k) => fillOutline(f.outline, c => {
      G.inside[c] = 1; if ((f.top || 0) >= floorTop[c]) { floorTop[c] = f.top || 0; G.floor[c] = k; }
    }));
    else regions.forEach(o => fillOutline(o, c => { G.inside[c] = 1; }));
    s.rooms.forEach((r, k) => fillOutline(r.outline, c => { G.room[c] = k; G.inside[c] = 1; }));
    for (let c = 0; c < n; c++) if (!G.inside[c]) { G.move[c] = 1; G.sight[c] = OPAQUE; }

    const insideAt = (x, y) => {
      const i = Math.floor((x - ox) / cell), j = Math.floor((y - oy) / cell);
      return i >= 0 && j >= 0 && i < nx && j < ny && G.inside[j * nx + i] === 1;
    };
    const exterior = (x, y, nxv, nyv, d) => !insideAt(x + nxv * d, y + nyv * d) || !insideAt(x - nxv * d, y - nyv * d);
    G.insideAt = insideAt;

    // muros: una máscara aparte, porque sus celdas pueden caer fuera del piso (o entre rooms, si no hay pisos)
    // y aun así su vidrio deja ver y sus puertas dejan pasar
    const wallById = {}, wallSight = new Uint8Array(n);
    s.walls.forEach(w => { wallById[w.id] = w; });
    s.walls.forEach(w => {
      const moves = s.wallMoves(w), sees = s.wallSight(w);
      if (!moves && !sees) return;
      const r = Math.max(w.thickness / 2, cell / 2) + 1e-6;
      let glass = 0;
      if (w.curtain && !(Number(sp(ctx.model, w, 'SA_Opaco')) === 1)) {
        const a = w.path[0], b = w.path[w.path.length - 1], L = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1;
        const m = w.path.length === 2 ? [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2] : w.path[Math.floor(w.path.length / 2)];
        glass = exterior(m[0], m[1], -(b[1] - a[1]) / L, (b[0] - a[0]) / L, r + 1) ? GLASS_OUT : GLASS_IN;
      }
      for (let k = 0; k < w.path.length - 1; k++) {
        const a = w.path[k], b = w.path[k + 1];
        const [i0, j0, i1, j1] = span(boxOf([a, b]), r);
        for (let j = j0; j <= j1; j++) for (let i = i0; i <= i1; i++) {
          if (segDist(cx(i), cy(j), a[0], a[1], b[0], b[1]) > r) continue;
          const c = j * nx + i;
          if (moves) G.move[c] = 1;
          if (sees) wallSight[c] = wallSight[c] === OPAQUE || !glass ? OPAQUE : glass;
        }
      }
    });
    for (let c = 0; c < n; c++) if (wallSight[c]) G.sight[c] = wallSight[c];
    // huecos: puertas abren el paso; ventanas y puertas de vidrio dejan ver
    const openingCells = (o, fn) => {
      const host = wallById[o.host], t = host ? host.thickness : 0.3;
      const hw = Math.max(o.width / 2, cell / 2 + 1e-3), hd = Math.max(t / 2, cell / 2) + cell / 2;
      const ux = o.hand[0], uy = o.hand[1], vx = -uy, vy = ux;
      const ext = hw + hd;
      const [i0, j0, i1, j1] = span([o.at[0], o.at[1], o.at[0], o.at[1]], ext);
      for (let j = j0; j <= j1; j++) for (let i = i0; i <= i1; i++) {
        const dx = cx(i) - o.at[0], dy = cy(j) - o.at[1];
        if (Math.abs(dx * ux + dy * uy) <= hw && Math.abs(dx * vx + dy * vy) <= hd) fn(j * nx + i);
      }
      return { hd };
    };
    const okOpening = o => o.at && o.hand && Math.hypot(o.hand[0], o.hand[1]) > 0.5 && o.width > 0;
    G.doorInfo = [];
    s.doors.forEach(d => {
      if (!okOpening(d)) return;
      const host = wallById[d.host], t = host ? host.thickness : 0.3;
      const fx = d.facing ? d.facing[0] : -d.hand[1], fy = d.facing ? d.facing[1] : d.hand[0];
      const ext = exterior(d.at[0], d.at[1], fx, fy, Math.max(t / 2, cell / 2) + cell * 1.5);
      const glass = isGlassName(ctx.model, d) ? (ext ? GLASS_OUT : GLASS_IN) : 0;
      // puerta interior: su hueco es paso aunque caiga entre rooms; puerta al exterior: solo del lado de adentro
      openingCells(d, c => {
        if (!ext) { G.inside[c] = 1; G.move[c] = 0; } else if (G.inside[c]) G.move[c] = 0;
        if (glass && G.sight[c] === OPAQUE) G.sight[c] = glass;
        else if (!ext && G.sight[c] === OPAQUE && !wallSight[c]) G.sight[c] = OPEN;
      });
      G.doorInfo.push({ door: d, exterior: ext, role: roleOf(ctx.model, d), fx, fy, t });
    });
    s.windows.forEach(wn => {
      if (!okOpening(wn)) return;
      const sill = wn.sill == null ? 0.9 : wn.sill, head = wn.head == null ? 2.1 : wn.head;
      if (!(sill < SIGHT_CUT && head > SIGHT_CUT)) return;
      const host = wallById[wn.host], t = host ? host.thickness : 0.3;
      const fx = wn.facing ? wn.facing[0] : -wn.hand[1], fy = wn.facing ? wn.facing[1] : wn.hand[0];
      const ext = exterior(wn.at[0], wn.at[1], fx, fy, Math.max(t / 2, cell / 2) + cell * 1.5);
      // también las celdas de afuera del piso: la visual que llega ahí ya cruzó el vidrio
      openingCells(wn, c => { if (G.sight[c] === OPAQUE) G.sight[c] = ext ? GLASS_OUT : GLASS_IN; });
    });
    // columnas y mobiliario
    s.obstacles.forEach(o => {
      const moves = s.obsMoves(o), sees = s.obsSight(o);
      if (!moves && !sees) return;
      const mark = c => { if (moves) G.move[c] = 1; if (sees) G.sight[c] = OPAQUE; };
      let any = false;
      fillOutline([o.footprint], c => { any = true; mark(c); });
      if (!any) {
        const [x, y] = ringCentroid(o.footprint);
        const i = Math.floor((x - ox) / cell), j = Math.floor((y - oy) / cell);
        if (i >= 0 && j >= 0 && i < nx && j < ny) mark(j * nx + i);
      }
    });
    G.free = new Uint8Array(n);
    let free = 0;
    for (let c = 0; c < n; c++) if (G.inside[c] && !G.move[c]) { G.free[c] = 1; free++; }
    G.freeCount = free;
    return `${free.toLocaleString('es-MX')} celdas`;
  }

  // ---------- grafo ----------
  const D8 = [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [1, -1], [-1, 1], [-1, -1]];
  function dijkstra(G, sources, wantParent) {
    const n = G.n, dist = new Float32Array(n).fill(Infinity), par = wantParent ? new Int32Array(n).fill(-1) : null;
    const hi = new Int32Array(n * 4 + 16), hd = new Float32Array(n * 4 + 16);
    let size = 0;
    const push = (c, d) => {
      let k = size++; hi[k] = c; hd[k] = d;
      while (k > 0) { const p = (k - 1) >> 1; if (hd[p] <= hd[k]) break; swap(p, k); k = p; }
    };
    const swap = (a, b) => { const c = hi[a], d = hd[a]; hi[a] = hi[b]; hd[a] = hd[b]; hi[b] = c; hd[b] = d; };
    const pop = () => {
      const c = hi[0]; size--; hi[0] = hi[size]; hd[0] = hd[size];
      let k = 0;
      for (;;) {
        const l = 2 * k + 1, r = l + 1; let m = k;
        if (l < size && hd[l] < hd[m]) m = l; if (r < size && hd[r] < hd[m]) m = r;
        if (m === k) break; swap(m, k); k = m;
      }
      return c;
    };
    sources.forEach(c => { if (c >= 0 && G.free[c] && dist[c] > 0) { dist[c] = 0; push(c, 0); } });
    const { nx, ny, free } = G, step = G.cell, diag = G.cell * Math.SQRT2;
    while (size) {
      const d0 = hd[0], c = pop();
      if (d0 > dist[c]) continue;
      const i = c % nx, j = (c - i) / nx;
      for (let k = 0; k < 8; k++) {
        const di = D8[k][0], dj = D8[k][1], ii = i + di, jj = j + dj;
        if (ii < 0 || jj < 0 || ii >= nx || jj >= ny) continue;
        const cc = jj * nx + ii;
        if (!free[cc]) continue;
        if (di && dj && (!free[j * nx + ii] || !free[jj * nx + i])) continue;
        const nd = d0 + (di && dj ? diag : step);
        if (nd < dist[cc]) { dist[cc] = nd; if (par) par[cc] = c; push(cc, nd); }
      }
    }
    return { dist, par };
  }
  function nearestFree(G, x, y, maxD, filter) {
    const i0 = Math.floor((x - G.ox) / G.cell), j0 = Math.floor((y - G.oy) / G.cell), R = Math.ceil(maxD / G.cell);
    let best = -1, bd = Infinity;
    for (let j = j0 - R; j <= j0 + R; j++) for (let i = i0 - R; i <= i0 + R; i++) {
      if (i < 0 || j < 0 || i >= G.nx || j >= G.ny) continue;
      const c = j * G.nx + i;
      if (!G.free[c] || (filter && !filter(c))) continue;
      const d = Math.hypot(G.ox + (i + 0.5) * G.cell - x, G.oy + (j + 0.5) * G.cell - y);
      if (d < bd && d <= maxD) { bd = d; best = c; }
    }
    return best;
  }
  function trace(par, from) {
    const out = [];
    for (let c = from, guard = 0; c >= 0 && guard < 1e6; c = par[c], guard++) out.push(c);
    return out;
  }

  function graphStep(ctx) {
    const G = ctx.G, s = ctx.sel, model = ctx.model;
    const cellXY = c => [G.ox + (c % G.nx + 0.5) * G.cell, G.oy + (Math.floor(c / G.nx) + 0.5) * G.cell];
    G.xy = cellXY;
    // accesos: SA_Rol = Entrada; si no hay, las puertas al exterior
    let ent = G.doorInfo.filter(d => d.role === 'entrance');
    if (!ent.length) ent = G.doorInfo.filter(d => d.exterior);
    const seeds = [];
    ent.forEach(d => {
      const o = d.door, off = Math.max(d.t / 2, G.cell / 2) + G.cell;
      [1, -1].forEach(sg => {
        const x = o.at[0] + d.fx * off * sg, y = o.at[1] + d.fy * off * sg;
        if (G.insideAt(x, y)) { const c = nearestFree(G, x, y, 1.5); if (c >= 0) seeds.push({ c, door: o }); }
      });
    });
    if (!seeds.length) {
      const big = s.rooms.slice().sort((a, b) => (b.area || 0) - (a.area || 0))[0];
      if (big) {
        const [x, y] = ringCentroid(big.outline[0]);
        const c = nearestFree(G, x, y, 6);
        if (c >= 0) seeds.push({ c, door: null });
        ctx.warnings.push(`No encontré accesos (puertas al exterior o SA_Rol = Entrada): usé el centro de ${big.name || 'el room más grande'}.`);
      } else ctx.warnings.push('No encontré accesos ni rooms: las distancias no se pueden calcular.');
    }
    G.entrances = seeds;
    const fromEnt = dijkstra(G, seeds.map(x => x.c), true);
    G.dEnt = fromEnt.dist; G.parEnt = fromEnt.par;
    let reach = 0, unreach = 0;
    for (let c = 0; c < G.n; c++) if (G.free[c]) { if (isFinite(G.dEnt[c])) reach++; else unreach++; }
    G.reach = reach; G.unreach = unreach;
    if (seeds.length && unreach * G.cell * G.cell > 4) ctx.warnings.push(`${fmt(unreach * G.cell * G.cell)} m² libres no se alcanzan desde el acceso (¿falta una puerta o un mueble tapa el paso?).`);

    // anclas: un punto libre y alcanzable por room, cerca de su centro
    const anchors = [];
    s.rooms.forEach((r, k) => {
      const [x, y] = ringCentroid(r.outline[0]);
      const c = nearestFree(G, x, y, 30, cc => G.room[cc] === k && isFinite(G.dEnt[cc]));
      if (c >= 0) anchors.push({ c, room: k, w: 1 });
    });
    anchors.sort((a, b) => (s.rooms[b.room].area || 0) - (s.rooms[a.room].area || 0));
    const A = anchors.slice(0, 40);
    G.anchors = A;
    // tráfico: rutas más cortas acceso↔room (peso 3) y room↔room (peso 1)
    const traffic = new Float32Array(G.n);
    const add = (path, w) => path.forEach(c => { traffic[c] += w; });
    A.forEach(a => { if (isFinite(G.dEnt[a.c])) add(trace(G.parEnt, a.c), 3); });
    for (let p = 0; p < A.length; p++) {
      const t = dijkstra(G, [A[p].c], true);
      for (let q = p + 1; q < A.length; q++) if (isFinite(t.dist[A[q].c])) add(trace(t.par, A[q].c), 1);
    }
    let tmax = 0; for (let c = 0; c < G.n; c++) if (traffic[c] > tmax) tmax = traffic[c];
    G.traffic = traffic.map(v => tmax ? v / tmax : 0);
    // ruta más lejana desde el acceso
    let far = -1, fd = -1;
    for (let c = 0; c < G.n; c++) if (G.free[c] && isFinite(G.dEnt[c]) && G.dEnt[c] > fd) { fd = G.dEnt[c]; far = c; }
    G.paths = { farthest: far >= 0 ? { cells: trace(G.parEnt, far), length: fd, room: G.room[far] } : null };
    // ruta de efectivo: bóveda → caja más cercana
    const staff = s.obstacles.filter(o => roleOf(model, o) === 'staff');
    const tellers = staff.filter(o => isTeller(model, o));
    const vaultRoom = s.rooms.findIndex(r => /boveda|vault|caja fuerte|tesorer/.test(norm(r.name)) || norm(r.params && r.params.SA_Rol).indexOf('boveda') >= 0);
    const vaultObs = s.obstacles.find(o => roleOf(model, o) === 'vault');
    let vc = -1;
    if (vaultRoom >= 0) { const [x, y] = ringCentroid(s.rooms[vaultRoom].outline[0]); vc = nearestFree(G, x, y, 30, cc => G.room[cc] === vaultRoom); }
    else if (vaultObs) { const [x, y] = ringCentroid(vaultObs.footprint); vc = nearestFree(G, x, y, 3); }
    G.vault = { cell: vc, room: vaultRoom };
    G.staff = staff.map(o => { const [x, y] = ringCentroid(o.footprint); return { o, c: nearestFree(G, x, y, 2.5), teller: tellers.indexOf(o) >= 0 }; }).filter(x => x.c >= 0);
    if (vc >= 0) {
      const t = dijkstra(G, [vc], true);
      const cands = (tellers.length ? G.staff.filter(x => x.teller) : G.staff).filter(x => isFinite(t.dist[x.c]));
      cands.sort((a, b) => t.dist[a.c] - t.dist[b.c]);
      if (cands[0]) G.paths.cash = { cells: trace(t.par, cands[0].c), length: t.dist[cands[0].c] };
    }
    return `${s.rooms.length} rooms · ${G.doorInfo.length} puertas`;
  }

  // ---------- visibilidad ----------
  /** Recorre la retícula con DDA (Amanatides-Woo): no salta esquinas, así una diagonal de muro no deja pasar la vista. */
  function castRay(G, x0, y0, dx, dy, maxD, visit) {
    const cell = G.cell, gx = (x0 - G.ox) / cell, gy = (y0 - G.oy) / cell;
    let i = Math.floor(gx), j = Math.floor(gy);
    const si = dx > 0 ? 1 : -1, sj = dy > 0 ? 1 : -1;
    const tdx = dx ? Math.abs(1 / dx) : Infinity, tdy = dy ? Math.abs(1 / dy) : Infinity;
    let tx = dx ? (dx > 0 ? (i + 1 - gx) : (gx - i)) * tdx : Infinity;
    let ty = dy ? (dy > 0 ? (j + 1 - gy) : (gy - j)) * tdy : Infinity;
    const maxT = maxD / cell;
    let glass = false;
    for (;;) {
      let t;
      if (tx < ty) { t = tx; tx += tdx; i += si; } else { t = ty; ty += tdy; j += sj; }
      if (t >= maxT) return { d: maxD, kind: 0, glass };
      if (i < 0 || j < 0 || i >= G.nx || j >= G.ny) return { d: t * cell, kind: OPAQUE, glass };
      const c = j * G.nx + i, sv = G.sight[c];
      if (sv === OPAQUE) return { d: t * cell, kind: OPAQUE, glass };
      if (sv === GLASS_OUT) return { d: t * cell, kind: GLASS_OUT, glass };
      if (sv === GLASS_IN) glass = true;
      if (visit) visit(c);
    }
  }

  function visibilityStep(ctx) {
    const G = ctx.G, N = ctx.opts.rays, maxD = 40;
    const iso = new Float32Array(G.n), ext = new Float32Array(G.n), refuge = new Float32Array(G.n);
    const dirs = [];
    for (let k = 0; k < N; k++) { const a = (k + 0.5) / N * 2 * Math.PI; dirs.push([Math.cos(a), Math.sin(a)]); }
    let cells = 0;
    for (let c = 0; c < G.n; c++) {
      if (!G.free[c]) continue;
      cells++;
      const [x, y] = G.xy(c);
      let a = 0, e = 0, r = 0;
      for (let k = 0; k < N; k++) {
        const h = castRay(G, x, y, dirs[k][0], dirs[k][1], maxD, null);
        a += h.d * h.d; if (h.kind === GLASS_OUT) e++; if (h.d < 2) r++;
      }
      iso[c] = a * Math.PI / N; ext[c] = e / N; refuge[c] = r / N;
    }
    G.iso = iso; G.ext = ext; G.refuge = refuge;
    return `${(cells * N).toLocaleString('es-MX')} visuales`;
  }

  function surveillanceStep(ctx) {
    const G = ctx.G;
    let points = G.staff.map(s => ({ c: s.c, kind: 'staff' }));
    if (!points.length) {
      points = G.entrances.map(e => ({ c: e.c, kind: 'entrance' }));
      if (points.length) ctx.warnings.push('Sin puestos de personal (marca SA_Rol = Personal o usa familias de mostrador/escritorio): la vigilancia se mide desde los accesos.');
    }
    const seen = new Uint16Array(G.n), stamp = new Int32Array(G.n).fill(-1), N = 360, maxD = 25;
    points.forEach((p, s) => {
      const [x, y] = G.xy(p.c);
      const visit = c => { if (stamp[c] !== s) { stamp[c] = s; seen[c]++; } };
      visit(p.c);
      for (let k = 0; k < N; k++) { const a = (k + 0.5) / N * 2 * Math.PI; castRay(G, x, y, Math.cos(a), Math.sin(a), maxD, visit); }
    });
    G.watch = points; G.seen = seen;
    return `${points.length} puestos`;
  }

  // ---------- sustentabilidad ----------
  const CAT_ES = { Walls: 'Muros', Floors: 'Pisos', Doors: 'Puertas', Windows: 'Ventanas', Columns: 'Columnas', Furniture: 'Mobiliario', Casework: 'Carpintería', Equipment: 'Equipo', Plumbing: 'Sanitarios', Planting: 'Vegetación', Generic: 'Genérico' };
  const GWP_REF = { Floors: 80, Walls: 120, Furniture: 300, Casework: 300, Doors: 250, Windows: 250 };
  const num = v => { const n = typeof v === 'number' ? v : parseFloat(String(v).replace(',', '.')); return isFinite(n) ? n : null; };
  /** Puntaje 0–1 de un tipo con los SA_ que tenga; null si no tiene ninguno. */
  function typeScore(t) {
    const p = t.params || {};
    const parts = [];
    const gwp = num(p.SA_GWP), rec = num(p.SA_Reciclado), voc = num(p.SA_VOC), epd = num(p.SA_EPD);
    if (gwp != null) parts.push([0.5, Math.max(0, 1 - gwp / (GWP_REF[t.category] || 200))]);
    if (rec != null) parts.push([0.2, Math.max(0, Math.min(1, rec / 100))]);
    if (epd != null) parts.push([0.15, epd ? 1 : 0]);
    if (voc != null) parts.push([0.15, voc <= 50 ? 1 : Math.max(0, 1 - (voc - 50) / 200)]);
    if (!parts.length) return null;
    const w = parts.reduce((a, x) => a + x[0], 0);
    return parts.reduce((a, x) => a + x[0] * x[1], 0) / w;
  }
  /** Tabla de familias: un renglón por tipo usado, con cuántas instancias tiene (en el modelo y en el nivel). */
  function typesTable(model, sel) {
    const count = {}, here = {};
    const tally = (list, cat) => list.forEach(e => {
      if (e.type == null) return;
      count[e.type] = (count[e.type] || 0) + 1;
      if (sel && sel.has(e)) here[e.type] = (here[e.type] || 0) + 1;
      if (model.types[e.type] && !model.types[e.type].category) model.types[e.type].category = cat || e.category;
    });
    tally(model.walls, 'Walls'); tally(model.floors, 'Floors'); tally(model.doors, 'Doors'); tally(model.windows, 'Windows'); tally(model.obstacles);
    return Object.keys(model.types).filter(id => count[id]).map(id => {
      const t = model.types[id], p = t.params || {};
      return {
        id, cat: CAT_ES[t.category] || t.category || 'Otro', category: t.category, fam: t.family || '—', tipo: t.name || '—',
        mark: t.type_mark || '', cost: num(t.cost), gwp: num(p.SA_GWP), rec: num(p.SA_Reciclado), voc: num(p.SA_VOC),
        nrc: num(p.SA_NRC), epd: num(p.SA_EPD), count: count[id] || 0, here: here[id] || 0,
        materials: t.materials || [], params: p, description: t.description || '', manufacturer: t.manufacturer || '', model: t.model || '',
        score: typeScore(t)
      };
    });
  }
  /** Une la tabla de Excel/CSV a los tipos por Type Mark. Las columnas sin prefijo se vuelven SA_<columna>. */
  function applyTable(model, rows) {
    const byMark = {};
    Object.keys(model.types).forEach(id => { const m = norm(model.types[id].type_mark); if (m) (byMark[m] = byMark[m] || []).push(model.types[id]); });
    let hit = 0, miss = 0;
    rows.forEach(r => {
      const keys = Object.keys(r), mk = keys.find(k => /^(type ?mark|marca de tipo|mark|clave)$/i.test(k.trim()));
      const m = mk ? norm(r[mk]) : '';
      if (!m || !byMark[m]) { miss++; return; }
      hit++;
      byMark[m].forEach(t => {
        t.params = t.params || {};
        keys.forEach(k => {
          if (k === mk || r[k] === '' || r[k] == null) return;
          if (/^costo?$/i.test(k.trim()) || /^cost$/i.test(k.trim())) { t.cost = num(r[k]); return; }
          const name = k.trim().indexOf('SA_') === 0 ? k.trim() : 'SA_' + k.trim();
          const n = num(r[k]); t.params[name] = n != null && String(r[k]).trim() !== '' && !/[a-z]{3,}/i.test(String(r[k])) ? n : r[k];
        });
      });
    });
    return { hit, miss };
  }

  function materialsStep(ctx) {
    const G = ctx.G, s = ctx.sel, model = ctx.model;
    const selSet = new Set([].concat(s.walls, s.floors, s.doors, s.windows, s.obstacles));
    const table = typesTable(model, selSet);
    const byId = {}; table.forEach(t => { byId[t.id] = t; });
    // piso por celda → puntaje de su tipo
    const sust = new Float32Array(G.n).fill(NaN);
    for (let c = 0; c < G.n; c++) if (G.free[c] && G.floor[c] >= 0) {
      const t = byId[s.floors[G.floor[c]].type];
      if (t && t.score != null) sust[c] = t.score;
    }
    // puntaje por cantidad: pisos por m², muros por m² de cara, lo demás por pieza
    let wsum = 0, ssum = 0, withData = 0, epd = 0, cost = 0, gwpFloorA = 0, gwpFloorN = 0, costN = 0;
    const qty = {};
    s.floors.forEach(f => { qty[f.type] = (qty[f.type] || 0) + (f.area || ringArea(f.outline[0])); });
    s.walls.forEach(w => { let L = 0; for (let k = 0; k < w.path.length - 1; k++) L += Math.hypot(w.path[k + 1][0] - w.path[k][0], w.path[k + 1][1] - w.path[k][1]); qty[w.type] = (qty[w.type] || 0) + L * Math.max(0, Math.min(w.z[1], s.top) - Math.max(w.z[0], s.e)); });
    [].concat(s.doors, s.windows, s.obstacles).forEach(o => { qty[o.type] = (qty[o.type] || 0) + 1; });
    const used = Object.keys(qty).filter(id => byId[id]);
    used.forEach(id => {
      const t = byId[id], q = qty[id];
      if (t.score != null) { withData++; wsum += q; ssum += q * t.score; }
      if (t.epd) epd++;
      if (t.cost != null) { cost += t.cost * q; costN++; }
      if (t.category === 'Floors' && t.gwp != null) { gwpFloorA += q * t.gwp; gwpFloorN += q; }
    });
    G.sust = sust;
    G.sustInfo = { score: wsum ? ssum / wsum : null, withData, types: used.length, epd, cost: costN ? cost : null, gwpFloor: gwpFloorN ? gwpFloorA / gwpFloorN : null };
    ctx.table = table;
    if (!withData) ctx.warnings.push('Ningún tipo tiene parámetros SA_ (GWP, Reciclado, VOC, EPD): Sustentabilidad queda sin datos. Agrégalos en Revit o carga la tabla de Excel por Type Mark.');
    const inst = s.walls.length + s.floors.length + s.doors.length + s.windows.length + s.obstacles.length;
    return `${used.length} tipos · ${inst} inst.`;
  }

  // ---------- pilares ----------
  const sat = (v, k) => 1 - Math.exp(-v / k);
  function boxBlur(src, G, r) {
    const { nx, ny } = G, tmp = new Float32Array(G.n), out = new Float32Array(G.n);
    for (let j = 0; j < ny; j++) for (let i = 0; i < nx; i++) {
      let s = 0, n = 0; for (let k = -r; k <= r; k++) { const ii = i + k; if (ii >= 0 && ii < nx) { s += src[j * nx + ii]; n++; } }
      tmp[j * nx + i] = s / n;
    }
    for (let j = 0; j < ny; j++) for (let i = 0; i < nx; i++) {
      let s = 0, n = 0; for (let k = -r; k <= r; k++) { const jj = j + k; if (jj >= 0 && jj < ny) { s += tmp[jj * nx + i]; n++; } }
      out[j * nx + i] = s / n;
    }
    return out;
  }
  function fmt(v, d) { return Number(v).toLocaleString('es-MX', { minimumFractionDigits: d || 0, maximumFractionDigits: d || 0 }); }

  function pillarsStep(ctx) {
    const G = ctx.G, s = ctx.sel, A = G.cell * G.cell;
    const r = Math.max(1, Math.round(3 / G.cell));
    let noise = boxBlur(boxBlur(G.traffic, G, r), G, r);
    let nmax = 0; for (let c = 0; c < G.n; c++) if (G.free[c] && noise[c] > nmax) nmax = noise[c];
    noise = noise.map(v => nmax ? v / nmax : 0);
    G.noise = noise;
    const nWatch = Math.max(1, Math.min(2, G.watch.length));
    const F = { flujo: new Float32Array(G.n).fill(NaN), visib: new Float32Array(G.n).fill(NaN), seg: new Float32Array(G.n).fill(NaN), conf: new Float32Array(G.n).fill(NaN), sust: G.sust };
    const day = new Float32Array(G.n);
    for (let c = 0; c < G.n; c++) {
      if (!G.free[c]) continue;
      day[c] = sat(G.ext[c], 0.1);
      F.flujo[c] = isFinite(G.dEnt[c]) ? 1 / (1 + G.dEnt[c] / 20) : 0;
      F.visib[c] = 0.7 * sat(G.iso[c], 60) + 0.3 * day[c];
      F.seg[c] = G.watch.length ? Math.min(1, G.seen[c] / nWatch) : NaN;
      F.conf[c] = 0.5 * day[c] + 0.35 * (1 - noise[c]) + 0.15 * Math.min(1, G.refuge[c] / 0.25);
    }
    G.day = day;
    const mean = f => { let n = 0, t = 0; for (let c = 0; c < G.n; c++) if (G.free[c] && !isNaN(f[c])) { t += f[c]; n++; } return n ? t / n : null; };
    const count = pred => { let n = 0; for (let c = 0; c < G.n; c++) if (G.free[c] && pred(c)) n++; return n; };
    const free = G.freeCount || 1, pct = v => v == null ? null : v * 100;
    const reachD = []; for (let c = 0; c < G.n; c++) if (G.free[c] && isFinite(G.dEnt[c])) reachD.push(G.dEnt[c]);
    const avgD = reachD.length ? reachD.reduce((a, b) => a + b, 0) / reachD.length : null;
    let isoMax = 0; for (let c = 0; c < G.n; c++) if (G.free[c] && G.iso[c] > isoMax) isoMax = G.iso[c];
    const scores = {}, metrics = {};
    ['flujo', 'visib', 'seg', 'conf'].forEach(k => { const m = mean(F[k]); scores[k] = m == null ? null : Math.round(m * 1000) / 10; });
    scores.sust = G.sustInfo.score == null ? null : Math.round(G.sustInfo.score * 1000) / 10;
    const room = k => k >= 0 && s.rooms[k] ? (s.rooms[k].name || s.rooms[k].number || 'room') : 'área sin room';
    // [etiqueta, valor, unidad, decimales, más es mejor, de dónde sale]
    metrics.flujo = [
      ['Distancia media desde el acceso', avgD, 'm', 1, false, 'Dijkstra en retícula · corte 0.50 m'],
      ['Ruta más lejana', G.paths.farthest ? G.paths.farthest.length : null, 'm', 1, false, G.paths.farthest ? 'hasta ' + room(G.paths.farthest.room) : 'sin acceso'],
      ['Ruta de efectivo (bóveda → caja)', G.paths.cash ? G.paths.cash.length : null, 'm', 1, false, G.paths.cash ? 'ruta más corta' : 'falta bóveda o caja en el modelo'],
      ['Área libre inaccesible', G.unreach * A, 'm²', 1, false, 'celdas libres sin ruta al acceso']
    ];
    metrics.visib = [
      ['Isovista media', mean(G.iso), 'm²', 1, true, `${ctx.opts.rays} visuales por celda · corte 1.20 m`],
      ['Isovista máxima', isoMax, 'm²', 0, true, 'la celda que más ve'],
      ['Área con vista al exterior', count(c => G.ext[c] > 0) / free * 100, '%', 0, true, 'visual que sale por vidrio'],
      ['Visuales al exterior', pct(mean(G.ext)), '%', 1, true, 'promedio por celda']
    ];
    metrics.seg = [
      ['Área vigilada', G.watch.length ? count(c => G.seen[c] > 0) / free * 100 : null, '%', 0, true, `${G.watch.length} puestos · alcance 25 m`],
      ['Puntos ciegos', G.watch.length ? count(c => G.seen[c] === 0) * A : null, 'm²', 1, false, 'nadie del personal los ve'],
      ['Puestos de personal', G.staff.length, '', 0, true, 'SA_Rol = Personal o por nombre de familia'],
      ['Profundidad de bóveda', G.vault.cell >= 0 && isFinite(G.dEnt[G.vault.cell]) ? G.dEnt[G.vault.cell] : null, 'm', 1, true, 'recorrido desde el acceso']
    ];
    metrics.conf = [
      ['Área con luz natural', count(c => G.day[c] > 0.5) / free * 100, '%', 0, true, 'proxy por visuales a vidrio exterior'],
      ['Zona de ruido', count(c => G.noise[c] > 0.6) * A, 'm²', 1, false, 'cerca de rutas de alto tráfico'],
      ['Refugio medio', pct(mean(G.refuge)), '%', 0, true, 'visuales que topan a < 2 m'],
      ['Isovista en espera', null, 'm²', 1, true, 'rooms con SA_Rol = Espera']
    ];
    const waitIdx = s.rooms.map((r, k) => /espera|wait|lounge|lobby/.test(norm(r.name)) || norm(r.params && r.params.SA_Rol).indexOf('espera') >= 0 ? k : -1).filter(k => k >= 0);
    if (waitIdx.length) { let n = 0, t = 0; for (let c = 0; c < G.n; c++) if (G.free[c] && waitIdx.indexOf(G.room[c]) >= 0) { t += G.iso[c]; n++; } metrics.conf[3][1] = n ? t / n : null; metrics.conf[3][5] = 'rooms de espera / lounge / lobby'; }
    const si = G.sustInfo;
    metrics.sust = [
      ['Tipos con datos SA_', si.types ? si.withData / si.types * 100 : null, '%', 0, true, `${si.withData} de ${si.types} tipos del nivel`],
      ['GWP promedio en pisos', si.gwpFloor, 'kgCO₂e/m²', 1, false, 'SA_GWP ponderado por área'],
      ['Tipos con EPD', si.types ? si.epd / si.types * 100 : null, '%', 0, true, 'SA_EPD = 1'],
      ['Costo del nivel', si.cost, 'MXN', 0, false, 'Costo × cantidad']
    ];
    // por room
    const rooms = s.rooms.map((rm, k) => {
      const acc = {}; Object.keys(F).forEach(p => { acc[p] = [0, 0]; });
      let cells = 0;
      for (let c = 0; c < G.n; c++) if (G.room[c] === k && G.free[c]) {
        cells++;
        Object.keys(F).forEach(p => { const v = F[p][c]; if (!isNaN(v)) { acc[p][0] += v; acc[p][1]++; } });
      }
      const sc = {}; Object.keys(acc).forEach(p => { sc[p] = acc[p][1] ? Math.round(acc[p][0] / acc[p][1] * 100) : null; });
      return { k, id: rm.id, name: rm.name || rm.number || 'Room', number: rm.number || '', area: rm.area || cells * A, scores: sc, centroid: ringCentroid(rm.outline[0]) };
    });
    ctx.result = {
      model: ctx.model, level: s.level, sel: s, G, fields: F, scores, metrics, rooms, table: ctx.table,
      warnings: ctx.warnings, stage: ctx.model.source.stage
    };
    return `${Object.keys(F).length} pilares`;
  }

  /** Valor de una relación entre dos pilares en una celda: 'and' = ambos altos, 'conflict' = a alto y b bajo. */
  function crossAt(F, a, b, op, c) {
    const va = F[a][c], vb = F[b][c];
    if (isNaN(va) || isNaN(vb)) return NaN;
    return Math.min(va, op === 'conflict' ? 1 - vb : vb);
  }

  const api = { SCHEMA, STAGES, load, levelsOf, select, plan, analyze, typesTable, applyTable, typeScore, crossAt, castRay, dijkstra, roleOf, inOutline, ringArea, ringCentroid, norm, OPEN, OPAQUE, GLASS_IN, GLASS_OUT };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.SAEngine = api;
})(typeof window !== 'undefined' ? window : this);
