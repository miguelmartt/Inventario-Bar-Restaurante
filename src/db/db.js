const path = require('path');
const Database = require('better-sqlite3');

let db;

function ensureColumns() {
  const cols = db.prepare(`PRAGMA table_info(items);`).all().map(c => c.name);
  const missing = (name) => !cols.includes(name);

  db.exec('BEGIN');
  try {
    if (missing('category')) db.exec(`ALTER TABLE items ADD COLUMN category TEXT DEFAULT 'Otros';`);
    if (missing('price'))    db.exec(`ALTER TABLE items ADD COLUMN price REAL NOT NULL DEFAULT 0;`);
    if (missing('notes'))    db.exec(`ALTER TABLE items ADD COLUMN notes TEXT;`);
    db.exec('COMMIT');
  } catch (e) {
    db.exec('ROLLBACK');
    // Si la versión de SQLite no soporta IF NOT EXISTS en columnas, ignoramos si ya existen.
    if (!/duplicate column|exists/i.test(String(e))) throw e;
  }
}

function initDB(app) {
  const dbPath = path.join(app.getPath('userData'), 'inventario.db');
  db = new Database(dbPath);
  db.prepare(`
    CREATE TABLE IF NOT EXISTS items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      qty INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `).run();
  ensureColumns();
  db.pragma('journal_mode = WAL');
}

function insertItem({ name, qty=0, category='Otros', price=0, notes=null }) {
  if (!name || typeof name !== 'string' || name.trim() === '') throw new Error('Nombre requerido');
  const q = Number(qty);
  if (!Number.isFinite(q) || q < 0) throw new Error('Cantidad inválida');
  const p = Number(price);
  if (!Number.isFinite(p) || p < 0) throw new Error('Precio inválido');

  const stmt = db.prepare(`
    INSERT INTO items (name, qty, category, price, notes)
    VALUES (?, ?, ?, ?, ?);
  `);
  return stmt.run(name.trim(), q, String(category || 'Otros'), p, notes || null);
}

function updateItem(id, { name, qty, category, price, notes }) {
  const stmt = db.prepare(`
    UPDATE items SET
      name = ?, qty = ?, category = ?, price = ?, notes = ?
    WHERE id = ?;
  `);
  return stmt.run(String(name).trim(), Number(qty||0), String(category||'Otros'), Number(price||0), notes || null, Number(id));
}

function deleteItem(id) {
  db.prepare('DELETE FROM items WHERE id = ?;').run(Number(id));
}

function getItem(id){
  return db.prepare(`SELECT id, name, qty, category, price, notes, created_at FROM items WHERE id = ?;`).get(Number(id));
}

function getItems(q='') {
  if (q && q.trim()) {
    const like = `%${q.trim()}%`;
    return db.prepare(`
      SELECT id, name, qty, category, price, notes, created_at
      FROM items
      WHERE name LIKE ? OR category LIKE ? OR notes LIKE ?
      ORDER BY id DESC;
    `).all(like, like, like);
  }
  return db.prepare(`
    SELECT id, name, qty, category, price, notes, created_at
    FROM items
    ORDER BY id DESC;
  `).all();
}

module.exports = { initDB, insertItem, updateItem, deleteItem, getItem, getItems };
