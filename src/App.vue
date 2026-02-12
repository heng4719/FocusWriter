<template>
  <div class="app">
    <TitleBar />
    <div class="content-area">
      <FocusWriter />
    </div>
  </div>
</template>

<script setup>
import TitleBar from './components/TitleBar.vue'
import FocusWriter from './components/FocusWriter.vue'
</script>

<style scoped>
.app {
  width: 100vw;
  height: 100vh;
  background: #1e1e1e;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.content-area {
  flex: 1;
  display: flex;
  justify-content: center;
  align-items: center;
  overflow: hidden;
}
</style>
