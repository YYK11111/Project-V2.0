# Task Management Optimization Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Unify task state transitions, approval flows, permission checks, visibility rules, and front-end action rendering so task list, detail, workflow, and kanban views all behave consistently.

**Architecture:** Keep the task module as the single source of truth for task actions and state guards. Add a small shared front-end action policy layer only if it reduces duplication between the task list and task form. Treat workflow callbacks as the only place that final approval outcomes write back to task state.

**Tech Stack:** NestJS, TypeORM, Vue 3, Element Plus, Jest, Vitest.

---

## File Structure

- Modify: `nest-admin/src/modulesBusi/tasks/service.ts`
  - Add task action state guards, unify permission helpers, fix list/detail visibility, include status `6` in task views, and harden progress/delay rules.
- Modify: `nest-admin/src/common/services/workflow-integration.service.ts`
  - Harden task approval start and completion callback handling so repeated approvals and callback replays do not corrupt task state.
- Modify: `nest-admin/src/common/listeners/workflow-trigger.listener.ts`
  - Ensure task status-change triggers do not create duplicate approval flows.
- Modify: `nest-admin/src/modulesBusi/tasks/controller.ts`
  - Keep the controller thin, but pass through any new service inputs if the service signatures change.
- Modify: `nest-admin/src/modulesBusi/tasks/service.spec.ts`
  - Add backend contract tests for status guards, visibility, permissions, kanban grouping, and progress restrictions.
- Modify: `nest-admin/src/common/services/workflow-integration.service.spec.ts`
  - Add workflow approval replay and completion approval coverage.
- Modify: `nest-admin-frontend/src/views/business/taskManage/index.vue`
  - Align list buttons, status labels, and progress slider conditions with the backend action matrix.
- Modify: `nest-admin-frontend/src/views/business/taskManage/form.vue`
  - Align footer actions, alert actions, and read-only/editable states with the backend action matrix.
- Modify: `nest-admin-frontend/src/views/business/taskManage/api.ts`
  - Keep transport wrappers thin; no business rules here.
- Modify: `nest-admin-frontend/src/views/business/taskManage/index.structure.spec.ts`
  - Cover list action visibility and status label structure.
- Modify: `nest-admin-frontend/src/views/business/taskManage/form.structure.spec.ts`
  - Cover form action visibility, approval banners, and read-only behavior.

## Task 1: Lock Task State Guards In The Backend

**Files:**
- Modify: `nest-admin/src/modulesBusi/tasks/service.ts`
- Test: `nest-admin/src/modulesBusi/tasks/service.spec.ts`

- [ ] **Step 1: Add failing tests for action guards**

Add backend tests that express the intended state matrix:

```ts
it("submitApproval 只允许待处理任务发起审批", async () => {
  const { service, repository } = createService();
  repository.findOne.mockResolvedValue({
    id: "task-1",
    status: TaskStatus.inProgress,
    approvalStatus: "0",
    projectId: "project-1",
    leaderId: "leader-1",
  });

  await expect(
    (service as any).submitApproval("task-1", "leader-1"),
  ).rejects.toThrow("当前任务状态不允许提交审批");
});

it("submitCompletionApproval 只允许处理中任务发起完成审批", async () => {
  const { service, repository } = createService();
  repository.findOne.mockResolvedValue({
    id: "task-2",
    status: TaskStatus.completed,
    approvalStatus: "2",
    projectId: "project-1",
    leaderId: "leader-1",
  });

  await expect(
    service.submitCompletionApproval("task-2", "leader-1"),
  ).rejects.toThrow("当前任务状态不允许提交完成审批");
});

it("updateProgress 禁止已完成任务更新进度", async () => {
  const { service, repository } = createService();
  repository.findOne.mockResolvedValue({
    id: "task-3",
    status: TaskStatus.completed,
    projectId: "project-1",
    leaderId: "leader-1",
    executorIds: ["executor-1"],
  });

  await expect(
    service.updateProgress("task-3", 60, "executor-1"),
  ).rejects.toThrow("当前任务状态不允许更新进度");
});
```

- [ ] **Step 2: Run the backend task tests to confirm the failure**

Run:

```bash
cd nest-admin && npm run test:unit -- --runInBand src/modulesBusi/tasks/service.spec.ts
```

Expected: the new assertions fail because the guards are not yet strict enough.

- [ ] **Step 3: Add a single task-action guard helper**

Implement one helper in `service.ts` and use it everywhere:

```ts
private assertTaskStatusAllowed(
  task: Task,
  allowedStatuses: TaskStatus[],
  message: string,
) {
  if (!allowedStatuses.includes(task.status)) {
    throw new BadRequestException(message);
  }
}
```

Use it in `startTask`, `pauseTask`, `resumeTask`, `submitCompletionApproval`, `delayTask`, and `updateProgress`.

- [ ] **Step 4: Add explicit state checks to task action methods**

Update the methods so they reject invalid task states before writing:

```ts
async submitCompletionApproval(id: string, operatorId: string, permissions: string[] = []) {
  const task = await this.getTaskById(String(id));
  await this.ensureTaskCanExecute(task, operatorId, permissions);
  this.assertTaskStatusAllowed(
    task,
    [TaskStatus.inProgress],
    "当前任务状态不允许提交完成审批",
  );
  if (String(task.approvalStatus || "0") === "1") {
    throw new BadRequestException("当前任务已在完成审批中");
  }
  await this.repository.update(task.id, {
    status: TaskStatus.pendingCompletionApproval,
    approvalStatus: "1",
    currentNodeName: "待完成审批",
  } as any);
  await this.recalculateProjectProgressByIds([task.projectId]);
  return this.getTaskById(task.id);
}
```

- [ ] **Step 5: Run the backend task tests again**

Run:

```bash
cd nest-admin && npm run test:unit -- --runInBand src/modulesBusi/tasks/service.spec.ts
```

Expected: the new guard tests pass.

- [ ] **Step 6: Commit the backend guard changes**

```bash
git add nest-admin/src/modulesBusi/tasks/service.ts nest-admin/src/modulesBusi/tasks/service.spec.ts
git commit -m "feat: harden task lifecycle guards"
```

## Task 2: Harden Workflow Approval Start And Callback Replay

**Files:**
- Modify: `nest-admin/src/common/services/workflow-integration.service.ts`
- Modify: `nest-admin/src/common/services/workflow-integration.service.spec.ts`

- [ ] **Step 1: Add failing workflow approval tests**

Add tests for both approval start and completion callback replay:

```ts
it("普通任务审批只允许待处理任务发起", async () => {
  const { service, taskRepository, projectsService } = createService();
  taskRepository.findOne.mockResolvedValue({
    id: "task-10",
    projectId: "project-1",
    status: TaskStatus.inProgress,
  });
  projectsService.assertExecutionObjectPermission.mockResolvedValue({});

  await expect(service.startTaskApproval("task-10", "u1")).rejects.toThrow(
    "当前任务状态不允许发起审批",
  );
});

it("完成审批回调重复触发不会重复改写非待完成审批任务", async () => {
  const { service, taskRepository } = createService();
  taskRepository.findOne.mockResolvedValue({
    id: "task-11",
    status: TaskStatus.completed,
    approvalStatus: "2",
  });

  await service.handleWorkflowCallback("", "completed", {
    businessKey: "task_task-11",
  });

  expect(taskRepository.update).not.toHaveBeenCalled();
});
```

- [ ] **Step 2: Run the workflow unit tests to confirm the failure**

Run:

```bash
cd nest-admin && npm run test:unit -- --runInBand src/common/services/workflow-integration.service.spec.ts
```

Expected: the new assertions fail until workflow start and replay guards are added.

- [ ] **Step 3: Add approval-start state checks**

Update `startTaskApproval()` so it rejects repeated or invalid task approvals:

```ts
if (task.status !== TaskStatus.pending) {
  throw new BadRequestException("当前任务状态不允许发起审批");
}
if (String(task.approvalStatus || "0") === "1") {
  throw new BadRequestException("当前任务已在审批中");
}
```

- [ ] **Step 4: Keep completion approval callback idempotent**

Update the `task_` branch in `handleWorkflowCallback()` so:

- only `pendingCompletionApproval + approvalStatus=1` tasks are treated as completion approvals
- all other tasks fall back to the normal approval branch
- replayed callbacks do not overwrite a task that already finished the same flow

Use the current status and approval status together as the replay key.

- [ ] **Step 5: Run the workflow unit tests again**

Run:

```bash
cd nest-admin && npm run test:unit -- --runInBand src/common/services/workflow-integration.service.spec.ts
```

Expected: the workflow replay and approval-start tests pass.

- [ ] **Step 6: Commit the workflow hardening**

```bash
git add nest-admin/src/common/services/workflow-integration.service.ts nest-admin/src/common/services/workflow-integration.service.spec.ts
git commit -m "feat: harden task workflow approval flow"
```

## Task 3: Unify Task Visibility For List And Detail

**Files:**
- Modify: `nest-admin/src/modulesBusi/tasks/service.ts`
- Modify: `nest-admin/src/modulesBusi/tasks/service.spec.ts`

- [ ] **Step 1: Add failing visibility tests**

Add tests that prove list and detail use the same visibility logic:

```ts
it("审批参与人可以在列表和详情中看到同一任务", async () => {
  const { service, repository, projectsService, businessApprovalContextService } = createService();
  repository.findOne.mockResolvedValue({
    id: "task-20",
    projectId: "project-1",
    leaderId: "leader-1",
    createUser: "creator-1",
    executorIds: [],
    status: TaskStatus.inProgress,
  });
  projectsService.getVisibleProjectIdsForUser.mockResolvedValue([]);
  businessApprovalContextService.hasBusinessParticipantAccess.mockResolvedValue(true);

  const detail = await service.getOne({
    id: "task-20",
    _operatorId: "approver-1",
    _operatorPermissions: ["business/tasks/access"],
  } as any);

  expect(detail.id).toBe("task-20");
});
```

- [ ] **Step 2: Run the backend task tests to confirm the failure**

Run:

```bash
cd nest-admin && npm run test:unit -- --runInBand src/modulesBusi/tasks/service.spec.ts
```

Expected: one or more visibility assertions fail until the shared visibility logic is extracted.

- [ ] **Step 3: Extract a shared visibility helper**

Implement a helper that returns a single predicate for `list()` and `getOne()`:

```ts
private async canSeeTask(
  task: Task,
  operatorId: string,
  permissions: string[] = [],
) {
  // project visibility, approval visibility, personal fallback
}
```

Use the same helper from both list and detail retrieval.

- [ ] **Step 4: Make approval-visible tasks survive project filtering**

When approval-visible task ids exist, they must be merged with the project-visible scope rather than being filtered out by it.

- [ ] **Step 5: Run the backend task tests again**

Run:

```bash
cd nest-admin && npm run test:unit -- --runInBand src/modulesBusi/tasks/service.spec.ts
```

Expected: list/detail visibility tests pass.

- [ ] **Step 6: Commit the visibility unification**

```bash
git add nest-admin/src/modulesBusi/tasks/service.ts nest-admin/src/modulesBusi/tasks/service.spec.ts
git commit -m "feat: unify task visibility rules"
```

## Task 4: Align Frontend Buttons And Status Labels

**Files:**
- Modify: `nest-admin-frontend/src/views/business/taskManage/index.vue`
- Modify: `nest-admin-frontend/src/views/business/taskManage/form.vue`
- Modify: `nest-admin-frontend/src/views/business/taskManage/index.structure.spec.ts`
- Modify: `nest-admin-frontend/src/views/business/taskManage/form.structure.spec.ts`

- [ ] **Step 1: Add failing structure tests**

Add guards for the list and form action visibility:

```ts
it("列表页展示待完成审批状态和完成审批按钮", () => {
  const source = readFileSync(resolve(__dirname, "index.vue"), "utf-8");

  expect(source).toContain("待完成审批");
  expect(source).toContain("submitCompletionApproval");
  expect(source).toContain("canSubmitCompletionCurrentTask");
});

it("表单页区分提交审批和提交完成审批", () => {
  const source = readFileSync(resolve(__dirname, "form.vue"), "utf-8");

  expect(source).toContain("提交审批");
  expect(source).toContain("提交完成审批");
  expect(source).toContain("canSubmitCurrentApproval");
  expect(source).toContain("canSubmitCompletion");
});
```

- [ ] **Step 2: Run the frontend structure tests to confirm the failure**

Run:

```bash
cd nest-admin-frontend && npx vitest run src/views/business/taskManage/index.structure.spec.ts src/views/business/taskManage/form.structure.spec.ts
```

Expected: the new structure expectations fail until the buttons and labels are aligned.

- [ ] **Step 3: Split the task action conditions**

In `index.vue` and `form.vue`, keep separate computed conditions for:

- `canSubmitTaskApproval`
- `canSubmitCompletion`
- `canStartTask`
- `canPauseTask`
- `canResumeTask`
- `canDelayTask`

Do not reuse `canSaveTask` to decide approval actions.

- [ ] **Step 4: Align progress slider and edit entry conditions**

Make the progress slider and edit entry depend on the same backend capability fields the service returns, not on a looser local heuristic.

- [ ] **Step 5: Run the frontend type check and structure tests**

Run:

```bash
cd nest-admin-frontend && npm run type-check
cd nest-admin-frontend && npx vitest run src/views/business/taskManage/index.structure.spec.ts src/views/business/taskManage/form.structure.spec.ts
```

Expected: no type errors and all task manage structure tests pass.

- [ ] **Step 6: Commit the frontend alignment**

```bash
git add nest-admin-frontend/src/views/business/taskManage/index.vue nest-admin-frontend/src/views/business/taskManage/form.vue nest-admin-frontend/src/views/business/taskManage/index.structure.spec.ts nest-admin-frontend/src/views/business/taskManage/form.structure.spec.ts
git commit -m "feat: align task management frontend actions"
```

## Task 5: Close The Kanban And Progress Gaps

**Files:**
- Modify: `nest-admin/src/modulesBusi/tasks/service.ts`
- Modify: `nest-admin/src/modulesBusi/tasks/service.spec.ts`
- Modify: `nest-admin-frontend/src/views/business/taskManage/index.vue`

- [ ] **Step 1: Add failing kanban and progress tests**

Add tests that prove status `6` is visible in task grouping and that progress updates reject invalid states:

```ts
it("kanban 数据包含待完成审批列或任务", async () => {
  const { service, repository } = createService();
  repository.find.mockResolvedValue([
    { id: "task-30", status: TaskStatus.pendingCompletionApproval, projectId: "project-1" },
  ]);

  const result = await service.getKanbanData("project-1");

  expect(JSON.stringify(result)).toContain("待完成审批");
});
```

- [ ] **Step 2: Run the backend task tests to confirm the failure**

Run:

```bash
cd nest-admin && npm run test:unit -- --runInBand src/modulesBusi/tasks/service.spec.ts
```

Expected: the kanban and progress assertions fail until the state coverage is extended.

- [ ] **Step 3: Extend kanban grouping for status 6**

Update `getKanbanData()` so `6` is either its own lane or is grouped in a clearly named approval lane.

- [ ] **Step 4: Keep progress updates state-safe**

Require a legal execution state before allowing progress writes, and make the frontend slider disabled in all other states.

- [ ] **Step 5: Run backend and frontend verification**

Run:

```bash
cd nest-admin && npm run test:unit -- --runInBand src/modulesBusi/tasks/service.spec.ts
cd nest-admin-frontend && npm run type-check
```

Expected: task lifecycle, kanban, and progress checks pass.

- [ ] **Step 6: Commit the state coverage fix**

```bash
git add nest-admin/src/modulesBusi/tasks/service.ts nest-admin/src/modulesBusi/tasks/service.spec.ts nest-admin-frontend/src/views/business/taskManage/index.vue
git commit -m "feat: close task kanban and progress gaps"
```

## Final Verification

Run the narrowest relevant checks in this order:

```bash
cd nest-admin && npm run lint
cd nest-admin && npm run test:unit -- --runInBand src/modulesBusi/tasks/service.spec.ts src/common/services/workflow-integration.service.spec.ts
cd nest-admin-frontend && npm run type-check
cd nest-admin-frontend && npx vitest run src/views/business/taskManage/index.structure.spec.ts src/views/business/taskManage/form.structure.spec.ts
```

If any API response shape changes during the work, also run:

```bash
npm run check:api-contract
```
