# Business Approval Context Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 建立通用业务审批上下文索引，并先接入项目立项/结项审批和项目查看入口。

**Architecture:** `wf_instance` 继续负责流程运行事实；新增 `business_approval_context` 和 `business_approval_participant` 负责业务语义、查询、统计和权限索引。项目查看接口聚合项目详情、字段权限和审批上下文，前端列表统一展示 `查看` 与深度权限下的 `详情`。

**Tech Stack:** NestJS、TypeORM、MySQL、Jest、Vue 3、Element Plus、Vitest。

---

### Task 1: 后端审批上下文基础模型

**Files:**
- Create: `nest-admin/src/modulesBusi/approval-contexts/entity/business-approval-context.entity.ts`
- Create: `nest-admin/src/modulesBusi/approval-contexts/entity/business-approval-participant.entity.ts`
- Create: `nest-admin/src/modulesBusi/approval-contexts/service.ts`
- Create: `nest-admin/src/modulesBusi/approval-contexts/service.spec.ts`
- Create: `nest-admin/src/modulesBusi/approval-contexts/controller.ts`
- Create: `nest-admin/src/modulesBusi/approval-contexts/module.ts`
- Modify: `nest-admin/src/app.module.ts`

- [ ] 写 `BusinessApprovalContextService` 红测：创建上下文时写入业务、场景、流程实例、根业务对象，并将同业务同场景旧上下文置为非当前。
- [ ] 实现两个实体和服务最小逻辑。
- [ ] 写查询红测：按 `rootBusinessType + rootBusinessId` 返回最新审批列表。
- [ ] 实现控制器通用查询接口。
- [ ] 运行 `npm test -- approval-contexts/service.spec.ts`。
- [ ] 提交 `feat: add business approval context model`。

### Task 2: 工作流集成双写

**Files:**
- Modify: `nest-admin/src/common/services/workflow-integration.service.ts`
- Modify: `nest-admin/src/common/services/workflow-integration.service.spec.ts`
- Modify: `nest-admin/src/modules/global/global.module.ts`

- [ ] 写红测：`startProjectApproval` 成功后创建 `project/initiation` 上下文。
- [ ] 写红测：`startProjectCloseApproval` 成功后创建 `project/closure` 上下文。
- [ ] 写红测：`handleWorkflowCallback` 完成项目审批后同步上下文状态。
- [ ] 实现可选注入 `BusinessApprovalContextService`，不影响现有单测手动构造。
- [ ] 运行 `npm test -- common/services/workflow-integration.service.spec.ts approval-contexts/service.spec.ts`。
- [ ] 提交 `feat: sync project approvals to context`。

### Task 3: 项目查看上下文接口

**Files:**
- Modify: `nest-admin/src/modulesBusi/projects/service.ts`
- Modify: `nest-admin/src/modulesBusi/projects/controller.ts`
- Modify: `nest-admin/src/modulesBusi/projects/module.ts`
- Modify: `nest-admin/src/modulesBusi/projects/service.spec.ts`

- [ ] 写红测：有项目查看权限时 `getProjectViewContext` 返回项目、字段权限、审批上下文和当前上下文。
- [ ] 写红测：传入 `instanceId` 时优先选择对应审批上下文。
- [ ] 实现 `getProjectViewContext` 和 `GET /business/projects/:id/view-context`。
- [ ] 运行 `npm test -- modulesBusi/projects/service.spec.ts approval-contexts/service.spec.ts`。
- [ ] 提交 `feat: expose project approval view context`。

### Task 4: 前端项目入口调整

**Files:**
- Modify: `nest-admin-frontend/src/views/business/projectManage/api.ts`
- Modify: `nest-admin-frontend/src/views/business/projectManage/index.vue`
- Modify: `nest-admin-frontend/src/views/business/projectManage/projectManage.index.spec.ts`

- [ ] 写 Vitest 红测：项目列表始终为可见项目显示 `查看`，执行阶段深度权限仍显示 `详情`，两个按钮可同时存在。
- [ ] 新增 `getViewContext` API。
- [ ] 将列表 `立项信息` 改为 `查看`，跳转 `/projectManage/approval` 或后续 `/projectManage/view`。
- [ ] 运行 `npx vitest run src/views/business/projectManage/projectManage.index.spec.ts`。
- [ ] 提交 `fix: align project view and detail entries`。

### Task 5: 最终校验

- [ ] 后端运行窄范围 Jest。
- [ ] 前端运行窄范围 Vitest。
- [ ] 跨接口运行 `npm run check:api-contract`。
- [ ] 运行 `git diff --check`。
- [ ] 汇总提交和剩余风险。
