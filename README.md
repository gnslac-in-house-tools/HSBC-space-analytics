# HSBC Space Analytics

Análisis espacial de sucursales sobre modelos de Revit: flujo, visibilidad, seguridad, confort y sustentabilidad, en una
retícula del nivel. Datos del cliente: este repo es privado y las exportaciones no se guardan aquí.

```
docs/space-model.md   el contrato entre Revit y la app (space-model.json)
revit/                extensión pyRevit (Revit 2025 y 2027): Space Analytics → Exportar · Abrir   → revit/README.md
app/                  la app web: index.html + engine.js (motor) + app.js (interfaz); sin servidor ni build
app/tests/            pruebas del motor (node --test app/tests/engine.test.js) y la sucursal de prueba
```

- **Probar la app sin Revit:** abre `app/index.html` → *Ver sucursal de prueba* (dos etapas, para girar el bisel).
- **Con un modelo:** instala la extensión (`revit/README.md`), abre el modelo (una copia si es 2025 y usas 2027) →
  *Space Analytics → Exportar*. Se abre un `.html` con la app y los datos dentro.
- **Pruebas:** `node --test app/tests/engine.test.js` y `python -m pytest revit/tests -q`.
