const { contextBridge, ipcRenderer } = require('electron')

// 暴露给渲染进程的 API
contextBridge.exposeInMainWorld('electronAPI', {
  // 文件操作
  openFile: () => ipcRenderer.invoke('file:open'),
  saveFile: (data) => ipcRenderer.invoke('file:save', data),
  newFile: () => ipcRenderer.invoke('file:new'),
  readFileByPath: (filePath) => ipcRenderer.invoke('file:readByPath', filePath),

  // 配置操作
  getConfig: () => ipcRenderer.invoke('config:get'),
  setConfig: (key, value) => ipcRenderer.invoke('config:set', { key, value }),
  updateConfig: (updates) => ipcRenderer.invoke('config:update', updates),
  getWorkDirectory: () => ipcRenderer.invoke('config:getWorkDir'),
  setWorkDirectory: () => ipcRenderer.invoke('config:setWorkDir'),
  getLastFile: () => ipcRenderer.invoke('config:getLastFile'),
  setLastFile: (filePath) => ipcRenderer.invoke('config:setLastFile', filePath),
  generateAutoFileName: () => ipcRenderer.invoke('config:generateAutoFileName'),
  ensureWorkDirectory: () => ipcRenderer.invoke('config:ensureWorkDir'),

  // 最近文件操作
  getRecentFiles: () => ipcRenderer.invoke('history:getRecent'),
  addRecentFile: (filePath, fileName) => ipcRenderer.invoke('history:add', { filePath, fileName }),
  removeRecentFile: (filePath) => ipcRenderer.invoke('history:remove', filePath),
  clearRecentFiles: () => ipcRenderer.invoke('history:clear'),
  
  // 窗口控制
  minimizeWindow: () => ipcRenderer.invoke('window:minimize'),
  maximizeWindow: () => ipcRenderer.invoke('window:maximize'),
  closeWindow: () => ipcRenderer.invoke('window:close'),
  isMaximized: () => ipcRenderer.invoke('window:isMaximized')
})
