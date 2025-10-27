const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
  saveItem: (item) => ipcRenderer.invoke('item:save', item),
  listItems: (q) => ipcRenderer.invoke('item:list', q || ''),
  deleteItem: (id) => ipcRenderer.invoke('item:delete', id),
  updateItem: (id, data) => ipcRenderer.invoke('item:update', { id, data }),
  getItem: (id) => ipcRenderer.invoke('item:get', id),
});
