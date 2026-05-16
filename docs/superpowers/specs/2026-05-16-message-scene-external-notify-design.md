# 本站消息场景与外部通知配置设计

## 背景

当前本站消息统一写入 `sys_message`，基础类型只有 `todo` 和 `cc`。业务来源主要依赖 `sourceType` 和 `extraData` 区分。飞书外发目前硬编码为 `messageType=todo` 且 `sourceType=workflow_task`，等价于只发送流程审批待办。

这种做法短期可用，但不适合继续扩展。后续飞书、钉钉、企业微信都需要按业务语义配置，而不是让管理员理解底层字段。

## 目标

1. 梳理本站消息的业务场景。
2. 建立稳定的消息场景 key，作为外部通知配置的统一口径。
3. 飞书配置页按业务场景控制是否外发。
4. 保持本站消息仍然是主入口，外部消息不新增独立业务写入路径。
5. 为钉钉等后续平台复用同一套消息场景配置。

## 非目标

1. 不改变 `sys_message` 的基础 `todo/cc` 语义。
2. 不在第一期增加复杂的用户级订阅偏好。
3. 不要求所有本站消息立刻支持外发。
4. 不把业务场景配置成技术字段选择器。

## 当前消息清单

| 业务场景 | 当前字段 | 触发来源 | 当前飞书外发 |
| --- | --- | --- | --- |
| 流程审批待办 | `messageType=todo`, `sourceType=workflow_task` | 审批节点、加签等工作流任务 | 是 |
| 流程待阅通知 | `messageType=cc`, `sourceType=workflow_instance` | 抄送节点、通知节点、退回发起人 | 否 |
| 项目提醒 | `messageType=cc`, `sourceType=project_alert` | 项目驾驶舱异常提醒同步 | 否 |
| 任务指派 | `messageType=todo`, `sourceType=task`, `extraData.reminderType=taskAssigned` | 任务创建或分配 | 否 |
| 任务状态通知 | `messageType=cc/todo`, `sourceType=task`, `extraData.reminderType=taskStarted/taskDelayed/taskCompletionApproved/taskCompletionRejected` | 任务状态变化 | 否 |
| 任务即将到期 | `messageType=cc`, `sourceType=task_reminder`, `extraData.reminderType=taskDueSoon` | 定时任务扫描 | 否 |
| 任务已逾期 | `messageType=todo`, `sourceType=task_reminder`, `extraData.reminderType=taskOverdue` | 定时任务扫描 | 否 |
| 任务汇报提醒 | `messageType=todo`, `sourceType=task_reminder`, `extraData.reminderType=taskReportStale` | 定时任务扫描 | 否 |

## 消息场景注册表

新增统一的消息场景定义，建议放在后端消息模块下，例如 `src/modules/messages/message-scenes.ts`。

| 场景 key | 展示名称 | 分类 | 默认飞书 | 匹配条件 |
| --- | --- | --- | --- | --- |
| `workflow.approval.todo` | 流程审批待办 | 工作流 | 开 | `todo + workflow_task` |
| `workflow.instance.cc` | 流程待阅通知 | 工作流 | 关 | `cc + workflow_instance` |
| `project.alert` | 项目提醒 | 项目 | 关 | `cc + project_alert` |
| `task.assignment` | 任务指派 | 任务 | 关 | `task + taskAssigned` |
| `task.status` | 任务状态通知 | 任务 | 关 | `task + taskStarted/taskDelayed/taskCompletionApproved/taskCompletionRejected` |
| `task.reminder.dueSoon` | 任务即将到期 | 任务 | 关 | `task_reminder + taskDueSoon` |
| `task.reminder.overdue` | 任务已逾期 | 任务 | 关 | `task_reminder + taskOverdue` |
| `task.reminder.reportStale` | 任务汇报提醒 | 任务 | 关 | `task_reminder + taskReportStale` |

注册表需要提供两个能力：

1. `getMessageScene(message)`：根据消息内容解析出业务场景。
2. `listMessageScenes()`：给前端配置页展示可配置场景。

无法识别的消息返回空场景，不外发。

## 外部通知配置

在外部通知运行配置中增加场景开关，建议结构如下：

```json
{
  "externalNotify": {
    "enabled": true,
    "scenes": {
      "workflow.approval.todo": {
        "enabled": true,
        "platforms": {
          "feishu": true,
          "dingtalk": false
        }
      }
    }
  }
}
```

第一期可以只落飞书：

```json
{
  "feishu": {
    "enabled": true,
    "enabledScenes": ["workflow.approval.todo"]
  }
}
```

如果当前配置结构已经以平台为主，第一期采用平台内 `enabledScenes` 改动更小；但场景 key 需要保持平台无关，便于后续迁移到统一 `externalNotify.scenes`。

## 发送决策流程

`MessagesService.sendMessage()` 仍然是本站消息主入口。

外发流程调整为：

1. 写入本站消息。
2. 写入本站消息日志。
3. 解析消息业务场景。
4. 判断该场景是否启用飞书外发。
5. 判断平台总开关、机器人能力、用户外部账号映射是否满足。
6. 发送外部消息并记录外部通知日志。

第一期保留现有飞书卡片模板只服务 `workflow.approval.todo`。其他场景即使配置打开，也需要先有对应模板；没有模板时应该给出明确日志原因，而不是静默失败。

## 前端配置页

飞书配置区域增加“消息场景”配置块：

| 展示字段 | 说明 |
| --- | --- |
| 场景名称 | 例如“流程审批待办” |
| 分类 | 工作流、项目、任务 |
| 本站类型 | 待办/待阅 |
| 飞书发送 | 开关 |
| 模板状态 | 已支持/暂未支持 |
| 说明 | 简短说明触发来源 |

默认只打开“流程审批待办”。暂未支持模板的场景可以显示禁用态，避免配置后无法发送。

## 日志与追踪

外部通知日志需要记录解析出的 `sceneKey`，用于排查：

1. 这条本站消息属于哪个业务场景。
2. 该场景是否启用外发。
3. 未发送时是配置关闭、无账号映射、模板不支持，还是平台异常。

同一个业务消息继续使用 `messageId` 串联本站消息、飞书发送、飞书卡片回写和补偿任务。

## 测试策略

后端：

1. `getMessageScene()` 覆盖所有已知场景。
2. 外发决策覆盖场景启用、关闭、未知场景。
3. 保证现有 `workflow.approval.todo` 仍然会发送飞书。
4. 保证 `project_alert`、`workflow_instance` 默认不发送。

前端：

1. 配置页能展示消息场景列表。
2. 默认只开启流程审批待办。
3. 暂未支持模板的场景不能误导用户开启。

## 推进顺序

1. 新增消息场景注册表和单元测试。
2. 后端外发逻辑从硬编码改成按场景配置判断。
3. 配置服务增加飞书启用场景读取和默认值。
4. 飞书配置页增加业务场景开关。
5. 外部通知日志增加 `sceneKey` 追踪字段或在请求摘要中落库。
6. 再逐步给任务提醒、项目提醒补飞书模板。
