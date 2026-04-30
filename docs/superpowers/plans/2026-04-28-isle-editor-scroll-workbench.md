# Isle Editor Scroll Workbench Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 让 `IsleArticleEditor` 成为一个稳定的编辑工作台：目录固定、工具栏固定、正文独立滚动，避免长文编辑时正文持续把工具栏顶走。

**Architecture:** 只调整 `nest-admin-frontend/src/features/isle-editor/components/IsleArticleEditor.vue` 内部布局，不修改 `aev.vue` 等业务页结构。通过给工作台设定可控高度、明确正文唯一滚动容器、让目录独立滚动来实现稳定的三区布局。

**Tech Stack:** Vue 3、Scoped CSS、现有 `IsleArticleEditor.vue` 结构、Vitest 源码断言测试

---

## File Structure

### Editor workbench component

- Modify: `nest-admin-frontend/src/features/isle-editor/components/IsleArticleEditor.vue`

### Layout regression tests

- Create: `nest-admin-frontend/src/features/isle-editor/components/isleArticleEditor.layout.spec.ts`

## Task 1: Lock The Workbench Layout Contract With Source-Level Tests

**Files:**
- Create: `nest-admin-frontend/src/features/isle-editor/components/isleArticleEditor.layout.spec.ts`
- Test: `nest-admin-frontend/src/features/isle-editor/components/IsleArticleEditor.vue`

- [ ] **Step 1: Write the failing layout contract tests**

```ts
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

function readEditorSource() {
  return readFileSync(resolve(process.cwd(), 'src/features/isle-editor/components/IsleArticleEditor.vue'), 'utf-8')
}

describe('IsleArticleEditor layout workbench', () => {
  it('keeps toc, toolbar, and scroll as separate layout responsibilities', () => {
    const source = readEditorSource()

    expect(source).toContain('class="isle-article-editor__toc"')
    expect(source).toContain('class="isle-article-editor__toolbar"')
    expect(source).toContain('class="isle-article-editor__scroll"')
  })

  it('uses a bounded workbench height and keeps scroll on the body area', () => {
    const source = readEditorSource()

    expect(source).toContain('height: clamp(640px, 72vh, 980px);')
    expect(source).toContain('.isle-article-editor__scroll {')
    expect(source).toContain('overflow: auto;')
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test:unit -- src/features/isle-editor/components/isleArticleEditor.layout.spec.ts`
Expected: FAIL because the bounded-height contract is not yet present in `IsleArticleEditor.vue`

- [ ] **Step 3: Add one more failing assertion for responsive toc handling**

```ts
it('keeps toc scrollable and relaxes it on narrower screens', () => {
  const source = readEditorSource()

  expect(source).toContain('.isle-article-editor__toc {')
  expect(source).toContain('overflow: auto;')
  expect(source).toContain('@media (max-width: 1024px)')
})
```

- [ ] **Step 4: Run test again to confirm the intended layout contract is red**

Run: `npm run test:unit -- src/features/isle-editor/components/isleArticleEditor.layout.spec.ts`
Expected: FAIL on missing bounded-height and responsive workbench rules

- [ ] **Step 5: Commit**

```bash
git add nest-admin-frontend/src/features/isle-editor/components/isleArticleEditor.layout.spec.ts
git commit -m "test: lock isle editor workbench layout"
```

## Task 2: Turn `IsleArticleEditor` Into A Bounded Workbench

**Files:**
- Modify: `nest-admin-frontend/src/features/isle-editor/components/IsleArticleEditor.vue`
- Test: `nest-admin-frontend/src/features/isle-editor/components/isleArticleEditor.layout.spec.ts`

- [ ] **Step 1: Implement bounded workbench height in the layout container**

```css
.isle-article-editor__layout {
  display: flex;
  min-height: 640px;
  height: clamp(640px, 72vh, 980px);
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 12px;
  overflow: hidden;
  background: var(--el-bg-color);
}
```

- [ ] **Step 2: Keep the right side as a strict column workbench**

```css
.isle-article-editor__main {
  display: flex;
  min-width: 0;
  flex: 1;
  min-height: 0;
  flex-direction: column;
}
```

The key addition is `min-height: 0;` so the inner scroll container can shrink and actually own scrolling.

- [ ] **Step 3: Keep the toolbar outside the scroll container**

No DOM rewrite is needed if the structure stays:

```vue
<div class="isle-article-editor__main">
  <div class="isle-article-editor__toolbar">
    ...
  </div>
  <div ref="scrollViewRef" class="isle-article-editor__scroll">
    ...
  </div>
</div>
```

Do not move toolbar into the scroll container.

- [ ] **Step 4: Make the body area the only main editor scroller**

```css
.isle-article-editor__scroll {
  flex: 1;
  min-height: 0;
  overflow: auto;
}

.isle-article-editor__content {
  max-width: 860px;
  margin: 0 auto;
  padding: 20px 28px 40px;
  box-sizing: border-box;
}
```

- [ ] **Step 5: Run layout contract test to verify the workbench shape passes**

Run: `npm run test:unit -- src/features/isle-editor/components/isleArticleEditor.layout.spec.ts`
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add nest-admin-frontend/src/features/isle-editor/components/IsleArticleEditor.vue nest-admin-frontend/src/features/isle-editor/components/isleArticleEditor.layout.spec.ts
git commit -m "feat: bound isle editor workbench height"
```

## Task 3: Keep Toc Stable And Responsive Without Touching Business Pages

**Files:**
- Modify: `nest-admin-frontend/src/features/isle-editor/components/IsleArticleEditor.vue`
- Test: `nest-admin-frontend/src/features/isle-editor/components/isleArticleEditor.layout.spec.ts`

- [ ] **Step 1: Keep the toc independently scrollable on desktop**

```css
.isle-article-editor__toc {
  width: 240px;
  border-right: 1px solid var(--el-border-color-lighter);
  overflow: auto;
  background: var(--el-fill-color-extra-light);
}
```

- [ ] **Step 2: Relax the toc footprint on narrower screens**

```css
@media (max-width: 1024px) {
  .isle-article-editor__layout {
    height: clamp(560px, 68vh, 860px);
  }

  .isle-article-editor__toc {
    width: 200px;
  }
}

@media (max-width: 768px) {
  .isle-article-editor__layout {
    min-height: 560px;
    height: 70vh;
  }

  .isle-article-editor__toc {
    display: none;
  }
}
```

This keeps the “editing workbench” idea while not forcing the toc to squeeze the writing area on mobile.

- [ ] **Step 3: Add/adjust a source-level test for responsive toc behavior**

```ts
expect(source).toContain('@media (max-width: 768px)')
expect(source).toContain('.isle-article-editor__toc {')
expect(source).toContain('display: none;')
```

- [ ] **Step 4: Run layout contract test to verify responsive rules pass**

Run: `npm run test:unit -- src/features/isle-editor/components/isleArticleEditor.layout.spec.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add nest-admin-frontend/src/features/isle-editor/components/IsleArticleEditor.vue nest-admin-frontend/src/features/isle-editor/components/isleArticleEditor.layout.spec.ts
git commit -m "feat: keep isle editor toc stable on long documents"
```

## Task 4: Verify Workbench Layout Without Business Page Changes

**Files:**
- Verify only: `nest-admin-frontend/src/features/isle-editor/components/IsleArticleEditor.vue`

- [ ] **Step 1: Run layout contract test**

Run: `npm run test:unit -- src/features/isle-editor/components/isleArticleEditor.layout.spec.ts`
Expected: PASS

- [ ] **Step 2: Run existing media and viewer regressions**

Run: `npm run test:unit -- src/features/isle-editor/components/media-block.spec.ts src/features/isle-editor/components/isleArticleViewer.spec.ts src/features/isle-editor/components/isleArticleEditor.media-nodeview.spec.ts`
Expected: PASS

- [ ] **Step 3: Run frontend type check**

Run: `npm run type-check`
Expected: PASS

- [ ] **Step 4: Commit final verified state**

```bash
git add nest-admin-frontend/src/features/isle-editor/components/IsleArticleEditor.vue nest-admin-frontend/src/features/isle-editor/components/isleArticleEditor.layout.spec.ts docs/superpowers/specs/2026-04-28-isle-editor-scroll-workbench-design.md docs/superpowers/plans/2026-04-28-isle-editor-scroll-workbench.md
git commit -m "feat: make isle editor body scroll independently"
```

## Self-Review

- Spec coverage checked: bounded workbench height, single body scroller, toc stability, and mobile relaxation all map to explicit tasks.
- Placeholder scan checked: no `TODO`, `TBD`, “similar to above”, or vague “adjust styles” instructions remain.
- Type consistency checked: all work is confined to the current `IsleArticleEditor.vue` class names and existing DOM structure; no new component APIs are introduced.
