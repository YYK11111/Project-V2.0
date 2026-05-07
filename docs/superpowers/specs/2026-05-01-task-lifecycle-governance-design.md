# Task Lifecycle Governance Design

## Goal

梳理任务管理从创建、开始、延期、评论、汇报到完成审批的完整业务闭环，统一任务状态、角色职责、时间字段系统赋值、前置任务约束和任务提醒规则。

## Current Context

- 当前任务模块已有主状态：`待处理 / 处理中 / 已完成 / 已驳回 / 暂缓`。
- 当前任务表单已具备负责人、经办人、评论、汇报、依赖、审批、时间字段等能力。
- 当前后端权限主要围绕负责人和创建人，经办人尚未完整纳入执行权限体系。
- 当前任务提醒尚未形成系统级闭环。

## Role Definition

### 责任人

责任人是任务的第一责任人，不一定是唯一执行人。

职责：

- 对任务最终结果负责。
- 决定是否开始任务。
- 推进任务状态流转。
- 发起完成审批。
- 发起延期。
- 协调经办人与执行资源。

### 经办人

经办人是任务的实际执行人，可多人。

职责：

- 实际执行任务。
- 填写任务汇报。
- 发表评论。
- 协同推进任务进度。

### 创建人

创建人是任务发起者，不等于责任人。

职责：

- 发起任务。
- 创建时填写任务基础信息。
- 默认拥有查看权限。

### 项目管理角色

包括项目经理、交付经理、职能负责人等。

职责：

- 干预全部任务管理动作。
- 强制调整负责人、经办人、依赖和延期。
- 介入审批与提醒治理。

## Status Model

### 主状态

建议统一为：

1. `待处理`
2. `处理中`
3. `待完成审批`
4. `已完成`
5. `暂缓`

`已驳回` 不再作为主状态，而是审批状态的一种结果。

### 审批状态

单独维护：

1. `无需审批`
2. `审批中`
3. `已通过`
4. `已驳回`

主状态描述执行阶段，审批状态描述审批阶段，两条轴分离。

## Lifecycle

### 创建任务

创建时：

- 主状态：`待处理`
- 审批状态：`无需审批`
- 负责人默认当前用户。
- 允许配置经办人和前置任务。

### 开始任务

动作：`开始任务`

触发条件：

- 主状态为 `待处理`。
- 当前用户是责任人或经办人。
- 前置任务已满足开始条件。
- 不处于审批只读态。

执行结果：

- 主状态变为 `处理中`。
- 若 `actualStartDate` 为空，系统写入当天日期。
- 评论开放。
- 汇报开放。
- 发送开始提醒。

### 暂缓任务

动作：`暂缓任务`

触发条件：

- 主状态为 `处理中`。
- 当前用户是责任人或项目管理角色。

执行结果：

- 主状态变为 `暂缓`。

### 恢复任务

动作：`恢复任务`

触发条件：

- 主状态为 `暂缓`。
- 当前用户是责任人或项目管理角色。

执行结果：

- 主状态变为 `处理中`。

### 提交完成审批

动作：`提交完成审批`

触发条件：

- 主状态为 `处理中`。
- 当前用户是责任人。
- 任务满足完成前置条件。
- 当前不处于审批中。

执行结果：

- 主状态变为 `待完成审批`。
- 审批状态变为 `审批中`。
- 发起工作流实例。
- 不写入 `actualEndDate`。

### 完成审批通过

系统动作：

- 主状态变为 `已完成`。
- 审批状态变为 `已通过`。
- 若 `actualEndDate` 为空，写入当天日期。
- 若 `progress < 100`，自动补为 `100`。

### 完成审批驳回

系统动作：

- 主状态回退为 `处理中`。
- 审批状态变为 `已驳回`。
- 保留驳回意见。
- 不清空 `actualStartDate`。

## Comment And Report Rules

### 评论

可见：

- 所有具备任务查看权限的用户。

可新增：

- 主状态属于 `处理中 / 待完成审批 / 暂缓 / 已完成`。

不可新增：

- 主状态为 `待处理`。

### 汇报

可见：

- 所有具备任务查看权限的用户。

可新增：

- 主状态属于 `处理中 / 待完成审批 / 暂缓`。

不可新增：

- 主状态为 `待处理 / 已完成`。

可编辑/删除：

- 仅本人汇报记录。

## Dependency Rules

### 新建页展示前置任务

新建任务时直接展示前置任务区块，支持：

- 选择前置任务。
- 查看已选前置任务。
- 删除已选前置任务。
- 展示每个前置任务当前状态与是否已完成。

### 选择限制

- 只能选择同项目任务。
- 不能选择自己。
- 不能形成循环依赖。
- 支持多个前置任务。

### 开始任务前校验

若存在未完成前置任务：

- 不允许开始任务。
- 提示：`存在未完成前置任务，暂不能开始`。

## Delay Design

### 延期定义

延期不是主状态，而是一种正式变更行为。

### 延期动作

动作：`延期任务`

### 可延期状态

- `待处理`
- `处理中`
- `待完成审批`
- `暂缓`

### 不可延期状态

- `已完成`

### 延期输入

必须记录：

- 原截止时间
- 新截止时间
- 延期原因

### 延期结果

- 更新 `endDate`。
- 若任务未开始，则同步 `plannedEndDate`。
- 若任务已开始，则冻结原 `plannedEndDate`。
- 写入延期记录。

### 延期记录字段

- `taskId`
- `beforeEndDate`
- `afterEndDate`
- `reason`
- `operatorId`
- `operatorName`
- `createTime`

### 审批中延期规则

推荐：

- `待完成审批` 阶段不直接延期。
- 若确需延期，应先驳回回到 `处理中`，再执行延期，再重新提交完成审批。

## Time Field Auto Assignment

前端只维护主时间：

- `开始时间`
- `截止时间`

后端自动维护：

- `plannedStartDate`
- `plannedEndDate`
- `actualStartDate`
- `actualEndDate`

### 创建任务

- `plannedStartDate = startDate`
- `plannedEndDate = endDate`
- `actualStartDate = null`
- `actualEndDate = null`

### 开始任务

- 若 `actualStartDate` 为空，写入当天日期。

### 提交完成审批

- 不写入 `actualEndDate`。

### 审批通过

- 若 `actualEndDate` 为空，写入当天日期。

### 审批驳回

- 不清空 `actualStartDate`。
- 不写入 `actualEndDate`。

### 编辑主时间

- 若任务未开始，`plannedStartDate / plannedEndDate` 跟随主时间变更。
- 若任务已开始，计划时间冻结。
- 若任务已完成，实际时间冻结。

## Reminder Design

### 渠道策略

本次任务提醒采用：

- 主渠道：`messageCenter`
- 预留渠道：`sms`、`email`

本次只真实写入站内消息中心，不落地短信/邮件发送。

### 接入方式

任务模块采用 `TasksService` 直接接 `MessagesService` 的方式发送任务业务通知，保持和项目提醒、工作流消息的现有集成模式一致。

任务内部统一提醒载荷结构建议为：

```ts
type TaskReminderPayload = {
  taskId: string;
  receiverId: string;
  type:
    | "taskAssigned"
    | "taskStarted"
    | "taskReadyToStart"
    | "taskDueSoon"
    | "taskOverdue"
    | "taskReportStale"
    | "taskCompletionApprovalSubmitted"
    | "taskCompletionApproved"
    | "taskCompletionRejected"
    | "taskDelayed";
  title: string;
  content: string;
  channels?: Array<"messageCenter" | "sms" | "email">;
  extraData?: Record<string, unknown>;
};
```

默认 `channels = ["messageCenter"]`。

### 与工作流消息职责边界

为避免重复提醒，职责边界统一为：

- **任务模块负责**：
  - 任务分派提醒
  - 可开始提醒
  - 开始提醒
  - 延期提醒
  - 审批通过后的业务通知
  - 审批驳回后的业务通知
- **工作流模块负责**：
  - 审批待办提醒
  - 抄送提醒
  - 退回处理提醒

因此，`提交完成审批` 本身不额外重复发送审批待办，待办仍由现有 workflow 模块投递到消息中心。

### 消息类型映射

建议复用现有消息中心的 `messageType`：

- `todo`
  - `taskAssigned`
  - `taskReadyToStart`
  - `taskCompletionRejected`
  - `taskOverdue`
  - `taskReportStale`
- `cc`
  - `taskStarted`
  - `taskCompletionApproved`
  - `taskDelayed`

### 消息跳转与扩展数据

任务提醒统一跳转到任务详情页：

- `linkUrl = /taskManage/form?id={taskId}&action=view`

建议统一写入：

```json
{
  "businessType": "task",
  "businessId": "taskId",
  "taskId": "taskId",
  "projectId": "projectId",
  "status": "taskStatus",
  "approvalStatus": "approvalStatus",
  "reminderType": "taskAssigned"
}
```

前端消息中心后续可基于 `reminderType` 做任务消息增强展示，但本次不要求改版消息中心页面。

### 创建提醒

触发时机：

- 新建任务成功。

提醒对象：

- 责任人
- 经办人

消息类型：

- `taskAssigned`

### 开始提醒

触发时机：

- 点击开始任务。

提醒对象：

- 责任人
- 经办人
- 可选创建人

消息类型：

- `taskStarted`

### 可开始提醒

触发时机：

- 前置任务完成，当前任务由不可开始变为可开始。

提醒对象：

- 责任人
- 经办人

消息类型：

- `taskReadyToStart`

### 截止提醒

触发时机：

- 距截止 3 天
- 距截止 1 天
- 已逾期

提醒对象：

- 责任人必提醒
- 经办人建议提醒

### 未汇报提醒

触发条件：

- 主状态为 `处理中 / 待完成审批 / 暂缓`
- 最近 N 天未汇报

提醒对象：

- 经办人优先
- 责任人同步

### 完成审批提醒

提交完成审批后：

- 审批待办提醒由 workflow 模块负责，不在 task 模块重复发送

审批通过后：

- 提醒责任人
- 提醒经办人
- 可选提醒创建人

消息类型：

- `taskCompletionApproved`

审批驳回后：

- 提醒责任人
- 可选提醒经办人

消息类型：

- `taskCompletionRejected`

### 延期提醒

触发时机：

- 延期成功

提醒对象：

- 责任人
- 经办人
- 创建人
- 若有延期审批，提醒审批人

消息类型：

- `taskDelayed`

### 本期与下期边界

本期真实落地：

- 创建提醒
- 开始提醒
- 可开始提醒
- 审批通过通知
- 审批驳回通知
- 延期通知

本期不落地，仅保留设计：

- 短信发送
- 邮件发送
- 消息中心任务消息专属 UI 改版

## Scheduled Reminder Design

### 提醒类型

新增三类定时扫描提醒：

1. `taskDueSoon`
2. `taskOverdue`
3. `taskReportStale`

### 适用状态

适用于：

- `待处理`
- `处理中`
- `待完成审批`
- `暂缓`

不适用于：

- `已完成`

### 触发规则

#### 即将到期提醒

触发条件：

- `endDate - today <= 3 天`
- 且 `endDate >= today`

提醒对象：

- 责任人
- 经办人

消息类型：

- `cc`

#### 已逾期提醒

触发条件：

- `today > endDate`
- 且状态不为 `已完成`

提醒对象：

- 责任人必提醒
- 经办人建议提醒

消息类型：

- `todo`

#### 未汇报提醒

触发条件：

- 状态属于 `处理中 / 待完成审批 / 暂缓`
- 最近 N 天没有新增任务汇报

提醒对象：

- 经办人优先
- 责任人同步

消息类型：

- `todo`

### 频控策略

采用保守频控：

- 即将到期：每天最多 1 次
- 已逾期：每天最多 1 次
- 未汇报：每 2 天最多 1 次

同一任务、同一接收人、同一提醒类型，在对应频控窗口内去重。

### 去重实现建议

优先复用 `messages` 表，不额外新增提醒历史表。

去重维度：

- `sourceType = "task_reminder"`
- `sourceId = taskId`
- `receiverId`
- `extraData.reminderType`

时间窗口：

- `taskDueSoon`：当天去重
- `taskOverdue`：当天去重
- `taskReportStale`：2 天内去重

### 调度方式

推荐通过后端定时任务机制每日固定扫描：

- `09:00` 扫描即将到期
- `09:05` 扫描已逾期
- `09:10` 扫描未汇报

不建议高频扫描，避免消息噪音。

### 与消息中心的关系

定时提醒仍只写入消息中心：

- 渠道：`messageCenter`
- 继续预留：`sms / email`

消息跳转：

- `/taskManage/form?id={taskId}&action=view`

扩展数据：

```json
{
  "businessType": "task",
  "businessId": "taskId",
  "taskId": "taskId",
  "projectId": "projectId",
  "status": "taskStatus",
  "approvalStatus": "approvalStatus",
  "reminderType": "taskDueSoon"
}
```

### 分期建议

下期推荐优先级：

1. `taskOverdue`
2. `taskReportStale`
3. `taskDueSoon`

若一次性落地也可，但实现时建议保持扫描器解耦为三个独立方法。

## Frontend Display Suggestions

### 新建页显示

- 任务名称
- 所属项目
- 父任务
- 所属 Sprint
- 所属里程碑
- 负责人
- 经办人
- 开始时间
- 截止时间
- 优先级
- 来源对象
- 前置任务
- 任务描述
- 验收标准
- 附件

### 新建页隐藏

- 任务编号
- 状态
- 计划开始
- 计划结束
- 实际开始
- 实际结束
- 进度
- 实际工时
- 剩余工时
- 评论
- 汇报
- 审批信息

### 编辑/详情页显示

- 状态
- 审批状态
- 计划开始/结束
- 实际开始/结束
- 进度
- 汇报区
- 评论区
- 延期记录
- 前置任务执行状态

## Action Area Suggestions

### 待处理

- `开始任务`
- `延期任务`
- `编辑任务`

### 处理中

- `暂缓任务`
- `提交完成审批`
- `延期任务`
- `新增汇报`
- `发表评论`

### 待完成审批

- `查看审批进度`
- `新增汇报`
- `发表评论`

### 暂缓

- `恢复任务`
- `延期任务`
- `新增汇报`
- `发表评论`

### 已完成

- `查看历史汇报`
- `发表评论`

### 审批驳回后的处理中

- `重新提交完成审批`
- `延期任务`
- `新增汇报`
- `发表评论`

## Current Gaps To Fix

### 1. 经办人纳入权限模型

当前后端权限主要围绕负责人和创建人，经办人尚未完整纳入执行权限体系。至少需要补入：

- 开始任务权限
- 评论权限
- 汇报权限
- 列表可见与动作权限

### 2. 主状态与审批状态解耦

当前 `已驳回` 混在主状态中会导致业务语义混乱，应拆分成主状态与审批状态两条轴。

### 3. 延期记录模型

不能只改截止时间，必须补延期历史记录。

### 4. 前置任务从展示型升级为约束型

前置任务不仅要展示，还要直接参与：

- 是否可开始
- 提醒触发
- 新建页提示

### 5. 任务提醒闭环

提醒需要和角色、状态、前置任务、汇报时效保持一致。
