# 业务审批上下文设计

## 目标

建立一套跨业务的审批上下文索引，让项目查看页可以稳定展示立项、结项、变更等多个审批记录，并为后续任务审批、上线审批、验收审批、归档审计和跨业务统计留下统一入口。

## 核心边界

`wf_instance` 继续表示流程运行事实：节点、任务、历史、状态推进仍由工作流模块负责。

新增 `business_approval_context` 表表示业务审批语义索引：哪个业务对象、哪个审批场景、关联哪个流程实例、当前状态是什么、是否当前有效。页面、列表、统计和归档查询优先走上下文表，不再解析 `business_key`。

新增 `business_approval_participant` 表表示审批参与人索引：发起人、当前审批人、历史审批人、抄送人等参与关系统一沉淀。第一阶段先落表结构和发起人索引，当前/历史审批人同步在后续接工作流任务事件时补齐。

## 数据模型

`business_approval_context`：

- `businessType`：业务类型，如 `project`、`task`、`change`
- `businessId`：业务对象 ID
- `businessScene`：审批场景，如 `initiation`、`closure`、`change`
- `sceneTitle`：页面展示名称，如 `立项审批`、`结项审批`
- `workflowInstanceId`：关联 `wf_instance.id`
- `workflowDefinitionId`、`workflowDefinitionCode`：流程定义快照
- `status`：运行中、已完成、已取消、已驳回等，第一阶段沿用工作流实例状态
- `currentNodeId`、`currentNodeName`：当前节点快照
- `starterId`、`starterName`、`startedAt`、`endedAt`
- `rootBusinessType`、`rootBusinessId`：聚合根业务对象，项目相关审批统一为 `project + projectId`
- `projectId`：项目维度快捷索引
- `isCurrent`：同一业务对象同一场景下最新上下文
- `isActive`：逻辑有效标记

`business_approval_participant`：

- `approvalContextId`
- `workflowInstanceId`
- `userId`
- `roleType`：`starter`、`assignee`、`history`、`cc`
- `businessType`、`businessId`
- `rootBusinessType`、`rootBusinessId`

## 后端接口

通用接口：

- `GET /business/approval-contexts?businessType=project&businessId=19`
- `GET /business/approval-contexts?rootBusinessType=project&rootBusinessId=19`
- `GET /business/approval-contexts/by-instance/:instanceId`

项目接口：

- `GET /business/projects/:id/view-context`

项目接口先做项目权限校验，再返回项目详情、字段权限、审批上下文列表和当前审批上下文。当前审批上下文选择规则：

1. URL 传入 `instanceId` 时优先匹配该流程实例。
2. 否则优先展示运行中的审批。
3. 否则展示最新发起的审批。

## 页面交互

长期入口为 `/projectManage/view?id=19`。旧的 `/projectManage/approval` 保留兼容，可以继续承载同一组件或逐步重定向。

项目列表按钮：

- `查看`：所有具备项目可见权限的人都能看到，进入项目只读信息和审批信息页。
- `详情`：只给核心成员、项目经理、交付经理或全量管理权限用户，进入项目执行工作台。

查看页需要支持多审批场景：

- 主视图展示当前选中的审批场景和流程。
- 其他审批记录作为历史记录折叠或列表展示。
- 从待办进入时，仅对应 `instanceId` 的主视图显示审批操作。

## 第一阶段范围

本次先实现通用审批上下文基础能力，并接入项目立项、项目结项：

- 新建上下文实体、参与人实体、服务、控制器。
- 工作流发起项目立项/结项时双写上下文。
- 工作流完成/取消回调时同步上下文状态。
- 项目提供 `view-context` 接口。
- 前端项目列表将 `立项信息` 入口改为 `查看`，并允许和 `详情` 同时显示。

暂不在本阶段迁移所有业务审批，也不做历史数据回填。后续迁移任务审批、变更审批、上线审批、验收审批时，只接入同一服务，不新增业务专用审批索引。
