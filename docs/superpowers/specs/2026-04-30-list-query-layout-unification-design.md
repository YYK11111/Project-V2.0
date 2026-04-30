# 列表页筛选布局统一设计

## 范围

本次采用方案 A：优先统一当前明显不一致的 `RequestChartTable` 列表页。已经接近任务列表页结构的页面暂不重复改造。

第一批范围：

- `nest-admin-frontend/src/views/business/milestoneManage/index.vue`
- `nest-admin-frontend/src/views/business/sprintManage/index.vue`
- `nest-admin-frontend/src/views/business/changeManage/index.vue`
- `nest-admin-frontend/src/views/business/riskManage/index.vue`
- `nest-admin-frontend/src/views/business/userStoryManage/index.vue`
- `nest-admin-frontend/src/views/business/workflow/index.vue`
- `nest-admin-frontend/src/views/business/workflow/businessConfig.vue`
- `nest-admin-frontend/src/views/system/roles/index.vue`
- `nest-admin-frontend/src/views/system/menus/index.vue`
- `nest-admin-frontend/src/views/system/notices/index.vue`
- `nest-admin-frontend/src/views/system/users/index.vue`
- `nest-admin-frontend/src/views/content/articleManage/index.vue`
- `nest-admin-frontend/src/views/content/articleManage/myBorrows.vue`
- `nest-admin-frontend/src/views/content/articleManage/borrowApproval.vue`
- `nest-admin-frontend/src/views/systemMonitor/onlineUser/index.vue`
- `nest-admin-frontend/src/views/systemMonitor/loginLog/index.vue`

## 目标

- 以 `business/taskManage/index.vue` 的筛选布局为模板统一其他列表页。
- 不新增 Hero。
- 所有列表页查询区使用稳定响应式结构。
- 筛选字段标题和控件水平居中对齐，并保持清晰间隔。
- 不新增接口字段，不修改查询语义，不改表格列和业务操作。

## 统一结构

查询区统一使用：

```vue
<div class="query-sections">
  <div class="query-section query-section--primary">
    <div class="query-grid">
      <!-- 常用筛选字段 -->
    </div>
  </div>

  <div v-if="showAdvanced" class="query-section query-section--advanced">
    <div class="query-section__header">
      <div class="query-section__title">高级筛选</div>
      <div class="query-section__desc">...</div>
    </div>
    <div class="query-grid">
      <!-- 低频筛选字段 -->
    </div>
  </div>
</div>
```

字段少的页面只保留 primary，不强制增加高级筛选。

字段多或已有高级筛选的页面使用 `showAdvanced` 和 `#extraButtons` 展开按钮。

## 响应式规则

- 桌面端：`query-grid` 为 4 列。
- 中屏：`max-width: 1200px` 时为 2 列。
- 移动端：`max-width: 768px` 时为 1 列。
- 查询字段 label 与控件保持水平居中对齐，间隔由 `RequestChartTable` 统一控制。

## 页面差异处理

- `milestoneManage/index.vue`：将旧 `native-query-grid` 替换为 `query-grid`，高级筛选按钮移到 `#extraButtons`。
- `sprintManage/index.vue`、`changeManage/index.vue`、`riskManage/index.vue`：将 `native-query-grid/native-query-item` 统一为 `query-grid/query-select-item` 或 `BaInput/BaSelect`。
- `riskManage/index.vue`：保留 `#extraButtons` 中的“风险矩阵”按钮，若有高级筛选按钮则与其并排。
- `system/users/index.vue`：保留 `params.includeNoDept` 绑定，不改为 `query.includeNoDept`。
- `systemMonitor/onlineUser/index.vue`、`systemMonitor/loginLog/index.vue`：保留现有 `query.address` 与 `prop="ip"` 现状，不顺手改业务字段。
- `system/menus/index.vue`、系统监控页保留 `#tableView`，不改表格 slot。
- `content/articleManage/index.vue` 字段较多，拆分常用筛选和高级筛选。

## 样式策略

- 优先复用每个页面已有 `query-sections/query-grid` 样式。
- 对只缺结构的页面补最小必要样式。
- 不在每个页面重复写 label 对齐逻辑；label 与控件对齐由 `RequestChartTable.vue` 统一控制。
- 不引入新的公共组件，避免扩大改造面。

## 验证

实现后执行：

- 在 `nest-admin-frontend` 运行 `npm run type-check`。

人工检查：

- 所有目标页面筛选区桌面 4 列、中屏 2 列、移动端 1 列。
- 筛选 label 与控件水平居中对齐。
- 已有高级筛选展开/收起行为正常。
- 业务按钮、表格 slot、特殊绑定不变。

## 非目标

- 不统一所有已经接近任务列表页结构的页面。
- 不新增 Hero。
- 不改后端接口。
- 不重构 `RequestChartTable` 的数据请求和表格逻辑。

## 自检

- 无 TBD 或 TODO。
- 范围限定为方案 A 中明确列出的页面。
- 对风险点给出页面级处理规则。
- 响应式和 label 对齐规则明确。
