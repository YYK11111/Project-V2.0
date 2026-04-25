# Isle Editor AEV Integration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 将 `isle-editor` 迁入 `nest-admin-frontend`，替换 `/content/aev`、`view.vue`、`detail.vue` 的正文编辑与查看主链路，并让后端以 `isle-editor` JSON 作为唯一正文协议。

**Architecture:** 前端在 `src/features/isle-editor/` 下承接迁入后的编辑器源码，并通过 `IsleArticleEditor` / `IsleArticleViewer` 两个项目内组件向业务页面暴露稳定接口。后端继续复用 `contentJson`、`contentVersion`、`contentStatus` 字段，但把 `document.schema.ts`、`document.validator.ts`、`ArticlesService` 全部切换到 `isle-editor` JSON 协议。

**Tech Stack:** Vue 3、Vite、TypeScript、Element Plus、Vitest、NestJS、TypeORM、现有 `/upload` 接口、迁入后的 `isle-editor` 源码

---

## File Structure

### Frontend files

- Create: `nest-admin-frontend/src/features/isle-editor/core/*`
- Create: `nest-admin-frontend/src/features/isle-editor/vue/*`
- Create: `nest-admin-frontend/src/features/isle-editor/adapters/useIsleUpload.ts`
- Create: `nest-admin-frontend/src/features/isle-editor/adapters/isleContent.ts`
- Create: `nest-admin-frontend/src/features/isle-editor/components/IsleArticleEditor.vue`
- Create: `nest-admin-frontend/src/features/isle-editor/components/IsleArticleViewer.vue`
- Modify: `nest-admin-frontend/src/views/content/articleManage/aev.vue`
- Modify: `nest-admin-frontend/src/views/content/articleManage/view.vue`
- Modify: `nest-admin-frontend/src/views/content/articleManage/detail.vue`
- Modify: `nest-admin-frontend/src/views/content/articleManage/aev.document.ts`
- Modify: `nest-admin-frontend/src/views/content/articleManage/view.document.ts`
- Modify: `nest-admin-frontend/src/views/content/articleManage/templates.ts`（如模板正文结构需要辅助转换）
- Delete: `nest-admin-frontend/src/features/knowledge-editor-host/KnowledgeEditorHost.vue`
- Delete: `nest-admin-frontend/src/features/knowledge-editor-host/KnowledgeViewerHost.vue`
- Delete: `nest-admin-frontend/src/features/knowledge-editor-host/core/hostMessages.ts`

### Frontend tests

- Modify: `nest-admin-frontend/src/views/content/articleManage/aev.subapp.spec.ts`
- Modify: `nest-admin-frontend/src/views/content/articleManage/aev.bridge.spec.ts`
- Modify: `nest-admin-frontend/src/views/content/articleManage/aev.form.spec.ts`
- Modify: `nest-admin-frontend/src/views/content/articleManage/view.subapp.spec.ts`
- Modify: `nest-admin-frontend/src/views/content/articleManage/detail.subapp.spec.ts`
- Create: `nest-admin-frontend/src/features/isle-editor/adapters/isleContent.spec.ts`
- Create: `nest-admin-frontend/src/features/isle-editor/adapters/useIsleUpload.spec.ts`
- Create: `nest-admin-frontend/src/features/isle-editor/components/isleArticleViewer.spec.ts`

### Backend files

- Modify: `nest-admin/src/modulesBusi/articles/document.schema.ts`
- Modify: `nest-admin/src/modulesBusi/articles/document.validator.ts`
- Modify: `nest-admin/src/modulesBusi/articles/service.ts`
- Modify: `nest-admin/src/modulesBusi/articles/document.spec.ts`

## Task 1: Migrate Isle Editor Source Into Frontend Feature Module

**Files:**
- Create: `nest-admin-frontend/src/features/isle-editor/core/**`
- Create: `nest-admin-frontend/src/features/isle-editor/vue/**`
- Create: `nest-admin-frontend/src/features/isle-editor/styles/**`
- Modify: `nest-admin-frontend/package.json`
- Test: `nest-admin-frontend/src/features/isle-editor/components/isleArticleViewer.spec.ts`

- [ ] **Step 1: Write the failing source-presence test**

```ts
import { describe, expect, it } from 'vitest'
import { existsSync } from 'node:fs'
import { resolve } from 'node:path'

describe('isle editor source migration', () => {
  it('migrates project-local isle editor entry files', () => {
    expect(existsSync(resolve(__dirname, '../../features/isle-editor/components/IsleArticleEditor.vue'))).toBe(true)
    expect(existsSync(resolve(__dirname, '../../features/isle-editor/components/IsleArticleViewer.vue'))).toBe(true)
    expect(existsSync(resolve(__dirname, '../../features/isle-editor/adapters/isleContent.ts'))).toBe(true)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test:unit -- src/features/isle-editor/components/isleArticleViewer.spec.ts`
Expected: FAIL with file-not-found or expectation failure because `src/features/isle-editor/**` does not exist yet

- [ ] **Step 3: Create the feature module skeleton and copy the minimum runtime source**

```text
nest-admin-frontend/src/features/isle-editor/
  core/
  vue/
  styles/
  adapters/
  components/
```

Copy source from:

```text
isle-editor/packages/core/src/**
isle-editor/packages/vue3/src/**
```

Required adjustments during copy:

```ts
// nest-admin-frontend/src/features/isle-editor/vue/index.ts
export { default as IsleEditor } from './isle-editor'
export * from './editor'
```

```ts
// Replace old package alias imports like this:
import { prefixClass, changeLocale } from '@isle-editor/core'

// With project-local imports like this:
import { prefixClass, changeLocale } from '../core'
```

```ts
// Replace @/ alias inside migrated vue runtime
import { changeTheme } from '@/utils'

// With local feature import
import { changeTheme } from './utils'
```

- [ ] **Step 4: Add any missing runtime dependencies to frontend package**

```json
{
  "dependencies": {
    "@floating-ui/dom": "^1.6.12",
    "@iconify/vue": "^4.2.0",
    "@tiptap/core": "^2.9.1",
    "@tiptap/extension-bold": "^2.9.1",
    "@tiptap/extension-bubble-menu": "^2.9.1",
    "@tiptap/extension-bullet-list": "^2.9.1",
    "@tiptap/extension-character-count": "^2.9.1",
    "@tiptap/extension-code": "^2.9.1",
    "@tiptap/extension-code-block": "^2.10.3",
    "@tiptap/extension-document": "^2.9.1",
    "@tiptap/extension-dropcursor": "^2.9.1",
    "@tiptap/extension-gapcursor": "^2.9.1",
    "@tiptap/extension-italic": "^2.9.1",
    "@tiptap/extension-link": "^2.9.1",
    "@tiptap/extension-list-item": "^2.9.1",
    "@tiptap/extension-ordered-list": "^2.9.1",
    "@tiptap/extension-placeholder": "^2.9.1",
    "@tiptap/extension-strike": "^2.9.1",
    "@tiptap/extension-subscript": "^2.9.1",
    "@tiptap/extension-superscript": "^2.9.1",
    "@tiptap/extension-table": "^2.10.3",
    "@tiptap/extension-table-cell": "^2.10.3",
    "@tiptap/extension-table-header": "^2.10.3",
    "@tiptap/extension-table-row": "^2.10.3",
    "@tiptap/extension-task-item": "^2.9.1",
    "@tiptap/extension-task-list": "^2.9.1",
    "@tiptap/extension-text": "^2.9.1",
    "@tiptap/extension-typography": "^2.9.1",
    "@tiptap/extension-underline": "^2.9.1",
    "@tiptap/pm": "^2.9.1",
    "@tiptap/suggestion": "^2.9.1",
    "i18next": "^23.16.5",
    "lodash": "^4.17.21",
    "shiki": "^1.24.0",
    "tippy.js": "^6.3.7",
    "uuid": "^11.0.2"
  }
}
```

- [ ] **Step 5: Run test to verify the feature module exists**

Run: `npm run test:unit -- src/features/isle-editor/components/isleArticleViewer.spec.ts`
Expected: PASS for existence checks, or move to the next failure showing missing adapter/component implementation instead of missing files

- [ ] **Step 6: Commit**

```bash
git add nest-admin-frontend/package.json nest-admin-frontend/src/features/isle-editor docs/superpowers/plans/2026-04-25-isle-editor-aev.md
git commit -m "feat: migrate isle editor source into frontend"
```

## Task 2: Build Project Adapters For Content Protocol And Upload

**Files:**
- Create: `nest-admin-frontend/src/features/isle-editor/adapters/isleContent.ts`
- Create: `nest-admin-frontend/src/features/isle-editor/adapters/useIsleUpload.ts`
- Create: `nest-admin-frontend/src/features/isle-editor/adapters/isleContent.spec.ts`
- Create: `nest-admin-frontend/src/features/isle-editor/adapters/useIsleUpload.spec.ts`

- [ ] **Step 1: Write the failing adapter tests**

```ts
import { describe, expect, it } from 'vitest'
import { createEmptyIsleDocument, getIslePlainText } from './isleContent'

describe('isleContent', () => {
  it('creates an empty doc root', () => {
    expect(createEmptyIsleDocument()).toEqual({
      type: 'doc',
      content: [{ type: 'paragraph', content: [] }],
    })
  })

  it('extracts nested plain text', () => {
    expect(getIslePlainText({
      type: 'doc',
      content: [
        { type: 'heading', content: [{ type: 'text', text: '标题' }] },
        { type: 'paragraph', content: [{ type: 'text', text: '正文' }] },
      ],
    })).toBe('标题 正文')
  })
})
```

```ts
import { describe, expect, it, vi } from 'vitest'
import { useIsleUpload } from './useIsleUpload'

vi.mock('@/api/common', () => ({
  upload: vi.fn(async () => ({ data: 'article/demo.png' })),
}))

describe('useIsleUpload', () => {
  it('maps uploaded image to isle attrs', async () => {
    const { uploadImage } = useIsleUpload()
    await expect(uploadImage(new File(['x'], 'demo.png', { type: 'image/png' }))).resolves.toEqual({
      url: '/upload/article/demo.png',
      name: 'demo.png',
      mimeType: 'image/png',
      size: 1,
    })
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm run test:unit -- src/features/isle-editor/adapters/isleContent.spec.ts src/features/isle-editor/adapters/useIsleUpload.spec.ts`
Expected: FAIL because adapter files do not exist yet

- [ ] **Step 3: Implement content protocol helpers**

```ts
// nest-admin-frontend/src/features/isle-editor/adapters/isleContent.ts
export const ISLE_CONTENT_VERSION = 1
export const ISLE_CONTENT_STATUS = 'ready'

type IsleNode = {
  type?: string
  text?: string
  content?: IsleNode[]
}

export function createEmptyIsleDocument() {
  return {
    type: 'doc',
    content: [
      {
        type: 'paragraph',
        content: [],
      },
    ],
  }
}

export function getIslePlainText(node: IsleNode | null | undefined): string {
  if (!node) return ''
  if (typeof node.text === 'string') return node.text
  const children = Array.isArray(node.content) ? node.content : []
  return children.map((item) => getIslePlainText(item)).filter(Boolean).join(' ').trim()
}
```

- [ ] **Step 4: Implement upload adapter on top of existing `/upload` API**

```ts
// nest-admin-frontend/src/features/isle-editor/adapters/useIsleUpload.ts
import { upload } from '@/api/common'

function normalizeUploadUrl(value: string) {
  if (!value) return ''
  return value.startsWith('/upload/') ? value : `/upload/${value.replace(/^\/+/, '')}`
}

async function uploadByType(file: File) {
  const formData = new FormData()
  formData.append('file', file)
  const response = await upload(formData as never)
  const storedPath = String(response?.data || response?.url || '')
  return {
    url: normalizeUploadUrl(storedPath),
    name: file.name,
    mimeType: file.type,
    size: file.size,
  }
}

export function useIsleUpload() {
  return {
    uploadImage: uploadByType,
    uploadAttachment: uploadByType,
    uploadVideo: uploadByType,
  }
}
```

- [ ] **Step 5: Run adapter tests to verify they pass**

Run: `npm run test:unit -- src/features/isle-editor/adapters/isleContent.spec.ts src/features/isle-editor/adapters/useIsleUpload.spec.ts`
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add nest-admin-frontend/src/features/isle-editor/adapters
git commit -m "feat: add isle editor content and upload adapters"
```

## Task 3: Expose Project-Level Editor And Viewer Components

**Files:**
- Create: `nest-admin-frontend/src/features/isle-editor/components/IsleArticleEditor.vue`
- Create: `nest-admin-frontend/src/features/isle-editor/components/IsleArticleViewer.vue`
- Create: `nest-admin-frontend/src/features/isle-editor/components/isleArticleViewer.spec.ts`

- [ ] **Step 1: Write the failing viewer test**

```ts
import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import IsleArticleViewer from './IsleArticleViewer.vue'

describe('IsleArticleViewer', () => {
  it('renders a readonly editor container', () => {
    const wrapper = mount(IsleArticleViewer, {
      props: {
        content: {
          type: 'doc',
          content: [{ type: 'paragraph', content: [{ type: 'text', text: '正文' }] }],
        },
      },
    })
    expect(wrapper.find('.isle-article-viewer').exists()).toBe(true)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test:unit -- src/features/isle-editor/components/isleArticleViewer.spec.ts`
Expected: FAIL because component file does not exist or does not render the expected container

- [ ] **Step 3: Implement the project editor wrapper**

```vue
<!-- nest-admin-frontend/src/features/isle-editor/components/IsleArticleEditor.vue -->
<script setup lang="ts">
import { computed } from 'vue'
import IsleEditor from '../vue/isle-editor'
import { useIsleUpload } from '../adapters/useIsleUpload'

const props = defineProps<{
  modelValue: Record<string, unknown>
  disabled?: boolean
  placeholder?: string
}>()

const emit = defineEmits<{
  (event: 'update:modelValue', value: Record<string, unknown>): void
}>()

const mediaHandlers = useIsleUpload()
const contentValue = computed(() => props.modelValue)

function handleUpdate(value: Record<string, unknown>) {
  emit('update:modelValue', value)
}
</script>

<template>
  <div class="isle-article-editor">
    <IsleEditor
      :model-value="contentValue"
      :editable="!disabled"
      output="json"
      theme="light"
      locale="en"
      :media-handlers="mediaHandlers"
      @update:model-value="handleUpdate" />
  </div>
</template>
```

- [ ] **Step 4: Implement the project viewer wrapper**

```vue
<!-- nest-admin-frontend/src/features/isle-editor/components/IsleArticleViewer.vue -->
<script setup lang="ts">
import IsleEditor from '../vue/isle-editor'

defineProps<{
  content: Record<string, unknown>
}>()
</script>

<template>
  <div class="isle-article-viewer">
    <IsleEditor :model-value="content" :editable="false" output="json" theme="light" locale="en" />
  </div>
</template>
```

- [ ] **Step 5: Run viewer test to verify it passes**

Run: `npm run test:unit -- src/features/isle-editor/components/isleArticleViewer.spec.ts`
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add nest-admin-frontend/src/features/isle-editor/components
git commit -m "feat: add project-level isle editor wrappers"
```

## Task 4: Replace AEV Page Body Editor With IsleArticleEditor

**Files:**
- Modify: `nest-admin-frontend/src/views/content/articleManage/aev.vue`
- Modify: `nest-admin-frontend/src/views/content/articleManage/aev.document.ts`
- Modify: `nest-admin-frontend/src/views/content/articleManage/templates.ts`
- Modify: `nest-admin-frontend/src/views/content/articleManage/aev.form.spec.ts`
- Modify: `nest-admin-frontend/src/views/content/articleManage/aev.subapp.spec.ts`
- Modify: `nest-admin-frontend/src/views/content/articleManage/aev.bridge.spec.ts`

- [ ] **Step 1: Rewrite failing AEV tests around the new component contract**

```ts
import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const source = readFileSync(resolve(__dirname, './aev.vue'), 'utf-8')

describe('aev editor integration', () => {
  it('uses IsleArticleEditor instead of KnowledgeEditorHost', () => {
    expect(source).toContain('IsleArticleEditor')
    expect(source).not.toContain('KnowledgeEditorHost')
  })

  it('writes editor content back into form.contentJson', () => {
    expect(source).toContain('v-model="form.contentJson"')
  })
})
```

- [ ] **Step 2: Run AEV tests to verify they fail**

Run: `npm run test:unit -- src/views/content/articleManage/aev.form.spec.ts src/views/content/articleManage/aev.subapp.spec.ts src/views/content/articleManage/aev.bridge.spec.ts`
Expected: FAIL because `aev.vue` still references `KnowledgeEditorHost`

- [ ] **Step 3: Replace host usage in `aev.vue` and switch defaults to isle protocol**

```ts
// import replacement
import IsleArticleEditor from '@/features/isle-editor/components/IsleArticleEditor.vue'
import { createEmptyIsleDocument, getIslePlainText, ISLE_CONTENT_STATUS, ISLE_CONTENT_VERSION } from '@/features/isle-editor/adapters/isleContent'
```

```ts
// form defaults
contentJson: createEmptyIsleDocument(),
contentVersion: ISLE_CONTENT_VERSION,
contentStatus: ISLE_CONTENT_STATUS,
contentText: '',
```

```ts
function handleKnowledgeEditorContentUpdate(contentJson: Record<string, unknown>) {
  form.value.contentJson = contentJson as never
  form.value.contentText = getIslePlainText(contentJson as never)
  form.value.contentVersion = ISLE_CONTENT_VERSION
  form.value.contentStatus = ISLE_CONTENT_STATUS
}
```

```vue
<IsleArticleEditor
  v-model="form.contentJson"
  :disabled="!canEditCurrentArticle" />
```

- [ ] **Step 4: Replace old template document builder usage**

```ts
// aev.document.ts
export function createIsleTemplateDocument(markdown: string) {
  const lines = markdown.replace(/\r\n/g, '\n').split('\n')
  const content = lines
    .filter((line) => line.trim())
    .map((line) => ({
      type: 'paragraph',
      content: [{ type: 'text', text: line.trim() }],
    }))

  return {
    type: 'doc',
    content: content.length ? content : [{ type: 'paragraph', content: [] }],
  }
}
```

- [ ] **Step 5: Run AEV tests to verify they pass**

Run: `npm run test:unit -- src/views/content/articleManage/aev.form.spec.ts src/views/content/articleManage/aev.subapp.spec.ts src/views/content/articleManage/aev.bridge.spec.ts`
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add nest-admin-frontend/src/views/content/articleManage/aev.vue nest-admin-frontend/src/views/content/articleManage/aev.document.ts nest-admin-frontend/src/views/content/articleManage/templates.ts nest-admin-frontend/src/views/content/articleManage/*.spec.ts
git commit -m "feat: replace aev body editor with isle editor"
```

## Task 5: Replace View And Detail Body Rendering With IsleArticleViewer

**Files:**
- Modify: `nest-admin-frontend/src/views/content/articleManage/view.vue`
- Modify: `nest-admin-frontend/src/views/content/articleManage/detail.vue`
- Modify: `nest-admin-frontend/src/views/content/articleManage/view.document.ts`
- Modify: `nest-admin-frontend/src/views/content/articleManage/view.subapp.spec.ts`
- Modify: `nest-admin-frontend/src/views/content/articleManage/detail.subapp.spec.ts`

- [ ] **Step 1: Rewrite failing view/detail tests**

```ts
import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

describe('viewer integration', () => {
  it('view page uses IsleArticleViewer', () => {
    const source = readFileSync(resolve(__dirname, './view.vue'), 'utf-8')
    expect(source).toContain('IsleArticleViewer')
    expect(source).not.toContain('KnowledgeViewerHost')
  })

  it('detail page uses IsleArticleViewer', () => {
    const source = readFileSync(resolve(__dirname, './detail.vue'), 'utf-8')
    expect(source).toContain('IsleArticleViewer')
    expect(source).not.toContain('KnowledgeViewerHost')
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm run test:unit -- src/views/content/articleManage/view.subapp.spec.ts src/views/content/articleManage/detail.subapp.spec.ts`
Expected: FAIL because both files still reference `KnowledgeViewerHost`

- [ ] **Step 3: Replace viewer host imports and simplify ready-state mapping**

```ts
// view.document.ts
export function resolveKnowledgeViewMode(article: KnowledgeArticleLike) {
  if (article.contentJson && article.contentStatus === 'ready') {
    return {
      kind: 'ready',
      contentJson: article.contentJson,
    }
  }

  return {
    kind: 'invalid',
    title: '文档内容异常，暂时无法展示',
    description: '当前正文缺少有效的 Isle 文档内容。',
  }
}
```

```vue
<IsleArticleViewer
  v-if="documentState.kind === 'ready'"
  :content="documentState.contentJson"
  class="knowledge-document-viewer" />
```

- [ ] **Step 4: Keep TOC extraction working against rendered DOM**

```ts
await nextTick()
syncScrollContainer()
extractTocFromContent()
updateActiveHeading()
```

Do not delete the existing TOC sync flow from `view.vue` and `detail.vue`; only change the rendered body component.

- [ ] **Step 5: Run tests to verify they pass**

Run: `npm run test:unit -- src/views/content/articleManage/view.subapp.spec.ts src/views/content/articleManage/detail.subapp.spec.ts src/views/content/articleManage/view.layout.spec.ts src/views/content/articleManage/detail.layout.spec.ts`
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add nest-admin-frontend/src/views/content/articleManage/view.vue nest-admin-frontend/src/views/content/articleManage/detail.vue nest-admin-frontend/src/views/content/articleManage/view.document.ts nest-admin-frontend/src/views/content/articleManage/*.spec.ts
git commit -m "feat: render article views with isle viewer"
```

## Task 6: Remove Legacy Knowledge Host Layer

**Files:**
- Delete: `nest-admin-frontend/src/features/knowledge-editor-host/KnowledgeEditorHost.vue`
- Delete: `nest-admin-frontend/src/features/knowledge-editor-host/KnowledgeViewerHost.vue`
- Delete: `nest-admin-frontend/src/features/knowledge-editor-host/core/hostMessages.ts`
- Modify: `nest-admin-frontend/src/features/knowledge-editor-host/hostBridge.spec.ts`
- Modify: `nest-admin-frontend/src/features/knowledge-editor-host/knowledgeHosts.spec.ts`

- [ ] **Step 1: Write the failing cleanup test**

```ts
import { describe, expect, it } from 'vitest'
import { existsSync } from 'node:fs'
import { resolve } from 'node:path'

describe('knowledge editor host cleanup', () => {
  it('removes the iframe host entry files', () => {
    expect(existsSync(resolve(__dirname, './KnowledgeEditorHost.vue'))).toBe(false)
    expect(existsSync(resolve(__dirname, './KnowledgeViewerHost.vue'))).toBe(false)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test:unit -- src/features/knowledge-editor-host/knowledgeHosts.spec.ts`
Expected: FAIL because legacy host files still exist

- [ ] **Step 3: Delete unused iframe host implementation and replace tests with cleanup assertions**

```text
Delete these files:
- src/features/knowledge-editor-host/KnowledgeEditorHost.vue
- src/features/knowledge-editor-host/KnowledgeViewerHost.vue
- src/features/knowledge-editor-host/core/hostMessages.ts
```

```ts
// Update legacy specs to assert cleanup instead of bridge behavior
expect(existsSync(resolve(__dirname, './KnowledgeEditorHost.vue'))).toBe(false)
expect(existsSync(resolve(__dirname, './KnowledgeViewerHost.vue'))).toBe(false)
```

- [ ] **Step 4: Run cleanup test to verify it passes**

Run: `npm run test:unit -- src/features/knowledge-editor-host/knowledgeHosts.spec.ts src/features/knowledge-editor-host/hostBridge.spec.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add nest-admin-frontend/src/features/knowledge-editor-host
git commit -m "refactor: remove legacy knowledge host layer"
```

## Task 7: Switch Backend Schema Validation To Isle Protocol

**Files:**
- Modify: `nest-admin/src/modulesBusi/articles/document.schema.ts`
- Modify: `nest-admin/src/modulesBusi/articles/document.validator.ts`
- Modify: `nest-admin/src/modulesBusi/articles/document.spec.ts`

- [ ] **Step 1: Write the failing backend schema test**

```ts
import { validateDocumentJson } from './document.validator'

describe('isle document validator', () => {
  it('accepts attachment and task nodes used by isle editor', () => {
    expect(() =>
      validateDocumentJson({
        type: 'doc',
        content: [
          {
            type: 'taskList',
            content: [
              {
                type: 'taskItem',
                attrs: { checked: false },
                content: [{ type: 'paragraph', content: [{ type: 'text', text: '待办' }] }],
              },
            ],
          },
          {
            type: 'attachment',
            attrs: { url: '/upload/demo.pdf', name: 'demo.pdf' },
          },
        ],
      }),
    ).not.toThrow()
  })
})
```

- [ ] **Step 2: Run backend schema test to verify it fails**

Run: `npm test -- document.spec.ts`
Expected: FAIL with unsupported node errors for `taskList`, `taskItem`, or `attachment`

- [ ] **Step 3: Expand the backend schema and validator to match migrated editor nodes**

```ts
// document.schema.ts additions
taskList: {
  blockChildren: ['taskItem'],
  allowText: false,
},
taskItem: {
  blockChildren: ['paragraph', 'bulletList', 'orderedList'],
  allowText: false,
},
attachment: {
  allowText: false,
  allowContent: false,
},
video: {
  allowText: false,
  allowContent: false,
},
divider: {
  allowText: false,
  allowContent: false,
},
```

```ts
// mark additions example
export const documentMarkWhitelist = [
  'bold',
  'italic',
  'underline',
  'strike',
  'code',
  'link',
  'textStyle',
] as const
```

- [ ] **Step 4: Run backend schema test to verify it passes**

Run: `npm test -- document.spec.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add nest-admin/src/modulesBusi/articles/document.schema.ts nest-admin/src/modulesBusi/articles/document.validator.ts nest-admin/src/modulesBusi/articles/document.spec.ts
git commit -m "feat: validate isle article document schema"
```

## Task 8: Update Article Service Plain-Text Extraction For Isle JSON

**Files:**
- Modify: `nest-admin/src/modulesBusi/articles/service.ts`
- Modify: `nest-admin/src/modulesBusi/articles/document.spec.ts`

- [ ] **Step 1: Write the failing extraction test**

```ts
import { ArticlesService } from './service'

describe('article content text extraction', () => {
  it('extracts text from nested isle nodes', () => {
    const service = Object.create(ArticlesService.prototype) as ArticlesService
    expect(
      service['extractPlainTextFromDocument']({
        type: 'doc',
        content: [
          { type: 'heading', content: [{ type: 'text', text: '标题' }] },
          {
            type: 'taskList',
            content: [
              {
                type: 'taskItem',
                attrs: { checked: true },
                content: [{ type: 'paragraph', content: [{ type: 'text', text: '任务' }] }],
              },
            ],
          },
        ],
      } as never),
    ).toBe('标题 任务')
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- document.spec.ts`
Expected: FAIL because extraction logic does not yet cover the new node set correctly

- [ ] **Step 3: Update recursive extraction to ignore non-text attrs and walk all children**

```ts
private extractPlainTextFromDocument(
  contentJson?: DocumentNode | Record<string, unknown> | null,
) {
  if (!contentJson || typeof contentJson !== 'object') {
    return ''
  }

  const collectText = (node: DocumentNode): string => {
    const selfText = typeof node.text === 'string' ? node.text : ''
    const childText = Array.isArray(node.content)
      ? node.content.map((child) => collectText(child)).filter(Boolean).join(' ')
      : ''
    return [selfText, childText].filter(Boolean).join(' ').trim()
  }

  return collectText(contentJson as DocumentNode)
    .replace(/\s+/g, ' ')
    .trim()
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- document.spec.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add nest-admin/src/modulesBusi/articles/service.ts nest-admin/src/modulesBusi/articles/document.spec.ts
git commit -m "feat: extract plain text from isle article documents"
```

## Task 9: Verify Full Frontend And Backend Flow

**Files:**
- Modify: no source files unless verification reveals failures
- Test: `nest-admin-frontend` and `nest-admin` verification commands

- [ ] **Step 1: Run frontend type-check**

Run: `npm run type-check`
Workdir: `nest-admin-frontend`
Expected: PASS with no TypeScript errors

- [ ] **Step 2: Run targeted frontend tests**

Run: `npm run test:unit -- src/views/content/articleManage/aev.form.spec.ts src/views/content/articleManage/aev.subapp.spec.ts src/views/content/articleManage/aev.bridge.spec.ts src/views/content/articleManage/view.subapp.spec.ts src/views/content/articleManage/detail.subapp.spec.ts src/features/isle-editor/adapters/isleContent.spec.ts src/features/isle-editor/adapters/useIsleUpload.spec.ts src/features/isle-editor/components/isleArticleViewer.spec.ts`
Workdir: `nest-admin-frontend`
Expected: PASS

- [ ] **Step 3: Run backend lint**

Run: `npm run lint`
Workdir: `nest-admin`
Expected: PASS

- [ ] **Step 4: Run targeted backend tests**

Run: `npm test -- document.spec.ts`
Workdir: `nest-admin`
Expected: PASS

- [ ] **Step 5: Run API contract check**

Run: `npm run check:api-contract`
Workdir: `/Users/yyk/工作/代码开发/Project-V2.0`
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add nest-admin-frontend nest-admin
git commit -m "test: verify isle editor article integration"
```

## Self-Review

### Spec coverage

- `aev.vue` 编辑器替换：Task 3 + Task 4
- `view.vue` 与 `detail.vue` 查看替换：Task 3 + Task 5
- `isle-editor` 源码迁入：Task 1
- 上传复用 `/upload`：Task 2
- 后端 schema/validator 切换：Task 7
- 后端纯文本提取与切片依赖：Task 8
- 删除旧 iframe host：Task 6
- 前后端验证：Task 9

无 spec 漏项。

### Placeholder scan

- 未使用 `TODO`、`TBD`、`implement later` 之类占位词
- 每个任务都包含了明确文件路径、测试命令和代码骨架

### Type consistency

- 前端统一使用 `IsleArticleEditor` / `IsleArticleViewer`
- 前端协议常量统一使用 `ISLE_CONTENT_VERSION` / `ISLE_CONTENT_STATUS`
- 后端统一继续使用 `contentJson`、`contentVersion`、`contentStatus`

无命名冲突。
