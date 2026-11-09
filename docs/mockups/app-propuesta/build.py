"""Arma propuesta.html: la app real (app/) con la propuesta encima, en un solo archivo que abre con doble clic.
python docs/mockups/app-propuesta/build.py"""
import io, os, re
HERE = os.path.dirname(os.path.abspath(__file__)); ROOT = os.path.abspath(os.path.join(HERE, '..', '..', '..')); APP = os.path.join(ROOT, 'app')
rd = lambda p: io.open(p, encoding='utf-8').read()
html, eng, app, sample = rd(os.path.join(APP, 'index.html')), rd(os.path.join(APP, 'engine.js')), rd(os.path.join(APP, 'app.js')), rd(os.path.join(APP, 'samples', 'sucursal.js'))
pe, pu, pc = rd(os.path.join(HERE, 'propuesta-engine.js')), rd(os.path.join(HERE, 'propuesta-ui.js')), rd(os.path.join(HERE, 'propuesta.css'))
def once(s, a, b):
    assert s.count(a) == 1, (s.count(a), a[:80]); return s.replace(a, b)
for f in ['renderBoard', 'renderInspector', 'renderLegend', 'renderDigest', 'renderViewport', 'drawSlide']:
    app = once(app, f'function {f}(', f'function {f}0(')
app = once(app, '/* ===================== bucle y arranque', pu + '\n/* ===================== bucle y arranque')
app = once(app, "else if (!hp.get('vacio')) loadDemo();", "else if (!hp.get('vacio')) loadSample();")
safe = lambda js: js.replace('</script', '<\/script')
html = once(html, '<title>', '<title>Propuesta · ')
html = once(html, '</style>', pc + '\n</style>')
html = once(html, '<script src="engine.js"></script>', '<script>' + safe(eng) + '</script>\n<script>' + safe(pe) + '</script>\n<script>' + safe(sample) + '</script>')
html = once(html, '<script src="app.js"></script>', '<script>' + safe(app) + '</script>')
out = os.path.join(HERE, 'propuesta.html'); io.open(out, 'w', encoding='utf-8').write(html)
print(out, len(html) // 1024, 'KB')
