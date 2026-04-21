# Project Page Dark Mode Governance Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 完成项目页面 `detail.vue`、`approval.vue`、`cockpit.vue` 的暗黑模式继续治理，并用自动化测试防止固定浅色样式回归。

**Architecture:** 直接在现有页面样式块中做最小必要替换，统一复用 Element Plus 主题变量和 `color-mix(...)`。新增一个源码守卫单测，通过读取目标页面源码，约束不能再出现固定浅色样式值，同时要求保留主题变量适配。

**Tech Stack:** Vue 3, Vite, Vitest, Element Plus, scoped CSS

---

### Task 1: 编写暗黑样式守卫测试

**Files:**
- Create: `nest-admin-frontend/src/views/business/projectManage/projectManage.dark-mode.spec.ts`
- Modify: `docs/superpowers/specs/2026-04-21-project-page-dark-mode-governance-design.md`
- Modify: `docs/superpowers/plans/2026-04-21-project-page-dark-mode-governance.md`

- [ ] **Step 1: 写出失败测试**

```ts
import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const projectManageDir = resolve(__dirname)

function readView(name: string) {
  return readFileSync(resolve(projectManageDir, `${name}.vue`), 'utf-8')
}

describe('projectManage 页面暗黑模式样式守卫', () => {
  it('approval 页面不再使用固定浅色样式值', () => {
    const source = readView('approval')
    expect(source).not.toMatch(/#fff\b/i)
    expect(source).not.toMatch(/#ebeef5/i)
    expect(source).not.toMatch(/#303133/i)
    expect(source).not.toMatch(/#909399/i)
    expect(source).toMatch(/var\(--el-/)
  })

  it('detail 页面使用主题变量或颜色混合而不是浅色白底', () => {
    const source = readView('detail')
    expect(source).not.toMatch(/rgba\(255,\s*255,\s*255/i)
    expect(source).not.toMatch(/#ffffff/i)
    expect(source).toMatch(/color-mix\(/)
    expect(source).toMatch(/var\(--el-/)
  })

  it('cockpit 页面语义卡片使用主题兼容样式', () => {
    const source = readView('cockpit')
    expect(source).toMatch(/color-mix\(/)
    expect(source).toMatch(/var\(--el-/)
  })
})
```

- [ ] **Step 2: 运行测试并确认失败**

Run: `npm run test:unit -- src/views/business/projectManage/projectManage.dark-mode.spec.ts`

Expected: FAIL，因为 `approval.vue` 和 `detail.vue` 仍包含固定浅色值或白底写法。

- [ ] **Step 3: 保持测试文件不变，开始实现页面样式修复**

```ts
// 测试文件保持不变，后续通过页面样式修复让测试转绿。
```

- [ ] **Step 4: 再次运行目标测试，确认仍失败直到样式修复完成**

Run: `npm run test:unit -- src/views/business/projectManage/projectManage.dark-mode.spec.ts`

Expected: 仍然 FAIL，失败信息指向固定浅色样式或缺少主题变量。

- [ ] **Step 5: 提交当前任务改动**

```bash
git add docs/superpowers/specs/2026-04-21-project-page-dark-mode-governance-design.md docs/superpowers/plans/2026-04-21-project-page-dark-mode-governance.md nest-admin-frontend/src/views/business/projectManage/projectManage.dark-mode.spec.ts
git commit -m "test: guard project pages dark mode styles"
```

### Task 2: 修复 approval 页面固定浅色样式

**Files:**
- Modify: `nest-admin-frontend/src/views/business/projectManage/approval.vue:547-627`
- Test: `nest-admin-frontend/src/views/business/projectManage/projectManage.dark-mode.spec.ts`

- [ ] **Step 1: 让 approval 的测试继续定义预期行为**

```ts
it('approval 页面不再使用固定浅色样式值', () => {
  const source = readView('approval')
  expect(source).not.toMatch(/#fff\b/i)
  expect(source).not.toMatch(/#ebeef5/i)
  expect(source).not.toMatch(/#303133/i)
  expect(source).not.toMatch(/#909399/i)
  expect(source).toMatch(/var\(--el-/)
})
```

- [ ] **Step 2: 运行单测确认 approval 用例失败**

Run: `npm run test:unit -- src/views/business/projectManage/projectManage.dark-mode.spec.ts`

Expected: FAIL，失败位置指向 `approval.vue` 源码中的硬编码颜色。

- [ ] **Step 3: 修改 approval 样式为主题变量**

```vue
<style scoped>
.section-card {
  padding: 20px;
  background: var(--el-bg-color);
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 12px;
}

.section-title {
  font-size: 16px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.section-desc {
  margin-top: 4px;
  color: var(--el-text-color-secondary);
  font-size: 13px;
}
</style>
```

- [ ] **Step 4: 运行单测确认 approval 用例通过**

Run: `npm run test:unit -- src/views/business/projectManage/projectManage.dark-mode.spec.ts`

Expected: approval 相关断言通过，其他未修页面可能仍失败。

- [ ] **Step 5: 提交当前任务改动**

```bash
git add nest-admin-frontend/src/views/business/projectManage/approval.vue nest-admin-frontend/src/views/business/projectManage/projectManage.dark-mode.spec.ts
git commit -m "fix: align project approval page with dark theme"
```

### Task 3: 修复 detail 页面暗黑模式卡片与语义块

**Files:**
- Modify: `nest-admin-frontend/src/views/business/projectManage/detail.vue:2044-2819`
- Test: `nest-admin-frontend/src/views/business/projectManage/projectManage.dark-mode.spec.ts`

- [ ] **Step 1: 保持 detail 测试作为行为约束**

```ts
it('detail 页面使用主题变量或颜色混合而不是浅色白底', () => {
  const source = readView('detail')
  expect(source).not.toMatch(/rgba\(255,\s*255,\s*255/i)
  expect(source).not.toMatch(/#ffffff/i)
  expect(source).toMatch(/color-mix\(/)
  expect(source).toMatch(/var\(--el-/)
})
```

- [ ] **Step 2: 运行单测确认 detail 用例失败**

Run: `npm run test:unit -- src/views/business/projectManage/projectManage.dark-mode.spec.ts`

Expected: FAIL，失败信息来自 `detail.vue` 中的白底和浅色渐变。

- [ ] **Step 3: 用最小修改替换 detail 关键样式**

```vue
<style scoped>
.project-hero {
  border: 1px solid var(--el-border-color-light);
  background: linear-gradient(
    135deg,
    color-mix(in srgb, var(--Color) 4%, var(--el-bg-color)) 0%,
    var(--el-bg-color) 55%,
    color-mix(in srgb, var(--el-color-primary) 4%, var(--el-fill-color-extra-light)) 100%
  );
}

.hero-action-card,
.hero-stat-card {
  border: 1px solid var(--el-border-color-lighter);
  background: color-mix(in srgb, var(--el-bg-color) 88%, var(--el-fill-color-extra-light));
}

.plan-sprint-card {
  border: 1px solid var(--el-border-color-lighter);
  background: linear-gradient(
    180deg,
    var(--el-bg-color) 0%,
    color-mix(in srgb, var(--el-bg-color) 88%, var(--el-fill-color-extra-light)) 100%
  );
}
```

- [ ] **Step 4: 运行单测确认 detail 用例通过**

Run: `npm run test:unit -- src/views/business/projectManage/projectManage.dark-mode.spec.ts`

Expected: detail 相关断言通过。

- [ ] **Step 5: 提交当前任务改动**

```bash
git add nest-admin-frontend/src/views/business/projectManage/detail.vue nest-admin-frontend/src/views/business/projectManage/projectManage.dark-mode.spec.ts
git commit -m "fix: tune project detail page dark mode surfaces"
```

### Task 4: 检查并修复 cockpit 页面摘要卡与告警块

**Files:**
- Modify: `nest-admin-frontend/src/views/business/projectManage/cockpit.vue:615-936`
- Test: `nest-admin-frontend/src/views/business/projectManage/projectManage.dark-mode.spec.ts`

- [ ] **Step 1: 保持 cockpit 测试定义预期**

```ts
it('cockpit 页面语义卡片使用主题兼容样式', () => {
  const source = readView('cockpit')
  expect(source).toMatch(/color-mix\(/)
  expect(source).toMatch(/var\(--el-/)
})
```

- [ ] **Step 2: 运行单测确认 cockpit 断言初始失败或不足**

Run: `npm run test:unit -- src/views/business/projectManage/projectManage.dark-mode.spec.ts`

Expected: 如果未使用 `color-mix(...)`，该断言失败。

- [ ] **Step 3: 修改 cockpit 摘要卡和告警块样式**

```vue
<style scoped>
.summary-card--active {
  background: linear-gradient(
    135deg,
    color-mix(in srgb, var(--el-color-primary) 14%, var(--el-bg-color)),
    color-mix(in srgb, var(--el-color-primary) 4%, var(--el-fill-color-extra-light))
  );
}

.cockpit-alert-item--danger {
  background: color-mix(in srgb, var(--el-color-danger) 10%, var(--el-bg-color));
  border-color: color-mix(in srgb, var(--el-color-danger) 22%, var(--el-border-color-lighter));
}
</style>
```

- [ ] **Step 4: 运行单测确认全部通过**

Run: `npm run test:unit -- src/views/business/projectManage/projectManage.dark-mode.spec.ts`

Expected: PASS，3 个页面的暗黑样式守卫断言全部通过。

- [ ] **Step 5: 提交当前任务改动**

```bash
git add nest-admin-frontend/src/views/business/projectManage/cockpit.vue nest-admin-frontend/src/views/business/projectManage/projectManage.dark-mode.spec.ts
git commit -m "fix: refine project cockpit dark mode cards"
```

### Task 5: 完整验证并准备收尾

**Files:**
- Modify: `nest-admin-frontend/src/views/business/projectManage/approval.vue`
- Modify: `nest-admin-frontend/src/views/business/projectManage/detail.vue`
- Modify: `nest-admin-frontend/src/views/business/projectManage/cockpit.vue`
- Create: `nest-admin-frontend/src/views/business/projectManage/projectManage.dark-mode.spec.ts`

- [ ] **Step 1: 运行暗黑样式守卫单测**

Run: `npm run test:unit -- src/views/business/projectManage/projectManage.dark-mode.spec.ts`

Expected: PASS，3 tests passed。

- [ ] **Step 2: 运行前端类型检查**

Run: `npm run type-check`

Expected: PASS，退出码为 0。

- [ ] **Step 3: 检查工作区差异**

Run: `git status --short && git diff -- nest-admin-frontend/src/views/business/projectManage/approval.vue nest-admin-frontend/src/views/business/projectManage/detail.vue nest-admin-frontend/src/views/business/projectManage/cockpit.vue nest-admin-frontend/src/views/business/projectManage/projectManage.dark-mode.spec.ts docs/superpowers/specs/2026-04-21-project-page-dark-mode-governance-design.md docs/superpowers/plans/2026-04-21-project-page-dark-mode-governance.md`

Expected: 差异只包含目标页面、测试文件和文档文件。

- [ ] **Step 4: 生成最终提交**

```bash
git add docs/superpowers/specs/2026-04-21-project-page-dark-mode-governance-design.md docs/superpowers/plans/2026-04-21-project-page-dark-mode-governance.md nest-admin-frontend/src/views/business/projectManage/approval.vue nest-admin-frontend/src/views/business/projectManage/detail.vue nest-admin-frontend/src/views/business/projectManage/cockpit.vue nest-admin-frontend/src/views/business/projectManage/projectManage.dark-mode.spec.ts
git commit -m "fix: continue dark mode governance for project pages"
```

- [ ] **Step 5: 评估收尾与合并路径**

```bash
git status --short --branch
git log --oneline -5
```

Expected: 工作区干净或只剩未纳入本次的既有改动，可继续决定是否创建 PR 或合并。
