<template>
  <div v-if="visible" class="first-save-modal-overlay" @click="handleOverlayClick">
    <div class="first-save-modal" @click.stop>
      <div class="modal-header">
        <h3>选择保存位置</h3>
        <p class="modal-subtitle">这是你第一次保存，请选择文件的保存位置</p>
      </div>
      
      <div class="modal-content">
        <!-- 使用默认工作目录 -->
        <button @click="useDefault" class="save-option primary">
          <span class="option-icon">📁</span>
          <div class="option-content">
            <span class="option-title">使用默认工作目录</span>
            <span class="option-desc">自动创建并保存到 Documents/FocusWrite</span>
          </div>
        </button>

        <!-- 选择其他位置 -->
        <button @click="selectCustom" class="save-option secondary">
          <span class="option-icon">📂</span>
          <div class="option-content">
            <span class="option-title">选择其他位置</span>
            <span class="option-desc">自定义保存位置和文件名</span>
          </div>
        </button>

        <!-- 取消 -->
        <button @click="cancel" class="btn-cancel">
          稍后再说
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
const props = defineProps({
  visible: Boolean
})

const emit = defineEmits(['close', 'useDefault', 'selectCustom'])

const handleOverlayClick = () => {
  // 点击遮罩层不关闭，必须选择或取消
}

const useDefault = () => {
  emit('useDefault')
}

const selectCustom = () => {
  emit('selectCustom')
}

const cancel = () => {
  emit('close')
}
</script>

<style scoped>
.first-save-modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
  backdrop-filter: blur(6px);
}

.first-save-modal {
  background: #252525;
  border-radius: 16px;
  width: 90%;
  max-width: 420px;
  padding: 32px;
  box-shadow: 0 24px 80px rgba(0, 0, 0, 0.6);
  border: 1px solid #333;
}

.modal-header {
  text-align: center;
  margin-bottom: 28px;
}

.modal-header h3 {
  margin: 0 0 8px;
  font-size: 20px;
  font-weight: 600;
  color: #e0e0e0;
}

.modal-subtitle {
  margin: 0;
  font-size: 14px;
  color: #888;
}

.modal-content {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.save-option {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 20px;
  border-radius: 12px;
  border: 2px solid transparent;
  cursor: pointer;
  transition: all 0.2s;
  text-align: left;
  background: rgba(255, 255, 255, 0.05);
}

.save-option:hover {
  transform: translateY(-2px);
}

.save-option.primary {
  background: rgba(74, 158, 255, 0.15);
  border-color: rgba(74, 158, 255, 0.3);
}

.save-option.primary:hover {
  background: rgba(74, 158, 255, 0.2);
  border-color: rgba(74, 158, 255, 0.5);
  box-shadow: 0 8px 24px rgba(74, 158, 255, 0.2);
}

.save-option.secondary {
  background: rgba(255, 255, 255, 0.08);
  border-color: #444;
}

.save-option.secondary:hover {
  background: rgba(255, 255, 255, 0.12);
  border-color: #666;
}

.option-icon {
  font-size: 28px;
}

.option-content {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.option-title {
  font-size: 15px;
  font-weight: 500;
  color: #e0e0e0;
}

.option-desc {
  font-size: 13px;
  color: #888;
}

.btn-cancel {
  margin-top: 8px;
  padding: 12px;
  background: transparent;
  border: none;
  color: #666;
  cursor: pointer;
  font-size: 14px;
  transition: color 0.2s;
}

.btn-cancel:hover {
  color: #888;
}
</style>
