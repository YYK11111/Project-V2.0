# Isle Editor Subapp Knowledge Replacement Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 在仓库中新增独立前端子应用 `knowledge-editor-app`，让它内部使用 `Tiptap 2 + isle-editor`，并通过主前端宿主组件替换 `aev`、`view`、`detail` 三处知识正文链路。

**Architecture:** `knowledge-editor-app` 独立维护 `Tiptap 2 + isle-editor`，通过 `/editor` 和 `/viewer` 页面承接编辑和只读模式。主前端 `nest-admin-frontend` 不直接引入这套依赖，而是通过 `KnowledgeEditorHost.vue` / `KnowledgeViewerHost.vue` 用 iframe + `postMessage` 通信方式接入。旧数据不兼容，统一阻断。

**Tech Stack:** Vue 3, Vite, TypeScript, Tiptap 2, Isle Editor, Element Plus, Vitest

---

### Task 1: 新建 `knowledge-editor-app` 子应用骨架与消息协议基础

**Files:**
- Create: `knowledge-editor-app/package.json`
- Create: `knowledge-editor-app/vite.config.ts`
- Create: `knowledge-editor-app/tsconfig.json`
- Create: `knowledge-editor-app/index.html`
- Create: `knowledge-editor-app/src/main.ts`
- Create: `knowledge-editor-app/src/App.vue`
- Create: `knowledge-editor-app/src/router/index.ts`
- Create: `knowledge-editor-app/src/core/documentMessages.ts`
- Create: `knowledge-editor-app/src/core/documentMessages.spec.ts`

- [ ] **Step 1: 写失败测试，约束消息协议常量和初始化消息结构**

```ts
import { describe, expect, it } from 'vitest'

import {
  KNOWLEDGE_EDITOR_MESSAGE,
  createInitMessage,
} from './documentMessages'

describe('knowledge editor subapp messages', () => {
  it('暴露稳定的消息类型常量', () => {
    expect(KNOWLEDGE_EDITOR_MESSAGE).toEqual({
      init: 'knowledge-editor:init',
      updateContent: 'knowledge-editor:update-content',
      setDisabled: 'knowledge-editor:set-disabled',
      dispose: 'knowledge-editor:dispose',
      ready: 'knowledge-editor:ready',
      contentChange: 'knowledge-editor:content-change',
      heightChange: 'knowledge-editor:height-change',
      tocChange: 'knowledge-editor:toc-change',
      blocked: 'knowledge-editor:blocked',
      error: 'knowledge-editor:error',
    })
  })

  it('createInitMessage 生成初始化消息', () => {
    expect(createInitMessage({
      mode: 'edit',
      content: { type: 'isle_editor', version: 1, content: [] },
      disabled: false,
      articleId: '123',
    })).toEqual({
      type: 'knowledge-editor:init',
      payload: {
        mode: 'edit',
        content: { type: 'isle_editor', version: 1, content: [] },
        disabled: false,
        articleId: '123',
      },
    })
  })
})
```

- [ ] **Step 2: 运行测试并确认失败**

Run: `npm run test:unit -- src/core/documentMessages.spec.ts`

Expected: FAIL，原因是子应用骨架和协议文件尚未创建。

- [ ] **Step 3: 写最小实现，建立子应用骨架和消息协议**

```json
{
  "name": "knowledge-editor-app",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "test:unit": "vitest run",
    "type-check": "vue-tsc --build --force"
  },
  "dependencies": {
    "vue": "^3.5.26",
    "vue-router": "^4.6.4",
    "@isle-editor/core": "0.0.11",
    "@isle-editor/vue3": "0.0.11",
    "@tiptap/core": "^2.10.3",
    "@tiptap/pm": "^2.10.3"
  },
  "devDependencies": {
    "vite": "^7.3.1",
    "typescript": "~5.9.3",
    "vitest": "^3.2.4",
    "vue-tsc": "^3.2.6",
    "@vitejs/plugin-vue": "^6.0.3"
  }
}
```

```ts
// documentMessages.ts
export const KNOWLEDGE_EDITOR_MESSAGE = {
  init: 'knowledge-editor:init',
  updateContent: 'knowledge-editor:update-content',
  setDisabled: 'knowledge-editor:set-disabled',
  dispose: 'knowledge-editor:dispose',
  ready: 'knowledge-editor:ready',
  contentChange: 'knowledge-editor:content-change',
  heightChange: 'knowledge-editor:height-change',
  tocChange: 'knowledge-editor:toc-change',
  blocked: 'knowledge-editor:blocked',
  error: 'knowledge-editor:error',
} as const

export function createInitMessage(payload: {
  mode: 'edit' | 'view'
  content: unknown
  disabled?: boolean
  articleId?: string
}) {
  return {
    type: KNOWLEDGE_EDITOR_MESSAGE.init,
    payload,
  }
}
```

```ts
// main.ts
import { createApp } from 'vue'
import App from './App.vue'
import router from './router'

createApp(App).use(router).mount('#app')
```

```vue
<!-- App.vue -->
<template>
  <router-view />
</template>
```

- [ ] **Step 4: 安装子应用依赖并运行测试确认通过**

Run: `npm install`

Expected: PASS，生成 `knowledge-editor-app/package-lock.json`。

Run: `npm run test:unit -- src/core/documentMessages.spec.ts`

Expected: PASS。

- [ ] **Step 5: 提交当前任务改动**

```bash
git add knowledge-editor-app/package.json knowledge-editor-app/package-lock.json knowledge-editor-app/vite.config.ts knowledge-editor-app/tsconfig.json knowledge-editor-app/index.html knowledge-editor-app/src/main.ts knowledge-editor-app/src/App.vue knowledge-editor-app/src/router/index.ts knowledge-editor-app/src/core/documentMessages.ts knowledge-editor-app/src/core/documentMessages.spec.ts
git commit -m "feat: scaffold knowledge editor subapp"
```

### Task 2: 建立子应用正文守卫与 `postMessage` 桥接

**Files:**
- Create: `knowledge-editor-app/src/core/documentGuards.ts`
- Create: `knowledge-editor-app/src/core/documentBridge.ts`
- Create: `knowledge-editor-app/src/core/documentGuards.spec.ts`
- Create: `knowledge-editor-app/src/core/documentBridge.spec.ts`

- [ ] **Step 1: 写失败测试，约束新格式识别、旧数据阻断和消息发送包装**

```ts
import { describe, expect, it, vi } from 'vitest'

import { createKnowledgeDocumentBridge } from './documentBridge'
import { createKnowledgeSubappEmptyDocument, getKnowledgeSubappDocumentMode, isKnowledgeSubappDocument } from './documentGuards'

describe('knowledge editor subapp guards', () => {
  it('空文档初始化为新格式', () => {
    expect(createKnowledgeSubappEmptyDocument()).toEqual({
      type: 'isle_editor',
      version: 1,
      content: [],
    })
  })

  it('旧 HTML 阻断', () => {
    expect(getKnowledgeSubappDocumentMode({
      content: '<p>legacy</p>',
      contentJson: null,
      contentStatus: 'legacy_html',
    })).toEqual({
      mode: 'blocked',
      reason: 'legacy_html',
    })
  })

  it('新格式识别成功', () => {
    expect(isKnowledgeSubappDocument({
      type: 'isle_editor',
      version: 1,
      content: [],
    })).toBe(true)
  })
})

describe('knowledge editor subapp bridge', () => {
  it('发送消息时包装固定结构', () => {
    const postMessage = vi.fn()
    const bridge = createKnowledgeDocumentBridge({ postMessage })

    bridge.sendReady()

    expect(postMessage).toHaveBeenCalledWith({
      type: 'knowledge-editor:ready',
      payload: {},
    }, '*')
  })
})
```

- [ ] **Step 2: 运行测试并确认失败**

Run: `npm run test:unit -- src/core/documentGuards.spec.ts src/core/documentBridge.spec.ts`

Expected: FAIL。

- [ ] **Step 3: 写最小实现，建立守卫与 bridge**

```ts
// documentGuards.ts
export function createKnowledgeSubappEmptyDocument() {
  return {
    type: 'isle_editor',
    version: 1,
    content: [],
  }
}

export function isKnowledgeSubappDocument(value: unknown): value is { type: 'isle_editor'; version: 1; content: unknown[] } {
  return typeof value === 'object'
    && value !== null
    && 'type' in value
    && 'version' in value
    && 'content' in value
    && (value as { type: string }).type === 'isle_editor'
    && (value as { version: number }).version === 1
    && Array.isArray((value as { content: unknown[] }).content)
}

export function getKnowledgeSubappDocumentMode(input: { content?: string | null; contentJson?: unknown; contentStatus?: string | null }) {
  if (input.contentStatus === 'legacy_html') {
    return { mode: 'blocked' as const, reason: 'legacy_html' as const }
  }

  if (isKnowledgeSubappDocument(input.contentJson)) {
    return { mode: 'ready' as const, document: input.contentJson }
  }

  if (typeof input.content === 'string' && input.content.trim()) {
    return { mode: 'blocked' as const, reason: 'legacy_html' as const }
  }

  if (input.contentJson) {
    return { mode: 'blocked' as const, reason: 'invalid_document' as const }
  }

  return { mode: 'ready' as const, document: createKnowledgeSubappEmptyDocument() }
}

// documentBridge.ts
import { KNOWLEDGE_EDITOR_MESSAGE } from './documentMessages'

export function createKnowledgeDocumentBridge(target: { postMessage: (message: unknown, origin: string) => void }) {
  return {
    sendReady() {
      target.postMessage({ type: KNOWLEDGE_EDITOR_MESSAGE.ready, payload: {} }, '*')
    },
    sendBlocked(reason: 'legacy_html' | 'invalid_document') {
      target.postMessage({ type: KNOWLEDGE_EDITOR_MESSAGE.blocked, payload: { reason } }, '*')
    },
    sendContentChange(content: unknown) {
      target.postMessage({ type: KNOWLEDGE_EDITOR_MESSAGE.contentChange, payload: { content } }, '*')
    },
    sendHeightChange(height: number) {
      target.postMessage({ type: KNOWLEDGE_EDITOR_MESSAGE.heightChange, payload: { height } }, '*')
    },
  }
}
```

- [ ] **Step 4: 运行测试确认通过**

Run: `npm run test:unit -- src/core/documentGuards.spec.ts src/core/documentBridge.spec.ts`

Expected: PASS。

- [ ] **Step 5: 提交当前任务改动**

```bash
git add knowledge-editor-app/src/core/documentGuards.ts knowledge-editor-app/src/core/documentBridge.ts knowledge-editor-app/src/core/documentGuards.spec.ts knowledge-editor-app/src/core/documentBridge.spec.ts
git commit -m "feat: add subapp document bridge and guards"
```

### Task 3: 打通子应用 `EditorPage.vue` 与 `ViewerPage.vue`

**Files:**
- Create: `knowledge-editor-app/src/core/createIsleEditor.ts`
- Create: `knowledge-editor-app/src/core/createIsleViewer.ts`
- Create: `knowledge-editor-app/src/components/EditorShell.vue`
- Create: `knowledge-editor-app/src/components/ViewerShell.vue`
- Create: `knowledge-editor-app/src/pages/EditorPage.vue`
- Create: `knowledge-editor-app/src/pages/ViewerPage.vue`
- Create: `knowledge-editor-app/src/pages/editorPages.spec.ts`
- Create: `knowledge-editor-app/src/styles/editor.css`

- [ ] **Step 1: 写失败测试，约束编辑页、只读页可挂载并具备根容器**

```ts
// @vitest-environment jsdom
import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

import EditorPage from './EditorPage.vue'
import ViewerPage from './ViewerPage.vue'

describe('knowledge editor subapp pages', () => {
  it('EditorPage 可挂载', () => {
    const wrapper = mount(EditorPage)
    expect(wrapper.find('.editor-page').exists()).toBe(true)
  })

  it('ViewerPage 可挂载', () => {
    const wrapper = mount(ViewerPage)
    expect(wrapper.find('.viewer-page').exists()).toBe(true)
  })
})
```

- [ ] **Step 2: 运行测试并确认失败**

Run: `npm run test:unit -- src/pages/editorPages.spec.ts`

Expected: FAIL。

- [ ] **Step 3: 写最小实现，建立编辑页与只读页骨架**

```vue
<!-- EditorPage.vue -->
<template>
  <div class="editor-page">
    <EditorShell />
  </div>
</template>

<script setup lang="ts">
import EditorShell from '../components/EditorShell.vue'
</script>
```

```vue
<!-- ViewerPage.vue -->
<template>
  <div class="viewer-page">
    <ViewerShell />
  </div>
</template>

<script setup lang="ts">
import ViewerShell from '../components/ViewerShell.vue'
</script>
```

- [ ] **Step 4: 运行测试确认通过**

Run: `npm run test:unit -- src/pages/editorPages.spec.ts`

Expected: PASS。

- [ ] **Step 5: 提交当前任务改动**

```bash
git add knowledge-editor-app/src/core/createIsleEditor.ts knowledge-editor-app/src/core/createIsleViewer.ts knowledge-editor-app/src/components/EditorShell.vue knowledge-editor-app/src/components/ViewerShell.vue knowledge-editor-app/src/pages/EditorPage.vue knowledge-editor-app/src/pages/ViewerPage.vue knowledge-editor-app/src/pages/editorPages.spec.ts knowledge-editor-app/src/styles/editor.css
git commit -m "feat: scaffold editor subapp pages"
```

### Task 4: 在主前端建立 `KnowledgeEditorHost.vue` / `KnowledgeViewerHost.vue`

**Files:**
- Create: `nest-admin-frontend/src/features/knowledge-editor-host/core/hostMessages.ts`
- Create: `nest-admin-frontend/src/features/knowledge-editor-host/KnowledgeEditorHost.vue`
- Create: `nest-admin-frontend/src/features/knowledge-editor-host/KnowledgeViewerHost.vue`
- Create: `nest-admin-frontend/src/features/knowledge-editor-host/knowledgeHosts.spec.ts`

- [ ] **Step 1: 写失败测试，约束宿主组件可挂 iframe 并接收最小入参**

```ts
// @vitest-environment jsdom
import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

import KnowledgeEditorHost from './KnowledgeEditorHost.vue'
import KnowledgeViewerHost from './KnowledgeViewerHost.vue'

describe('knowledge editor hosts', () => {
  it('KnowledgeEditorHost 渲染 iframe 容器', () => {
    const wrapper = mount(KnowledgeEditorHost, {
      props: {
        contentJson: { type: 'isle_editor', version: 1, content: [] },
        disabled: false,
      },
    })
    expect(wrapper.find('iframe').exists()).toBe(true)
  })

  it('KnowledgeViewerHost 渲染 iframe 容器', () => {
    const wrapper = mount(KnowledgeViewerHost, {
      props: {
        contentJson: { type: 'isle_editor', version: 1, content: [] },
      },
    })
    expect(wrapper.find('iframe').exists()).toBe(true)
  })
})
```

- [ ] **Step 2: 运行测试并确认失败**

Run: `npm run test:unit -- src/features/knowledge-editor-host/knowledgeHosts.spec.ts`

Expected: FAIL。

- [ ] **Step 3: 写最小实现，建立宿主组件与消息常量**

```ts
// hostMessages.ts
export const KNOWLEDGE_EDITOR_SUBAPP_URL = '/knowledge-editor-app'
```

```vue
<template>
  <iframe class="knowledge-editor-host__frame" :src="`${baseUrl}/editor`"></iframe>
</template>

<script setup lang="ts">
import { KNOWLEDGE_EDITOR_SUBAPP_URL } from './core/hostMessages'

defineProps<{
  contentJson: unknown
  disabled?: boolean
}>()

const baseUrl = KNOWLEDGE_EDITOR_SUBAPP_URL
</script>
```

```vue
<template>
  <iframe class="knowledge-viewer-host__frame" :src="`${baseUrl}/viewer`"></iframe>
</template>

<script setup lang="ts">
import { KNOWLEDGE_EDITOR_SUBAPP_URL } from './core/hostMessages'

defineProps<{
  contentJson: unknown
}>()

const baseUrl = KNOWLEDGE_EDITOR_SUBAPP_URL
</script>
```

- [ ] **Step 4: 运行测试确认通过**

Run: `npm run test:unit -- src/features/knowledge-editor-host/knowledgeHosts.spec.ts`

Expected: PASS。

- [ ] **Step 5: 提交当前任务改动**

```bash
git add nest-admin-frontend/src/features/knowledge-editor-host/core/hostMessages.ts nest-admin-frontend/src/features/knowledge-editor-host/KnowledgeEditorHost.vue nest-admin-frontend/src/features/knowledge-editor-host/KnowledgeViewerHost.vue nest-admin-frontend/src/features/knowledge-editor-host/knowledgeHosts.spec.ts
git commit -m "feat: add knowledge editor host components"
```

### Task 5: 替换 `aev.vue` 到 `KnowledgeEditorHost.vue`

**Files:**
- Modify: `nest-admin-frontend/src/views/content/articleManage/aev.vue`
- Create: `nest-admin-frontend/src/views/content/articleManage/aev.subapp.spec.ts`

- [ ] **Step 1: 写失败测试，约束 `aev` 使用 `KnowledgeEditorHost` 并移除旧正文编辑主链路**

```ts
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

function readAev() {
  return readFileSync(resolve(__dirname, 'aev.vue'), 'utf-8')
}

describe('aev subapp replacement', () => {
  it('aev 正文区使用 KnowledgeEditorHost', () => {
    const source = readAev()
    expect(source).toContain('KnowledgeEditorHost')
    expect(source).not.toContain('DocumentEditorV2')
    expect(source).not.toContain('NotionDocumentEditor')
  })
})
```

- [ ] **Step 2: 运行测试并确认失败**

Run: `npm run test:unit -- src/views/content/articleManage/aev.subapp.spec.ts`

Expected: FAIL。

- [ ] **Step 3: 修改 `aev` 接入 `KnowledgeEditorHost` 并保留业务逻辑**

```vue
<KnowledgeEditorHost
  v-model:content-json="form.contentJson"
  :disabled="!canEditCurrentArticle" />
```

- [ ] **Step 4: 运行测试确认替换通过**

Run: `npm run test:unit -- src/views/content/articleManage/aev.subapp.spec.ts`

Expected: PASS。

- [ ] **Step 5: 提交当前任务改动**

```bash
git add nest-admin-frontend/src/views/content/articleManage/aev.vue nest-admin-frontend/src/views/content/articleManage/aev.subapp.spec.ts
git commit -m "feat: switch aev to subapp host"
```

### Task 6: 替换 `view.vue` / `detail.vue` 到 `KnowledgeViewerHost.vue`

**Files:**
- Modify: `nest-admin-frontend/src/views/content/articleManage/view.vue`
- Modify: `nest-admin-frontend/src/views/content/articleManage/detail.vue`
- Create: `nest-admin-frontend/src/views/content/articleManage/view.subapp.spec.ts`
- Create: `nest-admin-frontend/src/views/content/articleManage/detail.subapp.spec.ts`

- [ ] **Step 1: 写失败测试，约束查看和详情页使用 `KnowledgeViewerHost` 并移除旧只读链路**

```ts
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

function readView() {
  return readFileSync(resolve(__dirname, 'view.vue'), 'utf-8')
}

function readDetail() {
  return readFileSync(resolve(__dirname, 'detail.vue'), 'utf-8')
}

describe('knowledge view/detail subapp replacement', () => {
  it('view 页面使用 KnowledgeViewerHost', () => {
    const source = readView()
    expect(source).toContain('KnowledgeViewerHost')
    expect(source).not.toContain('useEditor(')
    expect(source).not.toContain('EditorContent')
  })

  it('detail 页面使用 KnowledgeViewerHost', () => {
    const source = readDetail()
    expect(source).toContain('KnowledgeViewerHost')
    expect(source).not.toContain('useEditor(')
    expect(source).not.toContain('EditorContent')
  })
})
```

- [ ] **Step 2: 运行测试并确认失败**

Run: `npm run test:unit -- src/views/content/articleManage/view.subapp.spec.ts src/views/content/articleManage/detail.subapp.spec.ts`

Expected: FAIL。

- [ ] **Step 3: 修改 `view` 与 `detail` 接入 `KnowledgeViewerHost`**

```vue
<KnowledgeViewerHost :content-json="article.contentJson" />
```

- [ ] **Step 4: 运行测试确认替换通过**

Run: `npm run test:unit -- src/views/content/articleManage/view.subapp.spec.ts src/views/content/articleManage/detail.subapp.spec.ts`

Expected: PASS。

- [ ] **Step 5: 提交当前任务改动**

```bash
git add nest-admin-frontend/src/views/content/articleManage/view.vue nest-admin-frontend/src/views/content/articleManage/detail.vue nest-admin-frontend/src/views/content/articleManage/view.subapp.spec.ts nest-admin-frontend/src/views/content/articleManage/detail.subapp.spec.ts
git commit -m "feat: switch knowledge viewers to subapp host"
```

### Task 7: 全链路验证与试用前收尾

**Files:**
- Modify: `knowledge-editor-app/**/*`
- Modify: `nest-admin-frontend/src/features/knowledge-editor-host/**/*`
- Modify: `nest-admin-frontend/src/views/content/articleManage/aev.vue`
- Modify: `nest-admin-frontend/src/views/content/articleManage/view.vue`
- Modify: `nest-admin-frontend/src/views/content/articleManage/detail.vue`

- [ ] **Step 1: 运行子应用与主前端相关测试**

Run: `npm run test:unit -- src/core/documentMessages.spec.ts src/core/documentGuards.spec.ts src/core/documentBridge.spec.ts src/pages/editorPages.spec.ts`（目录：`knowledge-editor-app`）

Expected: PASS。

Run: `npm run test:unit -- src/features/knowledge-editor-host/knowledgeHosts.spec.ts src/views/content/articleManage/aev.subapp.spec.ts src/views/content/articleManage/view.subapp.spec.ts src/views/content/articleManage/detail.subapp.spec.ts`（目录：`nest-admin-frontend`）

Expected: PASS。

- [ ] **Step 2: 分别运行两个前端的类型检查**

Run: `npm run type-check`（目录：`knowledge-editor-app`）

Expected: PASS。

Run: `npm run type-check`（目录：`nest-admin-frontend`）

Expected: PASS。

- [ ] **Step 3: 做手工验证并修正发现的问题**

```txt
验证清单：
1. 子应用可独立启动
2. aev 正文区可加载编辑 iframe
3. 输入正文后主前端能收到内容变化
4. view / detail 可加载只读 iframe
5. iframe 高度可同步
6. 旧数据能正确阻断
```

- [ ] **Step 4: 检查工作区差异仅包含独立子应用与宿主替换相关改动**

Run: `git status --short`

Expected: 仅包含 `knowledge-editor-app`、`knowledge-editor-host` 和 `aev/view/detail` 改动。

- [ ] **Step 5: 生成最终提交**

```bash
git add knowledge-editor-app nest-admin-frontend/src/features/knowledge-editor-host nest-admin-frontend/src/views/content/articleManage/aev.vue nest-admin-frontend/src/views/content/articleManage/view.vue nest-admin-frontend/src/views/content/articleManage/detail.vue nest-admin-frontend/src/views/content/articleManage/aev.subapp.spec.ts nest-admin-frontend/src/views/content/articleManage/view.subapp.spec.ts nest-admin-frontend/src/views/content/articleManage/detail.subapp.spec.ts
git commit -m "feat: move knowledge editor to isolated subapp"
```
