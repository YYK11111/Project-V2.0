# List Query Layout Unification Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 按任务列表页筛选结构统一方案 A 范围内的列表页查询区，并保证响应式布局一致。

**Architecture:** 只修改各列表页的 query slot 模板和 scoped 查询样式，不修改接口、表格列、业务按钮和权限逻辑。label 与控件水平居中对齐由 `RequestChartTable.vue` 统一负责，页面内只负责 `query-sections/query-grid` 结构。

**Tech Stack:** Vue 3、Element Plus、`RequestChartTable`、scoped CSS/SCSS。

---

### Task 1: 业务执行类列表页

**Files:**
- Modify: `nest-admin-frontend/src/views/business/milestoneManage/index.vue`
- Modify: `nest-admin-frontend/src/views/business/sprintManage/index.vue`
- Modify: `nest-admin-frontend/src/views/business/changeManage/index.vue`
- Modify: `nest-admin-frontend/src/views/business/riskManage/index.vue`
- Modify: `nest-admin-frontend/src/views/business/userStoryManage/index.vue`

- [ ] **Step 1: 统一 milestone 查询结构**

将 `native-query-grid/native-query-item/native-query-label` 改为 `query-grid/query-select-item/query-select-label` 或 `BaInput/BaSelect`；保留现有筛选字段和 `showAdvancedFilters` 逻辑。

- [ ] **Step 2: 统一 sprint 查询结构**

将 `native-query-grid` 改为 `query-grid`，保留 `handleQueryChange` 和所有字段绑定。

- [ ] **Step 3: 统一 change 查询结构**

将 `native-query-grid` 改为 `query-grid`，不改“知识回流”等字段语义。

- [ ] **Step 4: 统一 risk 查询结构**

将 `native-query-grid` 改为 `query-grid`，保留 `#extraButtons` 中的“风险矩阵”按钮。

- [ ] **Step 5: 统一 userStory 查询结构**

将裸 `query-grid` 包进 `query-sections/query-section--primary`，保留 `table-attrs/table-events` 和本地 `selectedIds` 逻辑。

### Task 2: 工作流和系统列表页

**Files:**
- Modify: `nest-admin-frontend/src/views/business/workflow/index.vue`
- Modify: `nest-admin-frontend/src/views/business/workflow/businessConfig.vue`
- Modify: `nest-admin-frontend/src/views/system/roles/index.vue`
- Modify: `nest-admin-frontend/src/views/system/menus/index.vue`
- Modify: `nest-admin-frontend/src/views/system/notices/index.vue`
- Modify: `nest-admin-frontend/src/views/system/users/index.vue`

- [ ] **Step 1: 统一 workflow/index 查询结构**

将裸 `query-grid` 包进 `query-sections/query-section--primary`。

- [ ] **Step 2: 统一 workflow/businessConfig 查询结构**

将单个 `BaSelect` 包进 `query-sections/query-section--primary/query-grid`。

- [ ] **Step 3: 统一 roles/index 查询结构**

将直接控件改为 `query-sections/query-section--primary/query-grid`。

- [ ] **Step 4: 统一 menus/index 查询结构**

将直接控件改为 `query-sections/query-section--primary/query-grid`，保留 `#tableView`。

- [ ] **Step 5: 统一 notices/index 查询结构**

将直接控件改为 `query-sections/query-section--primary/query-grid`。

- [ ] **Step 6: 统一 users/index 查询结构**

将查询控件包进 `query-sections/query-section--primary/query-grid`，保留 `params.includeNoDept` checkbox 绑定。

### Task 3: 内容和系统监控列表页

**Files:**
- Modify: `nest-admin-frontend/src/views/content/articleManage/index.vue`
- Modify: `nest-admin-frontend/src/views/content/articleManage/myBorrows.vue`
- Modify: `nest-admin-frontend/src/views/content/articleManage/borrowApproval.vue`
- Modify: `nest-admin-frontend/src/views/systemMonitor/onlineUser/index.vue`
- Modify: `nest-admin-frontend/src/views/systemMonitor/loginLog/index.vue`

- [ ] **Step 1: 统一 articleManage/index 查询结构**

将裸 `query-grid` 包进 `query-sections`，字段多时拆 primary 和 advanced，新增高级筛选按钮但不新增查询字段。

- [ ] **Step 2: 统一 myBorrows 查询结构**

将直接控件改为 `query-sections/query-section--primary/query-grid`，保留页面上方状态卡片。

- [ ] **Step 3: 统一 borrowApproval 查询结构**

将直接控件改为 `query-sections/query-section--primary/query-grid`，保留审批/拒绝表格操作。

- [ ] **Step 4: 统一 onlineUser 查询结构**

将直接控件改为 `query-sections/query-section--primary/query-grid`，保留 `query.address` 和 `prop="ip"` 现状，保留 `#tableView`。

- [ ] **Step 5: 统一 loginLog 查询结构**

将直接控件改为 `query-sections/query-section--primary/query-grid`，保留 `query.address` 和 `prop="ip"` 现状，保留 `#tableView`。

### Task 4: 样式复核和去重

**Files:**
- Modify as needed: files touched in Tasks 1-3

- [ ] **Step 1: 删除不再使用的 native 查询样式**

如果页面中 `native-query-grid/native-query-item/native-query-label` 已全部删除，同步删除对应 scoped 样式。

- [ ] **Step 2: 补齐缺失的响应式样式**

每个目标页面至少具备：桌面 4 列、中屏 2 列、移动端 1 列。若已有等价规则，不重复添加。

- [ ] **Step 3: 保留特殊业务样式**

不要删除操作区、表格、状态卡片、左右布局、tabs、`tableView` 相关样式。

### Task 5: 验证

**Files:**
- Verify: `nest-admin-frontend`

- [ ] **Step 1: 运行类型检查**

Run: `npm run type-check`

Expected: 命令成功退出。

- [ ] **Step 2: 检查目标文件 diff**

Run: `git diff -- nest-admin-frontend/src/views/business/milestoneManage/index.vue nest-admin-frontend/src/views/business/sprintManage/index.vue nest-admin-frontend/src/views/business/changeManage/index.vue nest-admin-frontend/src/views/business/riskManage/index.vue nest-admin-frontend/src/views/business/userStoryManage/index.vue nest-admin-frontend/src/views/business/workflow/index.vue nest-admin-frontend/src/views/business/workflow/businessConfig.vue nest-admin-frontend/src/views/system/roles/index.vue nest-admin-frontend/src/views/system/menus/index.vue nest-admin-frontend/src/views/system/notices/index.vue nest-admin-frontend/src/views/system/users/index.vue nest-admin-frontend/src/views/content/articleManage/index.vue nest-admin-frontend/src/views/content/articleManage/myBorrows.vue nest-admin-frontend/src/views/content/articleManage/borrowApproval.vue nest-admin-frontend/src/views/systemMonitor/onlineUser/index.vue nest-admin-frontend/src/views/systemMonitor/loginLog/index.vue docs/superpowers/specs/2026-04-30-list-query-layout-unification-design.md docs/superpowers/plans/2026-04-30-list-query-layout-unification.md`

Expected: 只包含查询布局结构、响应式样式和文档变更，不包含接口字段、表格列、业务逻辑变更。

## Self-Review

- Spec coverage: 覆盖方案 A 页面、统一结构、响应式、特殊风险点和验证。
- Placeholder scan: 无 TBD、TODO 或未定义实现。
- Type consistency: 不新增业务类型；只调整模板结构和 scoped 样式。
