# Document Editor V2 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 在 `nest-admin-frontend` 中落地 `document-editor-v2`，交付一版基于 `Tiptap 3` 的最小可用 Notion-like 编辑器，并以受控方式接入知识编辑页进行开发自测和小范围内部试用。

**Architecture:** 以 `JSONContent` 为唯一持久化格式，先建立内容规范层和统一块协议，再实现编辑器工厂、块上下文、命令层和菜单/高级结构组件，最后在 `aev.vue` 提供受控 V2 PoC 入口。所有交互能力都建立在稳定 `blockId`、统一块定义和标准化内容流程之上。

**Tech Stack:** Vue 3, Tiptap 3, TypeScript, Element Plus, Vitest

---

### Task 1: 建立 V2 内容规范测试与最小骨架

**Files:**
- Create: `nest-admin-frontend/src/features/document-editor-v2/content/createEmptyDocument.ts`
- Create: `nest-admin-frontend/src/features/document-editor-v2/content/normalizeDocument.ts`
- Create: `nest-admin-frontend/src/features/document-editor-v2/content/validateDocument.ts`
- Create: `nest-admin-frontend/src/features/document-editor-v2/content/content.spec.ts`

- [ ] **Step 1: 写失败测试，约束空文档、标准化和校验的最小行为**

```ts
import type { JSONContent } from '@tiptap/core'
import { describe, expect, it } from 'vitest'

import { createEmptyDocument } from './createEmptyDocument'
import { normalizeDocument } from './normalizeDocument'
import { validateDocument } from './validateDocument'

function getFirstBlock(document: JSONContent) {
  return document.content?.[0]
}

describe('document-editor-v2 content', () => {
  it('createEmptyDocument 返回带 blockId 的最小文档', () => {
    const document = createEmptyDocument()
    const firstBlock = getFirstBlock(document)

    expect(document.type).toBe('doc')
    expect(Array.isArray(document.content)).toBe(true)
    expect(firstBlock?.type).toBe('paragraph')
    expect(firstBlock?.attrs).toMatchObject({
      blockId: expect.any(String),
    })
  })

  it('normalizeDocument 会为顶层块补齐 blockId', () => {
    const normalized = normalizeDocument({
      type: 'doc',
      content: [
        {
          type: 'paragraph',
          content: [{ type: 'text', text: 'hello' }],
        },
      ],
    })

    expect(normalized.content?.[0]?.attrs).toMatchObject({
      blockId: expect.any(String),
    })
  })

  it('normalizeDocument 会把空结构兜底成最小文档', () => {
    const normalized = normalizeDocument({
      type: 'doc',
      content: [],
    })

    expect(normalized.content?.[0]?.type).toBe('paragraph')
  })

  it('validateDocument 拒绝非法根节点', () => {
    expect(validateDocument({ type: 'paragraph' })).toEqual({
      valid: false,
      reason: 'invalid_root',
    })
  })

  it('validateDocument 接受最小合法文档', () => {
    expect(validateDocument(createEmptyDocument())).toEqual({
      valid: true,
      reason: 'valid',
    })
  })
})
```

- [ ] **Step 2: 运行测试并确认失败**

Run: `npm run test:unit -- src/features/document-editor-v2/content/content.spec.ts`

Expected: FAIL，原因是 V2 内容文件尚未创建。

- [ ] **Step 3: 写最小实现，补齐空文档、标准化与校验**

```ts
// createEmptyDocument.ts
import type { JSONContent } from '@tiptap/core'

function createBlockId() {
  return `block_${Math.random().toString(36).slice(2, 10)}`
}

export function createEmptyDocument(): JSONContent {
  return {
    type: 'doc',
    content: [
      {
        type: 'paragraph',
        attrs: {
          blockId: createBlockId(),
        },
      },
    ],
  }
}

// normalizeDocument.ts
import type { JSONContent } from '@tiptap/core'

import { createEmptyDocument } from './createEmptyDocument'

function createBlockId() {
  return `block_${Math.random().toString(36).slice(2, 10)}`
}

function normalizeTopLevelBlock(node: JSONContent): JSONContent {
  return {
    ...node,
    attrs: {
      ...(node.attrs || {}),
      blockId: typeof node.attrs?.blockId === 'string' && node.attrs.blockId ? node.attrs.blockId : createBlockId(),
    },
  }
}

export function normalizeDocument(value: JSONContent | null | undefined): JSONContent {
  if (value?.type !== 'doc') {
    return createEmptyDocument()
  }

  const content = Array.isArray(value.content) ? value.content.filter(Boolean).map(normalizeTopLevelBlock) : []

  if (!content.length) {
    return createEmptyDocument()
  }

  return {
    ...value,
    content,
  }
}

// validateDocument.ts
import type { JSONContent } from '@tiptap/core'

export type DocumentValidationResult =
  | { valid: true; reason: 'valid' }
  | { valid: false; reason: 'invalid_empty' | 'invalid_root' | 'invalid_block' }

export function validateDocument(value: JSONContent | null | undefined): DocumentValidationResult {
  if (!value) {
    return { valid: false, reason: 'invalid_empty' }
  }

  if (value.type !== 'doc' || !Array.isArray(value.content)) {
    return { valid: false, reason: 'invalid_root' }
  }

  if (!value.content.length) {
    return { valid: false, reason: 'invalid_empty' }
  }

  const hasInvalidBlock = value.content.some((node) => !node || typeof node.type !== 'string')
  if (hasInvalidBlock) {
    return { valid: false, reason: 'invalid_block' }
  }

  return { valid: true, reason: 'valid' }
}
```

- [ ] **Step 4: 运行测试确认内容规范通过**

Run: `npm run test:unit -- src/features/document-editor-v2/content/content.spec.ts`

Expected: PASS。

- [ ] **Step 5: 提交当前任务改动**

```bash
git add nest-admin-frontend/src/features/document-editor-v2/content/createEmptyDocument.ts nest-admin-frontend/src/features/document-editor-v2/content/normalizeDocument.ts nest-admin-frontend/src/features/document-editor-v2/content/validateDocument.ts nest-admin-frontend/src/features/document-editor-v2/content/content.spec.ts
git commit -m "test: guard document editor v2 content rules"
```

### Task 2: 建立统一块定义与块命令协议

**Files:**
- Create: `nest-admin-frontend/src/features/document-editor-v2/core/blockTypes.ts`
- Create: `nest-admin-frontend/src/features/document-editor-v2/core/blockRegistry.ts`
- Create: `nest-admin-frontend/src/features/document-editor-v2/core/blockCommands.ts`
- Create: `nest-admin-frontend/src/features/document-editor-v2/core/blockRegistry.spec.ts`

- [ ] **Step 1: 写失败测试，锁定块定义、slash/toolbar 暴露范围和基础命令键**

```ts
import { describe, expect, it } from 'vitest'

import { blockCommandKeys } from './blockCommands'
import { documentBlockRegistry, getSlashBlocks, getToolbarBlocks, getTocBlockTypes } from './blockRegistry'

describe('document-editor-v2 block registry', () => {
  it('注册第一阶段需要的块类型', () => {
    expect(documentBlockRegistry.map((item) => item.type)).toEqual([
      'paragraph',
      'heading1',
      'heading2',
      'heading3',
      'bulletList',
      'orderedList',
      'taskList',
      'blockquote',
      'codeBlock',
      'horizontalRule',
      'table',
      'image',
    ])
  })

  it('slash menu 只暴露允许插入的块', () => {
    expect(getSlashBlocks().every((item) => item.showInSlashMenu)).toBe(true)
  })

  it('toolbar 只暴露允许工具栏展示的块', () => {
    expect(getToolbarBlocks().every((item) => item.showInToolbar)).toBe(true)
  })

  it('TOC 只收集标题块类型', () => {
    expect(getTocBlockTypes()).toEqual(['heading1', 'heading2', 'heading3'])
  })

  it('命令键包含插入、转换、删除、复制和移动能力', () => {
    expect(blockCommandKeys).toEqual([
      'insertBlockBefore',
      'insertBlockAfter',
      'convertBlock',
      'deleteBlock',
      'duplicateBlock',
      'moveBlock',
      'focusBlock',
    ])
  })
})
```

- [ ] **Step 2: 运行测试并确认失败**

Run: `npm run test:unit -- src/features/document-editor-v2/core/blockRegistry.spec.ts`

Expected: FAIL，原因是块注册与命令文件尚未创建。

- [ ] **Step 3: 写最小实现，建立块类型、注册表和命令键常量**

```ts
// blockTypes.ts
export type DocumentBlockType =
  | 'paragraph'
  | 'heading1'
  | 'heading2'
  | 'heading3'
  | 'bulletList'
  | 'orderedList'
  | 'taskList'
  | 'blockquote'
  | 'codeBlock'
  | 'horizontalRule'
  | 'table'
  | 'image'

export type DocumentBlockDefinition = {
  type: DocumentBlockType
  title: string
  aliases: string[]
  group: 'basic' | 'lists' | 'blocks' | 'media'
  showInSlashMenu: boolean
  showInToolbar: boolean
  showInBlockMenu: boolean
  includeInToc: boolean
}

// blockRegistry.ts
import type { DocumentBlockDefinition } from './blockTypes'

export const documentBlockRegistry: DocumentBlockDefinition[] = [
  { type: 'paragraph', title: '正文', aliases: ['text'], group: 'basic', showInSlashMenu: true, showInToolbar: true, showInBlockMenu: true, includeInToc: false },
  { type: 'heading1', title: '标题 1', aliases: ['h1'], group: 'basic', showInSlashMenu: true, showInToolbar: true, showInBlockMenu: true, includeInToc: true },
  { type: 'heading2', title: '标题 2', aliases: ['h2'], group: 'basic', showInSlashMenu: true, showInToolbar: true, showInBlockMenu: true, includeInToc: true },
  { type: 'heading3', title: '标题 3', aliases: ['h3'], group: 'basic', showInSlashMenu: true, showInToolbar: true, showInBlockMenu: true, includeInToc: true },
  { type: 'bulletList', title: '无序列表', aliases: ['ul'], group: 'lists', showInSlashMenu: true, showInToolbar: true, showInBlockMenu: true, includeInToc: false },
  { type: 'orderedList', title: '有序列表', aliases: ['ol'], group: 'lists', showInSlashMenu: true, showInToolbar: true, showInBlockMenu: true, includeInToc: false },
  { type: 'taskList', title: '任务列表', aliases: ['todo'], group: 'lists', showInSlashMenu: true, showInToolbar: true, showInBlockMenu: true, includeInToc: false },
  { type: 'blockquote', title: '引用', aliases: ['quote'], group: 'blocks', showInSlashMenu: true, showInToolbar: true, showInBlockMenu: true, includeInToc: false },
  { type: 'codeBlock', title: '代码块', aliases: ['code'], group: 'blocks', showInSlashMenu: true, showInToolbar: true, showInBlockMenu: true, includeInToc: false },
  { type: 'horizontalRule', title: '分割线', aliases: ['divider'], group: 'blocks', showInSlashMenu: true, showInToolbar: false, showInBlockMenu: true, includeInToc: false },
  { type: 'table', title: '表格', aliases: ['table'], group: 'media', showInSlashMenu: true, showInToolbar: true, showInBlockMenu: true, includeInToc: false },
  { type: 'image', title: '图片', aliases: ['image'], group: 'media', showInSlashMenu: true, showInToolbar: true, showInBlockMenu: true, includeInToc: false },
]

export function getSlashBlocks() {
  return documentBlockRegistry.filter((item) => item.showInSlashMenu)
}

export function getToolbarBlocks() {
  return documentBlockRegistry.filter((item) => item.showInToolbar)
}

export function getTocBlockTypes() {
  return documentBlockRegistry.filter((item) => item.includeInToc).map((item) => item.type)
}

// blockCommands.ts
export const blockCommandKeys = [
  'insertBlockBefore',
  'insertBlockAfter',
  'convertBlock',
  'deleteBlock',
  'duplicateBlock',
  'moveBlock',
  'focusBlock',
] as const
```

- [ ] **Step 4: 运行测试确认块协议通过**

Run: `npm run test:unit -- src/features/document-editor-v2/core/blockRegistry.spec.ts`

Expected: PASS。

- [ ] **Step 5: 提交当前任务改动**

```bash
git add nest-admin-frontend/src/features/document-editor-v2/core/blockTypes.ts nest-admin-frontend/src/features/document-editor-v2/core/blockRegistry.ts nest-admin-frontend/src/features/document-editor-v2/core/blockCommands.ts nest-admin-frontend/src/features/document-editor-v2/core/blockRegistry.spec.ts
git commit -m "feat: add document editor v2 block registry"
```

### Task 3: 建立编辑器扩展与编辑器工厂

**Files:**
- Create: `nest-admin-frontend/src/features/document-editor-v2/extensions/documentExtensions.ts`
- Create: `nest-admin-frontend/src/features/document-editor-v2/core/createDocumentEditor.ts`
- Create: `nest-admin-frontend/src/features/document-editor-v2/core/createDocumentEditor.spec.ts`
- Modify: `nest-admin-frontend/package.json`

- [ ] **Step 1: 写失败测试，约束 V2 扩展集合和编辑器初始化内容会被标准化**

```ts
import { describe, expect, it } from 'vitest'

import { createDocumentExtensions } from '../extensions/documentExtensions'
import { createDocumentEditor } from './createDocumentEditor'

describe('document-editor-v2 editor factory', () => {
  it('扩展集合包含第一阶段基础扩展', () => {
    const names = createDocumentExtensions('输入 / 使用命令菜单').map((item) => item.name)
    expect(names).toContain('starterKit')
    expect(names).toContain('underline')
    expect(names).toContain('link')
    expect(names).toContain('image')
    expect(names).toContain('placeholder')
    expect(names).toContain('table')
  })

  it('createDocumentEditor 会把输入内容标准化为带 blockId 的文档', () => {
    const editor = createDocumentEditor({
      content: {
        type: 'doc',
        content: [{ type: 'paragraph' }],
      },
      placeholder: '输入 / 使用命令菜单',
      editable: true,
      onUpdate: () => undefined,
    })

    expect(editor.getJSON().content?.[0]?.attrs).toMatchObject({
      blockId: expect.any(String),
    })

    editor.destroy()
  })
})
```

- [ ] **Step 2: 运行测试并确认失败**

Run: `npm run test:unit -- src/features/document-editor-v2/core/createDocumentEditor.spec.ts`

Expected: FAIL。

- [ ] **Step 3: 安装第一阶段最小必要依赖并实现扩展与工厂**

```ts
// package.json
{
  "dependencies": {
    "@tiptap/extension-task-item": "^3.7.2",
    "@tiptap/extension-task-list": "^3.7.2"
  }
}

// documentExtensions.ts
import Image from '@tiptap/extension-image'
import Link from '@tiptap/extension-link'
import Placeholder from '@tiptap/extension-placeholder'
import { Table } from '@tiptap/extension-table'
import TableCell from '@tiptap/extension-table-cell'
import TableHeader from '@tiptap/extension-table-header'
import TableRow from '@tiptap/extension-table-row'
import TaskItem from '@tiptap/extension-task-item'
import TaskList from '@tiptap/extension-task-list'
import Underline from '@tiptap/extension-underline'
import StarterKit from '@tiptap/starter-kit'

export function createDocumentExtensions(placeholder: string) {
  return [
    StarterKit,
    Underline,
    Link.configure({ openOnClick: false, defaultProtocol: 'https' }),
    Image,
    Placeholder.configure({ placeholder }),
    Table,
    TableRow,
    TableHeader,
    TableCell,
    TaskList,
    TaskItem.configure({ nested: false }),
  ]
}

// createDocumentEditor.ts
import type { JSONContent } from '@tiptap/core'
import { Editor } from '@tiptap/vue-3'

import { normalizeDocument } from '../content/normalizeDocument'
import { createDocumentExtensions } from '../extensions/documentExtensions'

type CreateDocumentEditorOptions = {
  content: JSONContent | null | undefined
  placeholder: string
  editable: boolean
  onUpdate: (document: JSONContent) => void
}

export function createDocumentEditor(options: CreateDocumentEditorOptions) {
  return new Editor({
    content: normalizeDocument(options.content),
    editable: options.editable,
    extensions: createDocumentExtensions(options.placeholder),
    onUpdate: ({ editor }) => {
      options.onUpdate(normalizeDocument(editor.getJSON()))
    },
  })
}
```

- [ ] **Step 4: 安装依赖后运行测试确认通过**

Run: `npm install`

Expected: PASS，新增 `@tiptap/extension-task-item` 和 `@tiptap/extension-task-list` 到锁文件。

Run: `npm run test:unit -- src/features/document-editor-v2/core/createDocumentEditor.spec.ts`

Expected: PASS。

- [ ] **Step 5: 提交当前任务改动**

```bash
git add nest-admin-frontend/package.json nest-admin-frontend/package-lock.json nest-admin-frontend/src/features/document-editor-v2/extensions/documentExtensions.ts nest-admin-frontend/src/features/document-editor-v2/core/createDocumentEditor.ts nest-admin-frontend/src/features/document-editor-v2/core/createDocumentEditor.spec.ts
git commit -m "feat: scaffold document editor v2 editor factory"
```

### Task 4: 建立块上下文、TOC 扫描和拖拽排序纯逻辑

**Files:**
- Create: `nest-admin-frontend/src/features/document-editor-v2/core/blockContext.ts`
- Create: `nest-admin-frontend/src/features/document-editor-v2/core/editorState.ts`
- Create: `nest-admin-frontend/src/features/document-editor-v2/core/toc.ts`
- Create: `nest-admin-frontend/src/features/document-editor-v2/core/reorderBlocks.ts`
- Create: `nest-admin-frontend/src/features/document-editor-v2/core/editorState.spec.ts`

- [ ] **Step 1: 写失败测试，锁定 TOC 扫描和顶层块重排行为**

```ts
import { describe, expect, it } from 'vitest'

import { createEmptyDocument } from '../content/createEmptyDocument'
import { buildTocItems } from './toc'
import { reorderBlocksByBlockId } from './reorderBlocks'

describe('document-editor-v2 editor state', () => {
  it('buildTocItems 只收集 heading1-3', () => {
    const tocItems = buildTocItems({
      type: 'doc',
      content: [
        { type: 'heading', attrs: { level: 1, blockId: 'a' }, content: [{ type: 'text', text: 'A' }] },
        { type: 'paragraph', attrs: { blockId: 'b' }, content: [{ type: 'text', text: 'B' }] },
        { type: 'heading', attrs: { level: 2, blockId: 'c' }, content: [{ type: 'text', text: 'C' }] },
      ],
    })

    expect(tocItems).toEqual([
      { blockId: 'a', level: 1, text: 'A' },
      { blockId: 'c', level: 2, text: 'C' },
    ])
  })

  it('reorderBlocksByBlockId 只重排顶层块顺序', () => {
    const document = {
      type: 'doc',
      content: [
        { type: 'paragraph', attrs: { blockId: 'a' } },
        { type: 'paragraph', attrs: { blockId: 'b' } },
        { type: 'paragraph', attrs: { blockId: 'c' } },
      ],
    }

    const reordered = reorderBlocksByBlockId(document, 'c', 'a')
    expect(reordered.content?.map((item) => item.attrs?.blockId)).toEqual(['c', 'a', 'b'])
  })

  it('空文档状态会兜底为最小文档', () => {
    expect(createEmptyDocument().content?.[0]?.type).toBe('paragraph')
  })
})
```

- [ ] **Step 2: 运行测试并确认失败**

Run: `npm run test:unit -- src/features/document-editor-v2/core/editorState.spec.ts`

Expected: FAIL。

- [ ] **Step 3: 实现块上下文与纯逻辑工具**

```ts
// toc.ts
import type { JSONContent } from '@tiptap/core'

export type TocItem = {
  blockId: string
  level: 1 | 2 | 3
  text: string
}

function getNodeText(node: JSONContent | null | undefined): string {
  if (!node?.content) return ''
  return node.content.map((item) => item.text || '').join('').trim()
}

export function buildTocItems(document: JSONContent): TocItem[] {
  if (!Array.isArray(document.content)) return []

  return document.content.flatMap((node) => {
    if (node.type !== 'heading') return []
    const level = Number(node.attrs?.level)
    const blockId = node.attrs?.blockId
    if (!(level >= 1 && level <= 3) || typeof blockId !== 'string' || !blockId) return []
    return [{ blockId, level: level as 1 | 2 | 3, text: getNodeText(node) }]
  })
}

// reorderBlocks.ts
import type { JSONContent } from '@tiptap/core'

export function reorderBlocksByBlockId(document: JSONContent, movingBlockId: string, targetBlockId: string): JSONContent {
  const content = Array.isArray(document.content) ? [...document.content] : []
  const fromIndex = content.findIndex((node) => node.attrs?.blockId === movingBlockId)
  const toIndex = content.findIndex((node) => node.attrs?.blockId === targetBlockId)

  if (fromIndex < 0 || toIndex < 0 || fromIndex === toIndex) {
    return document
  }

  const [movingNode] = content.splice(fromIndex, 1)
  content.splice(toIndex, 0, movingNode)

  return {
    ...document,
    content,
  }
}
```

- [ ] **Step 4: 运行测试确认纯逻辑通过**

Run: `npm run test:unit -- src/features/document-editor-v2/core/editorState.spec.ts`

Expected: PASS。

- [ ] **Step 5: 提交当前任务改动**

```bash
git add nest-admin-frontend/src/features/document-editor-v2/core/blockContext.ts nest-admin-frontend/src/features/document-editor-v2/core/editorState.ts nest-admin-frontend/src/features/document-editor-v2/core/toc.ts nest-admin-frontend/src/features/document-editor-v2/core/reorderBlocks.ts nest-admin-frontend/src/features/document-editor-v2/core/editorState.spec.ts
git commit -m "feat: add document editor v2 editor state helpers"
```

### Task 5: 实现 `DocumentEditorV2.vue` 与 slash menu 最小闭环

**Files:**
- Create: `nest-admin-frontend/src/features/document-editor-v2/DocumentEditorV2.vue`
- Create: `nest-admin-frontend/src/features/document-editor-v2/components/DocumentSlashMenu.vue`
- Modify: `nest-admin-frontend/src/features/document-editor-v2/core/createDocumentEditor.ts`
- Create: `nest-admin-frontend/src/features/document-editor-v2/DocumentEditorV2.spec.ts`

- [ ] **Step 1: 写失败测试，约束 V2 入口能渲染编辑器并在 slash 条件下展示菜单数据**

```ts
import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

import DocumentEditorV2 from './DocumentEditorV2.vue'

describe('DocumentEditorV2', () => {
  it('渲染编辑器表面并接受 contentJson', () => {
    const wrapper = mount(DocumentEditorV2, {
      props: {
        contentJson: {
          type: 'doc',
          content: [{ type: 'paragraph', attrs: { blockId: 'block_1' } }],
        },
        disabled: false,
        placeholder: '输入 / 使用命令菜单',
      },
    })

    expect(wrapper.find('.document-editor-v2').exists()).toBe(true)
    expect(wrapper.find('.document-editor-v2__surface').exists()).toBe(true)
  })
})
```

- [ ] **Step 2: 运行测试并确认失败**

Run: `npm run test:unit -- src/features/document-editor-v2/DocumentEditorV2.spec.ts`

Expected: FAIL。

- [ ] **Step 3: 实现 V2 入口组件与 slash menu 最小闭环**

```vue
<template>
  <div class="document-editor-v2" :class="{ 'is-disabled': disabled }">
    <div class="document-editor-v2__surface">
      <DocumentSlashMenu
        v-if="slashMenu.visible"
        :items="slashMenu.items"
        :active-index="slashMenu.activeIndex"
        @select="applySlashItem" />
      <EditorContent v-if="editor" :editor="editor" class="document-editor-v2__content" />
    </div>
  </div>
</template>

<script setup lang="ts">
import type { JSONContent } from '@tiptap/core'
import { EditorContent } from '@tiptap/vue-3'
import { computed, onBeforeUnmount, reactive, shallowRef, watch } from 'vue'

import { normalizeDocument } from './content/normalizeDocument'
import DocumentSlashMenu from './components/DocumentSlashMenu.vue'
import { createDocumentEditor } from './core/createDocumentEditor'
import { getSlashBlocks } from './core/blockRegistry'

const props = withDefaults(defineProps<{
  contentJson: JSONContent | null
  disabled?: boolean
  placeholder?: string
}>(), {
  disabled: false,
  placeholder: '输入 / 使用命令菜单',
})

const emit = defineEmits<{
  (event: 'update:contentJson', value: JSONContent): void
}>()

const editor = shallowRef<InstanceType<typeof import('@tiptap/vue-3').Editor> | null>(null)
const slashMenu = reactive({
  visible: false,
  activeIndex: 0,
  items: getSlashBlocks(),
})

function applySlashItem() {
  slashMenu.visible = false
}

watch(
  () => props.contentJson,
  (value) => {
    if (!editor.value) {
      editor.value = createDocumentEditor({
        content: normalizeDocument(value),
        placeholder: props.placeholder,
        editable: !props.disabled,
        onUpdate: (document) => emit('update:contentJson', document),
      })
      return
    }

    editor.value.commands.setContent(normalizeDocument(value), { emitUpdate: false })
  },
  { immediate: true },
)

watch(
  () => props.disabled,
  (value) => {
    editor.value?.setEditable(!value)
  },
)

onBeforeUnmount(() => {
  editor.value?.destroy()
})
</script>
```

- [ ] **Step 4: 运行测试确认 V2 入口已可挂载**

Run: `npm run test:unit -- src/features/document-editor-v2/DocumentEditorV2.spec.ts`

Expected: PASS。

- [ ] **Step 5: 提交当前任务改动**

```bash
git add nest-admin-frontend/src/features/document-editor-v2/DocumentEditorV2.vue nest-admin-frontend/src/features/document-editor-v2/components/DocumentSlashMenu.vue nest-admin-frontend/src/features/document-editor-v2/core/createDocumentEditor.ts nest-admin-frontend/src/features/document-editor-v2/DocumentEditorV2.spec.ts
git commit -m "feat: add document editor v2 shell"
```

### Task 6: 实现 block action menu、toolbar、bubble menu 和 TOC 组件

**Files:**
- Create: `nest-admin-frontend/src/features/document-editor-v2/components/DocumentToolbar.vue`
- Create: `nest-admin-frontend/src/features/document-editor-v2/components/DocumentBubbleMenu.vue`
- Create: `nest-admin-frontend/src/features/document-editor-v2/components/DocumentBlockMenu.vue`
- Create: `nest-admin-frontend/src/features/document-editor-v2/components/DocumentToc.vue`
- Modify: `nest-admin-frontend/src/features/document-editor-v2/DocumentEditorV2.vue`

- [ ] **Step 1: 写组件级失败测试，约束 toolbar、TOC 和 block menu 能渲染统一块定义数据**

```ts
import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

import DocumentToolbar from './components/DocumentToolbar.vue'
import DocumentToc from './components/DocumentToc.vue'

describe('document-editor-v2 menus', () => {
  it('toolbar 渲染块定义动作', () => {
    const wrapper = mount(DocumentToolbar, {
      props: {
        items: [
          { type: 'paragraph', title: '正文' },
          { type: 'heading1', title: '标题 1' },
        ],
      },
    })

    expect(wrapper.text()).toContain('正文')
    expect(wrapper.text()).toContain('标题 1')
  })

  it('TOC 渲染标题项目', () => {
    const wrapper = mount(DocumentToc, {
      props: {
        items: [{ blockId: 'a', level: 1, text: '第一节' }],
        activeBlockId: 'a',
      },
    })

    expect(wrapper.text()).toContain('第一节')
  })
})
```

- [ ] **Step 2: 运行测试并确认失败**

Run: `npm run test:unit -- src/features/document-editor-v2/components/document-menus.spec.ts`

Expected: FAIL。

- [ ] **Step 3: 实现最小组件并接入 DocumentEditorV2**

```vue
<template>
  <div class="document-editor-v2">
    <DocumentToolbar :items="toolbarItems" />
    <div class="document-editor-v2__layout">
      <div class="document-editor-v2__main">
        <DocumentBlockMenu :items="blockMenuItems" />
        <DocumentBubbleMenu />
        <EditorContent v-if="editor" :editor="editor" class="document-editor-v2__content" />
      </div>
      <DocumentToc :items="tocItems" :active-block-id="activeBlockId" />
    </div>
  </div>
</template>
```

- [ ] **Step 4: 运行测试确认菜单组件可用**

Run: `npm run test:unit -- src/features/document-editor-v2/components/document-menus.spec.ts`

Expected: PASS。

- [ ] **Step 5: 提交当前任务改动**

```bash
git add nest-admin-frontend/src/features/document-editor-v2/components/DocumentToolbar.vue nest-admin-frontend/src/features/document-editor-v2/components/DocumentBubbleMenu.vue nest-admin-frontend/src/features/document-editor-v2/components/DocumentBlockMenu.vue nest-admin-frontend/src/features/document-editor-v2/components/DocumentToc.vue nest-admin-frontend/src/features/document-editor-v2/DocumentEditorV2.vue nest-admin-frontend/src/features/document-editor-v2/components/document-menus.spec.ts
git commit -m "feat: add document editor v2 menus"
```

### Task 7: 实现顶层块插入、转换、复制、删除和排序命令闭环

**Files:**
- Modify: `nest-admin-frontend/src/features/document-editor-v2/core/blockCommands.ts`
- Modify: `nest-admin-frontend/src/features/document-editor-v2/core/createDocumentEditor.ts`
- Create: `nest-admin-frontend/src/features/document-editor-v2/core/blockCommands.spec.ts`
- Modify: `nest-admin-frontend/src/features/document-editor-v2/DocumentEditorV2.vue`

- [ ] **Step 1: 写失败测试，锁定块命令的核心行为**

```ts
import { describe, expect, it } from 'vitest'

import { normalizeDocument } from '../content/normalizeDocument'
import { deleteBlockFromDocument, duplicateBlockInDocument, insertParagraphAfterBlock, moveBlockInDocument } from './blockCommands'

describe('document-editor-v2 block commands', () => {
  it('insertParagraphAfterBlock 会在目标块后插入 paragraph', () => {
    const document = normalizeDocument({
      type: 'doc',
      content: [{ type: 'paragraph', attrs: { blockId: 'a' } }],
    })

    const nextDocument = insertParagraphAfterBlock(document, 'a')
    expect(nextDocument.content).toHaveLength(2)
    expect(nextDocument.content?.[1]?.type).toBe('paragraph')
  })

  it('deleteBlockFromDocument 删除最后一个块时会保留空 paragraph', () => {
    const document = normalizeDocument({
      type: 'doc',
      content: [{ type: 'paragraph', attrs: { blockId: 'a' } }],
    })

    const nextDocument = deleteBlockFromDocument(document, 'a')
    expect(nextDocument.content?.[0]?.type).toBe('paragraph')
  })

  it('duplicateBlockInDocument 复制块时会生成新的 blockId', () => {
    const document = normalizeDocument({
      type: 'doc',
      content: [{ type: 'paragraph', attrs: { blockId: 'a' } }],
    })

    const nextDocument = duplicateBlockInDocument(document, 'a')
    expect(nextDocument.content).toHaveLength(2)
    expect(nextDocument.content?.[1]?.attrs?.blockId).not.toBe('a')
  })

  it('moveBlockInDocument 支持顶层块排序', () => {
    const document = normalizeDocument({
      type: 'doc',
      content: [
        { type: 'paragraph', attrs: { blockId: 'a' } },
        { type: 'paragraph', attrs: { blockId: 'b' } },
      ],
    })

    const nextDocument = moveBlockInDocument(document, 'b', 'a')
    expect(nextDocument.content?.map((item) => item.attrs?.blockId)).toEqual(['b', 'a'])
  })
})
```

- [ ] **Step 2: 运行测试并确认失败**

Run: `npm run test:unit -- src/features/document-editor-v2/core/blockCommands.spec.ts`

Expected: FAIL。

- [ ] **Step 3: 实现块命令的纯文档版本，并让编辑器入口调用这些命令**

```ts
import type { JSONContent } from '@tiptap/core'

import { createEmptyDocument } from '../content/createEmptyDocument'
import { normalizeDocument } from '../content/normalizeDocument'
import { reorderBlocksByBlockId } from './reorderBlocks'

function createParagraphBlock(): JSONContent {
  return createEmptyDocument().content?.[0] as JSONContent
}

export function insertParagraphAfterBlock(document: JSONContent, blockId: string): JSONContent {
  const nextDocument = normalizeDocument(document)
  const content = [...(nextDocument.content || [])]
  const index = content.findIndex((item) => item.attrs?.blockId === blockId)
  if (index < 0) return nextDocument
  content.splice(index + 1, 0, createParagraphBlock())
  return { ...nextDocument, content }
}

export function deleteBlockFromDocument(document: JSONContent, blockId: string): JSONContent {
  const nextDocument = normalizeDocument(document)
  const content = (nextDocument.content || []).filter((item) => item.attrs?.blockId !== blockId)
  return content.length ? { ...nextDocument, content } : createEmptyDocument()
}

export function duplicateBlockInDocument(document: JSONContent, blockId: string): JSONContent {
  const nextDocument = normalizeDocument(document)
  const content = [...(nextDocument.content || [])]
  const index = content.findIndex((item) => item.attrs?.blockId === blockId)
  if (index < 0) return nextDocument
  const duplicate = normalizeDocument({ type: 'doc', content: [content[index]] }).content?.[0] as JSONContent
  content.splice(index + 1, 0, duplicate)
  return { ...nextDocument, content }
}

export function moveBlockInDocument(document: JSONContent, movingBlockId: string, targetBlockId: string): JSONContent {
  return reorderBlocksByBlockId(normalizeDocument(document), movingBlockId, targetBlockId)
}
```

- [ ] **Step 4: 运行测试确认块命令通过**

Run: `npm run test:unit -- src/features/document-editor-v2/core/blockCommands.spec.ts`

Expected: PASS。

- [ ] **Step 5: 提交当前任务改动**

```bash
git add nest-admin-frontend/src/features/document-editor-v2/core/blockCommands.ts nest-admin-frontend/src/features/document-editor-v2/core/createDocumentEditor.ts nest-admin-frontend/src/features/document-editor-v2/core/blockCommands.spec.ts nest-admin-frontend/src/features/document-editor-v2/DocumentEditorV2.vue
git commit -m "feat: add document editor v2 block commands"
```

### Task 8: 在知识编辑页提供受控 V2 PoC 接入

**Files:**
- Modify: `nest-admin-frontend/src/views/content/articleManage/aev.vue`
- Modify: `nest-admin-frontend/src/views/content/articleManage/aev.document.ts`
- Create: `nest-admin-frontend/src/views/content/articleManage/aev.document-v2.spec.ts`

- [ ] **Step 1: 写失败测试，约束 `aev` 支持受控 V2 入口且默认不替换旧入口**

```ts
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

function readFile(name: string) {
  return readFileSync(resolve(__dirname, name), 'utf-8')
}

describe('aev document editor v2 poc', () => {
  it('aev 页面同时保留旧入口和 V2 入口判断', () => {
    const source = readFile('aev.vue')
    expect(source).toContain('DocumentEditorV2')
    expect(source).toContain('useDocumentEditorV2')
    expect(source).toContain('NotionDocumentEditor')
  })
})
```

- [ ] **Step 2: 运行测试并确认失败**

Run: `npm run test:unit -- src/views/content/articleManage/aev.document-v2.spec.ts`

Expected: FAIL。

- [ ] **Step 3: 给 `aev` 增加受控 V2 开关和新建文档优先使用 V2 的接入**

```ts
// aev.document.ts
export function shouldUseDocumentEditorV2(input: { id?: number | string; contentStatus?: string | null }) {
  const isNewDocument = !input.id
  return isNewDocument && input.contentStatus !== 'legacy_html' && input.contentStatus !== 'invalid'
}

// aev.vue
import DocumentEditorV2 from '@/features/document-editor-v2/DocumentEditorV2.vue'

const useDocumentEditorV2 = computed(() =>
  shouldUseDocumentEditorV2({
    id: form.id,
    contentStatus: form.contentStatus,
  }),
)
```

```vue
<el-form-item prop="contentJson" label="正文" style="max-width: none !important">
  <DocumentEditorV2
    v-if="useDocumentEditorV2"
    v-model:content-json="form.contentJson"
    :disabled="!canEditCurrentArticle" />
  <NotionDocumentEditor
    v-else
    v-model:content-json="form.contentJson"
    :content-status="form.contentStatus as 'ready' | 'legacy_html' | 'invalid'"
    :disabled="!canEditCurrentArticle" />
</el-form-item>
```

- [ ] **Step 4: 运行测试确认 PoC 接入通过**

Run: `npm run test:unit -- src/views/content/articleManage/aev.document-v2.spec.ts`

Expected: PASS。

- [ ] **Step 5: 提交当前任务改动**

```bash
git add nest-admin-frontend/src/views/content/articleManage/aev.vue nest-admin-frontend/src/views/content/articleManage/aev.document.ts nest-admin-frontend/src/views/content/articleManage/aev.document-v2.spec.ts
git commit -m "feat: add document editor v2 poc entry"
```

### Task 9: 开发自测、类型检查和试用前验收

**Files:**
- Modify: `nest-admin-frontend/src/features/document-editor-v2/DocumentEditorV2.vue`
- Modify: `nest-admin-frontend/src/features/document-editor-v2/core/*.ts`
- Modify: `nest-admin-frontend/src/views/content/articleManage/aev.vue`

- [ ] **Step 1: 运行 V2 相关单测集合**

Run: `npm run test:unit -- src/features/document-editor-v2/content/content.spec.ts src/features/document-editor-v2/core/blockRegistry.spec.ts src/features/document-editor-v2/core/createDocumentEditor.spec.ts src/features/document-editor-v2/core/editorState.spec.ts src/features/document-editor-v2/core/blockCommands.spec.ts src/features/document-editor-v2/DocumentEditorV2.spec.ts src/views/content/articleManage/aev.document-v2.spec.ts`

Expected: PASS。

- [ ] **Step 2: 运行前端类型检查**

Run: `npm run type-check`

Expected: PASS。

- [ ] **Step 3: 手工验证编辑器关键场景并修复发现的问题**

```txt
验证清单：
1. 新建知识文档时默认进入 V2
2. 普通输入、删除、换行正常
3. /h1、/h2、/table、/image、/code 可触发并执行
4. TOC 随标题变化更新
5. block action menu 可插入、复制、删除
6. 删除最后一个块后仍保留 paragraph
7. 顶层块可前移、后移
8. 保存后刷新重载结构稳定
```

- [ ] **Step 4: 检查工作区差异仅包含 V2 重构和 PoC 接入相关改动**

Run: `git status --short`

Expected: 仅包含 `document-editor-v2`、`aev.vue`、`aev.document.ts`、相关测试和依赖变更。

- [ ] **Step 5: 生成最终提交**

```bash
git add nest-admin-frontend/package.json nest-admin-frontend/package-lock.json nest-admin-frontend/src/features/document-editor-v2 nest-admin-frontend/src/views/content/articleManage/aev.vue nest-admin-frontend/src/views/content/articleManage/aev.document.ts nest-admin-frontend/src/views/content/articleManage/aev.document-v2.spec.ts
git commit -m "feat: add document editor v2 poc"
```
