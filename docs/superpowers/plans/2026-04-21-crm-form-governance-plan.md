# CRM Form Governance Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 完成 CRM 客户、机会、合同、互动记录 4 个表单页的卡片分区治理，并统一合同/互动附件体验。

**Architecture:** 以现有项目链路表单治理成果为参考，把 CRM 表单统一成 `Gcard + section-card + footer-actions` 结构。合同页保持单文件上传语义，互动记录页补齐附件区，客户与机会页只做结构治理，不扩展数据模型。

**Tech Stack:** Vue 3, Element Plus, Vitest, NestJS

---

### Task 1: 建立 CRM 表单治理守卫测试

**Files:**
- Create: `nest-admin-frontend/src/views/business/crm/crm.forms.spec.ts`
- Test: `nest-admin-frontend/src/views/business/crm/crm.forms.spec.ts`

- [ ] **Step 1: 写失败测试，约束 4 个 CRM 表单具备卡片分区，合同页必须使用上传组件，互动记录必须有附件区**

```ts
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

function readCrmView(relativePath: string) {
  return readFileSync(resolve(__dirname, relativePath), 'utf-8')
}

describe('CRM 表单治理守卫', () => {
  it('四个 CRM 表单页使用卡片分区结构', () => {
    const files = [
      'customerManage/form.vue',
      'opportunityManage/form.vue',
      'contractManage/form.vue',
      'interactionManage/form.vue',
    ]

    files.forEach((file) => {
      const source = readCrmView(file)
      expect(source).toMatch(/section-card/)
      expect(source).toMatch(/footer-actions/)
    })
  })
})
```

- [ ] **Step 2: 运行测试并确认失败**

Run: `npm run test:unit -- src/views/business/crm/crm.forms.spec.ts`

Expected: FAIL，因为 CRM 表单当前仍是长表单结构。

- [ ] **Step 3: 保持测试文件不变，后续通过结构治理让测试转绿**

```ts
// 测试保持不变，后续用真实页面整改让它通过。
```

- [ ] **Step 4: 再次运行测试确认失败原因稳定**

Run: `npm run test:unit -- src/views/business/crm/crm.forms.spec.ts`

Expected: FAIL，失败点明确指向 CRM 表单未分区。

- [ ] **Step 5: 提交当前任务改动**

```bash
git add nest-admin-frontend/src/views/business/crm/crm.forms.spec.ts
git commit -m "test: guard crm form layout cleanup"
```

### Task 2: 重构 CRM 表单结构

**Files:**
- Modify: `nest-admin-frontend/src/views/business/crm/customerManage/form.vue`
- Modify: `nest-admin-frontend/src/views/business/crm/opportunityManage/form.vue`
- Modify: `nest-admin-frontend/src/views/business/crm/contractManage/form.vue`
- Modify: `nest-admin-frontend/src/views/business/crm/interactionManage/form.vue`
- Test: `nest-admin-frontend/src/views/business/crm/crm.forms.spec.ts`

- [ ] **Step 1: 保留失败测试作为结构约束**

```ts
it('四个 CRM 表单页使用卡片分区结构', () => {
  // 测试保持不变，作为结构治理约束
})
```

- [ ] **Step 2: 运行测试确认结构问题仍存在**

Run: `npm run test:unit -- src/views/business/crm/crm.forms.spec.ts`

Expected: FAIL。

- [ ] **Step 3: 重构页面为卡片分区并统一 footer**

```vue
<template>
  <div class="crm-form-page">
    <div class="Gcard crm-form-shell">
      <div class="crm-form-shell__top">
        <el-page-header ... />
      </div>
      <el-form ...>
        <div class="crm-sections">
          <section class="section-card">...</section>
        </div>
        <el-form-item class="footer-actions">...</el-form-item>
      </el-form>
    </div>
  </div>
</template>
```

- [ ] **Step 4: 运行测试确认卡片分区守卫通过**

Run: `npm run test:unit -- src/views/business/crm/crm.forms.spec.ts`

Expected: PASS 或只剩附件相关断言待补。

- [ ] **Step 5: 提交当前任务改动**

```bash
git add nest-admin-frontend/src/views/business/crm/customerManage/form.vue nest-admin-frontend/src/views/business/crm/opportunityManage/form.vue nest-admin-frontend/src/views/business/crm/contractManage/form.vue nest-admin-frontend/src/views/business/crm/interactionManage/form.vue nest-admin-frontend/src/views/business/crm/crm.forms.spec.ts
git commit -m "fix: standardize crm form layouts"
```

### Task 3: 统一 CRM 附件体验

**Files:**
- Modify: `nest-admin-frontend/src/views/business/crm/contractManage/form.vue`
- Modify: `nest-admin-frontend/src/views/business/crm/interactionManage/form.vue`
- Test: `nest-admin-frontend/src/views/business/crm/crm.forms.spec.ts`

- [ ] **Step 1: 扩展失败测试，约束合同页使用上传组件、互动记录页必须接入附件区**

```ts
it('合同和互动记录表单接入附件组件', () => {
  const contractSource = readCrmView('contractManage/form.vue')
  const interactionSource = readCrmView('interactionManage/form.vue')

  expect(contractSource).toMatch(/Upload/)
  expect(contractSource).toMatch(/ViewFileList/)
  expect(contractSource).not.toMatch(/el-input v-else v-model="form\.contractFile"/)

  expect(interactionSource).toMatch(/Upload/)
  expect(interactionSource).toMatch(/ViewFileList/)
  expect(interactionSource).toMatch(/attachments/)
})
```

- [ ] **Step 2: 运行测试确认失败**

Run: `npm run test:unit -- src/views/business/crm/crm.forms.spec.ts`

Expected: FAIL，如果互动记录页尚未补附件区。

- [ ] **Step 3: 实现最小附件体验统一**

```vue
<el-form-item label="互动附件">
  <ViewFileList v-if="isReadonly" :files="form.attachments || []" />
  <Upload v-else v-model:fileList="form.attachments" type="file" multiple />
</el-form-item>
```

- [ ] **Step 4: 运行测试确认附件断言通过**

Run: `npm run test:unit -- src/views/business/crm/crm.forms.spec.ts`

Expected: PASS。

- [ ] **Step 5: 提交当前任务改动**

```bash
git add nest-admin-frontend/src/views/business/crm/contractManage/form.vue nest-admin-frontend/src/views/business/crm/interactionManage/form.vue nest-admin-frontend/src/views/business/crm/crm.forms.spec.ts
git commit -m "fix: align crm form attachment experience"
```

### Task 4: 完整验证与收尾

**Files:**
- Modify: `nest-admin-frontend/src/views/business/crm/customerManage/form.vue`
- Modify: `nest-admin-frontend/src/views/business/crm/opportunityManage/form.vue`
- Modify: `nest-admin-frontend/src/views/business/crm/contractManage/form.vue`
- Modify: `nest-admin-frontend/src/views/business/crm/interactionManage/form.vue`
- Create: `nest-admin-frontend/src/views/business/crm/crm.forms.spec.ts`

- [ ] **Step 1: 运行全量前端单测**

Run: `npm run test:unit`

Expected: PASS。

- [ ] **Step 2: 运行前端类型检查**

Run: `npm run type-check`

Expected: PASS。

- [ ] **Step 3: 运行后端 lint**

Run: `npm run lint`

Expected: PASS。

- [ ] **Step 4: 检查工作区差异**

Run: `git status --short && git diff -- nest-admin-frontend/src/views/business/crm/customerManage/form.vue nest-admin-frontend/src/views/business/crm/opportunityManage/form.vue nest-admin-frontend/src/views/business/crm/contractManage/form.vue nest-admin-frontend/src/views/business/crm/interactionManage/form.vue nest-admin-frontend/src/views/business/crm/crm.forms.spec.ts`

Expected: 仅包含 CRM 表单治理目标文件。

- [ ] **Step 5: 生成最终提交**

```bash
git add nest-admin-frontend/src/views/business/crm/customerManage/form.vue nest-admin-frontend/src/views/business/crm/opportunityManage/form.vue nest-admin-frontend/src/views/business/crm/contractManage/form.vue nest-admin-frontend/src/views/business/crm/interactionManage/form.vue nest-admin-frontend/src/views/business/crm/crm.forms.spec.ts
git commit -m "fix: standardize crm form layouts"
```
