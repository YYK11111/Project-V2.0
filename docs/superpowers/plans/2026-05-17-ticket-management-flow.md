# 工单管理流程优化 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 将工单主流程收敛为“提交 -> 分派 -> 处理中 -> 待验证 -> 已关闭”，并补齐转派、退回、重开、日志追溯与前端操作入口。

**Architecture:** 保留现有 `ticket` 主表和 `type / TicketType`，只重定义 `status` 的业务语义。新增工单动作日志表记录所有状态变更和分派动作；后端由 `TicketsService` 承担主流程流转，`WorkflowIntegrationService` 只保留特殊审批的兼容回写。前端以详情页动作区和列表状态筛选为主，不做大范围重构。

**Tech Stack:** NestJS, TypeORM, Vue 3, Element Plus, Vitest/Jest

---

### Task 1: 后端主流程与动作日志

**Files:**
- Create: `nest-admin/src/modulesBusi/tickets/entities/ticket-action-log.entity.ts`
- Modify: `nest-admin/src/modulesBusi/tickets/entity.ts`
- Modify: `nest-admin/src/modulesBusi/tickets/service.ts`
- Modify: `nest-admin/src/modulesBusi/tickets/controller.ts`
- Modify: `nest-admin/src/modulesBusi/tickets/module.ts`
- Modify: `nest-admin/src/modules/auth/auth.guard.ts`
- Modify: `nest-admin/src/modulesBusi/tickets/service.spec.ts`

- [ ] **Step 1: Write the failing test**

```ts
it("提交待验证后状态应从处理中流转到待验证", async () => {
  // 断言 service.finishTicket 会把 status 更新为 "3"
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test:unit -- tickets/service.spec.ts`
Expected: FAIL with missing method or wrong status assertion.

- [ ] **Step 3: Write minimal implementation**

```ts
async finishTicket(id: string, operator: any) {
  await this.repository.update(id, { status: TicketStatus.resolved });
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm run test:unit -- tickets/service.spec.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add nest-admin/src/modulesBusi/tickets/*
git commit -m "feat: add ticket flow actions"
```

### Task 2: 前端工单详情与列表动作

**Files:**
- Modify: `nest-admin-frontend/src/views/business/ticketManage/form.vue`
- Modify: `nest-admin-frontend/src/views/business/ticketManage/index.vue`
- Modify: `nest-admin-frontend/src/views/business/ticketManage/api.ts`
- Modify: `nest-admin-frontend/src/views/business/ticketManage/api.spec.ts`

- [ ] **Step 1: Write the failing test**

```ts
expect(source).toContain("verify-pass");
expect(source).toContain("transfer");
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/views/business/ticketManage/api.spec.ts`
Expected: FAIL because endpoints are missing.

- [ ] **Step 3: Write minimal implementation**

```ts
export function verifyPass(id) { return request({ url: `${baseUrl}/${id}/verify-pass`, method: 'post' }) }
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/views/business/ticketManage/api.spec.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add nest-admin-frontend/src/views/business/ticketManage/*
git commit -m "feat: wire ticket flow actions"
```

### Task 3: 兼容审批回写

**Files:**
- Modify: `nest-admin/src/common/services/workflow-integration.service.ts`
- Modify: `nest-admin/src/common/services/workflow-integration.service.spec.ts`

- [ ] **Step 1: Write the failing test**

```ts
it("工单审批完成后只更新审批状态，不覆盖主流程状态", async () => {
  // 断言 status 不被改写
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test:unit -- workflow-integration.service.spec.ts`
Expected: FAIL with current status rewrite behavior.

- [ ] **Step 3: Write minimal implementation**

```ts
await this.ticketRepository.update(ticketId, { approvalStatus: "2" });
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm run test:unit -- workflow-integration.service.spec.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add nest-admin/src/common/services/workflow-integration.service.*
git commit -m "fix: decouple ticket approval from main status"
```

