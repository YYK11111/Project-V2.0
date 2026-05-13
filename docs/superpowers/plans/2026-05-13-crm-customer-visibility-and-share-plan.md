# CRM 客户可见性与授权实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 让 CRM 客户只对创建人、审批参与人和被授权人可见，并提供只读授权能力。

**Architecture:** 客户主表继续保存业务数据，新增客户可见人表保存“谁能看这个客户”的关系，来源分为创建、审批参与和手工授权。列表和详情统一先做可见性过滤，再返回客户数据；授权接口只维护可见关系，不影响编辑权限。

**Tech Stack:** NestJS, TypeORM, Jest, Vue 3, Element Plus.

---

### Task 1: 客户可见性数据模型与后端过滤

**Files:**
- Create: `nest-admin/src/modulesBusi/crm/customers/entities/customer-viewer.entity.ts`
- Modify: `nest-admin/src/modulesBusi/crm/customers/entity.ts`
- Modify: `nest-admin/src/modulesBusi/crm/customers/service.ts`
- Modify: `nest-admin/src/modulesBusi/crm/customers/service.spec.ts`

- [ ] **Step 1: Write the failing test**

```ts
it("客户列表只返回创建人、审批参与人和授权人可见的客户", async () => {
  // 断言 list 只拼出可见客户
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- --runInBand src/modulesBusi/crm/customers/service.spec.ts`
Expected: FAIL, because `getVisibleCustomerIds` / `applyCustomerVisibility` 尚未实现。

- [ ] **Step 3: Write minimal implementation**

实现 `CustomerViewer` 实体，给 `CustomersService` 增加：
```ts
async getVisibleCustomerIds(operatorId: string, permissions: string[] = [])
async applyCustomerVisibility(qb, operator)
async getOne(query, isError = true)
async list(query)
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- --runInBand src/modulesBusi/crm/customers/service.spec.ts`
Expected: PASS。

- [ ] **Step 5: Commit**

```bash
git add nest-admin/src/modulesBusi/crm/customers/*
git commit -m "feat: add crm customer visibility filtering"
```

### Task 2: 客户授权与审批参与人写入

**Files:**
- Modify: `nest-admin/src/modulesBusi/crm/customers/controller.ts`
- Modify: `nest-admin/src/modulesBusi/crm/customers/service.ts`
- Modify: `nest-admin/src/modulesBusi/workflow/controller.ts`
- Modify: `nest-admin/src/modulesBusi/workflow/service.ts`
- Modify: `nest-admin/src/modulesBusi/workflow/entity/workflow-history.entity.ts` if needed
- Modify: `nest-admin/src/modulesBusi/crm/customers/service.spec.ts`
- Create: `nest-admin/src/modulesBusi/crm/customers/controller.spec.ts` or extend existing controller spec

- [ ] **Step 1: Write the failing test**

```ts
it("授权接口只允许被授权人查看，不授予编辑权限", async () => {
  // 断言授权后可见，但编辑仍走原权限
});
```

```ts
it("客户审批完成后会把当前审批处理人写入可见人列表", async () => {
  // 断言 workflow 历史参与人进入客户可见集合
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- --runInBand src/modulesBusi/crm/customers/service.spec.ts src/modulesBusi/crm/customers/controller.spec.ts`
Expected: FAIL。

- [ ] **Step 3: Write minimal implementation**

新增接口：
```ts
POST /business/crm/customers/:id/auth
DELETE /business/crm/customers/:id/auth/:userId
GET /business/crm/customers/:id/auth-users
```

新增服务方法：
```ts
grantCustomerViewAccess(customerId, userIds, operatorId)
revokeCustomerViewAccess(customerId, userId, operatorId)
syncApprovalParticipants(customerId, instanceId)
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- --runInBand src/modulesBusi/crm/customers/service.spec.ts src/modulesBusi/crm/customers/controller.spec.ts`
Expected: PASS。

- [ ] **Step 5: Commit**

```bash
git add nest-admin/src/modulesBusi/crm/customers/* nest-admin/src/modulesBusi/workflow/*
git commit -m "feat: add crm customer view authorization"
```

### Task 3: 前端客户授权入口

**Files:**
- Modify: `nest-admin-frontend/src/views/business/crm/customerManage/api.ts`
- Modify: `nest-admin-frontend/src/views/business/crm/customerManage/index.vue`
- Modify: `nest-admin-frontend/src/views/business/crm/customerManage/form.vue` if授权入口放在详情页
- Create or modify: existing user selector dialog component if复用需要
- Modify: `nest-admin-frontend/src/views/business/crm/customerManage/*.spec.ts`

- [ ] **Step 1: Write the failing test**

```ts
it("客户列表操作区应出现授权按钮并调用授权接口", () => {
  // 断言按钮和请求参数
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test -- --runInBand src/views/business/crm/customerManage/*.spec.ts`
Expected: FAIL。

- [ ] **Step 3: Write minimal implementation**

在客户列表或详情页加入“授权查看”入口，使用用户选择器选择一个或多个用户，只提交可见授权接口。

- [ ] **Step 4: Run test to verify it passes**

Run: `npm run test -- --runInBand src/views/business/crm/customerManage/*.spec.ts`
Expected: PASS。

- [ ] **Step 5: Commit**

```bash
git add nest-admin-frontend/src/views/business/crm/customerManage/*
git commit -m "feat: add crm customer share entry"
```
