# Task List Workbench Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 为任务列表页补齐工作台 Hero，并统一高级筛选按钮的图标和旋转状态。

**Architecture:** 只修改 `taskManage/index.vue` 的模板、局部导入和 scoped 样式。保留 `RequestChartTable`、现有查询字段、表格列和业务操作逻辑。

**Tech Stack:** Vue 3 `<script setup>`、Element Plus、项目现有 `RequestChartTable`、scoped CSS。

---

### Task 1: 任务列表页工作台头部与筛选开关

**Files:**
- Modify: `nest-admin-frontend/src/views/business/taskManage/index.vue`

- [ ] **Step 1: 添加图标导入**

在 `<script setup>` 中增加：

```js
import { CaretBottom } from '@element-plus/icons-vue'
```

- [ ] **Step 2: 增加任务列表 Hero**

在根节点 `.task-index-page` 内、`RequestChartTable` 前增加：

```vue
<div class="task-hero">
  <div class="task-hero__eyebrow">任务协作</div>
  <h2 class="task-hero__title">任务工作台</h2>
  <p class="task-hero__desc">集中查看任务状态、优先级、来源、协作提醒和汇报情况，快速进入评论、汇报和审批处理。</p>
</div>
```

- [ ] **Step 3: 给高级筛选按钮增加图标**

把现有 `extraButtons` 改为：

```vue
<template #extraButtons>
  <el-button class="advanced-filter-toggle" plain type="primary" @click="showAdvanced = !showAdvanced">
    {{ showAdvanced ? '收起高级筛选' : '展开高级筛选' }}
    <el-icon :class="{ 'rotate-180': showAdvanced }"><CaretBottom /></el-icon>
  </el-button>
</template>
```

- [ ] **Step 4: 补齐 Hero 和图标样式**

在 scoped style 中增加：

```css
.task-hero {
  padding: 20px;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 16px;
  background: linear-gradient(135deg, var(--el-fill-color-extra-light), color-mix(in srgb, var(--el-color-primary-light-9) 60%, #fff));
}

.task-hero__eyebrow {
  margin-bottom: 6px;
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.08em;
  color: var(--el-color-primary);
}

.task-hero__title {
  margin: 0;
  font-size: 22px;
  line-height: 1.25;
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.task-hero__desc {
  margin: 8px 0 0;
  font-size: 13px;
  line-height: 1.6;
  color: var(--el-text-color-secondary);
}

.advanced-filter-toggle :deep(.el-icon) {
  margin-left: 4px;
  transition: transform 0.2s ease;
}

.rotate-180 {
  transform: rotate(180deg);
}
```

在移动端媒体查询内增加：

```css
.task-hero {
  padding: 16px;
}
```

### Task 2: 验证

**Files:**
- Verify: `nest-admin-frontend`

- [ ] **Step 1: 运行类型检查**

Run: `npm run type-check`

Expected: 命令成功退出。

- [ ] **Step 2: 检查差异**

Run: `git diff -- nest-admin-frontend/src/views/business/taskManage/index.vue docs/superpowers/specs/2026-04-30-task-list-workbench-design.md docs/superpowers/plans/2026-04-30-task-list-workbench.md`

Expected: 只包含任务列表页工作台头部、筛选按钮图标样式、设计文档和计划文档。

## Self-Review

- Spec coverage: 覆盖 Hero、新增图标、旋转状态、移动端样式和验证要求。
- Placeholder scan: 无 TBD、TODO 或未定义实现。
- Type consistency: `showAdvanced` 已在页面中存在，只新增 `CaretBottom` 导入和模板引用。
