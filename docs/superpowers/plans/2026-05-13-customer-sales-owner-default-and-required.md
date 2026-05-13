# Customer Sales Owner Default And Required Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 让客户新增表单默认带出当前登录用户作为销售负责人，并把“销售负责人”升级为必填字段，同时保持编辑客户时继续使用接口返回的原负责人。

**Architecture:** 仅调整前端客户表单页，复用现有 `useUserStore()` 登录态来源和仓库里已有的“结构守卫测试”模式。先写针对 `customerManage/form.vue` 的失败测试，再做最小实现，最后运行前端类型检查与窄测试验证不回归。

**Tech Stack:** Vue 3 `script setup`、Pinia `useUserStore`、Element Plus 表单校验、Vitest 结构守卫测试、Vue TSC。

---

## File Structure

- Modify: `nest-admin-frontend/src/views/business/crm/customerManage/form.vue`
  - 职责：客户新增/编辑表单逻辑，负责默认表单值、当前用户默认负责人、以及 `salesId` 的表单校验。
- Create: `nest-admin-frontend/src/views/business/crm/customerManage/form.structure.spec.ts`
  - 职责：以源码守卫测试方式约束客户表单必须使用当前用户默认负责人、必须存在销售负责人校验、编辑态仍使用接口返回值。

### Task 1: 为客户负责人规则补失败测试

**Files:**
- Create: `nest-admin-frontend/src/views/business/crm/customerManage/form.structure.spec.ts`
- Test: `nest-admin-frontend/src/views/business/crm/customerManage/form.structure.spec.ts`

- [ ] **Step 1: 写失败测试**

```ts
import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

function readSource() {
  return readFileSync(resolve(__dirname, 'form.vue'), 'utf-8')
}

describe('customer form structure', () => {
  it('新建客户默认销售负责人为当前登录用户', () => {
    const source = readSource()

    expect(source).toContain("import { useUserStore } from '@/stores/user'")
    expect(source).toContain('const userStore = useUserStore()')
    expect(source).toContain("const currentUserId = computed(() => String(userStore.id || ''))")
    expect(source).toContain("salesId: currentUserId.value,")
  })

  it('销售负责人字段必须存在必填校验', () => {
    const source = readSource()

    expect(source).toContain("salesId: [{ required: true, message: '请选择销售负责人', trigger: 'change' }],")
  })

  it('编辑客户时仍使用接口返回值而不是当前登录用户覆盖', () => {
    const source = readSource()

    expect(source).toContain('const { data } = await getOne(route.query.id)')
    expect(source).toContain('form.value = { ...data }')
    expect(source).not.toContain("form.value = { ...data, salesId: currentUserId.value }")
  })
})
```

- [ ] **Step 2: 运行测试并确认失败**

Run:

```bash
npm run test:unit -- src/views/business/crm/customerManage/form.structure.spec.ts
```

Expected:

```text
FAIL  src/views/business/crm/customerManage/form.structure.spec.ts
```

失败点应至少包含以下之一：

- 缺少 `useUserStore` / `currentUserId`
- 缺少 `salesId` 必填规则
- `defaultForm()` 中的 `salesId` 仍是空字符串

- [ ] **Step 3: 提交测试文件**

```bash
git add nest-admin-frontend/src/views/business/crm/customerManage/form.structure.spec.ts
git commit -m "test: cover customer sales owner defaults"
```

### Task 2: 最小实现新增默认负责人和必填校验

**Files:**
- Modify: `nest-admin-frontend/src/views/business/crm/customerManage/form.vue`
- Test: `nest-admin-frontend/src/views/business/crm/customerManage/form.structure.spec.ts`

- [ ] **Step 1: 在表单中补当前用户来源与必填规则**

将 `customerManage/form.vue` 的头部脚本调整为以下关键结构：

```vue
<script setup>
import { watch } from 'vue'
import { getOne, save, update, getCustomerTypes, getCustomerLevels, getCustomerStatuses, submitApproval } from './api'
import { getTrees as getDeptTrees } from '@/views/system/depts/api'
import { ElMessageBox } from 'element-plus'
import { closeReturnedWorkflowInstance, resubmitReturnedWorkflowInstance } from '@/views/business/workflow/api'
import { useUserStore } from '@/stores/user'
import UserSelect from '@/components/UserSelect.vue'
import WorkflowApprovalPanel from '@/components/workflow/WorkflowApprovalPanel.vue'
import ViewField from '@/components/view/ViewField.vue'
import ViewTagField from '@/components/view/ViewTagField.vue'
import ViewUser from '@/components/view/ViewUser.vue'
import { checkPermi } from '@/utils/permission'
import { useCurrentRouteGuard } from '@/utils/useCurrentRouteGuard'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()
const currentUserId = computed(() => String(userStore.id || ''))

const formRef = ref()
const form = ref({
  name: '',
  shortName: '',
  code: '',
  type: '1',
  unifiedSocialCreditCode: '',
  industry: '',
  scale: '',
  address: '',
  contactPerson: '',
  contactPhone: '',
  contactEmail: '',
  level: '2',
  status: '1',
  salesId: currentUserId.value,
  deptId: '',
  description: '',
  customerValue: null,
})

const rules = {
  name: [{ required: true, message: '请输入客户名称', trigger: 'blur' }],
  contactPerson: [{ required: true, message: '请输入联系人', trigger: 'blur' }],
  contactPhone: [
    { required: true, message: '请输入联系电话', trigger: 'blur' },
    { pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号码', trigger: 'blur' }
  ],
  salesId: [{ required: true, message: '请选择销售负责人', trigger: 'change' }],
}
```

- [ ] **Step 2: 让默认表单工厂只在新增态使用当前登录用户**

将 `defaultForm()` 保持为编辑态外的唯一默认值来源：

```ts
const defaultForm = () => ({
  name: '',
  shortName: '',
  code: '',
  type: '1',
  unifiedSocialCreditCode: '',
  industry: '',
  scale: '',
  address: '',
  contactPerson: '',
  contactPhone: '',
  contactEmail: '',
  level: '2',
  status: '1',
  salesId: currentUserId.value,
  deptId: '',
  description: '',
  customerValue: null,
})
```

要求：

- 不要在 `loadCustomer()` 的编辑分支里覆盖 `salesId`
- 继续保留：

```ts
const { data } = await getOne(route.query.id)
form.value = { ...data }
```

- [ ] **Step 3: 运行窄测试并确认通过**

Run:

```bash
npm run test:unit -- src/views/business/crm/customerManage/form.structure.spec.ts
```

Expected:

```text
PASS  src/views/business/crm/customerManage/form.structure.spec.ts
```

- [ ] **Step 4: 提交实现**

```bash
git add nest-admin-frontend/src/views/business/crm/customerManage/form.vue nest-admin-frontend/src/views/business/crm/customerManage/form.structure.spec.ts
git commit -m "feat: default customer sales owner to current user"
```

### Task 3: 做前端回归验证

**Files:**
- Verify: `nest-admin-frontend/src/views/business/crm/customerManage/form.vue`
- Verify: `nest-admin-frontend/src/views/business/crm/customerManage/form.structure.spec.ts`
- Verify: `nest-admin-frontend/src/views/business/crm/crm.forms.spec.ts`

- [ ] **Step 1: 运行 CRM 相关守卫测试**

Run:

```bash
npm run test:unit -- src/views/business/crm/customerManage/form.structure.spec.ts src/views/business/crm/crm.forms.spec.ts
```

Expected:

```text
2 passed
```

- [ ] **Step 2: 运行前端类型检查**

Run:

```bash
npm run type-check
```

Expected:

```text
Exit code 0
```

- [ ] **Step 3: 检查最终差异并提交验证结果**

Run:

```bash
git diff -- nest-admin-frontend/src/views/business/crm/customerManage/form.vue nest-admin-frontend/src/views/business/crm/customerManage/form.structure.spec.ts
```

确认点：

- 新增态 `salesId` 默认取 `currentUserId.value`
- `rules` 中包含 `salesId` 必填规则
- 编辑态仍然是 `form.value = { ...data }`

- [ ] **Step 4: 提交验证完成状态**

```bash
git add nest-admin-frontend/src/views/business/crm/customerManage/form.vue nest-admin-frontend/src/views/business/crm/customerManage/form.structure.spec.ts
git commit -m "test: verify customer sales owner form behavior"
```

## Self-Review

- 规格覆盖检查：
  - “新增默认当前用户”由 Task 1 和 Task 2 覆盖。
  - “字段必填”由 Task 1 和 Task 2 覆盖。
  - “编辑保留接口返回值，不自动覆盖”由 Task 1 和 Task 2 覆盖。
  - “提交前继续走表单校验”由 Task 2 的 `rules` 调整和 Task 3 的验证覆盖。
- 占位符检查：未使用 `TODO`、`TBD`、`适当处理` 之类占位表达。
- 命名一致性检查：计划中统一使用 `useUserStore`、`currentUserId`、`salesId`、`defaultForm()`，与现有仓库模式一致。
