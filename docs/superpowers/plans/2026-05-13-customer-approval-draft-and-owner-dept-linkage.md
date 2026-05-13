# Customer Approval Draft And Owner Department Linkage Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 让客户表单支持默认负责人和默认部门、负责人切换联动部门、主按钮改为“暂存/提交”、客户描述改成项目同款富文本，并把所有走审批业务模块的 `approvalStatus = '0'` 前端展示文案统一为“未提交审批”。

**Architecture:** 以前端最小改动为主，复用现有 `useUserStore()`、`UserSelect` 用户列表数据、项目表单的“暂存+提交审批”交互模式，以及公共 `Editor` / `ViewRichText` 组件。实现顺序分成三块：先写守卫测试约束客户表单新行为，再补当前用户部门与客户表单联动，最后收口审批状态文案统一并做回归验证。

**Tech Stack:** Vue 3 `script setup`、Pinia `useUserStore`、Element Plus 表单与按钮、Vitest 源码结构守卫测试、Vue TSC。

---

## File Structure

- Modify: `nest-admin-frontend/src/stores/user.js`
  - 职责：补充当前登录用户最小部门信息字段，为新增客户默认部门提供数据来源。
- Modify: `nest-admin-frontend/src/views/business/crm/customerManage/form.vue`
  - 职责：客户表单默认值、销售负责人与部门联动、暂存/提交主按钮、富文本描述。
- Create: `nest-admin-frontend/src/views/business/crm/customerManage/form.approval.spec.ts`
  - 职责：守卫客户表单的默认部门联动、按钮语义、富文本描述实现。
- Modify: `nest-admin-frontend/src/views/business/crm/customerManage/index.vue`
  - 职责：客户列表审批状态文案映射改为“未提交审批”。
- Modify: `nest-admin-frontend/src/views/business/projectManage/index.vue`
  - 职责：项目列表审批状态文案映射统一。
- Modify: `nest-admin-frontend/src/views/business/projectManage/detail.vue`
  - 职责：项目详情审批状态文案映射统一。
- Modify: `nest-admin-frontend/src/views/business/changeManage/index.vue`
  - 职责：变更列表审批状态文案映射统一。
- Modify: `nest-admin-frontend/src/views/business/changeManage/form.vue`
  - 职责：变更表单审批状态文案映射统一。
- Modify: `nest-admin-frontend/src/views/business/taskManage/index.vue`
  - 职责：任务列表审批状态文案映射统一。
- Modify: `nest-admin-frontend/src/views/business/taskManage/form.vue`
  - 职责：任务表单审批状态文案映射统一。
- Modify: `nest-admin-frontend/src/views/business/ticketManage/index.vue`
  - 职责：工单列表审批状态文案映射统一。
- Modify: `nest-admin-frontend/src/views/business/ticketManage/form.vue`
  - 职责：工单表单审批状态文案映射统一。
- Create: `nest-admin-frontend/src/views/business/approval-status-text.spec.ts`
  - 职责：守卫关键审批业务页不再出现“无需审批”映射文案。

### Task 1: 为客户表单新交互补失败测试

**Files:**
- Create: `nest-admin-frontend/src/views/business/crm/customerManage/form.approval.spec.ts`
- Test: `nest-admin-frontend/src/views/business/crm/customerManage/form.approval.spec.ts`

- [ ] **Step 1: 写失败测试**

```ts
import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

function readSource() {
  return readFileSync(resolve(__dirname, 'form.vue'), 'utf-8')
}

describe('customer form approval contract', () => {
  it('新增客户默认带出当前用户部门并联动销售负责人所属部门', () => {
    const source = readSource()

    expect(source).toContain("const currentUserDeptId = computed(() => String(userStore.deptId || ''))")
    expect(source).toContain('deptId: currentUserDeptId.value,')
    expect(source).toContain('watch(() => form.value.salesId')
    expect(source).toContain('form.value.deptId = String(selectedUser?.deptId || selectedUser?.dept?.id || \'\')')
  })

  it('客户表单主按钮改为暂存和提交', () => {
    const source = readSource()

    expect(source).toContain("<el-button v-if=\"!isReadonly && (isEdit ? canCustomerUpdate : canCustomerAdd)\" type=\"primary\" @click=\"submit\">暂存</el-button>")
    expect(source).toContain("<el-button v-if=\"!isReadonly && (isEdit ? canCustomerUpdate : canCustomerAdd)\" type=\"warning\" @click=\"handleSubmitApproval\">提交</el-button>")
    expect(source).not.toContain('>提交审批</el-button>')
  })

  it('客户描述改为项目同款富文本组件', () => {
    const source = readSource()

    expect(source).toContain("import Editor from '@/components/Editor/index.vue'")
    expect(source).toContain("import ViewRichText from '@/components/view/ViewRichText.vue'")
    expect(source).toContain('<ViewRichText v-if="isReadonly" :html="form.description" />')
    expect(source).toContain('<Editor v-else v-model="form.description"')
    expect(source).not.toContain('type="textarea"')
  })
})
```

- [ ] **Step 2: 运行测试并确认失败**

Run:

```bash
npm run test:unit -- src/views/business/crm/customerManage/form.approval.spec.ts
```

Expected:

```text
FAIL  src/views/business/crm/customerManage/form.approval.spec.ts
```

失败点应至少包含以下之一：

- 缺少 `currentUserDeptId`
- 缺少负责人切换联动 `deptId`
- 底部按钮仍是 `提交 / 提交审批`
- 客户描述仍是 `el-input textarea`

- [ ] **Step 3: 保留失败测试结果，不创建提交**

说明：

- 本计划按 TDD 执行，但除非用户单独要求，否则不在这里创建中间 git 提交。

### Task 2: 补当前用户部门字段并实现客户表单联动

**Files:**
- Modify: `nest-admin-frontend/src/stores/user.js`
- Modify: `nest-admin-frontend/src/views/business/crm/customerManage/form.vue`
- Test: `nest-admin-frontend/src/views/business/crm/customerManage/form.approval.spec.ts`

- [ ] **Step 1: 在用户 store 中补最小部门字段**

把 `user.js` 的 state 和 `getUserInfo()` 调整为包含部门信息，最小代码结构如下：

```js
state: () => ({
  id: '',
  name: '',
  avatar: new URL('@/assets/image/profile.jpg', import.meta.url).href,
  roles: [],
  permissions: [],
  configParamInfo: {},
  deptId: '',
  dept: null,
}),
```

```js
clearUserState() {
  this.id = ''
  this.name = ''
  this.avatar = new URL('@/assets/image/profile.jpg', import.meta.url).href
  this.roles = []
  this.permissions = []
  this.configParamInfo = {}
  this.deptId = ''
  this.dept = null
}
```

```js
this.deptId = user.deptId || user.dept?.id || ''
this.dept = user.dept || null
```

- [ ] **Step 2: 在客户表单引入项目同款富文本和用户列表缓存**

把 `customerManage/form.vue` 的 import 区关键结构调整为：

```vue
<script setup>
import { watch } from 'vue'
import { getOne, save, update, getCustomerTypes, getCustomerLevels, getCustomerStatuses, submitApproval } from './api'
import { getTrees as getDeptTrees } from '@/views/system/depts/api'
import { getList as getUserList } from '@/views/system/users/api'
import { ElMessageBox } from 'element-plus'
import { closeReturnedWorkflowInstance, resubmitReturnedWorkflowInstance } from '@/views/business/workflow/api'
import { useUserStore } from '@/stores/user'
import Editor from '@/components/Editor/index.vue'
import UserSelect from '@/components/UserSelect.vue'
import WorkflowApprovalPanel from '@/components/workflow/WorkflowApprovalPanel.vue'
import ViewField from '@/components/view/ViewField.vue'
import ViewRichText from '@/components/view/ViewRichText.vue'
import ViewTagField from '@/components/view/ViewTagField.vue'
import ViewUser from '@/components/view/ViewUser.vue'
```

并增加：

```ts
const currentUserId = computed(() => String(userStore.id || ''))
const currentUserDeptId = computed(() => String(userStore.deptId || ''))
const salesUserList = ref([])

getUserList({ pageNum: 1, pageSize: 1000 }).then((res) => {
  const page = res?.data?.data || res?.data || res || {}
  salesUserList.value = Array.isArray(page) ? page : page.list || page.rows || page.data || []
})
```

- [ ] **Step 3: 让新增客户默认带出当前用户部门**

把初始 `form` 和 `defaultForm()` 中的 `deptId` 改成当前用户部门：

```ts
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
  deptId: currentUserDeptId.value,
  description: '',
  customerValue: null,
})
```

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
  deptId: currentUserDeptId.value,
  description: '',
  customerValue: null,
})
```

- [ ] **Step 4: 增加销售负责人变更联动所属部门**

在 `loadCustomer()` 之后增加监听逻辑，避免编辑态初次回填时误覆盖：

```ts
const hasInitializedCustomer = ref(false)

watch(
  () => [route.query.id, route.query.action, route.query.taskId, route.query.instanceId, route.query.fromWorkflow],
  () => {
    hasInitializedCustomer.value = false
    if (!isCustomerFormRoute()) return
    loadCustomer()
  },
  { immediate: true },
)

watch(
  () => form.value.salesId,
  (value, oldValue) => {
    if (!value) {
      form.value.deptId = ''
      return
    }
    if (!hasInitializedCustomer.value) return
    if (value === oldValue) return
    const selectedUser = salesUserList.value.find((item) => String(item.id) === String(value))
    form.value.deptId = String(selectedUser?.deptId || selectedUser?.dept?.id || '')
  },
)
```

并在 `loadCustomer()` 中设置初始化完成标记：

```ts
async function loadCustomer() {
  if (!isCustomerFormRoute()) return
  if (!hasCustomerId.value) {
    form.value = defaultForm()
    hasInitializedCustomer.value = true
    return
  }
  const { data } = await getOne(route.query.id)
  form.value = { ...data }
  hasInitializedCustomer.value = true
}
```

- [ ] **Step 5: 把客户主按钮改为暂存/提交，并切到富文本描述**

按钮逻辑目标结构：

```vue
<el-form-item class="footer-actions">
  <el-button v-if="!isReadonly && (isEdit ? canCustomerUpdate : canCustomerAdd)" type="primary" @click="submit">暂存</el-button>
  <el-button @click="cancel">{{ isReadonly ? '返回' : '取消' }}</el-button>
  <el-button v-if="!isReadonly && (isEdit ? canCustomerUpdate : canCustomerAdd)" type="warning" @click="handleSubmitApproval">提交</el-button>
</el-form-item>
```

描述区目标结构：

```vue
<el-form-item label="客户描述" prop="description">
  <ViewRichText v-if="isReadonly" :html="form.description" />
  <Editor v-else v-model="form.description" style="min-height: 260px" />
</el-form-item>
```

`submit()` 成功提示改为：

```ts
$sdk.msgSuccess(isEdit.value ? '暂存成功' : '新建客户已暂存')
```

- [ ] **Step 6: 调整 `handleSubmitApproval()` 的保存后提交语义**

把发起审批改成与项目表单一致的两段式：

```ts
async function persistCustomer(api) {
  await api(form.value)
  return String(form.value.id || route.query.id || '')
}

async function handleSubmitApproval() {
  if ((isEdit.value && !canCustomerUpdate.value) || (!isEdit.value && !canCustomerAdd.value)) {
    return $sdk.msgWarning('当前操作没有权限')
  }
  if (canCloseReturnedInstance.value) {
    await resubmitReturnedWorkflowInstance(form.value.workflowInstanceId, { comment: '发起人重新提交审批' })
    $sdk.msgSuccess('重新提交审批成功')
    reloadCurrent()
    window.scrollTo({ top: 0, behavior: 'smooth' })
    return
  }
  formRef.value.validate(async (valid) => {
    if (!valid) return
    const api = isEdit.value ? update : save
    try {
      await api(form.value)
      const customerId = String(form.value.id || route.query.id || '')
      if (!customerId) {
        $sdk.msgWarning('客户已保存，但未获取到客户 ID，请刷新后重试提交')
        return
      }
      await submitApproval(customerId)
      $sdk.msgSuccess('提交审批成功')
      router.back()
    } catch (error) {
      const message = error?.response?.data?.message || error?.message || '客户已保存，但提交审批失败'
      $sdk.msgError(message)
    }
  })
}
```

注意：

- 如现有 `save/update` 接口返回体里已有 `id`，优先从返回值读取，而不是强依赖 `form.value.id`
- 不要删除退回实例重新提交逻辑

- [ ] **Step 7: 运行客户表单守卫测试并确认通过**

Run:

```bash
npm run test:unit -- src/views/business/crm/customerManage/form.approval.spec.ts src/views/business/crm/customerManage/form.structure.spec.ts
```

Expected:

```text
2 passed
```

### Task 3: 统一审批状态 `0` 的展示文案

**Files:**
- Modify: `nest-admin-frontend/src/views/business/crm/customerManage/form.vue`
- Modify: `nest-admin-frontend/src/views/business/crm/customerManage/index.vue`
- Modify: `nest-admin-frontend/src/views/business/projectManage/index.vue`
- Modify: `nest-admin-frontend/src/views/business/projectManage/detail.vue`
- Modify: `nest-admin-frontend/src/views/business/changeManage/form.vue`
- Modify: `nest-admin-frontend/src/views/business/changeManage/index.vue`
- Modify: `nest-admin-frontend/src/views/business/taskManage/form.vue`
- Modify: `nest-admin-frontend/src/views/business/taskManage/index.vue`
- Modify: `nest-admin-frontend/src/views/business/ticketManage/form.vue`
- Modify: `nest-admin-frontend/src/views/business/ticketManage/index.vue`
- Create: `nest-admin-frontend/src/views/business/approval-status-text.spec.ts`

- [ ] **Step 1: 先写状态文案失败测试**

创建守卫测试文件：

```ts
import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

function readView(relativePath: string) {
  return readFileSync(resolve(__dirname, relativePath), 'utf-8')
}

describe('approval status text contract', () => {
  it('关键审批页面不再把 0 映射为无需审批', () => {
    const files = [
      'crm/customerManage/index.vue',
      'crm/customerManage/form.vue',
      'projectManage/index.vue',
      'projectManage/detail.vue',
      'changeManage/index.vue',
      'changeManage/form.vue',
      'taskManage/index.vue',
      'taskManage/form.vue',
      'ticketManage/index.vue',
      'ticketManage/form.vue',
    ]

    files.forEach((file) => {
      const source = readView(file)
      expect(source).toContain("'0': '未提交审批'")
      expect(source).not.toContain("'0': '无需审批'")
    })
  })
})
```

- [ ] **Step 2: 运行测试并确认失败**

Run:

```bash
npm run test:unit -- src/views/business/approval-status-text.spec.ts
```

Expected:

```text
FAIL  src/views/business/approval-status-text.spec.ts
```

- [ ] **Step 3: 逐页把 `0` 文案映射改为“未提交审批”**

把下列模式统一替换：

```ts
{ '0': '无需审批', '1': '审批中', '2': '已通过', '3': '已驳回' }
```

改为：

```ts
{ '0': '未提交审批', '1': '审批中', '2': '已通过', '3': '已驳回' }
```

应用到：

- `src/views/business/crm/customerManage/form.vue`
- `src/views/business/crm/customerManage/index.vue`
- `src/views/business/projectManage/index.vue`
- `src/views/business/projectManage/detail.vue`
- `src/views/business/changeManage/form.vue`
- `src/views/business/changeManage/index.vue`
- `src/views/business/taskManage/form.vue`
- `src/views/business/taskManage/index.vue`
- `src/views/business/ticketManage/form.vue`
- `src/views/business/ticketManage/index.vue`

保留例外：

- 若 `approvalStatus === '3'` 且节点名包含“退回发起人”，继续显示“已退回发起人”

- [ ] **Step 4: 运行状态文案守卫测试并确认通过**

Run:

```bash
npm run test:unit -- src/views/business/approval-status-text.spec.ts
```

Expected:

```text
PASS  src/views/business/approval-status-text.spec.ts
```

### Task 4: 做回归验证

**Files:**
- Verify: `nest-admin-frontend/src/stores/user.js`
- Verify: `nest-admin-frontend/src/views/business/crm/customerManage/form.vue`
- Verify: `nest-admin-frontend/src/views/business/crm/customerManage/form.approval.spec.ts`
- Verify: `nest-admin-frontend/src/views/business/crm/customerManage/form.structure.spec.ts`
- Verify: `nest-admin-frontend/src/views/business/approval-status-text.spec.ts`

- [ ] **Step 1: 运行客户表单与审批文案相关测试**

Run:

```bash
npm run test:unit -- src/views/business/crm/customerManage/form.approval.spec.ts src/views/business/crm/customerManage/form.structure.spec.ts src/views/business/crm/crm.forms.spec.ts src/views/business/approval-status-text.spec.ts
```

Expected:

```text
4 passed
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

- [ ] **Step 3: 检查最终差异**

Run:

```bash
git diff -- nest-admin-frontend/src/stores/user.js nest-admin-frontend/src/views/business/crm/customerManage/form.vue nest-admin-frontend/src/views/business/crm/customerManage/form.approval.spec.ts nest-admin-frontend/src/views/business/approval-status-text.spec.ts
```

确认点：

- 当前登录用户 store 已包含 `deptId/dept`
- 新增客户默认带出 `salesId/deptId`
- 切换负责人时会联动 `deptId`
- 底部按钮为 `暂存 / 取消 / 提交`
- 客户描述改为 `Editor / ViewRichText`
- 所有关键审批页面不再出现 `0 = 无需审批`

- [ ] **Step 4: 不创建自动提交，整理结果交给用户确认**

说明：

- 除非用户单独要求，不在本计划执行过程中创建代码提交。

## Self-Review

- 规格覆盖检查：
  - 默认负责人和默认部门由 Task 2 覆盖。
  - 销售负责人切换联动所属部门由 Task 2 覆盖。
  - 暂存/提交按钮语义由 Task 2 覆盖。
  - 客户描述富文本由 Task 2 覆盖。
  - 全局 `approvalStatus='0'` 文案统一由 Task 3 覆盖。
- 占位符检查：未包含 `TODO`、`TBD`、`稍后实现`、`类似 Task N` 之类占位表达。
- 命名一致性检查：计划中统一使用 `deptId`、`salesId`、`currentUserDeptId`、`approvalStatus`、`ViewRichText`、`Editor`，与现有仓库命名保持一致。
