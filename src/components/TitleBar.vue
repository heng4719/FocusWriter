<template>
  <div class="title-bar">
    <div class="app-title">
      <span class="app-name">FocusWrite</span>
    </div>
    <div class="title-bar-drag-region"></div>
    <div class="window-controls">
      <button class="window-control-btn minimize" @click="minimizeWindow" title="最小化">
        <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor">
          <rect x="1" y="6" width="10" height="1" rx="0.5"/>
        </svg>
      </button>
      <button class="window-control-btn maximize" @click="maximizeWindow" title="最大化">
        <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor">
          <rect x="1.5" y="1.5" width="9" height="9" rx="0.5" fill="none" stroke="currentColor" stroke-width="1"/>
        </svg>
      </button>
      <button class="window-control-btn close" @click="closeWindow" title="关闭">
        <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor">
          <path d="M2.5 2.5L9.5 9.5M9.5 2.5L2.5 9.5" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"/>
        </svg>
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'

const isMaximized = ref(false)

const minimizeWindow = async () => {
  if (window.electronAPI) {
    await window.electronAPI.minimizeWindow()
  }
}

const maximizeWindow = async () => {
  if (window.electronAPI) {
    const result = await window.electronAPI.maximizeWindow()
    if (result.success) {
      isMaximized.value = result.isMaximized

    }
  }
}

const closeWindow = async () => {
  if (window.electronAPI) {
    await window.electronAPI.closeWindow()
  }
}

const updateMaximizedState = async () => {
  if (window.electronAPI) {
    const result = await window.electronAPI.isMaximized()
    if (result.success) {
      isMaximized.value = result.isMaximized
    }
  }
}

const handleDoubleClick = (event) => {
  // 只有在拖拽区域双击时才触发最大化
  if (event.target.classList.contains('title-bar-drag-region')) {
    maximizeWindow()
  }
}

onMounted(() => {
  updateMaximizedState()
  
  // 监听窗口最大化状态变化
  window.addEventListener('resize', updateMaximizedState)
})

onUnmounted(() => {
  window.removeEventListener('resize', updateMaximizedState)
})
</script>

<style scoped>
.title-bar {
  height: 32px;
  background: #1e1e1e;
  border-bottom: 1px solid #333;
  display: flex;
  align-items: center;
  justify-content: space-between;
  position: relative;
  -webkit-app-region: drag;
  user-select: none;
}

.app-title {
  padding-left: 16px;
  display: flex;
  align-items: center;
  height: 100%;
  -webkit-app-region: drag;
}

.app-name {
  font-size: 13px;
  color: #888;
  font-weight: 500;
  letter-spacing: 0.5px;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

.title-bar-drag-region {
  position: absolute;
  left: 120px; /* 为应用标题留出空间 */
  top: 0;
  right: 140px; /* 为窗口控制按钮留出空间 */
  height: 100%;
  -webkit-app-region: drag;
}

.window-controls {
  display: flex;
  align-items: center;
  height: 100%;
  padding-right: 8px;
  -webkit-app-region: no-drag;
}

.window-control-btn {
  width: 46px;
  height: 32px;
  border: none;
  background: transparent;
  color: #666;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
  padding: 0;
}

.window-control-btn:hover {
  background: rgba(255, 255, 255, 0.1);
  color: #aaa;
}

.window-control-btn.minimize:hover {
  background: rgba(255, 255, 255, 0.1);
}

.window-control-btn.maximize:hover {
  background: rgba(255, 255, 255, 0.1);
}

.window-control-btn.close:hover {
  background: #ff5555;
  color: white;
}

.window-control-btn svg {
  width: 12px;
  height: 12px;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .title-bar {
    height: 28px;
  }
  
  .window-control-btn {
    width: 40px;
    height: 28px;
  }
  
  .title-bar-drag-region {
    right: 120px;
  }
}
</style>