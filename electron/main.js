import { app, BrowserWindow, dialog, ipcMain } from 'electron'
import path from 'path'
import { fileURLToPath } from 'url'
import fs from 'fs/promises'
import configManager from './config/configManager.js'
import fileHistory from './config/fileHistory.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

let mainWindow

function createWindow() {
  // 使用绝对路径确保 preload 脚本能正确加载
  const preloadPath = path.resolve(__dirname, 'preload.cjs')
  console.log('Preload path:', preloadPath)
  
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    frame: false,
    resizable: true,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: preloadPath,
      sandbox: false,
      webSecurity: false
    },
    titleBarStyle: 'hiddenInset',
    show: false
  })

  // 加载应用
  if (process.env.NODE_ENV === 'development') {
    mainWindow.loadURL('http://localhost:5173')
    mainWindow.webContents.openDevTools()
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'))
  }

  mainWindow.once('ready-to-show', () => {
    mainWindow.show()
  })

  mainWindow.on('closed', () => {
    mainWindow = null
  })
}

app.whenReady().then(createWindow)

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow()
  }
})

// ========== IPC 窗口控制处理 ==========

// 最小化窗口
ipcMain.handle('window:minimize', () => {
  try {
    if (mainWindow) {
      mainWindow.minimize()
      return { success: true }
    }
    return { success: false, error: '窗口不存在' }
  } catch (error) {
    return { success: false, error: error.message }
  }
})

// 最大化/还原窗口
ipcMain.handle('window:maximize', () => {
  try {
    if (mainWindow) {
      if (mainWindow.isMaximized()) {
        mainWindow.unmaximize()
        return { success: true, isMaximized: false }
      } else {
        mainWindow.maximize()
        return { success: true, isMaximized: true }
      }
    }
    return { success: false, error: '窗口不存在' }
  } catch (error) {
    return { success: false, error: error.message }
  }
})

// 关闭窗口
ipcMain.handle('window:close', () => {
  try {
    if (mainWindow) {
      mainWindow.close()
      return { success: true }
    }
    return { success: false, error: '窗口不存在' }
  } catch (error) {
    return { success: false, error: error.message }
  }
})

// 检查窗口是否最大化
ipcMain.handle('window:isMaximized', () => {
  try {
    if (mainWindow) {
      return { success: true, isMaximized: mainWindow.isMaximized() }
    }
    return { success: false, error: '窗口不存在' }
  } catch (error) {
    return { success: false, error: error.message }
  }
})

// ========== IPC 文件操作处理 ==========

// 打开文件
ipcMain.handle('file:open', async () => {
  try {
    const { canceled, filePaths } = await dialog.showOpenDialog({
      properties: ['openFile'],
      filters: [
        { name: '文本文件', extensions: ['txt', 'md'] },
        { name: '所有文件', extensions: ['*'] }
      ]
    })

    if (canceled || filePaths.length === 0) {
      return { success: false, canceled: true }
    }

    const filePath = filePaths[0]
    const content = await fs.readFile(filePath, 'utf-8')
    const fileName = path.basename(filePath)

    // 添加到最近文件列表
    await fileHistory.addRecentFile(filePath, fileName)

    return {
      success: true,
      filePath,
      fileName,
      content
    }
  } catch (error) {
    return { success: false, error: error.message }
  }
})

// 保存文件
ipcMain.handle('file:save', async (event, { filePath, content }) => {
  try {
    // 如果没有文件路径，弹出保存对话框
    if (!filePath) {
      const { canceled, filePath: newPath } = await dialog.showSaveDialog({
        filters: [
          { name: '文本文件', extensions: ['txt'] },
          { name: 'Markdown', extensions: ['md'] }
        ],
        defaultPath: 'untitled.txt'
      })

      if (canceled || !newPath) {
        return { success: false, canceled: true }
      }
      filePath = newPath
    }

    await fs.writeFile(filePath, content, 'utf-8')
    const fileName = path.basename(filePath)

    // 添加到最近文件列表
    await fileHistory.addRecentFile(filePath, fileName)

    return {
      success: true,
      filePath,
      fileName
    }
  } catch (error) {
    return { success: false, error: error.message }
  }
})

// 新建文件
ipcMain.handle('file:new', async () => {
  try {
    const { canceled, filePath } = await dialog.showSaveDialog({
      filters: [
        { name: '文本文件', extensions: ['txt'] },
        { name: 'Markdown', extensions: ['md'] }
      ],
      defaultPath: 'untitled.txt'
    })

    if (canceled || !filePath) {
      return { success: false, canceled: true }
    }

    // 创建空文件
    await fs.writeFile(filePath, '', 'utf-8')
    const fileName = path.basename(filePath)

    // 添加到最近文件列表
    await fileHistory.addRecentFile(filePath, fileName)

    return {
      success: true,
      filePath,
      fileName,
      content: ''
    }
  } catch (error) {
    return { success: false, error: error.message }
  }
})

// ========== IPC 配置操作处理 ==========

// 获取完整配置
ipcMain.handle('config:get', async () => {
  try {
    const config = await configManager.getConfig()
    return { success: true, config }
  } catch (error) {
    return { success: false, error: error.message }
  }
})

// 设置配置项
ipcMain.handle('config:set', async (event, { key, value }) => {
  try {
    const config = await configManager.setConfig(key, value)
    return { success: true, config }
  } catch (error) {
    return { success: false, error: error.message }
  }
})

// 批量更新配置
ipcMain.handle('config:update', async (event, updates) => {
  try {
    const config = await configManager.updateConfig(updates)
    return { success: true, config }
  } catch (error) {
    return { success: false, error: error.message }
  }
})

// 获取工作目录
ipcMain.handle('config:getWorkDir', async () => {
  try {
    const workDir = await configManager.getWorkDirectory()
    return { success: true, workDir }
  } catch (error) {
    return { success: false, error: error.message }
  }
})

// 设置工作目录（弹出选择文件夹对话框）
ipcMain.handle('config:setWorkDir', async () => {
  try {
    const { canceled, filePaths } = await dialog.showOpenDialog({
      properties: ['openDirectory'],
      title: '选择默认工作目录'
    })

    if (canceled || filePaths.length === 0) {
      return { success: false, canceled: true }
    }

    const workDir = filePaths[0]
    await configManager.setWorkDirectory(workDir)
    await configManager.ensureWorkDirectory()

    return { success: true, workDir }
  } catch (error) {
    return { success: false, error: error.message }
  }
})

// 获取最后编辑的文件
ipcMain.handle('config:getLastFile', async () => {
  try {
    const lastFile = await configManager.getLastFile()
    return { success: true, lastFile }
  } catch (error) {
    return { success: false, error: error.message }
  }
})

// 设置最后编辑的文件
ipcMain.handle('config:setLastFile', async (event, filePath) => {
  try {
    await configManager.setLastFile(filePath)
    return { success: true }
  } catch (error) {
    return { success: false, error: error.message }
  }
})

// 生成自动文件名
ipcMain.handle('config:generateAutoFileName', async () => {
  try {
    const result = await configManager.generateAutoFileName()
    return { success: true, ...result }
  } catch (error) {
    return { success: false, error: error.message }
  }
})

// 确保工作目录存在
ipcMain.handle('config:ensureWorkDir', async () => {
  try {
    const workDir = await configManager.ensureWorkDirectory()
    return { success: true, workDir }
  } catch (error) {
    return { success: false, error: error.message }
  }
})

// ========== IPC 根据路径读取文件 ==========

// 根据路径读取文件
ipcMain.handle('file:readByPath', async (event, filePath) => {
  try {
    const content = await fs.readFile(filePath, 'utf-8')
    const fileName = path.basename(filePath)
    
    // 添加到最近文件列表
    await fileHistory.addRecentFile(filePath, fileName)
    
    return {
      success: true,
      filePath,
      fileName,
      content
    }
  } catch (error) {
    return { success: false, error: error.message }
  }
})

// ========== IPC 最近文件操作处理 ==========

// 获取最近文件列表
ipcMain.handle('history:getRecent', async () => {
  try {
    const files = await fileHistory.getFormattedRecentFiles()
    return { success: true, files }
  } catch (error) {
    return { success: false, error: error.message }
  }
})

// 添加文件到最近列表
ipcMain.handle('history:add', async (event, { filePath, fileName }) => {
  try {
    const files = await fileHistory.addRecentFile(filePath, fileName)
    return { success: true, files }
  } catch (error) {
    return { success: false, error: error.message }
  }
})

// 从最近列表移除文件
ipcMain.handle('history:remove', async (event, filePath) => {
  try {
    const files = await fileHistory.removeRecentFile(filePath)
    return { success: true, files }
  } catch (error) {
    return { success: false, error: error.message }
  }
})

// 清空最近文件列表
ipcMain.handle('history:clear', async () => {
  try {
    const files = await fileHistory.clearRecentFiles()
    return { success: true, files }
  } catch (error) {
    return { success: false, error: error.message }
  }
})