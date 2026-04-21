# Knowledge Editor Form Governance Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 完成 `content/aev` 知识编辑页的完整表单治理，删除 Hero，重组区块顺序，并统一底部操作区。

**Architecture:** 保留现有知识编辑、模板、借阅、权限和 AI 逻辑不变，只重构 `aev.vue` 的页面骨架与区块顺序。让正文编辑区前置，治理配置后置，并用测试约束 Hero 已删除且区块顺序符合预期。

**Tech Stack:** Vue 3, Element Plus, Vitest

---

### Task 1: 建立知识编辑页结构守卫测试

**Files:**
- Create: `nest-admin-frontend/src/views/content/articleManage/aev.form.spec.ts`
- Test: `nest-admin-frontend/src/views/content/articleManage/aev.form.spec.ts`

- [ ] **Step 1: 写失败测试，约束 Hero 已删除，正文区位于治理信息区之前，封面 Upload 和 OperateBar 仍保留**

```ts
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

function readAev() {
  return readFileSync(resolve(__dirname, 'aev.vue'), 'utf-8')
}

describe('知识编辑页结构治理守卫', () => {
  it('aev 页面删除 Hero 并保留主工作区', () => {
    const source = readAev()
    expect(source).not.toMatch(/knowledge-editor-hero/)
    expect(source).toMatch(/knowledge-form-section/)
    expect(source).toMatch(/OperateBar/)
    expect(source).toMatch(/Upload/)
  })
})
```

- [ ] **Step 2: 运行测试并确认失败**

Run: `npm run test:unit -- src/views/content/articleManage/aev.form.spec.ts`

Expected: FAIL，因为页面仍保留 `knowledge-editor-hero`。

- [ ] **Step 3: 保持测试不变，后续用真实重构让测试转绿**

```ts
// 测试保持不变，后续通过页面重构让其通过。
```

- [ ] **Step 4: 再次运行测试确认失败原因稳定**

Run: `npm run test:unit -- src/views/content/articleManage/aev.form.spec.ts`

Expected: FAIL。

- [ ] **Step 5: 提交当前任务改动**

```bash
git add nest-admin-frontend/src/views/content/articleManage/aev.form.spec.ts
git commit -m "test: guard knowledge editor layout cleanup"
```

### Task 2: 重构 aev 页面骨架与区块顺序

**Files:**
- Modify: `nest-admin-frontend/src/views/content/articleManage/aev.vue`
- Test: `nest-admin-frontend/src/views/content/articleManage/aev.form.spec.ts`

- [ ] **Step 1: 保留失败测试作为结构约束**

```ts
it('aev 页面删除 Hero 并保留主工作区', () => {
  // 测试保持不变，作为结构重组约束。
})
```

- [ ] **Step 2: 运行测试确认结构问题仍存在**

Run: `npm run test:unit -- src/views/content/articleManage/aev.form.spec.ts`

Expected: FAIL。

- [ ] **Step 3: 删除 Hero 并重排区块顺序**

```vue
<template>
  <div class="knowledge-editor-page">
    <BaForm ...>
      <section class="knowledge-form-section">基础信息</section>
      <section class="knowledge-form-section knowledge-form-section--full">知识内容</section>
      <section class="knowledge-form-section">治理信息</section>
      <section class="knowledge-form-section knowledge-form-section--full">首页推荐配置</section>
      <section class="knowledge-form-section knowledge-form-section--full">AI 预留信息</section>
    </BaForm>
    <OperateBar ... />
  </div>
</template>
```

- [ ] **Step 4: 运行测试确认结构守卫通过**

Run: `npm run test:unit -- src/views/content/articleManage/aev.form.spec.ts`

Expected: PASS。

- [ ] **Step 5: 提交当前任务改动**

```bash
git add nest-admin-frontend/src/views/content/articleManage/aev.vue nest-admin-frontend/src/views/content/articleManage/aev.form.spec.ts
git commit -m "fix: simplify knowledge editor layout"
```

### Task 3: 完整验证与收尾

**Files:**
- Modify: `nest-admin-frontend/src/views/content/articleManage/aev.vue`
- Create: `nest-admin-frontend/src/views/content/articleManage/aev.form.spec.ts`

- [ ] **Step 1: 运行前端全量单测**

Run: `npm run test:unit`

Expected: PASS。

- [ ] **Step 2: 运行前端类型检查**

Run: `npm run type-check`

Expected: PASS。

- [ ] **Step 3: 检查工作区差异**

Run: `git status --short && git diff -- nest-admin-frontend/src/views/content/articleManage/aev.vue nest-admin-frontend/src/views/content/articleManage/aev.form.spec.ts`

Expected: 仅包含 `aev` 页面治理相关改动。

- [ ] **Step 4: 生成最终提交**

```bash
git add nest-admin-frontend/src/views/content/articleManage/aev.vue nest-admin-frontend/src/views/content/articleManage/aev.form.spec.ts
git commit -m "fix: reorganize knowledge editor form"
```
