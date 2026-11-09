# HSBC Space Analytics

Análisis espacial de sucursales sobre modelos de Revit, en una retícula del nivel, en dos modos: **Experiencia** del cliente
(orientación, espera y capacidad, privacidad, seguridad y confort) y **Sustentabilidad** (carbono, circularidad y eficiencia). Las exportaciones de proyectos del cliente no se guardan aquí: el único modelo del repo es una
sucursal de ejemplo, inventada, que sirve para mostrar la app.

**Pruébala en el navegador:** https://gnslac-in-house-tools.github.io/HSBC-space-analytics/ abre la app con la sucursal
de ejemplo ya cargada: de huella irregular (entrada en un nicho, esquina achaflanada, muro oblicuo) y en dos niveles, con ATMs, cajas, salas de asesoría, bóveda y un mezzanine de personal.

```
docs/space-model.md   el contrato entre Revit y la app (space-model.json)
docs/modos.md         los modos Experiencia y Sustentabilidad: qué cambia, cómo nace cada mapa, retícula personalizada
docs/paneles.md       el lenguaje de los paneles laterales
revit/                extensión pyRevit (Revit 2025 y 2027): Space Analytics → Exportar · Abrir   → revit/README.md
app/                  la app web: index.html + engine.js (motor) + indices.js (índices) + app.js (interfaz); sin servidor ni build
app/tests/            pruebas del motor y de los índices, y la sucursal de prueba
```

- **Probar la app sin Revit:** abre `app/index.html`: carga la sucursal de ejemplo (`app/samples/sucursal.js`, que sale de
  `app/tests/fixtures/make-sucursal-completa.js`). No es un modelo real y trae el estándar de parámetros `SA_` completo
  (`docs/parametros-sa.md`): las familias y los rooms dicen qué son por un parámetro, no por su nombre, y calcula los 8 temas.
  `#vacio=1` abre el estado vacío para abrir un `space-model.json`. `?lento=8` hace 8 veces más lentas las animaciones de
  cómo nace cada mapa.
- **Con un modelo:** instala la extensión (`revit/README.md`), abre el modelo (una copia si es 2025 y usas 2027) →
  *Space Analytics → Exportar*. Se abre un `.html` con la app y los datos dentro.
- **Pruebas:** `node --test app/tests/engine.test.js app/tests/indices.test.js` y `python -m pytest revit/tests -q`.
