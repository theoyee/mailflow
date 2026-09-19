const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  storeCredential: (key, value) => ipcRenderer.invoke('store-credential', key, value),
});
