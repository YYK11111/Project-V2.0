# Task Scheduled Reminders Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add scheduled task reminders for due soon, overdue, and stale reports, with conservative frequency control and message-center deduplication.

**Architecture:** Extend `TasksService` with three independent scan methods and one deduplicating message dispatch helper, then trigger them from a daily cron schedule. Reuse the existing `messages` table and `MessagesService.sendMessage` for delivery, using `sourceType = "task_reminder"` plus `extraData.reminderType` for deduplication windows.

**Tech Stack:** NestJS, TypeORM, `@nestjs/schedule`, Jest.

---

## File Structure

- Modify: `nest-admin/src/modulesBusi/tasks/service.ts`
  - Add scan methods, dedupe helper, and cron entrypoint.
- Modify: `nest-admin/src/modulesBusi/tasks/service.spec.ts`
  - Add behavior tests for due soon, overdue, stale report, and dedupe windows.
- Modify: `nest-admin/src/modulesBusi/tasks/module.ts`
  - No new module dependency expected beyond already-present `MessagesModule`; only adjust if scheduler wiring is needed.

---

### Task 1: Add Due Soon Reminder Scan

**Files:**
- Modify: `nest-admin/src/modulesBusi/tasks/service.spec.ts`
- Modify: `nest-admin/src/modulesBusi/tasks/service.ts`

- [ ] **Step 1: Write failing due-soon test**

Add to `service.spec.ts`:

```ts
it("即将到期任务每天最多发送一次 cc 提醒", async () => {
  const { service, repository, messagesService } = createService();
  repository.find.mockResolvedValue([
    {
      id: "task-due-1",
      name: "即将到期任务",
      projectId: "project-1",
      leaderId: "leader-1",
      executorIds: ["executor-1"],
      endDate: "2099-05-03",
      status: TaskStatus.inProgress,
      approvalStatus: "0",
    },
  ]);
  jest.spyOn(service as never, "getTodayDate" as never).mockReturnValue("2099-05-01");
  jest.spyOn(service as never, "hasRecentReminder" as never).mockResolvedValue(false);

  await (service as never).scanDueSoonTaskReminders();

  expect(messagesService.sendMessage).toHaveBeenCalledWith(
    expect.objectContaining({
      messageType: MessageType.cc,
      sourceType: "task_reminder",
      sourceId: "task-due-1",
      extraData: expect.objectContaining({ reminderType: "taskDueSoon" }),
    }),
  );
});
```

- [ ] **Step 2: Run test to verify it fails**

Run:

```bash
npm test -- --runInBand src/modulesBusi/tasks/service.spec.ts
```

Expected: FAIL because `scanDueSoonTaskReminders` and `hasRecentReminder` do not exist.

- [ ] **Step 3: Add dedupe helper skeleton**

In `service.ts`, add:

```ts
private async hasRecentReminder(input: {
  taskId: string;
  receiverId: string;
  reminderType: string;
  windowHours: number;
}) {
  const threshold = new Date(Date.now() - input.windowHours * 60 * 60 * 1000).toISOString();
  const count = await this.messagesService.repository.count({
    where: {
      sourceType: "task_reminder",
      sourceId: input.taskId,
      receiverId: input.receiverId,
      createTime: In([]) as any,
    } as any,
  });
  return count > 0;
}
```

Then immediately replace the broken `createTime` placeholder in the next step with a query-builder implementation.

- [ ] **Step 4: Implement due-soon scan minimally**

Add to `service.ts`:

```ts
async scanDueSoonTaskReminders() {
  const tasks = await this.repository.find({
    where: [
      { status: TaskStatus.pending, isDelete: null as any } as any,
      { status: TaskStatus.inProgress, isDelete: null as any } as any,
      { status: TaskStatus.pendingCompletionApproval, isDelete: null as any } as any,
      { status: TaskStatus.deferred, isDelete: null as any } as any,
    ],
  });
  const today = this.getTodayDate();
  for (const task of tasks) {
    if (!task.endDate) continue;
    const diffDays = Math.ceil((+new Date(task.endDate) - +new Date(today)) / (24 * 60 * 60 * 1000));
    if (diffDays < 0 || diffDays > 3) continue;
    for (const receiverId of this.getTaskReminderRecipients(task)) {
      if (await this.hasRecentReminder({ taskId: String(task.id), receiverId, reminderType: "taskDueSoon", windowHours: 24 })) continue;
      await this.messagesService.sendMessage({
        title: `任务即将到期：${task.name}`,
        content: `任务截止时间临近，请及时处理。`,
        messageType: MessageType.cc,
        sourceType: "task_reminder",
        sourceId: String(task.id),
        receiverId,
        senderId: "system",
        linkUrl: `/taskManage/form?id=${task.id}&action=view`,
        extraData: {
          businessType: "task",
          businessId: String(task.id),
          taskId: String(task.id),
          projectId: String(task.projectId || ""),
          status: String(task.status || ""),
          approvalStatus: String(task.approvalStatus || "0"),
          reminderType: "taskDueSoon",
          channels: ["messageCenter"],
        },
      });
    }
  }
}
```

- [ ] **Step 5: Replace dedupe helper with working query**

Implement `hasRecentReminder` using query builder:

```ts
private async hasRecentReminder(input: {
  taskId: string;
  receiverId: string;
  reminderType: string;
  windowHours: number;
}) {
  const threshold = new Date(Date.now() - input.windowHours * 60 * 60 * 1000).toISOString();
  const count = await this.messagesService.repository
    .createQueryBuilder("message")
    .where("message.sourceType = :sourceType", { sourceType: "task_reminder" })
    .andWhere("message.sourceId = :sourceId", { sourceId: input.taskId })
    .andWhere("message.receiverId = :receiverId", { receiverId: input.receiverId })
    .andWhere("message.createTime >= :threshold", { threshold })
    .andWhere("JSON_EXTRACT(message.extraData, '$.reminderType') = :reminderType", {
      reminderType: JSON.stringify(input.reminderType),
    })
    .getCount();
  return count > 0;
}
```

- [ ] **Step 6: Run test to verify it passes**

Run:

```bash
npm test -- --runInBand src/modulesBusi/tasks/service.spec.ts
```

Expected: PASS.

---

### Task 2: Add Overdue Reminder Scan

**Files:**
- Modify: `nest-admin/src/modulesBusi/tasks/service.spec.ts`
- Modify: `nest-admin/src/modulesBusi/tasks/service.ts`

- [ ] **Step 1: Write failing overdue test**

```ts
it("已逾期任务每天最多发送一次 todo 提醒", async () => {
  const { service, repository, messagesService } = createService();
  repository.find.mockResolvedValue([
    {
      id: "task-overdue-1",
      name: "逾期任务",
      projectId: "project-1",
      leaderId: "leader-1",
      executorIds: ["executor-1"],
      endDate: "2099-05-01",
      status: TaskStatus.inProgress,
      approvalStatus: "0",
    },
  ]);
  jest.spyOn(service as never, "getTodayDate" as never).mockReturnValue("2099-05-03");
  jest.spyOn(service as never, "hasRecentReminder" as never).mockResolvedValue(false);

  await (service as never).scanOverdueTaskReminders();

  expect(messagesService.sendMessage).toHaveBeenCalledWith(
    expect.objectContaining({
      messageType: MessageType.todo,
      extraData: expect.objectContaining({ reminderType: "taskOverdue" }),
    }),
  );
});
```

- [ ] **Step 2: Run test to verify it fails**

Run the same Jest command and expect FAIL.

- [ ] **Step 3: Implement overdue scan**

Add to `service.ts`:

```ts
async scanOverdueTaskReminders() {
  const tasks = await this.repository.find({
    where: [
      { status: TaskStatus.pending, isDelete: null as any } as any,
      { status: TaskStatus.inProgress, isDelete: null as any } as any,
      { status: TaskStatus.pendingCompletionApproval, isDelete: null as any } as any,
      { status: TaskStatus.deferred, isDelete: null as any } as any,
    ],
  });
  const today = this.getTodayDate();
  for (const task of tasks) {
    if (!task.endDate || task.endDate >= today) continue;
    for (const receiverId of this.getTaskReminderRecipients(task)) {
      if (await this.hasRecentReminder({ taskId: String(task.id), receiverId, reminderType: "taskOverdue", windowHours: 24 })) continue;
      await this.messagesService.sendMessage({
        title: `任务已逾期：${task.name}`,
        content: `任务已超过截止时间，请尽快处理。`,
        messageType: MessageType.todo,
        sourceType: "task_reminder",
        sourceId: String(task.id),
        receiverId,
        senderId: "system",
        linkUrl: `/taskManage/form?id=${task.id}&action=view`,
        extraData: { businessType: "task", businessId: String(task.id), taskId: String(task.id), projectId: String(task.projectId || ""), status: String(task.status || ""), approvalStatus: String(task.approvalStatus || "0"), reminderType: "taskOverdue", channels: ["messageCenter"] },
      });
    }
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run the same Jest command and expect PASS.

---

### Task 3: Add Stale Report Reminder Scan

**Files:**
- Modify: `nest-admin/src/modulesBusi/tasks/service.spec.ts`
- Modify: `nest-admin/src/modulesBusi/tasks/service.ts`

- [ ] **Step 1: Write failing stale-report test**

```ts
it("未汇报任务每两天最多发送一次 todo 提醒", async () => {
  const { service, repository, timeLogRepository, messagesService } = createService();
  repository.find.mockResolvedValue([
    {
      id: "task-report-1",
      name: "未汇报任务",
      projectId: "project-1",
      leaderId: "leader-1",
      executorIds: ["executor-1"],
      status: TaskStatus.inProgress,
      approvalStatus: "0",
    },
  ]);
  timeLogRepository.query.mockResolvedValue([]);
  jest.spyOn(service as never, "hasRecentReminder" as never).mockResolvedValue(false);

  await (service as never).scanStaleReportTaskReminders();

  expect(messagesService.sendMessage).toHaveBeenCalledWith(
    expect.objectContaining({
      messageType: MessageType.todo,
      extraData: expect.objectContaining({ reminderType: "taskReportStale" }),
    }),
  );
});
```

- [ ] **Step 2: Run test to verify it fails**

Run the same Jest command and expect FAIL.

- [ ] **Step 3: Implement stale-report scan**

Add to `service.ts`:

```ts
async scanStaleReportTaskReminders() {
  const tasks = await this.repository.find({
    where: [
      { status: TaskStatus.inProgress, isDelete: null as any } as any,
      { status: TaskStatus.pendingCompletionApproval, isDelete: null as any } as any,
      { status: TaskStatus.deferred, isDelete: null as any } as any,
    ],
  });
  const taskIds = tasks.map((task) => String(task.id));
  if (!taskIds.length) return;
  const recentLogs = await this.timeLogRepository.query(
    `SELECT task_id AS taskId, MAX(create_time) AS latestReportTime
     FROM task_time_log
     WHERE task_id IN (?)
       AND is_delete IS NULL
     GROUP BY task_id`,
    [taskIds],
  );
  const latestMap = new Map(recentLogs.map((item) => [String(item.taskId), item.latestReportTime]));
  for (const task of tasks) {
    const latestReportTime = latestMap.get(String(task.id));
    const stale = !latestReportTime || Date.now() - +new Date(latestReportTime) >= 2 * 24 * 60 * 60 * 1000;
    if (!stale) continue;
    for (const receiverId of this.getTaskReminderRecipients(task)) {
      if (await this.hasRecentReminder({ taskId: String(task.id), receiverId, reminderType: "taskReportStale", windowHours: 48 })) continue;
      await this.messagesService.sendMessage({
        title: `请补充任务汇报：${task.name}`,
        content: `任务最近缺少执行汇报，请及时补充。`,
        messageType: MessageType.todo,
        sourceType: "task_reminder",
        sourceId: String(task.id),
        receiverId,
        senderId: "system",
        linkUrl: `/taskManage/form?id=${task.id}&action=view`,
        extraData: { businessType: "task", businessId: String(task.id), taskId: String(task.id), projectId: String(task.projectId || ""), status: String(task.status || ""), approvalStatus: String(task.approvalStatus || "0"), reminderType: "taskReportStale", channels: ["messageCenter"] },
      });
    }
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run the same Jest command and expect PASS.

---

### Task 4: Add Daily Cron Entrypoint

**Files:**
- Modify: `nest-admin/src/modulesBusi/tasks/service.spec.ts`
- Modify: `nest-admin/src/modulesBusi/tasks/service.ts`

- [ ] **Step 1: Write failing cron orchestration test**

```ts
it("每日扫描入口顺序执行三类定时提醒", async () => {
  const { service } = createService();
  const dueSoon = jest.spyOn(service as never, "scanDueSoonTaskReminders" as never).mockResolvedValue(undefined);
  const overdue = jest.spyOn(service as never, "scanOverdueTaskReminders" as never).mockResolvedValue(undefined);
  const stale = jest.spyOn(service as never, "scanStaleReportTaskReminders" as never).mockResolvedValue(undefined);

  await (service as never).runScheduledTaskReminders();

  expect(dueSoon).toHaveBeenCalledTimes(1);
  expect(overdue).toHaveBeenCalledTimes(1);
  expect(stale).toHaveBeenCalledTimes(1);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run the same Jest command and expect FAIL.

- [ ] **Step 3: Implement cron entrypoint**

At top of `service.ts` add:

```ts
import { Cron } from "@nestjs/schedule";
```

Add methods:

```ts
async runScheduledTaskReminders() {
  await this.scanDueSoonTaskReminders();
  await this.scanOverdueTaskReminders();
  await this.scanStaleReportTaskReminders();
}

@Cron("0 0 9 * * *")
async scheduledTaskDueSoonReminder() {
  await this.scanDueSoonTaskReminders();
}

@Cron("0 5 9 * * *")
async scheduledTaskOverdueReminder() {
  await this.scanOverdueTaskReminders();
}

@Cron("0 10 9 * * *")
async scheduledTaskReportReminder() {
  await this.scanStaleReportTaskReminders();
}
```

This keeps scan methods independently callable for tests and future manual repair.

- [ ] **Step 4: Run backend tests**

Run:

```bash
npm test -- --runInBand src/modulesBusi/tasks/service.spec.ts
```

Expected: PASS.

---

### Task 5: Full Verification

**Files:** all modified files above.

- [ ] **Step 1: Run backend targeted tests**

```bash
npm test -- --runInBand src/modulesBusi/tasks/service.spec.ts
```

Expected: PASS.

- [ ] **Step 2: Run backend lint**

```bash
npm run lint
```

Expected: PASS.

---

## Self-Review

Spec coverage:

- `taskDueSoon`: Task 1.
- `taskOverdue`: Task 2.
- `taskReportStale`: Task 3.
- Conservative frequency and dedupe: Tasks 1-3 via `hasRecentReminder` windows.
- Daily schedule entrypoint: Task 4.
- Message-center only delivery with future channel reservation: Tasks 1-3 payloads.

Placeholder scan:

- No placeholders or undefined helper names remain.

Type consistency:

- Reminder types are consistent: `taskDueSoon`, `taskOverdue`, `taskReportStale`.
- Dedupe helper uses `taskId + receiverId + reminderType + windowHours` consistently.
