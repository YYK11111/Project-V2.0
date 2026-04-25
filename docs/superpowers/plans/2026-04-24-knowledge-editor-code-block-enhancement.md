# Knowledge Editor 代码块增强 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 为 `knowledge-editor-app` 的代码块补齐语言切换、`highlight.js` 语法高亮、查看态行号，以及编辑态延迟高亮和行号。

**Architecture:** 继续沿用现有 `codeBlock` NodeView 接管方式。编辑态采用“真实纯文本输入层 + 延迟高亮镜像层 + 行号层”，查看态复用同一套高亮与行数工具，但只渲染只读结构。语言通过代码块节点 `attrs.language` 持久化，复制继续只复制纯代码文本。

**Tech Stack:** Vue 3, Vite, `@isle-editor/vue3`, Tiptap 2 NodeView, TypeScript, `highlight.js`, Vitest, `vue-tsc`

---

## File Map

- Create: `knowledge-editor-app/src/core/codeBlockLanguages.ts`
  责任：维护首批支持语言列表、标签文本、默认语言回退。
- Create: `knowledge-editor-app/src/core/codeBlockHighlight.ts`
  责任：封装 `highlight.js` 调用、HTML 转义、行数统计和安全回退。
- Modify: `knowledge-editor-app/src/core/codeBlockView.ts`
  责任：扩展编辑态 NodeView，加入语言切换、行号、高亮镜像层和查看态只读渲染分支。
- Modify: `knowledge-editor-app/src/components/EditorShell.vue`
  责任：继续接编辑态 NodeView，必要时传入 `editable` 相关选项。
- Modify: `knowledge-editor-app/src/components/ViewerShell.vue`
  责任：接入查看态代码块增强渲染。
- Modify: `knowledge-editor-app/src/styles/editor.css`
  责任：补齐代码块工具栏、行号、高亮镜像层、查看态样式。
- Modify: `knowledge-editor-app/package.json`
  责任：添加 `highlight.js` 依赖。
- Modify: `knowledge-editor-app/src/core/codeBlockView.spec.ts`
  责任：验证代码块 NodeView 的语言选择、复制、状态结构。
- Modify: `knowledge-editor-app/src/styles/editorStyle.spec.ts`
  责任：验证新增代码块样式选择器存在。
- Create: `knowledge-editor-app/src/core/codeBlockLanguages.spec.ts`
  责任：验证语言列表和默认语言回退。
- Create: `knowledge-editor-app/src/core/codeBlockHighlight.spec.ts`
  责任：验证高亮输出、回退和行数统计。

### Task 1: 安装高亮依赖并建立语言定义

**Files:**
- Modify: `knowledge-editor-app/package.json`
- Create: `knowledge-editor-app/src/core/codeBlockLanguages.ts`
- Create: `knowledge-editor-app/src/core/codeBlockLanguages.spec.ts`

- [ ] **Step 1: 写语言列表测试**

```ts
import { describe, expect, it } from 'vitest'

import {
  codeBlockLanguages,
  getCodeBlockLanguage,
  getCodeBlockLanguageLabel,
} from './codeBlockLanguages'

describe('codeBlockLanguages', () => {
  it('包含首批支持语言', () => {
    expect(codeBlockLanguages.map((item) => item.value)).toEqual([
      'plaintext',
      'javascript',
      'typescript',
      'json',
      'html',
      'css',
      'vue',
      'bash',
      'sql',
      'python',
    ])
  })

  it('未知语言回退到 plaintext', () => {
    expect(getCodeBlockLanguage('ruby').value).toBe('plaintext')
    expect(getCodeBlockLanguage(null).value).toBe('plaintext')
  })

  it('能返回语言标签', () => {
    expect(getCodeBlockLanguageLabel('typescript')).toBe('TypeScript')
    expect(getCodeBlockLanguageLabel('unknown')).toBe('纯文本')
  })
})
```

- [ ] **Step 2: 先运行单测确认失败**

Run: `npm run test:unit -- src/core/codeBlockLanguages.spec.ts`
Expected: FAIL，提示 `Cannot find module './codeBlockLanguages'`

- [ ] **Step 3: 修改依赖并实现语言定义**

`knowledge-editor-app/package.json` 增加依赖：

```json
{
  "dependencies": {
    "highlight.js": "^11.11.1"
  }
}
```

`knowledge-editor-app/src/core/codeBlockLanguages.ts`：

```ts
export type CodeBlockLanguage = {
  value: string
  label: string
}

export const codeBlockLanguages: CodeBlockLanguage[] = [
  { value: 'plaintext', label: '纯文本' },
  { value: 'javascript', label: 'JavaScript' },
  { value: 'typescript', label: 'TypeScript' },
  { value: 'json', label: 'JSON' },
  { value: 'html', label: 'HTML' },
  { value: 'css', label: 'CSS' },
  { value: 'vue', label: 'Vue' },
  { value: 'bash', label: 'Bash' },
  { value: 'sql', label: 'SQL' },
  { value: 'python', label: 'Python' },
]

const defaultLanguage = codeBlockLanguages[0]

export function getCodeBlockLanguage(language: string | null | undefined) {
  return codeBlockLanguages.find((item) => item.value === language) ?? defaultLanguage
}

export function getCodeBlockLanguageLabel(language: string | null | undefined) {
  return getCodeBlockLanguage(language).label
}
```

- [ ] **Step 4: 重新运行语言列表测试**

Run: `npm run test:unit -- src/core/codeBlockLanguages.spec.ts`
Expected: PASS

- [ ] **Step 5: 安装依赖并确认 lockfile 更新**

Run: `npm install`
Expected: `highlight.js` 被写入 `package-lock.json`


### Task 2: 实现高亮与行数工具

**Files:**
- Create: `knowledge-editor-app/src/core/codeBlockHighlight.ts`
- Create: `knowledge-editor-app/src/core/codeBlockHighlight.spec.ts`

- [ ] **Step 1: 写高亮工具测试**

```ts
import { describe, expect, it } from 'vitest'

import {
  escapeCodeHtml,
  getCodeBlockLineCount,
  highlightCodeBlock,
} from './codeBlockHighlight'

describe('codeBlockHighlight', () => {
  it('能安全转义纯文本', () => {
    expect(escapeCodeHtml('<script>1</script>')).toBe('&lt;script&gt;1&lt;/script&gt;')
  })

  it('能计算空代码块行为 1 行', () => {
    expect(getCodeBlockLineCount('')).toBe(1)
  })

  it('能按换行计算行数', () => {
    expect(getCodeBlockLineCount('a\nb\n')).toBe(3)
  })

  it('未知语言时回退到纯文本', () => {
    const result = highlightCodeBlock('const a = 1', 'unknown')
    expect(result.language).toBe('plaintext')
    expect(result.html).toContain('const a = 1')
  })

  it('支持已知语言高亮', () => {
    const result = highlightCodeBlock('const a = 1', 'javascript')
    expect(result.language).toBe('javascript')
    expect(result.html).toContain('hljs')
  })
})
```

- [ ] **Step 2: 运行测试确认失败**

Run: `npm run test:unit -- src/core/codeBlockHighlight.spec.ts`
Expected: FAIL，提示 `Cannot find module './codeBlockHighlight'`

- [ ] **Step 3: 实现高亮工具**

`knowledge-editor-app/src/core/codeBlockHighlight.ts`：

```ts
import hljs from 'highlight.js/lib/core'
import bash from 'highlight.js/lib/languages/bash'
import css from 'highlight.js/lib/languages/css'
import html from 'highlight.js/lib/languages/xml'
import javascript from 'highlight.js/lib/languages/javascript'
import json from 'highlight.js/lib/languages/json'
import python from 'highlight.js/lib/languages/python'
import sql from 'highlight.js/lib/languages/sql'
import typescript from 'highlight.js/lib/languages/typescript'

import { getCodeBlockLanguage } from './codeBlockLanguages'

hljs.registerLanguage('bash', bash)
hljs.registerLanguage('css', css)
hljs.registerLanguage('html', html)
hljs.registerLanguage('javascript', javascript)
hljs.registerLanguage('json', json)
hljs.registerLanguage('python', python)
hljs.registerLanguage('sql', sql)
hljs.registerLanguage('typescript', typescript)
hljs.registerLanguage('vue', html)

export function escapeCodeHtml(value: string) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
}

export function getCodeBlockLineCount(value: string) {
  return value === '' ? 1 : value.split('\n').length
}

export function highlightCodeBlock(value: string, language: string | null | undefined) {
  const normalizedLanguage = getCodeBlockLanguage(language).value

  if (normalizedLanguage === 'plaintext') {
    return {
      language: normalizedLanguage,
      html: `<span class="hljs">${escapeCodeHtml(value)}</span>`,
    }
  }

  try {
    return {
      language: normalizedLanguage,
      html: `<span class="hljs">${hljs.highlight(value, { language: normalizedLanguage }).value}</span>`,
    }
  } catch {
    return {
      language: 'plaintext',
      html: `<span class="hljs">${escapeCodeHtml(value)}</span>`,
    }
  }
}
```

- [ ] **Step 4: 运行高亮工具测试**

Run: `npm run test:unit -- src/core/codeBlockHighlight.spec.ts`
Expected: PASS


### Task 3: 扩展编辑态代码块 NodeView

**Files:**
- Modify: `knowledge-editor-app/src/core/codeBlockView.ts`
- Modify: `knowledge-editor-app/src/core/codeBlockView.spec.ts`

- [ ] **Step 1: 先写编辑态 NodeView 测试**

在 `knowledge-editor-app/src/core/codeBlockView.spec.ts` 增加这些断言：

```ts
it('渲染语言选择器、行号层和高亮层', () => {
  const view = createCodeBlockView()({
    HTMLAttributes: {},
    node: {
      attrs: { language: 'typescript' },
    },
    updateAttributes: vi.fn(),
  } as unknown as NodeViewRendererProps)

  const dom = view.dom as HTMLElement
  const select = dom.querySelector<HTMLSelectElement>('.knowledge-code-block__language')

  expect(select?.value).toBe('typescript')
  expect(dom.querySelector('.knowledge-code-block__lines')).not.toBeNull()
  expect(dom.querySelector('.knowledge-code-block__highlight')).not.toBeNull()
})

it('切换语言时更新节点属性', () => {
  const updateAttributes = vi.fn()
  const view = createCodeBlockView()({
    HTMLAttributes: {},
    node: {
      attrs: { language: null },
    },
    updateAttributes,
  } as unknown as NodeViewRendererProps)

  const select = (view.dom as HTMLElement).querySelector<HTMLSelectElement>('.knowledge-code-block__language')
  if (!select) throw new Error('missing language select')

  select.value = 'javascript'
  select.dispatchEvent(new Event('change'))

  expect(updateAttributes).toHaveBeenCalledWith({ language: 'javascript' })
})
```

- [ ] **Step 2: 运行 NodeView 测试确认失败**

Run: `npm run test:unit -- src/core/codeBlockView.spec.ts`
Expected: FAIL，提示缺少语言选择器或断言不通过

- [ ] **Step 3: 改造 `codeBlockView.ts` 为编辑态双层结构**

关键实现要求：

```ts
import type { NodeViewRendererProps } from '@tiptap/core'
import type { NodeView } from '@tiptap/pm/view'

import { highlightCodeBlock, getCodeBlockLineCount } from './codeBlockHighlight'
import { codeBlockLanguages, getCodeBlockLanguage } from './codeBlockLanguages'

function createLanguageSelect(
  language: string | null | undefined,
  onChange: (value: string) => void,
) {
  const select = document.createElement('select')
  select.className = 'knowledge-code-block__language'
  select.contentEditable = 'false'
  select.value = getCodeBlockLanguage(language).value

  codeBlockLanguages.forEach((item) => {
    const option = document.createElement('option')
    option.value = item.value
    option.textContent = item.label
    select.appendChild(option)
  })

  select.addEventListener('mousedown', (event) => event.preventDefault())
  select.addEventListener('change', () => onChange(select.value))
  return select
}

function renderLineNumbers(container: HTMLElement, codeText: string) {
  const lineCount = getCodeBlockLineCount(codeText)
  container.replaceChildren(
    ...Array.from({ length: lineCount }, (_, index) => {
      const line = document.createElement('div')
      line.className = 'knowledge-code-block__line-number'
      line.textContent = String(index + 1)
      return line
    }),
  )
}
```

NodeView 主体要求：

```ts
const root = document.createElement('div')
const toolbar = document.createElement('div')
const body = document.createElement('div')
const lines = document.createElement('div')
const content = document.createElement('div')
const highlight = document.createElement('pre')
const editor = document.createElement('pre')
const code = document.createElement('code')

function syncPresentation() {
  const codeText = code.textContent ?? ''
  const result = highlightCodeBlock(codeText, currentLanguage)
  highlight.innerHTML = result.html
  renderLineNumbers(lines, codeText)
}
```

更新语言要求：

```ts
function setLanguage(nextLanguage: string) {
  currentLanguage = nextLanguage
  props.updateAttributes?.({ language: nextLanguage })
  scheduleHighlightSync()
}
```

- [ ] **Step 4: 确保复制逻辑仍然存在并只复制纯代码**

复制逻辑保留，但读取对象改为真实 `code.textContent`：

```ts
async function handleCopy() {
  const codeText = code.textContent ?? ''
  await copyText(codeText)
}
```

- [ ] **Step 5: 运行 NodeView 测试**

Run: `npm run test:unit -- src/core/codeBlockView.spec.ts`
Expected: PASS


### Task 4: 接入查看态代码块高亮与行号

**Files:**
- Modify: `knowledge-editor-app/src/core/codeBlockView.ts`
- Modify: `knowledge-editor-app/src/components/ViewerShell.vue`

- [ ] **Step 1: 先为查看态接线加一个最小断言**

在 `knowledge-editor-app/src/components/editorLocale.spec.ts` 或新增查看态相关测试中加入：

```ts
expect(source).toContain('codeBlock: {')
expect(source).toContain('nodeView: createCodeBlockView(')
```

- [ ] **Step 2: 运行该测试确认当前失败**

Run: `npm run test:unit -- src/components/editorLocale.spec.ts`
Expected: FAIL，查看态文件中缺少对应接线

- [ ] **Step 3: 修改 `ViewerShell.vue` 复用代码块 NodeView**

```vue
<script setup lang="ts">
import { NotionKit, IsleEditor } from '@isle-editor/vue3'

import { createCodeBlockView } from '../core/codeBlockView'
import type { KnowledgeEditorContent } from '../core/documentGuards'

const props = defineProps<{
  content: KnowledgeEditorContent
}>()

const viewerExtensions = [
  NotionKit.configure({
    dragHandle: false,
    codeBlock: {
      nodeView: createCodeBlockView(),
    },
  }),
]
</script>
```

- [ ] **Step 4: 在 `codeBlockView.ts` 中加查看态分支**

判定方式：

```ts
const isEditable = props.editor.isEditable
```

查看态要求：

```ts
if (!isEditable) {
  highlight.innerHTML = highlightCodeBlock(codeText, currentLanguage).html
  languageLabel.textContent = getCodeBlockLanguageLabel(currentLanguage)
}
```

注意：

- 查看态不渲染真实编辑层
- 查看态保留复制按钮
- 查看态展示语言标签而不是下拉框

- [ ] **Step 5: 运行查看态相关测试**

Run: `npm run test:unit -- src/components/editorLocale.spec.ts src/core/codeBlockView.spec.ts`
Expected: PASS


### Task 5: 完善样式，保证编辑态行号和高亮对齐

**Files:**
- Modify: `knowledge-editor-app/src/styles/editor.css`
- Modify: `knowledge-editor-app/src/styles/editorStyle.spec.ts`

- [ ] **Step 1: 先写样式断言**

在 `knowledge-editor-app/src/styles/editorStyle.spec.ts` 增加：

```ts
expect(source).toContain('.knowledge-code-block__toolbar')
expect(source).toContain('.knowledge-code-block__language')
expect(source).toContain('.knowledge-code-block__lines')
expect(source).toContain('.knowledge-code-block__highlight')
expect(source).toContain('.knowledge-code-block__editor')
expect(source).toContain('.knowledge-code-block__line-number')
```

- [ ] **Step 2: 运行样式测试确认失败**

Run: `npm run test:unit -- src/styles/editorStyle.spec.ts`
Expected: FAIL，缺少新增样式选择器

- [ ] **Step 3: 实现代码块增强样式**

在 `knowledge-editor-app/src/styles/editor.css` 中加入以下核心结构：

```css
.knowledge-code-block {
  position: relative;
  margin: 1.25rem 0;
  padding: 0.5rem 0;
}

.knowledge-code-block__toolbar {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 0.5rem;
  margin-bottom: 0.5rem;
}

.knowledge-code-block__body {
  display: grid;
  grid-template-columns: 44px minmax(0, 1fr);
  align-items: start;
}

.knowledge-code-block__lines {
  padding: 0.75rem 0.5rem 0.75rem 0;
  color: #a0aec0;
  text-align: right;
  user-select: none;
}

.knowledge-code-block__content {
  position: relative;
}

.knowledge-code-block__highlight,
.knowledge-code-block__editor {
  margin: 0;
  padding: 0.75rem 0;
  font-family: ui-monospace, SFMono-Regular, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace;
  font-size: 0.88rem;
  line-height: 1.8;
  tab-size: 2;
  white-space: pre;
  overflow: auto;
}

.knowledge-code-block__highlight {
  pointer-events: none;
}

.knowledge-code-block__language {
  height: 28px;
  padding: 0 8px;
  border: 1px solid #dde3ed;
  border-radius: 6px;
  background: #fff;
}
```

- [ ] **Step 4: 跑样式测试**

Run: `npm run test:unit -- src/styles/editorStyle.spec.ts`
Expected: PASS


### Task 6: 完整验证并修正集成问题

**Files:**
- Modify: `knowledge-editor-app/src/core/codeBlockView.ts`（如验证中发现小问题）
- Modify: `knowledge-editor-app/src/styles/editor.css`（如验证中发现小问题）

- [ ] **Step 1: 运行针对性单测**

Run: `npm run test:unit -- src/core/codeBlockLanguages.spec.ts src/core/codeBlockHighlight.spec.ts src/core/codeBlockView.spec.ts src/styles/editorStyle.spec.ts src/components/editorLocale.spec.ts`
Expected: PASS

- [ ] **Step 2: 运行类型检查**

Run: `npm run type-check`
Expected: PASS

- [ ] **Step 3: 手工验证编辑态语言切换与高亮**

Run: `npm run dev`
Expected:

- 插入代码块后右上角出现语言选择器
- 切换 `JavaScript` / `TypeScript` / `JSON` 后高亮变化正确
- 输入代码后约 `120ms` 内高亮更新

- [ ] **Step 4: 手工验证编辑态行号与复制**

Expected:

- 回车后行号即时增加
- 删除换行后行号即时减少
- 复制按钮仍然只复制代码文本
- 提示浮层仍然显示 `已复制`

- [ ] **Step 5: 手工验证查看态**

Expected:

- 查看页代码块显示语言标签
- 查看页显示高亮和行号
- 查看页复制按钮可用

- [ ] **Step 6: 提交变更**

```bash
git add knowledge-editor-app/package.json knowledge-editor-app/package-lock.json knowledge-editor-app/src/components/EditorShell.vue knowledge-editor-app/src/components/ViewerShell.vue knowledge-editor-app/src/core/codeBlockLanguages.ts knowledge-editor-app/src/core/codeBlockLanguages.spec.ts knowledge-editor-app/src/core/codeBlockHighlight.ts knowledge-editor-app/src/core/codeBlockHighlight.spec.ts knowledge-editor-app/src/core/codeBlockView.ts knowledge-editor-app/src/core/codeBlockView.spec.ts knowledge-editor-app/src/styles/editor.css knowledge-editor-app/src/styles/editorStyle.spec.ts docs/superpowers/specs/2026-04-24-knowledge-editor-code-block-enhancement-design.md docs/superpowers/plans/2026-04-24-knowledge-editor-code-block-enhancement.md && git commit -m "feat: enhance knowledge editor code blocks"
```
