// Exposes a minimal, explicit API to the renderer -- no direct Node/IPC
// access, just the two printer calls the app actually needs. See
// src/lib/printer.js for how these are consumed.
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  printBytes: (ip, port, bytes) => ipcRenderer.invoke('printer:send', { ip, port, bytes }),
  checkPrinter: (ip, port) => ipcRenderer.invoke('printer:check', { ip, port }),
});
