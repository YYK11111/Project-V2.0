# Scheduled Job Center Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a unified scheduled job center for cron tasks that shows job catalog, run status, execution logs, and supports manual run plus enable/disable switches.

**Architecture:** Introduce a static cron job registry, a job config table for enable flags, and a job execution log table for runtime history. Add a backend service that wraps cron executions and exposes management APIs, then build a system-monitor frontend page that lists registered jobs and their logs. Phase 1 intentionally excludes timeout-instance management.

**Tech Stack:** NestJS, TypeORM, `@nestjs/schedule`, Vue 3, Element Plus, Jest, Vitest.

---

## File Structure

- Create: `nest-admin/src/common/scheduler/job-registry.ts`
  - Static metadata for cron jobs.
- Create: `nest-admin/src/modules/systemScheduledJobs/entity.ts`
  - Job config table (`system_job_config`).
- Create: `nest-admin/src/modules/systemScheduledJobs/log.entity.ts`
  - Execution log table (`system_job_execution_log`).
- Create: `nest-admin/src/modules/systemScheduledJobs/service.ts`
  - Registry merge, enable/disable, manual run, log query.
- Create: `nest-admin/src/modules/systemScheduledJobs/controller.ts`
  - APIs for list/logs/run/enable/disable.
- Create: `nest-admin/src/modules/systemScheduledJobs/module.ts`
  - Register entities and export service.
- Modify: `nest-admin/src/modulesBusi/tasks/service.ts`
  - Run cron scans through execution wrapper and respect enable flag.
- Modify: `nest-admin/src/modulesBusi/projects/service.ts`
  - Wrap daily cockpit snapshot cron.
- Modify: `nest-admin/src/modules/sys/file/service.ts`
  - Wrap orphan file cleanup cron.
- Modify: `nest-admin/src/modulesBusi/articleBorrows/service.ts`
  - Wrap expired borrow sync cron.
- Modify: `nest-admin/src/app.module.ts`
  - Import `SystemScheduledJobsModule`.
- Create/Modify: `nest-admin/src/modules/systemScheduledJobs/service.spec.ts`
  - Backend behavior tests for registry, logs, manual run, enable/disable.
- Create: `nest-admin-frontend/src/views/systemMonitor/scheduledJobs/api.ts`
  - Frontend API wrapper.
- Create: `nest-admin-frontend/src/views/systemMonitor/scheduledJobs/index.vue`
  - Job list + log panel page.
- Create: `nest-admin-frontend/src/views/systemMonitor/scheduledJobs/index.structure.spec.ts`
  - Frontend structure guard.

---

### Task 1: Add Static Cron Job Registry

**Files:**
- Create: `nest-admin/src/common/scheduler/job-registry.ts`
- Create/Modify: `nest-admin/src/modules/systemScheduledJobs/service.spec.ts`

- [ ] **Step 1: Write failing registry test**

Create `nest-admin/src/modules/systemScheduledJobs/service.spec.ts` with:

```ts
import { readFileSync } from "fs";
import { resolve } from "path";

describe("scheduled job registry", () => {
  it("注册现有 cron 任务元数据", () => {
    const source = readFileSync(
      resolve(__dirname, "../../common/scheduler/job-registry.ts"),
      "utf-8",
    );

    expect(source).toContain('jobKey: "tasks.dueSoonReminder"');
    expect(source).toContain('jobKey: "tasks.overdueReminder"');
    expect(source).toContain('jobKey: "tasks.reportStaleReminder"');
    expect(source).toContain('jobKey: "projects.dailyCockpitSnapshots"');
    expect(source).toContain('jobKey: "sysFile.orphanCleanup"');
    expect(source).toContain('jobKey: "articleBorrows.syncExpired"');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npm test -- --runInBand src/modules/systemScheduledJobs/service.spec.ts
```

Expected: FAIL because registry file does not exist.

- [ ] **Step 3: Create static registry**

Create `nest-admin/src/common/scheduler/job-registry.ts`:

```ts
export type ScheduledJobRegistryItem = {
  jobKey: string;
  jobName: string;
  jobType: "cron";
  module: string;
  description: string;
  scheduleExpression: string;
  supportsManualRun: boolean;
  sourceMode: "static";
  owner: string;
};

export const scheduledJobRegistry: ScheduledJobRegistryItem[] = [
  {
    jobKey: "tasks.dueSoonReminder",
    jobName: "任务即将到期提醒扫描",
    jobType: "cron",
    module: "tasks",
    description: "扫描距离截止时间 3 天内的任务并发送提醒。",
    scheduleExpression: "0 0 9 * * *",
    supportsManualRun: true,
    sourceMode: "static",
    owner: "TasksService",
  },
  {
    jobKey: "tasks.overdueReminder",
    jobName: "任务逾期提醒扫描",
    jobType: "cron",
    module: "tasks",
    description: "扫描已逾期任务并发送待办提醒。",
    scheduleExpression: "0 5 9 * * *",
    supportsManualRun: true,
    sourceMode: "static",
    owner: "TasksService",
  },
  {
    jobKey: "tasks.reportStaleReminder",
    jobName: "任务未汇报提醒扫描",
    jobType: "cron",
    module: "tasks",
    description: "扫描最近 2 天缺少汇报的任务并发送待办提醒。",
    scheduleExpression: "0 10 9 * * *",
    supportsManualRun: true,
    sourceMode: "static",
    owner: "TasksService",
  },
  {
    jobKey: "projects.dailyCockpitSnapshots",
    jobName: "项目驾驶舱快照生成",
    jobType: "cron",
    module: "projects",
    description: "每日生成项目驾驶舱快照。",
    scheduleExpression: "0 0 2 * * *",
    supportsManualRun: true,
    sourceMode: "static",
    owner: "ProjectsService",
  },
  {
    jobKey: "sysFile.orphanCleanup",
    jobName: "孤儿文件清理",
    jobType: "cron",
    module: "sysFile",
    description: "清理超过 24 小时未关联业务的孤儿文件。",
    scheduleExpression: "0 0 2 * * *",
    supportsManualRun: true,
    sourceMode: "static",
    owner: "SysFileService",
  },
  {
    jobKey: "articleBorrows.syncExpired",
    jobName: "借阅过期同步",
    jobType: "cron",
    module: "articleBorrows",
    description: "同步更新已到期的知识借阅记录。",
    scheduleExpression: "0 */5 * * * *",
    supportsManualRun: true,
    sourceMode: "static",
    owner: "ArticleBorrowsService",
  },
];
```

- [ ] **Step 4: Run test to verify it passes**

```bash
npm test -- --runInBand src/modules/systemScheduledJobs/service.spec.ts
```

Expected: PASS.

---

### Task 2: Add Job Config And Execution Log Models

**Files:**
- Create: `nest-admin/src/modules/systemScheduledJobs/entity.ts`
- Create: `nest-admin/src/modules/systemScheduledJobs/log.entity.ts`
- Create/Modify: `nest-admin/src/modules/systemScheduledJobs/service.spec.ts`

- [ ] **Step 1: Write failing model guard test**

Add:

```ts
it("声明任务配置表与执行日志表", () => {
  const configSource = readFileSync(resolve(__dirname, "entity.ts"), "utf-8");
  const logSource = readFileSync(resolve(__dirname, "log.entity.ts"), "utf-8");

  expect(configSource).toContain('@Entity("system_job_config")');
  expect(configSource).toContain('jobKey: string');
  expect(configSource).toContain('enabled: string');
  expect(logSource).toContain('@Entity("system_job_execution_log")');
  expect(logSource).toContain('triggerMode: string');
  expect(logSource).toContain('processedCount: number');
  expect(logSource).toContain('payload: Record<string, unknown>');
});
```

- [ ] **Step 2: Run test to verify it fails**

Run the same Jest command and expect FAIL.

- [ ] **Step 3: Create job config entity**

Create `entity.ts`:

```ts
import { BaseColumn, BaseEntity, MyEntity } from "src/common/entity/BaseEntity";

@MyEntity("system_job_config")
export class SystemScheduledJobConfig extends BaseEntity {
  constructor(obj = {}) {
    super();
    this.assignOwn(obj);
  }

  @BaseColumn({ name: "job_key", comment: "任务编码" })
  jobKey: string;

  @BaseColumn({ default: "1", comment: "是否启用：1启用 0停用" })
  enabled: string;

  @BaseColumn({ nullable: true, comment: "备注" })
  remarks: string;

  @BaseColumn({ nullable: true, name: "last_operator_id", comment: "最近操作人ID" })
  lastOperatorId: string;

  @BaseColumn({ nullable: true, name: "last_operator_name", comment: "最近操作人名称" })
  lastOperatorName: string;
}
```

- [ ] **Step 4: Create execution log entity**

Create `log.entity.ts`:

```ts
import { Column } from "typeorm";
import { BaseColumn, BaseEntity, MyEntity } from "src/common/entity/BaseEntity";

@MyEntity("system_job_execution_log")
export class SystemScheduledJobExecutionLog extends BaseEntity {
  constructor(obj = {}) {
    super();
    this.assignOwn(obj);
  }

  @BaseColumn({ name: "job_key", comment: "任务编码" })
  jobKey: string;

  @BaseColumn({ name: "job_name", comment: "任务名称" })
  jobName: string;

  @BaseColumn({ name: "job_type", comment: "任务类型" })
  jobType: string;

  @BaseColumn({ comment: "所属模块" })
  module: string;

  @BaseColumn({ name: "trigger_mode", comment: "触发方式" })
  triggerMode: string;

  @BaseColumn({ nullable: true, name: "business_type", comment: "业务类型" })
  businessType: string;

  @BaseColumn({ nullable: true, name: "business_id", comment: "业务ID" })
  businessId: string;

  @BaseColumn({ nullable: true, name: "start_time", comment: "开始时间" })
  startTime: string;

  @BaseColumn({ nullable: true, name: "end_time", comment: "结束时间" })
  endTime: string;

  @BaseColumn({ type: "int", default: 0, name: "duration_ms", comment: "耗时毫秒" })
  durationMs: number;

  @BaseColumn({ default: "running", comment: "执行状态" })
  status: string;

  @BaseColumn({ nullable: true, comment: "结果摘要" })
  summary: string;

  @BaseColumn({ type: "int", default: 0, name: "processed_count", comment: "处理数量" })
  processedCount: number;

  @BaseColumn({ type: "int", default: 0, name: "success_count", comment: "成功数量" })
  successCount: number;

  @BaseColumn({ type: "int", default: 0, name: "failed_count", comment: "失败数量" })
  failedCount: number;

  @BaseColumn({ type: "longtext", nullable: true, name: "error_message", comment: "错误摘要" })
  errorMessage: string;

  @BaseColumn({ type: "longtext", nullable: true, name: "error_stack", comment: "错误堆栈" })
  errorStack: string;

  @Column({ type: "json", nullable: true, comment: "执行上下文" })
  payload: Record<string, unknown>;

  @BaseColumn({ nullable: true, name: "operator_id", comment: "操作人ID" })
  operatorId: string;

  @BaseColumn({ nullable: true, name: "operator_name", comment: "操作人名称" })
  operatorName: string;
}
```

- [ ] **Step 5: Run test to verify it passes**

Run the same Jest command and expect PASS.

---

### Task 3: Add Backend Job Center Service And APIs

**Files:**
- Create: `nest-admin/src/modules/systemScheduledJobs/service.ts`
- Create: `nest-admin/src/modules/systemScheduledJobs/controller.ts`
- Create: `nest-admin/src/modules/systemScheduledJobs/module.ts`
- Modify: `nest-admin/src/app.module.ts`
- Create/Modify: `nest-admin/src/modules/systemScheduledJobs/service.spec.ts`

- [ ] **Step 1: Write failing behavior tests**

Add tests:

```ts
import { SystemScheduledJobsService } from "./service";

describe("SystemScheduledJobsService", () => {
  function createService() {
    const configRepository = {
      find: jest.fn().mockResolvedValue([]),
      findOne: jest.fn().mockResolvedValue(null),
      save: jest.fn().mockImplementation(async (value) => value),
    };
    const logRepository = {
      find: jest.fn().mockResolvedValue([]),
      save: jest.fn().mockImplementation(async (value) => value),
    };
    const service = new SystemScheduledJobsService(configRepository as never, logRepository as never);
    return { service, configRepository, logRepository };
  }

  it("合并注册表和配置生成任务清单", async () => {
    const { service, configRepository } = createService();
    configRepository.find.mockResolvedValue([{ jobKey: "tasks.dueSoonReminder", enabled: "0" }]);

    const result = await service.listJobs();

    expect(result.some((item) => item.jobKey === "tasks.dueSoonReminder" && item.enabled === "0")).toBe(true);
  });

  it("启用与停用任务会保存配置状态", async () => {
    const { service, configRepository } = createService();

    await service.setJobEnabled("tasks.dueSoonReminder", "0", { id: "u1", name: "管理员" } as never);

    expect(configRepository.save).toHaveBeenCalledWith(expect.objectContaining({
      jobKey: "tasks.dueSoonReminder",
      enabled: "0",
    }));
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run:

```bash
npm test -- --runInBand src/modules/systemScheduledJobs/service.spec.ts
```

Expected: FAIL because module files do not exist.

- [ ] **Step 3: Implement backend job center service**

Create `service.ts`:

```ts
import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { scheduledJobRegistry } from "src/common/scheduler/job-registry";
import { SystemScheduledJobConfig } from "./entity";
import { SystemScheduledJobExecutionLog } from "./log.entity";

@Injectable()
export class SystemScheduledJobsService {
  constructor(
    @InjectRepository(SystemScheduledJobConfig)
    private configRepository: Repository<SystemScheduledJobConfig>,
    @InjectRepository(SystemScheduledJobExecutionLog)
    private logRepository: Repository<SystemScheduledJobExecutionLog>,
  ) {}

  async listJobs() { ... }
  async listLogs(query?: { jobKey?: string; module?: string; status?: string }) { ... }
  async setJobEnabled(jobKey: string, enabled: string, operator: { id?: string; name?: string }) { ... }
}
```

Implementation details:

- `listJobs()` merges static registry with config rows.
- Default `enabled = "1"` when no config exists.
- Include `lastRunTime/lastStatus` from latest log row.

- [ ] **Step 4: Implement controller and module**

Create `controller.ts`:

```ts
import { Body, Controller, Get, Param, Post, Query, Req } from "@nestjs/common";
import { SystemScheduledJobsService } from "./service";

@Controller("system/scheduled-jobs")
export class SystemScheduledJobsController {
  constructor(private readonly service: SystemScheduledJobsService) {}

  @Get("list")
  list(@Query() query: any) {
    return this.service.listJobs();
  }

  @Get("logs")
  logs(@Query() query: any) {
    return this.service.listLogs(query);
  }

  @Post("enable/:jobKey")
  enable(@Param("jobKey") jobKey: string, @Req() req: any) {
    return this.service.setJobEnabled(jobKey, "1", req.user);
  }

  @Post("disable/:jobKey")
  disable(@Param("jobKey") jobKey: string, @Req() req: any) {
    return this.service.setJobEnabled(jobKey, "0", req.user);
  }
}
```

Create `module.ts` and import it in `app.module.ts`.

- [ ] **Step 5: Run backend tests**

```bash
npm test -- --runInBand src/modules/systemScheduledJobs/service.spec.ts
```

Expected: PASS.

---

### Task 4: Add Execution Wrapper And Wire Existing Cron Jobs

**Files:**
- Modify: `nest-admin/src/modules/systemScheduledJobs/service.ts`
- Modify: `nest-admin/src/modulesBusi/tasks/service.ts`
- Modify: `nest-admin/src/modulesBusi/projects/service.ts`
- Modify: `nest-admin/src/modules/sys/file/service.ts`
- Modify: `nest-admin/src/modulesBusi/articleBorrows/service.ts`
- Modify: `nest-admin/src/modules/systemScheduledJobs/service.spec.ts`

- [ ] **Step 1: Write failing wrapper test**

Add to `service.spec.ts`:

```ts
it("统一执行包装器写入 running 和 success 日志", async () => {
  const { service, logRepository } = createService();

  await service.runJob(
    "tasks.dueSoonReminder",
    "manual",
    async () => ({ summary: "ok", processedCount: 3, successCount: 3, failedCount: 0 }),
  );

  expect(logRepository.save).toHaveBeenCalledWith(expect.objectContaining({
    jobKey: "tasks.dueSoonReminder",
    triggerMode: "manual",
    status: "running",
  }));
  expect(logRepository.save).toHaveBeenCalledWith(expect.objectContaining({
    jobKey: "tasks.dueSoonReminder",
    status: "success",
    processedCount: 3,
  }));
});
```

- [ ] **Step 2: Run test to verify it fails**

Run the same Jest command and expect FAIL.

- [ ] **Step 3: Implement `runJob` wrapper**

Add to `SystemScheduledJobsService`:

```ts
async runJob(jobKey: string, triggerMode: string, handler: () => Promise<{ summary?: string; processedCount?: number; successCount?: number; failedCount?: number; payload?: Record<string, unknown> }>) {
  const jobMeta = scheduledJobRegistry.find((item) => item.jobKey === jobKey);
  if (!jobMeta) throw new NotFoundException(`定时任务不存在：${jobKey}`);
  const startTime = new Date();
  await this.logRepository.save(new SystemScheduledJobExecutionLog({
    jobKey,
    jobName: jobMeta.jobName,
    jobType: jobMeta.jobType,
    module: jobMeta.module,
    triggerMode,
    startTime: startTime.toISOString(),
    status: "running",
  }));
  try {
    const result = await handler();
    return this.logRepository.save(new SystemScheduledJobExecutionLog({
      jobKey,
      jobName: jobMeta.jobName,
      jobType: jobMeta.jobType,
      module: jobMeta.module,
      triggerMode,
      startTime: startTime.toISOString(),
      endTime: new Date().toISOString(),
      durationMs: Date.now() - startTime.getTime(),
      status: "success",
      summary: result.summary || "执行成功",
      processedCount: Number(result.processedCount || 0),
      successCount: Number(result.successCount || 0),
      failedCount: Number(result.failedCount || 0),
      payload: result.payload || {},
    }));
  } catch (error) {
    await this.logRepository.save(new SystemScheduledJobExecutionLog({
      jobKey,
      jobName: jobMeta.jobName,
      jobType: jobMeta.jobType,
      module: jobMeta.module,
      triggerMode,
      startTime: startTime.toISOString(),
      endTime: new Date().toISOString(),
      durationMs: Date.now() - startTime.getTime(),
      status: "failed",
      summary: "执行失败",
      errorMessage: error?.message || "执行失败",
      errorStack: error?.stack || "",
    }));
    throw error;
  }
}
```

- [ ] **Step 4: Add enable-check helper**

Add to `SystemScheduledJobsService`:

```ts
async isJobEnabled(jobKey: string) {
  const row = await this.configRepository.findOne({ where: { jobKey } as any });
  return String(row?.enabled || "1") === "1";
}
```

- [ ] **Step 5: Wire existing cron tasks through wrapper**

Modify these services so each cron method:

1. checks `isJobEnabled(jobKey)`
2. returns early when disabled
3. wraps actual work with `runJob(jobKey, "scheduled", handler)`

Target methods:

- `TasksService.scheduledTaskDueSoonReminder` -> `tasks.dueSoonReminder`
- `TasksService.scheduledTaskOverdueReminder` -> `tasks.overdueReminder`
- `TasksService.scheduledTaskReportReminder` -> `tasks.reportStaleReminder`
- `ProjectsService.generateDailyCockpitSnapshots` -> `projects.dailyCockpitSnapshots`
- `SysFileService.scheduledCleanup` -> `sysFile.orphanCleanup`
- `ArticleBorrowsService.syncExpiredBorrows` -> `articleBorrows.syncExpired`

The wrapped handlers should return minimal summary/count payloads.

- [ ] **Step 6: Run backend tests**

```bash
npm test -- --runInBand src/modules/systemScheduledJobs/service.spec.ts src/modulesBusi/tasks/service.spec.ts
```

Expected: PASS.

---

### Task 5: Add Manual Run API And Frontend Page

**Files:**
- Modify: `nest-admin/src/modules/systemScheduledJobs/service.ts`
- Modify: `nest-admin/src/modules/systemScheduledJobs/controller.ts`
- Create: `nest-admin-frontend/src/views/systemMonitor/scheduledJobs/api.ts`
- Create: `nest-admin-frontend/src/views/systemMonitor/scheduledJobs/index.vue`
- Create: `nest-admin-frontend/src/views/systemMonitor/scheduledJobs/index.structure.spec.ts`

- [ ] **Step 1: Write failing frontend structure test**

Create `index.structure.spec.ts`:

```ts
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

function readSource() {
  return readFileSync(resolve(__dirname, 'index.vue'), 'utf-8')
}

describe('scheduled jobs structure', () => {
  it('页面展示任务清单、运行日志和手工执行入口', () => {
    const source = readSource()

    expect(source).toContain('定时任务管理')
    expect(source).toContain('运行日志')
    expect(source).toContain('立即执行')
    expect(source).toContain('启用')
    expect(source).toContain('停用')
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npx vitest run src/views/systemMonitor/scheduledJobs/index.structure.spec.ts
```

Expected: FAIL because page does not exist.

- [ ] **Step 3: Add manual run service method**

In backend `service.ts`, add:

```ts
async runJobManually(jobKey: string, operator: { id?: string; name?: string }) {
  const handlers = {
    "tasks.dueSoonReminder": async () => ({ summary: "手工执行任务即将到期提醒", ...(await this.taskService.scanDueSoonTaskReminders()) }),
    "tasks.overdueReminder": async () => ({ summary: "手工执行任务逾期提醒", ...(await this.taskService.scanOverdueTaskReminders()) }),
    "tasks.reportStaleReminder": async () => ({ summary: "手工执行任务未汇报提醒", ...(await this.taskService.scanStaleReportTaskReminders()) }),
    "projects.dailyCockpitSnapshots": async () => this.projectsService.generateCockpitSnapshots(),
    "sysFile.orphanCleanup": async () => this.sysFileService.cleanupOrphanFiles(24),
    "articleBorrows.syncExpired": async () => ({ processedCount: await this.articleBorrowsService.syncExpiredBorrows() }),
  };
  const handler = handlers[jobKey];
  if (!handler) throw new NotFoundException(`未支持手工执行：${jobKey}`);
  return this.runJob(jobKey, "manual", handler);
}
```

If direct service injection is too coupled, adapt by passing callback registry into the service from module wiring.

- [ ] **Step 4: Add backend run endpoint**

Update controller:

```ts
@Post("run/:jobKey")
run(@Param("jobKey") jobKey: string, @Req() req: any) {
  return this.service.runJobManually(jobKey, req.user);
}
```

- [ ] **Step 5: Create frontend page**

Create `api.ts`:

```ts
import request from '@/utils/request'

const baseUrl = '/system/scheduled-jobs'

export const getScheduledJobs = () => request({ url: `${baseUrl}/list`, method: 'get' })
export const getScheduledJobLogs = (params) => request({ url: `${baseUrl}/logs`, method: 'get', params })
export const runScheduledJob = (jobKey) => request({ url: `${baseUrl}/run/${jobKey}`, method: 'post' })
export const enableScheduledJob = (jobKey) => request({ url: `${baseUrl}/enable/${jobKey}`, method: 'post' })
export const disableScheduledJob = (jobKey) => request({ url: `${baseUrl}/disable/${jobKey}`, method: 'post' })
```

Create `index.vue` with two sections:

- 上半区任务清单表格
- 下半区运行日志表格

Minimum requirements:

```vue
<template>
  <div class="scheduled-jobs-page">
    <div class="Gcard scheduled-jobs-panel">
      <div class="scheduled-jobs-panel__title">定时任务管理</div>
      <el-table :data="jobs">
        <el-table-column prop="jobName" label="任务名称" />
        <el-table-column prop="jobKey" label="任务编码" />
        <el-table-column prop="module" label="模块" />
        <el-table-column prop="scheduleExpression" label="Cron 表达式" />
        <el-table-column prop="enabled" label="启用状态" />
        <el-table-column label="操作">
          <template #default="{ row }">
            <el-button link type="primary" @click="runJob(row)">立即执行</el-button>
            <el-button link type="success" @click="enableJob(row)">启用</el-button>
            <el-button link type="danger" @click="disableJob(row)">停用</el-button>
          </template>
        </el-table-column>
      </el-table>
    </div>

    <div class="Gcard scheduled-jobs-panel">
      <div class="scheduled-jobs-panel__title">运行日志</div>
      <el-table :data="logs">
        <el-table-column prop="jobName" label="任务名称" />
        <el-table-column prop="triggerMode" label="触发方式" />
        <el-table-column prop="status" label="执行状态" />
        <el-table-column prop="startTime" label="开始时间" />
        <el-table-column prop="summary" label="结果摘要" />
      </el-table>
    </div>
  </div>
</template>
```

- [ ] **Step 6: Run frontend structure test**

```bash
npx vitest run src/views/systemMonitor/scheduledJobs/index.structure.spec.ts
```

Expected: PASS.

---

### Task 6: Full Verification

**Files:** all modified files above.

- [ ] **Step 1: Run backend targeted tests**

```bash
npm test -- --runInBand src/modules/systemScheduledJobs/service.spec.ts src/modulesBusi/tasks/service.spec.ts
```

Expected: PASS.

- [ ] **Step 2: Run frontend targeted tests**

```bash
npx vitest run src/views/systemMonitor/scheduledJobs/index.structure.spec.ts
```

Expected: PASS.

- [ ] **Step 3: Run frontend type check**

```bash
npm run type-check
```

Expected: PASS.

- [ ] **Step 4: Run backend lint**

```bash
npm run lint
```

Expected: PASS.

---

## Self-Review

Spec coverage:

- Static cron registry: Task 1.
- Job config and execution log models: Task 2.
- Backend APIs for list/logs/run/enable/disable: Tasks 3 and 5.
- Execution wrapper and cron wiring: Task 4.
- Frontend job center page: Task 5.
- Cron-only phase boundary preserved: no timeout instance work appears.

Placeholder scan:

- No placeholders or undefined file paths remain.

Type consistency:

- Registry item names, job keys, config entity, and execution log entity are consistent across tasks.
- Phase 1 remains cron-only throughout the plan.
