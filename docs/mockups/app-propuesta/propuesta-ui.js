/* ===================== PROPUESTA (mockup) =====================
 * Se inserta dentro de app.js (build.py) y reemplaza el tablero, el inspector, la leyenda y el Resumen.
 * Las originales quedan como renderBoard0, renderInspector0, renderLegend0 y renderDigest0. */
const PX = window.SAProp, PXT = PX.THEMES, PXK = PXT.map(t => t.k);
PXT.forEach(t => { BY[t.k] = Object.assign({}, BY[t.k] || {}, t, {target: 70}); ICON[t.k] = t.ic; });
S.px = {type: 'all', mix: 'visitas', counts: null, of: null, supOpen: false, hallOpen: false, mode: 'exp', last: {exp: null, sus: null}, fold: {}};
// laptop (14"): sin scroll. Lo secundario queda plegado y en cada panel se abre un plegado a la vez (details name)
const pxMQ = matchMedia('(max-height:1100px)'); pxMQ.onchange = () => { if (S.res) renderAll(); };
const pxGroup = g => pxMQ.matches ? ` name="${g}"` : '';
const pxFoldOpen = id => S.px.fold[id] != null ? S.px.fold[id] : !pxMQ.matches;
const foldSec = (id, title, sum, body) => `<details class="sec prio pxfold" data-fold="${id}"${pxGroup('pxi')}${pxFoldOpen(id) ? ' open' : ''}><summary><span class="eyebrow">${title}</span>${sum ? `<span class="pxsum">${sum}</span>` : ''}</summary>${body}</details>`;
S.focus = {type: 'pillar', k: 'orient'};
const isTh = k => PXK.indexOf(k) >= 0;
const rnd = v => v == null || !isFinite(v) ? null : Math.round(v);
const rate70 = v => v == null ? null : v >= 70 ? 'ok' : v >= 40 ? 'mid' : 'low';
const famDots = fam => dots(...PXT.filter(t => t.fam === fam).map(t => t.c1));
const tl = t => `<span class="tl" style="--c:${PX.TYPES[t].c}" title="${PX.TYPES[t].n}">${t}</span>`;
function pxNow() { const r = S.res; if (!r) return null; if (!r._sp) r._sp = PX.spatial(r, E);
 if (S.px.of !== r) { S.px.of = r; S.px.counts = Object.assign({}, r._sp.counts); }
 const X = PX.score(r._sp, {counts: S.px.counts, mix: S.px.mix}); Object.assign(r.fields, X.fields); r._px = X; return X; }
const thScore = (X, k) => { const v = X.th[k]; return v == null ? null : PX.TH[k].fam === 'sus' || S.px.type === 'all' ? v.all : v[S.px.type]; };

function thRow(X, t, tag) { tag = tag || 'button'; const sc = rnd(thScore(X, t.k)), rt = rate70(sc), on = tag === 'button' && S.focus.type === 'pillar' && S.focus.k === t.k;
 return `<${tag} class="row${on ? ' on' : ''}" data-th="${t.k}"${tag === 'button' ? ` aria-pressed="${on}"` : ''} style="--c:${t.c1}" title="${esc(t.q)}">
  <span class="lab">${pIcon(t.k, 15)}<span>${t.name}</span></span><span class="end">${rt ? `<span class="pst">${sIcon(rt)}${RATE_S[rt]}</span>` : '<span class="pst none">Sin datos</span>'}<span class="val">${sc == null ? '—' : sc}</span></span>
  <span class="b4 ind full" aria-hidden="true"><i style="width:${sc || 0}%"></i><em style="left:70%"></em></span></${tag}>`; }
function ixInner(fam, v, sub, ic) { const sc = rnd(v), rt = rate70(sc);
 return `<span class="eyebrow">${ic || famDots(fam)}<span>${PX.FAM[fam].idx}</span></span><span class="val xl">${sc == null ? '—' : sc}<small>/ 100</small></span>${rt ? `<span class="pst">${sIcon(rt)}${RATE_S[rt]}</span>` : '<span class="pst none">Sin datos</span>'}<span class="b4 l"><i style="width:${sc || 0}%"></i><em style="left:70%"></em></span><span class="meta">${sub}</span>`; }
const ixSub = (X, fam) => fam === 'exp' ? 'Índice potencial · modelado con demanda supuesta' : `Índice potencial · ${fmt(X.m.cepd.v)} % del carbono con EPD`;
function ixBlock(X) { const one = (fam, v) => `<div class="ixc" style="--c:${PX.FAM[fam].c}">${ixInner(fam, v, ixSub(X, fam))}</div>`;
 return `<div class="ix2">${one('exp', X.exp)}${one('sus', X.sus)}</div>`; }
// los dos índices son el interruptor de modo: el activo lleva la palomita, el borde y el fondo de su color; el otro, un círculo vacío y gris
const PXCK = '<span class="pxck" aria-hidden="true"><svg viewBox="0 0 12 12"><path d="M2.5 6.3 5 8.7l4.5-5"/></svg></span>';
function modeTabs(X) { const one = (fam, v) => { const on = S.px.mode === fam;
  return `<button class="ixc pxtab" data-mode="${fam}" aria-pressed="${on}" style="--c:${PX.FAM[fam].c}" title="${on ? 'Estás viendo' : 'Cambiar a'} ${PX.FAM[fam].n}">${ixInner(fam, v, ixSub(X, fam), PXCK)}</button>`; };
 return `<div class="ix2 pxtabs" role="group" aria-label="Modo">${one('exp', X.exp)}${one('sus', X.sus)}</div>`; }
// el modo sale del tema enfocado; cada modo recuerda su último tema. Las relaciones hablan del cliente: solo en Experiencia
function pxSync() { const f = S.focus; if (f.type === 'rel') S.px.mode = 'exp'; else if (f.type === 'pillar' && isTh(f.k)) { S.px.mode = PX.TH[f.k].fam; S.px.last[S.px.mode] = f.k; }
 const m = S.px.mode, isExp = m === 'exp'; document.documentElement.style.setProperty('--pxm', PX.FAM[m].c);
 $('prels').closest('.sec').hidden = !isExp;
 if ($('lsenses').hidden) { $('lp-h').textContent = PX.FAM[m].n; $('lp-p').textContent = isExp ? 'Cómo vive la sucursal cada tipo de cliente. Clic en un tema para pintarlo en el plano.' : 'Lo que aportan los elementos y el espacio. Clic en un tema para pintarlo en el plano.'; } }
function pxSetMode(m) { if (S.px.mode === m) return; S.px.mode = m; const X = pxNow(), val = t => { const v = thScore(X, t.k); return v == null ? Infinity : v; };
 const k = S.px.last[m] || PXT.filter(t => t.fam === m).reduce((a, t) => val(t) < val(a) ? t : a).k;
 S.hlRooms = []; S.path = null; S.broute = null; S.mark = null; focus('pillar', k); Snd.tone(BY[k].f, 1.2, .04); }
function supBlock() { const mw = PX.mixW(S.px.mix);
 return `<details class="sec prio" id="px-sup"${pxGroup('pxl')}${S.px.supOpen ? ' open' : ''}><summary><span class="eyebrow">Supuestos de demanda</span><span class="pxsum mono">${PX.TK.map(t => Math.round(mw[t] * 100)).join(' / ')}</span></summary>
  <p>Quién llega a la sucursal. <b>No sale de datos de HSBC</b>: es el escenario supuesto y se reemplaza cuando haya transacciones por canal y tickets del sistema de filas.</p>
  <div class="list div">${PX.TK.map(t => `<div class="row kv"><span class="lab">${tl(t)}<span>${PX.TYPES[t].n} · ${PX.TYPES[t].d}</span></span><span class="end"><span class="meta">${PX.TYPES[t].t}</span><span class="val s">${Math.round(PX.MIX[t] * 100)} %</span></span></div>`).join('')}</div>
  <div class="ly-row"><span>Combinar los tipos por</span><span class="seg" id="px-mix"><button data-mix="visitas" aria-pressed="${S.px.mix !== 'tiempo'}">Visitas</button><button data-mix="tiempo" aria-pressed="${S.px.mix === 'tiempo'}">Tiempo</button></span></div>
  <p class="meta pxn">${S.px.mix === 'tiempo' ? `Por <b>tiempo</b> pesa más quien se queda más (3.5, 17.5 y 45 min de visita): <b>${PX.TK.map(t => Math.round(mw[t] * 100)).join(' / ')}</b>.` : 'Por <b>visitas</b> cada cliente cuenta igual: la mitad son Express.'} Hora pico: <b>${PX.PEAK} clientes/h</b>. Asesoría: <b>${Math.round(PX.APPT * 100)} %</b> llega con cita.</p></details>`; }
function hallBlock(X, eye, finds) { const F = finds || X.finds;
 return `<details class="sec prio" id="px-hall"${pxGroup('pxl')}${S.px.hallOpen ? ' open' : ''}><summary><span class="eyebrow">Hallazgos</span><span class="pxsum mono">${F.length} · por regla</span></summary>
  <p>Cada uno sale de una <b>regla fija</b> sobre una métrica: aparece cuando su puntaje baja de 70 (mejorar) o de 40 (atención). El texto es una plantilla con el valor medido; no lo redacta una IA.</p>
  <div class="list div">${F.map((f, i) => `<div class="row m" style="--c:${BY[f.x.th].c1}"><span class="lab">${pIcon(f.x.th, 14)}<span>${esc(f.msg)}</span></span><span class="end">${eye ? `<button class="ib sm" data-fd="${i}" aria-label="Ver en el plano" title="Ver en el plano">${EYE}</button>` : ''}</span>
   <div class="full mt">${f.sev === 'info' ? '<span class="pst none">Info</span>' : `<span class="pst">${sIcon(f.sev)}${RATE_S[f.sev]}</span>`}<span class="meta src">${f.rule}</span></div></div>`).join('')}</div></details>`; }
function wireDetails(root) { [['px-sup', 'supOpen'], ['px-hall', 'hallOpen']].forEach(([id, k]) => { const d = root.querySelector('#' + id); if (d) d.ontoggle = () => { S.px[k] = d.open; }; }); }

function renderBoard() { renderBoard0(); const b = $('pxboard'), more = $('pxmore'); if (!b) return; pxSync();
 if (!S.res) { b.innerHTML = '<section class="sec"><p class="meta">Carga un modelo para ver su diagnóstico.</p></section>'; more.innerHTML = ''; return; }
 const X = pxNow(), m = S.px.mode, finds = X.finds.filter(f => PX.TH[f.x.th].fam === m), themes = PXT.filter(t => t.fam === m).map(t => thRow(X, t)).join('');
 b.innerHTML = `<section class="sec">${modeTabs(X)}</section>` + (m === 'exp'
  ? `<section class="sec pxpara"><div class="sec-h"><span class="eyebrow">Usuario</span><span class="sec-m">${S.px.type === 'all' ? 'los tres tipos combinados' : `${PX.TYPES[S.px.type].d} · ${PX.TYPES[S.px.type].t}`}</span></div>
   <span class="seg pxty" role="group" aria-label="Tipo de cliente">${[['all', 'Todos']].concat(PX.TK.map(t => [t, PX.TYPES[t].s])).map(([k, n]) => `<button data-ty="${k}" aria-pressed="${S.px.type === k}" title="${k === 'all' ? 'Los tres tipos combinados' : esc(PX.TYPES[k].n + ' · ' + PX.TYPES[k].d + ' · ' + PX.TYPES[k].t)}">${n}</button>`).join('')}</span>
   <div class="list">${themes}</div></section>`
  : `<section class="sec"><div class="sec-h"><span class="eyebrow">Elementos del modelo</span><span class="sec-m">del schedule de Revit</span></div>
   <div class="list">${themes}</div></section>`);
 more.innerHTML = (m === 'exp' ? supBlock() : '') + hallBlock(X, true, finds);
 b.querySelectorAll('[data-mode]').forEach(x => x.onclick = () => pxSetMode(x.dataset.mode));
 b.querySelectorAll('[data-th]').forEach(x => x.onclick = () => { const k = x.dataset.th; S.hlRooms = []; focus('pillar', k); Snd.tone(BY[k].f, 1.2, .04); });
 b.querySelectorAll('[data-ty]').forEach(x => x.onclick = () => { S.px.type = x.dataset.ty; renderAll(); Snd.click(); });
 more.querySelectorAll('[data-mix]').forEach(x => x.onclick = () => { S.px.mix = x.dataset.mix; renderAll(); Snd.click(); });
 more.querySelectorAll('[data-fd]').forEach(x => x.onclick = () => { const f = finds[+x.dataset.fd], G = S.res.G; let ks = f.zone || [];
  if (!ks.length && f.at) { const i = Math.floor((f.at[0] - G.ox) / G.cell), j = Math.floor((f.at[1] - G.oy) / G.cell), c = j * G.nx + i; if (G.room[c] >= 0) ks = [G.room[c]]; }
  S.hlRooms = ks; S.path = f.x.path || null; S.mark = f.x.id === 'blind' || f.x.id === 'vig' ? 'blind' : null; focus('pillar', f.x.th); });
 wireDetails(more); }

function metRow(x, X) { const r = X.m[x.id], s = r.s, rt = x.ctx ? null : rate70(s), vt = r.v == null ? '—' : x.txt ? x.txt(r.v, S.res._sp) : fmt(r.v, x.d);
 const ly = x.path ? `path:${x.path}` : x.id === 'blind' ? 'mark:blind' : null;
 const eye = ly ? `<button class="ib sm" data-ly="${ly}" aria-pressed="false" aria-label="Ver ${x.n.toLowerCase()} en el plano">${EYE}</button>` : '<span class="ib-ph"></span>';
 const unit = x.u === 'ρ' ? '' : x.u;
 const rng = x.ctx ? '' : x.id === 'efic' ? 'ideal 0.80–1.00 · 0.40 o 1.30 dan 0' : `bueno ${x.rt ? x.rt[1] : fmt(x.good, x.d) + (x.u ? ' ' + x.u : '')} · malo ${x.rt ? x.rt[0] : fmt(x.poor, x.d) + (x.u ? ' ' + x.u : '')}`;
 const id = 'm:' + x.id;
 return `<details class="pxmd" data-fold="${id}"${pxGroup('pxi')}${pxFoldOpen(id) ? ' open' : ''} style="--c:${BY[x.th].c1}"><summary class="row m pxm"><span class="lab"><span title="${esc(x.n)}">${x.n}</span></span><span class="end"><span class="val">${vt}<small>${unit}</small></span>${eye}</span>
  ${x.ctx ? '' : `<span class="b4 ind full" aria-hidden="true"><i style="width:${s || 0}%"></i><em style="left:70%"></em></span>`}
  <span class="full pxmst">${rt ? `<span class="pst">${sIcon(rt)}${RATE_S[rt]} · ${s} pts</span>` : x.ctx ? '<span class="pst none">Contexto · no suma puntos</span>' : ''}</span></summary>
  <div class="pxmb mt">${rng ? `<span class="meta">${rng}</span>` : ''}<span class="meta src">${x.what}</span>
   <span class="pxo"><span class="og" title="De dónde sale el dato">${x.src}</span>${x.ty ? Object.keys(x.ty).map(tl).join('') : ''}</span>
   ${!x.ctx && s != null && s < 70 ? `<p class="pxc"><b>${esc(x.msg(r.v, S.res._sp))}</b> ${esc(x.sug)}</p>` : ''}</div></details>`; }

function renderInspector() { if (S.res) pxSync(); if (!S.res || S.focus.type !== 'pillar' || !isTh(S.focus.k)) { renderInspector0(); const e = S.res && document.querySelector('#insp-h .eyebrow'); if (e) e.textContent = `${PX.FAM[S.px.mode].idx} · ${e.textContent}`; return; }
 const box = $('insp'), X = pxNow(), t = PX.TH[S.focus.k], k = t.k, sc = rnd(thScore(X, k)), rt = rate70(sc), fam = PX.FAM[t.fam], ty = S.px.type, isExp = t.fam === 'exp', mw = PX.mixW(S.px.mix), gap = sc == null ? null : 70 - sc;
 inspHead(fam.n, `${pIcon(k, 17)}<span>${t.name}</span>`, `“${esc(t.q)}”`, t.c1);
 let h = `<section class="sec"><div class="hero hk" style="--c:${t.c1}">
  <div class="hk-top"><span class="val xl">${sc == null ? '—' : sc}<small>/ 100</small></span>${pill(rt)}</div>
  <span class="b4 l"><i style="width:${sc || 0}%"></i><em style="left:70%"></em></span>
  <div class="hk-m meta"><span>cumple desde <b>70</b></span><span>${gap == null ? '' : gap > 0 ? `faltan <b>${gap}</b> puntos` : gap < 0 ? `<b>${-gap}</b> sobre 70` : 'justo en 70'}</span></div>
  <p class="meta hk-d">${isExp ? ty === 'all' ? `Para los tres tipos de cliente, combinados por ${S.px.mix === 'tiempo' ? 'tiempo en sucursal' : 'visitas'}.` : `Para el cliente <b>${PX.TYPES[ty].n}</b>: pesa <b>${Math.round(PX.TW[ty][k] * 100)} %</b> en su experiencia.` : `Pesa <b>${Math.round(PX.SPIW[k] * 100)} %</b> en Sustentabilidad potencial.`}</p></div></section>`;
 if (isExp) {
  if (ty === 'all') h += `<section class="sec pxcomo"><div class="sec-h"><span class="eyebrow">Cómo sale</span><span class="sec-m">usuario · peso · puntos</span></div><div class="list">${PX.TK.map(T => { const v = rnd(X.th[k][T]); return `<button class="row s" data-ty="${T}" style="--c:${t.c1}" title="Ver solo ${PX.TYPES[T].n}"><span class="lab">${tl(T)}<span>${PX.TYPES[T].s} · ${Math.round(mw[T] * 100)} %</span></span><span class="b4"><i style="width:${v || 0}%"></i><em style="left:70%"></em></span><span class="val s">${v == null ? '—' : v}</span></button>`; }).join('')}</div></section>`;
  else { const ms = PX.MET.filter(x => x.th === k && x.ty && x.ty[ty]), tot = ms.reduce((a, x) => a + x.ty[ty], 0);
   h += `<section class="sec pxcomo"><div class="sec-h"><span class="eyebrow">Cómo sale</span><span class="sec-m">métrica · peso · puntos</span></div><div class="list">${ms.map(x => { const v = X.m[x.id].s; return `<div class="row s" style="--c:${t.c1}"><span class="lab"><span>${x.n} · ${Math.round(x.ty[ty] / tot * 100)} %</span></span><span class="b4"><i style="width:${v || 0}%"></i><em style="left:70%"></em></span><span class="val s">${v == null ? '—' : v}</span></div>`; }).join('')}</div></section>`; } }
 if (k === 'espera') { const c0 = S.res._sp.counts;
  h += foldSec('whatif', '¿Qué pasa si…?', 'puntos de servicio', `<div class="list div">${[['atm', 'ATMs'], ['caja', 'Cajas'], ['ases', 'Asesores']].map(([kk, n]) => `<div class="row kv"><span class="lab"><span>${n}</span></span><span class="end"><span class="meta">${S.px.counts[kk] === c0[kk] ? 'como en el modelo' : `modelo: ${c0[kk]}`}</span><span class="step pxst"><button data-ct="${kk}" data-d="-1" aria-label="Uno menos">−</button><span>${S.px.counts[kk]}</span><button data-ct="${kk}" data-d="1" aria-label="Uno más">+</button></span></span></div>`).join('')}</div>
   <p class="meta pxn">Este tema depende de <b>cuántos</b> puntos de servicio hay, no de <b>dónde</b> están: sirve para dimensionar, no califica la distribución.</p>`); }
 const ms = PX.MET.filter(x => x.th === k && (ty === 'all' || !x.ty || x.ty[ty]));
 h += `<section class="sec"><div class="sec-h"><span class="eyebrow">Métricas</span><span class="sec-m">valor · puntaje · de dónde sale</span></div><div class="list div">${ms.map(x => metRow(x, X)).join('')}</div></section>`;
 if (k === 'carb') h += foldSec('carbtop', 'Lo que más aporta', 'kgCO₂e · origen', `<div class="list div">${S.res._sp.sus.list.slice(0, 6).map(i => `<div class="row kv"><span class="lab"><span>${esc(i.n)}</span></span><span class="end"><span class="og">${i.src}</span><span class="val s">${fmt(i.act)}</span></span></div>`).join('')}</div>`);
 if (k === 'amb') h += foldSec('proxy', 'Cómo se estima', 'proxy', `<p><b>Proxy.</b> Por ahora la luz se estima con la vista al vidrio exterior. Después, sDA (300 lux, 50 % de las horas) con Radiance y los edificios vecinos.</p>`);
 if (t.fam === 'sus') h += foldSec('revisar', 'Por revisar', 'con Fabiola', `<p><b>Por revisar con Fabiola:</b> factores genéricos, línea base y umbrales de este tema.</p>`);
 h += `<section class="sec pxplano"><div class="sec-h"><span class="eyebrow">En el plano</span></div><p>${t.unit[0].toUpperCase() + t.unit.slice(1)}.</p></section>`;
 box.innerHTML = h; syncLayers();
 box.querySelectorAll('[data-fold]').forEach(d => d.ontoggle = () => { S.px.fold[d.dataset.fold] = d.open; });
 box.querySelectorAll('[data-ty]').forEach(b => b.onclick = () => { S.px.type = b.dataset.ty; renderAll(); Snd.click(); });
 box.querySelectorAll('[data-ct]').forEach(b => b.onclick = () => { const kk = b.dataset.ct; S.px.counts[kk] = Math.max(0, Math.min(9, S.px.counts[kk] + +b.dataset.d)); renderAll(); Snd.click(); });
 box.querySelectorAll('[data-ly]').forEach(b => b.onclick = e => { e.preventDefault(); const [tt, v] = b.dataset.ly.split(':');
  if (tt === 'path') { if (S.path === v) { S.path = null; renderViewport(); } else showPath(v); } else if (S.mark === v) { S.mark = null; renderViewport(); } else showMark(v); }); }

/* ===================== cómo nace cada tema =====================
 * La animación no decora: el orden en que aparece cada celda sale del mismo dato con el que se calcula el tema.
 * pxOrigin(k) da, por celda, cuándo aparece (t, de 0 a 1), de dónde nace (src) y la frase que lo explica.
 * Se reproduce al cambiar de tema o de análisis; mover capas o hacer zoom no la repite. ?lento=8 la hace 8 veces más lenta. */
const PXREDUCE = matchMedia('(prefers-reduced-motion: reduce)'), PXSLOW = +new URLSearchParams(location.search).get('lento') || 1, PX_GLASS_OUT = 3; // GLASS_OUT del motor
// alias: los pilares de la presentación nacen igual que el tema que miden
const PXALIAS = {flujo: 'orient', sust: 'carb', conf: 'amb'};
const PXCAP = {flujo: 'Nace en la entrada · avanza caminando', conf: 'Nace en los vidrios, lejos del paso · luz y calma', visib: 'Nace en lo más abierto · hacia los rincones', sust: 'Nace en los elementos del schedule · primero lo que más CO₂ aporta'};
function pxOrigin(k, r) { r._org = r._org || {}; if (r._org[k]) return r._org[k];
 const G = r.G, sp = r._sp, s = r.sel, m = r.model, n = G.n, val = r.fields[k], t = new Float32Array(n).fill(1), o = {t, t2: null, a1: 1, src: [], cap: '', D: 1900, W: .16}, kk = PXALIAS[k] || k;
 const has = c => G.free[c] && !isNaN(val[c]);
 // desde cada punto, lo que alcanza a ver: visit(celda, distancia, dx, dy)
 const rays = (x, y, maxD, visit) => { for (let q = 0; q < 360; q++) { const a = (q + .5) / 360 * 2 * Math.PI; E.castRay(G, x, y, Math.cos(a), Math.sin(a), maxD, c => { const [p, u] = G.xy(c); visit(c, Math.hypot(p - x, u - y), p - x, u - y); }); } };
 const north = (dx, dy) => { const a = Math.atan2(dx, dy); return (a < 0 ? a + 2 * Math.PI : a) / (2 * Math.PI); }; // 0 = norte, en sentido de las manecillas
 if (kk === 'orient') { // la onda camina desde la puerta: dEnt es la ruta más corta, esquivando muros y muebles
  let mx = 1; for (let c = 0; c < n; c++) if (has(c) && isFinite(G.dEnt[c]) && G.dEnt[c] > mx) mx = G.dEnt[c];
  for (let c = 0; c < n; c++) if (has(c) && isFinite(G.dEnt[c])) t[c] = G.dEnt[c] / mx;
  o.src = G.entrances.map(e => { const [x, y] = G.xy(e.c); return {x, y, at: 0}; }); o.cap = 'Nace en la entrada · avanza caminando';
 } else if (kk === 'espera') { // cada zona se llena desde sus puntos de servicio: primero lo rápido, al final la asesoría
  const pts = {E: sp.atms, T: sp.tells, A: sp.seats}, st = {E: 0, T: .18, A: .36}, mx = {E: 1, T: 1, A: 1}, d = new Float32Array(n);
  for (const c in sp.svcRoom) { const ty = sp.svcRoom[c]; if (!ty || !pts[ty].length) continue; const [x, y] = G.xy(+c); let b = Infinity; pts[ty].forEach(p => { const v = Math.hypot(p.x - x, p.y - y); if (v < b) b = v; }); d[c] = b; if (b > mx[ty]) mx[ty] = b; }
  for (const c in sp.svcRoom) { const ty = sp.svcRoom[c]; if (ty) t[c] = st[ty] + .64 * d[c] / mx[ty]; }
  PX.TK.forEach(ty => pts[ty].forEach(p => o.src.push({x: p.x, y: p.y, at: st[ty]}))); o.cap = 'Nace en cada ATM, caja y mesa · se llena con la demanda'; o.D = 2000;
 } else if (kk === 'priv') { // un anillo por asiento o ventanilla, solo hasta donde hay vista; se apaga a los 8 m, como la métrica
  const ps = sp.seats.concat(sp.tells);
  ps.forEach((p, i) => { const at = i / Math.max(1, ps.length) * .5; o.src.push({x: p.x, y: p.y, at}); rays(p.x, p.y, 8, (c, dd) => { const v = at + dd / 8 * .5; if (v < t[c]) t[c] = v; }); });
  o.cap = 'Nace en cada asiento y ventanilla · hasta donde alcanza la vista'; o.D = 2100;
 } else if (kk === 'seg') { // un radar por puesto: la primera mirada pinta a medias y la última completa; donde se traslapan, se intensifica
  const t2 = new Float32Array(n), N = G.watch.length, span = .45;
  G.watch.forEach((p, i) => { const [x, y] = G.xy(p.c), at = i / Math.max(1, N) * .55; o.src.push({x, y, at, span, R: 8}); rays(x, y, 25, (c, dd, dx, dy) => { const v = at + span * north(dx, dy); if (v < t[c]) t[c] = v; if (v > t2[c]) t2[c] = v; }); });
  for (let c = 0; c < n; c++) if (t2[c] < t[c]) t2[c] = t[c];
  o.t2 = t2; o.a1 = .55; o.cap = 'Nace en cada puesto de personal · lo que alcanza a ver'; o.D = 2400;
 } else if (kk === 'amb') { // la luz entra por el vidrio exterior y avanza por donde no hay nada opaco
  const h = new Int32Array(n).fill(-1), q = new Int32Array(n); let a = 0, b = 0, mx = 1;
  for (let c = 0; c < n; c++) if (G.sight[c] === PX_GLASS_OUT) { h[c] = 0; q[b++] = c; }
  while (a < b) { const c = q[a++], i = c % G.nx, j = (c - i) / G.nx; for (let dj = -1; dj <= 1; dj++) for (let di = -1; di <= 1; di++) { const ii = i + di, jj = j + dj; if (ii < 0 || jj < 0 || ii >= G.nx || jj >= G.ny) continue; const cc = jj * G.nx + ii; if (h[cc] >= 0 || G.sight[cc] === 1) continue; h[cc] = h[c] + 1; q[b++] = cc; } }
  for (let c = 0; c < n; c++) if (has(c) && h[c] > mx) mx = h[c];
  for (let c = 0; c < n; c++) if (has(c) && h[c] >= 0) t[c] = Math.min(1, h[c] / mx);
  const out = (x, y) => { const R = Math.ceil(.5 / G.cell), i0 = Math.floor((x - G.ox) / G.cell), j0 = Math.floor((y - G.oy) / G.cell); for (let j = j0 - R; j <= j0 + R; j++) for (let i = i0 - R; i <= i0 + R; i++) { if (i >= 0 && j >= 0 && i < G.nx && j < G.ny && G.sight[j * G.nx + i] === PX_GLASS_OUT) return true; } return false; };
  o.lines = []; s.walls.forEach(w => { if (w.curtain && w.path.length > 1 && out((w.path[0][0] + w.path[1][0]) / 2, (w.path[0][1] + w.path[1][1]) / 2)) o.lines.push(w.path); });
  s.windows.forEach(w => { if (w.at && w.hand && w.width > 0 && out(w.at[0], w.at[1])) o.lines.push([[w.at[0] - w.hand[0] * w.width / 2, w.at[1] - w.hand[1] * w.width / 2], [w.at[0] + w.hand[0] * w.width / 2, w.at[1] + w.hand[1] * w.width / 2]]); });
  o.cap = 'Nace en los vidrios exteriores · la luz entra y se difumina'; o.D = 2000;
 } else if (kk === 'visib') { // la vista: primero lo más abierto (isovista grande) y al final los rincones
  const ids = []; for (let c = 0; c < n; c++) if (has(c)) ids.push(c); ids.sort((a, b) => val[b] - val[a]); ids.forEach((c, i) => { t[c] = i / Math.max(1, ids.length - 1); });
 } else if (kk === 'carb') { // el schedule en orden: lo que más CO₂ aporta se enciende primero, y los pisos se asientan al llegar su turno
  const rank = {}, R = Math.max(1, sp.sus.list.length), keyOf = e => { const ty = m.types[e.type] || {}; return `${ty.family}|${ty.name}`; }; sp.sus.list.forEach((it, i) => { rank[`${it.n}|${it.tipo}`] = i; });
  const rk = e => { const v = rank[keyOf(e)]; return v == null ? R : v; }, cen = s.floors.map(f => E.ringCentroid(f.outline[0])), mx = s.floors.map(() => 1);
  for (let c = 0; c < n; c++) if (has(c) && G.floor[c] >= 0) { const f = G.floor[c], [x, y] = G.xy(c), v = Math.hypot(x - cen[f][0], y - cen[f][1]); if (v > mx[f]) mx[f] = v; }
  for (let c = 0; c < n; c++) if (has(c) && G.floor[c] >= 0) { const f = G.floor[c], [x, y] = G.xy(c); t[c] = Math.min(1, rk(s.floors[f]) / R * .6 + .4 * Math.hypot(x - cen[f][0], y - cen[f][1]) / mx[f]); }
  o.flash = s.obstacles.filter(e => e.footprint && rank[keyOf(e)] != null).map(e => ({ring: e.footprint, at: rk(e) / R * .6})).sort((a, b) => a.at - b.at).slice(0, 400);
  o.cap = 'Nace en los elementos del schedule · primero lo que más CO₂ aporta'; o.D = 2200;
 } else if (kk === 'circ') { // cada piso da una vuelta completa alrededor de su centro: flechas de reciclaje que giran y un arco que cierra el ciclo
  const ids = s.floors.map((f, i) => i).sort((a, b) => (s.floors[b].area || 0) - (s.floors[a].area || 0)), nf = ids.length, st = {}, cen = {}, span = .5;
  ids.forEach((f, i) => { st[f] = i / Math.max(1, nf) * .5; cen[f] = E.ringCentroid(s.floors[f].outline[0]); const b = s.floors[f].outline[0].reduce((a, p) => Math.max(a, Math.hypot(p[0] - cen[f][0], p[1] - cen[f][1])), 1); o.src.push({x: cen[f][0], y: cen[f][1], at: st[f], span, R: Math.min(b, 12)}); });
  for (let c = 0; c < n; c++) if (has(c) && G.floor[c] >= 0) { const f = G.floor[c], [x, y] = G.xy(c); t[c] = st[f] + span * north(x - cen[f][0], y - cen[f][1]); }
  o.recycle = true; o.cap = 'Nace en el material de cada piso · lo que vuelve a circular'; o.D = 2400;
 } else if (kk === 'efic') { // se cuenta el área: cuarto por cuarto desde la entrada, fila por fila, a ritmo parejo
  const rooms = {}; for (let c = 0; c < n; c++) if (has(c)) { const q = G.room[c]; (rooms[q] = rooms[q] || {d: Infinity, cs: []}).cs.push(c); if (isFinite(G.dEnt[c]) && G.dEnt[c] < rooms[q].d) rooms[q].d = G.dEnt[c]; }
  const all = Object.values(rooms).sort((a, b) => a.d - b.d), tot = Math.max(1, all.reduce((a, x) => a + x.cs.length, 0)); let i = 0; all.forEach(x => x.cs.forEach(c => { t[c] = i++ / tot; }));
  const A = sp.sus.custA; o.capFn = f => `Contando el área de clientes · ${fmt(A * f)} m²`; o.W = .05; o.D = 2200;
 }
 if (PXCAP[k]) o.cap = PXCAP[k];
 return (r._org[k] = o); }

/* Relaciones: tres actos. 1, el primer tema nace desde su origen; 2, el segundo desde el suyo (en un conflicto, lo que le falta);
 * 3, los dos se apagan y se encienden en rojo las celdas donde se cruzan, de la más fuerte a la más débil. */
const PXREL = {
 'flujo|conf': ['Por aquí pasa la gente · desde la entrada', 'Aquí falta calma · lejos de la luz y junto al paso', 'Donde se cruzan: zona de estrés'],
 'visib|seg': ['Lo que se ve · desde lo más abierto', 'Lo que vigila el personal · desde cada puesto', 'Donde coinciden: vigilancia natural']
};
const pxClamp = v => v < 0 ? 0 : v > 1 ? 1 : v, pxEase = v => 1 - (1 - v) * (1 - v) * (1 - v);
/** Un acto: qué celdas aparecen, en qué orden (t), con qué opacidad final (la del mapa de calor) y en qué tramo del tiempo (p0–p1). */
function pxAct(r, o, col, vf, p0, p1, extra) { const G = r.G, ha = S.lay.heatOp, dim = S.iso && S.selFam.size ? .35 : 1, fin = new Float32Array(G.n), ids = [];
 for (let c = 0; c < G.n; c++) { if (!G.free[c]) continue; const v = vf(c); if (isNaN(v) || v < S.min) continue; const cls = Math.min(4, Math.floor(v * 5)); if (!(cls > 0 || v > .05)) continue; fin[c] = OPAC[cls] * dim * ha; ids.push(c); }
 const t = extra && extra.t || o.t; ids.sort((a, b) => t[a] - t[b]);
 return Object.assign({t2: o.t2, a1: o.a1 == null ? 1 : o.a1, W: o.W || .16, src: o.src || [], lines: o.lines, flash: o.flash, recycle: o.recycle, cap: o.cap, capFn: o.capFn}, extra, {t, col, fin, ids, p0, p1}); }
function pxStop(slot) { const A = S.px.anims || (S.px.anims = {}); if (A[slot]) A[slot].kill(); }
const pxPt = (cx, cy, rr, a) => [cx + Math.sin(a) * rr, cy - Math.cos(a) * rr]; // a en radianes desde el norte, en sentido de las manecillas
const pxArc = (cx, cy, rr, a0, a1) => { const [x0, y0] = pxPt(cx, cy, rr, a0), [x1, y1] = pxPt(cx, cy, rr, a1); return `M${x0} ${y0}A${rr} ${rr} 0 ${a1 - a0 > Math.PI ? 1 : 0} 1 ${x1} ${y1}`; };
const pxHead = (cx, cy, rr, a, s) => { const [x, y] = pxPt(cx, cy, rr, a), dx = Math.cos(a), dy = Math.sin(a); return `M${x + dx * s * 1.4} ${y + dy * s * 1.4}L${x - dy * s} ${y + dx * s}L${x + dy * s} ${y - dx * s}Z`; };
const PXGLYPH = [0, 1, 2].map(j => { const a0 = j * 2 * Math.PI / 3 + .3, a1 = a0 + 1.45; return [pxArc(0, 0, 7, a0, a1), pxHead(0, 0, 7, a1, 2.6)]; }); // ♻: tres flechas en círculo
/** Reproduce los actos sobre la planta svg: el calor se pinta en un canvas encima del fondo, debajo de muros y muebles. */
function pxPlay(slot, r, svg, img, oldHref, acts, D) { pxStop(slot); const G = r.G, finalHref = img.getAttribute('href'), K = Math.max(3, Math.min(24, Math.floor(2400 / Math.max(G.nx, G.ny))));
 // el fondo es la misma imagen sin calor ni contornos (retícula y marcas)
 const h = S.lay.heat, f0 = S.focus; S.lay.heat = false; S.focus = {type: 'pillar', k: 'seg'}; const base = heatImage(r); S.lay.heat = h; S.focus = f0; img.setAttribute('href', base);
 const fo = el('foreignObject', {x: 0, y: 0, width: F.W, height: F.H, style: 'pointer-events:none'}); img.after(fo);
 const box = document.createElement('div'); box.style.cssText = 'position:relative;width:100%;height:100%'; fo.appendChild(box);
 let old = oldHref ? el('image', {href: oldHref, x: 0, y: 0, width: F.W, height: F.H, preserveAspectRatio: 'none', style: 'pointer-events:none'}) : null; if (old) img.after(old);
 const g = el('g', {style: 'pointer-events:none'}, svg);
 acts.forEach(A => { const cv = document.createElement('canvas'); cv.width = G.nx * K; cv.height = G.ny * K; cv.style.cssText = 'position:absolute;inset:0;width:100%;height:100%'; box.appendChild(cv);
  A.x = cv.getContext('2d'); A.x.fillStyle = A.col; A.cv = cv; A.i = 0; A.shown = 0; A.active = [];
  // de dónde nace: pulso en cada origen; barrido donde hay radar; flechas que giran donde hay ciclo; vidrios que brillan; elementos que se encienden
  A.rp = A.src.map(p => { const cx = X(p.x), cy = Y(p.y), mk = {p, cx, cy, a: el('circle', {cx, cy, r: 0, fill: 'none', stroke: A.col, 'stroke-width': 1.6, opacity: 0}, g), b: el('circle', {cx, cy, r: A.recycle ? 0 : 3, fill: A.col, opacity: 0}, g)};
   if (p.span && !A.recycle) mk.l = el('line', {x1: cx, y1: cy, x2: cx, y2: cy, stroke: A.col, 'stroke-width': 1.4, 'stroke-linecap': 'round', opacity: 0}, g);
   if (p.span && A.recycle) { mk.rr = Math.max(11, Math.min(p.R * SC * .5, 28)); mk.arc = el('path', {fill: 'none', stroke: A.col, 'stroke-width': 1.8, 'stroke-linecap': 'round', opacity: 0}, g); mk.head = el('path', {fill: A.col, opacity: 0}, g);
    mk.gl = el('g', {opacity: 0}, g); el('circle', {r: 10.5, fill: 'var(--floor)', opacity: .9}, mk.gl); PXGLYPH.forEach(([d, hd]) => { el('path', {d, fill: 'none', stroke: A.col, 'stroke-width': 1.6, 'stroke-linecap': 'round'}, mk.gl); el('path', {d: hd, fill: A.col}, mk.gl); }); }
   return mk; });
  A.ln = (A.lines || []).map(pp => el('polyline', {points: pts(pp), fill: 'none', stroke: A.col, 'stroke-width': 4, 'stroke-linecap': 'round', opacity: 0}, g));
  A.fl = (A.flash || []).map(f => ({f, e: el('polygon', {points: pts(f.ring), fill: A.col, stroke: A.col, 'stroke-width': 1, opacity: 0}, g)})); });
 const cap = document.createElement('div'); cap.className = 'pxcap'; cap.innerHTML = '<i></i><span></span>'; svg.parentElement.appendChild(cap); const capT = cap.querySelector('span');
 const setCap = A => { cap.style.setProperty('--c', A.col); capT.textContent = A.capFn ? A.capFn(0) : A.cap; }; setCap(acts[0]); acts[0].capOn = true;
 const T = D * PXSLOW, lead = 180 * PXSLOW, t0 = performance.now(), a = {dead: false, raf: 0, to: 0}; S.px.anims[slot] = a;
 a.kill = () => { if (a.dead) return; a.dead = true; cancelAnimationFrame(a.raf); clearTimeout(a.to); if (S.px.anims[slot] === a) S.px.anims[slot] = null; if (old) old.remove(); if (img.isConnected) img.setAttribute('href', finalHref); fo.remove(); g.remove(); cap.remove(); };
 const finish = () => { if (a.dead) return; a.dead = true; cancelAnimationFrame(a.raf); clearTimeout(a.to); if (S.px.anims[slot] === a) S.px.anims[slot] = null; if (old) old.remove();
  const im = new Image(); im.src = finalHref; (im.decode ? im.decode().catch(() => {}) : Promise.resolve()).then(() => { if (!img.isConnected) return; img.setAttribute('href', finalHref); requestAnimationFrame(() => requestAnimationFrame(() => { fo.remove(); g.remove(); })); });
  const L = acts[acts.length - 1]; if (L.capFn) capT.textContent = L.capFn(1); setTimeout(() => cap.classList.add('out'), 900); setTimeout(() => cap.remove(), 1200); };
 const frame = now => { if (a.dead) return; if (!svg.isConnected) { a.kill(); return; } const tau = now - t0, p = (tau - lead) / T; let busy = false;
  if (old) { const q = pxClamp(tau / (260 * PXSLOW)); old.setAttribute('opacity', 1 - q); if (q >= 1) { old.remove(); old = null; } }
  acts.forEach(A => { const q = (p - A.p0) / (A.p1 - A.p0), W = A.W, x = A.x, t = A.t;
   if (q >= 0 && !A.capOn) { A.capOn = true; setCap(A); }
   while (A.i < A.ids.length && q >= t[A.ids[A.i]] * (1 - W)) { A.active.push(A.ids[A.i++]); A.shown++; }
   const next = []; for (let z = 0; z < A.active.length; z++) { const c = A.active[z], xa = pxClamp((q - t[c] * (1 - W)) / W), xb = A.t2 ? pxClamp((q - A.t2[c] * (1 - W)) / W) : 1, f = A.fin[c];
    let al = A.t2 ? f * (A.a1 * pxEase(xa) + (1 - A.a1) * pxEase(xb)) : f * pxEase(xa);
    al = Math.min(1, al + Math.sin(Math.PI * xa) * .32 * Math.max(f, .3)); // el frente de la onda brilla un poco más que el valor final
    const ci = c % G.nx, cj = (c - ci) / G.nx, px = ci * K, py = (G.ny - 1 - cj) * K; x.clearRect(px, py, K, K); x.globalAlpha = al; x.fillRect(px + 1, py + 1, K - 2, K - 2);
    if (xa < 1 || xb < 1) next.push(c); } A.active = next; if (A.i < A.ids.length || next.length) busy = true;
   if (A.fade) A.cv.style.opacity = 1 - (1 - A.fade[2]) * pxClamp((p - A.fade[0]) / (A.fade[1] - A.fade[0]));
   A.rp.forEach(s => { const u0 = q - s.p.at, pq = u0 / .3; if (u0 < 0) return; const vis = q < 1.1 ? 1 : pxClamp((1.4 - q) / .3);
    s.b.setAttribute('opacity', vis); s.a.setAttribute('r', pxEase(pxClamp(pq)) * 26); s.a.setAttribute('opacity', pq < 1 ? .85 * (1 - pq) : 0);
    if (!s.p.span) return; const u = u0 / s.p.span, an = pxClamp(u) * 2 * Math.PI;
    if (s.l) { if (u <= 1) { const L = E.castRay(G, s.p.x, s.p.y, Math.sin(an), Math.cos(an), s.p.R, null).d * SC; s.l.setAttribute('x2', s.cx + Math.sin(an) * L); s.l.setAttribute('y2', s.cy - Math.cos(an) * L); s.l.setAttribute('opacity', .8); } else s.l.setAttribute('opacity', 0); }
    if (s.arc) { const op = (u <= 1 ? 1 : pxClamp((1.3 - u) / .3)) * vis, a1 = Math.min(an, 2 * Math.PI - .05);
     if (an > .05) { s.arc.setAttribute('d', pxArc(s.cx, s.cy, s.rr, 0, a1)); s.head.setAttribute('d', pxHead(s.cx, s.cy, s.rr, a1, 3.2)); }
     s.arc.setAttribute('opacity', .85 * op); s.head.setAttribute('opacity', an > .05 ? op : 0); s.gl.setAttribute('opacity', op); s.gl.setAttribute('transform', `translate(${s.cx} ${s.cy}) rotate(${u * 540})`); } });
   A.ln.forEach(e => e.setAttribute('opacity', q < 0 ? 0 : pxClamp(q / .1) * (q < .7 ? .9 : .9 * pxClamp((1 - q) / .3))));
   A.fl.forEach(s => { const z = (q - s.f.at) / .2; s.e.setAttribute('opacity', z <= 0 || z >= 1 ? 0 : Math.sin(Math.PI * z) * .8); });
   if (A.capFn && A.capOn) capT.textContent = A.capFn(A.ids.length ? A.shown / A.ids.length : 1); });
  if (p >= 1 && !busy) { finish(); return; } a.raf = requestAnimationFrame(frame); };
 a.to = setTimeout(finish, lead + T + 2000); a.raf = requestAnimationFrame(frame); }
/** Un tema (o un pilar en la presentación): un solo acto. Usa el foco actual para el valor de cada celda. */
function pxPlayTheme(slot, r, k, svg, img, old) { const o = pxOrigin(k, r); pxPlay(slot, r, svg, img, old, [pxAct(r, o, BY[k].c1, c => valueAt(c, r), 0, 1)], o.D); }
/** Una relación: tres actos. El foco actual debe ser la relación (el tercer acto es su cruce). */
function pxPlayRel(slot, r, rk, svg, img, old) { const [a, b] = rk.split('|'), conf = R[rk].op === 'conflict', oa = pxOrigin(a, r), ob = pxOrigin(b, r), Fd = r.fields;
 const cp = PXREL[rk] || [`${BY[a].s} alto`, `${BY[b].s} ${conf ? 'bajo' : 'alto'}`, `Donde se cruzan: ${R[rk].n}`];
 const tc = new Float32Array(r.G.n).fill(1); for (let c = 0; c < r.G.n; c++) { const v = valueAt(c, r); if (!isNaN(v)) tc[c] = 1 - v; }
 const acts = [
  pxAct(r, oa, BY[a].c1, c => Fd[a][c], 0, .34, {cap: '1 · ' + cp[0], capFn: null, fade: [.62, .92, .1]}),
  pxAct(r, ob, BY[b].c1, c => conf ? 1 - Fd[b][c] : Fd[b][c], .3, .64, conf ? {t: ob.t.map(v => 1 - v), t2: null, a1: 1, lines: null, src: [], cap: '2 · ' + cp[1], capFn: null, fade: [.62, .92, .1]} : {cap: '2 · ' + cp[1], capFn: null, fade: [.62, .92, .1]}),
  pxAct(r, {t: tc, W: .25}, '#D42A3C', c => valueAt(c, r), .62, 1, {cap: '3 · ' + cp[2]})];
 pxPlay(slot, r, svg, img, old, acts, 4600); }
function renderViewport() { if (S.px) pxStop('vp'); renderViewport0(); if (!S.px || !S.res) return;
 const f = S.focus, r = S.res, key = f.type === 'pillar' && isTh(f.k) ? f.k : f.type === 'rel' ? 'rel:' + f.k : null, svg = document.querySelector('#vbody .vp svg.plan'), img = svg && svg.querySelector('image');
 const changed = S.px.animFor !== r || S.px.animK !== key, old = S.px.animFor === r ? S.px.lastHref : null; S.px.animFor = r; S.px.animK = key; if (img) S.px.lastHref = img.getAttribute('href');
 if (!changed || !key || !img || !S.lay.heat || PXREDUCE.matches || document.hidden || $('dg').classList.contains('on')) return;
 if (!r._sp) pxNow(); if (f.type === 'rel') pxPlayRel('vp', r, f.k, svg, img, old); else pxPlayTheme('vp', r, f.k, svg, img, old); }
// presentación: cada slide con planta (pilar o relación) cuenta cómo nace su mapa
function drawSlide() { if (S.px) pxStop('pres'); drawSlide0(); const it = deck()[pIdx]; if (!it || (it.type !== 'pillar' && it.type !== 'rel') || PXREDUCE.matches || !S.lay.heat) return;
 const svg = $('pplan'), img = svg && svg.querySelector('image'); if (!img) return;
 const f0 = S.focus, th0 = S.thr; S.focus = {type: it.type, k: it.k}; if (it.type === 'rel') S.thr = thrFor(it.k);
 try { if (!S.res._sp) pxNow(); if (it.type === 'rel') pxPlayRel('pres', S.res, it.k, svg, img, null); else pxPlayTheme('pres', S.res, it.k, svg, img, null); } finally { S.focus = f0; S.thr = th0; } }

function renderLegend() { renderLegend0(); if (!(S.focus.type === 'pillar' && isTh(S.focus.k))) return; const t = PX.TH[S.focus.k], l = document.querySelector('#vlegend .scale-l');
 if (l) l.innerHTML = `<span>${t.lo}</span><span>${t.hi}</span>`; }

function renderDigest() { const box = $('dg'); if (!box.classList.contains('on')) return; if (!S.res) { renderDigest0(); return; }
 const m = cur(), X = pxNow(), src = m.model.source, d = src.exported_at ? new Date(src.exported_at) : null;
 const head = `<header class="phd"><div class="mark" aria-hidden="true"></div><div class="phd-t"><div class="eyebrow">Resumen</div><h3><span>${esc((src.file || 'Proyecto').replace(/\.rvt$/i, ''))}</span></h3><p>${[esc(S.res.level.name), d && !isNaN(d) ? `exportado ${d.toLocaleDateString('es-MX', {day: 'numeric', month: 'short', year: 'numeric'})}` : '', src.version ? `Revit ${esc(src.version)}` : ''].filter(Boolean).join(' · ')}</p></div></header>`;
 const foot = `<footer class="dg-f"><button class="btn" id="dg-app">Abrir la app</button><button class="btn" id="dg-pres">Presentar <kbd>P</kbd></button></footer>`;
 let h = '';
 if (multiLevel()) h += `<section class="sec"><div class="sec-h"><span class="eyebrow">Nivel</span></div><div class="rcs">${E.levelsOf(m.model).map(L => `<button class="rc${L.id === S.res.level.id ? ' on' : ''}" data-lv="${esc(L.name)}" aria-pressed="${L.id === S.res.level.id}">${esc(L.name)}</button>`).join('')}</div></section>`;
 h += `<section class="sec"><div class="hero hk">${ixBlock(X)}</div></section>`;
 h += `<section class="sec"><div class="sec-h"><span class="eyebrow pxf">${famDots('exp')}<span>Experiencia del cliente</span></span><span class="sec-m">puntaje · raya = 70</span></div><div class="list">${PXT.filter(t => t.fam === 'exp').map(t => thRow(X, t, 'div')).join('')}</div></section>`;
 h += `<section class="sec"><div class="sec-h"><span class="eyebrow">Por tipo de cliente</span><span class="sec-m">${S.px.mix === 'tiempo' ? 'por tiempo' : 'por visitas'}</span></div><div class="list">${PX.TK.map(T => { const v = rnd(X.types[T]); return `<div class="row s" style="--c:#8C7BF5"><span class="lab">${tl(T)}<span>${PX.TYPES[T].n} · ${Math.round(X.mw[T] * 100)} %</span></span><span class="b4"><i style="width:${v || 0}%"></i><em style="left:70%"></em></span><span class="val s">${v == null ? '—' : v}</span></div>`; }).join('')}</div></section>`;
 h += `<section class="sec"><div class="sec-h"><span class="eyebrow pxf">${famDots('sus')}<span>Sustentabilidad</span></span><span class="sec-m">del schedule de Revit</span></div><div class="list">${PXT.filter(t => t.fam === 'sus').map(t => thRow(X, t, 'div')).join('')}</div></section>`;
 h += hallBlock(X, false);
 const kv = [['Área libre', `${fmt(S.res.G.freeCount * cellArea())} m²`], ['Rooms', S.res.rooms.length], ['Puntos de servicio', `${S.res._sp.counts.atm} ATM · ${S.res._sp.counts.caja} cajas · ${S.res._sp.counts.ases} asesoría`]];
 h += `<section class="sec"><div class="sec-h"><span class="eyebrow">El espacio</span></div><div class="list div">${kv.map(([a, b]) => `<div class="row kv"><span class="lab"><span>${a}</span></span><span class="val s">${b}</span></div>`).join('')}</div></section>`;
 box.innerHTML = head + `<div class="pbody">${h}</div>` + foot;
 $('dg-app').onclick = closeDigest; $('dg-pres').onclick = () => present(); box.querySelectorAll('[data-lv]').forEach(b => b.onclick = () => setLevel(b.dataset.lv)); wireDetails(box); }

// el tablero de la izquierda: el diagnóstico nuevo arriba; relaciones y capas como hoy; supuestos y hallazgos plegados al final
(() => { const lb = $('lboard'), first = lb.querySelector('.sec'); first.hidden = true;
 const d = document.createElement('div'); d.id = 'pxboard'; lb.insertBefore(d, first);
 const more = document.createElement('div'); more.id = 'pxmore'; $('prio').before(more); $('prio').hidden = true;
 $('insp').parentElement.id = 'pxinsp'; lb.parentElement.id = 'pxtablero'; $('prels').closest('.sec').classList.add('pxsrel'); $('layers').closest('.sec').classList.add('pxscap');
 // capas: en laptop solo la fila de íconos; opacidad, ruta y marcas detrás de este botón
 const tg = document.createElement('button'); tg.className = 'ib sm'; tg.id = 'px-lyt'; tg.setAttribute('aria-pressed', 'false'); tg.setAttribute('aria-label', 'Opacidad, ruta y marcas'); tg.title = 'Opacidad, ruta y marcas';
 tg.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h10M18 7h2M4 17h2M10 17h10"/><circle cx="16" cy="7" r="2"/><circle cx="8" cy="17" r="2"/></svg>';
 tg.onclick = () => tg.setAttribute('aria-pressed', $('layers').classList.toggle('pxopen'));
 $('ly-name').parentElement.appendChild(tg); })();

// retícula personalizada: un deslizador hasta 0.1 m que solo se aplica con Aceptar y avisa si va a tardar
(() => { const cells = $('cells'), cb = document.createElement('button'), pop = document.createElement('div'), CAP = 250000; // CAP = MAX_CELLS del motor
 cb.id = 'px-cb'; cb.textContent = 'Personalizado'; cb.title = 'Elegir otro tamaño de retícula'; cb.setAttribute('aria-pressed', 'false'); cb.setAttribute('aria-haspopup', 'dialog'); cells.appendChild(cb);
 pop.id = 'px-cp'; pop.className = 'pxcp'; pop.hidden = true; pop.setAttribute('role', 'dialog'); pop.setAttribute('aria-label', 'Tamaño de retícula');
 pop.innerHTML = `<div class="eyebrow">Tamaño de retícula</div>
  <label class="ly-op"><span>Celda</span><input type="range" min="0.1" max="1" step="0.05" aria-label="Tamaño de la celda en metros"><output></output></label>
  <p class="meta" id="px-ce"></p><p class="pxcw" id="px-cw"></p>
  <div class="pxca"><button class="btn mini" id="px-cx">Cancelar</button><button class="btn mini pxok" id="px-ck">Aceptar</button></div>`;
 cells.parentElement.appendChild(pop);
 const r = pop.querySelector('input'), out = pop.querySelector('output');
 const est = c => { const G = S.res.G, area = G.nx * G.ny * G.cell * G.cell; let e = c; while (area / (e * e) > CAP) e *= 2; return {e, free: G.freeCount * (G.cell / e) ** 2}; };
 const upd = () => { const c = +r.value, {e, free} = est(c), x = (0.5 / e) ** 2; out.textContent = c.toFixed(2) + ' m'; rangeFill(r);
  $('px-ce').innerHTML = `Unas <b>${fmt(Math.round(free / 10) * 10)}</b> celdas libres${x > 1.01 ? ` · <b>${fmt(x, x < 10 ? 1 : 0)} ×</b> las de 0.5 m` : ''}.`;
  const w = $('px-cw'); w.hidden = !(e !== c || e < 0.3);
  w.innerHTML = e !== c ? `<span class="pst">${sIcon('mid')}Este nivel es grande</span> La retícula se queda en <b>${e.toFixed(2)} m</b>, el mínimo que admite.`
   : e <= 0.15 ? `<span class="pst">${sIcon('low')}Muy fina</span> Puede tardar de varios segundos a minutos, según el modelo. La página no responde mientras corre.`
   : `<span class="pst">${sIcon('mid')}Fina</span> El análisis puede tardar unos segundos más.`; };
 const close = () => { pop.hidden = true; };
 cb.onclick = e => { e.stopPropagation(); if (!pop.hidden) { close(); return; } if (!S.res || S.busy) return; r.value = Math.max(0.1, Math.min(1, S.cell)); pop.style.left = Math.min(cb.offsetLeft, pop.parentElement.clientWidth - 268) + 'px'; pop.hidden = false; upd(); r.focus(); };
 r.oninput = upd; $('px-cx').onclick = close;
 $('px-ck').onclick = () => { const c = +(+r.value).toFixed(2), preset = cells.querySelector(`[data-c="${c === 1 ? '1' : c}"]`); close();
  if (preset) { preset.click(); return; } if (c === S.cell) return;
  S.cell = c; cells.querySelectorAll('button').forEach(x => x.setAttribute('aria-pressed', x === cb)); cb.textContent = `Personalizado · ${c} m`; Snd.click(); runAnalysis(); };
 cells.addEventListener('click', e => { if (e.target.dataset.c) { cb.textContent = 'Personalizado'; close(); } });
 document.addEventListener('click', e => { if (!pop.hidden && !pop.contains(e.target)) close(); });
 document.addEventListener('keydown', e => { if (e.key === 'Escape' && !pop.hidden) { e.stopPropagation(); close(); cb.focus(); } }, true); })();
