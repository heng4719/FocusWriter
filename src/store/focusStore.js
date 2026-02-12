import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useFocusStore = defineStore('focus', () => {
  // ========== State ==========
  const filePath = ref('')
  const fileName = ref('')
  const currentLine = ref('')
  const previousLine = ref('')
  const fullContent = ref('')
  const config = ref(null)
  const isFirstInput = ref(true)
  const recentFiles = ref([])
  const isLoading = ref(false)

  // ========== Getters ==========
  const wordCount = computed(() => {
    // 过滤空白字符后统计字数
    return fullContent.value.replace(/\s/g, '').length
  })

  const displayFileName = computed(() => {
    return fileName.value || '未命名.txt'
  })

  const hasUnsavedContent = computed(() => {
    // 如果有内容但没有保存到文件
    return fullContent.value.length > 0 && !filePath.value
  })

  const workDirectory = computed(() => {
    return config.value?.workDirectory || ''
  })

  // ========== 配置相关 Actions ==========

  // 初始化配置
  const initConfig = async () => {
    if (!window.electronAPI) {
      console.warn('Electron API 不可用')
      return false
    }

    try {
      const result = await window.electronAPI.getConfig()
      if (result.success) {
        config.value = result.config
        return true
      }
    } catch (error) {
      console.error('获取配置失败:', error)
    }
    return false
  }

  // 更新配置
  const updateConfig = async (updates) => {
    if (!window.electronAPI) return

    try {
      const result = await window.electronAPI.updateConfig(updates)
      if (result.success) {
        config.value = result.config
      }
      return result
    } catch (error) {
      console.error('更新配置失败:', error)
    }
  }

  // 设置工作目录
  const setWorkDirectory = async () => {
    if (!window.electronAPI) return

    try {
      const result = await window.electronAPI.setWorkDirectory()
      if (result.success) {
        config.value.workDirectory = result.workDir
      }
      return result
    } catch (error) {
      console.error('设置工作目录失败:', error)
    }
  }

  // ========== 最近文件相关 Actions ==========

  // 获取最近文件列表
  const loadRecentFiles = async () => {
    if (!window.electronAPI) return

    try {
      const result = await window.electronAPI.getRecentFiles()
      if (result.success) {
        recentFiles.value = result.files
      }
      return result
    } catch (error) {
      console.error('获取最近文件失败:', error)
    }
  }

  // 从最近文件列表中移除
  const removeFromRecent = async (path) => {
    if (!window.electronAPI) return

    try {
      const result = await window.electronAPI.removeRecentFile(path)
      if (result.success) {
        recentFiles.value = result.files
      }
      return result
    } catch (error) {
      console.error('移除最近文件失败:', error)
    }
  }

  // ========== 核心写作 Actions ==========

  // 提交当前行（按下 Enter）- 关键修改
  const submitLine = async (onFirstSave) => {
    const trimmedLine = currentLine.value.trim()
    if (!trimmedLine) return { success: false, reason: 'empty' }

    // 更新上一行显示
    previousLine.value = trimmedLine
    // 追加到完整内容
    fullContent.value += trimmedLine + '\n'
    // 清空当前输入
    currentLine.value = ''

    // 检查是否需要首次保存
    if (isFirstInput.value && !filePath.value) {
      isFirstInput.value = false
      
      // 调用首次保存回调，让组件处理对话框
      if (onFirstSave) {
        const saveResult = await onFirstSave()
        return saveResult
      }
    }

    // 自动保存（如果已有文件路径）
    if (filePath.value && window.electronAPI) {
      await autoSave()
    }

    return { success: true }
  }

  // 首次保存 - 选择保存位置
  const firstTimeSave = async (useDefault = false) => {
    if (!window.electronAPI) {
      return { success: false, error: 'Electron API 不可用' }
    }

    try {
      let targetPath = ''
      let targetName = ''

      if (useDefault) {
        // 使用默认工作目录
        const autoResult = await window.electronAPI.generateAutoFileName()
        if (!autoResult.success) {
          return autoResult
        }
        targetPath = autoResult.filePath
        targetName = autoResult.fileName
        
        // 更新配置中的工作目录
        const workDirResult = await window.electronAPI.ensureWorkDirectory()
        if (workDirResult.success) {
          config.value.workDirectory = workDirResult.workDir
        }
      } else {
        // 弹出保存对话框让用户选择
        const result = await window.electronAPI.saveFile({
          filePath: '',
          content: fullContent.value
        })
        
        if (result.canceled) {
          return { success: false, canceled: true }
        }
        
        if (!result.success) {
          return result
        }
        
        targetPath = result.filePath
        targetName = result.fileName
        
        // 提取目录作为工作目录
        const pathParts = targetPath.split(/[\\/]/)
        pathParts.pop()
        const workDir = pathParts.join('/')
        await updateConfig({ workDirectory: workDir })
      }

      // 更新文件信息
      filePath.value = targetPath
      fileName.value = targetName

      // 添加到最后编辑
      await window.electronAPI.setLastFile(targetPath)

      return { 
        success: true, 
        filePath: targetPath, 
        fileName: targetName 
      }
    } catch (error) {
      console.error('首次保存失败:', error)
      return { success: false, error: error.message }
    }
  }

  // 自动保存
  const autoSave = async () => {
    if (!window.electronAPI || !filePath.value) return

    try {
      const result = await window.electronAPI.saveFile({
        filePath: filePath.value,
        content: fullContent.value
      })
      return result
    } catch (error) {
      console.error('自动保存失败:', error)
    }
  }

  // ========== 文件操作 Actions ==========

  // 初始化时尝试加载最后编辑的文件
  const initLastFile = async () => {
    if (!window.electronAPI) return false

    isLoading.value = true
    try {
      // 获取最后编辑的文件
      const lastFileResult = await window.electronAPI.getLastFile()
      if (lastFileResult.success && lastFileResult.lastFile) {
        // 尝试读取该文件
        const content = await window.electronAPI.openFileByPath?.(lastFileResult.lastFile)
        
        // 由于 openFileByPath 可能不存在，我们尝试使用普通方式
        // 实际上应该有一个根据路径打开文件的 API
        // 暂时使用 dialog 方式让用户选择，或者自动打开
        
        // 检查文件是否还存在
        try {
          // 这里我们假设 lastFile 是完整路径
          const pathParts = lastFileResult.lastFile.split(/[\\/]/)
          const name = pathParts[pathParts.length - 1]
          
          // 读取文件内容（需要添加新的 IPC 方法）
          // 暂时跳过自动打开，让用户手动选择
          console.log('最后编辑的文件:', lastFileResult.lastFile)
        } catch (e) {
          console.log('无法自动打开最后文件')
        }
      }
      return true
    } catch (error) {
      console.error('初始化最后文件失败:', error)
      return false
    } finally {
      isLoading.value = false
    }
  }

  // 打开指定路径的文件
  const openFileByPath = async (targetPath) => {
    if (!window.electronAPI) {
      console.warn('Electron API 不可用')
      return { success: false }
    }

    isLoading.value = true
    try {
      // 读取文件内容
      // 注意：这里需要一个根据路径读取文件的 IPC 方法
      // 暂时使用 fs 方式，但需要通过 IPC
      
      // 通过 IPC 读取文件
      const result = await window.electronAPI.readFile?.(targetPath)
      
      // 如果 readFile 不存在，暂时使用 saveFile 的反向操作思路
      // 实际上需要添加一个专门的 IPC 方法
      
      // 为了简化，我们先尝试直接打开（需要修改 main.js 添加此方法）
      const fileName = targetPath.split(/[\\/]/).pop()
      
      // 添加到最近文件
      await window.electronAPI.addRecentFile?.(targetPath, fileName)
      
      filePath.value = targetPath
      fileName.value = fileName
      
      return { success: true }
    } catch (error) {
      console.error('打开文件失败:', error)
      return { success: false, error: error.message }
    } finally {
      isLoading.value = false
    }
  }

  // 打开文件
  const openFile = async () => {
    if (!window.electronAPI) {
      console.warn('Electron API 不可用')
      return { success: false }
    }

    isLoading.value = true
    try {
      const result = await window.electronAPI.openFile()
      if (result.success) {
        filePath.value = result.filePath
        fileName.value = result.fileName
        fullContent.value = result.content
        isFirstInput.value = false
        
        // 解析最后一行作为 previousLine
        const lines = result.content.split('\n').filter(line => line.trim())
        if (lines.length > 0) {
          previousLine.value = lines[lines.length - 1]
        } else {
          previousLine.value = ''
        }
        
        currentLine.value = ''
        
        // 刷新最近文件列表
        await loadRecentFiles()
      }
      return result
    } catch (error) {
      console.error('打开文件失败:', error)
      return { success: false, error: error.message }
    } finally {
      isLoading.value = false
    }
  }

  // 新建文件
  const newFile = async () => {
    if (!window.electronAPI) {
      console.warn('Electron API 不可用')
      return { success: false }
    }

    isLoading.value = true
    try {
      const result = await window.electronAPI.newFile()
      if (result.success) {
        filePath.value = result.filePath
        fileName.value = result.fileName
        fullContent.value = ''
        previousLine.value = ''
        currentLine.value = ''
        isFirstInput.value = false
        
        // 刷新最近文件列表
        await loadRecentFiles()
      }
      return result
    } catch (error) {
      console.error('新建文件失败:', error)
      return { success: false, error: error.message }
    } finally {
      isLoading.value = false
    }
  }

  // 手动保存文件
  const saveFile = async () => {
    if (!window.electronAPI) {
      console.warn('Electron API 不可用')
      return { success: false }
    }

    isLoading.value = true
    try {
      const result = await window.electronAPI.saveFile({
        filePath: filePath.value,
        content: fullContent.value
      })
      if (result.success) {
        filePath.value = result.filePath
        fileName.value = result.fileName
        
        // 刷新最近文件列表
        await loadRecentFiles()
      }
      return result
    } catch (error) {
      console.error('保存文件失败:', error)
      return { success: false, error: error.message }
    } finally {
      isLoading.value = false
    }
  }

  // 清除当前文件状态
  const clearFile = () => {
    filePath.value = ''
    fileName.value = ''
    fullContent.value = ''
    previousLine.value = ''
    currentLine.value = ''
    isFirstInput.value = true
  }

  return {
    // State
    filePath,
    fileName,
    currentLine,
    previousLine,
    fullContent,
    config,
    isFirstInput,
    recentFiles,
    isLoading,
    // Getters
    wordCount,
    displayFileName,
    hasUnsavedContent,
    workDirectory,
    // Actions
    initConfig,
    updateConfig,
    setWorkDirectory,
    loadRecentFiles,
    removeFromRecent,
    submitLine,
    firstTimeSave,
    autoSave,
    initLastFile,
    openFileByPath,
    openFile,
    newFile,
    saveFile,
    clearFile
  }
})
