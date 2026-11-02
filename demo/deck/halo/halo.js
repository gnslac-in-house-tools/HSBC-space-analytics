/* Halo · generadores SVG y datos de ejemplo del kit de identidad (Computational Design LATAM).
   Sin dependencias. En el navegador expone window.Halo y Halo.montar() llena los elementos con data-h-*.
   En Node se carga con require() para exportar los SVG sueltos.
   Los trazos usan currentColor: dentro de .h-trazo, .h-miniatura o .h-ruta salen en blanco. */
(function (g) {
  'use strict';
  let UID = 0;
  const uid = (p) => 'h' + p + (++UID);
  const f1 = (n) => n.toFixed(1);
  const MONO = "font-family:'JetBrains Mono','Cascadia Mono',Consolas,monospace; font-weight:500; letter-spacing:.08em";
  const DISPLAY = "font-family:'Inter Display','Segoe UI Variable Display','Segoe UI',Arial,sans-serif";
  const abrir = (w, h) => `<svg class="h-svg" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" preserveAspectRatio="xMidYMid meet" aria-hidden="true">`;

  /* tres grosores: línea, línea fina (70 %) y línea de acento */
  const LN = 'fill="none" stroke="currentColor" stroke-width="1.1"';
  const FINO = 'fill="none" stroke="currentColor" stroke-width=".8" stroke-opacity=".7"';
  const ACC = 'fill="none" stroke="currentColor" stroke-width="1.6"';
  const PUNTEADO = 'fill="none" stroke="currentColor" stroke-width="2" stroke-dasharray=".5 7" stroke-linecap="round"';
  const NODO = 'fill="#fff" stroke="currentColor" stroke-width="1.4"';
  const mono = (x, y, t, tam = 9, extra = '') => `<text x="${x}" y="${y}" fill="currentColor" style="${MONO}; font-size:${tam}px" ${extra}>${t}</text>`;

  const HEX = {
    perla: '#F2F2F0', blanco: '#FFFFFF', niebla: '#ECECEE', hero: '#ECECEA', linea: '#DEDEDA', grafito: '#1D1E21', gris: '#5E6166',
    mantequilla: '#F1E17C', durazno: '#F8A082', coral: '#F27751', rosa: '#EE8FB4', lila: '#B7A6EE',
    cielo: '#85BBEF', cobalto: '#3F6FE0', menta: '#7FD6C2', violeta: '#5B539B', lente: '#E3DFDD',
  };

  /* ---------- dibujos de línea: uno por servicio (200 × 160) ---------- */
  const DIBUJOS = {
    contornos() { const cx = 96, cy = 84; let s = abrir(200, 160);
      for (let i = 1; i <= 9; i++) { let d = ''; for (let k = 0; k <= 72; k++) { const t = k / 72 * Math.PI * 2, R = i * 8.6 * (1 + .1 * Math.sin(3 * t + i * .6) + .06 * Math.cos(5 * t - i)); d += (k ? 'L' : 'M') + f1(cx + Math.cos(t) * R * 1.12) + ' ' + f1(cy + Math.sin(t) * R * .8); } s += `<path ${i === 6 ? ACC : FINO} d="${d}Z"/>`; }
      return s + `<circle cx="${cx + 6}" cy="${cy - 4}" r="3" fill="currentColor"/></svg>`; },
    solar() { const cx = 100, cy = 118; let s = abrir(200, 160) + `<ellipse ${LN} cx="${cx}" cy="${cy}" rx="84" ry="26"/>`;
      [[70, 92], [56, 70], [40, 48]].forEach(([ry, rx], i) => { s += `<path ${i === 0 ? ACC : FINO} d="M${cx - rx} ${cy + 8 - i * 6} A${rx} ${ry} 0 0 1 ${cx + rx} ${cy + 8 - i * 6}"/>`; });
      s += `<circle cx="${cx + 52}" cy="${cy - 52}" r="5" fill="currentColor"/>`;
      [['N', cx, cy - 32], ['S', cx, cy + 40], ['E', cx + 92, cy + 4], ['O', cx - 98, cy + 4]].forEach(([t, x, y]) => { s += mono(x, y, t, 9, 'text-anchor="middle"'); });
      return s + '</svg>'; },
    malla() { let s = abrir(200, 160); const P = (u, v) => { const z = Math.sin(u * .55) * Math.cos(v * .5) * 12; return [100 + (u - v) * 8.4, 70 + (u + v) * 4.2 - z]; };
      for (let v = 0; v <= 10; v++) { let d = ''; for (let u = 0; u <= 10; u++) { const p = P(u, v); d += (u ? 'L' : 'M') + f1(p[0]) + ' ' + f1(p[1]); } s += `<path ${v === 5 ? ACC : FINO} d="${d}"/>`; }
      for (let u = 0; u <= 10; u++) { let d = ''; for (let v = 0; v <= 10; v++) { const p = P(u, v); d += (v ? 'L' : 'M') + f1(p[0]) + ' ' + f1(p[1]); } s += `<path ${FINO} d="${d}"/>`; }
      return s + '</svg>'; },
    grafo() { let s = abrir(200, 160); const B = [[14, 30, 'IN'], [14, 98, 'GH'], [86, 62, 'DEF'], [150, 30, 'OUT'], [150, 104, 'LOG']];
      const cable = (a, b, acc) => `<path ${acc ? ACC : LN} d="M${a[0] + 40} ${a[1] + 11} C${a[0] + 66} ${a[1] + 11} ${b[0] - 26} ${b[1] + 11} ${b[0]} ${b[1] + 11}"/>`;
      s += cable(B[0], B[2]) + cable(B[1], B[2]) + cable(B[2], B[3], true) + cable(B[2], B[4]);
      B.forEach((b) => { s += `<rect x="${b[0]}" y="${b[1]}" width="40" height="22" ${LN}/>` + mono(b[0] + 20, b[1] + 15, b[2], 9, 'text-anchor="middle"'); });
      return s + '</svg>'; },
    curva() { let s = abrir(200, 160) + `<path ${LN} d="M24 16 V136 H188"/>`; let d = '';
      const y = (t) => 136 - 108 / (1 + Math.exp(-9 * (t - .45)));
      for (let k = 0; k <= 40; k++) { const t = k / 40; d += (k ? 'L' : 'M') + f1(24 + k * 4) + ' ' + f1(y(t)); }
      s += `<path ${ACC} d="${d}"/>`;
      [[.15, '01'], [.4, '02'], [.65, '03'], [.9, '04']].forEach(([t, l]) => { const x = 24 + t * 160; s += `<circle ${NODO} cx="${f1(x)}" cy="${f1(y(t))}" r="4"/>` + mono(f1(x), 152, l, 9, 'text-anchor="middle"'); });
      return s + '</svg>'; },
  };

  /* ---------- íconos de línea (rejilla de 24) ---------- */
  const ICONOS = {
    territorio: '<path d="M12 21s-6.5-5.7-6.5-11a6.5 6.5 0 0 1 13 0c0 5.3-6.5 11-6.5 11z"/><circle cx="12" cy="10" r="2.4"/>',
    simulacion: '<circle cx="12" cy="12" r="3.6"/><path d="M12 2.5v2.6M12 18.9v2.6M2.5 12h2.6M18.9 12h2.6M5.3 5.3l1.8 1.8M16.9 16.9l1.8 1.8M5.3 18.7l1.8-1.8M16.9 7.1l1.8-1.8"/>',
    generativo: '<circle cx="5" cy="6" r="2.2"/><circle cx="19" cy="6" r="2.2"/><circle cx="12" cy="18" r="2.2"/><path d="M7.2 6h9.6M6.1 8l4.8 8M17.9 8l-4.8 8"/>',
    automatizacion: '<path d="M19.5 12a7.5 7.5 0 0 1-13.2 4.9"/><path d="M4.5 12a7.5 7.5 0 0 1 13.2-4.9"/><path d="M18 3.5v4h-4M6 20.5v-4h4"/>',
    educacion: '<path d="M3 5.5h6a3 3 0 0 1 3 3V20a2.4 2.4 0 0 0-2.4-2.4H3z"/><path d="M21 5.5h-6a3 3 0 0 0-3 3V20a2.4 2.4 0 0 1 2.4-2.4H21z"/>',
    datos: '<path d="M3.5 20.5h17M6.5 20.5v-6M11 20.5V8M15.5 20.5v-9M20 20.5V4"/>',
  };
  const NOMBRE_ICONO = { territorio: 'Territorio', simulacion: 'Simulación', generativo: 'Generativo', automatizacion: 'Automatización', educacion: 'Educación', datos: 'Datos' };
  /* círculo de cada ícono: --x → --y, en orden de cálido a frío */
  const PARES_ICONO = { territorio: ['durazno', 'coral'], simulacion: ['coral', 'rosa'], generativo: ['rosa', 'lila'], automatizacion: ['lila', 'cielo'], educacion: ['cielo', 'cobalto'], datos: ['cobalto', 'menta'] };
  const icono = (k) => `<svg class="h-ico" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONOS[k]}</svg>`;

  /* ---------- servicios: nombre, pastilla, dibujo, ícono y campo ---------- */
  const SERVICIOS = [
    { id: 'territorio', nombre: 'Territorial & Site Intelligence', pastilla: 'Territorial &amp; Site <em>Intelligence</em>', dibujo: 'contornos', campo: ['coral', 'durazno', 'mantequilla'] },
    { id: 'simulacion', nombre: 'Performance Simulation', pastilla: 'Performance <em>Simulation</em>', dibujo: 'solar', campo: ['rosa', 'coral', 'durazno'] },
    { id: 'generativo', nombre: 'Generative & Parametric Design', pastilla: 'Generative &amp; <em>Parametric</em>', dibujo: 'malla', campo: ['lila', 'rosa', 'durazno'] },
    { id: 'automatizacion', nombre: 'Automation & Custom Tools', pastilla: 'Automation &amp; <em>Tools</em>', dibujo: 'grafo', campo: ['cielo', 'lila', 'cobalto'] },
    { id: 'educacion', nombre: 'Education & Enablement', pastilla: 'Education &amp; <em>Enablement</em>', dibujo: 'curva', campo: ['cielo', 'menta', 'cobalto'] },
  ];
  /* orbes del banner: pares --o1/--o2 */
  const PARES_BANNER = [['mantequilla', 'coral'], ['coral', 'lila'], ['lila', 'cielo'], ['cielo', 'cobalto'], ['durazno', 'lila'], ['coral', 'mantequilla']];

  /* ---------- red de soluciones del Hero (1600 × 640) ---------- */
  function ruta(o = {}) {
    const P = [[980, 150], [1130, 300], [1290, 250], [1420, 470]], N = o.nodos || ['Atlas', 'Flujo', 'Brisa', 'Trama'];
    let s = abrir(1600, 640) + `<path ${PUNTEADO} d="M820 300 L1130 300"/><path ${PUNTEADO} d="M${P.map((p) => p.join(' ')).join(' L')}"/>`;
    P.forEach((p, i) => {
      s += `<circle ${NODO} cx="${p[0]}" cy="${p[1]}" r="${i === 1 ? 10 : 6}"/>`;
      s += `<text x="${p[0] + 16}" y="${p[1] + 6}" fill="currentColor" style="${DISPLAY}; font-size:21px; letter-spacing:-.01em">${N[i]}</text>`;
      s += mono(p[0] + 16, p[1] + 26, `SOLUCIÓN 0${i + 1}`, 12.5, 'fill-opacity=".95"');
    });
    return s + '</svg>';
  }

  /* ---------- mapa de lentes (640 × 480) ---------- */
  function lentes(o = {}) {
    const N = o.nodos || ['Atlas', 'Flujo', 'Brisa', 'Trama'];
    const c = o.colores || [HEX.coral, HEX.violeta, HEX.cielo, HEX.lila];
    const L = [
      { cx: 190, cy: 170, rx: 150, ry: 118, rot: -24, c: [c[0], c[1]] },
      { cx: 400, cy: 200, rx: 150, ry: 130, rot: 18, c: [c[3], c[2]] },
      { cx: 240, cy: 330, rx: 118, ry: 88, rot: 12, c: [c[1], c[2]] },
      { cx: 520, cy: 330, rx: 130, ry: 110, rot: -12, c: [c[0], c[3]] },
    ];
    const bl = uid('bl');
    let defs = `<filter id="${bl}"><feGaussianBlur stdDeviation="9"/></filter>`, body = `<rect width="640" height="480" fill="${o.fondo || HEX.lente}"/>`;
    L.forEach((l) => {
      const id = uid('lg');
      defs += `<radialGradient id="${id}" cx="42%" cy="40%" r="62%"><stop offset="0" stop-color="${l.c[0]}" stop-opacity=".95"/><stop offset=".55" stop-color="${l.c[1]}" stop-opacity=".62"/><stop offset="1" stop-color="${l.c[1]}" stop-opacity=".08"/></radialGradient>`;
      body += `<ellipse cx="${l.cx}" cy="${l.cy}" rx="${l.rx}" ry="${l.ry}" transform="rotate(${l.rot} ${l.cx} ${l.cy})" fill="url(#${id})" stroke="${HEX.grafito}" stroke-opacity=".18" style="mix-blend-mode:multiply"/>`;
    });
    body += `<circle cx="470" cy="150" r="180" fill="none" stroke="#fff" stroke-opacity=".5" stroke-width="34" filter="url(#${bl})"/>`;
    const P = [[150, 120], [330, 215], [300, 330], [520, 300]];
    body += `<g style="color:#fff"><path ${PUNTEADO} d="M0 236 L330 236"/><path ${PUNTEADO} d="M${P.map((p) => p.join(' ')).join(' L')}"/>`;
    P.forEach((p, i) => {
      body += `<circle cx="${p[0]}" cy="${p[1]}" r="${i === 1 ? 9 : 5}" fill="#fff"/><text x="${p[0] + 14}" y="${p[1] + 6}" fill="#fff" style="${DISPLAY}; font-size:17px; letter-spacing:-.01em">${N[i]}</text>`;
      body += mono(p[0] + 14, p[1] + 22, `SOLUCIÓN 0${i + 1}`, 9.5, 'fill-opacity=".62"');
    });
    return abrir(640, 480) + `<defs>${defs}</defs>` + body + '</g></svg>';
  }

  /* ---------- área con textura de trazo y medidor anular (640 × 480) ---------- */
  function area(o = {}) {
    const pat = uid('pt'), clip = uid('cl');
    const vals = o.valores || [.72, .48, .34, .18];
    const col = o.colores || [HEX.durazno, HEX.lila, HEX.cielo, HEX.menta];
    let defs = `<pattern id="${pat}" width="8" height="5" patternUnits="userSpaceOnUse"><path d="M0 3 Q2 1 4 3 T8 3" fill="none" stroke="#fff" stroke-opacity=".75" stroke-width=".7"/></pattern>`;
    let body = '';
    vals.forEach((v, i) => {
      const x0 = 24 + i * 152, wd = 142, base = 380, top = base - 60 - v * 260, id = uid('ag');
      defs += `<linearGradient id="${id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${col[i]}"/><stop offset="1" stop-color="${col[i]}" stop-opacity=".25"/></linearGradient><clipPath id="${clip}${i}"><rect x="${x0}" y="60" width="${wd}" height="${base - 60}" rx="16"/></clipPath>`;
      const nx = i < vals.length - 1 ? base - 60 - vals[i + 1] * 260 : top + 30;
      const d = `M${x0} ${base} L${x0} ${top} C${x0 + wd * .35} ${top - 22} ${x0 + wd * .6} ${nx + 26} ${x0 + wd} ${nx} L${x0 + wd} ${base} Z`;
      body += `<g clip-path="url(#${clip}${i})"><path d="${d}" fill="url(#${id})"/><path d="${d}" fill="url(#${pat})"/></g>`;
      body += `<text x="${x0 + wd / 2}" y="${base + 52}" text-anchor="middle" fill="${HEX.grafito}" style="${DISPLAY}; font-weight:300; font-size:34px; letter-spacing:-.04em">${Math.round(v * 100)}<tspan fill="#9A9CA0" style="font-size:20px">%</tspan></text>`;
    });
    const R = 34, C = 2 * Math.PI * R, m = o.medidor == null ? .72 : o.medidor;
    body += `<circle cx="580" cy="62" r="${R}" fill="none" stroke="${HEX.niebla}" stroke-width="9"/><circle cx="580" cy="62" r="${R}" fill="none" stroke="${o.anillo || HEX.lila}" stroke-width="9" stroke-linecap="round" stroke-dasharray="${f1(C * m)} ${f1(C)}" transform="rotate(-90 580 62)"/>`;
    body += `<text x="580" y="70" text-anchor="middle" fill="${HEX.grafito}" style="${DISPLAY}; font-weight:300; font-size:22px">${Math.round(m * 100)}</text>`;
    body += `<text x="24" y="34" fill="${HEX.gris}" style="${MONO}; font-size:11px; letter-spacing:.12em">${o.titulo || '4 EQUIPOS · EJEMPLO'}</text>`;
    return abrir(640, 480) + `<defs>${defs}</defs>` + body + '</svg>';
  }

  /* ---------- barras de encuesta (HTML para .h-barras) ---------- */
  const BARRAS_EJEMPLO = [
    { v: .62, a: 'durazno', b: 'mantequilla', n: 83, t: 'Cuesta revisar normativa a mano en etapas tempranas.' },
    { v: .55, a: 'mantequilla', b: 'cielo', n: 58, t: 'Prefieren recibir el análisis con una recomendación clara.' },
    { v: .44, a: 'cielo', b: 'menta', n: 47, t: 'Ya usan algún script propio en su flujo de trabajo.' },
  ];
  const barras = (arr = BARRAS_EJEMPLO) => arr.map((b) => `<div class="h-barra"><div class="h-esc"><span>0%</span><span>100%</span></div><div class="h-bar"><i style="flex:${b.v}; background:linear-gradient(90deg,var(--h-${b.a}),var(--h-${b.b}))"></i><i style="flex:${f1(1 - b.v)}; background:linear-gradient(90deg,var(--h-${b.b}),var(--h-${b.a})); opacity:.85"></i><b style="left:${b.v * 100}%"></b></div><div class="h-num">${b.n}<span>%</span></div><p>${b.t}</p></div>`).join('');

  /* ---------- capas de vidrio (HTML para .h-vidrio) ---------- */
  const CAPAS_EJEMPLO = [
    { l: '4%', t: 'GEOMETRÍA' },
    { l: '20%', t: 'ANÁLISIS', bg: 'linear-gradient(160deg, rgba(255,255,255,.4), color-mix(in srgb, var(--h-durazno) 58%, transparent))' },
    { l: '36%', t: 'OPCIONES' },
    { l: '52%', t: 'DATOS', bg: 'linear-gradient(170deg, color-mix(in srgb, var(--h-cielo) 62%, transparent), rgba(255,255,255,.35))' },
    { l: '68%', t: 'DECISIÓN', bg: 'rgba(255,255,255,.7)', cifra: '48%' },
  ];
  const vidrio = (arr = CAPAS_EJEMPLO) => arr.map((c) => `<div class="h-capa" style="left:${c.l}${c.bg ? '; background:' + c.bg : ''}">${c.t}${c.cifra ? `<div>${c.cifra}</div>` : ''}</div>`).join('');

  /* ---------- montar: llena los elementos con data-h-* ---------- */
  function montar(raiz) {
    const r = raiz || document;
    const todos = (sel) => Array.from(r.querySelectorAll(sel));
    todos('[data-h-dibujo]').forEach((el) => { el.innerHTML = DIBUJOS[el.dataset.hDibujo](); });
    todos('[data-h-icono]').forEach((el) => { el.innerHTML = icono(el.dataset.hIcono); });
    todos('[data-h-ruta]').forEach((el) => { el.innerHTML = ruta(); });
    todos('[data-h-lentes]').forEach((el) => { el.innerHTML = lentes(); });
    todos('[data-h-area]').forEach((el) => { el.innerHTML = area(); });
    todos('[data-h-barras]').forEach((el) => { el.innerHTML = barras(); });
    todos('[data-h-vidrio]').forEach((el) => { el.innerHTML = vidrio(); });
  }

  const Halo = { HEX, DIBUJOS, ICONOS, NOMBRE_ICONO, PARES_ICONO, SERVICIOS, PARES_BANNER, BARRAS_EJEMPLO, CAPAS_EJEMPLO, dibujo: (k) => DIBUJOS[k](), icono, ruta, lentes, area, barras, vidrio, montar };
  g.Halo = Halo;
  if (typeof module === 'object' && module.exports) module.exports = Halo;
})(typeof window !== 'undefined' ? window : globalThis);
