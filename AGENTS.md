# AGENTS.md - FocusWrite Coding Guidelines

This file provides guidelines for AI coding agents working on the FocusWrite project.

## Project Overview

FocusWrite is a minimalist writing application built with Electron + Vue 3 + Vite + Pinia.

## Build & Development Commands

```bash
# Development with Electron (推荐 - 完整功能)
npm run dev

# Development (Vite dev server only - Electron API 不可用)
npm run dev:vite

# Production build
npm run build

# Preview production build
npm run preview

# Run Electron app (requires build first)
npm run electron

# Build and package Electron app
npm run electron:build
```

**重要提示:** 必须使用 `npm run dev` 启动才能使用文件保存等 Electron 功能。`npm run dev:vite` 仅用于纯前端 UI 调试。

**Note:** This project does not currently have linting or testing configured.

## Project Structure

```
focusWriter/
├── electron/              # Electron main process
│   ├── main.js           # Main process entry
│   ├── preload.js        # Preload script (IPC bridge)
│   └── config/           # Configuration managers
├── src/
│   ├── components/       # Vue components
│   ├── store/            # Pinia stores
│   ├── App.vue
│   └── main.js           # Renderer entry
├── dist/                 # Build output
├── index.html
├── package.json
└── vite.config.js
```

## Code Style Guidelines

### JavaScript/Node.js

- Use **ES modules** (`import`/`export`) throughout
- Prefer **async/await** over callbacks/Promises
- Use **semicolons** (optional but be consistent)
- Use **single quotes** for strings
- Error handling: return `{ success: false, error: message }` pattern for IPC handlers

### Vue 3 Composition API

- Use `<script setup>` syntax exclusively
- Use `ref()` and `computed()` from Vue
- Use `storeToRefs()` for Pinia store destructuring
- Define reactive state at top, computed properties next, then functions

**Example:**
```vue
<script setup>
import { ref, computed } from 'vue'
import { useFocusStore } from '../store/focusStore'
import { storeToRefs } from 'pinia'

const store = useFocusStore()
const { currentLine, wordCount } = storeToRefs(store)

const inputRef = ref(null)
const showModal = ref(false)

const hasContent = computed(() => wordCount.value > 0)

const handleSubmit = async () => {
  // implementation
}
</script>
```

### Pinia Store Pattern

Use the setup store style:

```javascript
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useStoreName = defineStore('storeId', () => {
  // State
  const state = ref('')
  
  // Getters
  const getter = computed(() => state.value)
  
  // Actions
  const action = async () => {
    // implementation
  }
  
  return { state, getter, action }
})
```

### Electron IPC Communication

**Main Process (electron/main.js):**
```javascript
ipcMain.handle('channel:name', async (event, params) => {
  try {
    // Do work
    return { success: true, data }
  } catch (error) {
    return { success: false, error: error.message }
  }
})
```

**Preload (electron/preload.js):**
```javascript
contextBridge.exposeInMainWorld('electronAPI', {
  methodName: (params) => ipcRenderer.invoke('channel:name', params)
})
```

**Renderer (Vue component):**
```javascript
const result = await window.electronAPI.methodName(params)
if (result.success) {
  // handle success
} else {
  // handle error
}
```

### Import Order

1. External libraries (Vue, Electron)
2. Internal modules (stores, components)
3. Relative imports (../store/, ./components/)

### Naming Conventions

- **Components:** PascalCase (`FocusWriter.vue`, `SettingsModal.vue`)
- **Stores:** camelCase with `use` prefix (`useFocusStore.js`)
- **Functions:** camelCase (`handleEnter`, `submitLine`)
- **Constants:** UPPER_SNAKE_CASE (if needed)
- **IPC Channels:** lowercase with colons (`file:open`, `config:get`)

### Styling (Vue Components)

- Use `<style scoped>` in components
- CSS classes: kebab-case (`.filename-display`, `.btn-primary`)
- Use flexbox for layouts
- Colors: use the existing dark theme palette (#1e1e1e, #4a9eff, etc.)

### Error Handling

Always wrap async operations in try/catch:

```javascript
try {
  const result = await someAsyncOperation()
  return { success: true, data: result }
} catch (error) {
  console.error('Descriptive error message:', error)
  return { success: false, error: error.message }
}
```

### Comments

- Use Chinese comments for UI-related code (matching existing codebase)
- Use English for technical/algorithmic explanations
- Keep comments concise and meaningful

### File Operations

- Use `fs/promises` for async file operations
- Always use UTF-8 encoding
- Verify file existence before operations when needed

## Common Tasks

### Adding a New IPC Channel

1. Add handler in `electron/main.js`
2. Expose in `electron/preload.js`
3. Use in Vue component via `window.electronAPI`

### Adding a New Component

1. Create `.vue` file in `src/components/`
2. Use `<script setup>` syntax
3. Import and use in parent component
4. Follow existing component structure

### Adding Store State

1. Add `ref()` in `focusStore.js`
2. Add computed getter if needed
3. Add action to modify state
4. Export in return statement

## Important Notes

- Always check `window.electronAPI` availability before using IPC
- The app uses a dark theme by default
- File operations should update recent files list
- Auto-save triggers on line submission when file path exists
- Chinese is used for UI text and comments throughout