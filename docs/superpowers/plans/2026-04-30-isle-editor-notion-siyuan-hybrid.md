# Isle Editor Notion Siyuan Hybrid Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Polish `IsleArticleEditor` into a low-risk Notion/Siyuan hybrid foundation with lighter sticky toolbar, semantic TOC, explicit read-only state, empty document guidance, and document-like typography.

**Architecture:** Keep the existing `IsleArticleEditor` data flow and layout boundaries. Add small computed state and template wrappers in `IsleArticleEditor.vue`, plus source-level layout contract tests in `isleArticleEditor.layout.spec.ts`; only touch `isleContent.ts` if an empty-document helper is needed.

**Tech Stack:** Vue 3 `<script setup lang="ts">`, scoped CSS, Vitest source contract tests, Element Plus CSS variables, existing Isle/Tiptap editor components.

---

## File Structure

- Modify: `nest-admin-frontend/src/features/isle-editor/adapters/isleContent.ts`
  - Add `isIsleContentEmpty(document)` helper so empty document detection is reusable and typed.
- Modify: `nest-admin-frontend/src/features/isle-editor/components/IsleArticleEditor.vue`
  - Add read-only class/ARIA, semantic TOC header, read-only toolbar notice, empty document guidance, and paper-style content CSS.
- Modify: `nest-admin-frontend/src/features/isle-editor/components/isleArticleEditor.layout.spec.ts`
  - Add source contract tests before implementation and keep existing layout contract coverage.

---

### Task 1: Add Empty Document Helper

**Files:**
- Modify: `nest-admin-frontend/src/features/isle-editor/adapters/isleContent.ts`
- Test: no dedicated unit test exists for this adapter; behavior is covered by `IsleArticleEditor` source contract in Task 2.

- [ ] **Step 1: Write the failing editor contract test for empty guidance dependency**

Modify `nest-admin-frontend/src/features/isle-editor/components/isleArticleEditor.layout.spec.ts` and add this test before the responsive test:

```ts
  it('空文档编辑态提供轻量写作引导', () => {
    const source = readEditorSource()

    expect(source).toContain('isIsleContentEmpty')
    expect(source).toContain('const isEmptyDocument = computed(() => isIsleContentEmpty(currentDocument.value))')
    expect(source).toMatch(/v-if="isEmptyDocument && !disabled"/)
    expect(source).toContain('开始编写知识内容')
    expect(source).toContain('输入内容，或使用工具栏插入标题、列表、图片和附件')
  })
```

- [ ] **Step 2: Run test to verify it fails**

Run:

```bash
npx vitest run src/features/isle-editor/components/isleArticleEditor.layout.spec.ts
```

Expected: FAIL in `空文档编辑态提供轻量写作引导` because `isIsleContentEmpty` and the guidance markup do not exist yet.

- [ ] **Step 3: Add the typed helper**

Modify `nest-admin-frontend/src/features/isle-editor/adapters/isleContent.ts` by adding this code after `extractIslePlainText`:

```ts
export function isIsleContentEmpty(document: IsleContentDocument | null | undefined): boolean {
  return extractIslePlainText(document).trim().length === 0
}
```

- [ ] **Step 4: Leave the editor test red**

Run:

```bash
npx vitest run src/features/isle-editor/components/isleArticleEditor.layout.spec.ts
```

Expected: still FAIL because `IsleArticleEditor.vue` has not imported or rendered the helper yet. This confirms Task 2 still has production work to do.

---

### Task 2: Add Read-Only State And Empty Guidance

**Files:**
- Modify: `nest-admin-frontend/src/features/isle-editor/components/IsleArticleEditor.vue`
- Test: `nest-admin-frontend/src/features/isle-editor/components/isleArticleEditor.layout.spec.ts`

- [ ] **Step 1: Write failing read-only contract test**

Add this test to `isleArticleEditor.layout.spec.ts` before the responsive test:

```ts
  it('disabled 时呈现明确查看模式并隐藏格式工具栏', () => {
    const source = readEditorSource()

    expect(source).toMatch(/:class="\{ 'isle-article-editor--readonly': disabled \}"/)
    expect(source).toContain(':aria-readonly="disabled ? \'true\' : undefined"')
    expect(source).toMatch(/v-if="disabled"[^>]*class="isle-article-editor__readonly-notice"/)
    expect(source).toContain('查看模式')
    expect(source).toContain('当前知识不可编辑，仅支持阅读')
    expect(source).toMatch(/<IsleEditorToolbar v-else-if="editorRef\?\.editor"/)
    expect(source).toMatch(/<IsleEditorBubble v-if="!disabled && editorRef\?\.editor"/)
  })
```

- [ ] **Step 2: Run test to verify it fails**

Run:

```bash
npx vitest run src/features/isle-editor/components/isleArticleEditor.layout.spec.ts
```

Expected: FAIL because read-only class, ARIA, notice, toolbar guard, and bubble guard do not exist yet.

- [ ] **Step 3: Implement minimal script changes**

In `IsleArticleEditor.vue`, replace the import from `isleContent` with:

```ts
import {
  createEmptyIsleContent,
  isIsleContentEmpty,
  type IsleContentDocument,
} from '../adapters/isleContent'
```

Add this computed after `currentDocument`:

```ts
const isEmptyDocument = computed(() => isIsleContentEmpty(currentDocument.value))
```

- [ ] **Step 4: Implement minimal template changes**

Replace the root opening tag in `IsleArticleEditor.vue` with:

```vue
  <div
    class="isle-article-editor"
    :class="{ 'isle-article-editor--readonly': disabled }"
    data-testid="isle-article-editor"
    :aria-readonly="disabled ? 'true' : undefined"
  >
```

Replace the toolbar body with:

```vue
          <div v-if="disabled" class="isle-article-editor__readonly-notice">
            <span class="isle-article-editor__readonly-title">查看模式</span>
            <span class="isle-article-editor__readonly-desc">当前知识不可编辑，仅支持阅读</span>
          </div>
          <template v-else>
            <ITooltip :text="showToc ? '隐藏目录' : '显示目录'">
              <template #default>
                <IButton class="isle-article-editor__toc-toggle" @click="showToc = !showToc">
                  <template #icon>
                    <IIcon :name="showToc ? 'outdent' : 'indent'" :size="16" />
                  </template>
                </IButton>
              </template>
            </ITooltip>
            <IsleEditorToolbar v-else-if="editorRef?.editor" :editor="editorRef.editor" />
          </template>
```

Replace the bubble line with:

```vue
            <IsleEditorBubble v-if="!disabled && editorRef?.editor" :editor="editorRef.editor" />
```

Add the empty guidance before `<IsleEditorBubble ...>`:

```vue
            <div v-if="isEmptyDocument && !disabled" class="isle-article-editor__empty-guide">
              <div class="isle-article-editor__empty-title">开始编写知识内容</div>
              <div class="isle-article-editor__empty-desc">输入内容，或使用工具栏插入标题、列表、图片和附件</div>
            </div>
```

- [ ] **Step 5: Run test to verify it passes**

Run:

```bash
npx vitest run src/features/isle-editor/components/isleArticleEditor.layout.spec.ts
```

Expected: PASS for the empty guidance and read-only contract tests.

---

### Task 3: Add Semantic TOC Header

**Files:**
- Modify: `nest-admin-frontend/src/features/isle-editor/components/IsleArticleEditor.vue`
- Test: `nest-admin-frontend/src/features/isle-editor/components/isleArticleEditor.layout.spec.ts`

- [ ] **Step 1: Write failing TOC contract test**

Add this test before the responsive test:

```ts
  it('目录区提供明确语义标题和说明', () => {
    const source = readEditorSource()

    expect(source).toContain('class="isle-article-editor__toc-header"')
    expect(source).toContain('class="isle-article-editor__toc-title"')
    expect(source).toContain('目录')
    expect(source).toContain('class="isle-article-editor__toc-desc"')
    expect(source).toContain('添加标题后自动生成')
    expect(source).toMatch(/<div class="isle-article-editor__toc-body">[\s\S]*<IsleEditorToc/)
  })
```

- [ ] **Step 2: Run test to verify it fails**

Run:

```bash
npx vitest run src/features/isle-editor/components/isleArticleEditor.layout.spec.ts
```

Expected: FAIL because the TOC header wrapper does not exist.

- [ ] **Step 3: Implement TOC wrapper**

Replace the `<aside>` content in `IsleArticleEditor.vue` with:

```vue
      <aside v-if="showToc && editorRef?.editor" class="isle-article-editor__toc">
        <div class="isle-article-editor__toc-header">
          <div class="isle-article-editor__toc-title">目录</div>
          <div class="isle-article-editor__toc-desc">添加标题后自动生成</div>
        </div>
        <div class="isle-article-editor__toc-body">
          <IsleEditorToc :editor="editorRef.editor" :scroll-view="scrollViewRef" />
        </div>
      </aside>
```

- [ ] **Step 4: Run test to verify it passes**

Run:

```bash
npx vitest run src/features/isle-editor/components/isleArticleEditor.layout.spec.ts
```

Expected: PASS for the TOC contract test.

---

### Task 4: Add Visual Polish Styles

**Files:**
- Modify: `nest-admin-frontend/src/features/isle-editor/components/IsleArticleEditor.vue`
- Test: `nest-admin-frontend/src/features/isle-editor/components/isleArticleEditor.layout.spec.ts`

- [ ] **Step 1: Write failing style contract test**

Add this test before the responsive test:

```ts
  it('正文区具备文档纸张感和基础富文本节奏', () => {
    const source = readEditorSource()

    expect(source).toMatch(/\.isle-article-editor__content\s*\{[\s\S]*max-width:\s*820px;/)
    expect(source).toMatch(/\.isle-article-editor__content\s*\{[\s\S]*padding:\s*32px 32px 56px;/)
    expect(source).toMatch(/\.isle-article-editor__content\s*:deep\(\.tiptap\)\s*\{[\s\S]*line-height:\s*1\.75;/)
    expect(source).toMatch(/\.isle-article-editor__content\s*:deep\(\.tiptap h1,/)
    expect(source).toMatch(/\.isle-article-editor__content\s*:deep\(\.tiptap blockquote\)/)
    expect(source).toMatch(/\.isle-article-editor__content\s*:deep\(\.tiptap pre\)/)
    expect(source).toMatch(/\.isle-article-editor__content\s*:deep\(\.tiptap img\)/)
  })

  it('工具栏、目录、只读和空文档提示具备独立视觉层级', () => {
    const source = readEditorSource()

    expect(source).toMatch(/\.isle-article-editor__toolbar\s*\{[\s\S]*box-shadow:\s*0 1px 0 rgba\(15, 23, 42, 0\.04\);/)
    expect(source).toMatch(/\.isle-article-editor__toc-header\s*\{[\s\S]*padding:\s*14px 16px 10px;/)
    expect(source).toMatch(/\.isle-article-editor__readonly-notice\s*\{[\s\S]*display:\s*flex;/)
    expect(source).toMatch(/\.isle-article-editor__empty-guide\s*\{[\s\S]*position:\s*absolute;/)
    expect(source).toMatch(/\.isle-article-editor--readonly\s+\.isle-article-editor__layout/)
  })
```

- [ ] **Step 2: Run test to verify it fails**

Run:

```bash
npx vitest run src/features/isle-editor/components/isleArticleEditor.layout.spec.ts
```

Expected: FAIL because these style contracts do not exist yet.

- [ ] **Step 3: Implement visual polish CSS**

In `IsleArticleEditor.vue`, update and add CSS as follows.

Replace `.isle-article-editor__toc` with:

```css
.isle-article-editor__toc {
  width: 248px;
  border-right: 1px solid var(--el-border-color-lighter);
  overflow: auto;
  background: color-mix(in srgb, var(--el-fill-color-extra-light) 86%, var(--el-bg-color));
}

.isle-article-editor__toc-header {
  padding: 14px 16px 10px;
  border-bottom: 1px solid var(--el-border-color-lighter);
}

.isle-article-editor__toc-title {
  color: var(--el-text-color-primary);
  font-size: 13px;
  font-weight: 600;
  line-height: 1.4;
}

.isle-article-editor__toc-desc {
  margin-top: 4px;
  color: var(--el-text-color-secondary);
  font-size: 12px;
  line-height: 1.5;
}

.isle-article-editor__toc-body {
  padding: 8px 10px 12px;
}
```

Replace `.isle-article-editor__toolbar` with:

```css
.isle-article-editor__toolbar {
  position: sticky;
  top: 0;
  z-index: 3;
  display: flex;
  align-items: center;
  gap: 8px;
  min-height: 44px;
  padding: 6px 12px;
  border-bottom: 1px solid var(--el-border-color-lighter);
  background: var(--el-bg-color);
  box-shadow: 0 1px 0 rgba(15, 23, 42, 0.04);
}
```

Add after `.isle-article-editor__toc-toggle`:

```css
.isle-article-editor__readonly-notice {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 6px 10px;
  color: var(--el-text-color-secondary);
  font-size: 13px;
  line-height: 1.5;
}

.isle-article-editor__readonly-title {
  color: var(--el-text-color-primary);
  font-weight: 600;
}

.isle-article-editor__readonly-desc {
  color: var(--el-text-color-secondary);
}
```

Replace `.isle-article-editor__content` with:

```css
.isle-article-editor__content {
  position: relative;
  box-sizing: border-box;
  max-width: 820px;
  margin: 0 auto;
  padding: 32px 32px 56px;
}
```

Add after `.isle-article-editor__content`:

```css
.isle-article-editor__empty-guide {
  position: absolute;
  top: 32px;
  left: 32px;
  right: 32px;
  pointer-events: none;
}

.isle-article-editor__empty-title {
  color: var(--el-text-color-primary);
  font-size: 16px;
  font-weight: 600;
  line-height: 1.5;
}

.isle-article-editor__empty-desc {
  margin-top: 6px;
  color: var(--el-text-color-secondary);
  font-size: 13px;
  line-height: 1.6;
}

.isle-article-editor__content :deep(.tiptap) {
  min-height: 520px;
  color: var(--el-text-color-primary);
  font-size: 15px;
  line-height: 1.75;
  outline: none;
}

.isle-article-editor__content :deep(.tiptap h1,
.tiptap h2,
.tiptap h3,
.tiptap h4,
.tiptap h5,
.tiptap h6) {
  margin: 1.35em 0 0.55em;
  color: var(--el-text-color-primary);
  font-weight: 650;
  line-height: 1.28;
}

.isle-article-editor__content :deep(.tiptap p) {
  margin: 0.65em 0;
}

.isle-article-editor__content :deep(.tiptap ul),
.isle-article-editor__content :deep(.tiptap ol) {
  margin: 0.7em 0;
  padding-left: 1.5em;
}

.isle-article-editor__content :deep(.tiptap blockquote) {
  margin: 1em 0;
  padding: 8px 14px;
  border-left: 3px solid var(--el-border-color);
  border-radius: 8px;
  background: var(--el-fill-color-extra-light);
  color: var(--el-text-color-regular);
}

.isle-article-editor__content :deep(.tiptap pre) {
  margin: 1em 0;
  padding: 14px 16px;
  border-radius: 12px;
  background: #0f172a;
  color: #e5e7eb;
  overflow: auto;
}

.isle-article-editor__content :deep(.tiptap img) {
  max-width: 100%;
  border-radius: 12px;
}

.isle-article-editor--readonly .isle-article-editor__layout {
  background: color-mix(in srgb, var(--el-bg-color) 92%, var(--el-fill-color-extra-light));
}
```

Add inside existing `@media (max-width: 1024px)` block:

```css
  .isle-article-editor__content {
    padding: 24px 18px 44px;
  }

  .isle-article-editor__empty-guide {
    top: 24px;
    left: 18px;
    right: 18px;
  }
```

- [ ] **Step 4: Run test to verify it passes**

Run:

```bash
npx vitest run src/features/isle-editor/components/isleArticleEditor.layout.spec.ts
```

Expected: PASS for all editor layout tests.

---

### Task 5: Final Verification

**Files:**
- Verify: all files modified in Tasks 1-4

- [ ] **Step 1: Run focused editor tests**

Run:

```bash
npx vitest run src/features/isle-editor/components/isleArticleEditor.layout.spec.ts
```

Expected: PASS with all tests in `isleArticleEditor.layout.spec.ts` passing.

- [ ] **Step 2: Run frontend type check**

Run:

```bash
npm run type-check
```

Expected: command exits with status 0 and `vue-tsc --build --force` completes without type errors.

- [ ] **Step 3: Review relevant diff**

Run from repo root:

```bash
git diff -- nest-admin-frontend/src/features/isle-editor/adapters/isleContent.ts nest-admin-frontend/src/features/isle-editor/components/IsleArticleEditor.vue nest-admin-frontend/src/features/isle-editor/components/isleArticleEditor.layout.spec.ts docs/superpowers/plans/2026-04-30-isle-editor-notion-siyuan-hybrid.md
```

Expected: diff only contains the empty helper, editor UI/state/styles, layout tests, and this plan.

---

## Self-Review

Spec coverage:

- Tool weak polish: Task 4 toolbar CSS.
- Semantic TOC: Task 3 wrapper and Task 4 TOC CSS.
- Explicit read-only state: Task 2 template/state and Task 4 readonly styles.
- Empty document guidance: Task 1 helper and Task 2 guidance markup.
- Paper-like content: Task 4 content CSS.
- No data structure or save API changes: all tasks avoid `contentJson` schema and save code.

Placeholder scan:

- No `TBD`, `TODO`, or unspecified implementation steps are present.

Type consistency:

- The helper is named `isIsleContentEmpty` in all tasks.
- The computed is named `isEmptyDocument` in tests and implementation.
- The read-only CSS class is consistently `isle-article-editor--readonly`.
