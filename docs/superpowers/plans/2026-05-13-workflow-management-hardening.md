# Workflow Management Hardening Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 修复工作流管理的访问控制、会签状态机、节点执行上下文、发布校验、业务类型覆盖和自动触发幂等问题。

**Architecture:** 在现有 `WorkflowService` 内补齐核心引擎行为，避免大规模拆分；新增少量私有 helper 保持边界清晰。所有行为先补 Jest 回归测试，再实现最小变更，前端只修权限码和业务类型展示。

**Tech Stack:** NestJS 11、TypeORM、Jest、Vue 3、Element Plus。

---

### Task 1: 工作流访问控制与权限码

**Files:**
- Modify: `nest-admin/src/modulesBusi/workflow/controller.ts`
- Modify: `nest-admin/src/modulesBusi/workflow/service.ts`
- Modify: `nest-admin/src/modulesBusi/workflow/controller.spec.ts`
- Modify: `nest-admin/src/modules/auth/auth.guard.ts`
- Modify: `nest-admin-frontend/src/views/business/workflow/instances.vue`

- [ ] **Step 1: 写失败测试**

在 `controller.spec.ts` 增加用例：

```ts
it("获取实例详情和历史时透传服务端认证用户 ID 与权限", async () => {
  const controller = new WorkflowController(workflowService as any, businessFieldService);
  workflowService.getInstance = jest.fn().mockResolvedValue({});
  workflowService.getInstanceHistory = jest.fn().mockResolvedValue([]);

  await controller.getInstance("wf-1", {
    user: { id: "u1" },
    permissions: ["business/workflow/instances/getOne"],
  });
  await controller.getInstanceHistory("wf-1", {
    user: { id: "u1" },
    permissions: ["business/workflow/instances/history"],
  });

  expect(workflowService.getInstance).toHaveBeenCalledWith(
    "wf-1",
    "u1",
    ["business/workflow/instances/getOne"],
  );
  expect(workflowService.getInstanceHistory).toHaveBeenCalledWith(
    "wf-1",
    "u1",
    ["business/workflow/instances/history"],
  );
});
```

- [ ] **Step 2: 运行失败测试**

Run:

```bash
cd nest-admin
npm run test -- modulesBusi/workflow/controller.spec.ts
```

Expected: FAIL，`getInstance` / `getInstanceHistory` 当前不接收 req。

- [ ] **Step 3: 实现最小修复**

在 controller 中为 `getInstance`、`getInstanceHistory`、`getInstanceTasks` 增加 `@Req()`，传入 `getCurrentUserId(req)` 和 `req.permissions || req.user?.permissions || []`。在 service 中增加 `assertInstanceAccessible(instanceId, userId, permissions)`，允许：
- `business/workflow/instances/manageAll`
- 发起人
- 待办/已办任务处理人
- 历史 operator

修正 `auth.guard.ts` 的 close-returned 权限为 `business/workflow/instances/closeReturned`，前端 `instances.vue` 同步使用该权限码。

- [ ] **Step 4: 运行通过测试**

Run:

```bash
cd nest-admin
npm run test -- modulesBusi/workflow/controller.spec.ts
```

Expected: PASS。

### Task 2: 会签/并签状态机

**Files:**
- Modify: `nest-admin/src/modulesBusi/workflow/service.ts`
- Modify: `nest-admin/src/modulesBusi/workflow/service.spec.ts`

- [ ] **Step 1: 写失败测试**

增加用例覆盖：
- `multiInstanceType: "all"` 时第一个人同意不推进，最后一个人同意才推进。
- `multiInstanceType: "parallel"` 时任一人同意后取消同节点其他待办并推进。
- `multiInstanceType: "sequential"` 时第一个人同意创建下一个审批人任务，最后一个人同意才推进。

- [ ] **Step 2: 运行失败测试**

Run:

```bash
cd nest-admin
npm run test -- modulesBusi/workflow/service.spec.ts
```

Expected: FAIL，当前任一任务同意都会推进。

- [ ] **Step 3: 实现最小修复**

在创建任务时写入 `inputData`：

```ts
{
  multiInstanceType,
  candidateIds,
  candidateIndex,
  requireAllComplete,
}
```

在 `completeTask` 同意后先调用 `handleApprovalTaskCompletion`：
- `all`: 若同节点仍有待办，返回不推进。
- `parallel`: 取消同节点其他待办，停用消息，然后推进。
- `sequential`: 若还有下一位候选人，创建下一位任务并返回；否则推进。

驳回时统一取消同节点其他待办。

- [ ] **Step 4: 运行通过测试**

Run:

```bash
cd nest-admin
npm run test -- modulesBusi/workflow/service.spec.ts
```

Expected: PASS。

### Task 3: 节点上下文与发布校验

**Files:**
- Modify: `nest-admin/src/modulesBusi/workflow/service.ts`
- Modify: `nest-admin/src/modulesBusi/workflow/service.spec.ts`

- [ ] **Step 1: 写失败测试**

增加用例：
- `executeNode` 调用 handler 时 `context.variables._nodeProperties` 等于当前节点 properties。
- 发布缺少开始节点、缺少结束节点、审批节点缺审批人、条件节点缺默认分支时抛出明确错误。

- [ ] **Step 2: 运行失败测试**

Run:

```bash
cd nest-admin
npm run test -- modulesBusi/workflow/service.spec.ts
```

Expected: FAIL。

- [ ] **Step 3: 实现最小修复**

`executeNode` 构建 context 时注入：

```ts
variables: {
  ...(instance.variables || {}),
  _nodeProperties: node.properties || {},
}
```

新增 `validateDefinitionGraph(definition)` 并在 `publishDefinition` 调用，校验：
- 正好一个 start，至少一个 end
- 非 start 节点有入线，非 end 节点有出线
- 普通节点最多一条出线
- 审批/通知/抄送节点的审批人配置完整
- 条件节点每个条件有连线，且需要默认分支

- [ ] **Step 4: 运行通过测试**

Run:

```bash
cd nest-admin
npm run test -- modulesBusi/workflow/service.spec.ts
```

Expected: PASS。

### Task 4: 业务类型覆盖与自动触发幂等

**Files:**
- Create: `nest-admin/src/modulesBusi/workflow/loaders/handover.loader.ts`
- Modify: `nest-admin/src/modulesBusi/workflow/module.ts`
- Modify: `nest-admin/src/modulesBusi/workflow/workflow-data-loader.service.ts`
- Modify: `nest-admin/src/modulesBusi/workflow/service.ts`
- Modify: `nest-admin/src/common/listeners/workflow-trigger.listener.ts`
- Modify: `nest-admin/src/common/listeners/workflow-trigger.listener.spec.ts`
- Modify: `nest-admin-frontend/src/views/business/workflow/index.vue`
- Modify: `nest-admin-frontend/src/views/business/workflow/instances.vue`

- [ ] **Step 1: 写失败测试**

增加用例：
- `WorkflowDataLoaderService` 注册并支持 `handover`。
- `startBusinessWorkflow` 对同一 `businessKey + businessType + businessScene` 已有运行中实例时直接拒绝。
- `WorkflowTriggerListener` 支持 `GoLiveRecord`、`AcceptanceRecord`、`HandoverRecord`。

- [ ] **Step 2: 运行失败测试**

Run:

```bash
cd nest-admin
npm run test -- common/listeners/workflow-trigger.listener.spec.ts modulesBusi/workflow/service.spec.ts
```

Expected: FAIL。

- [ ] **Step 3: 实现最小修复**

新增 handover loader，注册到 module 和 data loader。扩展 `getBusinessSummary`、`getBusinessRoute`、`buildHandledHistoryTitle`、`buildWorkflowMessageSummary` 的业务类型映射。`startWorkflow` 在创建实例前检查运行中实例，避免重复。`WorkflowTriggerListener` 增加三类实体映射。

前端定义列表补 `goLive / acceptance / handover` 的业务对象和场景展示。

- [ ] **Step 4: 运行通过测试**

Run:

```bash
cd nest-admin
npm run test -- common/listeners/workflow-trigger.listener.spec.ts modulesBusi/workflow/service.spec.ts
```

Expected: PASS。

### Task 5: 总体验证

**Files:**
- Verify only.

- [ ] **Step 1: 后端工作流相关测试**

Run:

```bash
cd nest-admin
npm run test -- modulesBusi/workflow/service.spec.ts modulesBusi/workflow/controller.spec.ts common/listeners/workflow-trigger.listener.spec.ts common/services/workflow-integration.service.spec.ts
```

Expected: PASS。

- [ ] **Step 2: 后端 lint 和 build**

Run:

```bash
cd nest-admin
npm run lint
npm run build
```

Expected: PASS。

- [ ] **Step 3: 前端 type-check**

Run:

```bash
cd nest-admin-frontend
npm run type-check
```

Expected: PASS。

- [ ] **Step 4: API contract 和空白检查**

Run:

```bash
npm run check:api-contract
git diff --check
```

Expected: PASS。
