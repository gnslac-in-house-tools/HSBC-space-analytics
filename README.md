# HSBC Space Analytics

Análisis espacial de sucursales sobre modelos de Revit, en una retícula del nivel, en dos modos: **Experiencia** del cliente
(orientación, espera y capacidad, privacidad, seguridad y confort) y **Sustentabilidad** (carbono, circularidad y eficiencia). Las exportaciones de proyectos del cliente no se guardan aquí: el único modelo del repo es el de
muestra de Autodesk.

**Pruébala en el navegador:** https://gnslac-in-house-tools.github.io/HSBC-space-analytics/ abre la app con el modelo
de muestra de Autodesk (`racadvancedsampleproject.rvt`, exportado desde Revit 2027) ya cargado.

```
docs/space-model.md   el contrato entre Revit y la app (space-model.json)
docs/modos.md         los modos Experiencia y Sustentabilidad: qué cambia, cómo nace cada mapa, retícula personalizada
docs/paneles.md       el lenguaje de los paneles laterales
revit/                extensión pyRevit (Revit 2025 y 2027): Space Analytics → Exportar · Abrir   → revit/README.md
app/                  la app web: index.html + engine.js (motor) + indices.js (índices) + app.js (interfaz); sin servidor ni build
app/tests/            pruebas del motor y de los índices, y la sucursal de prueba
```

- **Probar la app sin Revit:** abre `app/index.html`: carga el modelo de muestra (`app/samples/racadvancedsampleproject.js`).
  `#sample=1` abre la sucursal de prueba (la que trae ATMs, cajas y parámetros `SA_`: calcula los 8 temas) y `#vacio=1` el
  estado vacío para abrir un `space-model.json`. `?lento=8` hace 8 veces más lentas las animaciones de cómo nace cada mapa.
- **Con un modelo:** instala la extensión (`revit/README.md`), abre el modelo (una copia si es 2025 y usas 2027) →
  *Space Analytics → Exportar*. Se abre un `.html` con la app y los datos dentro.
- **Pruebas:** `node --test app/tests/engine.test.js app/tests/indices.test.js` y `python -m pytest revit/tests -q`.
