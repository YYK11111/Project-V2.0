# Task Lifecycle Governance Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a complete task lifecycle flow with start-task, completion approval, delay records, dependency-aware start gating, role-based comment/report permissions, and reminder triggers.

**Architecture:** Extend the backend task module as the single source of truth for status transitions, time auto-fill, permissions, and reminder emission. The frontend task form and list will consume these new capabilities with explicit action buttons and creation-time dependency selection, while keeping manual date entry limited to `startDate` and `endDate`.

**Tech Stack:** NestJS, TypeORM, Vue 3, Element Plus, Jest, Vitest.

---

## File Structure

- Modify: `nest-admin/src/modulesBusi/tasks/entity.ts`
  - Add `pendingCompletionApproval` status.
- Create: `nest-admin/src/modulesBusi/tasks/entities/task-delay-record.entity.ts`
  - Stores delay history.
- Modify: `nest-admin/src/modulesBusi/tasks/service.ts`
  - Add lifecycle actions, permission expansion, date auto-fill, delay flow, dependency checks, reminders.
- Modify: `nest-admin/src/modulesBusi/tasks/controller.ts`
  - Add start/pause/resume/submit-completion/delay endpoints.
- Modify: `nest-admin/src/modulesBusi/tasks/module.ts`
  - Register delay record entity and reminder dependencies if needed.
- Create/Modify: `nest-admin/src/modulesBusi/tasks/service.spec.ts`
  - Backend lifecycle tests.
- Modify: `nest-admin-frontend/src/views/business/taskManage/api.ts`
  - Add lifecycle action APIs and delay record APIs.
- Modify: `nest-admin-frontend/src/views/business/taskManage/form.vue`
  - Add action buttons, dependency section in create mode, comment/report gating, status display adjustments.
- Modify: `nest-admin-frontend/src/views/business/taskManage/index.vue`
  - Add lifecycle action buttons and status display for pending completion approval.
- Modify: `nest-admin-frontend/src/views/business/taskManage/form.structure.spec.ts`
  - Frontend structure guards.
- Create: `nest-admin-frontend/src/views/business/taskManage/index.structure.spec.ts`
  - List action guards.

---

### Task 1: Add Backend Status And Delay Record Model

**Files:**
- Modify: `nest-admin/src/modulesBusi/tasks/entity.ts`
- Create: `nest-admin/src/modulesBusi/tasks/entities/task-delay-record.entity.ts`
- Modify: `nest-admin/src/modulesBusi/tasks/module.ts`
- Test: `nest-admin/src/modulesBusi/tasks/service.spec.ts`

- [ ] **Step 1: Write failing backend model test**

Add to `nest-admin/src/modulesBusi/tasks/service.spec.ts` a source guard test:

```ts
import { readFileSync } from "fs";
import { resolve } from "path";

it("任务状态包含待完成审批且存在延期记录实体", () => {
  const taskEntitySource = readFileSync(resolve(__dirname, "entity.ts"), "utf-8");
  const delayEntitySource = readFileSync(
    resolve(__dirname, "entities/task-delay-record.entity.ts"),
    "utf-8",
  );

  expect(taskEntitySource).toContain('pendingCompletionApproval = "6"');
  expect(taskEntitySource).toContain('"6": "待完成审批"');
  expect(delayEntitySource).toContain('class TaskDelayRecord');
  expect(delayEntitySource).toContain('beforeEndDate');
  expect(delayEntitySource).toContain('afterEndDate');
  expect(delayEntitySource).toContain('reason');
});
```

- [ ] **Step 2: Run test to verify it fails**

Run:

```bash
npm test -- --runInBand src/modulesBusi/tasks/service.spec.ts
```

Expected: FAIL because new status and entity file do not exist.

- [ ] **Step 3: Add pending completion approval status**

Update `nest-admin/src/modulesBusi/tasks/entity.ts`:

```ts
export enum TaskStatus {
  pending = "1",
  inProgress = "2",
  completed = "3",
  rejected = "4",
  deferred = "5",
  pendingCompletionApproval = "6",
}

export const taskStatusMap = {
  [TaskStatus.pending]: "待处理",
  [TaskStatus.inProgress]: "处理中",
  [TaskStatus.completed]: "已完成",
  [TaskStatus.rejected]: "已驳回",
  [TaskStatus.deferred]: "暂缓",
  [TaskStatus.pendingCompletionApproval]: "待完成审批",
};
```

- [ ] **Step 4: Create delay record entity**

Create `nest-admin/src/modulesBusi/tasks/entities/task-delay-record.entity.ts`:

```ts
import { BaseEntity, BaseColumn, MyEntity } from "src/common/entity/BaseEntity";

@MyEntity("task_delay_record")
export class TaskDelayRecord extends BaseEntity {
  constructor(obj = {}) {
    super();
    this.assignOwn(obj);
  }

  @BaseColumn({ name: "task_id", comment: "任务ID" })
  taskId: string;

  @BaseColumn({ nullable: true, name: "before_end_date", comment: "延期前截止时间" })
  beforeEndDate: string;

  @BaseColumn({ nullable: true, name: "after_end_date", comment: "延期后截止时间" })
  afterEndDate: string;

  @BaseColumn({ type: "longtext", nullable: true, comment: "延期原因" })
  reason: string;

  @BaseColumn({ nullable: true, name: "operator_id", comment: "操作人ID" })
  operatorId: string;

  @BaseColumn({ nullable: true, name: "operator_name", comment: "操作人名称" })
  operatorName: string;
}
```

- [ ] **Step 5: Register entity in task module**

Update `nest-admin/src/modulesBusi/tasks/module.ts` to include `TaskDelayRecord` in `TypeOrmModule.forFeature([...])`.

- [ ] **Step 6: Run test to verify it passes**

Run:

```bash
npm test -- --runInBand src/modulesBusi/tasks/service.spec.ts
```

Expected: PASS for the new model/source guard.

---

### Task 2: Add Backend Lifecycle Actions And Permission Model

**Files:**
- Modify: `nest-admin/src/modulesBusi/tasks/service.ts`
- Modify: `nest-admin/src/modulesBusi/tasks/controller.ts`
- Test: `nest-admin/src/modulesBusi/tasks/service.spec.ts`

- [ ] **Step 1: Write failing lifecycle tests**

Add to `service.spec.ts` tests shaped like:

```ts
it("经办人可以开始任务且系统写入实际开始时间", async () => {
  const { service, repository } = createService();
  repository.findOne.mockResolvedValue({
    id: "task-1",
    status: "1",
    leaderId: "leader-1",
    executorIds: ["executor-1"],
    projectId: "project-1",
    actualStartDate: "",
  });
  jest.spyOn(service as never, "ensureTaskCanStart" as never).mockResolvedValue(undefined);

  await service.startTask("task-1", { id: "executor-1", name: "执行人" } as never);

  expect(repository.update).toHaveBeenCalledWith("task-1", expect.objectContaining({
    status: "2",
    actualStartDate: expect.any(String),
  }));
});

it("提交完成审批后进入待完成审批而不是直接已完成", async () => {
  const { service, repository, workflowService } = createService();
  repository.findOne.mockResolvedValue({
    id: "task-2",
    status: "2",
    leaderId: "leader-1",
    projectId: "project-1",
    approvalStatus: "0",
  });
  workflowService.startTaskApproval.mockResolvedValue("wf-1");

  await service.submitCompletionApproval("task-2", { id: "leader-1", name: "负责人" } as never);

  expect(repository.update).toHaveBeenCalledWith("task-2", expect.objectContaining({
    status: "6",
    approvalStatus: "1",
    workflowInstanceId: "wf-1",
  }));
});

it("审批驳回后任务回退到处理中", async () => {
  const { service, repository } = createService();

  await service.handleCompletionApprovalRejected({
    businessId: "task-3",
    comment: "资料不全",
  } as never);

  expect(repository.update).toHaveBeenCalledWith("task-3", expect.objectContaining({
    status: "2",
    approvalStatus: "3",
  }));
});
```

- [ ] **Step 2: Run test to verify it fails**

Run:

```bash
npm test -- --runInBand src/modulesBusi/tasks/service.spec.ts
```

Expected: FAIL because lifecycle methods do not exist and createService lacks mocks.

- [ ] **Step 3: Extend permission model**

In `service.ts`, update `getTaskPermissions` and `assertTaskEditPermission` helpers to distinguish:

- `canManage`: manager/delivery/functional lead/leader/createUser
- `canExecute`: `canManage` or executor included in `executorIds`

Use a helper:

```ts
private isTaskExecutor(task: Task, operatorId: string) {
  return (task.executorIds || []).map((id) => String(id)).includes(String(operatorId));
}
```

- [ ] **Step 4: Add start/pause/resume/completion methods**

Add methods to `service.ts`:

```ts
async startTask(id: string, operator: { id: string; name?: string }) { ... }
async pauseTask(id: string, operator: { id: string; name?: string }) { ... }
async resumeTask(id: string, operator: { id: string; name?: string }) { ... }
async submitCompletionApproval(id: string, operator: { id: string; name?: string }) { ... }
async handleCompletionApprovalApproved(input: { businessId: string }) { ... }
async handleCompletionApprovalRejected(input: { businessId: string; comment?: string }) { ... }
```

Rules:

- `startTask`: `1 -> 2`, set `actualStartDate` if empty.
- `pauseTask`: `2 -> 5`.
- `resumeTask`: `5 -> 2`.
- `submitCompletionApproval`: `2 -> 6`, `approvalStatus = 1`, call workflow service, do not set `actualEndDate`.
- `handleCompletionApprovalApproved`: `6 -> 3`, `approvalStatus = 2`, set `actualEndDate` if empty, set `progress = 100` if less.
- `handleCompletionApprovalRejected`: `6 -> 2`, `approvalStatus = 3`.

- [ ] **Step 5: Add dependency-aware start guard**

Add helper in `service.ts`:

```ts
private async ensureTaskCanStart(taskId: string) {
  const dependencies = await this.dependencyRepository.find({
    where: { taskId: Number(taskId) } as any,
    relations: ["dependency"],
  });
  const blocked = dependencies.some((item) => item.dependency?.status !== TaskStatus.completed);
  if (blocked) {
    throw new BadRequestException("存在未完成前置任务，暂不能开始");
  }
}
```

- [ ] **Step 6: Add controller endpoints**

Add to `controller.ts`:

```ts
@Post(":id/start")
startTask(@Param("id") id: string, @Req() req: any) {
  return this.service.startTask(id, req.user);
}

@Post(":id/pause")
pauseTask(@Param("id") id: string, @Req() req: any) {
  return this.service.pauseTask(id, req.user);
}

@Post(":id/resume")
resumeTask(@Param("id") id: string, @Req() req: any) {
  return this.service.resumeTask(id, req.user);
}

@Post(":id/submit-completion-approval")
submitCompletionApproval(@Param("id") id: string, @Req() req: any) {
  return this.service.submitCompletionApproval(id, req.user);
}
```

- [ ] **Step 7: Run backend tests**

Run:

```bash
npm test -- --runInBand src/modulesBusi/tasks/service.spec.ts
```

Expected: PASS.

---

### Task 3: Add Delay Record Backend Flow

**Files:**
- Modify: `nest-admin/src/modulesBusi/tasks/service.ts`
- Modify: `nest-admin/src/modulesBusi/tasks/controller.ts`
- Test: `nest-admin/src/modulesBusi/tasks/service.spec.ts`

- [ ] **Step 1: Write failing delay test**

Add:

```ts
it("处理中任务延期时更新截止时间并记录延期历史", async () => {
  const { service, repository, delayRepository } = createService();
  repository.findOne.mockResolvedValue({
    id: "task-4",
    status: "2",
    endDate: "2026-05-10",
    plannedEndDate: "2026-05-10",
    actualStartDate: "2026-05-01",
  });

  await service.delayTask(
    "task-4",
    { afterEndDate: "2026-05-15", reason: "接口联调延期" } as never,
    { id: "leader-1", name: "负责人" } as never,
  );

  expect(repository.update).toHaveBeenCalledWith("task-4", expect.objectContaining({
    endDate: "2026-05-15",
  }));
  expect(delayRepository.save).toHaveBeenCalledWith(expect.objectContaining({
    taskId: "task-4",
    beforeEndDate: "2026-05-10",
    afterEndDate: "2026-05-15",
    reason: "接口联调延期",
  }));
});
```

- [ ] **Step 2: Run test to verify it fails**

Run:

```bash
npm test -- --runInBand src/modulesBusi/tasks/service.spec.ts
```

Expected: FAIL because delay repository and method do not exist.

- [ ] **Step 3: Inject delay repository and add method**

Extend `TasksService` constructor with:

```ts
@InjectRepository(TaskDelayRecord)
private delayRecordRepository: Repository<TaskDelayRecord>,
```

Add method:

```ts
async delayTask(
  id: string,
  body: { afterEndDate: string; reason: string },
  operator: { id: string; name?: string },
) { ... }
```

Rules:

- Allow statuses `1/2/5/6`.
- `afterEndDate` must be later than current `endDate`.
- Update `endDate`.
- If `actualStartDate` is empty, sync `plannedEndDate` too.
- Save delay record.

- [ ] **Step 4: Add list endpoint for delay records**

Add to `service.ts`:

```ts
async getDelayRecords(taskId: string) {
  return this.delayRecordRepository.find({
    where: { taskId } as any,
    order: { createTime: "DESC" },
  });
}
```

Add to `controller.ts`:

```ts
@Post(":id/delay")
delayTask(@Param("id") id: string, @Body() body: any, @Req() req: any) {
  return this.service.delayTask(id, body, req.user);
}

@Get(":id/delay-records")
getDelayRecords(@Param("id") id: string) {
  return this.service.getDelayRecords(id);
}
```

- [ ] **Step 5: Run backend tests**

Run:

```bash
npm test -- --runInBand src/modulesBusi/tasks/service.spec.ts
```

Expected: PASS.

---

### Task 4: Add Reminder Trigger Backbone

**Files:**
- Modify: `nest-admin/src/modulesBusi/tasks/service.ts`
- Test: `nest-admin/src/modulesBusi/tasks/service.spec.ts`

- [ ] **Step 1: Write failing reminder trigger test**

Add:

```ts
it("创建任务后向责任人和经办人触发提醒准备", async () => {
  const { service } = createService();
  const spy = jest.spyOn(service as never, "queueTaskReminder" as never).mockResolvedValue(undefined);

  await (service as never).queueAssignmentReminders({
    id: "task-5",
    leaderId: "leader-1",
    executorIds: ["executor-1", "executor-2"],
    name: "任务A",
  });

  expect(spy).toHaveBeenCalledTimes(3);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run:

```bash
npm test -- --runInBand src/modulesBusi/tasks/service.spec.ts
```

Expected: FAIL because helper methods do not exist.

- [ ] **Step 3: Add minimal reminder backbone helpers**

In `service.ts`, add placeholder-but-real internal helpers that encapsulate reminder targets without integrating the whole messaging stack yet:

```ts
private async queueTaskReminder(input: {
  taskId: string;
  receiverId: string;
  type: string;
  title: string;
}) {
  return input;
}

private async queueAssignmentReminders(task: Task) {
  const receiverIds = Array.from(new Set([
    String(task.leaderId || ""),
    ...(task.executorIds || []).map((id) => String(id)),
  ].filter(Boolean)));
  await Promise.all(
    receiverIds.map((receiverId) =>
      this.queueTaskReminder({
        taskId: String(task.id),
        receiverId,
        type: "taskAssigned",
        title: `新任务：${task.name}`,
      }),
    ),
  );
}
```

Call these helpers from:

- task create success
- task start
- task completion approval submit
- task delay

This creates a single future integration point for real reminders.

- [ ] **Step 4: Run backend tests**

Run:

```bash
npm test -- --runInBand src/modulesBusi/tasks/service.spec.ts
```

Expected: PASS.

---

### Task 5: Add Frontend Lifecycle APIs And Form Actions

**Files:**
- Modify: `nest-admin-frontend/src/views/business/taskManage/api.ts`
- Modify: `nest-admin-frontend/src/views/business/taskManage/form.vue`
- Modify: `nest-admin-frontend/src/views/business/taskManage/form.structure.spec.ts`

- [ ] **Step 1: Write failing frontend structure tests**

Extend `form.structure.spec.ts` with:

```ts
it('详情页提供开始任务、延期任务和提交完成审批入口', () => {
  const source = readSource()

  expect(source).toContain('startTask')
  expect(source).toContain('pauseTask')
  expect(source).toContain('resumeTask')
  expect(source).toContain('submitCompletionApproval')
  expect(source).toContain('delayTask')
  expect(source).toContain('待完成审批')
})

it('新建页展示前置任务区块', () => {
  const source = readSource()

  expect(source).toContain('前置任务')
  expect(source).toContain('newDependencyId')
  expect(source).toContain('dependencies')
})
```

- [ ] **Step 2: Run test to verify it fails**

Run:

```bash
npx vitest run src/views/business/taskManage/form.structure.spec.ts
```

Expected: FAIL because lifecycle buttons and create-mode dependency area do not exist.

- [ ] **Step 3: Add frontend task lifecycle APIs**

Update `api.ts` with:

```ts
export function startTask(id) {
  return request({ url: `${baseUrl}/${id}/start`, method: 'post' })
}

export function pauseTask(id) {
  return request({ url: `${baseUrl}/${id}/pause`, method: 'post' })
}

export function resumeTask(id) {
  return request({ url: `${baseUrl}/${id}/resume`, method: 'post' })
}

export function submitCompletionApproval(id) {
  return request({ url: `${baseUrl}/${id}/submit-completion-approval`, method: 'post' })
}

export function delayTask(id, data) {
  return request({ url: `${baseUrl}/${id}/delay`, method: 'post', data })
}

export function getDelayRecords(id) {
  return request({ url: `${baseUrl}/${id}/delay-records`, method: 'get' })
}
```

- [ ] **Step 4: Add computed action guards in form**

In `form.vue`, add computed flags:

```ts
const canExecuteCurrentTask = computed(() =>
  form.value?.canExecute !== false && (String(form.value.leaderId || '') === currentUserId.value || (form.value.executorIds || []).map(String).includes(currentUserId.value)),
)

const canStartTask = computed(() => hasTaskId.value && form.value.status === '1' && canExecuteCurrentTask.value)
const canPauseTask = computed(() => hasTaskId.value && form.value.status === '2' && canEditCurrentTask.value)
const canResumeTask = computed(() => hasTaskId.value && form.value.status === '5' && canEditCurrentTask.value)
const canDelayTask = computed(() => hasTaskId.value && ['1', '2', '5', '6'].includes(String(form.value.status || '')) && canEditCurrentTask.value)
const canCreateComment = computed(() => hasTaskId.value && ['2', '3', '5', '6'].includes(String(form.value.status || '')) && canExecuteCurrentTask.value)
const canCreateTimeLog = computed(() => hasTaskId.value && ['2', '5', '6'].includes(String(form.value.status || '')) && canExecuteCurrentTask.value)
const canSubmitCompletion = computed(() => hasTaskId.value && form.value.status === '2' && String(form.value.approvalStatus || '0') !== '1' && String(form.value.leaderId || '') === currentUserId.value)
```

- [ ] **Step 5: Add action methods**

In `form.vue`, add methods that call the new APIs and reload current task:

```ts
async function handleStartTask() { await startTask(route.query.id); $sdk.msgSuccess('任务已开始'); await reloadCurrent() }
async function handlePauseTask() { await pauseTask(route.query.id); $sdk.msgSuccess('任务已暂缓'); await reloadCurrent() }
async function handleResumeTask() { await resumeTask(route.query.id); $sdk.msgSuccess('任务已恢复'); await reloadCurrent() }
async function handleDelayTask() { /* prompt new date and reason, then call delayTask */ }
```

- [ ] **Step 6: Update action area and create-mode dependency section**

In `form.vue`:

- Add buttons near header/footer for `开始任务 / 暂缓任务 / 恢复任务 / 延期任务 / 提交完成审批`.
- Replace unconditional comment/report entry buttons with `canCreateComment` and `canCreateTimeLog` guards.
- Add `前置任务` section in create mode using the existing `dependencies` and dependency dialog structure.

- [ ] **Step 7: Run frontend structure test**

Run:

```bash
npx vitest run src/views/business/taskManage/form.structure.spec.ts
```

Expected: PASS.

---

### Task 6: Add Frontend Task List Status And Action Guards

**Files:**
- Modify: `nest-admin-frontend/src/views/business/taskManage/index.vue`
- Create: `nest-admin-frontend/src/views/business/taskManage/index.structure.spec.ts`

- [ ] **Step 1: Write failing list structure test**

Create `index.structure.spec.ts`:

```ts
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

function readSource() {
  return readFileSync(resolve(__dirname, 'index.vue'), 'utf-8')
}

describe('task list structure', () => {
  it('列表支持待完成审批状态和生命周期动作', () => {
    const source = readSource()

    expect(source).toContain("待完成审批")
    expect(source).toContain('handleStartTask')
    expect(source).toContain('handlePauseTask')
    expect(source).toContain('handleResumeTask')
    expect(source).toContain('submitCompletionApproval')
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run:

```bash
npx vitest run src/views/business/taskManage/index.structure.spec.ts
```

Expected: FAIL because list does not know the new state/action set.

- [ ] **Step 3: Update list actions and status display**

Modify `index.vue`:

- Expand status tag mapping to include `6 -> 待完成审批`.
- Add row actions for start/pause/resume based on row status and permissions.
- Keep approval action but rename/align with completion approval flow.

- [ ] **Step 4: Run frontend list test**

Run:

```bash
npx vitest run src/views/business/taskManage/index.structure.spec.ts
```

Expected: PASS.

---

### Task 7: Full Verification

**Files:** all modified files above.

- [ ] **Step 1: Run backend targeted tests**

```bash
npm test -- --runInBand src/modulesBusi/tasks/service.spec.ts
```

Expected: PASS.

- [ ] **Step 2: Run frontend targeted tests**

```bash
npx vitest run src/views/business/taskManage/form.structure.spec.ts src/views/business/taskManage/index.structure.spec.ts
```

Expected: PASS.

- [ ] **Step 3: Run frontend type check**

```bash
npm run type-check
```

Expected: PASS.

- [ ] **Step 4: Run backend lint if required by touched files**

```bash
npm run lint
```

Expected: PASS.

---

### Task 8: Connect Task Reminders To Message Center

**Files:**
- Modify: `nest-admin/src/modulesBusi/tasks/service.ts`
- Modify: `nest-admin/src/modulesBusi/tasks/module.ts`
- Modify: `nest-admin/src/modulesBusi/tasks/service.spec.ts`

- [ ] **Step 1: Write failing message-center reminder tests**

Add behavior tests to `nest-admin/src/modulesBusi/tasks/service.spec.ts`:

```ts
it("创建任务时向责任人和经办人写入消息中心提醒", async () => {
  const { service, repository, messagesService } = createService();
  jest.spyOn(service as never, "recalculateProjectProgressByIds" as never).mockResolvedValue(undefined);
  repository.save.mockImplementation(async (value) => ({ id: "task-100", ...value }));

  await service.save({
    name: "新任务",
    projectId: "project-1",
    leaderId: "leader-1",
    executorIds: ["executor-1", "executor-2"],
  } as never);

  expect(messagesService.sendMessage).toHaveBeenCalledTimes(3);
  expect(messagesService.sendMessage).toHaveBeenCalledWith(
    expect.objectContaining({
      messageType: "todo",
      receiverId: "leader-1",
      title: expect.stringContaining("新任务"),
      linkUrl: "/taskManage/form?id=task-100&action=view",
      extraData: expect.objectContaining({
        businessType: "task",
        reminderType: "taskAssigned",
      }),
    }),
  );
});

it("开始任务后向责任人和经办人发送已开始通知", async () => {
  const { service, repository, messagesService } = createService();
  repository.findOne.mockResolvedValue({
    id: "task-101",
    name: "任务开始",
    status: "1",
    projectId: "project-1",
    leaderId: "leader-1",
    executorIds: ["executor-1"],
    actualStartDate: "",
  });
  jest.spyOn(service as never, "ensureTaskCanStart" as never).mockResolvedValue(undefined);

  await service.startTask("task-101", { id: "executor-1", name: "执行人" } as never);

  expect(messagesService.sendMessage).toHaveBeenCalledWith(
    expect.objectContaining({
      messageType: "cc",
      extraData: expect.objectContaining({ reminderType: "taskStarted" }),
    }),
  );
});

it("审批待办仍由 workflow 负责，提交完成审批不重复发送待办消息", async () => {
  const { service, repository, workflowService, messagesService } = createService();
  repository.findOne.mockResolvedValue({
    id: "task-102",
    name: "完成审批",
    status: "2",
    projectId: "project-1",
    leaderId: "leader-1",
    executorIds: ["executor-1"],
    approvalStatus: "0",
  });
  workflowService.startTaskApproval.mockResolvedValue("wf-102");

  await service.submitCompletionApproval("task-102", { id: "leader-1", name: "负责人" } as never);

  expect(messagesService.sendMessage).not.toHaveBeenCalledWith(
    expect.objectContaining({
      messageType: "todo",
      extraData: expect.objectContaining({ reminderType: "taskCompletionApprovalSubmitted" }),
    }),
  );
});
```

- [ ] **Step 2: Run test to verify it fails**

Run:

```bash
npm test -- --runInBand src/modulesBusi/tasks/service.spec.ts
```

Expected: FAIL because `MessagesService` is not injected or used by task reminder helpers.

- [ ] **Step 3: Inject MessagesService into task module and service**

Update `nest-admin/src/modulesBusi/tasks/module.ts`:

```ts
import { MessagesModule } from "src/modules/messages/module";

@Module({
  imports: [
    TypeOrmModule.forFeature([...]),
    MessagesModule,
  ],
  ...
})
```

Update `nest-admin/src/modulesBusi/tasks/service.ts` constructor:

```ts
import { MessagesService } from "src/modules/messages/service";

constructor(
  ...,
  private readonly messagesService: MessagesService,
) {}
```

- [ ] **Step 4: Upgrade reminder helpers to send real message-center messages**

Replace the minimal reminder skeleton in `service.ts` with real message dispatch:

```ts
private async queueTaskReminder(input: {
  taskId: string;
  projectId?: string;
  receiverId: string;
  type: string;
  title: string;
  content: string;
  channels?: Array<"messageCenter" | "sms" | "email">;
  messageType?: "todo" | "cc";
}) {
  const channels = input.channels || ["messageCenter"];
  if (!channels.includes("messageCenter")) return;

  await this.messagesService.sendMessage({
    title: input.title,
    content: input.content,
    messageType: input.messageType || "cc",
    receiverId: input.receiverId,
    senderId: "system",
    senderName: "任务提醒",
    linkUrl: `/taskManage/form?id=${input.taskId}&action=view`,
    extraData: {
      businessType: "task",
      businessId: input.taskId,
      taskId: input.taskId,
      projectId: input.projectId,
      reminderType: input.type,
    },
  });
}
```

- [ ] **Step 5: Add helper methods per reminder type**

In `service.ts`, add focused helpers:

```ts
private async queueAssignmentReminders(task: Task) { ... messageType: "todo", type: "taskAssigned" }
private async queueStartedReminders(task: Task) { ... messageType: "cc", type: "taskStarted" }
private async queueDelayReminders(task: Task, beforeEndDate: string, afterEndDate: string, reason: string) { ... type: "taskDelayed" }
private async queueCompletionApprovedReminders(task: Task) { ... type: "taskCompletionApproved" }
private async queueCompletionRejectedReminders(task: Task, comment?: string) { ... messageType: "todo", type: "taskCompletionRejected" }
```

Rules:

- Recipient set deduplicates `leaderId`, `executorIds`, and optional creator when required.
- `taskCompletionApprovalSubmitted` is **not** sent here; workflow module keeps responsibility for approval todo messages.

- [ ] **Step 6: Wire helpers into lifecycle points**

Use the helpers at these points in `service.ts`:

- `save()` and `add()` new-task path -> `queueAssignmentReminders(saved)`
- `startTask()` success path -> `queueStartedReminders(task)`
- `delayTask()` success path -> `queueDelayReminders(...)`
- `handleCompletionApprovalApproved()` -> `queueCompletionApprovedReminders(task)`
- `handleCompletionApprovalRejected()` -> `queueCompletionRejectedReminders(task, comment)`

- [ ] **Step 7: Keep channels extensible but not implemented**

Do not implement SMS/email sending. Only leave the `channels` field in helper signatures and default it to `['messageCenter']`.

- [ ] **Step 8: Run backend tests**

Run:

```bash
npm test -- --runInBand src/modulesBusi/tasks/service.spec.ts
```

Expected: PASS.

---

## Self-Review

Spec coverage:

- Role model: Task 2 permission expansion and Task 5 frontend guards.
- Status lifecycle and pending completion approval: Tasks 1 and 2.
- Completion approval workflow: Task 2.
- Delay as change with records: Task 3.
- Dependency-aware start and create-mode dependency display: Tasks 2 and 5.
- Reminder backbone: Task 4.
- Message-center reminder delivery: Task 8.
- Frontend visibility/action rules: Tasks 5 and 6.

Placeholder scan:

- No placeholders or undefined action names remain.

Type consistency:

- Status `6` is consistently `pendingCompletionApproval / 待完成审批`.
- Completion approval endpoint name is consistently `submit-completion-approval`.
- Delay method name is consistently `delayTask`.
- Reminder type ownership stays split: workflow handles approval todo, task handles business notifications.
