import { app } from 'electron'
import fs from 'fs/promises'
import path from 'path'
import configManager from './configManager.js'

class FileHistory {
  constructor() {
    this.maxFiles = 10
  }

  // 添加文件到最近列表
  async addRecentFile(filePath, fileName) {
    const config = await configManager.getConfig()
    let recentFiles = config.recentFiles || []

    // 移除已存在的相同文件
    recentFiles = recentFiles.filter(f => f.path !== filePath)

    // 添加新文件到开头
    recentFiles.unshift({
      path: filePath,
      name: fileName,
      lastOpened: new Date().toISOString()
    })

    // 限制数量
    if (recentFiles.length > config.maxRecentFiles) {
      recentFiles = recentFiles.slice(0, config.maxRecentFiles)
    }

    // 更新配置
    await configManager.setConfig('recentFiles', recentFiles)
    
    // 同时更新最后编辑的文件
    await configManager.setLastFile(filePath)

    return recentFiles
  }

  // 获取最近文件列表
  async getRecentFiles() {
    const config = await configManager.getConfig()
    const recentFiles = config.recentFiles || []
    
    // 检查文件是否仍然存在
    const validFiles = []
    for (const file of recentFiles) {
      try {
        await fs.access(file.path)
        validFiles.push(file)
      } catch {
        // 文件不存在，跳过
        console.log(`文件不存在，从最近列表移除: ${file.path}`)
      }
    }

    // 如果有无效文件，更新配置
    if (validFiles.length !== recentFiles.length) {
      await configManager.setConfig('recentFiles', validFiles)
    }

    return validFiles
  }

  // 从最近列表移除文件
  async removeRecentFile(filePath) {
    const config = await configManager.getConfig()
    let recentFiles = config.recentFiles || []
    
    recentFiles = recentFiles.filter(f => f.path !== filePath)
    
    await configManager.setConfig('recentFiles', recentFiles)
    
    // 如果移除的是最后编辑的文件，清除它
    const lastFile = await configManager.getLastFile()
    if (lastFile === filePath) {
      await configManager.clearLastFile()
    }

    return recentFiles
  }

  // 清空最近文件列表
  async clearRecentFiles() {
    await configManager.setConfig('recentFiles', [])
    await configManager.clearLastFile()
    return []
  }

  // 格式化时间显示
  formatTimeAgo(isoString) {
    const date = new Date(isoString)
    const now = new Date()
    const diffMs = now - date
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1) {
      return '刚刚'
    } else if (diffMins < 60) {
      return `${diffMins}分钟前`
    } else if (diffHours < 24) {
      return `${diffHours}小时前`
    } else if (diffDays < 30) {
      return `${diffDays}天前`
    } else {
      return date.toLocaleDateString('zh-CN')
    }
  }

  // 获取格式化的最近文件列表（用于显示）
  async getFormattedRecentFiles() {
    const files = await this.getRecentFiles()
    return files.map(file => ({
      ...file,
      timeAgo: this.formatTimeAgo(file.lastOpened)
    }))
  }
}

// 导出单例
const fileHistory = new FileHistory()
export default fileHistory
