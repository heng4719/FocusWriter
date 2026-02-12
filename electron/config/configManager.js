import { app } from 'electron'
import fs from 'fs/promises'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

class ConfigManager {
  constructor() {
    this.configPath = path.join(app.getPath('userData'), 'config.json')
    this.config = null
    this.defaultConfig = {
      workDirectory: '',
      lastFile: '',
      recentFiles: [],
      maxRecentFiles: 10
    }
  }

  // 读取配置文件
  async readConfig() {
    try {
      const data = await fs.readFile(this.configPath, 'utf-8')
      this.config = JSON.parse(data)
      // 合并默认值，确保新字段存在
      this.config = { ...this.defaultConfig, ...this.config }
      return this.config
    } catch (error) {
      // 文件不存在或读取失败，创建默认配置
      this.config = { ...this.defaultConfig }
      await this.writeConfig()
      return this.config
    }
  }

  // 写入配置文件
  async writeConfig() {
    try {
      const configDir = path.dirname(this.configPath)
      await fs.mkdir(configDir, { recursive: true })
      await fs.writeFile(this.configPath, JSON.stringify(this.config, null, 2), 'utf-8')
      return true
    } catch (error) {
      console.error('写入配置文件失败:', error)
      return false
    }
  }

  // 获取完整配置
  async getConfig() {
    if (!this.config) {
      await this.readConfig()
    }
    return this.config
  }

  // 更新配置项
  async setConfig(key, value) {
    if (!this.config) {
      await this.readConfig()
    }
    this.config[key] = value
    await this.writeConfig()
    return this.config
  }

  // 批量更新配置
  async updateConfig(updates) {
    if (!this.config) {
      await this.readConfig()
    }
    this.config = { ...this.config, ...updates }
    await this.writeConfig()
    return this.config
  }

  // 获取工作目录
  async getWorkDirectory() {
    const config = await this.getConfig()
    return config.workDirectory
  }

  // 设置工作目录
  async setWorkDirectory(dir) {
    return await this.setConfig('workDirectory', dir)
  }

  // 获取最后编辑的文件
  async getLastFile() {
    const config = await this.getConfig()
    return config.lastFile
  }

  // 设置最后编辑的文件
  async setLastFile(filePath) {
    return await this.setConfig('lastFile', filePath)
  }

  // 清除最后编辑的文件
  async clearLastFile() {
    return await this.setConfig('lastFile', '')
  }

  // 获取默认工作目录（Documents/FocusWrite）
  async getDefaultWorkDirectory() {
    const documentsPath = app.getPath('documents')
    return path.join(documentsPath, 'FocusWrite')
  }

  // 确保工作目录存在
  async ensureWorkDirectory() {
    const workDir = await this.getWorkDirectory()
    if (workDir) {
      try {
        await fs.mkdir(workDir, { recursive: true })
        return workDir
      } catch (error) {
        console.error('创建工作目录失败:', error)
        return null
      }
    }
    return null
  }

  // 生成自动文件名（untitled_001.txt）
  async generateAutoFileName() {
    const workDir = await this.getWorkDirectory()
    if (!workDir) {
      const defaultDir = await this.getDefaultWorkDirectory()
      await this.setWorkDirectory(defaultDir)
      await this.ensureWorkDirectory()
    }

    const targetDir = await this.getWorkDirectory()
    let counter = 1
    let fileName = ''
    let filePath = ''

    // 查找可用的文件名
    while (true) {
      fileName = `untitled_${String(counter).padStart(3, '0')}.txt`
      filePath = path.join(targetDir, fileName)
      
      try {
        await fs.access(filePath)
        // 文件存在，继续尝试下一个
        counter++
      } catch {
        // 文件不存在，可以使用
        break
      }
    }

    return { fileName, filePath }
  }
}

// 导出单例
const configManager = new ConfigManager()
export default configManager
