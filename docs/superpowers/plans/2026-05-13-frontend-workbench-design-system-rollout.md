# Frontend Workbench Design System Rollout Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build and roll out a unified young enterprise workbench design system for the frontend, covering home, list, form, detail, and tree-table pages with shared structure, color, interaction, and theme rules.

**Architecture:** Keep existing business logic and routing intact, and standardize the frontend through a thin shared presentation layer: design tokens, page-level layout conventions, and representative sample-page refactors. Use `projectManage` and `index` as sample pages first, then propagate the proven structure to sibling pages with the same interaction model.

**Tech Stack:** Vue 3, Element Plus, scoped SCSS, existing theme variables (`--Color` family), Vite, Vitest, TypeScript where already present.

---

## Scope And Decomposition

This is a master rollout blueprint, not a single-file feature plan. It intentionally covers multiple independent but related frontend subsystems:

1. Global visual/token layer
2. Shared page skeleton conventions
3. Homepage sample
4. List-page sample
5. Form-page sample
6. Detail-page sample
7. Tree-table sample
8. Batch rollout to similar business pages

Implementation should follow this master plan first, then split into smaller execution plans per sample page or per page family if needed.

## File Structure Map

### Global style and shell layer
- Modify: `nest-admin-frontend/src/styles/element-ui.scss`
  - Responsibility: reduce global Element Plus overrides that fight page-level governance; restore safe focus states; align global component tone with the new design system.
- Modify: `nest-admin-frontend/src/styles/index.scss` or the active global style entry if present
  - Responsibility: host new semantic design tokens if the project already has a shared style entry.
- Modify: `nest-admin-frontend/src/layout/index.vue`
  - Responsibility: ensure page background, content container, and persistent workbench framing support the new page system.
- Modify: `nest-admin-frontend/src/layout/components/TopBar/index.vue`
  - Responsibility: align top-level shell spacing, active color usage, and current-state clarity with the new theme rules.
- Modify: `nest-admin-frontend/src/layout/components/Sidebar/index.vue`
  - Responsibility: align navigation current state, hover state, and theme application boundaries.

### Sample pages
- Modify: `nest-admin-frontend/src/views/index/index.vue`
  - Responsibility: homepage sample for workbench landing, summary cards, and priority layout.
- Modify: `nest-admin-frontend/src/views/business/projectManage/index.vue`
  - Responsibility: standard list-page sample with page header, query section, operation section, and table hierarchy.
- Modify: `nest-admin-frontend/src/views/business/projectManage/form.vue`
  - Responsibility: standard complex form sample with light page header, section actions, and sticky bottom action bar.
- Modify: `nest-admin-frontend/src/views/system/users/index.vue`
  - Responsibility: tree-table sample for old-style admin pages.
- Modify: one representative detail page after target is chosen
  - Responsibility: detail-page sample for summary-first read mode.

### Candidate rollout pages after samples are stable
- `nest-admin-frontend/src/views/business/taskManage/index.vue`
- `nest-admin-frontend/src/views/business/riskManage/index.vue`
- `nest-admin-frontend/src/views/business/acceptanceManage/index.vue`
- `nest-admin-frontend/src/views/business/goLiveManage/index.vue`
- `nest-admin-frontend/src/views/business/taskManage/form.vue`
- `nest-admin-frontend/src/views/business/riskManage/form.vue`
- `nest-admin-frontend/src/views/business/acceptanceManage/form.vue`
- `nest-admin-frontend/src/views/business/goLiveManage/form.vue`
- `nest-admin-frontend/src/views/business/handoverManage/form.vue`

### Existing verification points
- `nest-admin-frontend/src/views/index/index.structure.spec.ts`
- `nest-admin-frontend/src/views/index/adminindex.structure.spec.ts`
- `nest-admin-frontend/src/views/business/taskManage/form.structure.spec.ts`
- `nest-admin-frontend/src/views/system/users/users.structure.spec.ts`
- Project-wide: `npm run type-check` in `nest-admin-frontend`

---

## Task 1: Establish Global Design Tokens And Theme Boundaries

**Files:**
- Modify: `nest-admin-frontend/src/styles/element-ui.scss`
- Modify: `nest-admin-frontend/src/layout/index.vue`
- Modify: `nest-admin-frontend/src/layout/components/TopBar/index.vue`
- Modify: `nest-admin-frontend/src/layout/components/Sidebar/index.vue`
- Test: `nest-admin-frontend` type-check and manual shell review

- [ ] **Step 1: Audit current global color ownership and Element overrides**

Record and keep these responsibilities explicit in code comments or adjacent docs:

```scss
/*
  中性色秩序层：页面背景、卡片背景、边框、文字
  主题主交互层：主按钮、激活态、选中态、链接、focus
  语义状态层：成功、警告、危险、中性状态
*/
```

- [ ] **Step 2: Introduce semantic tokens without breaking current `--Color` theme plumbing**

Use semantic variables that map to existing runtime theme variables where appropriate:

```scss
:root,
html.dark {
  --page-bg: #f8fafc;
  --page-bg-subtle: #f1f5f9;
  --panel-bg: #ffffff;
  --text-primary: #0f172a;
  --text-secondary: #64748b;
  --text-tertiary: #94a3b8;
  --border-default: #e2e8f0;
  --border-strong: #cbd5e1;

  --theme-primary: var(--Color);
  --theme-primary-hover: var(--ColorLight3);
  --theme-primary-soft-bg: var(--ColorLight8);
  --theme-primary-soft-text: var(--ColorDark);

  --accent-primary: #10b981;
  --accent-soft-bg: #d1fae5;
  --accent-soft-text: #047857;

  --highlight-primary: #8b5cf6;
  --highlight-soft-bg: #ede9fe;
  --highlight-soft-text: #6d28d9;

  --state-success: #16a34a;
  --state-success-bg: #f0fdf4;
  --state-warning: #d97706;
  --state-warning-bg: #fffbeb;
  --state-danger: #dc2626;
  --state-danger-bg: #fef2f2;
  --state-neutral: #64748b;
  --state-neutral-bg: #f8fafc;
}
```

- [ ] **Step 3: Restore accessible focus states**

Replace unsafe focus suppression with visible keyboard states:

```scss
.el-button:focus-visible,
.el-input__wrapper.is-focus,
.el-textarea__inner:focus,
.el-select__wrapper.is-focused {
  outline: 2px solid color-mix(in srgb, var(--theme-primary) 42%, white);
  outline-offset: 2px;
}
```

- [ ] **Step 4: Tighten shell background, navigation state, and topbar tone**

Use neutral backgrounds and theme color only for current/active states:

```scss
.app-main,
.page {
  background: var(--page-bg);
}

.sidebar .menu-item.is-active,
.sidebar .menu-item.active {
  background: var(--theme-primary-soft-bg);
  color: var(--theme-primary-soft-text);
}
```

- [ ] **Step 5: Verify shell-level changes**

Run: `npm run type-check`

Expected:
- PASS with no Vue or TS errors
- No shell component compile regressions

---

## Task 2: Define Shared Page Skeleton Conventions

**Files:**
- Modify: representative page style blocks first, then promote repeated patterns to shared styles if duplication is proven
- Reference: `nest-admin-frontend/src/views/business/projectManage/index.vue`
- Reference: `nest-admin-frontend/src/views/business/projectManage/form.vue`
- Reference: `nest-admin-frontend/src/views/index/index.vue`

- [ ] **Step 1: Standardize `Page Header` structure**

Every page header should follow the same content model:

```vue
<div class="page-header">
  <div class="page-header__main">
    <h1 class="page-header__title">页面标题</h1>
    <p class="page-header__desc">一句话说明当前页面用途</p>
  </div>
  <div class="page-header__actions">
    <el-button>次操作</el-button>
    <el-button type="primary">主操作</el-button>
  </div>
</div>
```

- [ ] **Step 2: Standardize `Section Header` structure**

Use the same internal hierarchy across form sections, detail sections, and grouped list panels:

```vue
<div class="section-header km-section-header">
  <div>
    <div class="section-title km-section-title">分区标题</div>
    <div class="section-desc km-section-desc">分区用途说明</div>
  </div>
  <div class="section-actions">
    <el-button>局部动作</el-button>
  </div>
</div>
```

- [ ] **Step 3: Standardize container/card rhythm**

Use a small set of spacing rules:

```scss
.page-shell {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.surface-card {
  background: var(--panel-bg);
  border: 1px solid var(--border-default);
  border-radius: 14px;
}
```

- [ ] **Step 4: Verify repeated patterns before abstraction**

Rule for execution:
- First use these patterns in sample pages
- Only extract to a shared layer after the same pattern appears in 3 or more pages with minimal deviation

---

## Task 3: Refactor Homepage Sample Into Workbench Landing

**Files:**
- Modify: `nest-admin-frontend/src/views/index/index.vue`
- Test: `nest-admin-frontend/src/views/index/index.structure.spec.ts`

- [ ] **Step 1: Replace hero-like emphasis with compact workbench header**

Use this target structure:

```vue
<div class="page-shell user-home-page">
  <div class="page-header">
    <div class="page-header__main">
      <h1 class="page-header__title">工作台</h1>
      <p class="page-header__desc">优先处理待办、待阅和当前项目，快速进入今天的工作。</p>
    </div>
    <div class="page-header__actions">
      <el-button @click="goTo('/user/messages')">消息中心</el-button>
      <el-button type="primary" @click="goTo('/business/projectManage/index')">进入项目列表</el-button>
    </div>
  </div>
</div>
```

- [ ] **Step 2: Rebalance summary cards and main work areas**

Make summary cards compact and move task lists into the primary reading path:

```scss
.summary-card {
  padding: 18px;
  border: 1px solid var(--border-default);
  background: var(--panel-bg);
}

.summary-value {
  color: var(--theme-primary);
  font-size: 28px;
  font-weight: 700;
}
```

- [ ] **Step 3: Restrict modern color effects to small homepage accents**

Allow limited gradient/icon treatment only in homepage signals:

```scss
.summary-card__icon,
.quick-card__icon {
  background: linear-gradient(135deg, #10b981, #3b82f6);
}
```

- [ ] **Step 4: Upgrade empty states to next-step guidance**

Use messages like:

```vue
<el-empty description="暂无待办，可前往项目列表查看最新进展" :image-size="80" />
```

- [ ] **Step 5: Verify homepage sample**

Run: `npx vitest run src/views/index/index.structure.spec.ts`

Expected:
- PASS
- Header, summary, and content structure remain test-compatible or are updated intentionally

Run: `npm run type-check`

Expected:
- PASS

---

## Task 4: Refactor List-Page Sample Into Standard Workbench List

**Files:**
- Modify: `nest-admin-frontend/src/views/business/projectManage/index.vue`
- Reference rollout target: `nest-admin-frontend/src/views/business/taskManage/index.vue`
- Reference rollout target: `nest-admin-frontend/src/views/business/riskManage/index.vue`

- [ ] **Step 1: Add a compact page header above query and table**

Use this structure:

```vue
<div class="project-index-page page-shell">
  <div class="page-header">
    <div class="page-header__main">
      <h1 class="page-header__title">项目列表</h1>
      <p class="page-header__desc">查看项目状态、审批进展、负责人和执行风险。</p>
    </div>
  </div>
</div>
```

- [ ] **Step 2: Keep query fields in two levels: primary and advanced**

Primary query fields should remain limited to high-frequency filters.

```vue
<div class="query-section query-section--primary">
  <div class="query-grid">
    <BaInput v-model="query.name" label="项目名称" prop="name" />
    <BaSelect v-model="query.status" label="状态" prop="status" />
    <BaSelect v-model="query.priority" label="优先级" prop="priority" />
    <BaSelect v-model="query.projectType" label="项目类型" prop="projectType" />
  </div>
</div>
```

- [ ] **Step 3: Reduce table color noise and reinforce column hierarchy**

Limit theme color use to key interaction and selected rows, not status meaning:

```scss
.project-index-panel :deep(th.el-table__cell) {
  background: var(--page-bg-subtle);
  color: var(--text-secondary);
  font-weight: 600;
}

.project-index-panel :deep(.el-table__row:hover > td.el-table__cell) {
  background: var(--hover-bg-neutral);
}
```

- [ ] **Step 4: Normalize status-tag meaning**

Map status-tag color by stable semantic meaning, not per-page preference:

```ts
// 目标规则
// success: 已完成 / 已通过 / 已归档
// warning: 审批中 / 进行中 / 关注中
// danger: 驳回 / 严重风险 / 异常
// info: 草稿 / 未开始 / 默认状态
```

- [ ] **Step 5: Verify list-page sample**

Run: `npm run type-check`

Expected:
- PASS

Optional targeted visual/behavior verification if a related spec exists:

Run: `npx vitest run src/views/business/listGovernance.batch1.spec.ts`

Expected:
- PASS or update expectations intentionally if structure changed

---

## Task 5: Refactor Form-Page Sample Into Standard Entry Workbench

**Files:**
- Modify: `nest-admin-frontend/src/views/business/projectManage/form.vue`
- Reference rollout target: `nest-admin-frontend/src/views/business/acceptanceManage/form.vue`
- Reference rollout target: `nest-admin-frontend/src/views/business/goLiveManage/form.vue`
- Reference rollout target: `nest-admin-frontend/src/views/business/riskManage/form.vue`
- Reference rollout target: `nest-admin-frontend/src/views/business/taskManage/form.vue`
- Test: `nest-admin-frontend/src/views/business/taskManage/form.structure.spec.ts`

- [ ] **Step 1: Replace hero framing with compact page header**

Target structure:

```vue
<div class="page-header">
  <div class="page-header__main">
    <h1 class="page-header__title">新建项目</h1>
    <p class="page-header__desc">录入基础信息、关键成员和里程碑后可发起审批。</p>
  </div>
  <div class="page-header__actions">
    <el-button @click="submit">暂存</el-button>
    <el-button type="primary" @click="submitProjectApproval">发起项目立项审批</el-button>
  </div>
</div>
```

- [ ] **Step 2: Preserve section actions inside their own local context**

Examples that must remain local:

```vue
<div class="section-actions">
  <el-button @click="resetMilestoneTemplate">重置模板</el-button>
  <el-button type="primary" :icon="Plus" @click="addMilestoneRow">添加里程碑</el-button>
</div>
```

- [ ] **Step 3: Introduce sticky bottom action bar for long forms**

Use a neutral sticky bar, not a heavy floating panel:

```vue
<div class="sticky-form-actions">
  <div class="sticky-form-actions__meta">当前为草稿状态，可先暂存，确认后发起审批</div>
  <div class="sticky-form-actions__buttons">
    <el-button @click="submit">暂存</el-button>
    <el-button type="primary" @click="submitProjectApproval">发起项目立项审批</el-button>
    <el-button @click="cancel">取消</el-button>
  </div>
</div>
```

```scss
.sticky-form-actions {
  position: sticky;
  bottom: 0;
  display: flex;
  justify-content: space-between;
  gap: 16px;
  padding: 12px 20px;
  background: rgba(255, 255, 255, 0.92);
  border-top: 1px solid var(--border-default);
  backdrop-filter: blur(8px);
}
```

- [ ] **Step 4: Keep form sections white and neutral; use color only for state and AI-style helper blocks**

```scss
.section-card {
  background: var(--panel-bg);
  border: 1px solid var(--border-default);
}

.smart-hint {
  background: var(--accent-soft-bg);
  color: var(--accent-soft-text);
  border: 1px solid var(--accent-soft-border);
}
```

- [ ] **Step 5: Verify form-page sample**

Run: `npm run type-check`

Expected:
- PASS

Run: `npx vitest run src/views/business/taskManage/form.structure.spec.ts`

Expected:
- PASS or update expectations intentionally if the shared structure changes

---

## Task 6: Establish Detail-Page And Tree-Table Samples, Then Roll Out By Page Family

**Files:**
- Modify: one chosen detail page under `nest-admin-frontend/src/views/business/**`
- Modify: `nest-admin-frontend/src/views/system/users/index.vue`
- Reference rollout targets: sibling business detail pages and old admin pages
- Test: `nest-admin-frontend/src/views/system/users/users.structure.spec.ts`

- [ ] **Step 1: Pick one representative detail page and refactor it into summary-first read mode**

Target structure:

```vue
<div class="page-shell detail-page">
  <div class="page-header">
    <div class="page-header__main">
      <h1 class="page-header__title">详情页标题</h1>
      <p class="page-header__desc">查看对象状态、关键摘要和关联记录。</p>
    </div>
  </div>

  <section class="surface-card detail-summary">关键摘要</section>
  <section class="surface-card detail-section">基本信息</section>
  <section class="surface-card detail-section">关联记录</section>
</div>
```

- [ ] **Step 2: Refactor `system/users/index.vue` into navigation + standard work area**

Keep the left tree as range navigation and the right pane as a normal list workbench.

```vue
<div class="tree-table-page">
  <aside class="tree-table-page__nav">组织范围导航</aside>
  <section class="tree-table-page__workbench">标准列表工作区</section>
</div>
```

- [ ] **Step 3: Remove visual legacy patterns before batch rollout**

Specifically watch for:
- ad-hoc inline colors
- old boxed title bars
- tools-first left trees
- full-width forms with no grouping
- multi-color tag overuse

- [ ] **Step 4: Roll out by family after samples are verified**

Recommended order:
1. Business list pages
2. Business form pages
3. Business detail pages
4. System tree-table pages
5. Remaining low-frequency admin pages

- [ ] **Step 5: Verify final sample set before family rollout**

Run: `npm run type-check`

Expected:
- PASS

Run: `npx vitest run src/views/system/users/users.structure.spec.ts`

Expected:
- PASS or update intentionally with structure changes

---

## Verification Matrix

Use this verification order during execution:

1. Global style or shell change:
   - `npm run type-check`
2. Homepage change:
   - `npx vitest run src/views/index/index.structure.spec.ts`
   - `npm run type-check`
3. List-page sample change:
   - `npm run type-check`
   - related structure spec if one exists
4. Form-page sample change:
   - `npx vitest run src/views/business/taskManage/form.structure.spec.ts`
   - `npm run type-check`
5. Tree-table sample change:
   - `npx vitest run src/views/system/users/users.structure.spec.ts`
   - `npm run type-check`

---

## Rollout Rules

1. Do not abstract shared components before the same structure is proven in at least 3 pages.
2. Keep business logic, data loading, and permissions unchanged during UI governance unless the UI change reveals an actual bug.
3. Use theme color only for primary interaction, selected state, and focused state.
4. Keep state semantics fixed across pages.
5. Favor page-level scoped SCSS first; promote shared styles only after convergence is proven.
6. For long forms, sticky bottom action bars are the standard; pure bottom-only actions are not.

---

## Risks And Controls

### Risk 1: Global Element overrides break sample-page spacing
Control:
- Change global rules conservatively
- Verify sample pages after each shell/global edit

### Risk 2: Theme color leaks into neutral structure
Control:
- Only theme primary, selected states, links, and focus may use user theme color
- Keep background, text, border, and semantic state layers fixed

### Risk 3: Old pages diverge from new sample pages
Control:
- Freeze new page structure choices once the sample set is approved
- Treat sample pages as reference templates for subsequent work

### Risk 4: Sticky action bars become visually heavy
Control:
- Keep sticky bar white/neutral
- Use one primary button only
- Avoid gradient bars or large tinted backgrounds

---

## Execution Handoff

Plan complete and saved to `docs/superpowers/plans/2026-05-13-frontend-workbench-design-system-rollout.md`.

Two execution options:

**1. Subagent-Driven (recommended)** - I dispatch a fresh subagent per task, review between tasks, fast iteration

**2. Inline Execution** - Execute tasks in this session using executing-plans, batch execution with checkpoints

Which approach?
