# Project Form Template

用于本仓库业务表单页的参考模板，适合：

- 新增页
- 编辑页
- 查看态表单页
- 审批前置资料页

## 推荐结构

```vue
<template>
  <div class="project-form-page km-page">
    <div class="project-form-hero Gcard km-hero">
      <div class="project-form-hero__eyebrow km-hero__eyebrow">模块名称</div>
      <div class="project-form-hero__title km-hero__title">当前页面的核心任务</div>
      <div class="project-form-hero__desc km-hero__desc">先完成最关键的信息，再补齐辅助内容，保证资料完整、执行清晰、后续流程顺畅。</div>

      <div class="project-form-hero__stats">
        <div class="project-form-hero__stat">
          <div class="project-form-hero__stat-label">当前模式</div>
          <div class="project-form-hero__stat-value">新增 / 编辑 / 查看</div>
        </div>
        <div class="project-form-hero__stat">
          <div class="project-form-hero__stat-label">状态</div>
          <div class="project-form-hero__stat-value">草稿 / 审批中 / 已完成</div>
        </div>
        <div class="project-form-hero__stat">
          <div class="project-form-hero__stat-label">关键条目数</div>
          <div class="project-form-hero__stat-value">3</div>
        </div>
      </div>
    </div>

    <div class="Gcard km-panel project-form-shell">
      <div class="project-form-shell__top">
        <el-page-header @back="$router.back()" title="页面标题" />
      </div>

      <el-form label-width="100px">
        <div class="project-sections">
          <section class="section-card section-card--basic">
            <div class="section-header section-header--stack km-section-header">
              <div>
                <div class="section-title km-section-title">基本信息</div>
                <div class="section-desc km-section-desc">维护这组信息时最重要的目标说明。</div>
              </div>
            </div>

            <div class="project-basic-fields">
              <el-row :gutter="20" class="basic-info-row">
                <el-col :xs="24" :sm="12">
                  <el-form-item label="字段A">
                    <el-input />
                  </el-form-item>
                </el-col>
                <el-col :xs="24" :sm="12">
                  <el-form-item label="字段B">
                    <el-select />
                  </el-form-item>
                </el-col>
              </el-row>

              <el-form-item label="只读信息" class="basic-info-progress-item">
                <div class="progress-readonly-field">
                  <div>这里展示只读结果</div>
                  <div class="progress-readonly-field__tip">补充解释或计算逻辑</div>
                </div>
              </el-form-item>
            </div>
          </section>

          <section class="section-card section-card--table">
            <div class="section-header km-section-header">
              <div>
                <div class="section-title km-section-title">明细表</div>
                <div class="section-desc km-section-desc">说明这张表维护什么内容。</div>
              </div>
              <el-button type="primary">添加</el-button>
            </div>

            <div class="table-wrapper">
              <el-table class="edit-table">
                <el-table-column label="列A" />
                <el-table-column label="列B" />
              </el-table>
            </div>
          </section>

          <section class="section-card section-card--content">
            <div class="section-header section-header--stack km-section-header">
              <div>
                <div class="section-title km-section-title">描述与附件</div>
                <div class="section-desc km-section-desc">补充背景说明、正文和附件资料。</div>
              </div>
            </div>

            <el-form-item label="描述">
              <Editor style="min-height: 260px" />
            </el-form-item>

            <el-form-item label="附件" class="project-attachments-item">
              <Upload type="file" multiple />
            </el-form-item>
          </section>
        </div>

        <el-form-item class="footer-actions">
          <el-button type="primary">暂存</el-button>
          <el-button type="warning">提交审批</el-button>
          <el-button>取消</el-button>
        </el-form-item>
      </el-form>
    </div>
  </div>
</template>
```

## 推荐样式骨架

```scss
.project-form-hero__title {
  max-width: none;
  white-space: nowrap;
}

.project-form-hero__desc {
  margin-bottom: 24px;
  max-width: none;
  white-space: nowrap;
}

.project-form-hero__stats {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;
}

.project-form-hero__stat {
  padding: 14px 16px;
  border-radius: 14px;
  background: rgba(255, 255, 255, 0.82);
  border: 1px solid color-mix(in srgb, var(--Color) 8%, var(--el-border-color-lighter));
}

.project-sections {
  display: flex;
  flex-direction: column;
  gap: 22px;
}

.section-card {
  padding: 22px;
  background: #fff;
  border: 1px solid color-mix(in srgb, var(--Color) 8%, var(--el-border-color-lighter));
  border-radius: 14px;
}

.project-basic-fields :deep(.el-form-item) {
  margin-bottom: 24px;
}

.section-card :deep(.el-form-item) {
  margin-bottom: 22px;
}

.section-card--content :deep(.el-form-item) {
  margin-bottom: 26px;
}

.project-form-page :deep(.el-form-item__label) {
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.progress-readonly-field {
  padding: 12px 14px;
  border-radius: 12px;
  background: #f8fafc;
  border: 1px solid var(--el-border-color-lighter);
}

.edit-table {
  --el-table-cell-padding: 0;
}

.edit-table :deep(th.el-table__cell) {
  background: color-mix(in srgb, var(--Color) 3%, #f8fafc);
  height: 34px;
  font-weight: 600;
  color: var(--el-text-color-primary);
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

.footer-actions :deep(.el-form-item__content) {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}

.footer-actions :deep(.el-button) {
  min-width: 112px;
}

@media (max-width: 768px) {
  .project-form-hero__title,
  .project-form-hero__desc {
    white-space: normal;
  }

  .section-card {
    padding: 18px;
  }
}
```

## 使用时的注意事项

### 1. 先调结构，再调细节

顺序固定：

1. Hero
2. 分区卡片
3. 字段间距
4. label 权重
5. 明细表行高
6. footer 按钮

### 2. 明细表只压行高

如果用户说“明细表行高太高”，优先调整：

- `td` padding
- `.cell` padding
- 表格行高度

不要先缩：

- input 高度
- select 高度
- switch 尺寸

除非用户明确说“控件也太大”。

### 3. 标题和说明单行显示

只有在用户明确要求“必须一行显示”时才这么做。否则默认允许自然换行。

### 4. 每次修改后验证

```bash
cd nest-admin-frontend
npm run type-check
```

## 最适合套用的页面类型

- `form.vue`
- `aev.vue`
- `approval.vue`
- `config.vue`
- `create.vue`
- `edit.vue`

## 不建议直接套的页面

- 纯 dashboard
- 纯详情阅读页
- 搜索结果页
- 营销展示页
