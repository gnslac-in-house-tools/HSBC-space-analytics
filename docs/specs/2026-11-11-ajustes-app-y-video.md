# Ajustes a la app y al video (comentarios del 11 nov 2026)

Dos fases. Primero la app (se revisa en el navegador y se aprueba); después el video.

## Fase 1 · App

### 1. El tipo de usuario cambia el mapa del viewport (video 0:59)
Hoy el selector de usuario solo cambia puntajes: los campos de Experiencia son iguales para todos.
Con un usuario elegido (Express, Transaccional o Asesoría), cada tema de Experiencia pinta **su** mapa:

| Tema | Todos | Un usuario |
|---|---|---|
| Orientación | lo que se ve desde la entrada | **su recorrido**: corredor de la puerta a su servicio (ATM, caja o asesoría) |
| Espera | ocupación de los tres servicios | solo la zona de su servicio |
| Privacidad | quién ve asesorías y ventanillas | ATM: quién ve la pantalla · Caja: quién ve la ventanilla · Asesoría: quién ve la mesa |
| Seguridad | lo que ve el personal | lo que ve el personal **en su recorrido y su zona** |
| Confort | luz natural en todo el piso | luz natural **en su zona** (la que se califica) |

La animación de nacimiento se repite al cambiar de usuario, para que el cambio se note.

### 2. Circularidad: los muebles al frente (video 1:24)
- En Circularidad, cada **mueble** se pinta con el color del tema según su contenido reciclado (más intenso = más reciclado); lo que no tiene dato va en gris con contorno punteado. Muros y pisos también se tiñen.
- Sección nueva en el inspector, **«Qué es reciclado»**:
  - Filtro por grupo: **Todo · Muebles · Materiales · Acabados** (muebles y equipo / muros, puertas, escalera / pisos).
  - Resumen: % de piezas con contenido reciclado y contenido reciclado promedio del grupo.
  - Lista por familia (piezas · % reciclado), clic = seleccionar esa familia en el viewport.
  - Botones **Seleccionar lo reciclado** y **Aislar**: usan la selección de familias que ya existe.
- Dos métricas de contexto nuevas (no suman puntos): «Muebles con contenido reciclado» y «Contenido reciclado de los muebles».

### Verificación
`node --test app/tests`, servidor local, revisar en el navegador (planta y 3D) con los tres usuarios y los cuatro grupos.

## Fase 2 · Video (después de aprobar la app)
- **0:22** — No decir «qué funciona y qué no». Decir: entender métricas del espacio; ver métricas de referencia para tomar mejores decisiones de diseño.
- **0:59** — Regrabar con el usuario cambiando y el mapa cambiando (Orientación o Privacidad).
- **1:24** — Circularidad con los muebles pintados, el filtro por grupo y «Seleccionar lo reciclado»; la voz dice qué parte de los muebles es reciclada.
- **1:49** — Computer vision explicado para un niño de 5 años: cámaras que cuentan cómo se mueve la gente, cuánto tiempo se queda, dónde se junta y cómo interactúa. Intención (no se dice): que el cliente se dé cuenta de que lo necesita.

## Cambios añadidos (11 nov, tarde)

### App (hechos, pendientes de aprobar)
- **Retícula 0.2 m:** `#cell=0.2` en la dirección abre la app con esa retícula. El video se graba así.
- **Mapas con relieve:** Carbono (carbono cercano a cada celda), Eficiencia (por cuarto, escala provisional, ya no sale en 0) y Espera (carga desigual por servicio; hora pico supuesta 45 clientes/h).
- **Orientación con varios puntos de vista:** entrada + clientes (ATMs y 6 puntos en la espera, rombos azules) + personal.
- **Animación de «cómo nace» también en 3D y en Dividida:** se monta sobre el piso de la maqueta, con su perspectiva (antes quedaba como un rectángulo plano «por fuera» del 3D).
- **Botones de capas del plano:** gris discreto, sin violeta.

### Video
- **Más 3D:** en las animaciones de «cómo nace cada mapa», mostrar la vista **Dividida** (mitad planta, mitad 3D) o el 3D solo; ambas se animan a la vez.
- Grabar siempre con `#cell=0.2`.
- Re-verificar que en la grabación la animación quede vinculada al 3D (el video anterior se grabó con el defecto ya corregido).
