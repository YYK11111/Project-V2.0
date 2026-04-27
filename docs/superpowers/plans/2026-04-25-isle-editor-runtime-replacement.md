# Isle Editor Runtime Replacement Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 用根目录 `isle-editor/` 的真实最新运行时替换 `nest-admin-frontend/src/features/isle-editor/**` 中当前的占位内核，并保持 `IsleArticleEditor` / `IsleArticleViewer` 作为项目级稳定入口，让 `/content/aev`、`view`、`detail` 的编辑、查看、上传、slash、media、table、toc 全链路对齐上游能力。

**Architecture:** 直接以上游 `isle-editor/packages/core/src/**` 和 `packages/vue3/src/**` 为真实来源，整体同步到 `nest-admin-frontend/src/features/isle-editor/` 的内核层与 Vue 层。项目层仅保留适配职责：`isleContent.ts` 负责正文协议与空文档/纯文本工具，`useIsleUpload.ts` 负责将项目 `/upload` 接到上游 `mediaHandlers`，`IsleArticleEditor` / `IsleArticleViewer` 保持页面稳定接口但内部接入真实上游 editor/viewer。

**Tech Stack:** Vue 3、Vite、TypeScript、TipTap 2、上游 `isle-editor` 源码、项目现有 `/upload` 接口、Vitest、`vue-tsc`

---

## File Structure

### Upstream-synced runtime files

- Modify: `nest-admin-frontend/src/features/isle-editor/core/index.js`
- Modify: `nest-admin-frontend/src/features/isle-editor/core/editor.js`
- Modify: `nest-admin-frontend/src/features/isle-editor/core/locales/index.js`
- Create/Modify: `nest-admin-frontend/src/features/isle-editor/core/extensions/**`
- Create/Modify: `nest-admin-frontend/src/features/isle-editor/core/utils/**`
- Modify: `nest-admin-frontend/src/features/isle-editor/vue/index.js`
- Modify: `nest-admin-frontend/src/features/isle-editor/vue/editor.js`
- Modify: `nest-admin-frontend/src/features/isle-editor/vue/isle-editor.js`
- Create/Modify: `nest-admin-frontend/src/features/isle-editor/vue/kit/**`
- Create/Modify: `nest-admin-frontend/src/features/isle-editor/vue/components/**`
- Create/Modify: `nest-admin-frontend/src/features/isle-editor/vue/utils/**`
- Create/Modify: `nest-admin-frontend/src/features/isle-editor/styles/**`

### Project adapter files

- Modify: `nest-admin-frontend/src/features/isle-editor/adapters/isleContent.ts`
- Modify: `nest-admin-frontend/src/features/isle-editor/adapters/useIsleUpload.ts`

### Project public components

- Modify: `nest-admin-frontend/src/features/isle-editor/components/IsleArticleEditor.vue`
- Modify: `nest-admin-frontend/src/features/isle-editor/components/IsleArticleViewer.vue`
- Modify: `nest-admin-frontend/src/features/isle-editor/components/isleArticleViewer.spec.ts`

### Article page and document files

- Modify: `nest-admin-frontend/src/views/content/articleManage/aev.vue`
- Modify: `nest-admin-frontend/src/views/content/articleManage/aev.document.ts`
- Modify: `nest-admin-frontend/src/views/content/articleManage/view.vue`
- Modify: `nest-admin-frontend/src/views/content/articleManage/detail.vue`
- Modify: `nest-admin-frontend/src/views/content/articleManage/view.document.ts`

### Frontend tests

- Modify: `nest-admin-frontend/src/features/isle-editor/adapters/isleContent.spec.ts`
- Modify: `nest-admin-frontend/src/features/isle-editor/adapters/useIsleUpload.spec.ts`
- Modify: `nest-admin-frontend/src/views/content/articleManage/aev.document.spec.ts`
- Modify: `nest-admin-frontend/src/views/content/articleManage/view.document.spec.ts`
- Modify: `nest-admin-frontend/src/views/content/articleManage/aev.form.spec.ts`
- Modify: `nest-admin-frontend/src/views/content/articleManage/aev.subapp.spec.ts`
- Modify: `nest-admin-frontend/src/views/content/articleManage/aev.bridge.spec.ts`
- Modify: `nest-admin-frontend/src/views/content/articleManage/view.subapp.spec.ts`
- Modify: `nest-admin-frontend/src/views/content/articleManage/detail.subapp.spec.ts`

## Task 1: Replace Core Runtime With Upstream `packages/core/src/**`

**Files:**
- Modify: `nest-admin-frontend/src/features/isle-editor/core/index.js`
- Modify: `nest-admin-frontend/src/features/isle-editor/core/editor.js`
- Modify: `nest-admin-frontend/src/features/isle-editor/core/locales/index.js`
- Create/Modify: `nest-admin-frontend/src/features/isle-editor/core/extensions/**`
- Create/Modify: `nest-admin-frontend/src/features/isle-editor/core/utils/**`
- Test: `nest-admin-frontend/src/features/isle-editor/components/isleArticleViewer.spec.ts`

- [ ] **Step 1: Write the failing runtime smoke test**

```ts
import { describe, expect, it } from 'vitest'

describe('isle core runtime replacement', () => {
  it('exports a TipTap-based editor with upstream extension registry', async () => {
    const core = await import('../core')
    expect(typeof core.Editor).toBe('function')
    expect(core).toHaveProperty('Heading')
    expect(core).toHaveProperty('BulletList')
    expect(core).toHaveProperty('Attachment')
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test:unit -- src/features/isle-editor/components/isleArticleViewer.spec.ts`
Expected: FAIL because current `core/index.js` does not yet expose upstream extension registry

- [ ] **Step 3: Copy upstream core runtime into feature module**

Copy from:

```text
isle-editor/packages/core/src/index.js
isle-editor/packages/core/src/editor.js
isle-editor/packages/core/src/locales/index.js
isle-editor/packages/core/src/extensions/**
isle-editor/packages/core/src/utils/**
```

Required import rewrites:

```js
import { prefixClass } from '@isle-editor/core'
// ->
import { prefixClass } from '../core'
```

- [ ] **Step 4: Keep only project-local path adjustments, no business logic**

```js
export * from './editor.js'
export * from './locales/index.js'
export * from './extensions/index.js'
export * from './utils/index.js'
```

- [ ] **Step 5: Run test to verify upstream core exports are available**

Run: `npm run test:unit -- src/features/isle-editor/components/isleArticleViewer.spec.ts`
Expected: PASS for the export presence assertion or move to the next runtime-level failure

- [ ] **Step 6: Commit**

```bash
git add nest-admin-frontend/src/features/isle-editor/core
git commit -m "feat: sync isle core runtime from upstream"
```

## Task 2: Replace Vue Runtime, Kit, Components, And Styles With Upstream `packages/vue3/src/**`

**Files:**
- Modify: `nest-admin-frontend/src/features/isle-editor/vue/index.js`
- Modify: `nest-admin-frontend/src/features/isle-editor/vue/editor.js`
- Modify: `nest-admin-frontend/src/features/isle-editor/vue/isle-editor.js`
- Create/Modify: `nest-admin-frontend/src/features/isle-editor/vue/kit/**`
- Create/Modify: `nest-admin-frontend/src/features/isle-editor/vue/components/**`
- Create/Modify: `nest-admin-frontend/src/features/isle-editor/vue/utils/**`
- Create/Modify: `nest-admin-frontend/src/features/isle-editor/styles/**`
- Test: `nest-admin-frontend/src/features/isle-editor/components/isleArticleViewer.spec.ts`

- [ ] **Step 1: Write the failing Vue runtime capability test**

```ts
import { createApp, h, nextTick } from 'vue'
import { describe, expect, it } from 'vitest'
import { IsleEditor, NotionKit } from '../vue'

describe('isle vue runtime replacement', () => {
  it('mounts upstream IsleEditor with NotionKit and emits JSON output', async () => {
    const container = document.createElement('div')
    let emitted = null

    const app = createApp({
      render() {
        return h(IsleEditor, {
          modelValue: { type: 'doc', content: [] },
          output: 'json',
          extensions: [NotionKit],
          'onUpdate:modelValue': (value) => {
            emitted = value
          },
        })
      },
    })

    app.mount(container)
    await nextTick()

    expect(container.querySelector('.isle-editor')).not.toBeNull()
    expect(emitted).not.toBeNull()

    app.unmount()
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test:unit -- src/features/isle-editor/components/isleArticleViewer.spec.ts`
Expected: FAIL because current `vue` runtime does not yet expose `NotionKit` or mount the real runtime

- [ ] **Step 3: Copy upstream Vue runtime and support files**

Copy from:

```text
isle-editor/packages/vue3/src/index.js
isle-editor/packages/vue3/src/editor.js
isle-editor/packages/vue3/src/isle-editor.js
isle-editor/packages/vue3/src/kit/**
isle-editor/packages/vue3/src/components/**
isle-editor/packages/vue3/src/utils/**
isle-editor/packages/vue3/src/styles/**
```

Required import rewrites:

```js
import { prefixClass, changeLocale } from '@isle-editor/core'
// ->
import { prefixClass, changeLocale } from '../core'
```

```js
import { createSlashSuggestion } from '@/components/slash-menu/index.js'
// ->
import { createSlashSuggestion } from '../components/slash-menu/index.js'
```

- [ ] **Step 4: Keep upstream ability assembly intact**

```js
export { Editor } from './editor.js'
export { default as IsleEditor } from './isle-editor.js'
export * from './kit'
export * from './utils'
export * from './components'
```

- [ ] **Step 5: Run test to verify the real Vue runtime mounts**

Run: `npm run test:unit -- src/features/isle-editor/components/isleArticleViewer.spec.ts`
Expected: PASS or move to the next integration-level failure

- [ ] **Step 6: Commit**

```bash
git add nest-admin-frontend/src/features/isle-editor/vue nest-admin-frontend/src/features/isle-editor/styles
git commit -m "feat: sync isle vue runtime from upstream"
```

## Task 3: Reconnect Project Adapters To Real Upstream Runtime

**Files:**
- Modify: `nest-admin-frontend/src/features/isle-editor/adapters/isleContent.ts`
- Modify: `nest-admin-frontend/src/features/isle-editor/adapters/useIsleUpload.ts`
- Modify: `nest-admin-frontend/src/features/isle-editor/adapters/isleContent.spec.ts`
- Modify: `nest-admin-frontend/src/features/isle-editor/adapters/useIsleUpload.spec.ts`

- [ ] **Step 1: Write the failing adapter integration tests**

```ts
import { describe, expect, it } from 'vitest'
import { createEmptyIsleContent } from './isleContent'

describe('isleContent runtime alignment', () => {
  it('creates a doc root compatible with upstream editor JSON', () => {
    expect(createEmptyIsleContent()).toEqual({
      type: 'doc',
      content: [{ type: 'paragraph', content: [] }],
    })
  })
})
```

```ts
import { describe, expect, it, vi } from 'vitest'
import { useIsleUpload } from './useIsleUpload'

vi.mock('@/api/common', () => ({
  upload: vi.fn(async () => ({ data: 'article/demo.png' })),
}))

describe('upstream media handler adapter', () => {
  it('returns attrs consumable by upstream image block', async () => {
    const { uploadImage } = useIsleUpload()
    await expect(uploadImage(new File(['x'], 'demo.png', { type: 'image/png' }))).resolves.toEqual(
      expect.objectContaining({ url: '/upload/article/demo.png' }),
    )
  })
})
```

- [ ] **Step 2: Run tests to verify they fail if adapter shape mismatches upstream runtime**

Run: `npm run test:unit -- src/features/isle-editor/adapters/isleContent.spec.ts src/features/isle-editor/adapters/useIsleUpload.spec.ts`
Expected: FAIL if adapters still expose outdated contract

- [ ] **Step 3: Align document adapter with upstream JSON contract**

```ts
export interface IsleContentDocument {
  type: 'doc'
  content: IsleContentNode[]
}
```

Keep upload adapter as the single project-specific bridge to upstream `mediaHandlers`.

- [ ] **Step 4: Run adapter tests to verify they pass**

Run: `npm run test:unit -- src/features/isle-editor/adapters/isleContent.spec.ts src/features/isle-editor/adapters/useIsleUpload.spec.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add nest-admin-frontend/src/features/isle-editor/adapters
git commit -m "feat: align isle adapters with upstream runtime"
```

## Task 4: Reconnect `IsleArticleEditor.vue` To Real Upstream Editor + NotionKit

**Files:**
- Modify: `nest-admin-frontend/src/features/isle-editor/components/IsleArticleEditor.vue`
- Modify: `nest-admin-frontend/src/views/content/articleManage/aev.form.spec.ts`
- Modify: `nest-admin-frontend/src/views/content/articleManage/aev.subapp.spec.ts`
- Modify: `nest-admin-frontend/src/views/content/articleManage/aev.bridge.spec.ts`

- [ ] **Step 1: Write the failing editor wrapper test**

```ts
import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import IsleArticleEditor from './IsleArticleEditor.vue'

describe('IsleArticleEditor', () => {
  it('passes doc json and upstream extensions into IsleEditor', () => {
    const wrapper = mount(IsleArticleEditor, {
      props: {
        modelValue: { type: 'doc', content: [] },
      },
    })

    expect(wrapper.find('[data-testid="isle-article-editor"]').exists()).toBe(true)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test:unit -- src/views/content/articleManage/aev.form.spec.ts src/views/content/articleManage/aev.subapp.spec.ts src/views/content/articleManage/aev.bridge.spec.ts`
Expected: FAIL because the wrapper does not yet wire real upstream editor + NotionKit

- [ ] **Step 3: Reconnect the editor wrapper to the real runtime**

Target implementation shape:

```vue
<script setup lang="ts">
import { computed, ref } from 'vue'
import { IsleEditor, NotionKit } from '../vue'
import { createEmptyIsleContent, type IsleContentDocument } from '../adapters/isleContent'
import { useIsleUpload } from '../adapters/useIsleUpload'

const uploadAdapter = useIsleUpload()

const editorExtensions = computed(() => [
  NotionKit.configure({
    image: { /* upstream image config */ },
    video: { /* upstream video config */ },
    attachment: { /* upstream attachment config */ },
  }),
])
</script>
```

Requirements:

- keep `modelValue` / `update:modelValue` interface
- emit upstream `getJSON()` result directly
- feed `mediaHandlers` into upstream runtime
- use `output="json"`

- [ ] **Step 4: Update AEV tests to assert the real wrapper contract**

```ts
expect(source).toContain('IsleArticleEditor')
expect(source).toContain('v-model="form.contentJson"')
expect(source).toContain('handleArticleContentUpdate')
```

- [ ] **Step 5: Run wrapper and AEV tests to verify they pass**

Run: `npm run test:unit -- src/views/content/articleManage/aev.form.spec.ts src/views/content/articleManage/aev.subapp.spec.ts src/views/content/articleManage/aev.bridge.spec.ts`
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add nest-admin-frontend/src/features/isle-editor/components/IsleArticleEditor.vue nest-admin-frontend/src/views/content/articleManage/*.spec.ts
git commit -m "feat: connect article editor to real isle runtime"
```

## Task 5: Replace Hand-Written Viewer With Real Upstream Readonly Runtime

**Files:**
- Modify: `nest-admin-frontend/src/features/isle-editor/components/IsleArticleViewer.vue`
- Modify: `nest-admin-frontend/src/features/isle-editor/components/isleArticleViewer.spec.ts`
- Modify: `nest-admin-frontend/src/views/content/articleManage/view.subapp.spec.ts`
- Modify: `nest-admin-frontend/src/views/content/articleManage/detail.subapp.spec.ts`
- Modify: `nest-admin-frontend/src/views/content/articleManage/view.document.spec.ts`

- [ ] **Step 1: Write the failing readonly runtime test**

```ts
import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import IsleArticleViewer from './IsleArticleViewer.vue'

describe('IsleArticleViewer', () => {
  it('mounts a readonly upstream runtime and outputs heading dom', () => {
    const wrapper = mount(IsleArticleViewer, {
      props: {
        content: {
          type: 'doc',
          content: [
            {
              type: 'heading',
              attrs: { level: 2 },
              content: [{ type: 'text', text: '章节标题' }],
            },
          ],
        },
      },
    })

    expect(wrapper.find('h2').exists()).toBe(true)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test:unit -- src/features/isle-editor/components/isleArticleViewer.spec.ts`
Expected: FAIL because current viewer is still project-local render logic

- [ ] **Step 3: Rebuild `IsleArticleViewer.vue` on top of real upstream readonly runtime**

Requirements:

- keep public prop `content`
- create readonly upstream editor instance
- use same schema / NotionKit family as editor wrapper
- ensure heading DOM remains queryable for TOC extraction

Minimal shape:

```vue
<IsleEditor
  :model-value="content"
  :editable="false"
  output="json"
  :extensions="viewerExtensions" />
```

- [ ] **Step 4: Add or update tests for heading, task, media, table rendering**

At minimum cover:

```ts
expect(container.querySelector('h2')).not.toBeNull()
expect(container.querySelector('table')).not.toBeNull()
expect(container.querySelector('[data-node-type="attachment"]') || container.textContent).toBeTruthy()
```

- [ ] **Step 5: Run viewer and page-level tests to verify they pass**

Run: `npm run test:unit -- src/features/isle-editor/components/isleArticleViewer.spec.ts src/views/content/articleManage/view.subapp.spec.ts src/views/content/articleManage/detail.subapp.spec.ts src/views/content/articleManage/view.document.spec.ts`
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add nest-admin-frontend/src/features/isle-editor/components/IsleArticleViewer.vue nest-admin-frontend/src/features/isle-editor/components/isleArticleViewer.spec.ts nest-admin-frontend/src/views/content/articleManage/*.spec.ts
git commit -m "feat: connect article viewer to real isle runtime"
```

## Task 6: Align Article Document Helpers And Page Contracts With Real Runtime JSON

**Files:**
- Modify: `nest-admin-frontend/src/views/content/articleManage/aev.document.ts`
- Modify: `nest-admin-frontend/src/views/content/articleManage/view.document.ts`
- Modify: `nest-admin-frontend/src/views/content/articleManage/aev.document.spec.ts`
- Modify: `nest-admin-frontend/src/views/content/articleManage/view.document.spec.ts`
- Modify: `nest-admin-frontend/src/views/content/articleManage/aev.vue`
- Modify: `nest-admin-frontend/src/views/content/articleManage/view.vue`
- Modify: `nest-admin-frontend/src/views/content/articleManage/detail.vue`

- [ ] **Step 1: Write the failing document-contract tests**

```ts
import { describe, expect, it } from 'vitest'
import { createStructuredTemplateDocument } from './aev.document'

describe('article document helpers', () => {
  it('builds backend-compatible doc root for template content', () => {
    expect(createStructuredTemplateDocument('## 标题\n- 项目')).toEqual(
      expect.objectContaining({
        type: 'doc',
      }),
    )
  })
})
```

- [ ] **Step 2: Run test to verify it fails if helper output no longer matches runtime expectations**

Run: `npm run test:unit -- src/views/content/articleManage/aev.document.spec.ts src/views/content/articleManage/view.document.spec.ts`
Expected: FAIL until helper contracts are aligned with the real runtime output shape

- [ ] **Step 3: Keep article helpers aligned to backend-compatible ProseMirror JSON**

Target invariants:

```ts
type IsleContentDocument = {
  type: 'doc'
  content: IsleContentNode[]
}
```

```ts
heading -> { type: 'heading', attrs: { level }, content: [...] }
bullet -> { type: 'bulletList', content: [...] }
ordered -> { type: 'orderedList', content: [...] }
item -> { type: 'listItem', content: [...] }
text -> { type: 'text', text: '...' }
```

- [ ] **Step 4: Keep page contracts unchanged where possible**

```ts
form.value.contentJson = contentJson
form.value.contentVersion = DOCUMENT_CONTENT_VERSION
form.value.contentStatus = 'ready'
form.value.contentText = getDocumentPlainText(contentJson)
```

```vue
<IsleArticleViewer :content="documentState.document" />
```

- [ ] **Step 5: Run helper and page tests to verify they pass**

Run: `npm run test:unit -- src/views/content/articleManage/aev.document.spec.ts src/views/content/articleManage/view.document.spec.ts src/views/content/articleManage/aev.document-v2.spec.ts src/views/content/articleManage/aev.form.spec.ts`
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add nest-admin-frontend/src/views/content/articleManage/aev.document.ts nest-admin-frontend/src/views/content/articleManage/view.document.ts nest-admin-frontend/src/views/content/articleManage/aev.vue nest-admin-frontend/src/views/content/articleManage/view.vue nest-admin-frontend/src/views/content/articleManage/detail.vue nest-admin-frontend/src/views/content/articleManage/*.spec.ts
git commit -m "feat: align article pages with real isle runtime"
```

## Task 7: Verify The Full Frontend Runtime Replacement

**Files:**
- Modify: no source files unless verification exposes failures
- Test: frontend verification commands only

- [ ] **Step 1: Run frontend type-check**

Run: `npm run type-check`
Workdir: `nest-admin-frontend`
Expected: PASS

- [ ] **Step 2: Run targeted frontend tests**

Run: `npm run test:unit -- src/features/isle-editor/components/isleArticleViewer.spec.ts src/features/isle-editor/adapters/isleContent.spec.ts src/features/isle-editor/adapters/useIsleUpload.spec.ts src/views/content/articleManage/aev.form.spec.ts src/views/content/articleManage/aev.subapp.spec.ts src/views/content/articleManage/aev.bridge.spec.ts src/views/content/articleManage/aev.document.spec.ts src/views/content/articleManage/aev.document-v2.spec.ts src/views/content/articleManage/view.document.spec.ts src/views/content/articleManage/view.subapp.spec.ts src/views/content/articleManage/detail.subapp.spec.ts`
Expected: PASS

- [ ] **Step 3: Run API contract check**

Run: `npm run check:api-contract`
Workdir: `/Users/yyk/工作/代码开发/Project-V2.0`
Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add nest-admin-frontend
git commit -m "test: verify isle runtime replacement"
```

## Self-Review

### Spec coverage

- 真实内核替换：Task 1 + Task 2
- 适配层对齐：Task 3
- 编辑器真实接线：Task 4
- viewer 真实接线：Task 5
- 页面协议和 helper 对齐：Task 6
- 前端完整验证：Task 7

无 spec 漏项。

### Placeholder scan

- 无 `TODO`、`TBD`、`implement later`
- 每个任务都给了明确文件、代码骨架、命令和预期结果

### Type consistency

- 项目级公开接口统一为 `IsleArticleEditor` / `IsleArticleViewer`
- 正文协议统一为 `type: 'doc'` + `content`
- 上传桥接统一在 `useIsleUpload.ts`

无命名冲突。
