/* Space Analytics · la app: instrumento, visor, inspector, familias, presentar y paleta, sobre el motor (engine.js). */
(function () {
'use strict';
const E = window.SAEngine, SC = 20; // unidades de dibujo por metro

/* ===================== pilares y relaciones ===================== */
const P = [
 {k:'flujo',name:'Flujo y Proximidad',s:'Flujo',c1:'#F2734B',c2:'#FFC48C',f:523.25,band:156,start:-125,target:65,unit:'accesibilidad desde el acceso · 1 / (1 + d / 20 m)',feel:'Llegar y saber a dónde ir sin pensarlo.'},
 {k:'visib',name:'Visibilidad',s:'Visibilidad',c1:'#3F86F5',c2:'#A8D8FF',f:587.33,band:108,start:10,target:65,unit:'isovista a 1.20 m (70 %) + vista al exterior (30 %)',feel:'Ver y ser visto en la medida justa.'},
 {k:'seg',name:'Seguridad',s:'Seguridad',c1:'#7B68F0',c2:'#C9BEFF',f:659.25,band:156,start:55,target:70,unit:'vigilancia natural · puestos de personal que ven la celda',feel:'Sentirse protegido sin sentirse vigilado.'},
 {k:'conf',name:'Confort sensorial',s:'Confort',c1:'#E25FA3',c2:'#FFC2DD',f:783.99,band:108,start:-170,target:60,unit:'luz natural 50 % · calma acústica 35 % · refugio 15 %',feel:'Un lugar donde bajar la voz y el pulso.'},
 {k:'sust',name:'Sustentabilidad',s:'Sustentab.',c1:'#3FA673',c2:'#C8EBB5',f:880,band:204,start:-160,target:70,unit:'desempeño del piso por SA_GWP, reciclado, EPD y VOC',feel:'Materiales que cuidan a quien habita y al planeta.'}
];
const BY = Object.fromEntries(P.map(p => [p.k, p])), ORDER = P.map(p => p.k);
const key = (a, b) => [a, b].sort((x, y) => ORDER.indexOf(x) - ORDER.indexOf(y)).join('|');
const R = {
 'flujo|visib':{n:'Escaparate vivo',q:'¿Dónde conviene poner el ATM o la pantalla de producto?',d:'muy accesibles y con mucha vista',a:['ATM o pantalla en estas celdas','Nada alto que tape aquí'],src:'Hillier et al., 1993 · natural movement'},
 'flujo|seg':{n:'Ruta vigilada',q:'¿El camino del público queda a la vista del personal?',d:'accesibles y vigiladas por el personal',a:['Mover puestos hacia rutas sin vigilancia'],src:'CPTED · vigilancia natural'},
 'flujo|conf':{op:'conflict',n:'Zona de estrés',q:'¿Dónde se cruza el paso con la calma?',d:'muy accesibles y con poco confort',a:['Girar la espera','Pantalla vegetal','Fila en L'],src:'Vartanian et al., 2015 · J. Environ. Psych.'},
 'flujo|sust':{n:'Desgaste inteligente',q:'¿Dónde invertir en durabilidad?',d:'muy accesibles y con piso de buen desempeño',a:['Piso de alto tráfico solo en ruta'],src:'Accesibilidad × parámetros SA_ del piso'},
 'visib|seg':{n:'Vigilancia natural',q:'¿Hacia dónde mira el cajero?',d:'con mucha vista y vigiladas por el personal',a:['Mostrador a 90° del acceso'],src:'NY DFS · "teller area should be unobstructed"'},
 'visib|conf':{op:'conflict',n:'Exposición',q:'¿Qué tan privada es la asesoría?',d:'muy expuestas y con poco confort',a:['Vidrio esmerilado 1.2–1.8 m','Rotar la puerta'],src:'Dosen & Ostwald, 2017 · prospect-refuge'},
 'visib|sust':{n:'Material donde se ve',q:'¿Este material vale lo que cuesta?',d:'muy visibles y con piso de buen desempeño',a:['Premium solo donde se ve','Bajo carbono en el resto'],src:'RMI · 19–46 % menos carbono con <1 % de sobrecosto'},
 'seg|conf':{n:'Calma segura',q:'¿Se siente seguro sin sentirse encerrado?',d:'vigiladas y con confort',a:['Señalética suave'],src:'CPTED · vigilancia natural'},
 'seg|sust':{n:'Resiliencia',q:'¿Lo vigilado también es durable?',d:'vigiladas y con piso de buen desempeño',a:['Revisar familias sin EPD'],src:'EPD verificadas'},
 'conf|sust':{n:'Salud material',q:'¿Qué tan sano es el aire y el sonido?',d:'con confort y piso de buen desempeño',a:['Plafón acústico en asesoría'],src:'LEED v5 MRc3 · CDPH v1.2'}
};
const ICON={flujo:'<circle cx="6" cy="19" r="3"/><path d="M9 19h8.5a3.5 3.5 0 0 0 0-7h-11a3.5 3.5 0 0 1 0-7H15"/><circle cx="18" cy="5" r="3"/>',visib:'<path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z"/><circle cx="12" cy="12" r="3"/>',seg:'<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z"/><path d="m9 12 2 2 4-4"/>',conf:'<path d="M2 8c.6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2 2.6 0 2.4 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1"/><path d="M2 14c.6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2 2.6 0 2.4 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1"/>',sust:'<path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.5 19 2c1 2 2 4.2 2 8 0 5.5-4.8 10-10 10Z"/><path d="M2 21c0-3 1.9-5.4 5.1-6C9.5 14.5 12 13 13 12"/>'};

/* ===================== estado ===================== */
const S = {w:{flujo:.7,visib:.6,seg:.8,conf:.9,sust:.75},inc:{flujo:true,visib:true,seg:true,conf:true,sust:true},ds:{flujo:0,visib:0,seg:0,conf:0,sust:0},
 rels:new Set(['flujo|conf','visib|seg']),focus:{type:'pillar',k:'seg'},link:false,linkFirst:null,t:0,view:'plan',cell:0.5,min:0,thr:.65,vals:false,
 selFam:new Set(),iso:false,hlRooms:[],undo:[],famCur:null,famQ:'',famCat:'Todas',famSort:'fam',famDir:1,
 model:null,mid:0,level:null,cache:{},res:null,path:null,mark:null,zoom:null,busy:false,again:false,warnOpen:false,thrBy:{},thrUser:{},
 rot:0,cam3:{k:1,x:0,y:0},
 left:'board', // panel izquierdo: 'board' (tablero de pilares y capas) o 'senses' (el instrumento, solo desde Buscar)
 lay:{heat:true,heatOp:1,grid:true,labels:true,furn:true,furnOp:1,plants:true,ent:true,watch:false}, // capas del plano // 3D: giro en grados y cámara (acercamiento y desplazamiento)
 stack:false,gap:1,bld:null,broute:null}; // 3D con todos los niveles (gap = separación entre ellos, 1 = automática) y rutas del edificio
const $ = id => document.getElementById(id);
const NS = 'http://www.w3.org/2000/svg';
function el(tag, a = {}, p) { const e = document.createElementNS(NS, tag); for (const k in a) if (a[k] != null) e.setAttribute(k, a[k]); p && p.appendChild(e); return e; }
const polar = (cx, cy, r, deg) => { const a = deg * Math.PI / 180; return [cx + r * Math.cos(a), cy + r * Math.sin(a)]; };
function arc(cx, cy, r, a0, sw) { sw = Math.max(.01, sw); const [x0, y0] = polar(cx, cy, r, a0), [x1, y1] = polar(cx, cy, r, a0 + sw); return `M${x0} ${y0} A${r} ${r} 0 ${sw > 180 ? 1 : 0} 1 ${x1} ${y1}`; }
const span = k => 50 + S.w[k] * 110;
const fmt = (v, d = 0) => v == null || !isFinite(v) ? '—' : Number(v).toLocaleString('es-MX', {minimumFractionDigits: d, maximumFractionDigits: d});
const fmtA = a => fmt(a, a < 10 ? 1 : 0);
const esc = s => String(s == null ? '' : s).replace(/[&<>"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const score = k => { const v = S.res && S.res.scores[k]; return v == null ? null : Math.round(v); };
const live = k => S.inc[k] && score(k) != null;
function indexVal() { let n = 0, d = 0; P.forEach(p => { if (!live(p.k)) return; n += S.ds[p.k] * S.w[p.k]; d += S.w[p.k]; }); return d ? n / d : 0; }
function tension() { let n = 0, d = 0; P.forEach(p => { if (!live(p.k)) return; n += Math.max(0, p.target - S.ds[p.k]) * S.w[p.k]; d += S.w[p.k]; }); return d ? n / d : 0; }
function snapshot(label) { S.undo.push({label, w: {...S.w}, inc: {...S.inc}, rels: new Set(S.rels)}); if (S.undo.length > 40) S.undo.shift(); }
function undo() { const u = S.undo.pop(); if (!u) { toast('Nada que deshacer'); return; } S.w = u.w; S.inc = u.inc; S.rels = u.rels; if (S.focus.type === 'rel' && !S.rels.has(S.focus.k)) S.focus = {type: 'pillar', k: S.focus.k.split('|')[0]}; syncRels(); renderAll(); toast(`Deshecho · ${u.label}`); Snd.click(); }

/* ===================== sonido ===================== */
const Snd={on:true,ctx:null,init(){ if(this.ctx) return; const C=window.AudioContext||window.webkitAudioContext; if(!C) return; this.ctx=new C(); this.bus=this.ctx.createGain(); this.bus.gain.value=.5; this.bus.connect(this.ctx.destination); const d=this.ctx.createDelay(); d.delayTime.value=.3; const fb=this.ctx.createGain(); fb.gain.value=.33; const w=this.ctx.createGain(); w.gain.value=.22; this.bus.connect(d); d.connect(fb); fb.connect(d); d.connect(w); w.connect(this.ctx.destination); },
 tone(f,dur=2,vol=.07,det=0){ if(!this.on) return; this.init(); if(!this.ctx) return; const t=this.ctx.currentTime; [[f,'sine',1],[f*2,'triangle',.14]].forEach(([fr,ty,m])=>{ const o=this.ctx.createOscillator(),g=this.ctx.createGain(); o.type=ty; o.frequency.value=fr; o.detune.value=det; g.gain.setValueAtTime(0,t); g.gain.linearRampToValueAtTime(vol*m,t+.03); g.gain.exponentialRampToValueAtTime(.0001,t+dur); o.connect(g); g.connect(this.bus); o.start(t); o.stop(t+dur+.05); }); },
 tick(){ this.tone(1567.98,.12,.02); }, click(){ this.tone(2093,.05,.012); }};
function toast(msg, sub = '', action) { const t = document.createElement('div'); t.className = 'toast'; t.innerHTML = `<span>${msg}</span>` + (sub ? `<span class="mono">${sub}</span>` : ''); if (action) { const b = document.createElement('button'); b.textContent = action.label; b.onclick = () => { action.run(); t.remove(); }; t.appendChild(b); } $('toasts').appendChild(t); setTimeout(() => { t.style.transition = 'opacity .4s'; t.style.opacity = 0; setTimeout(() => t.remove(), 400); }, 4200); }

/* ===================== modelos y análisis ===================== */
const cur = () => S.model;
// El nivel que se abre: el elegido y, si no, el primero con rooms (un nivel con solo un piso, como una cimentación, no tiene qué medir)
function levelFor(model) { const ls = E.levelsOf(model); return ls.find(L => L.name === S.level) || ls.find(L => model.rooms.some(r => r.level === L.id)) || ls[0] || model.levels[0]; }
const cacheKey = (lv, cell) => `${lv}|${cell}`;
/** El edificio del modelo: todos sus niveles analizados (de la caché) unidos por escaleras, rampas y elevadores. */
function bld() { const m = cur(); if (!m) return null;
 const results = {};
 E.levelsOf(m.model).forEach(L => { const k = cacheKey(L.id, S.cell); if (!S.cache[k]) { try { S.cache[k] = E.analyze(m.model, L.id, {cell: S.cell}); } catch (e) { return; } } results[L.id] = S.cache[k]; });
 const key = `${S.mid}|${S.cell}`, b = S.bld;
 if (b && b.key === key && b.levels.length === Object.keys(results).length && b.levels.every(L => results[L.id] === L.res)) return b;
 return (S.bld = Object.assign(E.building(m.model, {results, cell: S.cell}), {key})); }
const bldNow = () => S.bld && S.bld.key === `${S.mid}|${S.cell}` ? S.bld : null; // sin calcular nada
const bRoute = () => S.broute && bldNow() && S.broute.key === S.bld.key ? S.broute : null;
const multiLevel = () => !!cur() && E.levelsOf(cur().model).length > 1;
const allWarnings = () => S.res ? S.res.warnings.concat(bldNow() ? S.bld.warnings : []) : [];

/** Se analiza un modelo a la vez: cargar otro reemplaza al anterior. Si el archivo trae varios (exportaciones viejas), se queda el último. */
function addModels(json, from) {
  const {models, warnings} = E.load(json);
  warnings.forEach(w => toast('Archivo ignorado', w));
  const m = models[models.length - 1]; if (!m) return false;
  if (models.length > 1) toast('Se cargó un solo modelo', `el archivo trae ${models.length}; se usa el último`);
  S.model = {model: m, from}; S.mid++; S.cache = {}; S.bld = null; S.broute = null;
  updateTop(); Snd.tone(523.25, 1.6, .05); runAnalysis();
  return true;
}
function readFiles(files) {
  [...files].forEach(f => {
    const ext = f.name.split('.').pop().toLowerCase();
    if (ext === 'json') { const r = new FileReader(); r.onload = () => { try { if (addModels(JSON.parse(r.result), f.name)) toast('Modelo cargado', f.name); } catch (e) { toast('No es un JSON válido', f.name); } }; r.readAsText(f); }
    else if (['xlsx', 'xls', 'csv'].includes(ext)) loadTable(f);
    else toast('Formato no reconocido', f.name);
  });
}

/** Corre el análisis del nivel actual; con animación de respiración si no está en caché.
 *  Si ya hay uno corriendo, deja el pedido pendiente: al terminar se vuelve a correr con el nivel y la celda de ese momento. */
function runAnalysis(force) {
  const m = cur(); if (!m) return;
  if (S.busy) { S.again = true; return; }
  const L = levelFor(m.model); if (!L) { toast('El modelo no tiene niveles'); return; }
  S.level = L.name;
  const k = cacheKey(L.id, S.cell);
  if (S.cache[k] && !force) { setResult(S.cache[k]); return; }
  const {steps, ctx} = E.plan(m.model, L.id, {cell: S.cell});
  const B = $('breathe'), rows = $('brows'); S.busy = true;
  B.classList.add('on'); rows.innerHTML = steps.map(s => `<div class="brow"><span>${s.label}</span><span class="mono muted">…</span><div class="bb"><i></i></div></div>`).join('');
  let inh = true; const bt = $('bt'); bt.textContent = 'inhala'; const iv = setInterval(() => { inh = !inh; bt.textContent = inh ? 'inhala' : 'exhala'; }, 2000);
  const t0 = performance.now(); let i = 0;
  const done = ok => { clearInterval(iv); B.classList.remove('on'); S.busy = false; if (ok) S.cache[k] = ctx.result;
    if (S.again) { S.again = false; runAnalysis(); return; }
    if (ok) { setResult(ctx.result); toast('Análisis listo', `${fmt(ctx.result.G.freeCount)} celdas libres · ${fmt((performance.now() - t0) / 1000, 1)} s`); } };
  const next = () => {
    if (i >= steps.length) { setTimeout(() => done(true), 350); return; }
    const row = rows.children[i];
    try { const d = steps[i].run(); row.querySelector('.mono').textContent = d || ''; }
    catch (e) { done(false); toast('No se pudo analizar', e.message); return; }
    row.classList.add('go'); row.querySelector('i').style.width = '100%';
    Snd.tone([523.25, 587.33, 659.25, 783.99, 880, 987.77, 1046.5][i % 7], 1.3, .045);
    i++; setTimeout(next, 380);
  };
  setTimeout(next, 250);
}
let F = null; // marco de dibujo del resultado actual
function setResult(r) {
  const changed = !S.res || S.res.G.nx !== r.G.nx || S.res.level.id !== r.level.id;
  S.res = r; const G = r.G;
  F = {x0: G.ox, y1: G.oy + G.ny * G.cell, W: G.nx * G.cell * SC, H: G.ny * G.cell * SC};
  if (changed) { S.zoom = null; S.cam3 = {k: 1, x: 0, y: 0}; }
  S.hlRooms = []; S.selFam = new Set([...S.selFam].filter(id => r.model.types[id]));
  if (!S.famCur || !r.model.types[S.famCur]) S.famCur = r.table[0] && r.table[0].id;
  updateTop(); renderLevels(); renderAll();
  if (!S.hashDone) { S.hashDone = true; applyHash(); }
}
/** Estado inicial desde el hash (#focus=visib|conf&path=cash&fam=1…): sirve para enlaces y capturas. */
function applyHash() {
  const h = new URLSearchParams(location.hash.slice(1)), f = h.get('focus');
  if (f && R[f]) { S.rels.add(f); syncRels(); focus('rel', f); } else if (f && BY[f]) focus('pillar', f);
  if (h.get('path')) showPath(h.get('path')); if (h.get('mark')) showMark(h.get('mark'));
  if (h.get('fam')) { const t = S.res.table.filter(x => x.category === 'Furniture').slice(0, 2); t.forEach(x => S.selFam.add(x.id)); renderViewport(); openFam(t[0] && t[0].id); }
  if (h.get('resumen')) openDigest();
  if (h.get('present')) present();
}
function updateTop() {
  const m = cur();
  $('projsub').textContent = m ? `${m.model.source.file || m.from || 'modelo'} · ${S.res ? S.res.level.name : ''} · Revit ${m.model.source.version || ''}` : 'Sin modelo · arrastra un space-model.json';
  fitProj();
}
// La línea del modelo (archivo · nivel · versión) va junto al nombre solo si cabe entera; si no, se oculta y queda en el
// tooltip del nombre, para que el encabezado no corte los botones.
function fitProj() {
  const sp = $('projsub'), box = sp.parentElement;
  box.title = sp.textContent; sp.hidden = false;
  if (sp.scrollWidth > sp.clientWidth + 1 || box.scrollWidth > box.clientWidth + 1) sp.hidden = true;
}
addEventListener('resize', fitProj);
function renderLevels() {
  const m = cur(), s = $('lvl');
  if (!m) { s.innerHTML = '<option>—</option>'; s.disabled = true; return; }
  const ls = E.levelsOf(m.model); s.disabled = ls.length < 2;
  s.innerHTML = ls.map(L => `<option ${S.res && S.res.level.id === L.id ? 'selected' : ''}>${esc(L.name)}</option>`).join('') || '<option>—</option>';
}

/* ===================== campo de análisis ===================== */
function valueAt(c, r = S.res) {
  const Fd = r.fields;
  if (S.focus.type === 'rel') { const [a, b] = S.focus.k.split('|'); return E.crossAt(Fd, a, b, R[S.focus.k].op, c); }
  return Fd[S.focus.k][c];
}
const focusColor = () => S.focus.type === 'rel' ? '#D42A3C' : BY[S.focus.k].c1;
const OPAC = [.05, .2, .4, .62, .86];
const cellArea = () => S.res.G.cell * S.res.G.cell;
function crossArea() { if (!S.res || S.focus.type !== 'rel') return 0; const G = S.res.G; let n = 0; for (let c = 0; c < G.n; c++) if (G.free[c]) { const v = valueAt(c); if (v >= S.thr) n++; } return n * cellArea(); }
function roomsBy(k) { return S.res.rooms.filter(r => r.scores[k] != null).map(r => ({k: r.k, n: r.name, v: r.scores[k]})).sort((a, b) => a.v - b.v); }
function relRooms() { const G = S.res.G, acc = {}; for (let c = 0; c < G.n; c++) if (G.free[c] && G.room[c] >= 0 && valueAt(c) >= S.thr) acc[G.room[c]] = (acc[G.room[c]] || 0) + 1; return Object.keys(acc).map(k => ({k: +k, n: S.res.rooms[k].name, a: acc[k] * cellArea()})).sort((a, b) => b.a - a.a); }

/* ===================== INSTRUMENTO ===================== */
const C = 260, GI = {};
function buildInst() { const s = $('inst'); s.innerHTML = '';
 const d = el('defs', {}, s);
 P.forEach(p => { const g = el('linearGradient', {id: 'g-' + p.k, x1: 0, y1: 0, x2: 1, y2: 1}, d); el('stop', {offset: 0, 'stop-color': p.c1}, g); el('stop', {offset: 1, 'stop-color': p.c2}, g); });
 const sh = el('filter', {id: 'sh', x: '-50%', y: '-50%', width: '200%', height: '200%'}, d); el('feDropShadow', {dx: 0, dy: 5, stdDeviation: 7, 'flood-color': '#3c2850', 'flood-opacity': .16}, sh);
 const tg = el('linearGradient', {id: 'tune', x1: 0, y1: 0, x2: 1, y2: 1}, d); P.forEach((p, i) => el('stop', {offset: i / 4, 'stop-color': p.c1}, tg));
 GI.bez = el('g', {}, s);
 el('circle', {cx: C, cy: C, r: 228, fill: 'none', stroke: 'var(--line)'}, GI.bez);
 for (let a = 0; a < 360; a += 3) { const mj = a % 15 === 0, [x1, y1] = polar(C, C, mj ? 230 : 233, a), [x2, y2] = polar(C, C, 239, a); el('line', {x1, y1, x2, y2, stroke: 'var(--ink)', 'stroke-opacity': mj ? .36 : .13}, GI.bez); }
 [108, 156, 204].forEach(r => el('circle', {cx: C, cy: C, r, fill: 'none', stroke: 'var(--line)', 'stroke-width': 22, 'stroke-opacity': .5}, s));
 GI.rels = el('g', {}, s); GI.p = {};
 P.forEach(p => { const g = el('g', {}, s);
   const track = el('path', {fill: 'none', stroke: p.c2, 'stroke-opacity': .5, 'stroke-width': 14, 'stroke-linecap': 'round'}, g); el('title', {}, track).textContent = `${p.s}: largo del arco = peso del cliente`;
   const fill = el('path', {fill: 'none', stroke: `url(#g-${p.k})`, 'stroke-width': 14, 'stroke-linecap': 'round', class: 'arcfill'}, g); el('title', {}, fill).textContent = `${p.s}: puntaje calculado`;
   const tgt = el('line', {stroke: 'var(--ink)', 'stroke-width': 2.2, 'stroke-linecap': 'round'}, g); el('title', {}, tgt).textContent = `${p.s}: meta ${p.target}`;
   const val = el('text', {class: 't-val', 'text-anchor': 'middle', 'dominant-baseline': 'middle'}, g);
   const handle = el('g', {style: 'cursor:grab', tabindex: 0, role: 'slider', 'aria-label': `Peso de ${p.s}`}, g); el('circle', {r: 13, fill: p.c1, opacity: .15}, handle); el('circle', {r: 6.5, fill: 'var(--surface-2)', stroke: p.c1, 'stroke-width': 2.5}, handle); el('title', {}, handle).textContent = `Arrastra para cambiar el peso de ${p.s} (o usa ← →)`;
   const node = el('g', {style: 'cursor:pointer', tabindex: 0, role: 'button', 'aria-label': `Enfocar ${p.name}`}, g);
   const ring = el('circle', {r: 21, fill: 'none', stroke: p.c1, 'stroke-width': 1.6, opacity: 0}, node);
   el('circle', {r: 15, fill: 'var(--surface-2)', stroke: 'var(--line)', filter: 'url(#sh)'}, node);
   const ic = el('g', {class: 'ico', transform: 'translate(-8,-8) scale(.667)'}, node); ic.innerHTML = ICON[p.k];
   node.addEventListener('click', () => nodeClick(p.k)); node.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); nodeClick(p.k); } });
   handle.addEventListener('keydown', e => { if (e.key === 'ArrowRight' || e.key === 'ArrowUp') { e.preventDefault(); bumpW(p.k, .05); } if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') { e.preventDefault(); bumpW(p.k, -.05); } });
   weightDrag(handle, p.k);
   GI.p[p.k] = {g, track, fill, tgt, val, handle, node, ring}; });
 GI.tune = el('path', {fill: 'none', stroke: 'url(#tune)', 'stroke-width': 1.5, opacity: .9}, s);
 const cg = el('g', {transform: `translate(${C},${C})`, style: 'cursor:pointer', tabindex: 0, role: 'button', 'aria-label': 'Escuchar la afinación'}, s); el('title', {}, cg).textContent = 'Índice ponderado · clic para escuchar';
 el('circle', {r: 62, fill: 'var(--surface-2)', stroke: 'var(--line)', filter: 'url(#sh)'}, cg);
 GI.idx = el('text', {y: 7, 'text-anchor': 'middle', style: 'font:300 38px Outfit;fill:var(--ink)'}, cg);
 const l1 = el('text', {y: -25, 'text-anchor': 'middle', class: 't-mono'}, cg); l1.textContent = 'ÍNDICE';
 GI.tuneT = el('text', {y: 28, 'text-anchor': 'middle', class: 't-mono'}, cg);
 cg.addEventListener('click', listen); cg.addEventListener('keydown', e => { if (e.key === 'Enter') listen(); });
 syncRels(); }
const nodePos = k => polar(C, C, BY[k].band, BY[k].start - 12);
function updateInst() {
 P.forEach(p => { const g = GI.p[p.k], sp = span(p.k), r = p.band, sc = S.ds[p.k], foc = (S.focus.type === 'pillar' && S.focus.k === p.k) || (S.focus.type === 'rel' && S.focus.k.split('|').includes(p.k)), inc = S.inc[p.k], na = score(p.k) == null;
   g.track.setAttribute('d', arc(C, C, r, p.start, sp)); g.fill.setAttribute('d', arc(C, C, r, p.start, sp * sc / 100));
   g.g.style.opacity = inc && !na ? 1 : .35; g.fill.setAttribute('stroke-width', foc ? 16 : 12);
   const ta = p.start + sp * p.target / 100, [a1, b1] = polar(C, C, r - 11, ta), [a2, b2] = polar(C, C, r + 11, ta); g.tgt.setAttribute('x1', a1); g.tgt.setAttribute('y1', b1); g.tgt.setAttribute('x2', a2); g.tgt.setAttribute('y2', b2);
   const [hx, hy] = polar(C, C, r, p.start + sp); g.handle.setAttribute('transform', `translate(${hx},${hy})`);
   const [nx, ny] = nodePos(p.k); g.node.setAttribute('transform', `translate(${nx},${ny})`);
   g.ring.setAttribute('opacity', foc || S.linkFirst === p.k ? 1 : 0); g.ring.setAttribute('stroke-dasharray', S.linkFirst === p.k ? '3 4' : 'none');
   g.val.setAttribute('x', nx); g.val.setAttribute('y', ny + 27); g.val.textContent = `${p.s.toUpperCase()} ${na ? '—' : Math.round(sc)}`; });
 const dis = tension(), amp = Math.min(9, dis * .9);
 GI.idx.textContent = S.res ? indexVal().toFixed(1) : '—'; GI.tuneT.textContent = !S.res ? 'SIN MODELO' : dis < 2 ? 'AFINADO' : `TENSIÓN ${dis.toFixed(1)}`;
 let dp = ''; for (let i = 0; i <= 180; i++) { const a = i * 2, rr = 76 + amp * Math.sin(a * Math.PI / 180 * 9 + S.t * 2.2) * Math.sin(a * Math.PI / 180 * 2 + S.t * .7); const [x, y] = polar(C, C, rr, a); dp += (i ? 'L' : 'M') + x.toFixed(1) + ' ' + y.toFixed(1); } GI.tune.setAttribute('d', dp + 'Z');
 (GI.relEls || []).forEach(o => { const A = nodePos(o.a), B = nodePos(o.b), m = [(A[0] + B[0]) / 2, (A[1] + B[1]) / 2], c = [C + (m[0] - C) * .15, C + (m[1] - C) * .15], dd = `M${A[0]} ${A[1]} Q${c[0]} ${c[1]} ${B[0]} ${B[1]}`; o.p.setAttribute('d', dd); o.hit.setAttribute('d', dd);
   const tx = .25 * A[0] + .5 * c[0] + .25 * B[0], ty = .25 * A[1] + .5 * c[1] + .25 * B[1], dx = tx - C, dy = ty - C, dl = Math.hypot(dx, dy) || 1, push = Math.max(0, 90 - dl); o.t.setAttribute('cx', tx + dx / dl * push); o.t.setAttribute('cy', ty + dy / dl * push); });
}
function syncRels() { GI.rels.innerHTML = ''; GI.relEls = [...S.rels].map(rk => { const [a, b] = rk.split('|'), on = S.focus.type === 'rel' && S.focus.k === rk;
  const p = el('path', {fill: 'none', stroke: on ? '#D42A3C' : BY[a].c1, 'stroke-width': on ? 2.6 : 1.5, class: 'flow', 'stroke-linecap': 'round'}, GI.rels);
  const hit = el('path', {fill: 'none', stroke: 'transparent', 'stroke-width': 14, style: 'cursor:pointer'}, GI.rels); el('title', {}, hit).textContent = R[rk].n; hit.addEventListener('click', () => focus('rel', rk));
  const t = el('circle', {r: on ? 5.5 : 4, fill: 'var(--surface-2)', stroke: on ? '#D42A3C' : BY[b].c1, 'stroke-width': 2, style: 'cursor:pointer'}, GI.rels); el('title', {}, t).textContent = R[rk].n; t.addEventListener('click', () => focus('rel', rk));
  return {a, b, p, hit, t}; }); }
function nodeClick(k) {
 if (S.link) { if (!S.linkFirst) { S.linkFirst = k; Snd.tick(); $('ihint').textContent = `${BY[k].s} → elige el segundo pilar`; return; }
   if (S.linkFirst === k) { S.linkFirst = null; $('ihint').textContent = 'Elige el primer pilar'; return; }
   createRel(S.linkFirst, k); setLink(false); return; }
 focus('pillar', k); Snd.tone(BY[k].f, 1.4, .05); }
function createRel(a, b) { const rk = key(a, b); if (S.rels.has(rk)) { focus('rel', rk); return; } snapshot('relación'); S.rels.add(rk); syncRels(); focus('rel', rk);
 Snd.tone(BY[a].f); setTimeout(() => Snd.tone(BY[b].f), 90); setTimeout(() => Snd.tone(BY[a].f * 1.5, 2.2, .04), 180);
 toast(`Relación creada · ${R[rk].n}`, '', {label: 'Deshacer', run: undo}); }
function removeRel(rk) { snapshot('quitar relación'); S.rels.delete(rk); syncRels(); if (S.focus.type === 'rel' && S.focus.k === rk) focus('pillar', rk.split('|')[0]); else renderAll(); toast(`Relación quitada · ${R[rk].n}`, '', {label: 'Deshacer', run: undo}); }
function setLink(on) { S.link = on; S.linkFirst = null; $('b-link').setAttribute('aria-pressed', on); $('ihint').textContent = on ? 'Elige el primer pilar · Esc cancela' : 'Clic en un pilar para enfocarlo.'; $('inst').style.cursor = on ? 'crosshair' : ''; }
function svgPt(svg, e) { const p = svg.createSVGPoint(); p.x = e.clientX; p.y = e.clientY; return p.matrixTransform(svg.getScreenCTM().inverse()); }
function bumpW(k, d) { snapshot(`peso ${BY[k].s}`); S.w[k] = Math.max(.05, Math.min(1, Math.round((S.w[k] + d) * 20) / 20)); Snd.tone(BY[k].f * (.75 + S.w[k] * .5), .3, .03); renderMixer(); renderInspector(); }
function weightDrag(h, k) { let on = false, last = 0; const s = $('inst');
 h.addEventListener('pointerdown', e => { on = true; snapshot(`peso ${BY[k].s}`); h.setPointerCapture(e.pointerId); e.stopPropagation(); });
 h.addEventListener('pointermove', e => { if (!on) return; const pt = svgPt(s, e); let a = Math.atan2(pt.y - C, pt.x - C) * 180 / Math.PI - BY[k].start; a = ((a % 360) + 360) % 360; if (a > 300) a = 0; S.w[k] = Math.max(.05, Math.min(1, Math.round((a - 50) / 110 * 20) / 20)); const st = Math.round(S.w[k] * 20); if (st !== last) { last = st; Snd.tone(BY[k].f * (.75 + S.w[k] * .5), .3, .03); renderMixer(); } });
 h.addEventListener('pointerup', () => { if (!on) return; on = false; renderInspector(); toast(`Peso de ${BY[k].s}`, `${Math.round(S.w[k] * 100)} %`, {label: 'Deshacer', run: undo}); }); }
function listen() { if (!S.res) { toast('Primero carga un modelo'); return; } Snd.on = true; $('snd').setAttribute('aria-pressed', 'true'); P.filter(p => live(p.k)).forEach((p, i) => setTimeout(() => Snd.tone(p.f, 2.6, .03 + .06 * S.w[p.k], Math.max(0, p.target - score(p.k)) * 6), i * 140));
 const w = P.filter(p => live(p.k)).sort((a, b) => (score(a.k) - a.target) * S.w[a.k] - (score(b.k) - b.target) * S.w[b.k])[0]; if (w && score(w.k) < w.target) toast(`Suena tenso en ${w.s}`, `${score(w.k)} vs meta ${w.target}`, {label: 'Ver', run: () => focus('pillar', w.k)}); else toast('El espacio suena afinado'); }

/** La tabla de pesos: en Prioridades del cliente y bajo Senses. El peso solo mueve el índice ponderado. */
function renderMixer() { const html = `<div class="mhead"><span></span><span>PILAR</span><span>PTS</span><span>META</span><span>PESO</span><span title="Incluir en índice">IX</span></div>` + P.map(p => { const on = (S.focus.type === 'pillar' && S.focus.k === p.k), sc = score(p.k);
  return `<div class="mrow ${on ? 'on' : ''}" data-k="${p.k}"><span class="d" style="background:${p.c1}"></span><span>${p.s}</span><span class="v ${sc == null ? 'na' : ''}" title="${sc == null ? 'Sin datos en este modelo' : ''}">${sc == null ? '—' : sc}</span><span class="t">${p.target}</span><span class="step"><button data-w="-" aria-label="Menos peso">−</button><span>${Math.round(S.w[p.k] * 100)}%</span><button data-w="+" aria-label="Más peso">+</button></span><input type="checkbox" ${S.inc[p.k] ? 'checked' : ''} aria-label="Incluir ${p.s} en el índice" title="Incluir en índice"></div>`; }).join('');
 document.querySelectorAll('.mixer').forEach(mx => { mx.innerHTML = html; mx.querySelectorAll('.mrow').forEach(r => { const k = r.dataset.k;
  r.addEventListener('click', e => { if (e.target.closest('button,input')) return; focus('pillar', k); });
  r.querySelectorAll('[data-w]').forEach(b => b.onclick = () => bumpW(k, b.dataset.w === '+' ? .05 : -.05));
  r.querySelector('input').onchange = e => { snapshot(`índice ${BY[k].s}`); S.inc[k] = e.target.checked; renderAll(); toast(`${BY[k].s} ${S.inc[k] ? 'incluido en' : 'excluido del'} índice`, '', {label: 'Deshacer', run: undo}); }; }); });
 const ix = S.res ? idxNow() : null; $('prio-ix').textContent = ix ? `índice ${fmt(ix.v, 1)}` : ''; }
/* ===================== tablero de pilares y capas (panel izquierdo) ===================== */
const RATE_S = {ok: 'Cumple', mid: 'Mejorar', low: 'Atención'}; // RATE en corto, para la fila del tablero
/** Cada pilar es una fila: puntaje contra su meta, con estado (ícono + texto). Clic = esa capa en el plano. Debajo, las relaciones activas. */
function renderBoardBase() { const b = $('pboard');
 if (!S.res) { b.innerHTML = '<p class="meta">Carga un modelo para ver sus pilares.</p>'; $('prels').innerHTML = ''; return; }
 b.innerHTML = P.map(p => { const sc = score(p.k), rt = ratePillar(sc, p.target), on = S.focus.type === 'pillar' && S.focus.k === p.k;
  return `<button class="row${on ? ' on' : ''}" data-k="${p.k}" aria-pressed="${on}" style="--c:${p.c1}" title="${p.name}: ${sc == null ? 'sin datos' : sc} de 100, meta ${p.target}${rt ? ' · ' + RATE[rt] : ''}. Clic para pintarlo en el plano.">
   <span class="lab">${pIcon(p.k, 15)}<span>${p.s}</span></span><span class="end">${rt ? `<span class="pst">${sIcon(rt)}${RATE_S[rt]}</span>` : '<span class="pst none">Sin datos</span>'}<span class="val">${sc == null ? '—' : sc}</span></span>
   <span class="b4 ind full" aria-hidden="true"><i style="width:${sc || 0}%"></i><em style="left:${p.target}%"></em></span></button>`; }).join('');
 b.querySelectorAll('.row').forEach(x => x.onclick = () => { const k = x.dataset.k; focus('pillar', k); Snd.tone(BY[k].f, 1.2, .04); });
 $('prels').innerHTML = [...S.rels].map(rk => { const [a, c] = rk.split('|'), on = S.focus.type === 'rel' && S.focus.k === rk;
  return `<button class="rc${on ? ' on' : ''}" data-rk="${rk}" aria-pressed="${on}" title="${R[rk].q}">${dots(BY[a].c1, BY[c].c1)}${R[rk].n}</button>`; }).join('')
  || '<p class="meta">Ninguna. Créalas desde el inspector: <b>Relacionar con</b>.</p>';
 $('prels').querySelectorAll('[data-rk]').forEach(x => x.onclick = () => focus('rel', x.dataset.rk)); }

/** Capas del plano (y del 3D): qué se ve y qué tan fuerte. Se arman una vez; syncLayers() solo refleja el estado. */
// [capa, nombre, ícono, nota]: una fila de íconos; el nombre sale en el título de la sección al pasar el cursor
const LAYS = [
 ['heat', 'Mapa de calor', '<rect x="3.5" y="3.5" width="7" height="7" rx="1.5" class="f" opacity=".95"/><rect x="13.5" y="3.5" width="7" height="7" rx="1.5" class="f" opacity=".55"/><rect x="3.5" y="13.5" width="7" height="7" rx="1.5" class="f" opacity=".35"/><rect x="13.5" y="13.5" width="7" height="7" rx="1.5" class="f" opacity=".75"/>'],
 ['grid', 'Retícula', '<rect x="3.5" y="3.5" width="17" height="17" rx="2"/><path d="M3.5 9.2h17M3.5 14.8h17M9.2 3.5v17M14.8 3.5v17"/>'],
 ['labels', 'Nombres de rooms', '<path d="M5 7V5h14v2M12 5v14M9 19h6"/>'],
 ['furn', 'Mobiliario y columnas', '<path d="M6 11V8a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v3"/><path d="M4 11a2 2 0 0 1 2 2v2h12v-2a2 2 0 1 1 4 0v4H2v-4a2 2 0 0 1 2-2Z"/><path d="M5 19v1.5M19 19v1.5"/>'],
 ['plants', 'Vegetación', '<path d="M12 21v-5"/><path d="M12 16a5 5 0 0 0 5-5c0-3-2.4-6-5-8-2.6 2-5 5-5 8a5 5 0 0 0 5 5Z"/>'],
 ['ent', 'Accesos', '<path d="M14 4h4a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-4"/><path d="M3 12h11M10 8l4 4-4 4"/>'],
 ['watch', 'Puestos de personal', '<circle cx="12" cy="8" r="3.5"/><path d="M5 20a7 7 0 0 1 14 0"/>', 'en Seguridad se ven siempre']];
const OPS = [['heatOp', 'heat', 'Calor'], ['furnOp', 'furn', 'Muebles']];
const EYE = '<svg class="eye" viewBox="0 0 24 24" aria-hidden="true"><g class="on"><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z"/><circle cx="12" cy="12" r="3"/></g><g class="off"><path d="M3 3l18 18"/><path d="M10.6 5.1A10 10 0 0 1 12 5c6.5 0 10 7 10 7a17 17 0 0 1-3 3.9M6.6 6.6C3.9 8.4 2 12 2 12s3.5 7 10 7a9.7 9.7 0 0 0 5.4-1.6"/></g></svg>';
let vpRaf = 0; const vpSoon = () => { cancelAnimationFrame(vpRaf); vpRaf = requestAnimationFrame(renderViewport); };
/** El tramo lleno del deslizador (como las barras del tablero). */
const rangeFill = r => r.style.setProperty('--v', (r.value - r.min) / (r.max - r.min) * 100 + '%');
/** El nombre de la capa bajo el cursor (o cuántas se ven) junto al título de la sección. */
function layName(b) { const t = $('ly-name'); if (!t) return;
 if (b) { const L = LAYS.find(x => x[0] === b.dataset.l); t.textContent = `${L[1]} · ${S.lay[L[0]] ? 'visible' : 'oculta'}`; return; }
 t.textContent = `${LAYS.filter(x => S.lay[x[0]]).length} de ${LAYS.length} visibles`; }
function buildLayers() { const box = $('layers');
 box.innerHTML = `<div class="lyg">${LAYS.map(([k, n, ic, note]) => `<button class="ib tg" data-l="${k}" aria-pressed="false" aria-label="${n}" title="${n}${note ? ' · ' + note : ''}"><svg class="li" viewBox="0 0 24 24" aria-hidden="true">${ic}</svg></button>`).join('')}</div>
  <div class="lyo">${OPS.map(([op, of, n]) => `<label class="ly-op" data-of="${of}"><span>${n}</span><input type="range" min="10" max="100" step="5" data-op="${op}" aria-label="Opacidad: ${n.toLowerCase()}"><output></output></label>`).join('')}
   <div class="ly-op mn" data-of="heat"><span>Mín</span><span class="step"><button data-min="-" aria-label="Bajar el valor mínimo">−</button><span class="mono" id="minv">0.0</span><button data-min="+" aria-label="Subir el valor mínimo">+</button></span><button class="btn mini" id="ly-vals" aria-pressed="false" title="Escribir el valor en cada celda (con zoom)">Valores</button></div></div>
  <div class="ly-row"><span>Ruta</span><span class="seg" id="ly-path"><button data-p="">Ninguna</button><button data-p="farthest">Más lejana</button><button data-p="cash">Efectivo</button></span></div>
  <div class="ly-row"><span>Marcar</span><span class="seg" id="ly-mark"><button data-m="">Nada</button><button data-m="blind">Ciegos</button><button data-m="unreach">Inaccesibles</button></span></div>`;
 box.querySelectorAll('.lyg .ib').forEach(b => { b.onclick = () => { const k = b.dataset.l; S.lay[k] = !S.lay[k]; Snd.click(); renderViewport(); layName(b); };
  b.onmouseenter = b.onfocus = () => layName(b); b.onmouseleave = b.onblur = () => layName(); });
 box.querySelectorAll('[data-op]').forEach(r => r.oninput = () => { S.lay[r.dataset.op] = r.value / 100; r.nextElementSibling.textContent = r.value + ' %'; rangeFill(r); vpSoon(); });
 box.querySelectorAll('[data-min]').forEach(b => b.onclick = () => { S.min = Math.max(0, Math.min(.8, +(S.min + (b.dataset.min === '+' ? .2 : -.2)).toFixed(1))); renderViewport(); Snd.click(); });
 $('ly-vals').onclick = () => { S.vals = !S.vals; renderViewport(); };
 $('ly-path').onclick = e => { const b = e.target.closest('[data-p]'); if (!b || !S.res) return; if (b.dataset.p) { focus('pillar', b.dataset.p === 'cash' ? 'seg' : 'flujo'); showPath(b.dataset.p); } else { S.path = null; S.broute = null; renderViewport(); } };
 $('ly-mark').onclick = e => { const b = e.target.closest('[data-m]'); if (!b || !S.res) return; if (b.dataset.m) showMark(b.dataset.m); else { S.mark = null; renderViewport(); } };
 syncLayers(); }
/** Refleja el estado en las capas y en los ojos de las métricas del inspector (la ruta o la marca que se ve en el plano). */
function syncLayers() { const box = $('layers'); if (!box.firstChild) return;
 box.querySelectorAll('.lyg .ib').forEach(b => b.setAttribute('aria-pressed', !!S.lay[b.dataset.l])); layName();
 box.querySelectorAll('[data-of]').forEach(d => d.setAttribute('aria-disabled', !S.lay[d.dataset.of]));
 box.querySelectorAll('[data-op]').forEach(r => { const v = Math.round(S.lay[r.dataset.op] * 100); if (+r.value !== v) r.value = v; r.nextElementSibling.textContent = v + ' %'; rangeFill(r); });
 $('minv').textContent = S.min.toFixed(1); $('ly-vals').setAttribute('aria-pressed', S.vals);
 const p = bRoute() ? null : S.path || ''; $('ly-path').querySelectorAll('button').forEach(b => b.setAttribute('aria-pressed', b.dataset.p === p));
 $('ly-mark').querySelectorAll('button').forEach(b => b.setAttribute('aria-pressed', b.dataset.m === (S.mark || '')));
 document.querySelectorAll('#insp [data-ly]').forEach(b => { const [t, v] = b.dataset.ly.split(':'), on = (t === 'path' ? S.path : S.mark) === v; b.setAttribute('aria-pressed', on); b.title = (on ? 'Ocultar' : 'Ver') + ' en el plano'; }); }
/** Tablero (por omisión) o Senses: el instrumento de antes, para quien lo busque en Ctrl K. */
function setLeft(m) { const sn = m === 'senses'; S.left = sn ? 'senses' : 'board';
 $('lboard').hidden = sn; $('lsenses').hidden = !sn; $('b-anat').hidden = !sn; $('b-back').hidden = !sn;
 $('lp-eye').textContent = sn ? 'Instrumento' : 'Diagnóstico'; $('lp-h').textContent = sn ? 'Senses' : 'Pilares';
 $('lp-p').textContent = sn ? 'Arco = puntaje · largo = peso.' : 'Puntaje contra meta. Clic en un pilar para pintarlo en el plano.';
 if (!sn) { setLink(false); $('anat').classList.remove('on'); } Snd.click(); }

/* ===================== VIEWPORT: planta ===================== */
const X = x => (x - F.x0) * SC, Y = y => (F.y1 - y) * SC;
const pts = list => list.map(p => X(p[0]).toFixed(1) + ',' + Y(p[1]).toFixed(1)).join(' ');
const wallsById = () => { const o = {}; S.res.sel.walls.forEach(w => { o[w.id] = w; }); return o; };
function css(v) { return getComputedStyle(document.documentElement).getPropertyValue(v).trim(); }
/** El campo enfocado de un nivel como imagen (una celda = k px); r = el resultado del nivel. */
function heatImage(r = S.res) {
 const G = r.G, k = Math.max(3, Math.min(24, Math.floor(2400 / Math.max(G.nx, G.ny))));
 const cv = document.createElement('canvas'); cv.width = G.nx * k; cv.height = G.ny * k; const x = cv.getContext('2d');
 const line = css('--line'), ink = css('--ink'), col = focusColor(), dim = S.iso && S.selFam.size ? .35 : 1, rel = S.focus.type === 'rel', ha = S.lay.heat ? S.lay.heatOp : 0;
 const round = (px, py, w, h, r) => { if (!r || !x.roundRect) { x.fillRect(px, py, w, h); return; } x.beginPath(); x.roundRect(px, py, w, h, r); x.fill(); };
 x.textAlign = 'center'; x.textBaseline = 'middle'; x.font = `500 ${Math.round(k * .3)}px "JetBrains Mono", monospace`;
 for (let j = 0; j < G.ny; j++) for (let i = 0; i < G.nx; i++) {
  const c = j * G.nx + i; if (!G.inside[c]) continue; const px = i * k, py = (G.ny - 1 - j) * k;
  if (S.lay.grid && k >= 6) { x.strokeStyle = line; x.lineWidth = 1; x.strokeRect(px + .5, py + .5, k - 1, k - 1); }
  if (!G.free[c]) continue;
  const v = valueAt(c, r);
  if (S.mark === 'blind' && G.watch.length && G.seen[c] === 0 || S.mark === 'unreach' && !isFinite(G.dEnt[c])) { x.strokeStyle = ink; x.setLineDash([2, 2]); x.lineWidth = 1.2; x.strokeRect(px + 1.5, py + 1.5, k - 3, k - 3); x.setLineDash([]); }
  if (isNaN(v) || v < S.min) continue;
  const cls = Math.min(4, Math.floor(v * 5));
  if (ha && (cls > 0 || v > .05)) { x.globalAlpha = OPAC[cls] * dim * ha; x.fillStyle = col; round(px + 1, py + 1, k - 2, k - 2, k >= 8 ? 1.5 : 0); x.globalAlpha = 1; }
  if (rel && v >= S.thr) { x.strokeStyle = '#D42A3C'; x.lineWidth = Math.max(1, k / 9); x.strokeRect(px + 1.5, py + 1.5, k - 3, k - 3); }
  if (S.vals && ha && k >= 18) { x.fillStyle = ink; x.globalAlpha = .7; x.fillText(v.toFixed(1), px + k / 2, py + k / 2 + .5); x.globalAlpha = 1; }
 }
 return cv.toDataURL();
}
function drawOpening(g, o, kind, wb) {
 if (!o.at || !o.hand || !(o.width > 0)) return;
 const host = wb[o.host], t = host ? host.thickness : .2, hx = o.hand[0], hy = o.hand[1], w = o.width;
 const a = [o.at[0] - hx * w / 2, o.at[1] - hy * w / 2], b = [o.at[0] + hx * w / 2, o.at[1] + hy * w / 2];
 el('line', {x1: X(a[0]), y1: Y(a[1]), x2: X(b[0]), y2: Y(b[1]), stroke: 'var(--floor)', 'stroke-width': t * SC + 1.5}, g);
 if (kind === 'door') {
  const f = o.facing || [-hy, hx], e2 = [a[0] + f[0] * w, a[1] + f[1] * w];
  el('line', {x1: X(a[0]), y1: Y(a[1]), x2: X(e2[0]), y2: Y(e2[1]), stroke: 'var(--wall)', 'stroke-width': .9}, g);
  const v1 = [X(b[0]) - X(a[0]), Y(b[1]) - Y(a[1])], v2 = [X(e2[0]) - X(a[0]), Y(e2[1]) - Y(a[1])], sw = v1[0] * v2[1] - v1[1] * v2[0] > 0 ? 1 : 0;
  el('path', {d: `M${X(b[0])} ${Y(b[1])} A${w * SC} ${w * SC} 0 0 ${sw} ${X(e2[0])} ${Y(e2[1])}`, class: 'swing'}, g);
 } else {
  const nx = -hy * t / 4, ny = hx * t / 4;
  [1, -1].forEach(sg => el('line', {x1: X(a[0] + nx * sg), y1: Y(a[1] + ny * sg), x2: X(b[0] + nx * sg), y2: Y(b[1] + ny * sg), stroke: 'var(--wall)', 'stroke-width': .7}, g));
  el('line', {x1: X(a[0]), y1: Y(a[1]), x2: X(b[0]), y2: Y(b[1]), class: 'glass-w', 'stroke-width': Math.max(1.5, t * SC * .5)}, g);
 }
}
const selTypes = () => S.selFam;

/* ===================== vegetación: un símbolo por tipo de familia ===================== */
const seedOf = id => { let h = 7; for (const ch of String(id)) h = (h * 31 + ch.charCodeAt(0)) % 9973; return h / 9973 * 2 * Math.PI; };
/** La copa alrededor de (0, 0) con radio R: frondoso festoneado, conífera en estrella, palmera en hojas, arbusto irregular.
 *  ribs = puntas a las que van las nervaduras desde el centro. */
function plantShape(kind, R, seed) {
 const n = kind === 'palm' ? 8 : Math.max(7, Math.min(16, Math.round(R / 5))), N = n * 10, ring = [], ribs = [];
 for (let i = 0; i < N; i++) { const a = seed + i / N * 2 * Math.PI, t = (i / N * n) % 1;
  const f = kind === 'conifer' ? .7 + .3 * (1 - Math.abs(t * 2 - 1))
   : kind === 'palm' ? .28 + .72 * Math.pow(Math.abs(Math.cos(Math.PI * t)), 3)
   : kind === 'shrub' ? .84 + .1 * Math.sin(5 * a + seed) + .06 * Math.sin(9 * a + 2.3 * seed)
   : .84 + .16 * Math.abs(Math.sin(Math.PI * t));
  ring.push([Math.cos(a) * R * f, Math.sin(a) * R * f]); }
 if (kind === 'conifer' || kind === 'palm') for (let k = 0; k < n; k++) { const a = seed + (k + (kind === 'conifer' ? .5 : 0)) / n * 2 * Math.PI; ribs.push([Math.cos(a) * R * .94, Math.sin(a) * R * .94]); }
 return {ring, ribs};
}
/** En planta: copa, nervaduras, tronco. */
function drawPlant(g, pl, id) {
 const cx = X(pl.x), cy = Y(pl.y), R = pl.r * SC, {ring, ribs} = plantShape(pl.kind, R, seedOf(id)), t = el('g', {transform: `translate(${cx.toFixed(1)} ${cy.toFixed(1)})`}, g);
 el('polygon', {points: ring.map(p => p.map(v => v.toFixed(1)).join(',')).join(' '), class: 'tree-c'}, t);
 ribs.forEach(p => el('line', {x1: 0, y1: 0, x2: p[0].toFixed(1), y2: p[1].toFixed(1), class: 'tree-l'}, t));
 if (pl.kind === 'tree') el('circle', {cx: 0, cy: 0, r: (R * .48).toFixed(1), class: 'tree-l', 'stroke-dasharray': '2 3'}, t);
 if (pl.trunk) el('circle', {cx: 0, cy: 0, r: Math.max(1.4, pl.trunk * SC).toFixed(1), class: 'tree-t'}, t);
}
function drawPlan(svg, opts = {}) { svg.innerHTML = ''; svg.classList.add('plan');
 const r = S.res, G = r.G, s = r.sel, wb = wallsById();
 const vb = !opts.full && S.zoom ? S.zoom : [-14, -14, F.W + 28, F.H + 44];
 svg.setAttribute('viewBox', vb.join(' ')); svg._vb = vb;
 s.floors.forEach(f => f.outline.forEach((ring, i) => el('polygon', {points: pts(ring), fill: i ? 'var(--bg)' : 'var(--floor)', stroke: 'var(--line-2)', 'stroke-width': .6}, svg)));
 el('image', {href: heatImage(), x: 0, y: 0, width: F.W, height: F.H, preserveAspectRatio: 'none'}, svg);
 const w = el('g', {}, svg);
 s.rooms.forEach(rm => el('polygon', {points: pts(rm.outline[0]), class: 'roomo'}, w));
 s.walls.forEach(wl => { const p = pts(wl.path), t = Math.max(1.3, wl.thickness * SC);
  if (wl.curtain) { el('polyline', {points: p, fill: 'none', class: 'glass-w', 'stroke-width': t}, w); el('polyline', {points: p, fill: 'none', stroke: 'var(--wall)', 'stroke-width': .7}, w); }
  else el('polyline', {points: p, fill: 'none', stroke: 'var(--wall)', 'stroke-width': t, 'stroke-linejoin': 'miter', 'stroke-linecap': 'square'}, w); });
 s.doors.forEach(d => drawOpening(w, d, 'door', wb)); s.windows.forEach(o => drawOpening(w, o, 'window', wb));
 const fu = el('g', {opacity: S.lay.furnOp}, w);
 s.obstacles.forEach(o => { const pl = E.plantOf(r.model, o); if (pl) { if (S.lay.plants) drawPlant(w, pl, o.id); return; }
  if (!S.lay.furn) return; const cs = circStyle(o);
  if (cs) { el('polygon', {points: pts(o.footprint), class: 'furn', style: 'fill:var(--floor);fill-opacity:1'}, fu); el('polygon', {points: pts(o.footprint), fill: cs.fill, 'fill-opacity': cs.op.toFixed(2), stroke: cs.dash ? 'var(--muted)' : BY.circ.c1, 'stroke-width': .8, 'stroke-dasharray': cs.dash ? '2 2' : null}, fu); return; }
  el('polygon', {points: pts(o.footprint), class: 'furn', style: o.category === 'Columns' ? 'fill:var(--wall);fill-opacity:.55' : ''}, fu); });
 // Circularidad: los muros y puertas también se tiñen según su contenido reciclado
 if (circOn()) [].concat(s.walls).forEach(wl => { const cs = circStyle(wl); if (!cs || cs.dash) return; el('polyline', {points: pts(wl.path), fill: 'none', stroke: cs.fill, 'stroke-opacity': cs.op.toFixed(2), 'stroke-width': Math.max(2.5, wl.thickness * SC + 1.5), 'stroke-linecap': 'square'}, w); });
 // puestos de personal y accesos
 const showWatch = S.lay.watch || S.focus.k.indexOf('seg') >= 0 || S.focus.k === 'orient'; // en Seguridad y Orientación siempre: el mapa sale de ellos
 if (showWatch) G.watch.forEach(p => { const [x, y] = G.xy(p.c); el('circle', {cx: X(x), cy: Y(y), r: 4.2, class: 'pin', stroke: BY.seg.c1}, w); el('circle', {cx: X(x), cy: Y(y), r: 1.6, fill: BY.seg.c1}, w); });
 if (S.focus.type === 'pillar' && S.focus.k === 'orient' && S.px.type === 'all' && S.res._sp) S.res._sp.vps.filter(v => v.kind === 'cliente').forEach(v => { const cx = X(v.x), cy = Y(v.y), c1 = BY.orient.c1, g = el('g', {}, w); el('title', {}, g).textContent = v.name;
  el('path', {d: `M${cx} ${cy - 5.2} L${cx + 5.2} ${cy} L${cx} ${cy + 5.2} L${cx - 5.2} ${cy} Z`, fill: c1, stroke: 'var(--floor)', 'stroke-width': 1.3}, g); el('circle', {cx, cy, r: 1.5, fill: 'var(--floor)'}, g); }); // puntos de vista de los clientes
 if (S.lay.ent) G.entrances.forEach(e => { const [x, y] = G.xy(e.c); el('path', {d: `M${X(x) - 5} ${Y(y) + 4} L${X(x)} ${Y(y) - 4} L${X(x) + 5} ${Y(y) + 4}`, fill: 'none', stroke: 'var(--ink)', 'stroke-width': 1.6, 'stroke-linecap': 'round', 'stroke-linejoin': 'round'}, w); });
 // rutas
 if (S.path && G.paths[S.path]) { const ps = G.paths[S.path].cells.map(c => G.xy(c)), col = S.path === 'cash' ? BY.seg.c1 : BY.flujo.c1;
  el('polyline', {points: pts(ps), class: 'route', stroke: 'var(--floor)', 'stroke-width': 6}, w); el('polyline', {points: pts(ps), class: 'route flow', stroke: col}, w);
  [ps[0], ps[ps.length - 1]].forEach(p => el('circle', {cx: X(p[0]), cy: Y(p[1]), r: 4.5, fill: col, stroke: 'var(--floor)', 'stroke-width': 1.5}, w)); }
 const br = bRoute(); if (br) planRouteLegs(w, br);
 // etiquetas
 if (S.lay.labels) s.rooms.forEach(rm => { const [cx, cy] = E.ringCentroid(rm.outline[0]); const t = el('text', {x: X(cx), y: Y(cy), 'text-anchor': 'middle', class: 'lbl'}, svg); t.textContent = rm.name || rm.number; });
 S.hlRooms.forEach(k => { const rm = s.rooms[k]; if (rm) el('polygon', {points: pts(rm.outline[0]), fill: 'none', stroke: 'var(--ink)', 'stroke-width': 1.8, 'stroke-dasharray': '6 4'}, svg); });
 // selección de familias
 const st = selTypes();
 if (st.size) {
  s.obstacles.filter(o => st.has(o.type)).forEach(o => { const pl = E.plantOf(r.model, o);
   if (pl) el('circle', {cx: X(pl.x), cy: Y(pl.y), r: pl.r * SC, class: 'selshape'}, svg); else el('polygon', {points: pts(o.footprint), class: 'selshape'}, svg); });
  s.walls.filter(o => st.has(o.type)).forEach(o => el('polyline', {points: pts(o.path), fill: 'none', class: 'selshape', 'stroke-width': 5}, svg));
  s.floors.filter(o => st.has(o.type)).forEach(o => el('polygon', {points: pts(o.outline[0]), class: 'selshape', 'stroke-width': 2}, svg));
  [].concat(s.doors, s.windows).filter(o => st.has(o.type) && o.at).forEach(o => el('circle', {cx: X(o.at[0]), cy: Y(o.at[1]), r: Math.max(5, o.width * SC / 2), class: 'selshape'}, svg));
 }
 const sc = el('g', {transform: `translate(0 ${F.H + 14})`}, svg); [0, 1, 2, 3, 4].forEach(i => el('rect', {x: i * SC, y: 0, width: SC, height: 3, fill: i % 2 ? 'var(--floor)' : 'var(--ink)', stroke: 'var(--ink)', 'stroke-width': .5}, sc)); const stx = el('text', {x: 5 * SC + 4, y: 4, class: 'lbl'}, sc); stx.textContent = '5 m';
 const c = G.cell * SC; svg._probe = el('g', {opacity: 0}, svg); el('rect', {x: -c / 2, y: -c / 2, width: c, height: c, fill: 'none', stroke: 'var(--ink)', 'stroke-width': 1.2}, svg._probe);
}
/** Los tramos de la ruta del edificio que caen en el nivel de la planta, con su marca donde llega de otro nivel o sube/baja a otro. */
function planRouteLegs(g, br) {
 const b = S.bld, col = BY.flujo.c1, legs = br.r.legs;
 legs.forEach((l, i) => { const L = b.levels[l.li]; if (L.id !== S.res.level.id) return;
  const ps = l.cells.map(c => L.res.G.xy(c));
  el('polyline', {points: pts(ps), class: 'route', stroke: 'var(--floor)', 'stroke-width': 6}, g); el('polyline', {points: pts(ps), class: 'route flow', stroke: col}, g);
  [[ps[0], legs[i - 1], 'desde'], [ps[ps.length - 1], legs[i + 1], '']].forEach(([p, other, from]) => {
   el('circle', {cx: X(p[0]), cy: Y(p[1]), r: 4.5, fill: col, stroke: 'var(--floor)', 'stroke-width': 1.5}, g);
   if (!other) return; const O = b.levels[other.li], up = O.elevation > L.elevation;
   const t = el('text', {x: X(p[0]) + 9, y: Y(p[1]) - 7, class: 'tag'}, g); t.textContent = from ? `desde ${O.name}` : `${up ? '↑ sube' : '↓ baja'} a ${O.name}`; }); }); }
/** Lo que hay bajo el puntero: una instancia con familia (obstáculo, puerta o ventana). */
function hitElement(x, y) {
 const s = S.res.sel;
 for (const o of s.obstacles) if (E.inOutline(x, y, [o.footprint])) return o;
 for (const o of [].concat(s.doors, s.windows)) if (o.at && Math.hypot(x - o.at[0], y - o.at[1]) <= Math.max(.4, o.width / 2)) return o;
 return null;
}
function cellOf(x, y) { const G = S.res.G, i = Math.floor((x - G.ox) / G.cell), j = Math.floor((y - G.oy) / G.cell); return i < 0 || j < 0 || i >= G.nx || j >= G.ny ? -1 : j * G.nx + i; }
function rawLine(k, c) {
 const G = S.res.G;
 if (k === 'flujo') return isFinite(G.dEnt[c]) ? `${fmt(G.dEnt[c], 1)} m al acceso` : 'sin ruta';
 if (k === 'visib') return `isovista ${fmt(G.iso[c])} m²`;
 if (k === 'seg') return `${G.seen[c]} puesto${G.seen[c] === 1 ? '' : 's'}`;
 if (k === 'conf') return `luz ${fmt(G.day[c], 1)} · ruido ${fmt(G.noise[c], 1)}`;
 return '';
}
function probe(svg) { const tip = $('tip'); let drag = null;
 svg.addEventListener('pointermove', e => {
  if (drag) { const dx = e.clientX - drag.x, dy = e.clientY - drag.y; if (Math.hypot(dx, dy) > 4) drag.moved = true; if (drag.moved) { const k = svg._vb[2] / svg.clientWidth; S.zoom = [drag.vb[0] - dx * k, drag.vb[1] - dy * k, drag.vb[2], drag.vb[3]]; svg.setAttribute('viewBox', S.zoom.join(' ')); svg._vb = S.zoom; placeZone(); } return; }
  const pt = svgPt(svg, e), x = F.x0 + pt.x / SC, y = F.y1 - pt.y / SC, c = cellOf(x, y), G = S.res.G;
  zoneNear(c >= 0 && S.hlRooms.includes(G.room[c]));
  if (c < 0 || !G.inside[c]) { tip.style.opacity = 0; svg._probe.setAttribute('opacity', 0); svg.style.cursor = 'grab'; return; }
  const i = c % G.nx, j = (c - i) / G.nx, cs = G.cell * SC;
  svg._probe.setAttribute('transform', `translate(${i * cs + cs / 2},${(G.ny - 1 - j) * cs + cs / 2})`); svg._probe.setAttribute('opacity', .8);
  const rm = G.room[c] >= 0 ? S.res.sel.rooms[G.room[c]] : null, hit = hitElement(x, y), ty = hit && S.res.model.types[hit.type];
  const ks = S.focus.type === 'rel' ? S.focus.k.split('|') : [S.focus.k];
  tip.innerHTML = `<div><b>${esc(rm ? rm.name : 'sin room')}</b><span class="muted">${fmt(x, 1)}, ${fmt(y, 1)} m</span></div>` +
   (G.free[c] ? ks.map(k => `<div><span style="color:${BY[k].c1}">● ${BY[k].s}</span><span>${isNaN(S.res.fields[k][c]) ? '—' : S.res.fields[k][c].toFixed(2)} <span class="muted">${rawLine(k, c)}</span></span></div>`).join('') + (S.focus.type === 'rel' ? `<div><span style="color:#D42A3C">● cruce</span><span>${isNaN(valueAt(c)) ? '—' : valueAt(c).toFixed(2)}</span></div>` : '') : '<div class="muted">ocupado (muro, columna o mueble)</div>') +
   (ty ? `<div style="margin-top:4px"><span style="color:var(--sel)">▣ ${esc(ty.family)} · ${esc(ty.name)}</span><span class="muted">clic = propiedades</span></div>` : '');
  const host = svg.closest('.panel').getBoundingClientRect(); let px = e.clientX - host.left + 14, py = e.clientY - host.top + 14; if (px > host.width - 260) px -= 280; tip.style.left = px + 'px'; tip.style.top = py + 'px'; tip.style.opacity = 1; svg.style.cursor = ty ? 'pointer' : 'crosshair'; });
 svg.addEventListener('pointerleave', () => { zoneNear(false); tip.style.opacity = 0; svg._probe.setAttribute('opacity', 0); });
 svg.addEventListener('pointerdown', e => { drag = {x: e.clientX, y: e.clientY, vb: svg._vb.slice(), moved: false}; svg.setPointerCapture(e.pointerId); });
 svg.addEventListener('pointerup', e => { const d = drag; drag = null; if (!d || d.moved) return;
  const pt = svgPt(svg, e), x = F.x0 + pt.x / SC, y = F.y1 - pt.y / SC, hit = hitElement(x, y);
  if (hit && S.res.model.types[hit.type]) { zoneClose(); openFam(hit.type); return; }
  const c = cellOf(x, y), k = c >= 0 ? S.res.G.room[c] : -1; if (k >= 0) roomClick(k, e.shiftKey); else if (S.hlRooms.length) clearRooms(); });
 svg.addEventListener('wheel', e => { e.preventDefault(); const pt = svgPt(svg, e), vb = svg._vb, f = e.deltaY > 0 ? 1.15 : 1 / 1.15, w = Math.min(F.W * 3, Math.max(F.W / 12, vb[2] * f)), h = vb[3] * w / vb[2];
  S.zoom = [pt.x - (pt.x - vb[0]) * w / vb[2], pt.y - (pt.y - vb[1]) * h / vb[3], w, h]; svg.setAttribute('viewBox', S.zoom.join(' ')); svg._vb = S.zoom; placeZone(); }, {passive: false});
 svg.addEventListener('dblclick', () => { S.zoom = null; renderViewport(); }); }

/* ===================== VIEWPORT: 3D maqueta blanca cortada a 1.20 m ===================== */
const KA = .866 * .62, KB = .5 * .62;
let ROT = {c: 1, s: 0, x: 0, y: 0}; // giro de la maqueta alrededor del centro de la planta (lo fija drawAxo)
const turn = (x, y) => { const dx = x - ROT.x, dy = y - ROT.y; return [ROT.x + dx * ROT.c - dy * ROT.s, ROT.y + dx * ROT.s + dy * ROT.c]; };
let ZOFF = 0; // altura de dibujo del nivel que se está dibujando (3D con todos los niveles)
const ISO = (x, y, z = 0) => { const [u, v] = turn(x, y); return [(u - v) * KA, (u + v) * KB - (z + ZOFF) * .62]; };
const DEPTH = (x, y) => { const [u, v] = turn(x, y); return u + v; }; // mayor = más cerca del observador
const quad = list => list.map(p => ISO(p[0], p[1], p[2] || 0).map(v => v.toFixed(1)).join(',')).join(' ');
/** Tramos de un muro con sus huecos: puertas (vacío) y ventanas (antepecho + vidrio). */
function wallPieces(wl, openings) {
 const out = [];
 for (let k = 0; k < wl.path.length - 1; k++) {
  const a = wl.path[k], b = wl.path[k + 1], L = Math.hypot(b[0] - a[0], b[1] - a[1]); if (L < 1e-6) continue;
  const ux = (b[0] - a[0]) / L, uy = (b[1] - a[1]) / L, cuts = [];
  openings.forEach(o => { if (!o.at) return; const t = (o.at[0] - a[0]) * ux + (o.at[1] - a[1]) * uy, d = Math.abs((o.at[0] - a[0]) * uy - (o.at[1] - a[1]) * ux); if (d < .6 && t > -o.width / 2 && t < L + o.width / 2) cuts.push({t0: Math.max(0, t - o.width / 2), t1: Math.min(L, t + o.width / 2), o}); });
  cuts.sort((p, q) => p.t0 - q.t0); let t = 0;
  const P2 = s => [a[0] + ux * s, a[1] + uy * s];
  cuts.forEach(ct => { if (ct.t0 > t) out.push({a: P2(t), b: P2(ct.t0), kind: 'solid'}); out.push({a: P2(ct.t0), b: P2(ct.t1), kind: ct.o.sill != null ? 'win' : 'door', sill: ct.o.sill}); t = Math.max(t, ct.t1); });
  if (t < L) out.push({a: P2(t), b, kind: 'solid'});
 }
 return out;
}
/** Encuadre del 3D: el círculo que contiene la planta, así no cambia de tamaño al girar; S.cam3 lo acerca y lo desplaza.
 *  zTop = altura de dibujo del nivel más alto cuando se ven todos. */
function axoBox(zTop = 0) {
 const R = Math.hypot(F.W, F.H) / 2, [cx, cy] = ISO(ROT.x, ROT.y, 0), w = 2 * R * KA * Math.SQRT2 + 40, h = 2 * R * KB * Math.SQRT2 + 80 + zTop * .62, k = S.cam3.k;
 return [cx + S.cam3.x - w / 2 / k, cy - 20 - zTop * .31 + S.cam3.y - h / 2 / k, w / k, h / k];
}
/** Los niveles que dibuja el 3D: el actual, o todos apilados. La separación respeta la proporción entre elevaciones,
 *  pero en promedio es el 42 % del alto de la planta en pantalla (× S.gap), para que cada nivel se asome bajo el de arriba. */
function axoLayers() {
 const b = S.stack && multiLevel() ? bld() : null;
 if (!b || b.levels.length < 2) return [{r: S.res, z: 0, cur: true, name: S.res.level.name}];
 const e0 = b.levels[0].elevation, span = (b.levels[b.levels.length - 1].elevation - e0) || 1;
 const k = Math.hypot(F.W, F.H) * KB * Math.SQRT2 / .62 * .42 * S.gap * (b.levels.length - 1) / span;
 return b.levels.map(L => ({r: L.res, z: (L.elevation - e0) * k, cur: L.id === S.res.level.id, name: L.name}));
}
function drawAxo(svg) { svg.innerHTML = ''; svg.classList.add('plan');
 const ang = S.rot * Math.PI / 180, layers = axoLayers(), stack = layers.length > 1;
 ROT = {c: Math.cos(ang), s: Math.sin(ang), x: F.W / 2, y: F.H / 2};
 ZOFF = 0;
 const vb = axoBox(layers[layers.length - 1].z); svg.setAttribute('viewBox', vb.join(' '));
 // unidades del dibujo por píxel de pantalla: las etiquetas de nivel se leen igual en una laptop que en un monitor
 svg.style.setProperty('--u', Math.max(vb[2] / Math.max(1, svg.clientWidth - 16), vb[3] / Math.max(1, svg.clientHeight - 30)).toFixed(3));
 // el norte de la planta (arriba en el dibujo) visto en la maqueta girada
 const nn = svg.parentNode && svg.parentNode.querySelector('.north'); if (nn) { const p0 = ISO(ROT.x, ROT.y), p1 = ISO(ROT.x, ROT.y - 10); nn.innerHTML = `N <span style="display:inline-block;transform:rotate(${(Math.atan2(p1[0] - p0[0], p0[1] - p1[1]) * 180 / Math.PI).toFixed(0)}deg)">↑</span>`; }
 svg._heat = svg._heat || {};
 layers.forEach((Ly, i) => drawLayer3D(stack ? el('g', {opacity: Ly.cur ? 1 : .78}, svg) : svg, Ly, svg._heat, stack, i));
 ZOFF = 0;
 const br = bRoute(); if (br) drawRoute3D(svg, br, layers);
}
/** Un nivel de la maqueta a la altura Ly.z: losa, campo, muros y huecos, obstáculos y vegetación, rutas y nombres. */
function drawLayer3D(g, Ly, heat, stack, i) {
 const r = Ly.r, s = r.sel, e = s.e, CUT = 1.2, G = r.G;
 ZOFF = Ly.z;
 s.floors.forEach(f => { el('polygon', {points: quad(f.outline[0].map(p => [X(p[0]), Y(p[1]), -6])), fill: 'var(--line)'}, g); el('polygon', {points: quad(f.outline[0].map(p => [X(p[0]), Y(p[1]), 0])), fill: 'var(--floor)', 'fill-opacity': stack && i ? .82 : 1, stroke: 'var(--wall)', 'stroke-width': .6}, g); });
 // la imagen del campo se calcula una vez por vista y nivel; al girar o mover solo cambia su transformación
 const o0 = ISO(0, 0), o1 = ISO(1, 0), o2 = ISO(0, 1), id = r.level.id;
 const him = el('image', {href: heat[id] || (heat[id] = heatImage(r)), x: X(G.ox), y: Y(G.oy + G.ny * G.cell), width: G.nx * G.cell * SC, height: G.ny * G.cell * SC, preserveAspectRatio: 'none', transform: `matrix(${o1[0] - o0[0]} ${o1[1] - o0[1]} ${o2[0] - o0[0]} ${o2[1] - o0[1]} ${o0[0]} ${o0[1]})`}, g);
 if (Ly.cur) (g.ownerSVGElement || g)._img3 = him; // la animación de «cómo nace» se monta sobre esta imagen, con su misma posición e inclinación
 const items = [], hOf = z => Math.max(.05, Math.min(CUT, z - e)) * SC;
 const openings = [].concat(s.doors, s.windows);
 s.walls.forEach(wl => { if (!(s.wallMoves(wl) || s.wallSight(wl))) return; const H = hOf(wl.z[1]);
  wallPieces(wl, openings.filter(o => o.host === wl.id)).forEach(pc => { const A = [X(pc.a[0]), Y(pc.a[1])], B = [X(pc.b[0]), Y(pc.b[1])];
   items.push({d: (DEPTH(A[0], A[1]) + DEPTH(B[0], B[1])) / 2, draw: () => {
    if (wl.curtain || pc.kind === 'win') { const z0 = pc.kind === 'win' ? Math.min(H, (pc.sill || 0) * SC) : 0;
     if (z0 > 0) el('polygon', {points: quad([[A[0], A[1], 0], [B[0], B[1], 0], [B[0], B[1], z0], [A[0], A[1], z0]]), fill: 'var(--surface-2)', stroke: 'var(--wall)', 'stroke-width': .6}, g);
     el('polygon', {points: quad([[A[0], A[1], z0], [B[0], B[1], z0], [B[0], B[1], H], [A[0], A[1], H]]), fill: '#8DBBD9', 'fill-opacity': .22, stroke: '#8DBBD9', 'stroke-width': .6}, g); return; }
    if (pc.kind === 'door') { const [a1, b1] = ISO(A[0], A[1], 0), [a2, b2] = ISO(B[0], B[1], 0); el('line', {x1: a1, y1: b1, x2: a2, y2: b2, stroke: 'var(--wall)', 'stroke-width': .5, 'stroke-dasharray': '2 2'}, g); return; }
    el('polygon', {points: quad([[A[0], A[1], 0], [B[0], B[1], 0], [B[0], B[1], H], [A[0], A[1], H]]), fill: 'var(--surface-2)', 'fill-opacity': .94, stroke: 'var(--wall)', 'stroke-width': .7, 'stroke-linejoin': 'round'}, g);
    const [a, b] = ISO(A[0], A[1], H), [cx, cy] = ISO(B[0], B[1], H); el('line', {x1: a, y1: b, x2: cx, y2: cy, stroke: 'var(--wall)', 'stroke-width': Math.max(1.6, wl.thickness * SC * .5), 'stroke-linecap': 'round'}, g); }}); }); });
 const st = selTypes();
 s.obstacles.forEach(o => { const pl = E.plantOf(r.model, o); if (pl) { if (S.lay.plants) items.push({d: DEPTH(X(pl.x), Y(pl.y)), draw: () => drawPlant3D(g, pl, o.id, hOf(o.z[1]), st.has(o.type))}); return; }
  if (!S.lay.furn) return;
  const H = hOf(o.z[1]), fp = o.footprint.map(p => [X(p[0]), Y(p[1])]), cx = fp.reduce((a, p) => a + DEPTH(p[0], p[1]), 0) / fp.length, sel = st.has(o.type), cs = circStyle(o);
  items.push({d: cx, draw: () => { const fg = el('g', {opacity: S.lay.furnOp}, g);
   const edges = fp.map((p, i) => [p, fp[(i + 1) % fp.length]]).sort((u, v) => (DEPTH(u[0][0], u[0][1]) + DEPTH(u[1][0], u[1][1])) - (DEPTH(v[0][0], v[0][1]) + DEPTH(v[1][0], v[1][1])));
   edges.forEach(([p, q]) => { const pq = quad([[p[0], p[1], 0], [q[0], q[1], 0], [q[0], q[1], H], [p[0], p[1], H]]); el('polygon', {points: pq, fill: o.category === 'Columns' ? 'var(--line-2)' : 'var(--line)', stroke: 'var(--wall)', 'stroke-width': .35}, fg);
    if (cs && !cs.dash) el('polygon', {points: pq, fill: cs.fill, 'fill-opacity': (cs.op * .8).toFixed(2)}, fg); });
   const top = quad(fp.map(p => [p[0], p[1], H]));
   el('polygon', {points: top, fill: 'var(--surface-2)', stroke: 'var(--wall)', 'stroke-width': .5, class: sel ? 'selshape' : '', 'stroke-dasharray': cs && cs.dash ? '2 2' : null}, fg);
   if (cs && !cs.dash) el('polygon', {points: top, fill: cs.fill, 'fill-opacity': cs.op.toFixed(2), stroke: BY.circ.c1, 'stroke-width': .5}, fg); }}); });
 items.sort((a, b) => a.d - b.d).forEach(it => it.draw());
 if (Ly.cur && S.path && G.paths[S.path]) { const ps = G.paths[S.path].cells.map(c => G.xy(c)); el('polyline', {points: ps.map(p => ISO(X(p[0]), Y(p[1]), 2).map(v => v.toFixed(1)).join(',')).join(' '), class: 'route flow', stroke: S.path === 'cash' ? BY.seg.c1 : BY.flujo.c1}, g); }
 if (Ly.cur && S.lay.labels) s.rooms.forEach(rm => { const [cx, cy] = E.ringCentroid(rm.outline[0]); const [x, y] = ISO(X(cx), Y(cy), 0); const t = el('text', {x, y, 'text-anchor': 'middle', class: 'lbl'}, g); t.textContent = rm.name || rm.number; });
 if (stack) { // el nombre del nivel junto a su esquina más a la izquierda
  const cs = [[G.ox, G.oy], [G.ox + G.nx * G.cell, G.oy], [G.ox, G.oy + G.ny * G.cell], [G.ox + G.nx * G.cell, G.oy + G.ny * G.cell]].map(([x, y]) => ISO(X(x), Y(y), 0)).sort((a, b) => a[0] - b[0])[0];
  const t = el('text', {x: cs[0] - 8, y: cs[1], 'text-anchor': 'end', class: 'lvtag' + (Ly.cur ? ' cur' : '')}, g); t.textContent = Ly.name; }
}
/** La ruta del edificio en 3D: cada tramo sobre su nivel y un salto punteado donde sube o baja por la escalera.
 *  Con un solo nivel a la vista, solo sus tramos. */
function drawRoute3D(svg, br, layers) {
 const b = S.bld, col = BY.flujo.c1, at = {}; layers.forEach(Ly => { at[Ly.r.level.id] = Ly.z; });
 const line = ps => ps.map(p => p.map(v => v.toFixed(1)).join(',')).join(' ');
 let prev = null; const ends = [];
 br.r.legs.forEach(l => { const L = b.levels[l.li], z = at[L.id];
  if (z == null) { prev = null; return; }
  const ps = l.cells.map(c => L.res.G.xy(c)).map(p => ISO(X(p[0]), Y(p[1]), z + 2));
  if (prev) el('line', {x1: prev[0].toFixed(1), y1: prev[1].toFixed(1), x2: ps[0][0].toFixed(1), y2: ps[0][1].toFixed(1), class: 'route', stroke: col, 'stroke-width': 2.2, 'stroke-dasharray': '4 3'}, svg);
  el('polyline', {points: line(ps), class: 'route', stroke: 'var(--floor)', 'stroke-width': 5}, svg);
  el('polyline', {points: line(ps), class: 'route flow', stroke: col}, svg);
  if (!ends.length) ends.push(ps[0]); prev = ps[ps.length - 1]; });
 if (prev) ends.push(prev);
 ends.forEach(p => el('circle', {cx: p[0].toFixed(1), cy: p[1].toFixed(1), r: 4.5, fill: col, stroke: 'var(--floor)', 'stroke-width': 1.5}, svg));
}
/** En 3D: sombra en el piso, tronco y la copa en planta levantada justo sobre el corte, para no tapar la maqueta.
 *  Un arbusto es su mata a su altura (hasta el corte). */
function drawPlant3D(svg, pl, id, H, sel) {
 const cx = X(pl.x), cy = Y(pl.y), {ring, ribs} = plantShape(pl.kind, pl.r * SC, seedOf(id));
 const at = z => quad(ring.map(p => [cx + p[0], cy + p[1], z]));
 el('polygon', {points: at(0), class: 'tree-sh'}, svg);
 const zc = pl.trunk ? 1.2 * SC + 6 : H;
 if (pl.trunk) { const [a, b] = ISO(cx, cy, 0), [c, d] = ISO(cx, cy, zc); el('line', {x1: a, y1: b, x2: c, y2: d, class: 'tree-t3', 'stroke-width': Math.max(1.4, pl.trunk * SC * .9)}, svg); }
 el('polygon', {points: at(zc), class: 'tree-c' + (sel ? ' selshape' : '')}, svg);
 ribs.forEach(p => { const [a, b] = ISO(cx, cy, zc), [c, d] = ISO(cx + p[0], cy + p[1], zc); el('line', {x1: a, y1: b, x2: c, y2: d, class: 'tree-l'}, svg); });
}
/** 3D: arrastrar = desplazar, Shift + arrastrar o botón derecho = girar, rueda = acercar, doble clic = encuadrar. */
function axoNav(svg) { let drag = null, raf = 0;
 const redraw = () => { if (raf) return; raf = requestAnimationFrame(() => { raf = 0; drawAxo(svg); }); };
 svg.style.cursor = 'grab';
 svg.addEventListener('contextmenu', e => e.preventDefault());
 svg.addEventListener('pointerdown', e => { drag = {x: e.clientX, y: e.clientY, orbit: e.shiftKey || e.button !== 0, cam: {...S.cam3}, rot: S.rot, k: 1 / svg.getScreenCTM().a}; svg.setPointerCapture(e.pointerId); svg.style.cursor = drag.orbit ? 'ew-resize' : 'grabbing'; });
 svg.addEventListener('pointermove', e => { if (!drag) return; const dx = e.clientX - drag.x, dy = e.clientY - drag.y;
  if (drag.orbit) S.rot = drag.rot + dx * .4; else S.cam3 = {k: drag.cam.k, x: drag.cam.x - dx * drag.k, y: drag.cam.y - dy * drag.k};
  redraw(); });
 const end = () => { drag = null; svg.style.cursor = 'grab'; };
 svg.addEventListener('pointerup', end); svg.addEventListener('pointercancel', end);
 // el punto bajo el puntero se queda quieto al acercar
 svg.addEventListener('wheel', e => { e.preventDefault(); const pt = svgPt(svg, e), vb = svg.viewBox.baseVal, k = Math.min(12, Math.max(.5, S.cam3.k * (e.deltaY > 0 ? 1 / 1.15 : 1.15))), q = S.cam3.k / k, cx = vb.x + vb.width / 2, cy = vb.y + vb.height / 2;
  S.cam3 = {k, x: S.cam3.x + (cx - pt.x) * (q - 1), y: S.cam3.y + (cy - pt.y) * (q - 1)}; drawAxo(svg); }, {passive: false});
 svg.addEventListener('dblclick', () => { S.cam3 = {k: 1, x: 0, y: 0}; drawAxo(svg); }); }
function renderViewportBase() { const vb = $('vbody'); vb.className = 'vbody' + (S.view === 'split' ? ' split' : ''); vb.innerHTML = '';
 if (!S.res) { renderEmpty(vb); $('vlegend').innerHTML = ''; renderSelChip(); syncLayers(); return; }
 const mk = (type, cap) => { const d = document.createElement('div'); d.className = 'vp'; d.innerHTML = `<span class="cap">${cap}</span><span class="north">N ↑</span>`; const s = document.createElementNS(NS, 'svg'); s.setAttribute('aria-label', cap); d.appendChild(s); vb.appendChild(d);
  (type === 'plan' ? drawPlan : drawAxo)(s);
  if (type === 'plan') { probe(s); const z = document.createElement('div'); z.className = 'zoom'; z.innerHTML = '<button class="btn sq" data-z="in" aria-label="Acercar">+</button><button class="btn sq" data-z="out" aria-label="Alejar">−</button><button class="btn sq" data-z="fit" aria-label="Ver todo" title="Ver todo (doble clic)">⤢</button>'; d.appendChild(z);
   z.onclick = ev => { const b = ev.target.closest('[data-z]'); if (!b) return; if (b.dataset.z === 'fit') S.zoom = null; else { const v = s._vb, f = b.dataset.z === 'in' ? 1 / 1.4 : 1.4, w = v[2] * f, h = v[3] * f; S.zoom = [v[0] + (v[2] - w) / 2, v[1] + (v[3] - h) / 2, w, h]; } renderViewport(); }; }
  else { axoNav(s);
   if (multiLevel()) { const sk = document.createElement('span'); sk.className = 'seg vstack'; sk.title = 'Niveles en el 3D'; sk.innerHTML = `<button data-s="0" aria-pressed="${!S.stack}">1 nivel</button><button data-s="1" aria-pressed="${S.stack}">Todos</button>`; d.appendChild(sk);
    sk.onclick = e => { const b = e.target.closest('[data-s]'); if (b) setStack(b.dataset.s === '1'); }; }
   const z = document.createElement('div'); z.className = 'zoom'; z.innerHTML = '<button class="btn sq" data-r="-45" aria-label="Girar a la izquierda" title="Girar 45° (Shift + arrastrar para girar libre)">⟲</button><button class="btn sq" data-r="45" aria-label="Girar a la derecha" title="Girar 45°">⟳</button><button class="btn sq" data-z="in" aria-label="Acercar">+</button><button class="btn sq" data-z="out" aria-label="Alejar">−</button><button class="btn sq" data-z="fit" aria-label="Encuadrar" title="Encuadrar (doble clic)">⤢</button>' + (S.stack && multiLevel() ? '<button class="btn sq" data-g="-.25" aria-label="Juntar niveles" title="Juntar niveles">⇊</button><button class="btn sq" data-g=".25" aria-label="Separar niveles" title="Separar niveles">⇈</button>' : ''); d.appendChild(z);
   z.onclick = ev => { const b = ev.target.closest('button'); if (!b) return; const c = S.cam3;
    if (b.dataset.r) S.rot = Math.round((S.rot + +b.dataset.r) / 45) * 45;
    else if (b.dataset.g) { S.gap = Math.max(.25, Math.min(2.5, S.gap + +b.dataset.g)); d.querySelector('.cap').textContent = `3D · TODOS LOS NIVELES · SEPARACIÓN ×${fmt(S.gap, 2)}`; }
    else if (b.dataset.z === 'fit') S.cam3 = {k: 1, x: 0, y: 0};
    else S.cam3 = {k: Math.min(12, Math.max(.5, c.k * (b.dataset.z === 'in' ? 1.4 : 1 / 1.4))), x: c.x, y: c.y};
    drawAxo(s); Snd.click(); }; }
  return s; };
 const lv = S.res.level.name.toUpperCase();
 if (S.view !== 'axo') mk('plan', `PLANTA · ${esc(lv)} · RETÍCULA ${fmt(S.res.G.cell, 1)} m`);
 if (S.view !== 'plan') mk('axo', S.stack && multiLevel() ? `3D · TODOS LOS NIVELES · SEPARACIÓN ×${fmt(S.gap, 2)}` : '3D · MAQUETA BLANCA · CORTE A 1.20 m');
 renderLegend(); renderSelChip(); drawZone(); syncLayers(); }
function renderEmpty(vb) {
 const d = document.createElement('div'); d.className = 'drop'; d.id = 'drop';
 d.innerHTML = `<div><svg width="54" height="54" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.2" style="opacity:.6"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M9 3v18M15 3v18M3 15h18"/></svg>
  <h3>Trae un modelo de Revit</h3><p>En Revit: pestaña <b>Space Analytics → Exportar</b>. Abre el <b>.html</b> que genera o arrastra aquí su <b>.json</b>. Se analiza un modelo a la vez.</p>
  <div class="row"><button class="btn" id="e-open">Abrir space-model.json</button>${window.SA_HAS_SAMPLE === false ? '' : '<button class="btn" id="e-sample">Ver sucursal de ejemplo</button>'}</div></div>`;
 vb.appendChild(d);
 $('e-open').onclick = () => $('file-model').click();
 $('e-sample') && ($('e-sample').onclick = loadSample);
}
function renderLegendBase() { const col = focusColor(), isRel = S.focus.type === 'rel'; const name = isRel ? R[S.focus.k].n : BY[S.focus.k].name, unit = isRel ? (R[S.focus.k].op === 'conflict' ? `${BY[S.focus.k.split('|')[0]].s} alto × ${BY[S.focus.k.split('|')[1]].s} bajo` : `${S.focus.k.split('|').map(k => BY[k].s).join(' alto × ')} alto`) + ' · borde = sobre umbral' : BY[S.focus.k].unit;
 const G = S.res.G, path = S.path && G.paths[S.path];
 $('vlegend').innerHTML = `<span class="eyebrow">Capa</span><b style="font:500 12px Outfit;white-space:nowrap">${name}</b><span class="scale">${OPAC.map(o => `<i style="background:${col};opacity:${o}"></i>`).join('')}</span><span class="scale-l"><span>0</span><span>.2</span><span>.4</span><span>.6</span><span>.8</span><span>1</span></span><span class="unit" title="${esc(unit)}">${unit}</span><span class="sp"></span>` +
  (path ? `<span class="chip">${S.path === 'cash' ? 'Ruta de efectivo' : 'Ruta más lejana'} · <span class="mono">${fmt(path.length, 1)} m</span> <button id="pathx" aria-label="Quitar ruta">✕</button></span>` : '') +
  (bRoute() ? `<span class="chip">${esc(S.broute.label)} · <span class="mono">${fmt(S.broute.r.length, 1)} m</span> <button id="brx" aria-label="Quitar ruta">✕</button></span>` : '') +
  (S.mark ? `<span class="chip">${S.mark === 'blind' ? 'Puntos ciegos' : 'Áreas inaccesibles'} (borde punteado) <button id="markx" aria-label="Quitar marca">✕</button></span>` : '') +
  (isRel ? `<span class="chip" title="${S.thrUser[S.focus.k] ? 'Ajustado a mano' : 'Automático: percentil 80 de la relación'}">Umbral${S.thrUser[S.focus.k] ? '' : ' auto'} <span class="step" style="border:0;height:20px"><button id="thr-">−</button><span class="mono">${S.thr.toFixed(2)}</span><button id="thr+">+</button></span></span><span class="chip mono">${fmtA(crossArea())} m² sobre umbral</span>` : '');
 $('pathx') && ($('pathx').onclick = () => { S.path = null; renderViewport(); });
 $('markx') && ($('markx').onclick = () => { S.mark = null; renderViewport(); });
 $('brx') && ($('brx').onclick = () => { S.broute = null; renderViewport(); });
 if (isRel) { $('thr-').onclick = () => setThr(-.05); $('thr+').onclick = () => setThr(.05); } }
function renderSelChip() { const n = S.selFam.size, w = allWarnings().length;
 if (!w) S.warnOpen = false;
 $('selchip').innerHTML = (w ? `<button class="chip wchip" id="warnchip" aria-expanded="${S.warnOpen}" aria-controls="warnpop" title="Ver avisos del análisis">⚠ ${w} aviso${w > 1 ? 's' : ''}</button>${S.warnOpen ? warnPop() : ''} ` : '') + (n ? `<span class="chip sel">${n} familia${n > 1 ? 's' : ''} seleccionada${n > 1 ? 's' : ''}${S.iso ? ' · aisladas' : ''} <button aria-label="Limpiar selección" id="selx">✕</button></span>` : (S.hlRooms.length ? `<span class="chip">${S.hlRooms.length} room${S.hlRooms.length > 1 ? 's' : ''} seleccionado${S.hlRooms.length > 1 ? 's' : ''} <button id="roomx">✕</button></span>` : ''));
 $('selx') && ($('selx').onclick = () => { S.selFam.clear(); S.iso = false; renderViewport(); }); $('roomx') && ($('roomx').onclick = clearRooms);
 $('warnchip') && ($('warnchip').onclick = () => { S.warnOpen = S.warnEnter = !S.warnOpen; renderSelChip(); Snd.click(); }); }

/* ===================== INSPECTOR ===================== */
/** Los avisos del análisis: una ventana bajo el botón de avisos, solo cuando se abre. */
function warnPop() { const w = allWarnings(), enter = S.warnEnter; S.warnEnter = false; return w.length ? `<div class="warnpop${enter ? ' enter' : ''}" id="warnpop" role="dialog" aria-label="Avisos del análisis"><div class="eyebrow" style="color:#B07818">Avisos del análisis</div><ul>${w.map(x => `<li>${esc(x)}</li>`).join('')}</ul></div>` : ''; }
/** Flujo entre niveles: qué conecta los niveles y las rutas que los cruzan. */
function levelsCard() {
 const cs = E.connectorsOf(cur().model), n = {}; cs.forEach(c => { n[c.kind] = (n[c.kind] || 0) + Math.max(1, c.levels.length - 1); });
 const NAME = {stair: ['tramo de escalera', 'tramos de escalera'], ramp: ['rampa', 'rampas'], elevator: ['parada de elevador', 'paradas de elevador'], escalator: ['escalera eléctrica', 'escaleras eléctricas']};
 const what = Object.keys(n).map(k => `${n[k]} ${NAME[k][n[k] === 1 ? 0 : 1]}`).join(', ');
 return `<section class="sec"><div class="sec-h"><span class="eyebrow">Entre niveles</span></div>
  <p>${cs.length ? `${what}${cs.some(c => c.derived) ? ', deducidos de rooms de escalera o elevador apilados' : ''}.` : 'Sin escaleras ni elevadores: cada nivel queda aislado. Exporta de nuevo o nombra los rooms "Escalera" o "Elevador".'}</p>
  <div class="rcs" style="margin-top:8px"><button class="rc" data-broute="far">Ruta más larga del edificio</button><button class="rc" data-stack="1">Todos los niveles en 3D</button></div>
  <p style="margin-top:8px">Clic en un room (en la lista o en la planta) para ver su ruta desde el acceso, aunque esté en otro nivel.</p></section>`; }
/* ===================== ZONA (ficha flotante de los rooms seleccionados) ===================== */
/** m² de la zona (set de rooms) por encima del umbral de la relación rk; el mismo umbral que en la planta. */
function zoneRelArea(rk, set) { const G = S.res.G, [a, b] = rk.split('|'), thr = thrFor(rk); let n = 0;
 for (let c = 0; c < G.n; c++) if (G.free[c] && set.has(G.room[c]) && E.crossAt(S.res.fields, a, b, R[rk].op, c) >= thr) n++;
 return n * cellArea(); }
const ZABBR = {flujo: 'Flujo', visib: 'Visib.', seg: 'Segur.', conf: 'Confort', sust: 'Sust.'};
/** Contenido de la ficha: compacta (nombre, área y los cinco pilares) o desplegada (métricas, relaciones y rooms de la zona). */
function zoneCard(more) {
 const z = E.zoneStats(S.res, S.hlRooms); if (!z.rooms.length) return '';
 // la base es el promedio por celda de todo el nivel: en Sustentab. el puntaje del nivel sale de otra cuenta (datos SA_ por tipo)
 const base = E.zoneStats(S.res, null).scores;
 const one = z.rooms.length === 1, set = new Set(S.hlRooms), de = one ? 'del room' : 'de la zona', r0 = z.rooms[0];
 const pil = P.map(p => { const sc = z.scores[p.k] == null ? null : Math.round(z.scores[p.k]), lv = base[p.k] == null ? null : Math.round(base[p.k]), dv = sc != null && lv != null ? sc - lv : null;
  return `<button class="zp-p" data-p="${p.k}" title="${p.name} · meta ${p.target} · nivel ${lv == null ? '—' : lv}"><span class="zp-s" style="color:${p.c1}">${ZABBR[p.k]}</span><b>${sc == null ? '—' : sc}</b><span class="${dv ? (dv > 0 ? 'up' : 'dn') : 'muted'}">${dv == null ? '' : dv ? (dv > 0 ? '▲' : '▼') + Math.abs(dv) : '='}</span><i style="width:${sc || 0}%;background:${p.c1}"></i><em style="left:${p.target}%"></em></button>`; }).join('');
 let h = `<div class="zp-h"><div style="min-width:0"><div class="eyebrow">${one ? 'Room' + (r0.number && r0.number !== r0.name ? ' · ' + esc(r0.number) : '') : `Zona · ${z.rooms.length} rooms`}</div>
  <div class="zp-n">${one ? esc(r0.name) : esc(z.rooms.map(r => r.name).join(', '))}</div></div><button class="zp-x" id="zone-x" aria-label="Quitar selección" title="Quitar selección">✕</button></div>
  <div class="muted mono" style="font-size:9.5px;margin-top:2px">${fmtA(z.area)} m² · ${fmtA(z.freeArea)} m² libres</div>
  <div class="zp-ps">${pil}</div>`;
 if (more) {
  const met = [['Distancia media desde el acceso', z.avgD, 'm', 1], ['Punto más lejano', z.maxD, 'm', 1], ['Área con luz natural', z.daylight, '%', 0], ['Zona de ruido', z.noisy, 'm²', 1], ['Puntos ciegos', z.blind, 'm²', 1], ['Área inaccesible', z.unreach, 'm²', 1]]
   .map(r => `<tr><td>${r[0]}</td><td class="v">${fmt(r[1], r[3])} ${r[1] == null ? '' : r[2]}</td></tr>`).join('');
  const rels = [...S.rels].map(rk => { const [a, b] = rk.split('|'), ar = zoneRelArea(rk, set);
   return `<tr><td>${R[rk].n}<small>${BY[a].s} × ${BY[b].s} · umbral ${thrFor(rk).toFixed(2)}</small></td><td class="v">${fmtA(ar)} m²</td><td class="d">${z.freeArea ? fmt(ar / z.freeArea * 100) + ' %' : ''}</td></tr>`; }).join('');
  h += `<div class="zp-more">${one ? '' : `<div class="relto" style="margin-bottom:4px">${z.rooms.map(r => `<button data-zr="${r.k}" title="Quitar de la zona">${esc(r.name)} ✕</button>`).join('')}</div>`}
   <table>${met}</table>
   ${rels ? `<div class="eyebrow" style="margin:8px 0 0">Relaciones dentro ${de}</div><table>${rels}</table>` : ''}
   <div class="muted" style="font-size:10px;margin-top:6px">Shift + clic para ${one ? 'sumar rooms y armar una zona' : 'sumar o quitar rooms'}. Clic en un pilar para enfocarlo.</div></div>`;
 }
 return h + `<button class="zp-t" id="zone-more" aria-expanded="${!!more}">${more ? 'Menos ▴' : 'Más detalles ▾'}</button>`; }
/* Se abre al picar un room y se cierra al picar fuera, con Esc o si el puntero se queda lejos de ella y de los rooms un rato. */
const ZWAIT = 2500; let zTimer = 0;
function openZone(k) { S.zp = {k, open: true, more: !!(S.zp && S.zp.open && S.zp.more)}; drawZone(); armZone(); }
function zoneClose() { clearTimeout(zTimer); zTimer = 0; if (S.zp) S.zp.open = false; $('zpop').classList.remove('on'); }
function armZone() { clearTimeout(zTimer); zTimer = setTimeout(zoneClose, ZWAIT); }
/** El puntero está sobre la ficha o sobre un room seleccionado (cerca) o no (lejos: empieza la cuenta). */
function zoneNear(near) { if (!S.zp || !S.zp.open) return; if (near) { clearTimeout(zTimer); zTimer = 0; } else if (!zTimer) armZone(); }
function drawZone() { const z = $('zpop');
 if (!S.zp || !S.zp.open || !S.res || !S.hlRooms.length) { zoneClose(); return; }
 if (!S.hlRooms.includes(S.zp.k)) S.zp.k = S.hlRooms[S.hlRooms.length - 1];
 z.innerHTML = zoneCard(S.zp.more); z.classList.add('on'); placeZone();
 $('zone-x').onclick = clearRooms;
 $('zone-more').onclick = () => { S.zp.more = !S.zp.more; drawZone(); Snd.click(); };
 z.querySelectorAll('[data-zr]').forEach(b => b.onclick = () => roomClick(+b.dataset.zr, true));
 z.querySelectorAll('[data-p]').forEach(b => b.onclick = () => focus('pillar', b.dataset.p)); }
/** Al lado del room ancla, sin taparlo: a su derecha, o a su izquierda si no cabe; si no cabe a ningún lado, junto a su centro.
 *  Sin planta (solo 3D), arriba a la derecha del visor. Siempre dentro del panel. */
function placeZone() { const z = $('zpop'); if (!z.classList.contains('on')) return;
 const host = z.parentElement.getBoundingClientRect(), svg = document.querySelector('#vbody svg.plan'), rm = S.res.sel.rooms[S.zp.k], w = z.offsetWidth, h = z.offsetHeight;
 let x = host.width - w - 16, y = 56;
 if (svg && rm) { const m = svg.getScreenCTM(), p = svg.createSVGPoint(); let x0 = Infinity, x1 = -Infinity, y0 = Infinity, y1 = -Infinity;
  rm.outline[0].forEach(([a, b]) => { p.x = X(a); p.y = Y(b); const q = p.matrixTransform(m); x0 = Math.min(x0, q.x); x1 = Math.max(x1, q.x); y0 = Math.min(y0, q.y); y1 = Math.max(y1, q.y); });
  x0 -= host.left; x1 -= host.left; y0 -= host.top; y1 -= host.top; y = (y0 + y1) / 2 - 40;
  x = x1 + w + 12 <= host.width - 8 ? x1 + 12 : x0 - w - 12 >= 8 ? x0 - w - 12 : (x0 + x1) / 2 + 12; }
 z.style.left = Math.max(8, Math.min(host.width - w - 8, x)) + 'px'; z.style.top = Math.max(48, Math.min(host.height - h - 8, y)) + 'px'; }
/** Encabezado fijo del inspector: el mismo componente que el del tablero (eyebrow, título con su marca, subtítulo). */
function inspHead(eye, title, sub, c) { $('insp-h').innerHTML = `<div class="phd-t"><div class="eyebrow">${eye}</div><h3${c ? ` style="--c:${c}"` : ''}>${title}</h3>${sub ? `<p>${sub}</p>` : ''}</div>`; }
const dots = (...cs) => `<span class="dots" aria-hidden="true">${cs.map(c => `<i style="background:${c}"></i>`).join('')}</span>`;
function renderInspectorBase() { const box = $('insp');
 if (!S.res) { inspHead('Inspector', 'Sin modelo', 'El análisis se arma con lo que trae el modelo de Revit.');
  box.innerHTML = `<section class="sec"><div class="sec-h"><span class="eyebrow">Qué lee de Revit</span></div><div class="list div">${[['Pisos del nivel', 'retícula'], ['Muros', 'separan'], ['Muro cortina y ventanas', 'vista afuera'], ['Puertas', 'conectan'], ['Columnas y muebles', 'obstáculos'], ['Parámetros SA_', 'roles y materiales']].map(([a, b]) => `<div class="row kv"><span class="lab"><span>${a}</span></span><span class="meta">${b}</span></div>`).join('')}</div></section>
  <section class="sec"><p>Se analiza un modelo a la vez. Abrir otro reemplaza al actual.</p></section>`; return; }
 let h = '';
 if (S.focus.type === 'pillar') { const p = BY[S.focus.k], sc = score(p.k), rt = ratePillar(sc, p.target), gap = sc == null ? null : p.target - sc, rooms = roomsBy(p.k), ms = S.res.metrics[p.k];
  inspHead('Pilar', `${pIcon(p.k, 17)}<span>${p.name}</span>`, `“${p.feel}”`, p.c1);
  h += `<section class="sec"><div class="hero hk" style="--c:${p.c1}">
   <div class="hk-top"><span class="val xl">${sc == null ? '—' : sc}<small>/ 100</small></span>${pill(rt)}</div>
   <span class="b4 l"><i style="width:${sc || 0}%"></i><em style="left:${p.target}%"></em></span>
   <div class="hk-m meta"><span>meta <b>${p.target}</b></span><span>${gap == null ? '' : gap > 0 ? `faltan <b>${gap}</b> puntos` : gap < 0 ? `<b>${-gap}</b> sobre la meta` : 'justo en la meta'}</span></div>
   <p class="meta hk-d"><b>Mide</b> ${p.unit}</p>${sc == null ? `<p class="meta hk-d">Sin datos: ${p.k === 'sust' ? 'ningún tipo trae parámetros SA_. Agrégalos en Revit o carga la tabla de Excel en Familias.' : 'falta información en el modelo (ver avisos).'}</p>` : ''}</div></section>
  <section class="sec"><div class="sec-h"><span class="eyebrow">Métricas</span><span class="sec-m">contra su referencia</span></div><div class="list div">${ms.map(metricRow).join('')}</div></section>
  ${p.k === 'flujo' && multiLevel() ? levelsCard() : ''}
  ${rooms.length ? `<section class="sec"><div class="sec-h"><span class="eyebrow">Rooms</span><span class="sec-m">peor a mejor · raya = meta</span></div><div class="list">${rooms.slice(0, 8).map(r => `<button class="row s" data-r="${r.k}" style="--c:${p.c1}" title="Seleccionar ${esc(r.n)}"><span class="lab"><span>${esc(r.n)}</span></span><span class="b4"><i style="width:${r.v}%"></i><em style="left:${p.target}%"></em></span><span class="val s">${r.v}</span></button>`).join('')}</div></section>` : ''}
  <section class="sec"><div class="sec-h"><span class="eyebrow">Relacionar con</span><span class="sec-m">dónde se cumplen los dos</span></div><div class="rcs">${P.filter(q => q.k !== p.k).map(q => { const rk = key(p.k, q.k), has = S.rels.has(rk); return `<button class="rc${has ? '' : ' new'}" data-o="${q.k}" title="${R[rk].n}${has ? '' : ' · crear'}">${dots(p.c1, q.c1)}${q.s}${has ? ' ✓' : ''}</button>`; }).join('')}</div></section>`; }
 else { const r = R[S.focus.k], [a, b] = S.focus.k.split('|'), area = crossArea(), free = S.res.G.freeCount * cellArea(), pct = free ? area / free * 100 : 0, top = relRooms().slice(0, 3);
  inspHead(`Relación · ${BY[a].s} × ${BY[b].s}`, `${dots(BY[a].c1, BY[b].c1)}<span>${r.n}</span>`, r.q);
  h += `<section class="sec"><div class="hero hk" style="--c:#D42A3C">
   <div class="hk-top"><span class="val xl">${fmtA(area)}<small>m²</small></span><span class="meta" style="text-align:right"><b>${fmt(pct)} %</b> del área libre<br>sobre umbral ${S.thr.toFixed(2)}</span></div>
   <span class="b4 l"><i style="width:${Math.min(100, pct)}%"></i></span>
   <p class="meta hk-d">Celdas ${r.d}.${top.length ? ` Se concentran en ${top.map(x => esc(x.n)).join(', ')}.` : ''}</p></div></section>
  ${top.length ? `<section class="sec"><div class="sec-h"><span class="eyebrow">Dónde</span><span class="sec-m">m² sobre el umbral</span></div><div class="list">${top.map(x => `<button class="row s" data-r="${x.k}" style="--c:#D42A3C" title="Seleccionar ${esc(x.n)}"><span class="lab"><span>${esc(x.n)}</span></span><span class="b4"><i style="width:${Math.min(100, x.a / top[0].a * 100)}%"></i></span><span class="val s">${fmtA(x.a)}</span></button>`).join('')}</div></section>` : ''}
  <section class="sec"><div class="sec-h"><span class="eyebrow">Acciones sugeridas</span></div><ul class="acts">${r.a.map(x => `<li>${x}</li>`).join('')}</ul></section>
  <section class="sec"><div class="sec-h"><span class="eyebrow">Respaldo</span></div><p>${r.src}</p></section>
  <section class="sec"><div class="rcs"><button class="rc" id="i-pres">Presentar</button><button class="rc" id="i-rm">Quitar relación</button></div></section>`; }
 box.innerHTML = h; syncLayers();
 box.querySelectorAll('[data-o]').forEach(b => b.onclick = () => { const rk = key(S.focus.k, b.dataset.o); if (S.rels.has(rk)) focus('rel', rk); else createRel(S.focus.k, b.dataset.o); });
 box.querySelectorAll('[data-r]').forEach(r => r.onclick = e => roomClick(+r.dataset.r, e.shiftKey));
 box.querySelectorAll('[data-broute]').forEach(b => b.onclick = () => showBuildingRoute('far'));
 box.querySelectorAll('[data-stack]').forEach(b => b.onclick = () => setStack(true));
 box.querySelectorAll('[data-ly]').forEach(b => b.onclick = () => { const [t, v] = b.dataset.ly.split(':');
  if (t === 'path') { if (S.path === v) { S.path = null; renderViewport(); } else showPath(v); } else if (S.mark === v) { S.mark = null; renderViewport(); } else showMark(v); });
 $('i-pres') && ($('i-pres').onclick = () => present(true)); $('i-rm') && ($('i-rm').onclick = () => removeRel(S.focus.k)); }
/** Clic en un room: lo selecciona y abre su ficha junto a él. Con Shift lo suma a la zona (o lo quita si ya estaba).
 *  Con un solo room en Flujo además traza su ruta desde el acceso, aunque haya que subir de nivel. */
function roomClick(k, add) {
 if (add) S.hlRooms = S.hlRooms.includes(k) ? S.hlRooms.filter(x => x !== k) : [...S.hlRooms, k]; else S.hlRooms = [k];
 if (S.hlRooms.length) S.zp = {k: S.hlRooms.includes(k) ? k : S.hlRooms[S.hlRooms.length - 1], open: true, more: !!(S.zp && S.zp.open && S.zp.more)};
 if (!add && S.focus.type === 'pillar' && S.focus.k === 'flujo') showBuildingRoute('room', k); else { renderViewport(); Snd.click(); }
 armZone(); }
function clearRooms() { S.hlRooms = []; zoneClose(); renderViewport(); }
function showPath(k) { if (!S.res) return; const p = S.res.G.paths[k];
 if (!p) { toast(k === 'cash' ? 'No hay ruta de efectivo' : 'No hay ruta', k === 'cash' ? 'falta un room "Bóveda" o una caja (SA_Rol, o familia de mostrador/cajero)' : 'no se encontró acceso'); return; }
 S.path = k; S.broute = null; renderViewport(); Snd.tone(k === 'cash' ? BY.seg.f : BY.flujo.f, 1.2, .04);
 toast(k === 'cash' ? 'Ruta de efectivo · bóveda → caja' : 'Ruta más lejana desde el acceso', `${fmt(p.length, 1)} m`); }
/** Ruta del edificio: 'far' = la más larga desde el acceso; 'room' = del acceso al room k del nivel li (por omisión, el actual). */
function showBuildingRoute(kind, k, li) {
 const b = bld(); if (!b) return;
 if (li == null) li = b.levels.findIndex(L => L.id === S.res.level.id);
 const L = b.levels[li], r = kind === 'far' ? b.farthest : L ? b.toRoom(li, k) : null;
 if (!r) { toast('No hay ruta', b.levels.length > 1 && !b.links.length ? 'faltan escaleras o elevadores entre niveles (ver avisos)' : 'ese room no se alcanza desde el acceso'); return; }
 const label = kind === 'far' ? 'Ruta más larga del edificio' : `Ruta a ${L.res.sel.rooms[k].name || 'room'}`;
 S.path = null; S.broute = {key: b.key, r, label}; renderViewport(); Snd.tone(BY.flujo.f, 1.2, .04);
 toast(label, `${fmt(r.length, 1)} m · ${[...new Set(r.legs.map(l => b.levels[l.li].name))].join(' → ')}`); }
function setStack(v) { if (v && !multiLevel()) { toast('El modelo tiene un solo nivel'); return; }
 const go = () => { S.stack = v; S.cam3 = {k: 1, x: 0, y: 0}; if (v && S.view === 'plan') setView('axo'); else renderViewport(); Snd.click(); };
 if (v && !bldNow()) { toast('Analizando todos los niveles…', `${E.levelsOf(cur().model).length} niveles`); setTimeout(() => { bld(); go(); }, 40); } else go(); }
function showMark(k) { if (!S.res) return; S.mark = k; if (k === 'blind') focus('pillar', 'seg'); else focus('pillar', 'flujo');
 const G = S.res.G; let n = 0; for (let c = 0; c < G.n; c++) if (G.free[c] && (k === 'blind' ? G.watch.length && G.seen[c] === 0 : !isFinite(G.dEnt[c]))) n++;
 toast(k === 'blind' ? 'Puntos ciegos' : 'Áreas inaccesibles', `${fmt(n * cellArea(), 1)} m²`); }
/** Umbral de una relación: el percentil 80 de sus celdas la primera vez; luego fijo, para comparar versiones con la misma vara. */
function thrFor(rk) {
 if (S.thrBy[rk] == null && S.res) { const [a, b] = rk.split('|'), G = S.res.G, v = [];
  for (let c = 0; c < G.n; c++) if (G.free[c]) { const x = E.crossAt(S.res.fields, a, b, R[rk].op, c); if (!isNaN(x)) v.push(x); }
  v.sort((p, q) => p - q); S.thrBy[rk] = v.length ? Math.max(.1, Math.min(.9, Math.floor(v[Math.floor(.8 * (v.length - 1))] * 20) / 20)) : .5; }
 return S.thrBy[rk] == null ? .5 : S.thrBy[rk]; }
function setThr(d) { const rk = S.focus.k; S.thr = Math.max(.1, Math.min(.9, +(S.thr + d).toFixed(2))); S.thrBy[rk] = S.thr; S.thrUser[rk] = true; renderViewport(); renderInspector(); Snd.click(); }
function focus(type, k) { S.focus = {type, k}; if (type === 'rel') S.thr = thrFor(k); syncRels(); renderAll(); }
function renderAll() { renderMixer(); renderBoard(); renderViewport(); renderInspector(); renderDigest(); }

/* ===================== FAMILIAS ===================== */
const UNIT = {Floors: 'kg/m²', Walls: 'kg/m²'};
const table = () => S.res ? S.res.table : [];
function famRows() { const q = E.norm(S.famQ); return table().filter(f => (S.famCat === 'Todas' || f.cat === S.famCat) && E.norm(f.fam + ' ' + f.tipo + ' ' + f.mark + ' ' + f.cat).includes(q)).sort((a, b) => { const x = a[S.famSort], y = b[S.famSort]; if (x == null && y == null) return 0; if (x == null) return 1; if (y == null) return -1; return (typeof x === 'number' ? x - y : String(x).localeCompare(String(y))) * S.famDir; }); }
function renderFam() { if (!S.res) return; const cats = ['Todas', ...new Set(table().map(f => f.cat))];
 $('f-cats').innerHTML = cats.map(c => `<button class="btn" style="height:26px;padding:0 9px" aria-pressed="${S.famCat === c}" data-c="${esc(c)}">${esc(c)}</button>`).join('');
 $('f-cats').querySelectorAll('button').forEach(b => b.onclick = () => { S.famCat = b.dataset.c; renderFam(); });
 $('f-body').innerHTML = famRows().map(f => `<tr class="${S.famCur === f.id ? 'cur' : ''}" data-id="${esc(f.id)}"><td><input type="checkbox" ${S.selFam.has(f.id) ? 'checked' : ''} aria-label="Seleccionar ${esc(f.fam)}"></td><td><b style="font-weight:600">${esc(f.fam)}</b><small class="mono muted" style="display:block;font-size:9.5px">${esc(f.mark || '—')} · ${esc(f.tipo)}</small></td><td>${esc(f.cat)}</td><td class="num">${f.count}<small class="muted" style="display:block;font-size:9px">${f.here} aquí</small></td><td class="num">${fmt(f.gwp)}<small class="muted" style="display:block;font-size:9px">${f.gwp == null ? '' : UNIT[f.category] || 'kg/u'}</small></td><td class="num">${f.cost == null ? '—' : '$' + fmt(f.cost)}</td><td class="num">${f.rec == null ? '—' : fmt(f.rec) + '%'}</td></tr>`).join('') || '<tr><td colspan="7" class="muted">Sin familias que coincidan</td></tr>';
 $('f-body').querySelectorAll('tr[data-id]').forEach(tr => { tr.onclick = e => { const id = tr.dataset.id; if (e.target.type === 'checkbox') { e.target.checked ? S.selFam.add(id) : S.selFam.delete(id); updateFamCount(); return; } S.famCur = id; renderFam(); }; });
 const f = table().find(x => x.id === S.famCur) || table()[0];
 if (!f) { $('f-det').innerHTML = '<div class="muted">El modelo no trae tipos.</div>'; updateFamCount(); return; }
 const sa = Object.keys(f.params).filter(k => k.indexOf('SA_') === 0), tot = f.cost == null ? null : f.cost * f.count;
 $('f-det').innerHTML = `<div><div class="eyebrow">${esc(f.cat)} · ${esc(f.mark || 'sin Type Mark')}</div><h3 style="font-size:18px">${esc(f.fam)}</h3><div class="muted" style="font-size:12px">${esc(f.tipo)}</div></div>
  <div class="pgrp"><h4>Sustentabilidad</h4><table><tr><td>GWP</td><td class="v">${fmt(f.gwp)} ${f.gwp == null ? '' : UNIT[f.category] || 'kg/u'}</td></tr><tr><td>EPD</td><td class="v">${f.epd == null ? '—' : f.epd ? 'sí' : 'no'}</td></tr><tr><td>Contenido reciclado</td><td class="v">${f.rec == null ? '—' : fmt(f.rec) + ' %'}</td></tr><tr><td>Puntaje del tipo</td><td class="v">${f.score == null ? '—' : fmt(f.score * 100)}</td></tr></table></div>
  <div class="pgrp"><h4>Confort y salud</h4><table><tr><td>VOC</td><td class="v">${f.voc == null ? '—' : fmt(f.voc) + ' g/L'}</td></tr><tr><td>NRC acústico</td><td class="v">${f.nrc == null ? '—' : fmt(f.nrc, 2)}</td></tr></table></div>
  <div class="pgrp"><h4>Costo</h4><table><tr><td>Unitario</td><td class="v">${f.cost == null ? '—' : '$' + fmt(f.cost) + ' MXN'}</td></tr><tr><td>Instancias</td><td class="v">${f.count} · ${f.here} en este nivel</td></tr><tr><td>Total</td><td class="v">${tot == null ? '—' : '$' + fmt(tot) + ' MXN'}</td></tr></table></div>
  ${f.materials.length ? `<div class="pgrp"><h4>Capas</h4><table>${f.materials.map(m => `<tr><td>${esc(m.name)}</td><td class="v">${m.thickness == null ? '' : fmt(m.thickness * 1000) + ' mm'}</td></tr>`).join('')}</table></div>` : ''}
  <div class="pgrp"><h4>Parámetros SA_</h4>${sa.length ? `<table>${sa.map(k => `<tr><td>${esc(k)}</td><td class="v">${esc(f.params[k])}</td></tr>`).join('')}</table>` : '<div class="muted" style="font-size:12px">Ninguno. Agrégalos en Revit o carga la tabla de Excel por Type Mark.</div>'}</div>
  ${f.description || f.manufacturer ? `<div class="pgrp"><h4>Ficha</h4><table>${f.manufacturer ? `<tr><td>Fabricante</td><td class="v">${esc(f.manufacturer)} ${esc(f.model)}</td></tr>` : ''}${f.description ? `<tr><td>Descripción</td><td class="v" style="white-space:normal">${esc(f.description)}</td></tr>` : ''}</table></div>` : ''}
  <button class="btn" id="f-one" style="justify-self:start">Ver solo esta en viewport</button>`;
 $('f-one').onclick = () => { S.selFam = new Set([f.id]); S.iso = false; closeFam(); renderViewport(); toast(`${f.fam} seleccionada`, `${f.here} instancia${f.here === 1 ? '' : 's'} en este nivel`); };
 updateFamCount(); }
function updateFamCount() { $('f-count').textContent = `${S.selFam.size} seleccionada${S.selFam.size === 1 ? '' : 's'}`; $('f-all').checked = S.res && S.selFam.size === table().length && S.selFam.size > 0; }
function openFam(id) { if (!S.res) { toast('Primero carga un modelo'); return; } if (id) S.famCur = id; $('modal').classList.add('on'); renderFam(); setTimeout(() => $('f-q').focus(), 20); Snd.click(); }
function closeFam() { $('modal').classList.remove('on'); }
function downloadCSV() { const rows = famRows(), cols = ['Type Mark', 'Familia', 'Tipo', 'Categoría', 'Cantidad', 'En nivel', 'GWP', 'Reciclado', 'VOC', 'NRC', 'EPD', 'Costo'];
 const q = v => v == null ? '' : /[",\n]/.test(String(v)) ? `"${String(v).replace(/"/g, '""')}"` : String(v);
 const csv = '﻿' + [cols.join(',')].concat(rows.map(f => [f.mark, f.fam, f.tipo, f.cat, f.count, f.here, f.gwp, f.rec, f.voc, f.nrc, f.epd, f.cost].map(q).join(','))).join('\n');
 const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([csv], {type: 'text/csv'})); a.download = `familias · ${(cur().model.source.file || 'modelo').replace(/\.rvt$/i, '')}.csv`; a.click(); toast('CSV descargado', `${rows.length} familias`); }
function parseCSV(text) { const sep = (text.split('\n')[0].match(/;/g) || []).length > (text.split('\n')[0].match(/,/g) || []).length ? ';' : ',';
 const rows = []; let row = [], v = '', q = false;
 for (let i = 0; i < text.length; i++) { const ch = text[i];
  if (q) { if (ch === '"' && text[i + 1] === '"') { v += '"'; i++; } else if (ch === '"') q = false; else v += ch; }
  else if (ch === '"') q = true; else if (ch === sep) { row.push(v); v = ''; } else if (ch === '\n' || ch === '\r') { if (ch === '\r' && text[i + 1] === '\n') i++; row.push(v); rows.push(row); row = []; v = ''; } else v += ch; }
 if (v || row.length) { row.push(v); rows.push(row); }
 const head = (rows.shift() || []).map(h => h.replace(/^﻿/, '').trim());
 return rows.filter(r => r.some(x => x.trim())).map(r => Object.fromEntries(head.map((h, i) => [h, (r[i] || '').trim()]))); }
function applyRows(rows, name) { const m = cur(); if (!m) { toast('Primero carga un modelo'); return; }
 const j = E.applyTable(m.model, rows); S.cache = {};
 toast(`Tabla unida por Type Mark · ${name}`, `${j.hit} renglones unidos · ${j.miss} sin coincidencia`); closeFam(); runAnalysis(true); }
function loadTable(file) {
 if (/\.csv$/i.test(file.name)) { const r = new FileReader(); r.onload = () => applyRows(parseCSV(r.result), file.name); r.readAsText(file); return; }
 const go = () => { const r = new FileReader(); r.onload = () => { const wb = window.XLSX.read(r.result, {type: 'array'}); applyRows(window.XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]], {defval: ''}), file.name); }; r.readAsArrayBuffer(file); };
 if (window.XLSX) return go();
 const s = document.createElement('script'); s.src = 'https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js'; s.onload = go; s.onerror = () => toast('No pude cargar el lector de Excel', 'guarda la tabla como .csv y vuelve a intentar'); document.head.appendChild(s); }

/* ===================== presentar ===================== */
/* Referencias para calificar cada métrica. kind: 'norma' = norma o certificación (cifra publicada), 'lit' = principio de la
   literatura convertido en cifra por el equipo, 'proy' = criterio del proyecto (se acuerda con el cliente y se calibra).
   good / ok: a partir de dónde cumple y hasta dónde todavía "puede mejorar"; el sentido lo da la métrica (más o menos es mejor). */
const BENCH = {
 'Distancia media desde el acceso': {good: 15, ok: 25, kind: 'proy', src: 'Sucursal compacta: lo usual queda a pocos pasos del acceso'},
 'Ruta más lejana': {good: 30, ok: 61, kind: 'norma', src: 'IBC 2021 · tabla 1017.2: recorrido máximo de 61 m (ocupación B, sin rociadores); meta de diseño: la mitad'},
 'Área libre inaccesible': {good: 0, ok: 0, kind: 'proy', src: 'Accesibilidad universal: todo el piso libre se alcanza desde el acceso'},
 'Área con vista al exterior': {good: 75, ok: 50, kind: 'norma', src: 'LEED v4.1 · EQ Vistas de calidad: vista al exterior en el 75 % del área ocupada'},
 'Área vigilada': {good: 90, ok: 75, kind: 'lit', src: 'CPTED · vigilancia natural: el personal ve casi todo el piso público'},
 'Puntos ciegos': {good: 0, ok: 10, kind: 'lit', src: 'CPTED · sin rincones fuera de la vista del personal'},
 'Área con luz natural': {good: 55, ok: 40, kind: 'norma', src: 'LEED v4.1 · EQ Luz natural: 55 % del área ocupada con sDA300/50 % = 2 pts (40 % = 1 pt). Aquí es un proxy, no simulación'},
 'Tipos con datos SA_': {good: 80, ok: 50, kind: 'proy', src: 'Completitud de datos: sin parámetros SA_ el pilar no se puede medir'},
 'Tipos con EPD': {good: 50, ok: 20, kind: 'proy', src: 'Materiales con declaración ambiental verificada (EPD)'}
};
const KIND = {norma: 'Norma / certificación', lit: 'Literatura', proy: 'Criterio del proyecto'};
const BAND = 15; // puntos bajo la meta que todavía cuentan como "puede mejorar"
const RATE = {ok: 'Cumple', mid: 'Puede mejorar', low: 'Requiere atención'};
// el estado nunca va solo en color: ícono con forma propia + texto en tinta
const SICON = {ok: '<path d="M4 7.3l2 2 4-4.3"/>', mid: '<path d="M7 3.8v3.9M7 10.1v.1"/>', low: '<path d="M4.9 4.9l4.2 4.2M9.1 4.9l-4.2 4.2"/>'};
const sIcon = r => `<svg class="sico ${r}" viewBox="0 0 14 14" aria-hidden="true"><circle cx="7" cy="7" r="6.4"/>${SICON[r]}</svg>`;
const pill = r => r ? `<span class="pst">${sIcon(r)}${RATE[r]}</span>` : '<span class="pst none">Sin referencia</span>';
const pIcon = (k, s = 18) => `<svg class="pico" width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICON[k]}</svg>`;
const ratePillar = (v, target) => v == null ? null : v >= target ? 'ok' : v >= target - BAND ? 'mid' : 'low';
function rateMetric(row) { const b = BENCH[row[0]], v = row[1]; if (!b || v == null) return null;
 return row[4] ? (v >= b.good ? 'ok' : v >= b.ok ? 'mid' : 'low') : (v <= b.good ? 'ok' : v <= b.ok ? 'mid' : 'low'); }
const unitOf = row => row[2] === '%' ? ' %' : row[2] ? ' ' + row[2] : '';
const benchTxt = row => { const b = BENCH[row[0]]; if (!b) return ''; const s = row[4] ? '≥' : '≤';
 return `meta ${s} ${fmt(b.good)}${unitOf(row)}` + (b.good === b.ok ? '' : ` · límite ${fmt(b.ok)}${unitOf(row)}`); };
/** Métricas que se pueden ver en el plano: el ojo prende su ruta o su marca (lo mismo que Ruta y Marcar en Capas). */
const MLAYER = {'Ruta más lejana': 'path:farthest', 'Ruta de efectivo (bóveda → caja)': 'path:cash', 'Área libre inaccesible': 'mark:unreach', 'Puntos ciegos': 'mark:blind'};
/** Una métrica en el inspector, con la misma fila del tablero: valor, estado contra su referencia (ícono + texto) y de dónde sale. */
function metricRow(row) { const rt = rateMetric(row), ly = MLAYER[row[0]];
 return `<div class="row m"><span class="lab"><span>${row[0]}</span></span><span class="end"><span class="val">${fmt(row[1], row[3])}<small>${unitOf(row).trim()}</small></span>${ly ? `<button class="ib sm" data-ly="${ly}" aria-pressed="false" aria-label="Ver ${row[0].toLowerCase()} en el plano">${EYE}</button>` : '<span class="ib-ph"></span>'}</span>
  <div class="full mt">${rt ? `<span class="pst">${sIcon(rt)}${RATE_S[rt]}</span><span class="meta">${benchTxt(row)}</span>` : ''}${row[5] ? `<span class="meta src">${esc(row[5])}</span>` : ''}</div></div>`; }
/** Índice ponderado con los pesos del cliente, y la meta ponderada con los mismos pesos. */
function idxNow() { let n = 0, t = 0, d = 0; P.forEach(p => { if (!live(p.k)) return; n += score(p.k) * S.w[p.k]; t += p.target * S.w[p.k]; d += S.w[p.k]; }); return d ? {v: n / d, target: t / d} : null; }
/** Todos los indicadores con referencia y valor, calificados. */
const indicators = () => P.filter(p => score(p.k) != null).flatMap(p => S.res.metrics[p.k].filter(m => BENCH[m[0]] && m[1] != null).map(m => ({p, m, r: rateMetric(m)})));

/* ---------- gráficos (SVG y HTML propios, sin librerías) ---------- */
/** Medio anillo 0–100 con el valor, la meta y las tres zonas del semáforo por fuera. */
function gauge(v, target) { const cx = 120, cy = 112, r = 92, A = t => Math.PI * (1 - Math.max(0, Math.min(100, t)) / 100), Pt = (t, rr) => [cx + rr * Math.cos(A(t)), cy - rr * Math.sin(A(t))];
 const arc = (t0, t1, rr) => { const [x0, y0] = Pt(t0, rr), [x1, y1] = Pt(t1, rr); return `M${x0.toFixed(1)} ${y0.toFixed(1)} A${rr} ${rr} 0 0 1 ${x1.toFixed(1)} ${y1.toFixed(1)}`; };
 const lo = Math.max(0, target - BAND), [tx0, ty0] = Pt(target, r - 15), [tx1, ty1] = Pt(target, r + 20), [lx, ly] = Pt(target, r + 32);
 return `<svg class="gauge" viewBox="-24 -22 288 158" role="img" aria-label="Índice ${fmt(v)} de 100, meta ${fmt(target)}">
  <path d="${arc(0, lo, r + 13)}" class="gz low"/><path d="${arc(lo, target, r + 13)}" class="gz mid"/><path d="${arc(target, 100, r + 13)}" class="gz ok"/>
  <path d="${arc(0, 100, r)}" class="gtrack"/><path d="${arc(0, v, r)}" class="gval"/>
  <line x1="${tx0.toFixed(1)}" y1="${ty0.toFixed(1)}" x2="${tx1.toFixed(1)}" y2="${ty1.toFixed(1)}" class="gtick"/>
  <text x="${lx.toFixed(1)}" y="${(ly - 2).toFixed(1)}" class="glab" text-anchor="${target > 55 ? 'start' : target < 45 ? 'end' : 'middle'}">meta ${fmt(target)}</text>
  <text x="${cx}" y="${cy - 6}" class="gnum" text-anchor="middle">${fmt(v)}</text><text x="${cx}" y="${cy + 14}" class="gsub" text-anchor="middle">de 100</text></svg>`; }
/** Anillo del puntaje de un pilar con la marca de la meta. */
function ring(v, target, col) { const r = 46, C = 2 * Math.PI * r, a = (target / 100) * 2 * Math.PI - Math.PI / 2;
 return `<svg class="ring" viewBox="0 0 112 112" role="img" aria-label="${v} de 100, meta ${target}"><circle cx="56" cy="56" r="${r}" class="rtrack"/>
  <circle cx="56" cy="56" r="${r}" class="rval" style="stroke:${col};stroke-dasharray:${(v / 100 * C).toFixed(1)} ${C.toFixed(1)}" transform="rotate(-90 56 56)"/>
  <line x1="${(56 + (r - 9) * Math.cos(a)).toFixed(1)}" y1="${(56 + (r - 9) * Math.sin(a)).toFixed(1)}" x2="${(56 + (r + 9) * Math.cos(a)).toFixed(1)}" y2="${(56 + (r + 9) * Math.sin(a)).toFixed(1)}" class="gtick"/>
  <text x="56" y="62" class="rnum" text-anchor="middle">${v}</text></svg>`; }
/** Radar de los pilares: puntaje (relleno) y meta (rayas). Cada serie se distingue por el trazo, no por el color. */
function radar(ps) { const cx = 190, cy = 150, R = 104, n = ps.length, ang = i => (-90 + i * 360 / n) * Math.PI / 180, xy = (i, v) => [cx + R * v / 100 * Math.cos(ang(i)), cy + R * v / 100 * Math.sin(ang(i))];
 const poly = vals => vals.map((v, i) => xy(i, v == null ? 0 : v).map(x => x.toFixed(1)).join(',')).join(' ');
 let g = [25, 50, 75, 100].map(t => `<polygon points="${poly(ps.map(() => t))}" class="rgrid"/>`).join('') + ps.map((p, i) => { const [x, y] = xy(i, 100); return `<line x1="${cx}" y1="${cy}" x2="${x.toFixed(1)}" y2="${y.toFixed(1)}" class="rgrid"/>`; }).join('');
 g += `<text x="${cx + 3}" y="${(cy - R + 3).toFixed(1)}" class="rtick">100</text>`;
 g += `<polygon points="${poly(ps.map(p => p.target))}" class="rmeta"/>`;
 g += `<polygon points="${poly(ps.map(p => score(p.k)))}" class="rcur"/>`;
 g += ps.map((p, i) => { const [x, y] = xy(i, score(p.k)), [lx, ly] = xy(i, 128), anc = Math.abs(lx - cx) < 8 ? 'middle' : lx > cx ? 'start' : 'end';
  return `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="5" class="rpt" style="fill:${p.c1}"><title>${p.name}: ${score(p.k)} (meta ${p.target})</title></circle>
   <text x="${lx.toFixed(1)}" y="${(ly - 4).toFixed(1)}" text-anchor="${anc}" class="rlab">${p.s}</text><text x="${lx.toFixed(1)}" y="${(ly + 14).toFixed(1)}" text-anchor="${anc}" class="rval2">${score(p.k)}<tspan class="rtick"> / ${p.target}</tspan></text>`; }).join('');
 return `<svg class="radar" viewBox="0 0 380 300" role="img" aria-label="Radar de pilares contra la meta">${g}</svg>
  <div class="rleg"><span><i class="lcur"></i>Puntaje</span><span><i class="lmeta"></i>Meta</span></div>`; }
/** Bullet chart: zonas del semáforo de fondo, barra del valor y marca de la meta. */
function bullet(m) { const b = BENCH[m[0]], v = m[1], more = m[4];
 const max = m[2] === '%' ? 100 : Math.max(b.ok * 1.3, b.good * 2, v * 1.12, 1), pc = x => Math.max(0, Math.min(100, x / max * 100));
 const zones = more ? [['low', 0, b.ok], ['mid', b.ok, b.good], ['ok', b.good, max]] : [['ok', 0, b.good], ['mid', b.good, b.ok], ['low', b.ok, max]];
 return `<div class="bul" role="img" aria-label="${esc(m[0])}: ${fmt(v, m[3])}${unitOf(m)}, ${benchTxt(m)}">${zones.filter(z => z[2] > z[1]).map(z => `<i class="bz ${z[0]}" style="left:${pc(z[1])}%;width:${pc(z[2]) - pc(z[1])}%"></i>`).join('')}
  <b class="bv" style="width:${Math.max(.6, pc(v))}%"></b><em class="bt" style="left:calc(${pc(b.good)}% - 1px)"></em></div>
  <div class="bax"><span>0</span><span>${fmt(max)}${unitOf(m)}</span></div>`; }
/** Dona de una proporción. */
function donut(pct, col) { const r = 40, C = 2 * Math.PI * r;
 return `<svg class="donut" viewBox="0 0 100 100" role="img" aria-label="${fmt(pct)} %"><circle cx="50" cy="50" r="${r}" class="rtrack"/><circle cx="50" cy="50" r="${r}" class="rval" style="stroke:${col};stroke-dasharray:${(pct / 100 * C).toFixed(1)} ${C.toFixed(1)}" transform="rotate(-90 50 50)"/><text x="50" y="55" text-anchor="middle" class="dnum">${fmt(pct)}%</text></svg>`; }
/** Leyenda del mapa de una slide: la escala de color y los símbolos que aparecen. */
function planKey(it) { const col = it.type === 'rel' ? '#D42A3C' : BY[it.k].c1, seg = it.k.indexOf('seg') >= 0;
 const what = it.type === 'rel' ? `"${R[it.k].n}": se cuentan las celdas sobre el umbral ${thrFor(it.k).toFixed(2)} (con borde)` : `${BY[it.k].s} por celda`;
 return `<div class="pkey"><span class="pk-scale"><span class="scale">${OPAC.map(o => `<i style="background:${col};opacity:${o}"></i>`).join('')}</span><span class="mono">bajo → alto</span></span><span>${esc(what)}</span>
  <span class="sym"><svg width="14" height="10" viewBox="0 0 14 10" aria-hidden="true"><path d="M2 9 L7 1 L12 9" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>acceso</span>
  ${seg ? `<span class="sym"><svg width="12" height="12" viewBox="0 0 12 12" aria-hidden="true"><circle cx="6" cy="6" r="4.6" fill="var(--surface-2)" stroke="${BY.seg.c1}" stroke-width="1.2"/><circle cx="6" cy="6" r="1.7" fill="${BY.seg.c1}"/></svg>puesto de personal</span>` : ''}
  <span class="sym"><i style="display:inline-block;width:12px;height:8px;background:var(--wall);opacity:.55;border-radius:1px"></i>mueble o columna</span></div>`; }

/* ---------- el deck ---------- */
const SECT = {cover: 'Portada', summary: 'Resumen', read: 'Cómo leer', board: 'Indicadores', pillar: 'Pilar', rel: 'Relación', rooms: 'Por room', process: 'Método', method: 'Metas'};
/** Las slides: portada, resumen, cómo leer, indicadores, un pilar o relación por slide, por room, método y metas. */
function deck() { return [{type: 'cover'}, {type: 'summary'}, {type: 'read'}, {type: 'board'}]
 .concat(P.filter(p => score(p.k) != null).map(p => ({type: 'pillar', k: p.k})), [...S.rels].map(k => ({type: 'rel', k})), S.res.rooms.length ? [{type: 'rooms'}] : [], [{type: 'process'}, {type: 'method'}]); }
let pIdx = 0;
/** Abre la presentación en la portada; desde el inspector (fromFocus) abre en la slide del pilar o la relación enfocada. */
function present(fromFocus) { if (!S.res) { toast('Primero carga un modelo'); return; }
 pIdx = 0; if (fromFocus === true) { const i = deck().findIndex(x => x.type === S.focus.type && x.k === S.focus.k); if (i >= 0) pIdx = i; }
 drawSlide(); }
function drawSlideBase() { const items = deck(); pIdx = (pIdx + items.length) % items.length; const it = items[pIdx], Ep = $('present');
 const proj = esc((cur().model.source.file || 'Proyecto').replace(/\.rvt$/i, ''));
 const sect = it.type === 'pillar' ? `Pilar · ${BY[it.k].s}` : it.type === 'rel' ? `Relación · ${R[it.k].n}` : SECT[it.type];
 const head = `<header class="sl-h"><span>${proj} · ${esc(S.res.level.name)}</span><span>${sect}<b>${String(pIdx + 1).padStart(2, '0')}</b><span class="muted">/ ${String(items.length).padStart(2, '0')}</span></span></header>`;
 const nav = `<footer class="pnav"><button class="btn" id="pp" aria-label="Slide anterior">←</button><button class="btn" id="pn" aria-label="Slide siguiente">→</button><span class="pdots">${items.map((x, i) => `<button class="${i === pIdx ? 'on' : ''}" data-i="${i}" aria-label="Ir a la slide ${i + 1}" title="${i + 1} · ${x.type === 'pillar' ? BY[x.k].s : x.type === 'rel' ? R[x.k].n : SECT[x.type]}"></button>`).join('')}</span><span>← → para avanzar · Esc para volver</span></footer>`;
 let body, plan = null;
 if (it.type === 'pillar' || it.type === 'rel') { const prevFocus = S.focus, prevThr = S.thr; S.focus = it; if (it.type === 'rel') S.thr = thrFor(it.k);
  body = `<main class="sl-b split">${it.type === 'rel' ? relLeft(it.k) : pillarLeft(it.k)}<div class="pright"><div class="vp"><svg id="pplan"></svg></div>${planKey(it)}</div></main>`;
  plan = () => { drawPlan($('pplan'), {full: true}); S.focus = prevFocus; S.thr = prevThr; };
  Ep.className = 'present on'; Ep.innerHTML = `<div class="sl">${head}${body}${nav}</div>`; plan(); }
 else { Ep.className = 'present on'; Ep.innerHTML = `<div class="sl sl-${it.type}">${head}<main class="sl-b">${slideBody(it.type, proj)}</main>${nav}</div>`; }
 $('pp').onclick = () => { pIdx--; drawSlide(); }; $('pn').onclick = () => { pIdx++; drawSlide(); };
 Ep.querySelectorAll('.pdots [data-i]').forEach(d => d.onclick = () => { pIdx = +d.dataset.i; drawSlide(); });
 Ep.scrollTop = 0; Snd.tone(523.25, 1.8, .04); }
function pillarLeft(k) { const p = BY[k], sc = score(k), rt = ratePillar(sc, p.target);
 const rows = S.res.metrics[k].map(m => { const b = BENCH[m[0]], r = rateMetric(m);
  return `<div class="dkm"><div class="dkm-t"><span>${m[0]}</span><b>${fmt(m[1], m[3])}<small>${m[1] == null ? '' : unitOf(m)}</small></b></div>
   ${b && m[1] != null ? `${bullet(m)}<div class="dkm-f">${pill(r)}<span>${benchTxt(m)}</span><span class="kind ${b.kind}" title="${esc(b.src)}">${KIND[b.kind]}</span></div>` : `<div class="dkm-f"><span class="muted">${esc(m[5])} · sin referencia</span></div>`}</div>`; }).join('');
 return `<div class="pleft"><div class="eyebrow" style="color:${p.c1}">${pIcon(k, 16)} ${p.name}</div><h1>${p.feel}</h1>
  <div class="pscore">${ring(sc, p.target, p.c1)}<div><div class="pmeta">${pill(rt)}</div><div class="pmeta" style="margin-top:6px"><span>meta ${p.target}</span></div>
   <p class="pexp"><b>Mide</b> ${p.unit}. Cada celda vale de 0 a 1; el puntaje es el promedio × 100.</p></div></div>
  <div class="dkms">${rows}</div></div>`; }
function relLeft(k) { const r = R[k], [a, b] = k.split('|'), all = relRooms(), top = all.slice(0, 4), area = crossArea(), free = S.res.G.freeCount * cellArea(), pct = free ? area / free * 100 : 0;
 return `<div class="pleft"><div class="eyebrow" style="color:#D42A3C">${pIcon(a, 15)} ${BY[a].s} × ${pIcon(b, 15)} ${BY[b].s} · ${r.n}</div><h1>${r.q}</h1>
  <div class="pscore">${donut(pct, '#D42A3C')}<div><div class="kbig">${fmtA(area)}<small> m²</small></div><p class="pexp">del área libre son celdas <b>${r.d}</b> (${r.op === 'conflict' ? `${BY[a].s} alto con ${BY[b].s} bajo` : `${BY[a].s} y ${BY[b].s} altos a la vez`}).</p></div></div>
  ${top.length ? `<div class="eyebrow" style="margin-top:16px">Dónde se concentra</div><div class="hbars">${top.map(x => `<div class="hb"><span>${esc(x.n)}</span><span class="hbt"><i style="width:${(x.a / top[0].a * 100).toFixed(1)}%;background:#D42A3C"></i></span><b>${fmtA(x.a)} m²</b></div>`).join('')}</div>` : ''}
  <div class="eyebrow" style="margin-top:16px">Acciones sugeridas</div><div class="chips">${r.a.map(x => `<span>→ ${esc(x)}</span>`).join('')}</div>
  <blockquote>${esc(r.src)}</blockquote></div>`; }
/** Las slides sin planta. */
function slideBody(type, proj) {
 const ps = P.filter(p => score(p.k) != null), m = S.res.model;
 if (type === 'cover') { const ix = idxNow(), rt = ix && ratePillar(ix.v, ix.target), d = m.source.exported_at ? new Date(m.source.exported_at) : null;
  return `<div class="cover"><div><div class="eyebrow">Diagnóstico espacial</div><h1 class="ctitle">${proj}</h1>
    <p class="clead">Cómo se vive el espacio, medido en cinco pilares desde el modelo de Revit: flujo, visibilidad, seguridad, confort y sustentabilidad.</p>
    <dl class="cfacts"><div><dt>Nivel</dt><dd>${esc(S.res.level.name)}</dd></div><div><dt>Área libre</dt><dd>${fmt(S.res.G.freeCount * cellArea())} m²</dd></div><div><dt>Rooms</dt><dd>${S.res.rooms.length}</dd></div><div><dt>Retícula</dt><dd>${fmt(S.res.G.cell, 1)} m</dd></div>${d && !isNaN(d) ? `<div><dt>Exportado</dt><dd>${d.toLocaleDateString('es-MX', {day: 'numeric', month: 'short', year: 'numeric'})}</dd></div>` : ''}</dl></div>
   <div class="cgauge"><div class="eyebrow">Índice ponderado</div>${ix ? gauge(ix.v, ix.target) : ''}<div class="pmeta" style="justify-content:center">${pill(rt)}</div></div></div>
   <div class="cstrip">${ps.map(p => { const sc = score(p.k); return `<div class="cpil"><div class="cp-h" style="color:${p.c1}">${pIcon(p.k, 15)}<span>${p.s}</span></div><div class="cp-n">${sc}</div><div class="cp-bar"><i style="width:${sc}%;background:${p.c1}"></i><em style="left:${p.target}%"></em></div><div class="cp-m">${sIcon(ratePillar(sc, p.target))}meta ${p.target}</div></div>`; }).join('')}</div>`; }
 if (type === 'summary') { const gap = p => score(p.k) - p.target, by = [...ps].sort((a, b) => gap(a) - gap(b)), worst = by[0], best = by[by.length - 1], ind = indicators(), lows = ind.filter(x => x.r === 'low'), oks = ind.filter(x => x.r === 'ok').length;
  const ins = [[gap(worst) < 0 ? `${gap(worst)}` : `+${gap(worst)}`, `${worst.name}`, gap(worst) < 0 ? `Es la mayor brecha: ${score(worst.k)} contra una meta de ${worst.target}. Aquí está la primera oportunidad.` : 'Incluso el pilar más bajo llega a su meta.', worst.c1],
   [gap(best) >= 0 ? `+${gap(best)}` : `${gap(best)}`, best.name, gap(best) >= 0 ? `Lo más sólido del diseño: ${score(best.k)} sobre una meta de ${best.target}.` : `El mejor pilar todavía queda ${-gap(best)} puntos bajo su meta.`, best.c1],
   [`${oks}/${ind.length}`, 'Indicadores que cumplen', lows.length ? `Requieren atención: ${lows.map(x => x.m[0].toLowerCase()).join(', ')}.` : 'Ninguno requiere atención.', 'var(--ink)']];
  return `<h1>Resumen ejecutivo</h1><div class="sum"><div class="sum-r">${radar(ps)}</div><ol class="ins">${ins.map(x => `<li><b style="--c:${x[3]}">${x[0]}</b><div><div class="ins-t">${x[1]}</div><p>${x[2]}</p></div></li>`).join('')}</ol></div>`; }
 if (type === 'read') return `<h1>Cómo leer este análisis</h1>
  <div class="g5">${P.map(p => `<div class="pcard"><div class="pc-h" style="color:${p.c1}">${pIcon(p.k, 20)}<span>${p.name}</span></div><p class="pq">“${p.feel}”</p><p class="pc-m">${p.unit}</p><div class="pc-f"><span>meta</span><b>${p.target}</b></div></div>`).join('')}</div>
  <div class="g3">
   <div class="pcard"><div class="eyebrow">El mapa</div><p>El piso se divide en celdas de ${fmt(S.res.G.cell, 1)} m; cada una vale de 0 a 1 en cada pilar. Más intenso el color, más alto el valor. Muebles y columnas no son área libre.</p>
    <div class="grad"><span class="scale">${OPAC.map(o => `<i style="background:var(--ink);opacity:${o}"></i>`).join('')}</span><div class="scale-l"><span>0</span><span>0.5</span><span>1</span></div></div></div>
   <div class="pcard"><div class="eyebrow">Relaciones e índice</div><p><b>Relación:</b> cruza dos pilares celda por celda y responde una pregunta de diseño; se reporta en m² sobre un umbral.</p><p><b>Índice ponderado:</b> promedio de los pilares con los pesos acordados.</p>
    <div class="wbars">${P.filter(p => live(p.k)).map(p => `<div><span>${p.s}</span><i style="width:${S.w[p.k] * 100}%;background:${p.c1}"></i><b>${fmt(S.w[p.k] * 100)} %</b></div>`).join('')}</div></div>
   <div class="pcard"><div class="eyebrow">Semáforo</div><ul class="sem"><li>${pill('ok')}<span>llega a su meta</span></li><li>${pill('mid')}<span>hasta ${BAND} puntos abajo</span></li><li>${pill('low')}<span>más de ${BAND} puntos abajo</span></li></ul><p class="muted">Cada métrica se califica contra su propia referencia: norma, literatura o criterio del proyecto.</p></div></div>`;
 if (type === 'board') { const all = indicators(), n = {ok: 0, mid: 0, low: 0}; all.forEach(x => n[x.r]++);
  return `<div class="bh"><h1>Indicadores contra su referencia</h1><div class="pmeta">${['ok', 'mid', 'low'].map(r => `${pill(r)}<b class="cnt">${n[r]}</b>`).join('')}</div></div>
   <div class="board">${all.map(x => { const b = BENCH[x.m[0]]; return `<div class="bcard"><div class="bc-h"><span style="color:${x.p.c1}">${pIcon(x.p.k, 14)} ${x.p.s}</span><span class="kind ${b.kind}">${KIND[b.kind]}</span></div>
    <div class="bc-t">${x.m[0]}</div><div class="bc-v">${fmt(x.m[1], x.m[3])}<small>${unitOf(x.m)}</small></div>${bullet(x.m)}
    <div class="dkm-f">${pill(x.r)}<span>${benchTxt(x.m)}</span></div><p class="bc-s" title="${esc(b.src)}">${esc(b.src)}</p></div>`; }).join('')}</div>`; }
 if (type === 'rooms') { const avg = r => { const v = P.map(p => r.scores[p.k]).filter(x => x != null); return v.length ? v.reduce((a, b) => a + b, 0) / v.length : null; };
  const rs = S.res.rooms.map(r => ({r, a: avg(r)})).sort((x, y) => (x.a ?? 999) - (y.a ?? 999)), max = 14, shown = rs.slice(0, max);
  return `<div class="bh"><h1>Por room, de menor a mayor</h1><div class="pmeta">${['ok', 'mid', 'low'].map(r => pill(r)).join('')}</div></div>
   <div class="heat" style="--cols:${P.length}"><div class="hh">Room</div>${P.map(p => `<div class="hh c" style="color:${p.c1}">${pIcon(p.k, 14)}<span>${p.s}</span></div>`).join('')}<div class="hh">Promedio</div>
   ${shown.map(({r, a}) => `<div class="hr"><span>${esc(r.name)}</span><small>${fmtA(r.area)} m²</small></div>${P.map(p => { const v = r.scores[p.k], rt = ratePillar(v, p.target); return `<div class="hc ${rt || 'none'}" title="${esc(r.name)} · ${p.s}: ${v == null ? 'sin dato' : v} (meta ${p.target})">${rt ? sIcon(rt) : ''}<b>${v == null ? '—' : v}</b></div>`; }).join('')}
    <div class="havg"><i style="width:${a || 0}%"></i><b>${a == null ? '—' : fmt(a)}</b></div>`).join('')}</div>
   <p class="foot">Puntaje de cada room = promedio de sus celdas libres, contra la meta de cada pilar. Sustentab. por room mide el piso de sus celdas; el pilar del nivel considera todos los tipos.${rs.length > max ? ` Se muestran los ${max} más bajos de ${rs.length}.` : ''}</p>`; }
 if (type === 'process') { const st = [
   ['<path d="M4 8l8-4 8 4-8 4z"/><path d="M4 8v8l8 4 8-4V8M12 12v8"/>', 'Modelo de Revit', 'Pisos, muros, vidrio, puertas, mobiliario y parámetros SA_ de cada tipo.'],
   ['<rect x="4" y="4" width="16" height="16" rx="1.5"/><path d="M4 9.3h16M4 14.6h16M9.3 4v16M14.6 4v16"/>', `Retícula de ${fmt(S.res.G.cell, 1)} m`, `${fmt(S.res.G.freeCount)} celdas libres; muebles y columnas quedan fuera.`],
   ['<rect x="5" y="5" width="14" height="14" rx="2"/><path d="M9 15l2.2-3 1.8 2 2-3.5"/>', 'Valor por celda', 'De 0 a 1 en cada pilar, medido a 1.20 m: recorridos, visuales, vigilancia, luz y ruido.'],
   ['<path d="M6 20V11M12 20V5M18 20v-6"/>', 'Puntaje', 'Pilar = promedio de celdas × 100. Room = promedio de sus celdas.'],
   ['<circle cx="12" cy="12" r="8"/><path d="M8.5 12.2l2.3 2.3 4.7-4.9"/>', 'Contra la meta', 'Semáforo por pilar y por métrica, con su referencia a la vista.']];
  return `<h1>De dónde sale cada número</h1>
   <ol class="dkflow">${st.map((s, i) => `<li><div class="fl-i"><svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${s[0]}</svg><span>${String(i + 1).padStart(2, '0')}</span></div><div class="fl-t">${s[1]}</div><p>${s[2]}</p></li>`).join('')}</ol>
   <div class="g3">
    <div class="pcard fx"><div class="eyebrow">Pilar</div><code>promedio(celdas) × 100</code><p>Qué tan bien rinde el piso completo en una cualidad.</p></div>
    <div class="pcard fx"><div class="eyebrow">Relación</div><code>celdas(A × B ≥ umbral) × ${fmt(cellArea(), 2)} m²</code><p>Umbral = percentil 80 de la relación la primera vez; luego fijo, para comparar versiones del modelo.</p></div>
    <div class="pcard fx"><div class="eyebrow">Índice ponderado</div><code>Σ pilar × peso / Σ pesos</code><p>Los pesos se ajustan en Prioridades del cliente según lo que más le importa.</p></div></div>
   <p class="foot">Son indicadores de diseño, no simulaciones: la luz natural es un proxy por visuales a vidrio y el ruido se estima por tráfico. Para certificar se simula aparte.</p>`; }
 if (type === 'method') { const ex = 65;
  return `<h1>Cómo definimos las metas</h1>
   <div class="g3">
    <div class="pcard src"><span class="kind norma">${KIND.norma}</span><p>Cifras publicadas. Si el proyecto se certifica, mandan.</p><ul><li>LEED v4.1 · vistas al exterior en 75 % del área</li><li>LEED v4.1 · luz natural en 55 % del área</li><li>IBC 2021 · recorrido máximo de 61 m</li></ul></div>
    <div class="pcard src"><span class="kind lit">${KIND.lit}</span><p>Principios con evidencia que el equipo traduce a una cifra medible.</p><ul><li>CPTED · vigilancia natural</li><li>Sintaxis espacial · movimiento natural</li><li>Prospect-refuge · confort y exposición</li></ul></div>
    <div class="pcard src"><span class="kind proy">${KIND.proy}</span><p>Lo que piden la marca y la operación. Se acuerda con el cliente y se registra.</p><ul><li>Distancia media al acceso</li><li>Completitud de datos SA_</li><li>Materiales con EPD</li></ul></div></div>
   <div class="today"><b>Hoy</b> las metas de los pilares son metas de partida del equipo, no un estándar externo: ${P.map(p => `<span style="color:${p.c1}">${p.s}</span> ${p.target}`).join(' · ')}.</div>
   <div class="g2">
    <div class="pcard"><div class="eyebrow">Cómo se calibran</div><ol class="steps"><li><b>Referencias</b><span>Analizar sucursales de referencia con esta misma herramienta.</span></li><li><b>Percentil 75</b><span>Meta = lo que logra el mejor cuarto del portafolio.</span></li><li><b>Norma</b><span>Subirla donde una norma pida más.</span></li><li><b>Acuerdo</b><span>Validarla con el cliente y congelarla: todas las etapas, con la misma vara.</span></li></ol></div>
    <div class="pcard"><div class="eyebrow">Semáforo · ejemplo con meta ${ex}</div>
     <div class="semscale"><i class="low" style="width:${ex - BAND}%"></i><i class="mid" style="width:${BAND}%"></i><i class="ok" style="width:${100 - ex}%"></i><em style="left:${ex}%"></em></div>
     <div class="semax"><span style="left:0">0</span><span style="left:${ex - BAND}%">${ex - BAND}</span><span style="left:${ex}%"><b>meta ${ex}</b></span><span style="left:100%">100</span></div>
     <ul class="sem" style="margin-top:14px"><li>${pill('low')}<span>más de ${BAND} pts abajo</span></li><li>${pill('mid')}<span>hasta ${BAND} pts abajo</span></li><li>${pill('ok')}<span>en la meta o arriba</span></li></ul></div></div>`; }
 return ''; }
function closePresent() { $('present').classList.remove('on'); }

/* ---------- resumen compacto (#resumen=1; el botón Resumen de Revit lo abre en una ventana angosta) ---------- */
/** Todo lo que dice la app en un panel vertical: índice, pilares, indicadores fuera de meta, rooms más bajos y el espacio. */
function openDigest() { document.body.classList.add('dg'); $('dg').classList.add('on'); renderDigest(); }
function closeDigest() { document.body.classList.remove('dg'); $('dg').classList.remove('on'); }
function renderDigestBase() { const box = $('dg'); if (!box.classList.contains('on')) return;
 const m = cur(), head = (sub, title) => `<header class="phd"><div class="mark" aria-hidden="true"></div><div class="phd-t"><div class="eyebrow">Resumen</div><h3><span>${title}</span></h3><p>${sub}</p></div></header>`;
 const foot = `<footer class="dg-f"><button class="btn" id="dg-app">Abrir la app</button><button class="btn" id="dg-pres"${S.res ? '' : ' disabled'}>Presentar <kbd>P</kbd></button></footer>`;
 const wire = () => { $('dg-app').onclick = closeDigest; $('dg-pres').onclick = () => present(); box.querySelectorAll('[data-lv]').forEach(b => b.onclick = () => setLevel(b.dataset.lv)); };
 if (!S.res) { box.innerHTML = head('Sin modelo', 'Space Analytics') + '<div class="pbody"><section class="sec"><p>Abre un space-model.json o exporta desde Revit.</p></section></div>' + foot; wire(); return; }
 const src = m.model.source, d = src.exported_at ? new Date(src.exported_at) : null, ix = idxNow();
 const sub = [esc(S.res.level.name), d && !isNaN(d) ? `exportado ${d.toLocaleDateString('es-MX', {day: 'numeric', month: 'short', year: 'numeric'})}` : '', src.version ? `Revit ${esc(src.version)}` : ''].filter(Boolean).join(' · ');
 let h = '';
 if (multiLevel()) h += `<section class="sec"><div class="sec-h"><span class="eyebrow">Nivel</span></div><div class="rcs">${E.levelsOf(m.model).map(L => `<button class="rc${L.id === S.res.level.id ? ' on' : ''}" data-lv="${esc(L.name)}" aria-pressed="${L.id === S.res.level.id}">${esc(L.name)}</button>`).join('')}</div></section>`;
 if (ix) { const rt = ratePillar(ix.v, ix.target), gap = Math.round(ix.target - ix.v);
  h += `<section class="sec"><div class="hero hk" style="--c:#8C7BF5"><div class="eyebrow">Índice ponderado</div>
   <div class="hk-top"><span class="val xl">${fmt(ix.v, 1)}<small>/ 100</small></span>${pill(rt)}</div>
   <span class="b4 l"><i style="width:${ix.v}%"></i><em style="left:${ix.target}%"></em></span>
   <div class="hk-m meta"><span>meta <b>${fmt(ix.target)}</b></span><span>${gap > 0 ? `faltan <b>${gap}</b> puntos` : gap < 0 ? `<b>${-gap}</b> sobre la meta` : 'justo en la meta'}</span></div></div></section>`; }
 h += `<section class="sec"><div class="sec-h"><span class="eyebrow">Pilares</span><span class="sec-m">puntaje · raya = meta</span></div><div class="list">${P.map(p => { const sc = score(p.k), rt = ratePillar(sc, p.target);
  return `<div class="row" style="--c:${p.c1}"><span class="lab">${pIcon(p.k, 15)}<span>${p.name}</span></span><span class="end">${rt ? `<span class="pst">${sIcon(rt)}${RATE_S[rt]}</span>` : '<span class="pst none">Sin datos</span>'}<span class="val">${sc == null ? '—' : sc}</span></span>
   <span class="b4 ind full" aria-hidden="true"><i style="width:${sc || 0}%"></i><em style="left:${p.target}%"></em></span></div>`; }).join('')}</div></section>`;
 const ind = indicators(), n = {ok: 0, mid: 0, low: 0}; ind.forEach(x => n[x.r]++);
 const off = ind.filter(x => x.r !== 'ok').sort((a, b) => (a.r === 'low' ? 0 : 1) - (b.r === 'low' ? 0 : 1));
 h += `<section class="sec"><div class="sec-h"><span class="eyebrow">Indicadores</span><span class="sec-m">${n.ok} de ${ind.length} cumplen</span></div>
  <div class="dg-n">${['ok', 'mid', 'low'].map(r => `<div>${sIcon(r)}<b>${n[r]}</b><span>${RATE_S[r]}</span></div>`).join('')}</div>
  ${off.length ? `<div class="list div">${off.map(x => `<div class="row m" style="--c:${x.p.c1}"><span class="lab">${pIcon(x.p.k, 14)}<span>${x.m[0]}</span></span><span class="end"><span class="val s">${fmt(x.m[1], x.m[3])}<small>${unitOf(x.m).trim()}</small></span></span>
   <div class="full mt"><span class="pst">${sIcon(x.r)}${RATE_S[x.r]}</span><span class="meta">${benchTxt(x.m)}</span></div></div>`).join('')}</div>` : '<p>Todos cumplen su referencia.</p>'}</section>`;
 const avg = r => { const v = P.map(p => r.scores[p.k]).filter(x => x != null); return v.length ? v.reduce((a, b) => a + b, 0) / v.length : null; };
 const low = S.res.rooms.map(r => ({r, a: avg(r)})).filter(x => x.a != null).sort((x, y) => x.a - y.a).slice(0, 5);
 if (low.length) h += `<section class="sec"><div class="sec-h"><span class="eyebrow">Rooms más bajos</span><span class="sec-m">promedio de los pilares</span></div><div class="list">${low.map(({r, a}) => `<div class="row s"><span class="lab"><span>${esc(r.name)}</span></span><span class="b4"><i style="width:${a}%"></i></span><span class="val s">${fmt(a)}</span></div>`).join('')}</div></section>`;
 const w = allWarnings(), kv = [['Área libre', `${fmt(S.res.G.freeCount * cellArea())} m²`], ['Rooms', S.res.rooms.length], ['Retícula', `${fmt(S.res.G.cell, 1)} m`]].concat(multiLevel() ? [['Niveles', E.levelsOf(m.model).length]] : []);
 h += `<section class="sec"><div class="sec-h"><span class="eyebrow">El espacio</span></div><div class="list div">${kv.map(([a, b]) => `<div class="row kv"><span class="lab"><span>${a}</span></span><span class="val s">${b}</span></div>`).join('')}</div></section>`;
 if (w.length) h += `<section class="sec"><div class="sec-h"><span class="eyebrow" style="color:#B07818">Avisos</span><span class="sec-m">${w.length}</span></div><ul class="acts dg-w">${w.slice(0, 4).map(x => `<li>${esc(x)}</li>`).join('')}</ul>${w.length > 4 ? `<p style="margin-top:6px">Y ${w.length - 4} más en la app.</p>` : ''}</section>`;
 box.innerHTML = head(sub, esc((src.file || 'Proyecto').replace(/\.rvt$/i, ''))) + `<div class="pbody">${h}</div>` + foot; wire(); }

/* ===================== buscador de cualidades / comandos ===================== */
function commands() { const c = []; const g = (grp, t, run, col = '#999', k = '') => c.push({grp, t, run, c: col, k});
 g('Vista', S.left === 'senses' ? 'Volver al tablero de pilares' : 'Senses · el instrumento de pilares', () => setLeft(S.left === 'senses' ? 'board' : 'senses'), '#8C7BF5');
 g('Vista', 'Resumen compacto · todo en un panel', openDigest, '#8C7BF5');
 g('Acciones', 'Abrir space-model.json…', () => $('file-model').click(), '#5B9BFF');
 if (S.res) {
  g('Consultas del espacio', '¿Dónde hay estrés? · Flujo × Confort', () => { if (!S.rels.has('flujo|conf')) createRel('flujo', 'conf'); else focus('rel', 'flujo|conf'); }, '#D42A3C');
  g('Consultas del espacio', 'Ruta de efectivo · bóveda → caja', () => { focus('pillar', 'seg'); showPath('cash'); }, BY.seg.c1);
  g('Consultas del espacio', 'Ruta más lejana desde el acceso', () => { focus('pillar', 'flujo'); showPath('farthest'); }, BY.flujo.c1);
  if (multiLevel()) { g('Consultas del espacio', 'Ruta más larga del edificio · entre niveles', () => { focus('pillar', 'flujo'); showBuildingRoute('far'); }, BY.flujo.c1);
   g('Vista', '3D · todos los niveles', () => setStack(true), '#8C7BF5'); g('Vista', '3D · un nivel', () => setStack(false), '#8C7BF5');
   E.levelsOf(cur().model).forEach(L => cur().model.rooms.filter(r => r.level === L.id).forEach(rm => g('Rutas desde el acceso', `${rm.name || rm.number} · ${L.name}`, () => { const b = bld(), li = b.levels.findIndex(x => x.id === L.id), k = li < 0 ? -1 : b.levels[li].res.sel.rooms.findIndex(x => x.id === rm.id); if (k < 0) { toast('Ese room no está en el análisis'); return; } focus('pillar', 'flujo'); showBuildingRoute('room', k, li); }, BY.flujo.c1))); }
  g('Consultas del espacio', 'Puntos ciegos · nadie del personal los ve', () => showMark('blind'), BY.seg.c1);
  g('Consultas del espacio', 'Áreas inaccesibles desde el acceso', () => showMark('unreach'), BY.flujo.c1);
  g('Consultas del espacio', 'Rooms bajo meta en Confort', () => { focus('pillar', 'conf'); S.hlRooms = roomsBy('conf').filter(r => r.v < BY.conf.target).map(r => r.k); if (S.hlRooms.length) openZone(S.hlRooms[0]); renderViewport(); toast(`${S.hlRooms.length} rooms bajo meta`, `Confort < ${BY.conf.target}`); }, BY.conf.c1);
  g('Consultas del espacio', 'Celdas con Visibilidad ≥ 0.6', () => { focus('pillar', 'visib'); S.min = .6; renderViewport(); }, BY.visib.c1);
  g('Consultas del espacio', '¿Qué tan privada es la asesoría? · Exposición', () => { if (!S.rels.has('visib|conf')) createRel('visib', 'conf'); else focus('rel', 'visib|conf'); }, BY.conf.c1);
  g('Consultas del espacio', 'Familias con más carbono', () => { S.famSort = 'gwp'; S.famDir = -1; openFam(); }, BY.sust.c1);
  P.forEach((p, i) => g('Pilares', `Enfocar ${p.name}`, () => focus('pillar', p.k), p.c1, String(i + 1)));
  Object.keys(R).forEach(rk => { const [a, b] = rk.split('|'); g('Relaciones', `${S.rels.has(rk) ? 'Ver' : 'Relacionar'} ${BY[a].s} × ${BY[b].s} · ${R[rk].n}`, () => S.rels.has(rk) ? focus('rel', rk) : createRel(a, b), BY[a].c1); });
  S.res.rooms.forEach(r => g('Rooms', `${r.name}${r.number ? ' · ' + r.number : ''}`, () => roomClick(r.k), 'var(--ink)'));
  table().forEach(f => g('Familias', `${f.fam} · ${f.tipo}${f.mark ? ' · ' + f.mark : ''}`, () => openFam(f.id), 'var(--sel)'));
  E.levelsOf(cur().model).forEach(L => g('Niveles', L.name, () => setLevel(L.name), '#8C7BF5'));
  g('Acciones', 'Cargar tabla de Excel por Type Mark', () => $('file-table').click(), BY.sust.c1);
  g('Acciones', 'Re-analizar modelo', () => runAnalysis(true), '#5B9BFF', 'R'); g('Acciones', 'Presentar al cliente', present, '#D42A3C', 'P'); g('Acciones', 'Deshacer', undo, '#999', 'Ctrl Z');
 }
 g('Vista', 'Planta', () => setView('plan')); g('Vista', '3D maqueta blanca', () => setView('axo')); g('Vista', 'Dividida', () => setView('split'));
 g('Vista', 'Fondo neutro', () => setBg('neutral')); g('Vista', 'Fondo con halos', () => setBg('halos'));
 ['aura', 'niebla', 'noche'].forEach(t => g('Vista', `Tema ${t}`, () => setTheme(t)));
 return c; }
let palSel = 0, palItems = [];
function openPal(q) { $('pal').classList.add('on'); $('pal-in').value = typeof q === 'string' ? q : ''; palSel = 0; drawPal(); setTimeout(() => $('pal-in').focus(), 10); Snd.click(); }
function closePal() { $('pal').classList.remove('on'); }
function drawPal() { const q = E.norm($('pal-in').value); palItems = commands().filter(c => E.norm(c.grp + ' ' + c.t).includes(q)).slice(0, q ? 18 : 14); palSel = Math.min(palSel, Math.max(0, palItems.length - 1)); let h = '', grp = '';
 palItems.forEach((c, i) => { if (c.grp !== grp) { grp = c.grp; h += `<li class="gh">${grp}</li>`; } h += `<li class="it ${i === palSel ? 'sel' : ''}" data-i="${i}"><i style="background:${c.c}"></i>${esc(c.t)}<span class="k">${c.k}</span></li>`; });
 $('pal-list').innerHTML = h || '<li class="it muted">Sin resultados</li>'; $('pal-list').querySelectorAll('li[data-i]').forEach(li => li.onclick = () => { const c = palItems[+li.dataset.i]; closePal(); c.run(); });
 const s = $('pal-list').querySelector('.sel'); s && s.scrollIntoView({block: 'nearest'}); }
$('pal-in').addEventListener('input', () => { palSel = 0; drawPal(); });
$('pal-in').addEventListener('keydown', e => { if (e.key === 'ArrowDown') { palSel = Math.min(palItems.length - 1, palSel + 1); drawPal(); e.preventDefault(); } if (e.key === 'ArrowUp') { palSel = Math.max(0, palSel - 1); drawPal(); e.preventDefault(); } if (e.key === 'Enter' && palItems[palSel]) { const c = palItems[palSel]; closePal(); c.run(); } if (e.key === 'Escape') closePal(); });
$('pal').addEventListener('click', e => { if (e.target.id === 'pal') closePal(); });

/* ===================== controles globales ===================== */
function setTheme(t) { document.documentElement.dataset.theme = t; document.querySelectorAll('#themes button').forEach(b => b.setAttribute('aria-pressed', b.dataset.t === t)); if (S.res) renderViewport(); }
function setBg(b) { document.documentElement.dataset.bg = b; document.querySelectorAll('#bgs button').forEach(x => x.setAttribute('aria-pressed', x.dataset.b === b)); }
function setView(v) { S.view = v; document.querySelectorAll('#views button').forEach(b => b.setAttribute('aria-pressed', b.dataset.v === v)); renderViewport(); Snd.click(); }
function setLevel(name) { S.level = name; S.path = null; S.mark = null; runAnalysis(); }
// La sucursal de ejemplo (app/samples/sucursal.js): lo que se ve al abrir la app sin datos incrustados (GitHub Pages) y lo que
// abre el botón «Ver sucursal de ejemplo». No es un modelo real. Si falta, queda el estado vacío.
function loadSample() { if (window.SA_SAMPLE) { addModels(window.SA_SAMPLE, 'sucursal de ejemplo'); return; }
 const drop = $('drop'); if (drop) drop.style.visibility = 'hidden';   // sin «Trae un modelo» detrás de la carga
 const s = document.createElement('script'); s.src = 'samples/sucursal.js';
 s.onload = () => window.SA_SAMPLE && addModels(window.SA_SAMPLE, 'sucursal de ejemplo');
 s.onerror = () => { if (drop) drop.style.visibility = ''; toast('No encontré la sucursal de ejemplo', 'app/samples/sucursal.js'); }; document.head.appendChild(s); }
document.querySelectorAll('#themes button').forEach(b => b.onclick = () => { setTheme(b.dataset.t); Snd.click(); });
document.querySelectorAll('#bgs button').forEach(b => b.onclick = () => { setBg(b.dataset.b); Snd.click(); });
document.querySelectorAll('#views button').forEach(b => b.onclick = () => setView(b.dataset.v));
document.querySelectorAll('#cells button').forEach(b => b.onclick = () => { S.cell = +b.dataset.c; document.querySelectorAll('#cells button').forEach(x => x.setAttribute('aria-pressed', x === b)); Snd.click(); runAnalysis(); });
$('lvl').onchange = e => setLevel(e.target.value);
$('snd').onclick = e => { Snd.on = !Snd.on; e.currentTarget.setAttribute('aria-pressed', Snd.on); };
$('b-open').onclick = () => $('file-model').click();
$('file-model').onchange = e => { readFiles(e.target.files); e.target.value = ''; };
$('file-table').onchange = e => { if (e.target.files[0]) loadTable(e.target.files[0]); e.target.value = ''; };
document.addEventListener('pointerdown', e => { if (!e.target.closest('#zpop, svg.plan')) zoneClose(); }, true);
$('zpop').addEventListener('pointerenter', () => zoneNear(true)); $('zpop').addEventListener('pointerleave', () => zoneNear(false));
addEventListener('resize', placeZone);
$('b-pal').onclick = openPal; $('b-fam').onclick = () => openFam(); $('b-run').onclick = () => runAnalysis(true); $('b-pres').onclick = () => present(); $('b-undo').onclick = undo;
$('b-back').onclick = () => setLeft('board'); buildLayers(); renderBoard(); renderMixer();
$('b-link').onclick = () => setLink(!S.link); $('b-anat').onclick = () => $('anat').classList.toggle('on'); $('anat-x').onclick = () => $('anat').classList.remove('on');
$('f-q').oninput = e => { S.famQ = e.target.value; renderFam(); };
document.querySelectorAll('.mtable th[data-s]').forEach(th => th.onclick = () => { const s = th.dataset.s; S.famDir = S.famSort === s ? -S.famDir : 1; S.famSort = s; renderFam(); });
$('f-all').onchange = e => { S.selFam = e.target.checked ? new Set(table().map(f => f.id)) : new Set(); renderFam(); };
$('f-sel').onclick = () => { if (!S.selFam.size) { toast('Selecciona al menos una familia'); return; } S.iso = false; closeFam(); renderViewport(); toast(`${S.selFam.size} familia${S.selFam.size > 1 ? 's' : ''} seleccionada${S.selFam.size > 1 ? 's' : ''} en viewport`); };
$('f-iso').onclick = () => { if (!S.selFam.size) { toast('Selecciona al menos una familia'); return; } S.iso = true; closeFam(); renderViewport(); toast('Familias aisladas', 'el análisis se atenúa'); };
$('f-csv').onclick = downloadCSV; $('f-xls').onclick = () => $('file-table').click();
$('m-x').onclick = closeFam; $('modal').addEventListener('click', e => { if (e.target.id === 'modal') closeFam(); });
// soltar archivos en cualquier parte
let dragN = 0;
addEventListener('dragenter', e => { if (e.dataTransfer && [...e.dataTransfer.types].includes('Files')) { dragN++; $('dropall').classList.add('on'); } });
addEventListener('dragleave', () => { dragN = Math.max(0, dragN - 1); if (!dragN) $('dropall').classList.remove('on'); });
addEventListener('dragover', e => e.preventDefault());
addEventListener('drop', e => { e.preventDefault(); dragN = 0; $('dropall').classList.remove('on'); if (e.dataTransfer.files.length) readFiles(e.dataTransfer.files); });
// un clic fuera cierra la ventana de avisos
addEventListener('click', e => { if (S.warnOpen && !e.target.closest('#warnpop, #warnchip')) { S.warnOpen = false; renderSelChip(); } });
addEventListener('keydown', e => { const k = e.key.toLowerCase();
 if ((e.ctrlKey || e.metaKey) && k === 'k') { e.preventDefault(); openPal(); return; }
 if ((e.ctrlKey || e.metaKey) && k === 'z') { e.preventDefault(); undo(); return; }
 if ((e.ctrlKey || e.metaKey) && k === 'o') { e.preventDefault(); $('file-model').click(); return; }
 if ($('pal').classList.contains('on')) return;
 if (e.key === 'Escape' && S.warnOpen) { S.warnOpen = false; renderSelChip(); return; }
 if (e.key === 'Escape') { if (!$('present').classList.contains('on')) closeDigest(); zoneClose(); closePresent(); closeFam(); setLink(false); $('anat').classList.remove('on'); return; }
 if ($('present').classList.contains('on')) { if (e.key === 'ArrowRight') { pIdx++; drawSlide(); } if (e.key === 'ArrowLeft') { pIdx--; drawSlide(); } return; }
 if ($('modal').classList.contains('on') || e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT') return;
 const n = parseInt(e.key); if (n >= 1 && n <= 5) { nodeClick(P[n - 1].k); return; }
 if (k === 'r') runAnalysis(true); if (k === 'p') present(); if (k === 'l' && S.left === 'senses') setLink(!S.link); if (k === 'f') openFam(); });

/* ===================== modos Experiencia y Sustentabilidad =====================
 * Reemplaza el tablero, el inspector, la leyenda, el Resumen, el plano y las slides de la presentación.
 * Las originales quedan como renderBoardBase, renderInspectorBase, renderLegendBase, renderDigestBase,
 * renderViewportBase y drawSlideBase: las llama cada reemplazo para todo lo que no es de estos dos modos
 * (relaciones, pilares de la presentación, estado vacío, Senses). Los índices viven en indices.js. Ver docs/modos.md. */
const PX = window.SAIndices, PXT = PX.THEMES, PXK = PXT.map(t => t.k);
PXT.forEach(t => { BY[t.k] = Object.assign({}, BY[t.k] || {}, t, {target: 70}); ICON[t.k] = t.ic; });
S.px = {type: 'all', mix: 'visitas', counts: null, of: null, supOpen: false, hallOpen: false, mode: 'exp', last: {exp: null, sus: null}, fold: {}, circG: 'furn', circMin: 1}; // Circularidad abre en Muebles: es lo que el proyecto quiere poner al frente
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
 const X = PX.score(r._sp, {counts: S.px.counts, mix: S.px.mix, type: S.px.type}); // con un usuario elegido, Experiencia pinta su recorrido y su zona
 if (S.px.circG === 'furn' || S.px.circG === 'mat') X.fields.circ = new Float32Array(r.G.n).fill(NaN); // el calor de Circularidad es de los pisos (acabados)
 Object.assign(r.fields, X.fields); r._px = X; return X; }
const pxTyKey = k => isTh(k) && PX.TH[k].fam === 'exp' && S.px.type !== 'all' ? k + ':' + S.px.type : k;
/* Circularidad: qué tiene contenido reciclado, por grupo. Muebles y equipo · materiales (muros, puertas, ventanas) · acabados (pisos). */
const CIRC_G = [['all', 'Todo'], ['furn', 'Muebles'], ['mat', 'Materiales'], ['acab', 'Acabados']], CIRC_GN = Object.fromEntries(CIRC_G);
const circOn = () => !!(S.px && S.res && S.res._sp && S.res._sp.circEl && S.focus.type === 'pillar' && S.focus.k === 'circ');
const circIt = o => { const it = S.res._sp.circEl.byType[o.type]; return it && (S.px.circG === 'all' || it.g === S.px.circG) ? it : null; };
const circPass = it => it.reu || it.circ != null && it.circ >= S.px.circMin;
/** Relleno de un elemento en Circularidad: más intenso = más reciclado; bajo el mínimo, apenas teñido; sin dato, gris punteado. */
function circStyle(o) { if (!circOn()) return null; const it = circIt(o); if (!it) return null; const iso = S.iso && S.selFam.size && !S.selFam.has(o.type) ? .3 : 1;
 if (it.circ == null) return {fill: 'var(--surface-2)', op: .9 * iso, dash: true};
 return {fill: BY.circ.c1, op: (circPass(it) ? .3 + .65 * it.circ / 100 : .1) * iso}; }
const thScore = (X, k) => { const v = X.th[k]; return v == null ? null : PX.TH[k].fam === 'sus' || S.px.type === 'all' ? v.all : v[S.px.type]; };

function thRow(X, t, tag) { tag = tag || 'button'; const sc = rnd(thScore(X, t.k)), rt = rate70(sc), on = tag === 'button' && S.focus.type === 'pillar' && S.focus.k === t.k;
 return `<${tag} class="row${on ? ' on' : ''}" data-th="${t.k}"${tag === 'button' ? ` aria-pressed="${on}"` : ''} style="--c:${t.c1}" title="${esc(t.q)}">
  <span class="lab">${pIcon(t.k, 15)}<span>${t.name}</span></span><span class="end">${rt ? `<span class="pst">${sIcon(rt)}${RATE_S[rt]}</span>` : '<span class="pst none">Sin datos</span>'}<span class="val">${sc == null ? '—' : sc}</span></span>
  <span class="b4 ind full" aria-hidden="true"><i style="width:${sc || 0}%"></i><em style="left:70%"></em></span></${tag}>`; }
function ixInner(fam, v, sub, ic) { const sc = rnd(v), rt = rate70(sc);
 return `<span class="eyebrow">${ic || famDots(fam)}<span>${PX.FAM[fam].idx}</span></span><span class="val xl">${sc == null ? '—' : sc}<small>/ 100</small></span>${rt ? `<span class="pst">${sIcon(rt)}${RATE_S[rt]}</span>` : '<span class="pst none">Sin datos</span>'}<span class="b4 l"><i style="width:${sc || 0}%"></i><em style="left:70%"></em></span>${sub ? `<span class="meta">${sub}</span>` : ''}`; }
const ixSub = (X, fam) => { const tot = PXT.filter(t => t.fam === fam).length;
 return X.cov[fam] < tot ? `Índice parcial · ${X.cov[fam]} de ${tot} temas con datos` : fam === 'exp' ? 'Índice potencial · modelado con demanda supuesta' : `Índice potencial · ${fmt(X.m.cepd.v)} % del carbono con EPD`; };
function ixBlock(X) { const one = (fam, v) => `<div class="ixc" style="--c:${PX.FAM[fam].c}">${ixInner(fam, v, ixSub(X, fam))}</div>`;
 return `<div class="ix2">${one('exp', X.exp)}${one('sus', X.sus)}</div>`; }
// los dos índices son el interruptor de modo: el activo lleva la palomita, el borde y el fondo de su color; el otro, un círculo vacío y gris
const PXCK = '<span class="pxck" aria-hidden="true"><svg viewBox="0 0 12 12"><path d="M2.5 6.3 5 8.7l4.5-5"/></svg></span>';
function modeTabs(X) { const one = (fam, v) => { const on = S.px.mode === fam, part = X.cov[fam] < PXT.filter(t => t.fam === fam).length; // sin notas: solo avisa si el índice es parcial
  return `<button class="ixc pxtab" data-mode="${fam}" aria-pressed="${on}" style="--c:${PX.FAM[fam].c}" title="${on ? 'Estás viendo' : 'Cambiar a'} ${PX.FAM[fam].n}">${ixInner(fam, v, part ? ixSub(X, fam) : '', PXCK)}</button>`; };
 return `<div class="ix2 pxtabs" role="group" aria-label="Modo">${one('exp', X.exp)}${one('sus', X.sus)}</div>`; }
// el modo sale del tema enfocado; cada modo recuerda su último tema. Las relaciones hablan del cliente: solo en Experiencia
function pxSync() { const f = S.focus; if (f.type === 'rel') S.px.mode = 'exp'; else if (f.type === 'pillar' && isTh(f.k)) { S.px.mode = PX.TH[f.k].fam; S.px.last[S.px.mode] = f.k; }
 const m = S.px.mode, isExp = m === 'exp'; document.documentElement.style.setProperty('--pxm', PX.FAM[m].c);
 $('prels').closest('.sec').hidden = !isExp;
 if ($('lsenses').hidden) $('lp-h').textContent = PX.FAM[m].n;
 $('lp-p').hidden = $('lsenses').hidden; } // el tablero va sin notas; solo Senses conserva su leyenda
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
 return `<details class="sec prio" id="px-hall"${pxGroup('pxl')}${S.px.hallOpen ? ' open' : ''}><summary><span class="eyebrow">Hallazgos</span><span class="pxsum mono">${F.length}</span></summary>
  <p>Cada uno sale de una <b>regla fija</b> sobre una métrica: aparece cuando su puntaje baja de 70 (mejorar) o de 40 (atención). El texto es una plantilla con el valor medido; no lo redacta una IA.</p>
  <div class="list div">${F.map((f, i) => `<div class="row m" style="--c:${BY[f.x.th].c1}"><span class="lab">${pIcon(f.x.th, 14)}<span>${esc(f.msg)}</span></span><span class="end">${eye ? `<button class="ib sm" data-fd="${i}" aria-label="Ver en el plano" title="Ver en el plano">${EYE}</button>` : ''}</span>
   <div class="full mt">${f.sev === 'info' ? '<span class="pst none">Info</span>' : `<span class="pst">${sIcon(f.sev)}${RATE_S[f.sev]}</span>`}<span class="meta src">${f.rule}</span></div></div>`).join('')}</div></details>`; }
function wireDetails(root) { [['px-sup', 'supOpen'], ['px-hall', 'hallOpen']].forEach(([id, k]) => { const d = root.querySelector('#' + id); if (d) d.ontoggle = () => { S.px[k] = d.open; }; }); }

/* Selector de usuario: un botón que dice quién está elegido y se abre en una lista de cuatro opciones, cada una con su letra,
 * su nombre, qué atiende y cuánto dura. Lista flotante: abrirla no mueve nada ni agrega scroll. */
const PXCHEV = '<svg class="pxus-c" viewBox="0 0 12 12" aria-hidden="true"><path d="m2.5 4.5 3.5 3.5 3.5-3.5" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>';
const usChip = k => k === 'all' ? `<span class="pxus-a">${dots(...PX.TK.map(t => PX.TYPES[t].c))}</span>` : tl(k);
const usName = k => k === 'all' ? 'Todos' : PX.TYPES[k].n, usSub = k => k === 'all' ? 'los tres tipos combinados' : `${PX.TYPES[k].d} · ${PX.TYPES[k].t}`;
function userPicker() { const cur = S.px.type;
 return `<div class="pxus" id="px-us"><button class="pxus-b" id="px-usb" aria-haspopup="listbox" aria-expanded="false" aria-controls="px-usl" title="Cambiar el tipo de usuario">${usChip(cur)}<span class="pxus-t"><b>${usName(cur)}</b><span>${usSub(cur)}</span></span>${PXCHEV}</button>
  <div class="pxus-l" id="px-usl" role="listbox" aria-label="Tipo de usuario" hidden>${['all'].concat(PX.TK).map(k => `<button class="pxus-o" role="option" data-ty="${k}" aria-selected="${cur === k}">${usChip(k)}<span class="pxus-t"><b>${usName(k)}</b><span>${k === 'all' ? usSub(k) : PX.TYPES[k].d}</span></span>${k === 'all' ? '' : `<span class="tm">${PX.TYPES[k].t}</span>`}<svg class="pxus-ck" viewBox="0 0 12 12" aria-hidden="true"><path d="M2.5 6.3 5 8.7l4.5-5" stroke-linecap="round" stroke-linejoin="round"/></svg></button>`).join('')}</div></div>`; }
let pxUsBound = false;
function wireUserPicker(root) { const bt = root.querySelector('#px-usb'), ls = root.querySelector('#px-usl'); if (!bt) return;
 const opts = () => [...ls.querySelectorAll('.pxus-o')], set = open => { ls.hidden = !open; bt.setAttribute('aria-expanded', open); if (open) (ls.querySelector('[aria-selected=true]') || opts()[0]).focus(); };
 bt.onclick = () => set(ls.hidden);
 bt.onkeydown = e => { if (e.key === 'ArrowDown' || e.key === 'ArrowUp') { e.preventDefault(); set(true); } };
 ls.onkeydown = e => { const o = opts(), i = o.indexOf(document.activeElement); let j = -1;
  if (e.key === 'ArrowDown') j = (i + 1) % o.length; else if (e.key === 'ArrowUp') j = (i - 1 + o.length) % o.length; else if (e.key === 'Home') j = 0; else if (e.key === 'End') j = o.length - 1;
  else if (e.key === 'Escape' || e.key === 'Tab') { set(false); if (e.key === 'Escape') bt.focus(); return; } else return;
  e.preventDefault(); o[j].focus(); };
 if (!pxUsBound) { pxUsBound = true; document.addEventListener('click', e => { const l = $('px-usl'); if (l && !l.hidden && !e.target.closest('#px-us')) { l.hidden = true; $('px-usb').setAttribute('aria-expanded', 'false'); } }); } }
function renderBoard() { renderBoardBase(); const b = $('pxboard'), more = $('pxmore'); if (!b) return; pxSync();
 if (!S.res) { b.innerHTML = '<section class="sec"><p class="meta">Carga un modelo para ver su diagnóstico.</p></section>'; more.innerHTML = ''; return; }
 const X = pxNow(), m = S.px.mode, finds = X.finds.filter(f => PX.TH[f.x.th].fam === m), themes = PXT.filter(t => t.fam === m).map(t => thRow(X, t)).join('');
 b.innerHTML = `<section class="sec">${modeTabs(X)}</section>` + (m === 'exp'
  ? `<section class="sec pxpara"><div class="sec-h"><span class="eyebrow">Usuario</span></div>${userPicker()}
   <div class="list">${themes}</div></section>`
  : `<section class="sec"><div class="sec-h"><span class="eyebrow">Elementos del modelo</span></div>
   <div class="list">${themes}</div></section>`);
 more.innerHTML = (m === 'exp' ? supBlock() : '') + hallBlock(X, true, finds);
 b.querySelectorAll('[data-mode]').forEach(x => x.onclick = () => pxSetMode(x.dataset.mode));
 b.querySelectorAll('[data-th]').forEach(x => x.onclick = () => { const k = x.dataset.th; S.hlRooms = []; focus('pillar', k); Snd.tone(BY[k].f, 1.2, .04); });
 b.querySelectorAll('[data-ty]').forEach(x => x.onclick = () => { S.px.type = x.dataset.ty; renderAll(); Snd.click(); }); wireUserPicker(b);
 more.querySelectorAll('[data-mix]').forEach(x => x.onclick = () => { S.px.mix = x.dataset.mix; renderAll(); Snd.click(); });
 more.querySelectorAll('[data-fd]').forEach(x => x.onclick = () => { const f = finds[+x.dataset.fd], G = S.res.G; let ks = f.zone || [];
  if (!ks.length && f.at) { const i = Math.floor((f.at[0] - G.ox) / G.cell), j = Math.floor((f.at[1] - G.oy) / G.cell), c = j * G.nx + i; if (G.room[c] >= 0) ks = [G.room[c]]; }
  S.hlRooms = ks; S.path = f.x.path || null; S.mark = f.x.id === 'blind' || f.x.id === 'vig' ? 'blind' : null; focus('pillar', f.x.th); });
 wireDetails(more); }

function metRow(x, X) { const r = X.m[x.id], s = r.s, rt = x.ctx ? null : rate70(s), vt = r.v == null ? '—' : x.txt ? x.txt(r.v, S.res._sp) : fmt(r.v, x.d);
 const ly = x.path ? `path:${x.path}` : x.id === 'blind' ? 'mark:blind' : null;
 const eye = ly ? `<button class="ib sm" data-ly="${ly}" aria-pressed="false" aria-label="Ver ${x.n.toLowerCase()} en el plano">${EYE}</button>` : '<span class="ib-ph"></span>';
 const unit = x.u === 'ρ' ? '' : x.u;
 const rng = x.ctx ? '' : x.id === 'efic' ? `ideal ${fmt(PX.EF.ok, 2)}–1.00 · ${fmt(PX.EF.lo, 2)} o ${fmt(PX.EF.hi, 2)} dan 0` : `bueno ${x.rt ? x.rt[1] : fmt(x.good, x.d) + (x.u ? ' ' + x.u : '')} · malo ${x.rt ? x.rt[0] : fmt(x.poor, x.d) + (x.u ? ' ' + x.u : '')}`;
 const id = 'm:' + x.id;
 return `<details class="pxmd" data-fold="${id}"${pxGroup('pxi')}${pxFoldOpen(id) ? ' open' : ''} style="--c:${BY[x.th].c1}"><summary class="row m pxm"><span class="lab"><span title="${esc(x.n)}">${x.n}</span></span><span class="end"><span class="val">${vt}<small>${unit}</small></span>${eye}</span>
  ${x.ctx ? '' : `<span class="b4 ind full" aria-hidden="true"><i style="width:${s || 0}%"></i><em style="left:70%"></em></span>`}
  <span class="full pxmst">${rt ? `<span class="pst">${sIcon(rt)}${RATE_S[rt]} · ${s} pts</span>` : x.ctx ? '<span class="pst none">Contexto · no suma puntos</span>' : ''}</span></summary>
  <div class="pxmb mt">${rng ? `<span class="meta">${rng}</span>` : ''}<span class="meta src">${x.what}</span>
   <span class="pxo"><span class="og" title="De dónde sale el dato">${x.src}</span>${x.ty ? Object.keys(x.ty).map(tl).join('') : ''}</span>
   ${!x.ctx && s != null && s < 70 ? `<p class="pxc"><b>${esc(x.msg(r.v, S.res._sp))}</b> ${esc(x.sug)}</p>` : ''}</div></details>`; }

/* Qué dice el mapa: con un usuario elegido, los temas de Experiencia hablan de su recorrido y su zona. */
const PXUNIT_T = {orient: 'su recorrido, de la puerta a su servicio · más intenso = ruta más directa', espera: 'ocupación de su servicio en la hora pico',
 priv: {E: 'desde dónde se ve la pantalla del ATM', T: 'desde dónde se ve la ventanilla', A: 'desde dónde se ve la mesa de asesoría'}, seg: 'puestos de personal que ven su recorrido y su zona', amb: 'luz natural en su zona'};
const pxUnit = t => { if (t.fam !== 'exp' || S.px.type === 'all' || !PXUNIT_T[t.k]) return t.unit; const u = PXUNIT_T[t.k]; return `${PX.TYPES[S.px.type].n} · ${typeof u === 'string' ? u : u[S.px.type]}`; };

/** Circularidad: qué es reciclado. Filtro por grupo y por mínimo de contenido reciclado; seleccionar o aislar lo reciclado en el viewport. */
function circSec() { const ce = S.res._sp.circEl, g = S.px.circG, su = ce.groups[g], L = ce.list.filter(it => g === 'all' || it.g === g), sel = L.filter(circPass), nSel = sel.reduce((a, it) => a + it.n, 0);
 const pct = v => v == null ? '—' : fmt(v), one = S.selFam.size === 1 ? [...S.selFam][0] : null;
 const rows = L.slice(0, 8).map(it => { const v = it.circ, pass = circPass(it); return `<button class="row s${one === it.id ? ' on' : ''}" data-cf="${esc(it.id)}" style="--c:${BY.circ.c1}${pass ? '' : ';opacity:.55'}" title="Seleccionar ${esc(it.fam)} en el viewport"><span class="lab"><span>${esc(it.fam)} <span class="muted">· ${fmt(it.n)}${it.reu ? ' · reutilizado' : ''}</span></span></span><span class="b4"><i style="width:${v || 0}%"></i></span><span class="val s">${v == null ? '—' : Math.round(v) + '<small>%</small>'}</span></button>`; }).join('');
 return `<section class="sec pxrec"><div class="sec-h"><span class="eyebrow">Qué es reciclado</span><span class="sec-m">${CIRC_GN[g].toLowerCase()} · ${su.unit === 'm²' ? 'por m²' : 'por pieza'}</span></div>
  <div class="ly-row full"><span class="seg" id="px-cg" role="group" aria-label="Qué grupo ver">${CIRC_G.map(([kk, n]) => `<button data-cg="${kk}" aria-pressed="${g === kk}">${n}</button>`).join('')}</span></div>
  <div class="ly-row"><span>Reciclado al menos</span><span class="seg" id="px-cm">${[[1, 'Algo'], [30, '30 %'], [50, '50 %']].map(([v, n]) => `<button data-cm="${v}" aria-pressed="${S.px.circMin === v}" title="${v === 1 ? 'Cualquier contenido reciclado' : `Al menos ${v} % reciclado`}">${n}</button>`).join('')}</span></div>
  <div class="pxrec-k" style="--c:${BY.circ.c1}"><div><span class="val">${pct(su.share)}<small>%</small></span><span class="meta">${g === 'acab' ? 'del piso' : 'de las piezas'} trae material reciclado</span></div><div><span class="val">${pct(su.avg)}<small>%</small></span><span class="meta">de contenido reciclado, en promedio</span></div></div>
  <p class="meta">${fmt(su.nRec)} de ${fmt(su.n)} piezas con contenido reciclado${su.nNo ? ` · ${fmt(su.nNo)} sin dato` : ''}. En el plano: más intenso = más reciclado.</p>
  <div class="list">${rows}</div>
  <div class="pxrec-b"><button class="btn" id="px-csel"${nSel ? '' : ' disabled'}>Seleccionar lo reciclado · ${fmt(nSel)}</button><button class="btn" id="px-ciso" aria-pressed="${!!(S.iso && S.selFam.size)}"${nSel ? '' : ' disabled'}>Aislar</button>${S.selFam.size ? '<button class="btn" id="px-cclr">Limpiar</button>' : ''}</div></section>`; }
function wireCirc(box) { const ce = S.res._sp.circEl, g = () => S.px.circG, recIds = () => ce.list.filter(it => (g() === 'all' || it.g === g()) && circPass(it)).map(it => it.id);
 box.querySelectorAll('[data-cg]').forEach(b => b.onclick = () => { S.px.circG = b.dataset.cg; if (S.selFam.size && S.px.recSel) S.selFam = new Set(recIds()); renderAll(); Snd.click(); });
 box.querySelectorAll('[data-cm]').forEach(b => b.onclick = () => { S.px.circMin = +b.dataset.cm; if (S.selFam.size && S.px.recSel) S.selFam = new Set(recIds()); renderAll(); Snd.click(); });
 box.querySelectorAll('[data-cf]').forEach(b => b.onclick = () => { const id = b.dataset.cf; S.px.recSel = false; S.selFam = S.selFam.size === 1 && S.selFam.has(id) ? new Set() : new Set([id]); S.iso = false; renderAll(); Snd.click(); });
 const sel = $('px-csel'), iso = $('px-ciso'), clr = $('px-cclr');
 if (sel) sel.onclick = () => { const ids = recIds(); S.selFam = new Set(ids); S.px.recSel = true; S.iso = false; renderAll(); Snd.click(); toast(`${CIRC_GN[g()]}: lo reciclado seleccionado`, `${ids.length} familia${ids.length === 1 ? '' : 's'} en el viewport`); };
 if (iso) iso.onclick = () => { if (S.iso && S.selFam.size) { S.iso = false; } else { if (!S.selFam.size) { S.selFam = new Set(recIds()); S.px.recSel = true; } S.iso = true; } renderAll(); Snd.click(); };
 if (clr) clr.onclick = () => { S.selFam.clear(); S.iso = false; S.px.recSel = false; renderAll(); Snd.click(); }; }

function renderInspector() { if (S.res) pxSync(); if (!S.res || S.focus.type !== 'pillar' || !isTh(S.focus.k)) { renderInspectorBase(); const e = S.res && document.querySelector('#insp-h .eyebrow'); if (e) e.textContent = `${PX.FAM[S.px.mode].idx} · ${e.textContent}`; return; }
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
 if (k === 'circ') h += circSec();
 const ms = PX.MET.filter(x => x.th === k && (ty === 'all' || !x.ty || x.ty[ty]));
 h += `<section class="sec"><div class="sec-h"><span class="eyebrow">Métricas</span><span class="sec-m">valor · puntaje · de dónde sale</span></div><div class="list div">${ms.map(x => metRow(x, X)).join('')}</div></section>`;
 if (k === 'carb') h += foldSec('carbtop', 'Lo que más aporta', 'kgCO₂e · origen', `<div class="list div">${S.res._sp.sus.list.slice(0, 6).map(i => `<div class="row kv"><span class="lab"><span>${esc(i.n)}</span></span><span class="end"><span class="og">${i.src}</span><span class="val s">${fmt(i.act)}</span></span></div>`).join('')}</div>`);
 if (k === 'amb') h += foldSec('proxy', 'Cómo se estima', 'proxy', `<p><b>Proxy.</b> Por ahora la luz se estima con la vista al vidrio exterior. Después, sDA (300 lux, 50 % de las horas) con Radiance y los edificios vecinos.</p>`);
 if (t.fam === 'sus') h += foldSec('revisar', 'Por revisar', 'con Fabiola', `<p><b>Por revisar con Fabiola:</b> factores genéricos, línea base y umbrales de este tema.</p>`);
 const un = pxUnit(t);
 h += `<section class="sec pxplano"><div class="sec-h"><span class="eyebrow">En el plano</span></div><p>${un[0].toUpperCase() + un.slice(1)}.</p></section>`;
 box.innerHTML = h; syncLayers();
 if (k === 'circ') wireCirc(box);
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
function pxOrigin(k, r) { r._org = r._org || {}; const ck = pxTyKey(k); if (r._org[ck]) return r._org[ck];
 const G = r.G, sp = r._sp, s = r.sel, m = r.model, n = G.n, val = r.fields[k], t = new Float32Array(n).fill(1), o = {t, t2: null, a1: 1, src: [], cap: '', D: 1900, W: .16}, kk = PXALIAS[k] || k;
 const has = c => G.free[c] && !isNaN(val[c]);
 // desde cada punto, lo que alcanza a ver: visit(celda, distancia, dx, dy)
 const rays = (x, y, maxD, visit) => { for (let q = 0; q < 360; q++) { const a = (q + .5) / 360 * 2 * Math.PI; E.castRay(G, x, y, Math.cos(a), Math.sin(a), maxD, c => { const [p, u] = G.xy(c); visit(c, Math.hypot(p - x, u - y), p - x, u - y); }); } };
 const north = (dx, dy) => { const a = Math.atan2(dx, dy); return (a < 0 ? a + 2 * Math.PI : a) / (2 * Math.PI); }; // 0 = norte, en sentido de las manecillas
 if (kk === 'orient') { // la onda camina desde la puerta; luego se encienden los puntos de los clientes y al final los del personal
  let mx = 1; for (let c = 0; c < n; c++) if (has(c) && isFinite(G.dEnt[c]) && G.dEnt[c] > mx) mx = G.dEnt[c];
  const grp = kd => sp.vps.filter(v => v.kind === kd), cc = v => { const [i, j] = [Math.floor((v.x - G.ox) / G.cell), Math.floor((v.y - G.oy) / G.cell)]; return j * G.nx + i; };
  const dC = grp('cliente').length ? E.dijkstra(G, grp('cliente').map(cc)).dist : null, dS = grp('personal').length ? E.dijkstra(G, grp('personal').map(cc)).dist : null;
  for (let c = 0; c < n; c++) if (has(c)) { let v = isFinite(G.dEnt[c]) ? G.dEnt[c] / mx * .5 : 1;
   if (dC && isFinite(dC[c])) v = Math.min(v, .2 + dC[c] / mx * .5); if (dS && isFinite(dS[c])) v = Math.min(v, .4 + dS[c] / mx * .5); t[c] = Math.min(1, v); }
  o.src = G.entrances.map(e => { const [x, y] = G.xy(e.c); return {x, y, at: 0}; }).concat(grp('cliente').map(v => ({x: v.x, y: v.y, at: .2})), grp('personal').map(v => ({x: v.x, y: v.y, at: .4})));
  o.cap = 'Nace en la entrada · luego los clientes · luego el personal'; o.D = 2400;
 } else if (kk === 'espera') { // cada zona se llena desde sus puntos de servicio: primero lo rápido, al final la asesoría
  const pts = {E: sp.atms, T: sp.tells, A: sp.seats}, st = {E: 0, T: .18, A: .36}, mx = {E: 1, T: 1, A: 1}, d = new Float32Array(n);
  for (const c in sp.svcRoom) { const ty = sp.svcRoom[c]; if (!ty || !pts[ty].length) continue; const [x, y] = G.xy(+c); let b = Infinity; pts[ty].forEach(p => { const v = Math.hypot(p.x - x, p.y - y); if (v < b) b = v; }); d[c] = b; if (b > mx[ty]) mx[ty] = b; }
  for (const c in sp.svcRoom) { const ty = sp.svcRoom[c]; if (ty) t[c] = st[ty] + .64 * d[c] / mx[ty]; }
  PX.TK.forEach(ty => pts[ty].forEach(p => o.src.push({x: p.x, y: p.y, at: st[ty]}))); o.cap = 'Nace en cada ATM, caja y mesa · se llena con la demanda'; o.D = 2000;
 } else if (kk === 'priv') { // un anillo por asiento o ventanilla, solo hasta donde hay vista; se apaga a los 8 m, como la métrica
  const tp = pxTyKey(k) !== k ? S.px.type : 'all', ps = tp === 'E' ? sp.atms : tp === 'T' ? sp.tells : tp === 'A' ? sp.seats : sp.seats.concat(sp.tells);
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
 const ty = pxTyKey(k) !== k ? S.px.type : null;
 if (ty) { const Tn = PX.TYPES[ty].n, sv = {E: 'el ATM', T: 'la caja', A: 'la asesoría'}[ty];
  o.cap = `Cliente ${Tn} · ` + ({orient: `su recorrido, de la puerta a ${sv}`, espera: `nace en ${sv} · se llena con su demanda`,
   priv: {E: 'quién alcanza a ver la pantalla del ATM', T: 'quién alcanza a ver la ventanilla', A: 'quién alcanza a ver la mesa de asesoría'}[ty],
   seg: 'lo que ve el personal en su recorrido y su zona', amb: 'la luz natural en su zona'}[kk] || o.cap); }
 return (r._org[ck] = o); }

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
 // la geometría sale de la imagen del campo: en planta va de 0,0 a F.W×F.H; en 3D lleva la matriz que la acuesta sobre el piso de la maqueta
 const gx = img.getAttribute('x') || 0, gy = img.getAttribute('y') || 0, gw = img.getAttribute('width'), gh = img.getAttribute('height'), gt = img.getAttribute('transform');
 const fo = el('foreignObject', {x: gx, y: gy, width: gw, height: gh, transform: gt, style: 'pointer-events:none'}); img.after(fo);
 const box = document.createElement('div'); box.style.cssText = 'position:relative;width:100%;height:100%'; fo.appendChild(box);
 let old = oldHref ? el('image', {href: oldHref, x: gx, y: gy, width: gw, height: gh, transform: gt, preserveAspectRatio: 'none', style: 'pointer-events:none'}) : null; if (old) img.after(old);
 const g = el('g', {style: 'pointer-events:none', transform: gt}, svg); // pulsos, radares y destellos van en coordenadas de planta: en 3D, sobre el piso
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
function renderViewport() { if (S.px) { pxStop('vp'); pxStop('vp3'); } renderViewportBase(); if (!S.px || !S.res) return;
 const f = S.focus, r = S.res, key = f.type === 'pillar' && isTh(f.k) ? pxTyKey(f.k) : f.type === 'rel' ? 'rel:' + f.k : null;
 // cada vista abierta (planta, 3D o las dos en «Dividida») tiene su propia imagen del campo y su propia animación
 const vs = [...document.querySelectorAll('#vbody .vp svg.plan')].map(svg => { const d3 = !!svg._img3, img = d3 ? svg._img3 : svg.querySelector('image'); return img ? {svg, img, d3, slot: d3 ? 'vp3' : 'vp'} : null; }).filter(Boolean);
 const changed = S.px.animFor !== r || S.px.animK !== key, same = S.px.animFor === r, prev = S.px.lastHrefs || {}; S.px.animFor = r; S.px.animK = key; S.px.lastHrefs = {}; vs.forEach(v => { S.px.lastHrefs[v.slot] = v.img.getAttribute('href'); });
 if (!changed || !key || !vs.length || !S.lay.heat || PXREDUCE.matches || document.hidden || $('dg').classList.contains('on')) return;
 if (!r._sp) pxNow(); vs.forEach(v => { const old = same ? prev[v.slot] || null : null; if (f.type === 'rel') pxPlayRel(v.slot, r, f.k, v.svg, v.img, old); else pxPlayTheme(v.slot, r, f.k, v.svg, v.img, old); }); }
// presentación: cada slide con planta (pilar o relación) cuenta cómo nace su mapa
function drawSlide() { if (S.px) pxStop('pres'); drawSlideBase(); const it = deck()[pIdx]; if (!it || (it.type !== 'pillar' && it.type !== 'rel') || PXREDUCE.matches || !S.lay.heat) return;
 const svg = $('pplan'), img = svg && svg.querySelector('image'); if (!img) return;
 const f0 = S.focus, th0 = S.thr; S.focus = {type: it.type, k: it.k}; if (it.type === 'rel') S.thr = thrFor(it.k);
 try { if (!S.res._sp) pxNow(); if (it.type === 'rel') pxPlayRel('pres', S.res, it.k, svg, img, null); else pxPlayTheme('pres', S.res, it.k, svg, img, null); } finally { S.focus = f0; S.thr = th0; } }

function renderLegend() { renderLegendBase(); if (!(S.focus.type === 'pillar' && isTh(S.focus.k))) return; const t = PX.TH[S.focus.k], l = document.querySelector('#vlegend .scale-l');
 if (l) l.innerHTML = `<span>${t.lo}</span><span>${t.hi}</span>`;
 const u = document.querySelector('#vlegend .unit'); if (u) { u.textContent = pxUnit(t); u.title = pxUnit(t); } }

function renderDigest() { const box = $('dg'); if (!box.classList.contains('on')) return; if (!S.res) { renderDigestBase(); return; }
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

/* ===================== bucle y arranque ===================== */
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches; let last = performance.now();
function loop(t) { const dt = Math.min(.05, (t - last) / 1000); last = t; if (!reduce) S.t += dt; P.forEach(p => { const v = score(p.k) || 0; S.ds[p.k] = reduce ? v : S.ds[p.k] + (v - S.ds[p.k]) * .08; }); if (S.left === 'senses') updateInst(); requestAnimationFrame(loop); }
buildInst(); renderLevels(); renderAll();
const hp = new URLSearchParams(location.hash.slice(1));
if (hp.get('bg')) setBg(hp.get('bg')); if (hp.get('theme')) setTheme(hp.get('theme'));
let embedded = null;
try { embedded = JSON.parse($('space-model-data').textContent); } catch (e) { toast('Los datos incrustados no se pudieron leer'); }
if (hp.get('cell') && +hp.get('cell') >= .1 && +hp.get('cell') <= 1) { S.cell = +(+hp.get('cell')).toFixed(2); const pb = document.querySelector('#px-cb'); if (pb && ![.5, 1].includes(S.cell)) { pb.textContent = `Personalizado · ${S.cell} m`; document.querySelectorAll('#cells button').forEach(x => x.setAttribute('aria-pressed', x === pb)); } else document.querySelectorAll('#cells button[data-c]').forEach(x => x.setAttribute('aria-pressed', +x.dataset.c === S.cell)); } // #cell=0.2: abre con esa retícula (el video se graba a 0.2 m)
if (embedded) { window.SA_HAS_SAMPLE = false; addModels(embedded, 'exportación de Revit'); }
else if (!hp.get('vacio')) loadSample();   // #vacio=1 abre el estado vacío (Abrir space-model.json)
if (hp.get('view')) setView(hp.get('view'));
if (hp.get('left')) setLeft(hp.get('left'));
window.SA = {S, openDigest, focus, setLeft, setView, showPath, showMark, openFam, present, createRel, runAnalysis}; // para pruebas y capturas
requestAnimationFrame(loop);
})();
