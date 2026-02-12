<template>
  <div class="focus-writer">
    <!-- 左上角：文件名显示和最近文件下拉 -->
    <div class="filename-section">
      <div 
        class="filename-display" 
        :class="{ 'has-file': store.fileName, 'has-dropdown': recentFiles.length > 0 }"
        @click="toggleRecentDropdown"
      >
        {{ store.displayFileName }}
        <span v-if="recentFiles.length > 0" class="dropdown-arrow">▼</span>
      </div>
      
      <!-- 最近文件下拉菜单 -->
      <div v-if="showRecentDropdown && recentFiles.length > 0" class="recent-dropdown">
        <div class="dropdown-header">最近文件</div>
        <div 
          v-for="file in recentFiles" 
          :key="file.path"
          class="recent-item"
          @click="openRecentFile(file.path)"
        >
          <span class="recent-name">{{ file.name }}</span>
          <span class="recent-time">{{ file.timeAgo }}</span>
        </div>
      </div>
    </div>

    <!-- 右上角：设置、打开、新建按钮 -->
    <div class="top-controls">
      <!-- 设置按钮 -->
      <button @click="showSettings = true" class="btn-icon" title="设置">
        <span class="icon">⚙️</span>
      </button>

      <!-- 打开文件按钮和下拉 -->
      <div class="dropdown-wrapper">
        <button @click="handleOpen" class="btn-secondary">
          <span class="icon">📂</span>
          打开
        </button>
      </div>

      <!-- 新建文件按钮 -->
      <button @click="handleNew" class="btn-primary">
        <span class="icon">📝</span>
        新建
      </button>
    </div>

    <!-- 中央区域：写作区域 -->
    <div class="writing-area">
      <!-- 上一行显示 -->
      <transition name="slide-up" mode="out-in">
        <div class="previous-line" :key="previousLine">
          {{ previousLine || '开始写作...' }}
        </div>
      </transition>
      
      <!-- 当前输入框 -->
      <input
        ref="inputRef"
        v-model="currentLine"
        class="active-input"
        placeholder="在此输入..."
        @keydown.enter.prevent="handleEnter"
      />
    </div>

    <!-- 右下角：字数统计和保存状态 -->
    <div class="bottom-right">
      <div v-if="!store.filePath && store.fullContent" class="unsaved-indicator">
        未保存
      </div>
      <div class="word-counter" :class="{ 'has-content': wordCount > 0 }">
        <span class="label">字数</span>
        <span class="count">{{ wordCount }}</span>
      </div>
    </div>

    <!-- 设置对话框 -->
    <SettingsModal
      :visible="showSettings"
      :config="store.config"
      :recent-files="recentFiles"
      @close="showSettings = false"
      @set-work-dir="handleSetWorkDirectory"
      @remove-recent="handleRemoveRecent"
      @clear-recent="handleClearRecent"
    />

    <!-- 首次保存对话框 -->
    <FirstSaveModal
      :visible="showFirstSaveModal"
      @close="showFirstSaveModal = false"
      @use-default="handleFirstSaveDefault"
      @select-custom="handleFirstSaveCustom"
    />
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { useFocusStore } from '../store/focusStore'
import { storeToRefs } from 'pinia'
import SettingsModal from './SettingsModal.vue'
import FirstSaveModal from './FirstSaveModal.vue'

const store = useFocusStore()
const { currentLine, previousLine, wordCount } = storeToRefs(store)

// UI 状态
const inputRef = ref(null)
const showSettings = ref(false)
const showFirstSaveModal = ref(false)
const showRecentDropdown = ref(false)
const recentFiles = ref([])
const isInitializing = ref(true)

// ========== 生命周期 ==========

onMounted(async () => {
  // 初始化配置
  await store.initConfig()
  
  // 加载最近文件列表
  await loadRecentFiles()
  
  // 尝试自动打开最后编辑的文件
  await autoOpenLastFile()
  
  // 自动聚焦输入框
  setTimeout(() => {
    inputRef.value?.focus()
  }, 100)
  
  isInitializing.value = false
})

// 点击外部关闭下拉菜单
const handleClickOutside = (event) => {
  const dropdown = document.querySelector('.filename-section')
  if (dropdown && !dropdown.contains(event.target)) {
    showRecentDropdown.value = false
  }
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside)
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
})

// ========== 核心功能 ==========

// 处理回车键
const handleEnter = async () => {
  const trimmedLine = currentLine.value.trim()
  if (!trimmedLine) return

  // 如果是首次输入且没有文件路径，显示首次保存对话框
  if (store.isFirstInput && !store.filePath) {
    // 先临时更新显示
    store.previousLine = trimmedLine
    store.fullContent += trimmedLine + '\n'
    store.currentLine = ''
    store.isFirstInput = false
    
    // 显示保存对话框
    showFirstSaveModal.value = true
    return
  }

  // 正常提交
  const result = await store.submitLine()
  
  // 保持焦点
  setTimeout(() => {
    inputRef.value?.focus()
  }, 0)
}

// 首次保存 - 使用默认目录
const handleFirstSaveDefault = async () => {
  showFirstSaveModal.value = false
  
  const result = await store.firstTimeSave(true)
  
  if (result.success) {
    // 刷新最近文件列表
    await loadRecentFiles()
    console.log('文件已保存到:', result.filePath)
  } else if (!result.canceled) {
    console.error('保存失败:', result.error)
    alert('保存失败: ' + result.error)
  }
  
  // 保持焦点
  setTimeout(() => {
    inputRef.value?.focus()
  }, 0)
}

// 首次保存 - 选择自定义位置
const handleFirstSaveCustom = async () => {
  showFirstSaveModal.value = false
  
  const result = await store.firstTimeSave(false)
  
  if (result.success) {
    // 刷新最近文件列表
    await loadRecentFiles()
    console.log('文件已保存到:', result.filePath)
  } else if (!result.canceled) {
    console.error('保存失败:', result.error)
    alert('保存失败: ' + result.error)
  }
  
  // 保持焦点
  setTimeout(() => {
    inputRef.value?.focus()
  }, 0)
}

// ========== 文件操作 ==========

const handleOpen = async () => {
  const result = await store.openFile()
  if (result.success) {
    await loadRecentFiles()
    setTimeout(() => {
      inputRef.value?.focus()
    }, 0)
  }
}

const handleNew = async () => {
  const result = await store.newFile()
  if (result.success) {
    await loadRecentFiles()
    setTimeout(() => {
      inputRef.value?.focus()
    }, 0)
  }
}

// ========== 最近文件功能 ==========

const loadRecentFiles = async () => {
  if (!window.electronAPI) return
  
  try {
    const result = await window.electronAPI.getRecentFiles()
    if (result.success) {
      recentFiles.value = result.files
    }
  } catch (error) {
    console.error('加载最近文件失败:', error)
  }
}

const toggleRecentDropdown = () => {
  if (recentFiles.value.length > 0) {
    showRecentDropdown.value = !showRecentDropdown.value
  }
}

const openRecentFile = async (filePath) => {
  showRecentDropdown.value = false
  
  if (!window.electronAPI) return
  
  try {
    const result = await window.electronAPI.readFileByPath(filePath)
    if (result.success) {
      store.filePath = result.filePath
      store.fileName = result.fileName
      store.fullContent = result.content
      store.isFirstInput = false
      
      // 解析最后一行
      const lines = result.content.split('\n').filter(line => line.trim())
      if (lines.length > 0) {
        store.previousLine = lines[lines.length - 1]
      } else {
        store.previousLine = ''
      }
      
      store.currentLine = ''
      
      // 刷新最近文件列表（更新时间）
      await loadRecentFiles()
      
      setTimeout(() => {
        inputRef.value?.focus()
      }, 0)
    } else {
      console.error('打开文件失败:', result.error)
      alert('无法打开文件: ' + result.error)
    }
  } catch (error) {
    console.error('打开最近文件失败:', error)
    alert('无法打开文件')
  }
}

// ========== 设置功能 ==========

const handleSetWorkDirectory = async () => {
  const result = await store.setWorkDirectory()
  if (result?.success) {
    console.log('工作目录已设置:', result.workDir)
  }
}

const handleRemoveRecent = async (path) => {
  await store.removeFromRecent(path)
  await loadRecentFiles()
}

const handleClearRecent = async () => {
  if (!window.electronAPI) return
  
  try {
    const result = await window.electronAPI.clearRecentFiles()
    if (result.success) {
      recentFiles.value = []
    }
  } catch (error) {
    console.error('清空最近文件失败:', error)
  }
}

// ========== 自动打开最后文件 ==========

const autoOpenLastFile = async () => {
  if (!window.electronAPI) return
  
  try {
    const lastFileResult = await window.electronAPI.getLastFile()
    if (lastFileResult.success && lastFileResult.lastFile) {
      // 尝试读取最后编辑的文件
      const result = await window.electronAPI.readFileByPath(lastFileResult.lastFile)
      if (result.success) {
        store.filePath = result.filePath
        store.fileName = result.fileName
        store.fullContent = result.content
        store.isFirstInput = false
        
        // 解析最后一行
        const lines = result.content.split('\n').filter(line => line.trim())
        if (lines.length > 0) {
          store.previousLine = lines[lines.length - 1]
        }
        
        console.log('自动打开最后编辑的文件:', result.fileName)
      }
    }
  } catch (error) {
    console.log('没有可自动打开的文件或打开失败')
  }
}
</script>

<style scoped>
.focus-writer {
  width: 100%;
  height: 100%;
  position: relative;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  background: linear-gradient(135deg, #1e1e1e 0%, #252525 100%);
}

/* 左上角文件名区域 */
.filename-section {
  position: absolute;
  top: 20px;
  left: 20px;
  z-index: 100;
}

.filename-display {
  font-size: 14px;
  color: #666;
  font-family: 'Consolas', 'Monaco', monospace;
  padding: 8px 12px;
  border-radius: 6px;
  transition: all 0.3s ease;
  cursor: default;
  display: flex;
  align-items: center;
  gap: 6px;
}

.filename-display.has-file {
  color: #4a9eff;
  background: rgba(74, 158, 255, 0.1);
}

.filename-display.has-dropdown {
  cursor: pointer;
}

.filename-display.has-dropdown:hover {
  background: rgba(255, 255, 255, 0.05);
}

.dropdown-arrow {
  font-size: 10px;
  color: #666;
  transition: transform 0.2s;
}

/* 最近文件下拉菜单 */
.recent-dropdown {
  position: absolute;
  top: 100%;
  left: 0;
  margin-top: 8px;
  background: #2a2a2a;
  border-radius: 8px;
  border: 1px solid #333;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.4);
  min-width: 240px;
  overflow: hidden;
  z-index: 101;
}

.dropdown-header {
  padding: 10px 14px;
  font-size: 12px;
  color: #666;
  border-bottom: 1px solid #333;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.recent-item {
  padding: 12px 14px;
  cursor: pointer;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid #333;
  transition: background 0.2s;
}

.recent-item:last-child {
  border-bottom: none;
}

.recent-item:hover {
  background: rgba(255, 255, 255, 0.05);
}

.recent-name {
  font-size: 13px;
  color: #aaa;
}

.recent-time {
  font-size: 11px;
  color: #666;
}

/* 右上角控制按钮 */
.top-controls {
  position: absolute;
  top: 20px;
  right: 20px;
  display: flex;
  gap: 10px;
  align-items: center;
  z-index: 100;
}

.btn-icon {
  padding: 8px;
  background: transparent;
  border: none;
  color: #888;
  cursor: pointer;
  border-radius: 6px;
  font-size: 16px;
  transition: all 0.2s;
}

.btn-icon:hover {
  background: rgba(255, 255, 255, 0.1);
  color: #fff;
}

.dropdown-wrapper {
  position: relative;
}

.btn-secondary {
  padding: 10px 18px;
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid #444;
  color: #ccc;
  cursor: pointer;
  border-radius: 6px;
  font-size: 13px;
  display: flex;
  align-items: center;
  gap: 6px;
  font-weight: 500;
  transition: all 0.2s ease;
}

.btn-secondary:hover {
  background: rgba(255, 255, 255, 0.15);
  border-color: #555;
  color: #fff;
  transform: translateY(-1px);
}

.btn-primary {
  padding: 10px 18px;
  background: #4a9eff;
  border: none;
  color: white;
  cursor: pointer;
  border-radius: 6px;
  font-size: 13px;
  display: flex;
  align-items: center;
  gap: 6px;
  font-weight: 500;
  transition: all 0.2s ease;
}

.btn-primary:hover {
  background: #3d8de6;
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(74, 158, 255, 0.3);
}

/* 中央写作区域 */
.writing-area {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 24px;
  width: 85%;
  max-width: 900px;
  padding: 40px;
}

.previous-line {
  font-size: 20px;
  color: #555;
  min-height: 40px;
  text-align: center;
  width: 100%;
  line-height: 1.6;
  font-family: 'Georgia', 'Times New Roman', serif;
  /* font-style: italic; */
  padding: 20px;
}

.active-input {
  width: 100%;
  padding: 20px 30px;
  font-size: 26px;
  background: rgba(255, 255, 255, 0.05);
  border: 2px solid transparent;
  border-radius: 12px;
  color: #f0f0f0;
  text-align: center;
  outline: none;
  font-family: 'Georgia', 'Times New Roman', serif;
  transition: all 0.3s ease;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
}

.active-input::placeholder {
  color: #444;
}

.active-input:focus {
  background: rgba(255, 255, 255, 0.08);
  border-color: rgba(74, 158, 255, 0.3);
  box-shadow: 0 4px 30px rgba(74, 158, 255, 0.15);
}

/* 右下角区域 */
.bottom-right {
  position: absolute;
  bottom: 24px;
  right: 24px;
  display: flex;
  align-items: center;
  gap: 16px;
  z-index: 100;
}

.unsaved-indicator {
  font-size: 12px;
  color: #ff9f43;
  background: rgba(255, 159, 67, 0.1);
  padding: 4px 10px;
  border-radius: 4px;
  font-weight: 500;
}

.word-counter {
  font-size: 13px;
  color: #555;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 16px;
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.03);
  transition: all 0.3s ease;
}

.word-counter.has-content {
  color: #aaa;
  background: rgba(74, 158, 255, 0.1);
}

.word-counter .label {
  font-weight: 400;
}

.word-counter .count {
  font-weight: 600;
  color: #4a9eff;
  font-family: 'Consolas', monospace;
}

/* 动画效果 */
.slide-up-enter-active,
.slide-up-leave-active {
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}

.slide-up-enter-from {
  opacity: 0;
  transform: translateY(10px);
}

.slide-up-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}

/* 响应式优化 */
@media (max-width: 768px) {
  .writing-area {
    width: 95%;
    padding: 20px;
  }
  
  .active-input {
    font-size: 20px;
    padding: 16px 20px;
  }
  
  .previous-line {
    font-size: 16px;
  }

  .top-controls {
    gap: 6px;
  }

  .btn-secondary,
  .btn-primary {
    padding: 8px 12px;
    font-size: 12px;
  }
}
</style>
