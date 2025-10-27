# Inventario Sirocco (Plantilla limpia)

## Cómo ejecutar

```bash
npm install
npm run dev
```

- La base de datos se guarda en la carpeta `userData` de Electron (segura para dev y producción).
- Escribe usando IPC seguro (preload + contextBridge).
- `better-sqlite3` síncrono para simplificar escrituras y errores visibles.

## Estructura

```
src/
  main.js        # Proceso main (ventana + IPC)
  preload.js     # API segura para el renderer
  db/db.js       # Capa de acceso a datos
  renderer/
    index.html   # UI
    renderer.js  # Lógica del renderer
assets/
package.json
```

## Puntos clave de "Guardar" que no fallan

- Manejador del botón definido tras `DOMContentLoaded`.
- `await`/síncrono correcto entre renderer -> IPC -> DB.
- Validación de nombre/cantidad con errores visibles en UI.
- Rutas absolutas para la DB (no archivos perdidos en dev/prod).