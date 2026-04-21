---
name: project-form-polish
description: 'Polish dense business form pages in this repo with a consistent working-page layout. Use when the user asks to optimize project forms, add/edit pages, approval forms, or any high-density backend form that feels crowded, flat, or hard to scan. Focus on hero structure, section cards, field spacing, form label emphasis, table row density, footer actions, and responsive behavior. Optimized for Vue 3 + Element Plus + scoped SCSS in nest-admin-frontend.'
license: MIT
metadata:
  author: OpenCode
  version: "1.1.0"
---

# Project Form Polish

用于本仓库高密度业务表单页的样式优化规范，基于 `nest-admin-frontend/src/views/business/projectManage/form.vue` 的实际改造总结。

## 适用场景

在这些页面优先使用：

- 新建 / 编辑 / 查看表单页
- 立项页、审批页、配置页
- 同时包含主表单 + 明细表 + 富文本 + 附件区的工作台页面
- 用户反馈“字段太挤”“信息层级不清晰”“按钮贴太近”“表单像一长坨内容”的页面

不适用于：

- 简单的单区块表单
- 纯列表页
- 强品牌营销页

## 目标

把长表单改成“工作台”而不是“堆字段”。

要做到：

- 首屏先说明当前页面的任务目标
- 主表单分区清楚
- 字段间距稳定
- 左侧 label 和表格表头权重一致
- 明细表更紧凑，但字段控件尺寸不比主表小
- 底部操作区不拥挤
- 移动端自动收敛，不出现挤压和异常换行

## 核心结构

### 1. 页面骨架

业务大表单优先使用三段结构：

1. Hero 说明区
2. 主表单工作区
3. Footer 操作区

示意：

```vue
<div class="project-form-page km-page">
  <div class="project-form-hero Gcard km-hero">...</div>
  <div class="Gcard km-panel project-form-shell">
    <el-form>...</el-form>
  </div>
</div>
```

### 2. Hero 说明区

Hero 要解决三个问题：

- 当前在做什么
- 这页的目标是什么
- 当前的关键状态是什么

建议包含：

- eyebrow
- 单行标题
- 单行说明
- 2~4 个状态块

标题和说明在桌面端如果用户明确要求，可以强制单行：

```scss
.project-form-hero__title,
.project-form-hero__desc {
  max-width: none;
  white-space: nowrap;
}

@media (max-width: 768px) {
  .project-form-hero__title,
  .project-form-hero__desc {
    white-space: normal;
  }
}
```

## 分区规范

### 1. 区块卡片

每个表单分区使用独立卡片：

- 基本信息
- 明细表
- 描述与附件
- 审批信息
- AI 配置

卡片建议：

```scss
.section-card {
  padding: 22px;
  background: #fff;
  border: 1px solid color-mix(in srgb, var(--Color) 8%, var(--el-border-color-lighter));
  border-radius: 14px;
}
```

### 2. 区块头部

每个区块必须有：

- 标题
- 说明
- 右侧主操作（如果需要）

标题和说明建议接入：

- `km-section-header`
- `km-section-title`
- `km-section-desc`

## 字段规则

### 1. 字段上下间距

高密度业务表单不要依赖 Element Plus 默认间距，要手动统一：

先看当前项目有没有全局覆盖。

本仓库 `nest-admin-frontend/src/styles/element-ui.scss` 里有一条关键规则：

```scss
.el-form {
  .el-form-item {
    margin: 0 !important;
  }
}
```

这意味着：

- 不能只靠 `el-form-item margin-bottom` 调字段间隔
- 如果页面里感觉“间距没生效”，先检查是不是被这条全局样式吃掉了
- 在本仓库里，字段节奏优先用“区块容器 `gap`”控制，`margin-bottom` 只作为补充

推荐结构：

```vue
<section class="section-card section-card--basic">
  <div class="section-header km-section-header">...</div>

  <div class="project-basic-fields">
    <el-row>
      <el-form-item label="项目名称">...</el-form-item>
    </el-row>

    <el-row>
      <el-form-item label="负责人">...</el-form-item>
    </el-row>

    <el-form-item label="项目描述">...</el-form-item>
  </div>
</section>
```

默认推荐样式：

```scss
.project-basic-fields {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.section-fields {
  display: flex;
  flex-direction: column;
  gap: 22px;
}

.section-fields--content {
  display: flex;
  flex-direction: column;
  gap: 26px;
}

.project-basic-fields :deep(.el-form-item),
.section-fields :deep(.el-form-item),
.section-fields--content :deep(.el-form-item) {
  margin: 0 !important;
}
```

只有在项目没有全局清零 `el-form-item margin` 时，才考虑使用下面这种 `margin-bottom` 写法作为补充：

```scss
.project-basic-fields :deep(.el-form-item) {
  margin-bottom: 24px;
}

.section-card :deep(.el-form-item) {
  margin-bottom: 22px;
}

.section-card--content :deep(.el-form-item) {
  margin-bottom: 26px;
}
```

规则：

- 基础信息区：24px
- 常规区块：22px
- 富文本 / 上传区：26px
- 默认方案是容器 `gap`
- `margin-bottom` 不是默认解法，只在确认没有全局覆盖时使用
- 如果项目全局把 `el-form-item` margin 清零，优先改容器 `gap`，不要执着继续叠 `margin-bottom`
- 有 `el-row` / `el-col` 时，优先让“每一行”作为节奏单元，行与行之间靠外层容器 `gap` 拉开
- 同一分区内不要同时大量使用 `row margin-bottom + form-item margin-bottom + 容器 gap`，避免节奏叠加后忽大忽小

### 2. 左侧 label

左侧 label 必须加粗，并与明细表表头保持同一视觉等级：

```scss
.project-form-page :deep(.el-form-item__label) {
  font-weight: 600;
  color: var(--el-text-color-primary);
}
```

### 3. 只读信息块

类似“进度由任务完成率自动计算”这种只读字段，不要像普通输入框那样处理，应该做成弱背景信息块：

```scss
.progress-readonly-field {
  padding: 12px 14px;
  border-radius: 12px;
  background: #f8fafc;
  border: 1px solid var(--el-border-color-lighter);
}
```

## 明细表规则

### 1. 目标

明细表要更紧凑，但不能把字段控件缩得比主表更小。

这次项目里踩过坑：

- 行高想压缩时，不要优先去缩 input/select/switch 的尺寸
- 先查全局表格 padding

本项目真实问题来自全局样式：

```scss
.el-table__row .el-table__cell {
  padding: 15px 0;
}
```

所以明细表行高应该通过“覆盖表格单元格 padding”解决，而不是乱改控件大小。

### 2. 明细表压缩方式

推荐：

```scss
.edit-table {
  --el-table-cell-padding: 0;
}

.edit-table :deep(.el-table__row .el-table__cell) {
  padding-top: 2px !important;
  padding-bottom: 2px !important;
}

.edit-table :deep(.cell) {
  line-height: 1.2;
  padding-left: 6px;
  padding-right: 6px;
}

.members-table :deep(tbody tr),
.milestones-table :deep(tbody tr) {
  height: 28px;
}
```

### 3. 不要做的事

除非用户明确要求，不要为了压行高去：

- 缩小 input 高度
- 缩小 select 高度
- 缩小 date-picker 高度
- 缩小 input-number 高度
- 缩小 switch 高度

因为用户经常要的是“表格行高”，不是“控件整体变小”。

### 4. 表头风格

明细表标题行要和主表左侧 label 保持一致：

```scss
.edit-table :deep(th.el-table__cell) {
  background: color-mix(in srgb, var(--Color) 3%, #f8fafc);
  height: 34px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}
```

## 底部操作区

底部按钮区不要贴在一起，且按钮最小宽度一致：

```scss
.footer-actions :deep(.el-form-item__content) {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}

.footer-actions :deep(.el-button) {
  min-width: 112px;
}

.footer-actions :deep(.el-button + .el-button) {
  margin-left: 0;
}
```

## 操作流程

拿到一个业务表单页时，按这个顺序做：

1. 先读页面结构，不急着改样式
2. 判断它属于：新建 / 编辑 / 查看 / 审批 哪种工作台
3. 先补 Hero，再补区块分层
4. 再统一字段节奏
5. 再处理明细表密度
6. 最后处理 footer 按钮区
7. 每轮改完跑 `npm run type-check`

## 针对本仓库的约束

- 前端项目是 `nest-admin-frontend`
- 修改完成后优先运行：

```bash
npm run type-check
```

- 使用 Vue 3 + Element Plus + scoped SCSS
- 优先最小必要修改，不大拆逻辑
- 如果用户只提一个问题，例如“按钮太近”或“标题换行异常”，先做局部修复，不要趁机重构整页

## 参考案例

本 skill 基于以下页面总结：

- `src/views/business/projectManage/form.vue`

参考模板：

- `reference/project-form-template.md`

该页已经沉淀出的样式经验包括：

- Hero 说明区
- 分区卡片化
- 表单 label 加粗
- 明细表表头与 label 对齐
- 明细表只压行高，不压控件尺寸
- 底部按钮间距与最小宽度统一

## 一句话原则

业务表单页优化的重点不是“更花”，而是：

- 更清楚
- 更稳
- 更容易扫读
- 更容易录入
- 更像工作台
