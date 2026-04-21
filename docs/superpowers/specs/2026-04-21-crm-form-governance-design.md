# CRM 表单治理设计

## 目标

对 CRM 相关 4 个表单页做一轮结构治理，统一改成卡片分区、统一底部操作区，并在合同与互动记录场景中保持附件能力的一致性。

## 范围

本次整改仅覆盖以下页面：

- `nest-admin-frontend/src/views/business/crm/customerManage/form.vue`
- `nest-admin-frontend/src/views/business/crm/opportunityManage/form.vue`
- `nest-admin-frontend/src/views/business/crm/contractManage/form.vue`
- `nest-admin-frontend/src/views/business/crm/interactionManage/form.vue`

不涉及：

- CRM 列表页
- CRM 详情页
- 非表单业务页

## 现状问题

### 1. 四个 CRM 表单都还是长表单

- 页面内容依赖 `el-row` + `el-form-item` 线性堆叠
- 缺少明确的业务分区卡片
- 信息层级和可扫读性较弱

### 2. 底部操作区不统一

- 页面底部按钮排列、宽度、间距未统一
- 不同表单页观感不一致

### 3. 附件能力不一致

- `contractManage/form.vue` 已从输入框修成单文件上传，但还没有纳入整体表单结构治理
- `interactionManage/form.vue` 数据模型已有 `attachments`，但前端还没有附件区
- `customerManage/form.vue`、`opportunityManage/form.vue` 当前没有明确业务附件诉求

## 设计原则

- 不添加 Hero
- 页面统一从 `el-page-header` + 主表单卡片开始
- 使用卡片式分区组织字段
- 优先复用 `Upload`、`ViewFileList`、`ViewField`、`ViewEntity`、`ViewUser`
- 只在有业务依据时补附件区，不盲目给所有 CRM 模块加附件字段
- 不改变现有业务流程、校验逻辑和审批流程

## 方案对比

### 方案一：卡片分区 + 最小附件统一

- 4 页全部改为卡片分区
- 统一 footer
- `interactionManage/form.vue` 补附件区
- `contractManage/form.vue` 保持单文件上传模式并纳入分区
- `customerManage` / `opportunityManage` 不新增附件字段

优点：范围可控，结构统一，业务改动最少。

缺点：客户、机会页如果未来需要附件，还需单独补一轮。

### 方案二：全部 CRM 表单都补附件字段

- 4 页全部补附件链路

优点：体验最一致。

缺点：业务依据不足，会扩大后端数据模型改造范围。

### 方案三：只做前端结构，不碰附件

- 全部重做卡片分区和 footer
- 不再处理任何附件差异

优点：改动最小。

缺点：互动记录和合同场景的组件体验仍然不一致。

## 选定方案

选择方案一：卡片分区 + 最小附件统一。

原因：这是当前最稳的做法，能把 CRM 表单的结构问题一次解决，同时只在确有业务依据的页面上统一附件体验。

## 页面结构设计

### 统一骨架

所有 CRM 表单页统一为：

1. `el-page-header`
2. `Gcard` 主容器
3. 若干 `section-card`
4. `footer-actions`

### `customerManage/form.vue`

建议分区：

1. 基本信息
2. 客户属性
3. 联系与归属
4. 备注说明

说明：

- 不补附件字段
- 保持客户审批和工作流逻辑不变

### `opportunityManage/form.vue`

建议分区：

1. 基本信息
2. 销售推进
3. 描述与失败原因

说明：

- 不补附件字段
- 重点提升字段层级和录入可读性

### `contractManage/form.vue`

建议分区：

1. 基本信息
2. 金额与周期
3. 状态与关联
4. 合同文件与备注

说明：

- 保留 `contractFile: string` 的单文件上传模式
- 不把合同文件升级为附件数组
- 统一使用上传组件而不是输入框

### `interactionManage/form.vue`

建议分区：

1. 基本信息
2. 跟进内容
3. 跟进安排与附件

说明：

- 前端补 `Upload` / `ViewFileList`
- 后端已有 `attachments` 字段，不需要新增数据模型

## 底部操作区设计

统一要求：

- 按钮间距 `12px`
- 最小宽度 `112px`
- 去掉默认按钮左侧挤压
- 查看态只保留“返回”或现有最小必要按钮

## 附件设计

### 合同管理

- 字段仍使用 `contractFile`
- 编辑态使用 `Upload` 的单文件模式 `v-model:fileUrl`
- 查看态使用 `ViewFileList` 包装单文件展示

### 互动记录

- 字段沿用 `attachments`
- 编辑态使用 `Upload` 多文件模式
- 查看态使用 `ViewFileList`

### 客户 / 销售机会

- 本次不新增附件字段
- 保持最小改动原则

## 验证策略

### 前端

- `npm run test:unit`
- `npm run type-check`

### 后端

- `npm run lint`

### 建议补充测试

- 新增 CRM 表单守卫测试，至少约束：
  - 4 页具有卡片分区结构
  - `interactionManage/form.vue` 有附件组件
  - `contractManage/form.vue` 不再退回输入框模式

## 风险与边界

- 本次任务不整改 CRM 列表页
- 不新增 Hero
- 不将 CRM 全部实体一律改造成附件数组
- 只做结构治理和已有业务场景下的附件统一
