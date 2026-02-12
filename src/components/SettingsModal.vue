<template>
  <div v-if="visible" class="settings-modal-overlay" @click="handleOverlayClick">
    <div class="settings-modal" @click.stop>
      <div class="modal-header">
        <h3>设置</h3>
        <button class="close-btn" @click="close">×</button>
      </div>
      
      <div class="modal-content">
        <!-- 工作目录设置 -->
        <div class="setting-item">
          <label class="setting-label">
            <span class="icon">📁</span>
            默认工作目录
          </label>
          <div class="setting-control">
            <div class="path-display">
              {{ workDir || '未设置' }}
            </div>
            <button @click="selectWorkDirectory" class="btn-secondary">
              选择目录
            </button>
          </div>
          <p class="setting-desc">
            新文件将默认保存在此目录
          </p>
        </div>

        <!-- 最近文件管理 -->
        <div class="setting-item">
          <label class="setting-label">
            <span class="icon">📚</span>
            最近文件
          </label>
          <div class="recent-files-list">
            <div 
              v-for="file in recentFiles" 
              :key="file.path"
              class="recent-file-item"
            >
              <span class="file-name">{{ file.name }}</span>
              <span class="file-time">{{ file.timeAgo }}</span>
              <button 
                class="remove-btn"
                @click="removeRecentFile(file.path)"
                title="从列表中移除"
              >
                ×
              </button>
            </div>
            <div v-if="recentFiles.length === 0" class="no-files">
              暂无最近文件
            </div>
          </div>
          <button 
            v-if="recentFiles.length > 0"
            @click="clearAllRecent"
            class="btn-text"
          >
            清空最近文件列表
          </button>
        </div>

        <!-- 关于 -->
        <div class="setting-item">
          <label class="setting-label">
            <span class="icon">ℹ️</span>
            关于
          </label>
          <div class="about-info">
            <p>FocusWrite v1.0.0</p>
            <p>一款极简的专注写作工具</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  visible: Boolean,
  config: Object,
  recentFiles: Array
})

const emit = defineEmits(['close', 'setWorkDir', 'removeRecent', 'clearRecent'])

const workDir = computed(() => props.config?.workDirectory || '')

const close = () => {
  emit('close')
}

const handleOverlayClick = () => {
  close()
}

const selectWorkDirectory = () => {
  emit('setWorkDir')
}

const removeRecentFile = (path) => {
  emit('removeRecent', path)
}

const clearAllRecent = () => {
  if (confirm('确定要清空所有最近文件记录吗？')) {
    emit('clearRecent')
  }
}
</script>

<style scoped>
.settings-modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
  backdrop-filter: blur(4px);
}

.settings-modal {
  background: #252525;
  border-radius: 12px;
  width: 90%;
  max-width: 500px;
  max-height: 80vh;
  overflow: hidden;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
  border: 1px solid #333;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 24px;
  border-bottom: 1px solid #333;
}

.modal-header h3 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: #e0e0e0;
}

.close-btn {
  background: none;
  border: none;
  color: #888;
  font-size: 24px;
  cursor: pointer;
  padding: 0;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 6px;
  transition: all 0.2s;
}

.close-btn:hover {
  background: rgba(255, 255, 255, 0.1);
  color: #fff;
}

.modal-content {
  padding: 24px;
  overflow-y: auto;
  max-height: calc(80vh - 73px);
}

.setting-item {
  margin-bottom: 28px;
}

.setting-item:last-child {
  margin-bottom: 0;
}

.setting-label {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  font-weight: 500;
  color: #ccc;
  margin-bottom: 12px;
}

.setting-label .icon {
  font-size: 16px;
}

.setting-control {
  display: flex;
  gap: 12px;
  align-items: center;
}

.path-display {
  flex: 1;
  padding: 10px 14px;
  background: rgba(0, 0, 0, 0.2);
  border-radius: 6px;
  font-size: 13px;
  color: #888;
  font-family: 'Consolas', monospace;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.setting-desc {
  margin: 8px 0 0;
  font-size: 12px;
  color: #666;
}

.btn-secondary {
  padding: 8px 16px;
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid #444;
  color: #ccc;
  cursor: pointer;
  border-radius: 6px;
  font-size: 13px;
  transition: all 0.2s;
  white-space: nowrap;
}

.btn-secondary:hover {
  background: rgba(255, 255, 255, 0.15);
  border-color: #555;
}

.recent-files-list {
  background: rgba(0, 0, 0, 0.2);
  border-radius: 8px;
  overflow: hidden;
  margin-bottom: 12px;
}

.recent-file-item {
  display: flex;
  align-items: center;
  padding: 12px 14px;
  border-bottom: 1px solid #333;
  gap: 12px;
}

.recent-file-item:last-child {
  border-bottom: none;
}

.file-name {
  flex: 1;
  font-size: 13px;
  color: #aaa;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.file-time {
  font-size: 12px;
  color: #666;
  white-space: nowrap;
}

.remove-btn {
  background: none;
  border: none;
  color: #666;
  cursor: pointer;
  font-size: 18px;
  padding: 0 4px;
  line-height: 1;
  transition: color 0.2s;
}

.remove-btn:hover {
  color: #ff5555;
}

.no-files {
  padding: 24px;
  text-align: center;
  color: #555;
  font-size: 13px;
}

.btn-text {
  background: none;
  border: none;
  color: #888;
  cursor: pointer;
  font-size: 12px;
  padding: 0;
  text-decoration: underline;
  transition: color 0.2s;
}

.btn-text:hover {
  color: #aaa;
}

.about-info {
  padding: 12px 14px;
  background: rgba(0, 0, 0, 0.2);
  border-radius: 8px;
}

.about-info p {
  margin: 0 0 4px;
  font-size: 13px;
  color: #888;
}

.about-info p:last-child {
  margin-bottom: 0;
}
</style>
