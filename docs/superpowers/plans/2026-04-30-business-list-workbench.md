# Business List Workbench Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 将项目成员、任务汇报、任务评论 3 个列表页改造成统一工作台结构，并给项目成员页补高级筛选开关。

**Architecture:** 保持 `RequestChartTable` 和现有接口不变，只调整 3 个 Vue 单文件组件的模板、局部状态和 scoped 样式。查询字段只在现有字段内重新分组，不新增未确认后端支持的参数。

**Tech Stack:** Vue 3 `<script setup>`、Element Plus、项目现有 `RequestChartTable`、scoped CSS/SCSS。

---

### Task 1: 项目成员列表工作台化

**Files:**
- Modify: `nest-admin-frontend/src/views/business/projectMemberManage/index.vue`

- [ ] **Step 1: 添加高级筛选状态和图标导入**

在 `<script setup lang="ts">` 中补充：

```ts
import { CaretBottom } from '@element-plus/icons-vue'

const showAdvanced = ref(false)
```

- [ ] **Step 2: 重组页面顶部结构**

把现有独立 `stats-grid` 和 `view-mode-bar` 包进新的 `project-member-hero`，保留原统计卡片点击行为和视角切换：

```vue
<div class="project-member-hero">
  <div class="project-member-hero__main">
    <div>
      <div class="project-member-hero__eyebrow">项目治理</div>
      <h2 class="project-member-hero__title">项目成员工作台</h2>
      <p class="project-member-hero__desc">集中查看项目成员、核心角色和成员配置异常，快速完成成员维护与项目覆盖检查。</p>
    </div>
    <el-radio-group v-model="viewMode" size="default">
      <el-radio-button label="member">成员视角</el-radio-button>
      <el-radio-button label="project">项目视角</el-radio-button>
    </el-radio-group>
  </div>

  <div class="stats-grid">
    <!-- 保留现有 5 个 stats-card -->
  </div>
</div>
```

- [ ] **Step 3: 按项目列表页分组查询区**

常用筛选保留 `keyword`、`projectId`、`userId`。新增高级筛选区，收纳 `role`、`isCore`、`isActive`、`projectStatus`、`issueType`：

```vue
<div class="query-sections">
  <div class="query-section query-section--primary">
    <div class="query-grid">
      <BaInput v-model="query.keyword" label="关键词" prop="keyword" placeholder="项目名/姓名/昵称" />
      <div class="query-select-item">...</div>
      <div class="query-select-item">...</div>
    </div>
  </div>

  <div v-if="showAdvanced" class="query-section query-section--advanced">
    <div class="query-section__header">
      <div class="query-section__title">高级筛选</div>
      <div class="query-section__desc">按角色、成员状态、项目状态和配置异常进一步定位成员数据</div>
    </div>
    <div class="query-grid">
      <!-- role/isCore/isActive/projectStatus/issueType -->
    </div>
  </div>
</div>
```

- [ ] **Step 4: 添加 `extraButtons` 开关**

在 `RequestChartTable` 内新增：

```vue
<template #extraButtons>
  <el-button class="advanced-filter-toggle" plain type="primary" @click="showAdvanced = !showAdvanced">
    {{ showAdvanced ? '收起高级筛选' : '展开高级筛选' }}
    <el-icon :class="{ 'rotate-180': showAdvanced }"><CaretBottom /></el-icon>
  </el-button>
</template>
```

- [ ] **Step 5: 补齐 Hero 和高级筛选样式**

在 scoped style 中新增或调整：

```css
.project-member-hero { ... }
.project-member-hero__main { ... }
.project-member-hero__eyebrow { ... }
.project-member-hero__title { ... }
.project-member-hero__desc { ... }
.query-sections { ... }
.query-section--advanced { ... }
.advanced-filter-toggle :deep(.el-icon) { ... }
.rotate-180 { transform: rotate(180deg); }
```

- [ ] **Step 6: 手动检查**

确认项目成员页成员视角、项目视角、统计卡片点击、高级筛选展开收起都不改变原业务行为。

### Task 2: 任务汇报列表工作台化

**Files:**
- Modify: `nest-admin-frontend/src/views/business/taskReportManage/index.vue`

- [ ] **Step 1: 添加高级筛选状态和图标导入**

```ts
import { CaretBottom } from '@element-plus/icons-vue'

const showAdvanced = ref(false)
```

- [ ] **Step 2: 增加页面 Hero**

在页面根节点内、`RequestChartTable` 前增加：

```vue
<div class="task-report-hero">
  <div class="task-report-hero__eyebrow">任务协作</div>
  <h2 class="task-report-hero__title">任务汇报工作台</h2>
  <p class="task-report-hero__desc">集中查看任务工时、进度、汇报内容和附件，支持快速补录自己的任务汇报。</p>
</div>
```

- [ ] **Step 3: 重组查询区**

常用筛选保留 `taskId`、`userId`，高级筛选收纳 `beginDate`、`endDate`。

- [ ] **Step 4: 添加 `extraButtons` 开关**

使用与项目列表页一致的按钮文案和 `CaretBottom` 旋转。

- [ ] **Step 5: 补齐 Hero 和高级筛选样式**

新增 `.task-report-hero` 系列样式，保留当前 `.query-sections` 样式并补 `.rotate-180` 和 `.advanced-filter-toggle :deep(.el-icon)`。

- [ ] **Step 6: 手动检查**

确认新增汇报、批量删除、表格操作不受影响；高级筛选只控制日期筛选区显隐。

### Task 3: 任务评论列表工作台化

**Files:**
- Modify: `nest-admin-frontend/src/views/business/taskCommentManage/index.vue`

- [ ] **Step 1: 添加高级筛选状态和图标导入**

```ts
import { CaretBottom } from '@element-plus/icons-vue'

const showAdvanced = ref(false)
```

- [ ] **Step 2: 增加页面 Hero**

在页面根节点内、`RequestChartTable` 前增加：

```vue
<div class="task-comment-hero">
  <div class="task-comment-hero__eyebrow">任务协作</div>
  <h2 class="task-comment-hero__title">任务评论工作台</h2>
  <p class="task-comment-hero__desc">集中查看任务评论、评论人、编辑状态和附件情况，快速追踪任务沟通记录。</p>
</div>
```

- [ ] **Step 3: 重组查询区**

常用筛选保留 `taskId`，高级筛选收纳 `userId`。

- [ ] **Step 4: 添加 `extraButtons` 开关**

使用与项目列表页一致的按钮文案和 `CaretBottom` 旋转。

- [ ] **Step 5: 补齐 Hero 和高级筛选样式**

新增 `.task-comment-hero` 系列样式，保留当前 `.query-sections` 样式并补 `.rotate-180` 和 `.advanced-filter-toggle :deep(.el-icon)`。

- [ ] **Step 6: 手动检查**

确认新增评论、编辑评论、删除评论、批量删除不受影响；高级筛选只控制用户 ID 查询项显隐。

### Task 4: 验证

**Files:**
- Verify: `nest-admin-frontend`

- [ ] **Step 1: 运行类型检查**

Run: `npm run type-check`

Expected: 命令成功退出。

- [ ] **Step 2: 检查 git diff**

Run: `git diff -- nest-admin-frontend/src/views/business/projectMemberManage/index.vue nest-admin-frontend/src/views/business/taskReportManage/index.vue nest-admin-frontend/src/views/business/taskCommentManage/index.vue docs/superpowers/specs/2026-04-30-business-list-workbench-design.md docs/superpowers/plans/2026-04-30-business-list-workbench.md`

Expected: 只包含本次设计、计划和 3 个列表页改造。

## Self-Review

- Spec coverage: 覆盖 3 个确认页面、工作台 Hero、筛选分组、高级筛选开关、现有字段约束、验证要求。
- Placeholder scan: 无 TBD、TODO 或未定义实现。
- Type consistency: 只新增 `showAdvanced` ref 和 `CaretBottom` 图标，均与现有 Vue/Element Plus 用法一致。
