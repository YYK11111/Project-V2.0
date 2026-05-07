# Scheduled Job Center Design

## Goal

为系统现有的 cron 定时任务建立统一管理中心，集中展示任务清单、执行状态与运行日志，并为后续纳管 timeout 类型任务预留模型空间。

## Current Context

- 当前系统已经存在多类 `@Cron(...)` 定时任务：
  - 任务提醒扫描：`tasks/service.ts`
  - 项目驾驶舱快照：`projects/service.ts`
  - 文件孤儿清理：`sys/file/service.ts`
  - 借阅过期同步：`articleBorrows/service.ts`
- 当前系统也存在 `SchedulerRegistry.addTimeout(...)` 的一次性延迟任务能力：
  - 文章借阅到期自动过期
  - 文章定时发布等
- 现有 cron 任务没有统一清单，也没有统一执行日志落库，大多仅依赖 `console.log` 或局部业务代码。

## Phase Scope

### 第一期范围

第一期只纳管 `cron` 任务，不纳管 `timeout` 实例。

原因：

- `cron` 任务是系统级固定任务，最适合先做统一管理。
- `timeout` 属于运行时动态实例，适合作为第二期扩展。
- 先做 cron 可快速建立统一可视化、日志、启停和手工执行能力。

### 第二期预留

第二期再纳入：

- timeout 实例列表
- timeout 实例执行状态
- timeout 与业务对象的追踪关系

## Unified Job Catalog Model

建议建立统一任务清单模型，用于描述系统中所有可被调度的任务。

### 核心字段

- `jobKey`
  - 全局唯一编码
  - 例：`tasks.dueSoonReminder`
- `jobName`
  - 中文显示名
- `jobType`
  - `cron` / `timeout`
- `module`
  - 所属模块，如 `tasks`、`projects`
- `description`
  - 任务说明
- `scheduleExpression`
  - cron 表达式，cron 任务使用
- `enabled`
  - 是否启用
- `supportsManualRun`
  - 是否支持“立即执行一次”
- `sourceMode`
  - `static` / `dynamic`
- `owner`
  - 责任服务或模块名
- `nextRunTime`
  - 下次预计执行时间
- `lastRunTime`
  - 最近执行时间
- `lastStatus`
  - 最近执行状态：`idle / running / success / failed`
- `remarks`
  - 备注

### 模型说明

- 第一期主用于 `cron`，因此 `sourceMode` 基本是 `static`。
- 第二期纳入 `timeout` 后，`sourceMode = dynamic` 的实例可以复用同一模型展示。

## Catalog Source Strategy

不建议第一期就把所有任务主数据完全落库，而是采用“代码注册 + 运行时计算”的混合方式。

### A. 代码注册清单

新增一个统一注册表文件，例如：

- `nest-admin/src/common/scheduler/job-registry.ts`

其中声明所有固定 cron 任务元数据：

```ts
export const jobRegistry = [
  {
    jobKey: "tasks.dueSoonReminder",
    jobName: "任务即将到期提醒扫描",
    jobType: "cron",
    module: "tasks",
    scheduleExpression: "0 0 9 * * *",
    supportsManualRun: true,
    sourceMode: "static",
    owner: "TasksService",
  },
];
```

### B. 运行时状态补全

列表接口读取注册表后，再补充：

- `enabled`
- `nextRunTime`
- `lastRunTime`
- `lastStatus`

这些信息来自：

- 任务配置表（启停开关）
- 执行日志表（最近一次执行）
- cron 表达式计算（下次运行）

## Execution Log Model

建议新增统一执行日志表，例如：

- `system_job_execution_log`

### 核心字段

- `id`
- `jobKey`
- `jobName`
- `jobType`
- `module`
- `triggerMode`
  - `scheduled / manual / system-retry`
- `businessType`
  - 第二期 timeout 预留
- `businessId`
  - 第二期 timeout 预留
- `startTime`
- `endTime`
- `durationMs`
- `status`
  - `running / success / failed / cancelled`
- `summary`
  - 简要结果摘要
- `processedCount`
- `successCount`
- `failedCount`
- `errorMessage`
- `errorStack`
- `payload`
  - 执行上下文
- `operatorId`
  - 手工执行时记录
- `operatorName`

## Logging Strategy

### 粒度

第一期采用**任务级日志**，不做对象级/消息级细粒度日志。

示例：

- `任务即将到期提醒扫描`
  - `processedCount = 26`
  - `successCount = 4`
  - `failedCount = 1`

### 失败策略

若任务内部出现部分对象处理失败：

- 第一期仍按 `failed` 处理整次执行
- 在 `summary` 或 `payload` 中保留失败明细

这样实现最简单，后续如有需要再细化为 `partial_success`。

## Scheduler Execution Wrapper

建议所有 cron 任务通过统一包装器执行，而不是每个任务自己打印日志。

新增统一服务，例如：

- `ScheduledJobExecutionService`

提供能力：

- `runJob(jobKey, triggerMode, handler)`

内部负责：

1. 写入 `running` 日志
2. 执行 handler
3. 捕获结果并更新日志为 `success / failed`
4. 记录耗时与处理量

这样不同业务任务只需要返回结构化执行结果，例如：

```ts
return {
  summary: "扫描 26 个任务，发送 4 条提醒",
  processedCount: 26,
  successCount: 4,
  failedCount: 1,
};
```

## First-Phase Management Capabilities

第一期建议支持以下能力：

### 1. 定时任务列表

字段：

- 任务名称
- 任务编码
- 所属模块
- cron 表达式
- 是否启用
- 最近执行时间
- 最近执行状态
- 下次执行时间
- 最近执行摘要

### 2. 执行日志列表

支持筛选：

- 任务编码
- 所属模块
- 执行状态
- 触发方式
- 时间范围

### 3. 日志详情

展示：

- payload
- errorMessage
- errorStack
- 处理统计
- 失败摘要

### 4. 手工执行一次

仅对声明 `supportsManualRun = true` 的任务开放。

### 5. 启用 / 停用

第一期建议做数据库开关，不直接动态卸载装饰器任务。

执行方式：

- cron 方法仍然按时间触发
- 进入方法后先检查 `enabled`
- 若关闭则直接返回，不执行业务逻辑

这种方式改动最小且稳定。

## Job Config Model

为支持启停与展示，建议新增任务配置表，例如：

- `system_job_config`

字段：

- `jobKey`
- `enabled`
- `remarks`
- `lastOperatorId`
- `lastOperatorName`

第一期不建议把 cron 表达式改成数据库可编辑，避免让系统运维复杂化。

## API Suggestions

建议新增后台管理接口：

### 列表

- `GET /system/scheduled-jobs/list`

### 日志列表

- `GET /system/scheduled-jobs/logs`

### 立即执行

- `POST /system/scheduled-jobs/run/:jobKey`

### 启用 / 停用

- `POST /system/scheduled-jobs/enable/:jobKey`
- `POST /system/scheduled-jobs/disable/:jobKey`

## Frontend Page Suggestions

建议新增一个系统页，例如：

- `nest-admin-frontend/src/views/systemMonitor/scheduledJobs/index.vue`

页面结构：

### 上半区：任务清单

- 表格展示 cron 任务
- 支持筛选模块、启用状态
- 操作按钮：
  - 查看日志
  - 立即执行
  - 启用/停用

### 下半区：执行日志

- 表格展示最近日志
- 点击查看详情抽屉

## Second-Phase Timeout Expansion

第二期纳入 timeout 时，再新增：

### timeout 实例模型

- `jobType = timeout`
- `sourceMode = dynamic`
- `businessType`
- `businessId`
- `scheduledTime`
- `currentStatus`

### 第二期页面扩展

- 新增页签：`延迟任务实例`
- 展示业务对象对应的当前挂起任务

## Recommended First-Phase Scope

第一期只做：

1. cron 任务统一注册表
2. 任务配置表
3. 执行日志表
4. 统一执行包装器
5. 任务管理页面
6. 手工执行
7. 启用/停用

第一期不做：

1. timeout 实例纳管
2. timeout 手工重试
3. cron 表达式后台可编辑
4. 短信/邮件通知
5. 任务级细粒度对象日志

## Final Recommendation

### 统一任务清单模型

采用：

- `jobKey / jobName / jobType / module / description / scheduleExpression / enabled / supportsManualRun / sourceMode / owner / nextRunTime / lastRunTime / lastStatus / remarks`

### 执行日志模型

采用：

- 单独执行日志表
- 任务级执行粒度
- 统一包装器记录耗时、结果、处理统计和异常

### 第一期范围

仅纳管 `cron`，不纳管 `timeout`。

### 第二期范围

再纳入 timeout 任务实例视图与业务追踪。
