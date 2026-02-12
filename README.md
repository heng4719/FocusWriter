
# 需求规格说明书 (PRD) - "FocusWrite" 专注写作软件

## 1. 项目概述

**项目名称：** FocusWrite
**核心定位：** 一款基于 Electron 的极简写作工具，通过“单行可见”机制消除写作时的反复修改欲望，提升创作效率。
**技术栈：** - **框架:** Electron.js (桌面端壳)

* **前端:** Vue 3 (Composition API)
* **构建工具:** Vite
* **状态管理:** Pinia 或 Vue 响应式状态

---

## 2. 界面布局 (UI Layout)

界面采用全屏/窗口化设计，保持绝对简洁，无侧边栏。

| 位置 | 组件名称 | 功能描述 |
| --- | --- | --- |
| **左上角** | `FileNameDisplay` | 显示当前打开/编辑的文件名（如：`my_novel.txt`）。 |
| **右上角** | `FileControls` | 包含两个按钮：`打开文件 (Open)` 和 `新建文件 (New)`。 |
| **正中央 (上)** | `PreviousLineViewer` | **核心组件**：展示用户刚刚输入完成的那一行文字。字号略小，颜色较浅。 |
| **正中央 (下)** | `ActiveInput` | **核心组件**：单行输入框（Input），用于当前文字输入。 |
| **右下角** | `WordCounter` | 实时显示当前文档的总字符数。 |

---

## 3. 核心交互逻辑 (Core Logic)

### 3.1 写入机制 (Focus Mechanism)

1. **输入状态**：用户在 `ActiveInput` 中输入文字。
2. **提交动作**：用户按下 `Enter` 键。
3. **状态流转**：
* 将 `ActiveInput` 的内容追加到内存中的文档完整字符串末尾。
* 自动在内容末尾添加换行符 `\n`。
* **更新显示**：将 `ActiveInput` 的内容移动到 `PreviousLineViewer` 区域。
* **清空输入**：清空 `ActiveInput` 框，等待下一行输入。


4. **视觉限制**：用户**无法**在界面上直接看到或滚动查看除了“上一行”之外的历史内容。

### 3.2 文件处理 (File I/O)

* **新建文件**：触发 Electron `showSaveDialog`，创建 `.txt` 文件并初始化内存状态。
* **打开文件**：触发 Electron `showOpenDialog`，读取内容。
* **实时保存**：每当按下 `Enter` 键后，程序应异步将全量内容写入磁盘，防止数据丢失。

---

## 4. 技术实现细节 (Technical Specs)

### 4.1 目录结构建议

```text
/src
  /main          # Electron 主进程逻辑 (文件系统 I/O)
  /renderer      # Vue 前端代码
    /components  # UI 组件
    /store       # 状态管理 (当前文本内容、字数、路径)

```

### 4.2 关键 API (IPC 通讯)

AI Agent 需要实现以下 IPC 通道：

* `file:open`: 调用原生对话框打开文件。
* `file:save`: 执行磁盘写入。
* `file:new`: 路径初始化。

### 4.3 样式指南 (CSS)

* **背景**：深色模式或护眼色（如 `#f5f5f5` 或 `#1e1e1e`）。
* **字体**：等宽字体（Monospace）或优雅的衬线体。
* **动画**：当按下回车时，文字向上位移的过渡动画（可选，增加丝滑感）。

---

## 5. 待办任务清单 (Task List for AI)

1. [ ] 初始化 Vite + Vue 3 + Electron 开发环境。
2. [ ] 实现 Electron 主进程与渲染进程的 `IPC` 文件读写桥接。
3. [ ] 编写 `FocusStore`，管理 `currentLine`, `previousLine`, `fullContent`。
4. [ ] 构筑 UI 界面，确保正中央输入框自动获取焦点。
5. [ ] 实现 `Enter` 键触发的逻辑循环。
6. [ ] 实现右下角字数统计逻辑（需过滤空白字符）。

---