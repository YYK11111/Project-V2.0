# Main Frontend TipTap 2 Consolidation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 让 `nest-admin-frontend` 的编辑器生态收敛为“知识模块使用真实 `isle-editor` + 非知识页面使用 Quill”，并彻底删除所有非 `isle-editor` 的 TipTap 3 废弃方案代码与测试。

**Architecture:** 先接通根目录 `isle-editor/` 的真实 TipTap 2 运行时，替换 `src/features/isle-editor/**` 中当前的占位实现；随后删除 `src/features/document-editor/**`、`src/features/document-editor-v2/**`、`src/components/Editor/tiptapExtensions.ts` 及其相关测试与依赖。知识模块页面继续通过 `IsleArticleEditor` / `IsleArticleViewer` 作为稳定入口，非知识页面保留 Quill 路线不变。

**Tech Stack:** Vue 3、Vite、TypeScript、上游 `isle-editor` 源码、TipTap 2、Quill、Vitest、`vue-tsc`

---

## File Structure

### Real Isle runtime files

- Modify: `nest-admin-frontend/src/features/isle-editor/core/**`
- Modify: `nest-admin-frontend/src/features/isle-editor/vue/**`
- Modify: `nest-admin-frontend/src/features/isle-editor/styles/**`
- Modify: `nest-admin-frontend/src/features/isle-editor/adapters/isleContent.ts`
- Modify: `nest-admin-frontend/src/features/isle-editor/adapters/useIsleUpload.ts`
- Modify: `nest-admin-frontend/src/features/isle-editor/components/IsleArticleEditor.vue`
- Modify: `nest-admin-frontend/src/features/isle-editor/components/IsleArticleViewer.vue`

### Knowledge article pages

- Modify: `nest-admin-frontend/src/views/content/articleManage/aev.vue`
- Modify: `nest-admin-frontend/src/views/content/articleManage/aev.document.ts`
- Modify: `nest-admin-frontend/src/views/content/articleManage/view.vue`
- Modify: `nest-admin-frontend/src/views/content/articleManage/detail.vue`
- Modify: `nest-admin-frontend/src/views/content/articleManage/view.document.ts`

### Deprecated editor code to delete

- Delete: `nest-admin-frontend/src/features/document-editor/**`
- Delete: `nest-admin-frontend/src/features/document-editor-v2/**`
- Delete: `nest-admin-frontend/src/components/Editor/tiptapExtensions.ts`

### Tests to update or delete

- Modify: `nest-admin-frontend/src/features/isle-editor/components/isleArticleViewer.spec.ts`
- Modify: `nest-admin-frontend/src/features/isle-editor/adapters/isleContent.spec.ts`
- Modify: `nest-admin-frontend/src/features/isle-editor/adapters/useIsleUpload.spec.ts`
- Modify: `nest-admin-frontend/src/views/content/articleManage/aev.form.spec.ts`
- Modify: `nest-admin-frontend/src/views/content/articleManage/aev.subapp.spec.ts`
- Modify: `nest-admin-frontend/src/views/content/articleManage/aev.bridge.spec.ts`
- Modify: `nest-admin-frontend/src/views/content/articleManage/aev.document.spec.ts`
- Modify: `nest-admin-frontend/src/views/content/articleManage/aev.document-v2.spec.ts`
- Modify: `nest-admin-frontend/src/views/content/articleManage/view.document.spec.ts`
- Modify: `nest-admin-frontend/src/views/content/articleManage/view.subapp.spec.ts`
- Modify: `nest-admin-frontend/src/views/content/articleManage/detail.subapp.spec.ts`
- Delete: `nest-admin-frontend/src/features/document-editor/**/*.spec.ts`
- Delete: `nest-admin-frontend/src/features/document-editor-v2/**/*.spec.ts`

### Dependency files

- Modify: `nest-admin-frontend/package.json`
- Modify: `nest-admin-frontend/package-lock.json`

## Task 1: Connect Real `isle-editor` Runtime In Frontend Feature Module

**Files:**
- Modify: `nest-admin-frontend/src/features/isle-editor/core/**`
- Modify: `nest-admin-frontend/src/features/isle-editor/vue/**`
- Modify: `nest-admin-frontend/src/features/isle-editor/styles/**`
- Modify: `nest-admin-frontend/package.json`
- Modify: `nest-admin-frontend/package-lock.json`
- Test: `nest-admin-frontend/src/features/isle-editor/components/isleArticleViewer.spec.ts`

- [ ] **Step 1: Write the failing runtime smoke test**

```ts
import { describe, expect, it } from 'vitest'

describe('isle runtime replacement', () => {
  it('exports upstream NotionKit runtime pieces', async () => {
    const core = await import('../core')
    const vue = await import('../vue')

    expect(core).toHaveProperty('Heading')
    expect(core).toHaveProperty('Attachment')
    expect(vue).toHaveProperty('NotionKit')
    expect(vue).toHaveProperty('IsleEditor')
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test:unit -- src/features/isle-editor/components/isleArticleViewer.spec.ts`
Expected: FAIL because current feature module still contains placeholder runtime or missing upstream exports

- [ ] **Step 3: Sync upstream `packages/core/src/**` into feature module**

Copy from:

```text
isle-editor/packages/core/src/index.js
isle-editor/packages/core/src/editor.js
isle-editor/packages/core/src/locales/**
isle-editor/packages/core/src/extensions/**
isle-editor/packages/core/src/utils/**
```

Required path adjustments:

```js
@/utils/prefix.js -> ../utils/prefix.js
@/utils -> ../../utils/index.js
@isle-editor/core -> ../core
```

- [ ] **Step 4: Sync upstream `packages/vue3/src/**` into feature module**

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

Required path adjustments:

```js
@isle-editor/core -> ../core
@/components/slash-menu/index.js -> ../components/slash-menu/index.js
@/utils -> ./utils/index.js
@/utils/preload-icons -> ./preload-icons.js
```

- [ ] **Step 5: Install and align runtime dependencies**

Update `nest-admin-frontend/package.json` to match the real runtime needs, then run install so lockfile updates consistently.

At minimum include the upstream-only dependencies used by `isle-editor` runtime:

```json
{
  "dependencies": {
    "@floating-ui/dom": "^1.6.12",
    "@iconify/vue": "^4.2.0",
    "i18next": "^23.16.5",
    "lodash": "^4.17.21",
    "shiki": "^1.24.0",
    "tippy.js": "^6.3.7",
    "uuid": "^11.0.2"
  }
}
```

Also align the TipTap dependency strategy so the runtime can actually resolve and mount. Do not leave placeholder imports in place.

- [ ] **Step 6: Run runtime smoke test again**

Run: `npm run test:unit -- src/features/isle-editor/components/isleArticleViewer.spec.ts`
Expected: PASS or advance to the next runtime integration failure rather than import-resolution failure

- [ ] **Step 7: Commit**

```bash
git add nest-admin-frontend/src/features/isle-editor nest-admin-frontend/package.json nest-admin-frontend/package-lock.json
git commit -m "feat: sync real isle runtime into frontend"
```

## Task 2: Reconnect Knowledge Pages To Real Runtime

**Files:**
- Modify: `nest-admin-frontend/src/features/isle-editor/adapters/isleContent.ts`
- Modify: `nest-admin-frontend/src/features/isle-editor/adapters/useIsleUpload.ts`
- Modify: `nest-admin-frontend/src/features/isle-editor/components/IsleArticleEditor.vue`
- Modify: `nest-admin-frontend/src/features/isle-editor/components/IsleArticleViewer.vue`
- Modify: `nest-admin-frontend/src/views/content/articleManage/aev.vue`
- Modify: `nest-admin-frontend/src/views/content/articleManage/aev.document.ts`
- Modify: `nest-admin-frontend/src/views/content/articleManage/view.vue`
- Modify: `nest-admin-frontend/src/views/content/articleManage/detail.vue`
- Modify: `nest-admin-frontend/src/views/content/articleManage/view.document.ts`

- [ ] **Step 1: Write the failing page-integration tests**

```ts
import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

describe('knowledge pages use real isle runtime', () => {
  it('aev keeps IsleArticleEditor as public entry', () => {
    const source = readFileSync(resolve(__dirname, './aev.vue'), 'utf-8')
    expect(source).toContain('IsleArticleEditor')
  })

  it('view uses IsleArticleViewer content prop', () => {
    const source = readFileSync(resolve(__dirname, './view.vue'), 'utf-8')
    expect(source).toContain(':content="documentState.document"')
  })
})
```

- [ ] **Step 2: Run test to verify it fails if page contracts drifted**

Run: `npm run test:unit -- src/views/content/articleManage/aev.form.spec.ts src/views/content/articleManage/view.document.spec.ts src/views/content/articleManage/view.subapp.spec.ts src/views/content/articleManage/detail.subapp.spec.ts`
Expected: FAIL if adapters or public wrapper contracts no longer match the page expectations

- [ ] **Step 3: Keep article protocol adapter aligned to backend-compatible doc JSON**

Target invariants:

```ts
type IsleContentDocument = {
  type: 'doc'
  content: IsleContentNode[]
}
```

```ts
createEmptyIsleContent() -> { type: 'doc', content: [...] }
```

```ts
useIsleUpload() -> uploadImage / uploadAttachment / uploadVideo
```

- [ ] **Step 4: Wire project wrappers to real runtime while preserving public props**

Requirements:

- `IsleArticleEditor.vue`
  - keep `modelValue`
  - keep `update:modelValue`
  - inject `NotionKit`
  - inject project `mediaHandlers`
  - output real `getJSON()`
- `IsleArticleViewer.vue`
  - keep public prop `content`
  - use real readonly runtime
  - preserve heading DOM for TOC

- [ ] **Step 5: Keep page-level derived field updates intact**

```ts
form.value.contentJson = contentJson
form.value.contentVersion = DOCUMENT_CONTENT_VERSION
form.value.contentStatus = 'ready'
form.value.contentText = getDocumentPlainText(contentJson)
```

- [ ] **Step 6: Run article page tests to verify they pass**

Run: `npm run test:unit -- src/features/isle-editor/components/isleArticleViewer.spec.ts src/features/isle-editor/adapters/isleContent.spec.ts src/features/isle-editor/adapters/useIsleUpload.spec.ts src/views/content/articleManage/aev.form.spec.ts src/views/content/articleManage/aev.subapp.spec.ts src/views/content/articleManage/aev.bridge.spec.ts src/views/content/articleManage/aev.document.spec.ts src/views/content/articleManage/aev.document-v2.spec.ts src/views/content/articleManage/view.document.spec.ts src/views/content/articleManage/view.subapp.spec.ts src/views/content/articleManage/detail.subapp.spec.ts`
Expected: PASS

- [ ] **Step 7: Commit**

```bash
git add nest-admin-frontend/src/features/isle-editor/adapters nest-admin-frontend/src/features/isle-editor/components nest-admin-frontend/src/views/content/articleManage
git commit -m "feat: connect knowledge pages to real isle runtime"
```

## Task 3: Delete Deprecated TipTap 3 Editor Implementations And Tests

**Files:**
- Delete: `nest-admin-frontend/src/features/document-editor/**`
- Delete: `nest-admin-frontend/src/features/document-editor-v2/**`
- Delete: `nest-admin-frontend/src/components/Editor/tiptapExtensions.ts`
- Test: reference scans in `src/**`

- [ ] **Step 1: Write the failing retirement assertions**

```ts
import { existsSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

describe('deprecated tiptap editor removal', () => {
  it('removes legacy document editor implementations', () => {
    expect(existsSync(resolve(process.cwd(), 'src/features/document-editor'))).toBe(false)
    expect(existsSync(resolve(process.cwd(), 'src/features/document-editor-v2'))).toBe(false)
    expect(existsSync(resolve(process.cwd(), 'src/components/Editor/tiptapExtensions.ts'))).toBe(false)
  })
})
```

- [ ] **Step 2: Run search to verify deprecated code still exists**

Run: `rg "features/document-editor|features/document-editor-v2|tiptapExtensions|DocumentEditorV2|NotionDocumentEditor" src`
Expected: matches found before deletion

- [ ] **Step 3: Delete the deprecated implementation directories and tests**

Delete completely:

```text
src/features/document-editor/
src/features/document-editor-v2/
src/components/Editor/tiptapExtensions.ts
```

Also delete all tests under the two deprecated feature directories.

- [ ] **Step 4: Re-run reference scan to ensure no stale imports remain**

Run: `rg "features/document-editor|features/document-editor-v2|tiptapExtensions|DocumentEditorV2|NotionDocumentEditor" src`
Expected: no matches except explicit negative assertions in article page guard specs

- [ ] **Step 5: Commit**

```bash
git add -A nest-admin-frontend/src/features/document-editor nest-admin-frontend/src/features/document-editor-v2 nest-admin-frontend/src/components/Editor/tiptapExtensions.ts
git commit -m "refactor: remove deprecated tiptap editor code"
```

## Task 4: Remove TipTap 3 Dependencies Kept Only For Deprecated Editors

**Files:**
- Modify: `nest-admin-frontend/package.json`
- Modify: `nest-admin-frontend/package-lock.json`

- [ ] **Step 1: Write the failing dependency-boundary check**

```ts
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

describe('editor dependency boundary', () => {
  it('does not keep deprecated tiptap3-only editor dependencies', () => {
    const pkg = JSON.parse(readFileSync(resolve(process.cwd(), 'package.json'), 'utf-8'))
    expect(pkg.dependencies['@tiptap/starter-kit']).toBeUndefined()
    expect(pkg.dependencies['@tiptap/vue-3']).toBeUndefined()
  })
})
```

- [ ] **Step 2: Run check to verify it fails before cleanup**

Run: `npm run test:unit -- src/features/isle-editor/components/isleArticleViewer.spec.ts`
Expected: FAIL until package dependency cleanup is complete

- [ ] **Step 3: Remove only dependencies that are no longer referenced after deletion**

Delete from `package.json` the `@tiptap/*@3.x` packages that were kept only for `document-editor` / `document-editor-v2`.

Keep:

- Quill dependencies
- real `isle-editor` runtime dependencies
- any dependency still referenced by retained code

- [ ] **Step 4: Run install and ensure lockfile updates cleanly**

Run: `npm install`
Expected: install completes and `package-lock.json` updates consistently

- [ ] **Step 5: Commit**

```bash
git add nest-admin-frontend/package.json nest-admin-frontend/package-lock.json
git commit -m "chore: remove deprecated tiptap3 frontend deps"
```

## Task 5: Verify Consolidated Frontend Editor Stack

**Files:**
- Modify: no source files unless verification exposes failures
- Test: frontend verification commands only

- [ ] **Step 1: Run frontend type-check**

Run: `npm run type-check`
Workdir: `nest-admin-frontend`
Expected: PASS

- [ ] **Step 2: Run targeted frontend tests**

Run: `npm run test:unit -- src/features/isle-editor/components/isleArticleViewer.spec.ts src/features/isle-editor/adapters/isleContent.spec.ts src/features/isle-editor/adapters/useIsleUpload.spec.ts src/views/content/articleManage/aev.form.spec.ts src/views/content/articleManage/aev.subapp.spec.ts src/views/content/articleManage/aev.bridge.spec.ts src/views/content/articleManage/aev.document.spec.ts src/views/content/articleManage/aev.document-v2.spec.ts src/views/content/articleManage/view.document.spec.ts src/views/content/articleManage/view.subapp.spec.ts src/views/content/articleManage/detail.subapp.spec.ts src/components/Editor/editor.quill.spec.ts`
Expected: PASS

- [ ] **Step 3: Run API contract check**

Run: `npm run check:api-contract`
Workdir: `/Users/yyk/工作/代码开发/Project-V2.0`
Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add nest-admin-frontend
git commit -m "test: verify frontend editor consolidation"
```

## Self-Review

### Spec coverage

- 真实 `isle-editor` 运行时替换：Task 1 + Task 2
- 知识页面接入真实运行时：Task 2
- 删除 `document-editor` / `document-editor-v2` / `tiptapExtensions.ts`：Task 3
- 删除对应测试：Task 3
- 前端依赖清理：Task 4
- 前端整体验证：Task 5

无 spec 漏项。

### Placeholder scan

- 无 `TODO`、`TBD`、`implement later`
- 每个任务都包含明确文件、命令、代码骨架和预期结果

### Type consistency

- 知识模块公开入口统一为 `IsleArticleEditor` / `IsleArticleViewer`
- 非知识页面继续是 Quill
- 废弃 TipTap 3 方案整体删除，不再保留半清理状态

无命名冲突。
