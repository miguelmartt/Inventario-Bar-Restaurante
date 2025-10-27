#  Inventario para pubs/restaurantes/cafeterias

Aplicación de escritorio moderna para la **gestión de inventario, productos y ventas** en bares, restaurantes y pubs.  
Basada en **Electron**, **Node.js** y **SQLite**, combina una arquitectura segura con una interfaz limpia y modular.

---

## Características principales

- Control de inventario en tiempo real  
- Registro de ventas y control de caja  
- Reportes detallados  
- Arquitectura escalable y segura (IPC + contextBridge)  
- Persistencia de datos con **better-sqlite3**  
- Código limpio y estructurado para mantenimiento y despliegue

---

## Tecnologías utilizadas

| Tipo | Tecnologías |
|------|--------------|
| Plataforma | Electron |
| Backend | Node.js |
| Base de datos | SQLite (better-sqlite3) |
| UI | HTML, CSS, JavaScript |
| Gestor de paquetes | npm |

---

## Cómo ejecutar
npm install
npm run dev

---

## Estructura del proyecto

src/
  main.js        # Proceso main (ventana + IPC)
  preload.js     # API segura para el renderer
  db/db.js       # Capa de acceso a datos
  renderer/
    index.html   # Interfaz de usuario
    renderer.js  # Lógica del renderer
assets/
package.json

---

## Contenido visual de la aplicación
<img width="1917" height="1017" alt="image" src="https://github.com/user-attachments/assets/c5579b62-8526-4816-b80b-7ba3d4dd2a4f" />
<img width="1917" height="1019" alt="image" src="https://github.com/user-attachments/assets/67248fab-6e7b-4d77-98b5-6a7c2c21c344" />
