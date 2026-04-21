# Project Form Structure And Attachment Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 完成 8 个项目链路表单页的结构整改，删除 Hero、补齐附件链路、统一分区与底部操作区。

**Architecture:** 以现有 `projectManage/form.vue` 的卡片分区思路作为基础，但移除所有 Hero 结构。前端优先统一 `section-card + footer-actions`，对缺失 `attachments` 的业务模块做最小后端字段联动，并通过前端测试、类型检查和后端 lint 验证。

**Tech Stack:** Vue 3, Element Plus, Vitest, NestJS, TypeORM

---

### Task 1: 建立表单整改守卫测试

**Files:**
- Create: `nest-admin-frontend/src/views/business/projectManage/projectManage.forms.spec.ts`
- Test: `nest-admin-frontend/src/views/business/projectManage/projectManage.forms.spec.ts`

- [ ] **Step 1: 写失败测试，约束目标页面不得再保留 Hero，并检查缺失附件页具备附件字段或附件区**

```ts
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

function readBusinessView(relativePath: string) {
  return readFileSync(resolve(__dirname, '..', relativePath), 'utf-8')
}

describe('项目链路表单结构整改守卫', () => {
  it('目标表单页不再保留 Hero 结构', () => {
    const files = [
      'projectManage/form.vue',
      'taskManage/form.vue',
      'userStoryManage/form.vue',
      'ticketManage/form.vue',
      'riskManage/form.vue',
      'changeManage/form.vue',
      'sprintManage/form.vue',
      'milestoneManage/form.vue',
    ]

    files.forEach((file) => {
      const source = readBusinessView(file)
      expect(source).not.toMatch(/km-hero/)
      expect(source).not.toMatch(/form-hero__/)
    })
  })
})
```

- [ ] **Step 2: 运行测试并确认失败**

Run: `npm run test:unit -- src/views/business/projectManage/projectManage.forms.spec.ts`

Expected: FAIL，因为 `taskManage/form.vue`、`userStoryManage/form.vue` 等页面仍含 Hero 结构。

- [ ] **Step 3: 保持测试文件不变，后续用页面整改让测试转绿**

```ts
// 测试文件保持不变，后续通过实现修复让测试通过。
```

- [ ] **Step 4: 再次运行目标测试，确认失败原因稳定**

Run: `npm run test:unit -- src/views/business/projectManage/projectManage.forms.spec.ts`

Expected: 仍然 FAIL，失败原因明确指向 Hero 结构残留。

- [ ] **Step 5: 提交当前任务改动**

```bash
git add nest-admin-frontend/src/views/business/projectManage/projectManage.forms.spec.ts
git commit -m "test: guard project form structure cleanup"
```

### Task 2: 前端重构 8 个表单页结构

**Files:**
- Modify: `nest-admin-frontend/src/views/business/projectManage/form.vue`
- Modify: `nest-admin-frontend/src/views/business/taskManage/form.vue`
- Modify: `nest-admin-frontend/src/views/business/userStoryManage/form.vue`
- Modify: `nest-admin-frontend/src/views/business/ticketManage/form.vue`
- Modify: `nest-admin-frontend/src/views/business/riskManage/form.vue`
- Modify: `nest-admin-frontend/src/views/business/changeManage/form.vue`
- Modify: `nest-admin-frontend/src/views/business/sprintManage/form.vue`
- Modify: `nest-admin-frontend/src/views/business/milestoneManage/form.vue`
- Test: `nest-admin-frontend/src/views/business/projectManage/projectManage.forms.spec.ts`

- [ ] **Step 1: 保留失败测试作为结构约束**

```ts
it('目标表单页不再保留 Hero 结构', () => {
  // 测试保持不变，作为页面结构统一的约束
})
```

- [ ] **Step 2: 运行测试确认结构问题仍未修复**

Run: `npm run test:unit -- src/views/business/projectManage/projectManage.forms.spec.ts`

Expected: FAIL。

- [ ] **Step 3: 删除 Hero 并统一页面骨架**

```vue
<template>
  <div class="form-page">
    <div class="Gcard form-shell">
      <div class="form-shell__top">
        <el-page-header ... />
      </div>
      <el-form ...>
        <div class="form-sections">
          <section class="section-card">...</section>
        </div>
        <el-form-item class="footer-actions">...</el-form-item>
      </el-form>
    </div>
  </div>
</template>
```

- [ ] **Step 4: 运行结构守卫测试确认 Hero 已移除**

Run: `npm run test:unit -- src/views/business/projectManage/projectManage.forms.spec.ts`

Expected: PASS 或只剩附件链路相关断言待补。

- [ ] **Step 5: 提交当前任务改动**

```bash
git add nest-admin-frontend/src/views/business/projectManage/form.vue nest-admin-frontend/src/views/business/taskManage/form.vue nest-admin-frontend/src/views/business/userStoryManage/form.vue nest-admin-frontend/src/views/business/ticketManage/form.vue nest-admin-frontend/src/views/business/riskManage/form.vue nest-admin-frontend/src/views/business/changeManage/form.vue nest-admin-frontend/src/views/business/sprintManage/form.vue nest-admin-frontend/src/views/business/milestoneManage/form.vue nest-admin-frontend/src/views/business/projectManage/projectManage.forms.spec.ts
git commit -m "fix: simplify project form page layouts"
```

### Task 3: 补齐附件字段链路

**Files:**
- Modify: `nest-admin-frontend/src/views/business/userStoryManage/form.vue`
- Modify: `nest-admin-frontend/src/views/business/riskManage/form.vue`
- Modify: `nest-admin-frontend/src/views/business/changeManage/form.vue`
- Modify: `nest-admin-frontend/src/views/business/sprintManage/form.vue`
- Modify: `nest-admin-frontend/src/views/business/milestoneManage/form.vue`
- Modify: `nest-admin/src/**` 对应模块实体、DTO、service、controller
- Test: `nest-admin-frontend/src/views/business/projectManage/projectManage.forms.spec.ts`

- [ ] **Step 1: 扩展失败测试，要求目标页面具备统一附件组件结构**

```ts
it('缺失附件页补齐 Upload 和 ViewFileList', () => {
  const files = [
    'userStoryManage/form.vue',
    'riskManage/form.vue',
    'changeManage/form.vue',
    'sprintManage/form.vue',
    'milestoneManage/form.vue',
  ]

  files.forEach((file) => {
    const source = readBusinessView(file)
    expect(source).toMatch(/Upload/)
    expect(source).toMatch(/ViewFileList/)
    expect(source).toMatch(/attachments/)
  })
})
```

- [ ] **Step 2: 运行测试确认失败**

Run: `npm run test:unit -- src/views/business/projectManage/projectManage.forms.spec.ts`

Expected: FAIL，因为多个页面没有 `attachments`。

- [ ] **Step 3: 前后端最小实现附件字段链路**

```ts
// 前端 form
const form = ref({
  ...,
  attachments: [],
})
```

```vue
<el-form-item label="附件">
  <ViewFileList v-if="isView" :files="form.attachments || []" />
  <Upload v-else v-model:fileList="form.attachments" type="file" multiple />
</el-form-item>
```

```ts
// 后端实体/DTO
attachments: Json;
```

- [ ] **Step 4: 运行测试确认附件链路守卫通过**

Run: `npm run test:unit -- src/views/business/projectManage/projectManage.forms.spec.ts`

Expected: PASS。

- [ ] **Step 5: 提交当前任务改动**

```bash
git add nest-admin-frontend/src/views/business/userStoryManage/form.vue nest-admin-frontend/src/views/business/riskManage/form.vue nest-admin-frontend/src/views/business/changeManage/form.vue nest-admin-frontend/src/views/business/sprintManage/form.vue nest-admin-frontend/src/views/business/milestoneManage/form.vue nest-admin/src nest-admin-frontend/src/views/business/projectManage/projectManage.forms.spec.ts
git commit -m "fix: add attachment flows to project forms"
```

### Task 4: 完整验证并准备收尾

**Files:**
- Modify: `nest-admin-frontend/src/views/business/projectManage/projectManage.forms.spec.ts`
- Modify: 8 个目标 form 页面
- Modify: `nest-admin/src/**` 对应目标模块

- [ ] **Step 1: 运行前端单测**

Run: `npm run test:unit`

Expected: PASS，所有测试通过。

- [ ] **Step 2: 运行前端类型检查**

Run: `npm run type-check`

Expected: PASS。

- [ ] **Step 3: 运行后端 lint**

Run: `npm run lint`

Expected: PASS。

- [ ] **Step 4: 检查工作区差异**

Run: `git status --short && git diff -- nest-admin-frontend/src/views/business/projectManage/form.vue nest-admin-frontend/src/views/business/taskManage/form.vue nest-admin-frontend/src/views/business/userStoryManage/form.vue nest-admin-frontend/src/views/business/ticketManage/form.vue nest-admin-frontend/src/views/business/riskManage/form.vue nest-admin-frontend/src/views/business/changeManage/form.vue nest-admin-frontend/src/views/business/sprintManage/form.vue nest-admin-frontend/src/views/business/milestoneManage/form.vue nest-admin-frontend/src/views/business/projectManage/projectManage.forms.spec.ts nest-admin/src`

Expected: 仅包含本次目标范围改动。

- [ ] **Step 5: 生成最终提交**

```bash
git add nest-admin-frontend/src/views/business/projectManage/form.vue nest-admin-frontend/src/views/business/taskManage/form.vue nest-admin-frontend/src/views/business/userStoryManage/form.vue nest-admin-frontend/src/views/business/ticketManage/form.vue nest-admin-frontend/src/views/business/riskManage/form.vue nest-admin-frontend/src/views/business/changeManage/form.vue nest-admin-frontend/src/views/business/sprintManage/form.vue nest-admin-frontend/src/views/business/milestoneManage/form.vue nest-admin-frontend/src/views/business/projectManage/projectManage.forms.spec.ts nest-admin/src
git commit -m "fix: standardize project chain form layouts"
```
