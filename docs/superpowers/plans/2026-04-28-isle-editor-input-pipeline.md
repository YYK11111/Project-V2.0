# Isle Editor Input Pipeline Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 为 `IsleEditor` 建立一套纯编辑器层的统一输入管道，让 Markdown、普通 HTML、Office HTML、纯文本四类输入都先转换为标准块结构，再写成当前 editor JSON，采用“结构优先、样式适度保留”的导入策略。

**Architecture:** 在 `nest-admin-frontend/src/features/isle-editor/**` 内新增输入管道模块，拆成来源识别、内容清洗、结构归一化、导入写回 4 层。编辑器组件只负责在 `paste` 入口调用输入管道，不引入业务模板、页面校验或知识中心专属规则。

**Tech Stack:** Vue 3、TipTap 2、TypeScript、Vitest、现有 `IsleContentDocument` 协议、项目已安装的 `marked` / `turndown` / 浏览器 DOMParser 能力

---

## File Structure

### Input pipeline modules

- Create: `nest-admin-frontend/src/features/isle-editor/input/sourceDetector.ts`
- Create: `nest-admin-frontend/src/features/isle-editor/input/contentSanitizer.ts`
- Create: `nest-admin-frontend/src/features/isle-editor/input/structureNormalizer.ts`
- Create: `nest-admin-frontend/src/features/isle-editor/input/editorImporter.ts`
- Create: `nest-admin-frontend/src/features/isle-editor/input/types.ts`
- Create: `nest-admin-frontend/src/features/isle-editor/input/index.ts`

### Editor integration files

- Modify: `nest-admin-frontend/src/features/isle-editor/isle-editor.js`
- Modify: `nest-admin-frontend/src/features/isle-editor/adapters/isleContent.ts`

### Tests

- Create: `nest-admin-frontend/src/features/isle-editor/input/sourceDetector.spec.ts`
- Create: `nest-admin-frontend/src/features/isle-editor/input/contentSanitizer.spec.ts`
- Create: `nest-admin-frontend/src/features/isle-editor/input/structureNormalizer.spec.ts`
- Create: `nest-admin-frontend/src/features/isle-editor/input/editorImporter.spec.ts`
- Create: `nest-admin-frontend/src/features/isle-editor/input/pastePipeline.spec.ts`

## Task 1: Introduce Source Detection And Shared Input Types

**Files:**
- Create: `nest-admin-frontend/src/features/isle-editor/input/types.ts`
- Create: `nest-admin-frontend/src/features/isle-editor/input/sourceDetector.ts`
- Create: `nest-admin-frontend/src/features/isle-editor/input/sourceDetector.spec.ts`

- [ ] **Step 1: Write the failing source detection tests**

```ts
import { describe, expect, it } from 'vitest'
import { detectPasteSource } from './sourceDetector'

describe('detectPasteSource', () => {
  it('detects markdown from plain text with heading and list markers', () => {
    expect(
      detectPasteSource({
        html: '',
        text: '# 标题\n\n- 项目一\n- 项目二',
      }),
    ).toBe('markdown')
  })

  it('detects office html from word-specific markup', () => {
    expect(
      detectPasteSource({
        html: '<html><body><p class="MsoNormal">内容</p></body></html>',
        text: '内容',
      }),
    ).toBe('office_html')
  })

  it('falls back to plain text when html is absent and markdown is weak', () => {
    expect(
      detectPasteSource({
        html: '',
        text: '普通文本内容',
      }),
    ).toBe('plain_text')
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test:unit -- src/features/isle-editor/input/sourceDetector.spec.ts`
Expected: FAIL because `input/sourceDetector.ts` and shared input types do not exist yet

- [ ] **Step 3: Create shared input types and source detector skeleton**

```ts
export type PasteSourceKind = 'markdown' | 'office_html' | 'html' | 'plain_text'

export interface PastePayload {
  html: string
  text: string
}
```

```ts
import type { PastePayload, PasteSourceKind } from './types'

export function detectPasteSource(payload: PastePayload): PasteSourceKind {
  const html = payload.html.trim()
  const text = payload.text.trim()

  if (html && /class=("|')[^"']*Mso|xmlns:o=|w:WordDocument/i.test(html)) {
    return 'office_html'
  }

  if (!html && /(^|\n)#{1,6}\s|(^|\n)\s*[-*+]\s|(^|\n)\s*\d+\.\s|```/.test(text)) {
    return 'markdown'
  }

  if (html) {
    return 'html'
  }

  return 'plain_text'
}
```

- [ ] **Step 4: Run test to verify source detection now passes**

Run: `npm run test:unit -- src/features/isle-editor/input/sourceDetector.spec.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add nest-admin-frontend/src/features/isle-editor/input/types.ts nest-admin-frontend/src/features/isle-editor/input/sourceDetector.ts nest-admin-frontend/src/features/isle-editor/input/sourceDetector.spec.ts
git commit -m "feat: add isle input source detection"
```

## Task 2: Add HTML Sanitizer For Standard And Office Sources

**Files:**
- Create: `nest-admin-frontend/src/features/isle-editor/input/contentSanitizer.ts`
- Create: `nest-admin-frontend/src/features/isle-editor/input/contentSanitizer.spec.ts`
- Modify: `nest-admin-frontend/src/features/isle-editor/input/types.ts`

- [ ] **Step 1: Write the failing sanitizer tests**

```ts
import { describe, expect, it } from 'vitest'
import { sanitizeIncomingHtml } from './contentSanitizer'

describe('sanitizeIncomingHtml', () => {
  it('removes office classes and inline styles but keeps headings and lists', () => {
    const result = sanitizeIncomingHtml({
      source: 'office_html',
      html: '<h1 style="color:red" class="MsoTitle">标题</h1><ul><li style="font-size:20px">项目</li></ul>',
    })

    expect(result).toContain('<h1>标题</h1>')
    expect(result).toContain('<ul><li>项目</li></ul>')
    expect(result).not.toContain('MsoTitle')
    expect(result).not.toContain('font-size')
  })

  it('removes empty paragraphs and redundant spans from generic html', () => {
    const result = sanitizeIncomingHtml({
      source: 'html',
      html: '<p> </p><p><span>正文</span></p>',
    })

    expect(result).toContain('<p>正文</p>')
    expect(result).not.toContain('<p> </p>')
    expect(result).not.toContain('<span>')
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test:unit -- src/features/isle-editor/input/contentSanitizer.spec.ts`
Expected: FAIL because sanitizer module does not exist yet

- [ ] **Step 3: Create the sanitizer with a whitelist-first strategy**

```ts
const removableTags = ['style', 'script', 'meta', 'link']
const unwrapTags = ['span', 'font']

export function sanitizeIncomingHtml(input: { source: 'office_html' | 'html'; html: string }) {
  const parser = new DOMParser()
  const doc = parser.parseFromString(input.html, 'text/html')

  removableTags.forEach((tag) => {
    doc.querySelectorAll(tag).forEach((node) => node.remove())
  })

  doc.querySelectorAll<HTMLElement>('*').forEach((element) => {
    element.removeAttribute('style')
    element.removeAttribute('class')
  })

  unwrapTags.forEach((tag) => {
    doc.querySelectorAll(tag).forEach((node) => {
      node.replaceWith(...Array.from(node.childNodes))
    })
  })

  doc.querySelectorAll('p').forEach((node) => {
    if (!(node.textContent || '').trim() && !node.querySelector('img,table,br')) {
      node.remove()
    }
  })

  return doc.body.innerHTML
}
```

- [ ] **Step 4: Run test to verify sanitizer behavior passes**

Run: `npm run test:unit -- src/features/isle-editor/input/contentSanitizer.spec.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add nest-admin-frontend/src/features/isle-editor/input/contentSanitizer.ts nest-admin-frontend/src/features/isle-editor/input/contentSanitizer.spec.ts nest-admin-frontend/src/features/isle-editor/input/types.ts
git commit -m "feat: sanitize isle pasted html"
```

## Task 3: Normalize Markdown, HTML, And Plain Text Into Standard Blocks

**Files:**
- Create: `nest-admin-frontend/src/features/isle-editor/input/structureNormalizer.ts`
- Create: `nest-admin-frontend/src/features/isle-editor/input/structureNormalizer.spec.ts`
- Modify: `nest-admin-frontend/src/features/isle-editor/input/types.ts`

- [ ] **Step 1: Write the failing normalizer tests**

```ts
import { describe, expect, it } from 'vitest'
import { normalizeIncomingContent } from './structureNormalizer'

describe('normalizeIncomingContent', () => {
  it('converts markdown headings, lists, and code fences into standard blocks', () => {
    const blocks = normalizeIncomingContent({
      source: 'markdown',
      text: '# 标题\n\n- 一\n- 二\n\n```js\nconst a = 1\n```',
      html: '',
    })

    expect(blocks.map((item) => item.type)).toEqual(['heading', 'bulletList', 'codeBlock'])
  })

  it('converts sanitized html table and paragraph into standard blocks', () => {
    const blocks = normalizeIncomingContent({
      source: 'html',
      html: '<p>正文</p><table><tr><th>表头</th></tr><tr><td>单元格</td></tr></table>',
      text: '正文',
    })

    expect(blocks.map((item) => item.type)).toEqual(['paragraph', 'table'])
  })

  it('converts plain text bullet markers and links into structured blocks', () => {
    const blocks = normalizeIncomingContent({
      source: 'plain_text',
      html: '',
      text: '- 条目\nhttps://example.com',
    })

    expect(blocks[0]?.type).toBe('bulletList')
    expect(blocks[1]?.type).toBe('paragraph')
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test:unit -- src/features/isle-editor/input/structureNormalizer.spec.ts`
Expected: FAIL because normalizer module does not exist yet

- [ ] **Step 3: Define standard block types and minimal normalizer**

```ts
export type StandardBlock =
  | { type: 'heading'; level: number; text: string }
  | { type: 'paragraph'; text: string }
  | { type: 'bulletList'; items: string[] }
  | { type: 'orderedList'; items: string[] }
  | { type: 'blockquote'; text: string }
  | { type: 'codeBlock'; language: string; text: string }
  | { type: 'table'; rows: string[][] }
  | { type: 'image'; src: string; alt: string }
```

Implement only the first-pass parsing required by the tests: markdown headings, bullet lists, code fences, simple html paragraphs/tables, and plain-text bullet/link detection.

- [ ] **Step 4: Run test to verify the normalizer passes**

Run: `npm run test:unit -- src/features/isle-editor/input/structureNormalizer.spec.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add nest-admin-frontend/src/features/isle-editor/input/structureNormalizer.ts nest-admin-frontend/src/features/isle-editor/input/structureNormalizer.spec.ts nest-admin-frontend/src/features/isle-editor/input/types.ts
git commit -m "feat: normalize isle pasted content"
```

## Task 4: Import Standard Blocks Into `IsleContentDocument`

**Files:**
- Create: `nest-admin-frontend/src/features/isle-editor/input/editorImporter.ts`
- Create: `nest-admin-frontend/src/features/isle-editor/input/editorImporter.spec.ts`
- Modify: `nest-admin-frontend/src/features/isle-editor/adapters/isleContent.ts`
- Modify: `nest-admin-frontend/src/features/isle-editor/input/types.ts`

- [ ] **Step 1: Write the failing importer tests**

```ts
import { describe, expect, it } from 'vitest'
import { importBlocksToDocument } from './editorImporter'

describe('importBlocksToDocument', () => {
  it('converts standard heading, paragraph, list, and image blocks into isle content json', () => {
    const document = importBlocksToDocument([
      { type: 'heading', level: 2, text: '标题' },
      { type: 'paragraph', text: '正文' },
      { type: 'bulletList', items: ['一', '二'] },
      { type: 'image', src: '/upload/demo.png', alt: '示例图' },
    ])

    expect(document.type).toBe('doc')
    expect(document.content?.map((node) => node.type)).toEqual(['heading', 'paragraph', 'bulletList', 'image'])
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test:unit -- src/features/isle-editor/input/editorImporter.spec.ts`
Expected: FAIL because importer module does not exist yet

- [ ] **Step 3: Implement the importer with explicit node mapping**

```ts
export function importBlocksToDocument(blocks: StandardBlock[]): IsleContentDocument {
  return {
    type: 'doc',
    content: blocks.map((block) => {
      switch (block.type) {
        case 'heading':
          return {
            type: 'heading',
            attrs: { level: block.level },
            content: [{ type: 'text', text: block.text }],
          }
        case 'paragraph':
          return {
            type: 'paragraph',
            content: block.text ? [{ type: 'text', text: block.text }] : [],
          }
        default:
          return {
            type: 'paragraph',
            content: [{ type: 'text', text: '' }],
          }
      }
    }),
  }
}
```

Expand the `switch` minimally for `bulletList`, `orderedList`, `blockquote`, `codeBlock`, `table`, and `image` so the test passes without adding unsupported nodes.

- [ ] **Step 4: Run test to verify importer output passes**

Run: `npm run test:unit -- src/features/isle-editor/input/editorImporter.spec.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add nest-admin-frontend/src/features/isle-editor/input/editorImporter.ts nest-admin-frontend/src/features/isle-editor/input/editorImporter.spec.ts nest-admin-frontend/src/features/isle-editor/adapters/isleContent.ts nest-admin-frontend/src/features/isle-editor/input/types.ts
git commit -m "feat: import standard blocks into isle document"
```

## Task 5: Wire The Unified Paste Pipeline Into `IsleEditor`

**Files:**
- Create: `nest-admin-frontend/src/features/isle-editor/input/index.ts`
- Create: `nest-admin-frontend/src/features/isle-editor/input/pastePipeline.spec.ts`
- Modify: `nest-admin-frontend/src/features/isle-editor/isle-editor.js`
- Modify: `nest-admin-frontend/src/features/isle-editor/input/sourceDetector.ts`
- Modify: `nest-admin-frontend/src/features/isle-editor/input/contentSanitizer.ts`
- Modify: `nest-admin-frontend/src/features/isle-editor/input/structureNormalizer.ts`
- Modify: `nest-admin-frontend/src/features/isle-editor/input/editorImporter.ts`

- [ ] **Step 1: Write the failing integration test for the full paste pipeline**

```ts
import { describe, expect, it } from 'vitest'
import { buildDocumentFromPaste } from './index'

describe('buildDocumentFromPaste', () => {
  it('routes markdown through detect -> normalize -> import and returns a document root', () => {
    const document = buildDocumentFromPaste({
      html: '',
      text: '# 标题\n\n- 一\n- 二',
    })

    expect(document.type).toBe('doc')
    expect(document.content?.map((node) => node.type)).toEqual(['heading', 'bulletList'])
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test:unit -- src/features/isle-editor/input/pastePipeline.spec.ts`
Expected: FAIL because the pipeline entrypoint does not exist yet

- [ ] **Step 3: Build the pipeline entrypoint**

```ts
export function buildDocumentFromPaste(payload: PastePayload) {
  const source = detectPasteSource(payload)
  const html = source === 'html' || source === 'office_html'
    ? sanitizeIncomingHtml({ source, html: payload.html })
    : payload.html
  const blocks = normalizeIncomingContent({
    source,
    html,
    text: payload.text,
  })

  return importBlocksToDocument(blocks)
}
```

- [ ] **Step 4: Hook `onPaste` in `isle-editor.js` into the new pipeline**

```js
onPaste: (view, event) => {
  const clipboardData = event?.clipboardData
  const html = clipboardData?.getData('text/html') || ''
  const text = clipboardData?.getData('text/plain') || ''

  if (!html && !text) {
    emit('paste', view, event)
    return
  }

  const document = buildDocumentFromPaste({ html, text })
  if (document?.content?.length) {
    editor.value.commands.insertContent(document.content)
    event.preventDefault()
  }

  emit('paste', view, event)
}
```

Keep the integration minimal: only intercept when the pipeline yields structured content, otherwise fall back to existing behavior.

- [ ] **Step 5: Run the integration test to verify the pipeline passes**

Run: `npm run test:unit -- src/features/isle-editor/input/pastePipeline.spec.ts`
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add nest-admin-frontend/src/features/isle-editor/input/index.ts nest-admin-frontend/src/features/isle-editor/input/pastePipeline.spec.ts nest-admin-frontend/src/features/isle-editor/isle-editor.js nest-admin-frontend/src/features/isle-editor/input/sourceDetector.ts nest-admin-frontend/src/features/isle-editor/input/contentSanitizer.ts nest-admin-frontend/src/features/isle-editor/input/structureNormalizer.ts nest-admin-frontend/src/features/isle-editor/input/editorImporter.ts
git commit -m "feat: add isle unified paste pipeline"
```

## Task 6: Verify The First-Stage Input Pipeline End To End

**Files:**
- Verify only: `nest-admin-frontend/src/features/isle-editor/**`

- [ ] **Step 1: Run source detection test**

Run: `npm run test:unit -- src/features/isle-editor/input/sourceDetector.spec.ts`
Expected: PASS

- [ ] **Step 2: Run sanitizer test**

Run: `npm run test:unit -- src/features/isle-editor/input/contentSanitizer.spec.ts`
Expected: PASS

- [ ] **Step 3: Run normalizer test**

Run: `npm run test:unit -- src/features/isle-editor/input/structureNormalizer.spec.ts`
Expected: PASS

- [ ] **Step 4: Run importer and pipeline tests**

Run: `npm run test:unit -- src/features/isle-editor/input/editorImporter.spec.ts src/features/isle-editor/input/pastePipeline.spec.ts`
Expected: PASS

- [ ] **Step 5: Run editor-related regression tests**

Run: `npm run test:unit -- src/features/isle-editor/components/media-block.spec.ts src/features/isle-editor/components/isleArticleViewer.spec.ts src/features/isle-editor/components/isleArticleEditor.media-nodeview.spec.ts`
Expected: PASS

- [ ] **Step 6: Run frontend type check**

Run: `npm run type-check`
Expected: PASS

- [ ] **Step 7: Commit final verified state**

```bash
git add nest-admin-frontend/src/features/isle-editor docs/superpowers/specs/2026-04-28-isle-editor-input-pipeline-design.md docs/superpowers/plans/2026-04-28-isle-editor-input-pipeline.md
git commit -m "feat: improve isle editor input pipeline"
```

## Self-Review

- Spec coverage checked: source detection, sanitization, standard block normalization, importer mapping, editor integration, and first-stage verification all map to explicit tasks.
- Placeholder scan checked: no `TODO`, `TBD`, “similar to above”, or generic “write tests later” instructions remain.
- Type consistency checked: `PastePayload`, `PasteSourceKind`, `StandardBlock`, and `IsleContentDocument` roles stay consistent across all tasks.
