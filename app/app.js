/* Space Analytics · la app: instrumento, visor, inspector, familias, presentar y paleta, sobre el motor (engine.js). */
(function () {
'use strict';
const E = window.SAEngine, STAGES = E.STAGES, SC = 20; // unidades de dibujo por metro

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
const S = {stage:-1,bez:0,bezT:0,w:{flujo:.7,visib:.6,seg:.8,conf:.9,sust:.75},inc:{flujo:true,visib:true,seg:true,conf:true,sust:true},ds:{flujo:0,visib:0,seg:0,conf:0,sust:0},
 rels:new Set(['flujo|conf','visib|seg']),focus:{type:'pillar',k:'seg'},link:false,linkFirst:null,t:0,view:'plan',cell:0.5,min:0,thr:.65,vals:false,
 selFam:new Set(),iso:false,hlRooms:[],undo:[],famCur:null,famQ:'',famCat:'Todas',famSort:'fam',famDir:1,
 models:{},level:null,cache:{},res:null,path:null,mark:null,zoom:null,busy:false,again:false,warnOpen:false,thrBy:{},thrUser:{},
 rot:0,cam3:{k:1,x:0,y:0}, // 3D: giro en grados y cámara (acercamiento y desplazamiento)
 stack:false,gap:1,bld:null,broute:null}; // 3D con todos los niveles (gap = separación entre ellos, 1 = automática) y rutas del edificio
const $ = id => document.getElementById(id);
const NS = 'http://www.w3.org/2000/svg';
function el(tag, a = {}, p) { const e = document.createElementNS(NS, tag); for (const k in a) e.setAttribute(k, a[k]); p && p.appendChild(e); return e; }
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
const cur = () => S.models[S.stage] || null;
function levelFor(model) { const ls = E.levelsOf(model); return ls.find(L => L.name === S.level) || ls[0] || model.levels[0]; }
const cacheKey = (st, lv, cell) => `${st}|${lv}|${cell}`;
function resultSync(st) {
  const m = S.models[st]; if (!m) return null;
  const L = levelFor(m.model); if (!L) return null;
  const k = cacheKey(st, L.id, S.cell);
  if (!S.cache[k]) { try { S.cache[k] = E.analyze(m.model, L.id, {cell: S.cell}); } catch (e) { return null; } }
  return S.cache[k];
}
function prevRes() { for (let i = S.stage - 1; i >= 0; i--) if (S.models[i]) return resultSync(i); return null; }
/** El edificio de la etapa actual: todos sus niveles analizados (de la caché) unidos por escaleras, rampas y elevadores. */
function bld() { const m = cur(); if (!m) return null;
 const results = {};
 E.levelsOf(m.model).forEach(L => { const k = cacheKey(S.stage, L.id, S.cell); if (!S.cache[k]) { try { S.cache[k] = E.analyze(m.model, L.id, {cell: S.cell}); } catch (e) { return; } } results[L.id] = S.cache[k]; });
 const key = `${S.stage}|${S.cell}`, b = S.bld;
 if (b && b.key === key && b.levels.length === Object.keys(results).length && b.levels.every(L => results[L.id] === L.res)) return b;
 return (S.bld = Object.assign(E.building(m.model, {results, cell: S.cell}), {key})); }
const bldNow = () => S.bld && S.bld.key === `${S.stage}|${S.cell}` ? S.bld : null; // sin calcular nada
const bRoute = () => S.broute && bldNow() && S.broute.key === S.bld.key ? S.broute : null;
const multiLevel = () => !!cur() && E.levelsOf(cur().model).length > 1;
const allWarnings = () => S.res ? S.res.warnings.concat(bldNow() ? S.bld.warnings : []) : [];
function prevStageName() { for (let i = S.stage - 1; i >= 0; i--) if (S.models[i]) return STAGES[i]; return null; }

function addModels(json, from) {
  const {models, warnings} = E.load(json);
  warnings.forEach(w => toast('Archivo ignorado', w));
  let last = -1;
  models.forEach(m => {
    const st = STAGES.indexOf(m.source.stage);
    if (S.models[st]) Object.keys(S.cache).forEach(k => { if (k.indexOf(st + '|') === 0) delete S.cache[k]; });
    S.models[st] = {model: m, from};
    last = Math.max(last, st);
  });
  if (last < 0) return false;
  setStage(last, false, true);
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

/** Corre el análisis del nivel y la etapa actuales; con animación de respiración si no está en caché.
 *  Si ya hay uno corriendo, deja el pedido pendiente: al terminar se vuelve a correr con el nivel, la celda y la etapa de ese momento. */
function runAnalysis(force) {
  const m = cur(); if (!m) return;
  if (S.busy) { S.again = true; return; }
  const L = levelFor(m.model); if (!L) { toast('El modelo no tiene niveles'); return; }
  S.level = L.name;
  const k = cacheKey(S.stage, L.id, S.cell);
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
  if (h.get('present')) present();
}
function updateTop() {
  const m = cur();
  $('projsub').textContent = m ? `${m.model.source.file || m.from || 'modelo'} · ${S.res ? S.res.level.name : ''} · Revit ${m.model.source.version || ''}` : 'Sin modelo · arrastra un space-model.json';
  $('stagepill').innerHTML = m ? `ETAPA <b>${STAGES[S.stage].toUpperCase()}</b>` : 'ETAPA <b class="none">—</b>';
}
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
 GI.stageT = STAGES.map((st, i) => { const t = el('text', {'text-anchor': 'middle', 'dominant-baseline': 'middle', class: 't-mono', style: 'cursor:pointer'}, GI.bez); t.textContent = st.toUpperCase(); t.addEventListener('click', e => { e.stopPropagation(); setStage(i); }); return t; });
 const hit = el('circle', {cx: C, cy: C, r: 244, fill: 'none', stroke: 'transparent', 'stroke-width': 26, style: 'cursor:grab', 'pointer-events': 'stroke'}, s); el('title', {}, hit).textContent = 'Bisel de etapas · gira o toca una etiqueta';
 el('path', {d: `M${C - 7} -12 L${C + 7} -12 L${C} -1 Z`, fill: 'var(--ink)'}, s);
 bezelDrag(hit);
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
 GI.bez.setAttribute('transform', `rotate(${S.bez} ${C} ${C})`);
 GI.stageT.forEach((t, i) => { const a = -90 + i * 90, abs = ((a + S.bez) % 360 + 360) % 360, flip = abs > 0 && abs < 180 ? 180 : 0, [x, y] = polar(C, C, 251, a); t.setAttribute('x', x); t.setAttribute('y', y); t.setAttribute('transform', `rotate(${a + 90 + flip} ${x} ${y})`); t.style.fill = i === S.stage ? 'var(--ink)' : ''; t.style.opacity = S.models[i] ? 1 : .35; });
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
function bezelDrag(hit) { let on = false, a0 = 0, b0 = 0, lt = 0; const s = $('inst');
 hit.addEventListener('pointerdown', e => { on = true; hit.setPointerCapture(e.pointerId); const pt = svgPt(s, e); a0 = Math.atan2(pt.y - C, pt.x - C) * 180 / Math.PI; b0 = S.bez; });
 hit.addEventListener('pointermove', e => { if (!on) return; const pt = svgPt(s, e); let d = Math.atan2(pt.y - C, pt.x - C) * 180 / Math.PI - a0; if (d > 180) d -= 360; if (d < -180) d += 360; S.bez = S.bezT = b0 + d; const tk = Math.round(S.bez / 6); if (tk !== lt) { lt = tk; Snd.click(); } });
 hit.addEventListener('pointerup', () => { if (!on) return; on = false; setStage(((Math.round(-S.bez / 90) % 4) + 4) % 4); }); }
/** Cambia de etapa: cada etapa es una exportación de Revit; sin exportación, el bisel regresa. */
function setStage(i, quiet, force) { i = (i + 4) % 4;
 const snap = j => { let t = -j * 90; while (t - S.bez > 180) t -= 360; while (t - S.bez < -180) t += 360; S.bezT = t; };
 if (!S.models[i]) { snap(S.stage < 0 ? 0 : S.stage); Snd.tick(); toast(`Sin exportación de ${STAGES[i]}`, 'en Revit: Space Analytics → Exportar con esa etapa'); return; }
 snap(i); const prev = S.stage; S.stage = i; updateTop();
 if (prev !== i || force) { if (!quiet) Snd.tone([392, 440, 523.25, 587.33][i], 1.6, .05); runAnalysis(); } else Snd.tick(); }
function stepStage(d) { for (let k = 1; k <= 4; k++) { const j = ((S.stage + d * k) % 4 + 4) % 4; if (S.models[j]) { setStage(j); return; } } toast('Solo hay una etapa cargada', 'carga otra exportación para comparar'); }
function listen() { if (!S.res) { toast('Primero carga un modelo'); return; } Snd.on = true; $('snd').setAttribute('aria-pressed', 'true'); P.filter(p => live(p.k)).forEach((p, i) => setTimeout(() => Snd.tone(p.f, 2.6, .03 + .06 * S.w[p.k], Math.max(0, p.target - score(p.k)) * 6), i * 140));
 const w = P.filter(p => live(p.k)).sort((a, b) => (score(a.k) - a.target) * S.w[a.k] - (score(b.k) - b.target) * S.w[b.k])[0]; if (w && score(w.k) < w.target) toast(`Suena tenso en ${w.s}`, `${score(w.k)} vs meta ${w.target}`, {label: 'Ver', run: () => focus('pillar', w.k)}); else toast('El espacio suena afinado'); }

function renderMixer() { $('mixer').innerHTML = `<div class="mhead"><span></span><span>PILAR</span><span>PTS</span><span>META</span><span>PESO</span><span title="Incluir en índice">IX</span></div>` + P.map(p => { const on = (S.focus.type === 'pillar' && S.focus.k === p.k), sc = score(p.k);
  return `<div class="mrow ${on ? 'on' : ''}" data-k="${p.k}"><span class="d" style="background:${p.c1}"></span><span>${p.s}</span><span class="v ${sc == null ? 'na' : ''}" title="${sc == null ? 'Sin datos en este modelo' : ''}">${sc == null ? '—' : sc}</span><span class="t">${p.target}</span><span class="step"><button data-w="-" aria-label="Menos peso">−</button><span>${Math.round(S.w[p.k] * 100)}%</span><button data-w="+" aria-label="Más peso">+</button></span><input type="checkbox" ${S.inc[p.k] ? 'checked' : ''} aria-label="Incluir ${p.s} en el índice" title="Incluir en índice"></div>`; }).join('');
 $('mixer').querySelectorAll('.mrow').forEach(r => { const k = r.dataset.k;
  r.addEventListener('click', e => { if (e.target.closest('button,input')) return; focus('pillar', k); });
  r.querySelectorAll('[data-w]').forEach(b => b.onclick = () => bumpW(k, b.dataset.w === '+' ? .05 : -.05));
  r.querySelector('input').onchange = e => { snapshot(`índice ${BY[k].s}`); S.inc[k] = e.target.checked; renderAll(); toast(`${BY[k].s} ${S.inc[k] ? 'incluido en' : 'excluido del'} índice`, '', {label: 'Deshacer', run: undo}); }; }); }

/* ===================== VIEWPORT: planta ===================== */
const X = x => (x - F.x0) * SC, Y = y => (F.y1 - y) * SC;
const pts = list => list.map(p => X(p[0]).toFixed(1) + ',' + Y(p[1]).toFixed(1)).join(' ');
const wallsById = () => { const o = {}; S.res.sel.walls.forEach(w => { o[w.id] = w; }); return o; };
function css(v) { return getComputedStyle(document.documentElement).getPropertyValue(v).trim(); }
/** El campo enfocado de un nivel como imagen (una celda = k px); r = el resultado del nivel. */
function heatImage(r = S.res) {
 const G = r.G, k = Math.max(3, Math.min(24, Math.floor(2400 / Math.max(G.nx, G.ny))));
 const cv = document.createElement('canvas'); cv.width = G.nx * k; cv.height = G.ny * k; const x = cv.getContext('2d');
 const line = css('--line'), ink = css('--ink'), col = focusColor(), dim = S.iso && S.selFam.size ? .35 : 1, rel = S.focus.type === 'rel';
 const round = (px, py, w, h, r) => { if (!r || !x.roundRect) { x.fillRect(px, py, w, h); return; } x.beginPath(); x.roundRect(px, py, w, h, r); x.fill(); };
 x.textAlign = 'center'; x.textBaseline = 'middle'; x.font = `500 ${Math.round(k * .3)}px "JetBrains Mono", monospace`;
 for (let j = 0; j < G.ny; j++) for (let i = 0; i < G.nx; i++) {
  const c = j * G.nx + i; if (!G.inside[c]) continue; const px = i * k, py = (G.ny - 1 - j) * k;
  if (k >= 6) { x.strokeStyle = line; x.lineWidth = 1; x.strokeRect(px + .5, py + .5, k - 1, k - 1); }
  if (!G.free[c]) continue;
  const v = valueAt(c, r);
  if (S.mark === 'blind' && G.watch.length && G.seen[c] === 0 || S.mark === 'unreach' && !isFinite(G.dEnt[c])) { x.strokeStyle = ink; x.setLineDash([2, 2]); x.lineWidth = 1.2; x.strokeRect(px + 1.5, py + 1.5, k - 3, k - 3); x.setLineDash([]); }
  if (isNaN(v) || v < S.min) continue;
  const cls = Math.min(4, Math.floor(v * 5));
  if (cls > 0 || v > .05) { x.globalAlpha = OPAC[cls] * dim; x.fillStyle = col; round(px + 1, py + 1, k - 2, k - 2, k >= 8 ? 1.5 : 0); x.globalAlpha = 1; }
  if (rel && v >= S.thr) { x.strokeStyle = '#D42A3C'; x.lineWidth = Math.max(1, k / 9); x.strokeRect(px + 1.5, py + 1.5, k - 3, k - 3); }
  if (S.vals && k >= 18) { x.fillStyle = ink; x.globalAlpha = .7; x.fillText(v.toFixed(1), px + k / 2, py + k / 2 + .5); x.globalAlpha = 1; }
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
 s.obstacles.forEach(o => { const pl = E.plantOf(r.model, o); if (pl) { drawPlant(w, pl, o.id); return; }
  el('polygon', {points: pts(o.footprint), class: 'furn', style: o.category === 'Columns' ? 'fill:var(--wall);fill-opacity:.55' : ''}, w); });
 // puestos de personal y accesos
 const showWatch = S.focus.k.indexOf('seg') >= 0;
 if (showWatch) G.watch.forEach(p => { const [x, y] = G.xy(p.c); el('circle', {cx: X(x), cy: Y(y), r: 4.2, class: 'pin', stroke: BY.seg.c1}, w); el('circle', {cx: X(x), cy: Y(y), r: 1.6, fill: BY.seg.c1}, w); });
 G.entrances.forEach(e => { const [x, y] = G.xy(e.c); el('path', {d: `M${X(x) - 5} ${Y(y) + 4} L${X(x)} ${Y(y) - 4} L${X(x) + 5} ${Y(y) + 4}`, fill: 'none', stroke: 'var(--ink)', 'stroke-width': 1.6, 'stroke-linecap': 'round', 'stroke-linejoin': 'round'}, w); });
 // rutas
 if (S.path && G.paths[S.path]) { const ps = G.paths[S.path].cells.map(c => G.xy(c)), col = S.path === 'cash' ? BY.seg.c1 : BY.flujo.c1;
  el('polyline', {points: pts(ps), class: 'route', stroke: 'var(--floor)', 'stroke-width': 6}, w); el('polyline', {points: pts(ps), class: 'route flow', stroke: col}, w);
  [ps[0], ps[ps.length - 1]].forEach(p => el('circle', {cx: X(p[0]), cy: Y(p[1]), r: 4.5, fill: col, stroke: 'var(--floor)', 'stroke-width': 1.5}, w)); }
 const br = bRoute(); if (br) planRouteLegs(w, br);
 // etiquetas
 s.rooms.forEach(rm => { const [cx, cy] = E.ringCentroid(rm.outline[0]); const t = el('text', {x: X(cx), y: Y(cy), 'text-anchor': 'middle', class: 'lbl'}, svg); t.textContent = rm.name || rm.number; });
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
  if (drag) { const dx = e.clientX - drag.x, dy = e.clientY - drag.y; if (Math.hypot(dx, dy) > 4) drag.moved = true; if (drag.moved) { const k = svg._vb[2] / svg.clientWidth; S.zoom = [drag.vb[0] - dx * k, drag.vb[1] - dy * k, drag.vb[2], drag.vb[3]]; svg.setAttribute('viewBox', S.zoom.join(' ')); svg._vb = S.zoom; } return; }
  const pt = svgPt(svg, e), x = F.x0 + pt.x / SC, y = F.y1 - pt.y / SC, c = cellOf(x, y), G = S.res.G;
  if (c < 0 || !G.inside[c]) { tip.style.opacity = 0; svg._probe.setAttribute('opacity', 0); svg.style.cursor = 'grab'; return; }
  const i = c % G.nx, j = (c - i) / G.nx, cs = G.cell * SC;
  svg._probe.setAttribute('transform', `translate(${i * cs + cs / 2},${(G.ny - 1 - j) * cs + cs / 2})`); svg._probe.setAttribute('opacity', .8);
  const rm = G.room[c] >= 0 ? S.res.sel.rooms[G.room[c]] : null, hit = hitElement(x, y), ty = hit && S.res.model.types[hit.type];
  const ks = S.focus.type === 'rel' ? S.focus.k.split('|') : [S.focus.k];
  tip.innerHTML = `<div><b>${esc(rm ? rm.name : 'sin room')}</b><span class="muted">${fmt(x, 1)}, ${fmt(y, 1)} m</span></div>` +
   (G.free[c] ? ks.map(k => `<div><span style="color:${BY[k].c1}">● ${BY[k].s}</span><span>${isNaN(S.res.fields[k][c]) ? '—' : S.res.fields[k][c].toFixed(2)} <span class="muted">${rawLine(k, c)}</span></span></div>`).join('') + (S.focus.type === 'rel' ? `<div><span style="color:#D42A3C">● cruce</span><span>${isNaN(valueAt(c)) ? '—' : valueAt(c).toFixed(2)}</span></div>` : '') : '<div class="muted">ocupado (muro, columna o mueble)</div>') +
   (ty ? `<div style="margin-top:4px"><span style="color:var(--sel)">▣ ${esc(ty.family)} · ${esc(ty.name)}</span><span class="muted">clic = propiedades</span></div>` : '');
  const host = svg.closest('.panel').getBoundingClientRect(); let px = e.clientX - host.left + 14, py = e.clientY - host.top + 14; if (px > host.width - 260) px -= 280; tip.style.left = px + 'px'; tip.style.top = py + 'px'; tip.style.opacity = 1; svg.style.cursor = ty ? 'pointer' : 'crosshair'; });
 svg.addEventListener('pointerleave', () => { tip.style.opacity = 0; svg._probe.setAttribute('opacity', 0); });
 svg.addEventListener('pointerdown', e => { drag = {x: e.clientX, y: e.clientY, vb: svg._vb.slice(), moved: false}; svg.setPointerCapture(e.pointerId); });
 svg.addEventListener('pointerup', e => { const d = drag; drag = null; if (!d || d.moved) return;
  const pt = svgPt(svg, e), x = F.x0 + pt.x / SC, y = F.y1 - pt.y / SC, hit = hitElement(x, y);
  if (hit && S.res.model.types[hit.type]) { openFam(hit.type); return; }
  const c = cellOf(x, y), k = c >= 0 ? S.res.G.room[c] : -1; if (k >= 0) roomClick(k); });
 svg.addEventListener('wheel', e => { e.preventDefault(); const pt = svgPt(svg, e), vb = svg._vb, f = e.deltaY > 0 ? 1.15 : 1 / 1.15, w = Math.min(F.W * 3, Math.max(F.W / 12, vb[2] * f)), h = vb[3] * w / vb[2];
  S.zoom = [pt.x - (pt.x - vb[0]) * w / vb[2], pt.y - (pt.y - vb[1]) * h / vb[3], w, h]; svg.setAttribute('viewBox', S.zoom.join(' ')); svg._vb = S.zoom; }, {passive: false});
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
 svg.setAttribute('viewBox', axoBox(layers[layers.length - 1].z).join(' '));
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
 el('image', {href: heat[id] || (heat[id] = heatImage(r)), x: X(G.ox), y: Y(G.oy + G.ny * G.cell), width: G.nx * G.cell * SC, height: G.ny * G.cell * SC, preserveAspectRatio: 'none', transform: `matrix(${o1[0] - o0[0]} ${o1[1] - o0[1]} ${o2[0] - o0[0]} ${o2[1] - o0[1]} ${o0[0]} ${o0[1]})`}, g);
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
 s.obstacles.forEach(o => { const pl = E.plantOf(r.model, o); if (pl) { items.push({d: DEPTH(X(pl.x), Y(pl.y)), draw: () => drawPlant3D(g, pl, o.id, hOf(o.z[1]), st.has(o.type))}); return; }
  const H = hOf(o.z[1]), fp = o.footprint.map(p => [X(p[0]), Y(p[1])]), cx = fp.reduce((a, p) => a + DEPTH(p[0], p[1]), 0) / fp.length, sel = st.has(o.type);
  items.push({d: cx, draw: () => {
   const edges = fp.map((p, i) => [p, fp[(i + 1) % fp.length]]).sort((u, v) => (DEPTH(u[0][0], u[0][1]) + DEPTH(u[1][0], u[1][1])) - (DEPTH(v[0][0], v[0][1]) + DEPTH(v[1][0], v[1][1])));
   edges.forEach(([p, q]) => el('polygon', {points: quad([[p[0], p[1], 0], [q[0], q[1], 0], [q[0], q[1], H], [p[0], p[1], H]]), fill: o.category === 'Columns' ? 'var(--line-2)' : 'var(--line)', stroke: 'var(--wall)', 'stroke-width': .35}, g));
   el('polygon', {points: quad(fp.map(p => [p[0], p[1], H])), fill: 'var(--surface-2)', stroke: 'var(--wall)', 'stroke-width': .5, class: sel ? 'selshape' : ''}, g); }}); });
 items.sort((a, b) => a.d - b.d).forEach(it => it.draw());
 if (Ly.cur && S.path && G.paths[S.path]) { const ps = G.paths[S.path].cells.map(c => G.xy(c)); el('polyline', {points: ps.map(p => ISO(X(p[0]), Y(p[1]), 2).map(v => v.toFixed(1)).join(',')).join(' '), class: 'route flow', stroke: S.path === 'cash' ? BY.seg.c1 : BY.flujo.c1}, g); }
 if (Ly.cur) s.rooms.forEach(rm => { const [cx, cy] = E.ringCentroid(rm.outline[0]); const [x, y] = ISO(X(cx), Y(cy), 0); const t = el('text', {x, y, 'text-anchor': 'middle', class: 'lbl'}, g); t.textContent = rm.name || rm.number; });
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
function renderViewport() { const vb = $('vbody'); vb.className = 'vbody' + (S.view === 'split' ? ' split' : ''); vb.innerHTML = '';
 if (!S.res) { renderEmpty(vb); $('vlegend').innerHTML = ''; renderSelChip(); return; }
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
 renderLegend(); renderSelChip(); }
function renderEmpty(vb) {
 const d = document.createElement('div'); d.className = 'drop'; d.id = 'drop';
 d.innerHTML = `<div><svg width="54" height="54" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.2" style="opacity:.6"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M9 3v18M15 3v18M3 15h18"/></svg>
  <h3>Trae un modelo de Revit</h3><p>En Revit: pestaña <b>Space Analytics → Exportar</b>. Abre el <b>.html</b> que genera o arrastra aquí uno o varios <b>.json</b> (uno por etapa).</p>
  <div class="row"><button class="btn" id="e-open">Abrir space-model.json</button>${window.SA_HAS_SAMPLE === false ? '' : '<button class="btn" id="e-sample">Ver sucursal de prueba</button>'}</div></div>`;
 vb.appendChild(d);
 $('e-open').onclick = () => $('file-model').click();
 $('e-sample') && ($('e-sample').onclick = loadSample);
}
function renderLegend() { const col = focusColor(), isRel = S.focus.type === 'rel'; const name = isRel ? R[S.focus.k].n : BY[S.focus.k].name, unit = isRel ? (R[S.focus.k].op === 'conflict' ? `${BY[S.focus.k.split('|')[0]].s} alto × ${BY[S.focus.k.split('|')[1]].s} bajo` : `${S.focus.k.split('|').map(k => BY[k].s).join(' alto × ')} alto`) + ' · borde = sobre umbral' : BY[S.focus.k].unit;
 const G = S.res.G, path = S.path && G.paths[S.path];
 $('vlegend').innerHTML = `<span class="eyebrow">Capa</span><b style="font:500 12.5px Outfit">${name}</b><span class="scale">${OPAC.map(o => `<i style="background:${col};opacity:${o}"></i>`).join('')}</span><span class="scale-l" style="width:148px"><span>0</span><span>.2</span><span>.4</span><span>.6</span><span>.8</span><span>1</span></span><span class="muted mono" style="font-size:10px">${unit}</span><span class="sp"></span>` +
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
 $('selchip').innerHTML = (w ? `<button class="chip wchip" id="warnchip" aria-expanded="${S.warnOpen}" aria-controls="warnpop" title="Ver avisos del análisis">⚠ ${w} aviso${w > 1 ? 's' : ''}</button>${S.warnOpen ? warnPop() : ''} ` : '') + (n ? `<span class="chip sel">${n} familia${n > 1 ? 's' : ''} seleccionada${n > 1 ? 's' : ''}${S.iso ? ' · aisladas' : ''} <button aria-label="Limpiar selección" id="selx">✕</button></span>` : (S.hlRooms.length ? `<span class="chip">${S.hlRooms.length} room${S.hlRooms.length > 1 ? 's' : ''} resaltado${S.hlRooms.length > 1 ? 's' : ''} <button id="roomx">✕</button></span>` : ''));
 $('selx') && ($('selx').onclick = () => { S.selFam.clear(); S.iso = false; renderViewport(); }); $('roomx') && ($('roomx').onclick = () => { S.hlRooms = []; renderViewport(); });
 $('warnchip') && ($('warnchip').onclick = () => { S.warnOpen = S.warnEnter = !S.warnOpen; renderSelChip(); Snd.click(); }); }

/* ===================== INSPECTOR ===================== */
/** Los avisos del análisis: una ventana bajo el botón de avisos, solo cuando se abre. */
function warnPop() { const w = allWarnings(), enter = S.warnEnter; S.warnEnter = false; return w.length ? `<div class="warnpop${enter ? ' enter' : ''}" id="warnpop" role="dialog" aria-label="Avisos del análisis"><div class="eyebrow" style="color:#B07818">Avisos del análisis</div><ul>${w.map(x => `<li>${esc(x)}</li>`).join('')}</ul></div>` : ''; }
/** Flujo entre niveles: qué conecta los niveles y las rutas que los cruzan. */
function levelsCard() {
 const cs = E.connectorsOf(cur().model), n = {}; cs.forEach(c => { n[c.kind] = (n[c.kind] || 0) + Math.max(1, c.levels.length - 1); });
 const NAME = {stair: ['tramo de escalera', 'tramos de escalera'], ramp: ['rampa', 'rampas'], elevator: ['parada de elevador', 'paradas de elevador'], escalator: ['escalera eléctrica', 'escaleras eléctricas']};
 const what = Object.keys(n).map(k => `${n[k]} ${NAME[k][n[k] === 1 ? 0 : 1]}`).join(', ');
 return `<div class="card" style="animation-delay:.12s"><div class="eyebrow" style="margin-bottom:4px">Entre niveles</div>
  <div class="feel" style="font-size:12.5px">${cs.length ? `${what}${cs.some(c => c.derived) ? ', deducidos de rooms de escalera o elevador apilados' : ''}.` : 'Sin escaleras ni elevadores: cada nivel queda aislado. Exporta de nuevo o nombra los rooms "Escalera" o "Elevador".'}</div>
  <div class="relto" style="margin-top:8px"><button class="has" data-broute="far">Ruta más larga del edificio</button><button class="has" data-stack="1">Todos los niveles en 3D</button></div>
  <div class="muted" style="font-size:11px;margin-top:6px">Clic en un room (en la lista o en la planta) para ver su ruta desde el acceso, aunque esté en otro nivel.</div></div>`; }
function renderInspector() { const box = $('insp');
 if (!S.res) { box.innerHTML = `<div><div class="eyebrow">Inspector</div><h2 style="margin-top:4px">Sin modelo</h2><div class="feel" style="margin-top:3px">El análisis se arma con lo que trae el modelo de Revit.</div></div>
  <div class="card"><div class="eyebrow" style="margin-bottom:6px">Qué lee de Revit</div><table>
  <tr><td>Pisos del nivel</td><td class="v">retícula</td></tr><tr><td>Muros</td><td class="v">separan</td></tr><tr><td>Muro cortina y ventanas</td><td class="v">vista afuera</td></tr><tr><td>Puertas</td><td class="v">conectan</td></tr><tr><td>Columnas y muebles</td><td class="v">obstáculos</td></tr><tr><td>Parámetros SA_</td><td class="v">roles y materiales</td></tr></table></div>
  <div class="card insight">Cada exportación lleva su etapa. Carga varias del mismo modelo y gira el bisel para compararlas.</div>`; return; }
 const st = S.stage, pr = prevRes(), pn = prevStageName(); let h = '';
 if (S.focus.type === 'pillar') { const p = BY[S.focus.k], sc = score(p.k), psc = pr && pr.scores[p.k] != null ? Math.round(pr.scores[p.k]) : null, dv = sc != null && psc != null ? sc - psc : null, rooms = roomsBy(p.k), ms = S.res.metrics[p.k], pms = pr ? pr.metrics[p.k] : null;
  h += `<div><div class="eyebrow" style="color:${p.c1}">Pilar · ${p.s}</div><h2 style="margin-top:4px">${p.name}</h2><div class="feel" style="margin-top:3px">“${p.feel}”</div></div>
  <div class="card"><div class="kpi"><div class="n">${sc == null ? '—' : sc}</div><div class="u">/ 100 · META ${p.target}<br>${dv == null ? `<span class="muted">${pn ? 'sin dato en ' + pn.toLowerCase() : 'sin etapa previa'}</span>` : `<span class="${dv >= 0 ? 'up' : 'dn'}">${dv >= 0 ? '▲' : '▼'} ${Math.abs(dv)} vs ${pn.toLowerCase()}</span>`}</div><span class="sp"></span><div class="u" style="text-align:right">PESO<br><span class="step" style="margin-top:3px;width:76px"><button id="iw-">−</button><span>${Math.round(S.w[p.k] * 100)}%</span><button id="iw+">+</button></span></div></div>
   <div class="bar"><div class="f" style="width:${sc || 0}%;background:linear-gradient(90deg,${p.c2},${p.c1})"></div><div class="tg" style="left:${p.target}%"></div></div>${sc == null ? `<div class="feel" style="margin-top:8px;font-size:12px">Sin datos: ${p.k === 'sust' ? 'ningún tipo trae parámetros SA_. Agrégalos en Revit o carga la tabla de Excel en Familias.' : 'falta información en el modelo (ver avisos).'}</div>` : ''}</div>
  <div class="card" style="animation-delay:.05s"><div class="eyebrow" style="margin-bottom:6px">Relacionar con</div><div class="relto">${P.filter(q => q.k !== p.k).map(q => { const rk = key(p.k, q.k), has = S.rels.has(rk); return `<button class="${has ? 'has' : ''}" data-o="${q.k}" title="${R[rk].n}"><i style="background:${q.c1}"></i>${q.s}${has ? ' ✓' : ''}</button>`; }).join('')}</div></div>
  <div class="card" style="animation-delay:.1s"><div class="eyebrow" style="margin-bottom:2px">Métricas · ${STAGES[st].toLowerCase()}</div><table>${ms.map(row => { const now = row[1], prow = pms && pms.find(x => x[0] === row[0]), pre = prow ? prow[1] : null, dd = now != null && pre != null ? now - pre : null, good = row[4] ? dd >= 0 : dd <= 0, z = dd == null || Math.abs(dd) < Math.pow(10, -row[3]) / 2;
    return `<tr><td>${row[0]}<small>${esc(row[5])}</small></td><td class="v">${fmt(now, row[3])} ${row[2]}</td><td class="d ${z ? '' : good ? 'up' : 'dn'}">${z ? '·' : (dd > 0 ? '+' : '−') + fmt(Math.abs(dd), row[3])}</td></tr>`; }).join('')}</table>
   ${p.k === 'flujo' ? `<div class="relto" style="margin-top:8px"><button class="has" data-path="farthest">Ver ruta más lejana</button><button class="has" data-path="cash">Ver ruta de efectivo</button><button class="has" data-mark="unreach">Áreas inaccesibles</button></div>` : ''}
   ${p.k === 'seg' ? `<div class="relto" style="margin-top:8px"><button class="has" data-mark="blind">Ver puntos ciegos</button><button class="has" data-path="cash">Ruta de efectivo</button></div>` : ''}</div>
  ${p.k === 'flujo' && multiLevel() ? levelsCard() : ''}
  ${rooms.length ? `<div class="card" style="animation-delay:.15s"><div style="display:flex;justify-content:space-between"><div class="eyebrow">Rooms · peor a mejor</div><span class="mono muted" style="font-size:9.5px">media de celdas</span></div><div class="rooms" style="margin-top:6px">${rooms.slice(0, 8).map(r => `<div class="room-r" data-r="${r.k}"><span>${esc(r.n)}</span><span class="mini"><i style="width:${r.v}%;background:${p.c1}"></i></span><span class="v">${r.v}</span></div>`).join('')}</div></div>` : ''}`; }
 else { const r = R[S.focus.k], [a, b] = S.focus.k.split('|'), area = crossArea(), free = S.res.G.freeCount * cellArea(), top = relRooms().slice(0, 3);
  const text = `${fmtA(area)} m² (${fmt(free ? area / free * 100 : 0)} % del área libre) son ${r.d}.` + (top.length ? ` Se concentran en ${top.map(x => `${esc(x.n)} (${fmtA(x.a)} m²)`).join(', ')}.` : '');
  h += `<div><div class="eyebrow" style="color:#D42A3C">Relación · ${BY[a].s} × ${BY[b].s}</div><h2 style="margin-top:4px">${r.n}</h2><div class="feel" style="margin-top:3px">${r.q}</div></div>
  <div class="card"><div class="kpi"><div class="n">${fmtA(area)}<span style="font-size:18px"> m²</span></div><div class="u">SOBRE UMBRAL ${S.thr.toFixed(2)}<br>RETÍCULA ${fmt(S.res.G.cell, 1)} m</div></div></div>
  <div class="card insight" style="animation-delay:.05s;border-left-color:#D42A3C">${text}</div>
  ${top.length ? `<div class="card" style="animation-delay:.08s"><div class="eyebrow" style="margin-bottom:6px">Dónde</div><div class="rooms">${top.map(x => `<div class="room-r" data-r="${x.k}"><span>${esc(x.n)}</span><span class="mini"><i style="width:${Math.min(100, x.a / top[0].a * 100)}%;background:#D42A3C"></i></span><span class="v">${fmtA(x.a)}</span></div>`).join('')}</div></div>` : ''}
  <div class="card" style="animation-delay:.1s"><div class="eyebrow" style="margin-bottom:6px">Acciones sugeridas</div><div class="relto">${r.a.map(x => `<button class="has" style="cursor:default">${x}</button>`).join('')}</div></div>
  <div class="card" style="animation-delay:.15s"><div class="eyebrow" style="margin-bottom:3px">Respaldo</div><div class="feel">${r.src}</div></div>
  <div style="display:flex;gap:6px;flex-wrap:wrap"><button class="btn" id="i-pres">Presentar <kbd>P</kbd></button><button class="btn" id="i-rm">Quitar relación</button></div>`; }
 const v = indexVal();
 h += `<div class="card" style="animation-delay:.2s"><div style="display:flex;justify-content:space-between;align-items:baseline"><div class="eyebrow">Índice ponderado</div><span class="mono" style="font-size:16px">${fmt(v, 1)}</span></div>${P.map(p => { const sc = score(p.k); return `<div class="room-r" data-p="${p.k}" style="grid-template-columns:70px 1fr 26px;opacity:${live(p.k) ? 1 : .4}"><span>${p.s}</span><span class="mini" style="height:7px;overflow:visible"><i style="width:${sc || 0}%;background:${p.c1};border-radius:3px"></i><b style="position:absolute;left:${p.target}%;top:-2px;bottom:-2px;width:2px;background:var(--ink)"></b></span><span class="v">${sc == null ? '—' : sc}</span></div>`; }).join('')}</div>`;
 box.innerHTML = h;
 $('iw-') && ($('iw-').onclick = () => bumpW(S.focus.k, -.05)); $('iw+') && ($('iw+').onclick = () => bumpW(S.focus.k, .05));
 box.querySelectorAll('.relto [data-o]').forEach(b => b.onclick = () => { const rk = key(S.focus.k, b.dataset.o); if (S.rels.has(rk)) focus('rel', rk); else createRel(S.focus.k, b.dataset.o); });
 box.querySelectorAll('[data-r]').forEach(r => r.onclick = () => roomClick(+r.dataset.r));
 box.querySelectorAll('[data-broute]').forEach(b => b.onclick = () => showBuildingRoute('far'));
 box.querySelectorAll('[data-stack]').forEach(b => b.onclick = () => setStack(true));
 box.querySelectorAll('[data-p]').forEach(r => r.onclick = () => focus('pillar', r.dataset.p));
 box.querySelectorAll('[data-path]').forEach(b => b.onclick = () => showPath(b.dataset.path));
 box.querySelectorAll('[data-mark]').forEach(b => b.onclick = () => showMark(b.dataset.mark));
 $('i-pres') && ($('i-pres').onclick = present); $('i-rm') && ($('i-rm').onclick = () => removeRel(S.focus.k)); }
/** Clic en un room: lo resalta; en Flujo además traza su ruta desde el acceso, aunque haya que subir de nivel. */
function roomClick(k) { S.hlRooms = [k]; if (S.focus.type === 'pillar' && S.focus.k === 'flujo') showBuildingRoute('room', k); else { renderViewport(); Snd.click(); } }
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
/** Umbral de una relación: el percentil 80 de sus celdas la primera vez; luego fijo, para comparar etapas con la misma vara. */
function thrFor(rk) {
 if (S.thrBy[rk] == null && S.res) { const [a, b] = rk.split('|'), G = S.res.G, v = [];
  for (let c = 0; c < G.n; c++) if (G.free[c]) { const x = E.crossAt(S.res.fields, a, b, R[rk].op, c); if (!isNaN(x)) v.push(x); }
  v.sort((p, q) => p - q); S.thrBy[rk] = v.length ? Math.max(.1, Math.min(.9, Math.floor(v[Math.floor(.8 * (v.length - 1))] * 20) / 20)) : .5; }
 return S.thrBy[rk] == null ? .5 : S.thrBy[rk]; }
function setThr(d) { const rk = S.focus.k; S.thr = Math.max(.1, Math.min(.9, +(S.thr + d).toFixed(2))); S.thrBy[rk] = S.thr; S.thrUser[rk] = true; renderViewport(); renderInspector(); Snd.click(); }
function focus(type, k) { S.focus = {type, k}; if (type === 'rel') S.thr = thrFor(k); S.hlRooms = []; syncRels(); renderAll(); }
function renderAll() { renderMixer(); renderViewport(); renderInspector(); }

/* ===================== FAMILIAS ===================== */
const UNIT = {Floors: 'kg/m²', Walls: 'kg/m²'};
const table = () => S.res ? S.res.table : [];
function famRows() { const q = E.norm(S.famQ); return table().filter(f => (S.famCat === 'Todas' || f.cat === S.famCat) && E.norm(f.fam + ' ' + f.tipo + ' ' + f.mark + ' ' + f.cat).includes(q)).sort((a, b) => { const x = a[S.famSort], y = b[S.famSort]; if (x == null && y == null) return 0; if (x == null) return 1; if (y == null) return -1; return (typeof x === 'number' ? x - y : String(x).localeCompare(String(y))) * S.famDir; }); }
function renderFam() { if (!S.res) return; const cats = ['Todas', ...new Set(table().map(f => f.cat))];
 $('f-cats').innerHTML = cats.map(c => `<button class="btn" style="height:28px" aria-pressed="${S.famCat === c}" data-c="${esc(c)}">${esc(c)}</button>`).join('');
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
 const j = E.applyTable(m.model, rows); Object.keys(S.cache).forEach(k => { if (k.indexOf(S.stage + '|') === 0) delete S.cache[k]; });
 toast(`Tabla unida por Type Mark · ${name}`, `${j.hit} renglones unidos · ${j.miss} sin coincidencia`); closeFam(); runAnalysis(true); }
function loadTable(file) {
 if (/\.csv$/i.test(file.name)) { const r = new FileReader(); r.onload = () => applyRows(parseCSV(r.result), file.name); r.readAsText(file); return; }
 const go = () => { const r = new FileReader(); r.onload = () => { const wb = window.XLSX.read(r.result, {type: 'array'}); applyRows(window.XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]], {defval: ''}), file.name); }; r.readAsArrayBuffer(file); };
 if (window.XLSX) return go();
 const s = document.createElement('script'); s.src = 'https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js'; s.onload = go; s.onerror = () => toast('No pude cargar el lector de Excel', 'guarda la tabla como .csv y vuelve a intentar'); document.head.appendChild(s); }

/* ===================== presentar ===================== */
let pIdx = 0;
function present() { if (!S.res) { toast('Primero carga un modelo'); return; } const items = [...S.rels].map(k => ({type: 'rel', k})).concat(P.filter(p => score(p.k) != null).map(p => ({type: 'pillar', k: p.k})));
 const i0 = items.findIndex(x => x.type === S.focus.type && x.k === S.focus.k); if (!$('present').classList.contains('on') && i0 >= 0) pIdx = i0; pIdx = (pIdx + items.length) % items.length; const it = items[pIdx];
 const prevFocus = S.focus, prevThr = S.thr; S.focus = it; if (it.type === 'rel') S.thr = thrFor(it.k); let q, big, sub, quote, col;
 if (it.type === 'rel') { const r = R[it.k], top = relRooms()[0]; q = r.q; big = fmtA(crossArea()) + '<span style="font-size:.3em"> m²</span>'; sub = `Celdas ${r.d}${top ? `, sobre todo en ${esc(top.n)}` : ''}.`; quote = r.src; col = '#D42A3C'; }
 else { const p = BY[it.k], m0 = S.res.metrics[p.k].find(m => m[1] != null) || S.res.metrics[p.k][0]; q = p.feel; big = score(p.k) + '<span style="font-size:.3em"> / 100</span>'; sub = `${p.name} · meta ${p.target} · ${m0[0]}: ${fmt(m0[1], m0[3])} ${m0[2]}`; quote = m0[5]; col = p.c1; }
 const Ep = $('present'); Ep.innerHTML = `<div><div class="eyebrow" style="color:${col}">${esc((cur().model.source.file || '').replace(/\.rvt$/i, ''))} · ${STAGES[S.stage]} · ${pIdx + 1} / ${items.length}</div><h1>${q}</h1><div class="big">${big}</div><p class="muted" style="margin-top:12px;max-width:520px;font-size:15px">${sub}</p><blockquote>${esc(quote)}</blockquote></div><div class="vp" style="height:min(62vh,520px)"><svg id="pplan"></svg></div><div class="pnav"><button class="btn" id="pp">←</button><button class="btn" id="pn">→</button><span>Esc para volver</span></div>`;
 drawPlan($('pplan'), {full: true}); S.focus = prevFocus; S.thr = prevThr; Ep.classList.add('on'); $('pp').onclick = () => { pIdx--; present(); }; $('pn').onclick = () => { pIdx++; present(); }; Snd.tone(523.25, 1.8, .04); }
function closePresent() { $('present').classList.remove('on'); }

/* ===================== buscador de cualidades / comandos ===================== */
function commands() { const c = []; const g = (grp, t, run, col = '#999', k = '') => c.push({grp, t, run, c: col, k});
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
  g('Consultas del espacio', 'Rooms bajo meta en Confort', () => { focus('pillar', 'conf'); S.hlRooms = roomsBy('conf').filter(r => r.v < BY.conf.target).map(r => r.k); renderViewport(); toast(`${S.hlRooms.length} rooms bajo meta`, `Confort < ${BY.conf.target}`); }, BY.conf.c1);
  g('Consultas del espacio', 'Celdas con Visibilidad ≥ 0.6', () => { focus('pillar', 'visib'); S.min = .6; $('minv').textContent = '0.6'; renderViewport(); }, BY.visib.c1);
  g('Consultas del espacio', '¿Qué tan privada es la asesoría? · Exposición', () => { if (!S.rels.has('visib|conf')) createRel('visib', 'conf'); else focus('rel', 'visib|conf'); }, BY.conf.c1);
  g('Consultas del espacio', 'Familias con más carbono', () => { S.famSort = 'gwp'; S.famDir = -1; openFam(); }, BY.sust.c1);
  P.forEach((p, i) => g('Pilares', `Enfocar ${p.name}`, () => focus('pillar', p.k), p.c1, String(i + 1)));
  Object.keys(R).forEach(rk => { const [a, b] = rk.split('|'); g('Relaciones', `${S.rels.has(rk) ? 'Ver' : 'Relacionar'} ${BY[a].s} × ${BY[b].s} · ${R[rk].n}`, () => S.rels.has(rk) ? focus('rel', rk) : createRel(a, b), BY[a].c1); });
  S.res.rooms.forEach(r => g('Rooms', `${r.name}${r.number ? ' · ' + r.number : ''}`, () => { S.hlRooms = [r.k]; renderViewport(); }, 'var(--ink)'));
  table().forEach(f => g('Familias', `${f.fam} · ${f.tipo}${f.mark ? ' · ' + f.mark : ''}`, () => openFam(f.id), 'var(--sel)'));
  E.levelsOf(cur().model).forEach(L => g('Niveles', L.name, () => setLevel(L.name), '#8C7BF5'));
  STAGES.forEach((s, i) => { if (S.models[i]) g('Etapas', `Ir a ${s}`, () => setStage(i), '#8C7BF5'); });
  g('Acciones', 'Cargar tabla de Excel por Type Mark', () => $('file-table').click(), BY.sust.c1);
  g('Acciones', 'Re-analizar modelo', () => runAnalysis(true), '#5B9BFF', 'R'); g('Acciones', 'Presentar al cliente', present, '#D42A3C', 'P'); g('Acciones', 'Deshacer', undo, '#999', 'Ctrl Z');
 }
 g('Vista', 'Planta', () => setView('plan')); g('Vista', '3D maqueta blanca', () => setView('axo')); g('Vista', 'Dividida', () => setView('split'));
 g('Vista', 'Fondo neutro', () => setBg('neutral')); g('Vista', 'Fondo con halos', () => setBg('halos'));
 ['aura', 'niebla', 'noche'].forEach(t => g('Vista', `Tema ${t}`, () => setTheme(t)));
 return c; }
let palSel = 0, palItems = [];
function openPal() { $('pal').classList.add('on'); $('pal-in').value = ''; palSel = 0; drawPal(); setTimeout(() => $('pal-in').focus(), 10); Snd.click(); }
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
function loadSample() { if (window.SA_SAMPLE) { addModels(window.SA_SAMPLE, 'sucursal de prueba'); return; }
 const s = document.createElement('script'); s.src = 'samples/sucursal.js'; s.onload = () => addModels(window.SA_SAMPLE, 'sucursal de prueba'); s.onerror = () => toast('No encontré la sucursal de prueba', 'app/samples/sucursal.js'); document.head.appendChild(s); }
document.querySelectorAll('#themes button').forEach(b => b.onclick = () => { setTheme(b.dataset.t); Snd.click(); });
document.querySelectorAll('#bgs button').forEach(b => b.onclick = () => { setBg(b.dataset.b); Snd.click(); });
document.querySelectorAll('#views button').forEach(b => b.onclick = () => setView(b.dataset.v));
document.querySelectorAll('#cells button').forEach(b => b.onclick = () => { S.cell = +b.dataset.c; document.querySelectorAll('#cells button').forEach(x => x.setAttribute('aria-pressed', x === b)); Snd.click(); runAnalysis(); });
$('lvl').onchange = e => setLevel(e.target.value);
$('min-').onclick = () => { S.min = Math.max(0, +(S.min - .2).toFixed(1)); $('minv').textContent = S.min.toFixed(1); renderViewport(); Snd.click(); };
$('min+').onclick = () => { S.min = Math.min(.8, +(S.min + .2).toFixed(1)); $('minv').textContent = S.min.toFixed(1); renderViewport(); Snd.click(); };
$('b-vals').onclick = e => { S.vals = !S.vals; e.currentTarget.setAttribute('aria-pressed', S.vals); renderViewport(); };
$('st-prev').onclick = () => stepStage(-1); $('st-next').onclick = () => stepStage(1);
$('snd').onclick = e => { Snd.on = !Snd.on; e.currentTarget.setAttribute('aria-pressed', Snd.on); };
$('b-open').onclick = () => $('file-model').click();
$('file-model').onchange = e => { readFiles(e.target.files); e.target.value = ''; };
$('file-table').onchange = e => { if (e.target.files[0]) loadTable(e.target.files[0]); e.target.value = ''; };
$('b-pal').onclick = openPal; $('b-fam').onclick = () => openFam(); $('b-run').onclick = () => runAnalysis(true); $('b-pres').onclick = present; $('b-undo').onclick = undo;
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
 if (e.key === 'Escape') { closePresent(); closeFam(); setLink(false); $('anat').classList.remove('on'); return; }
 if ($('present').classList.contains('on')) { if (e.key === 'ArrowRight') { pIdx++; present(); } if (e.key === 'ArrowLeft') { pIdx--; present(); } return; }
 if ($('modal').classList.contains('on') || e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT') return;
 const n = parseInt(e.key); if (n >= 1 && n <= 5) { nodeClick(P[n - 1].k); return; }
 if (k === 'r') runAnalysis(true); if (k === 'p') present(); if (k === 'l') setLink(!S.link); if (k === 'f') openFam(); });

/* ===================== bucle y arranque ===================== */
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches; let last = performance.now();
function loop(t) { const dt = Math.min(.05, (t - last) / 1000); last = t; if (!reduce) S.t += dt; S.bez += (S.bezT - S.bez) * .12; P.forEach(p => { const v = score(p.k) || 0; S.ds[p.k] = reduce ? v : S.ds[p.k] + (v - S.ds[p.k]) * .08; }); updateInst(); requestAnimationFrame(loop); }
buildInst(); renderLevels(); renderAll();
const hp = new URLSearchParams(location.hash.slice(1));
if (hp.get('bg')) setBg(hp.get('bg')); if (hp.get('theme')) setTheme(hp.get('theme'));
let embedded = null;
try { embedded = JSON.parse($('space-model-data').textContent); } catch (e) { toast('Los datos incrustados no se pudieron leer'); }
if (embedded) { window.SA_HAS_SAMPLE = false; addModels(embedded, 'exportación de Revit'); }
else if (hp.get('sample')) loadSample();
if (hp.get('view')) setView(hp.get('view'));
window.SA = {S, focus, setStage, setView, showPath, showMark, openFam, present, createRel, runAnalysis}; // para pruebas y capturas
requestAnimationFrame(loop);
})();
