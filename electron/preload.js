const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  isElectron: true,
  platform: process.platform,
  storeCredential: (key, value) => ipcRenderer.invoke('store-credential', key, value),
  getCredential: (key) => ipcRenderer.invoke('get-credential', key),
  openExternal: (url) => ipcRenderer.invoke('open-external', url),
});
