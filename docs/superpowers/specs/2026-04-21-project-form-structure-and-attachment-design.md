# 项目链路表单整改设计

## 目标

对项目链路 8 个业务表单页做一轮结构整改，统一移除顶部 Hero，补齐附件组件与附件字段链路，重做分区层级，并统一底部操作区。

## 范围

本次整改仅覆盖以下页面：

- `nest-admin-frontend/src/views/business/projectManage/form.vue`
- `nest-admin-frontend/src/views/business/taskManage/form.vue`
- `nest-admin-frontend/src/views/business/userStoryManage/form.vue`
- `nest-admin-frontend/src/views/business/ticketManage/form.vue`
- `nest-admin-frontend/src/views/business/riskManage/form.vue`
- `nest-admin-frontend/src/views/business/changeManage/form.vue`
- `nest-admin-frontend/src/views/business/sprintManage/form.vue`
- `nest-admin-frontend/src/views/business/milestoneManage/form.vue`

如需补附件字段，允许联动对应后端模块，但只限于支撑上述 8 页。

## 现状问题

### 1. 页面结构不统一

- `taskManage/form.vue`、`userStoryManage/form.vue` 仍带有大段 Hero 区
- `riskManage/form.vue`、`sprintManage/form.vue`、`milestoneManage/form.vue` 仍是单列长表单，缺少清晰分区
- `projectManage/form.vue` 虽然已经分区，但需要作为后续结构参考而非继续保留工作台头部风格

### 2. 附件能力不一致

- `projectManage/form.vue`、`taskManage/form.vue`、`ticketManage/form.vue` 已接入 `Upload` / `ViewFileList`
- `userStoryManage/form.vue`、`riskManage/form.vue`、`sprintManage/form.vue`、`milestoneManage/form.vue` 当前无附件区
- `changeManage/form.vue` 需要核实并统一其附件字段和展示方式

### 3. 操作区不统一

- 不同页面底部按钮顺序、间距、宽度不一致
- 查看态和编辑态的按钮策略缺少统一口径

## 设计原则

- 删除 Hero，不保留顶部说明卡和统计卡
- 页面统一从 `el-page-header` + 主表单卡片开始
- 优先复用已有组件：`Upload`、`ViewFileList`、`ViewField`、`ViewEntity`、`ViewUser`
- 对已有附件字段直接复用，不重复造字段
- 对缺少附件字段的模块做最小必要前后端补齐
- 不重构无关业务逻辑，不扩大到列表页或详情页

## 方案对比

### 方案一：保守统一整改

- 删除 Hero
- 对 8 个表单页统一改为分区卡片结构
- 对缺失页面补齐附件链路
- 统一 footer 操作区

优点：范围可控，结构统一，符合当前诉求。

缺点：需要少量前后端联动。

### 方案二：只删 Hero 和补附件

- 不系统整理分区，只做明显问题修补

优点：快。

缺点：页面仍然容易出现“一长坨字段”，整改不彻底。

### 方案三：统一工作台模板重做

- 8 页全部重新套一套完整模板

优点：风格最整齐。

缺点：改动过大，容易引入 UI 回归。

## 选定方案

选择方案一：保守统一整改。

原因：当前目标是“前端文件先整改”，同时又允许补齐附件字段链路。方案一可以在可控范围内完成结构统一和组件补齐，不会扩展成整套界面重构工程。

## 页面结构设计

### 总体骨架

所有目标页面统一为：

1. `el-page-header`
2. 主表单容器 `Gcard` / `km-panel`
3. 分区卡片 `section-card`
4. `footer-actions`

不再保留以下结构：

- `km-hero`
- `*form-hero__*`
- 顶部模式说明统计块

### 分区设计

#### `projectManage/form.vue`

- 保留现有成熟分区
- 去掉顶部工作台式头部
- 保留现有附件区和结项资料区
- 统一 footer 间距和按钮宽度

#### `taskManage/form.vue`

- 删除 Hero
- 分区调整为：
  - 基本信息
  - 执行信息
  - 协作记录
  - 审批信息
- 保留现有任务附件、汇报附件、评论附件

#### `userStoryManage/form.vue`

- 删除 Hero
- 分区调整为：
  - 基本信息
  - 描述与验收
  - 附件
- 新增故事附件字段与前后端链路

#### `ticketManage/form.vue`

- 保留已有附件组件链路
- 删除 Hero（若存在）
- 分区整理为：
  - 基本信息
  - 处理与审批
  - 附件

#### `riskManage/form.vue`

- 新增附件字段与前后端链路
- 分区调整为：
  - 基本信息
  - 风险分析
  - 关联信息
  - 附件

#### `changeManage/form.vue`

- 统一附件链路和展示方式
- 分区调整为：
  - 基本信息
  - 变更分析
  - 计划影响
  - 审批与知识
  - 附件

#### `sprintManage/form.vue`

- 新增附件字段与前后端链路
- 分区调整为：
  - 基本信息
  - 执行指标
  - 影响提示
  - 附件

#### `milestoneManage/form.vue`

- 新增附件字段与前后端链路
- 分区调整为：
  - 基本信息
  - 交付物与说明
  - 任务概况
  - 附件

## 附件链路设计

### 前端统一规则

- 编辑态使用 `Upload`
- 查看态使用 `ViewFileList`
- 字段命名优先使用 `attachments`
- 对已有 `attachments` 字段的页面只补 UI，不改字段名

### 后端最小联动

对于当前无附件字段的业务模块，仅补：

- DTO / 入参结构支持 `attachments`
- 实体字段支持 `attachments`
- `getOne` / `save` / `update` 回传和持久化支持 `attachments`

不做额外的附件业务规则扩展。

### 预期补字段模块

- 用户故事
- 风险
- Sprint
- 里程碑
- 如变更模块存在字段不统一，也一起收敛到 `attachments`

## 底部操作区设计

统一要求：

- 按钮间距 `12px`
- 最小宽度 `112px`
- 查看态只保留“返回”
- 编辑态主按钮优先在前，取消在后
- 不同页面不再各自定义间距规则

## 验证策略

### 前端

- `npm run test:unit`
- `npm run type-check`

### 后端

- `npm run lint`
- 若实体字段有变更，补最小验证命令

### 重点人工核查

- 8 个表单页顶部不再出现 Hero
- 目标页面都存在明确附件区
- 查看态能正确展示历史附件
- 编辑态提交后附件不会丢失
- 底部按钮顺序、间距、宽度统一

## 风险与边界

- 本次任务不整改列表页和详情页
- 不重写页面业务逻辑，只重做结构和附件链路
- 附件字段联动只限于支撑这 8 页，不顺手改其他模块
- 不做额外视觉美化，重点解决结构不合格与组件缺失问题
