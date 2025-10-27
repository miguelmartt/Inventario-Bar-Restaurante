const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const DB = require('./db/db'); // <- import central

let win;

function createWindow() {
  win = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    }
  });
  win.loadFile(path.join(__dirname, 'renderer', 'index.html'));
}

app.whenReady().then(() => {
  DB.initDB(app);
  createWindow();
});

ipcMain.handle('item:save', (_evt, item) => {
  try { const r = DB.insertItem(item); return { ok:true, id:r.lastInsertRowid }; }
  catch (e) { console.error(e); return { ok:false, error:String(e.message||e)}}
});

ipcMain.handle('item:list', (_evt, q='') => {
  try { return { ok:true, rows: DB.getItems(q) }; }
  catch (e) { console.error(e); return { ok:false, error:String(e)}}
});

ipcMain.handle('item:delete', (_evt, id) => {
  try { DB.deleteItem(id); return { ok:true }; }
  catch (e) { console.error(e); return { ok:false, error:String(e)}}
});

ipcMain.handle('item:update', (_evt, {id, data}) => {
  try { DB.updateItem(id, data); return { ok:true }; }
  catch (e) { console.error(e); return { ok:false, error:String(e)}}
});

ipcMain.handle('item:get', (_evt, id) => {
  try { return { ok:true, row: DB.getItem(id) }; }
  catch (e) { console.error(e); return { ok:false, error:String(e)}}
});
