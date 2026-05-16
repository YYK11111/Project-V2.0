# Message Scene External Notify Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 将本站消息外发从硬编码 `workflow_task` 调整为按业务场景配置飞书发送。

**Architecture:** 后端新增消息场景注册表，`MessagesService` 负责解析场景并按配置决定是否调用外部通知。配置服务提供飞书默认启用场景，前端系统配置页展示业务场景开关。

**Tech Stack:** NestJS、TypeORM、Jest、Vue 3、Element Plus、Vitest。

---

### Task 1: 消息场景注册表

**Files:**
- Create: `nest-admin/src/modules/messages/message-scenes.ts`
- Test: `nest-admin/src/modules/messages/message-scenes.spec.ts`

- [ ] **Step 1: Write failing tests**

覆盖 `workflow.approval.todo`、`workflow.instance.cc`、`project.alert`、任务类 reminderType、未知消息返回空场景。

- [ ] **Step 2: Run test to verify it fails**

Run: `cd nest-admin && npx jest src/modules/messages/message-scenes.spec.ts --runInBand`
Expected: FAIL because `message-scenes.ts` does not exist.

- [ ] **Step 3: Implement registry**

导出 `MESSAGE_SCENES`、`getMessageScene(message)`、`listMessageScenes()`，其中 `supportedTemplates.feishu` 仅 `workflow.approval.todo` 为 `workflowTodo`。

- [ ] **Step 4: Run test to verify it passes**

Run: `cd nest-admin && npx jest src/modules/messages/message-scenes.spec.ts --runInBand`
Expected: PASS.

### Task 2: 后端按场景决策飞书外发

**Files:**
- Modify: `nest-admin/src/modules/messages/service.ts`
- Modify: `nest-admin/src/modules/messages/service.spec.ts`
- Modify: `nest-admin/src/modules/configs/service.ts`
- Modify: `nest-admin/src/modules/external-notify/provider.interface.ts`
- Modify: `nest-admin/src/modules/external-notify/service.ts`
- Modify: `nest-admin/src/modules/external-notify/service.spec.ts`

- [ ] **Step 1: Write failing tests**

新增断言：默认配置下流程审批待办继续发送，`project_alert` 默认不发送；配置启用 `project.alert` 但无飞书模板时不调用飞书发送，并记录跳过日志；发送日志和系统消息日志包含 `sceneKey`。

- [ ] **Step 2: Run tests to verify failure**

Run: `cd nest-admin && npx jest src/modules/messages/service.spec.ts src/modules/external-notify/service.spec.ts --runInBand`
Expected: FAIL because scene config is not implemented.

- [ ] **Step 3: Implement backend behavior**

配置默认值增加 `feishu.enabledScenes: ["workflow.approval.todo"]`。`MessagesService.sendExternalNotification()` 使用 `getMessageScene()` 判断场景，未启用直接返回，已启用但无飞书模板则调用 `ExternalNotifyService.saveSkippedExternalNotificationLog()` 记录原因。`NotifyMessage` 增加 `sceneKey`，外部通知日志 requestPayload 写入 `sceneKey`。

- [ ] **Step 4: Run tests to verify pass**

Run: `cd nest-admin && npx jest src/modules/messages/message-scenes.spec.ts src/modules/messages/service.spec.ts src/modules/external-notify/service.spec.ts --runInBand`
Expected: PASS.

### Task 3: 前端飞书消息场景配置

**Files:**
- Modify: `nest-admin-frontend/src/views/system/configs/index.vue`
- Modify: `nest-admin-frontend/src/views/system/configs/configs.structure.spec.ts`

- [ ] **Step 1: Write failing structure test**

断言默认配置包含 `enabledScenes: ['workflow.approval.todo']`，页面展示“消息场景”“流程审批待办”“模板状态”，并绑定 `form.externalNotifyConfig.feishu.enabledScenes`。

- [ ] **Step 2: Run test to verify failure**

Run: `cd nest-admin-frontend && npx vitest run src/views/system/configs/configs.structure.spec.ts`
Expected: FAIL because UI has no scene config.

- [ ] **Step 3: Implement UI**

在飞书配置卡片中增加业务场景表格。已支持模板的场景可勾选，暂未支持模板的场景禁用并展示“暂未支持”。保存前合并默认配置，避免旧配置丢失 `enabledScenes`。

- [ ] **Step 4: Run test to verify pass**

Run: `cd nest-admin-frontend && npx vitest run src/views/system/configs/configs.structure.spec.ts`
Expected: PASS.

### Task 4: Final verification

**Files:**
- Verify backend, frontend and API contract.

- [ ] **Step 1: Backend focused tests**

Run: `cd nest-admin && npx jest src/modules/messages/message-scenes.spec.ts src/modules/messages/service.spec.ts src/modules/external-notify/service.spec.ts --runInBand`
Expected: PASS.

- [ ] **Step 2: Frontend focused tests and type check**

Run: `cd nest-admin-frontend && npx vitest run src/views/system/configs/configs.structure.spec.ts`
Expected: PASS.

Run: `cd nest-admin-frontend && npm run type-check`
Expected: PASS.

- [ ] **Step 3: API contract check**

Run: `npm run check:api-contract`
Expected: PASS.
