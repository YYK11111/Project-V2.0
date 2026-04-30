# 首页打磨、默认跳转与驾驶舱修复 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 打磨 `/index` 用户首页与 `/adminindex` 系统首页的视觉层级，补齐按 `dashboard/adminIndex` 权限区分的根路径默认跳转，并将驾驶舱项目下拉修复作为独立小提交并入 `main`。

**Architecture:** 继续沿用已完成的双首页拆分，不重做架构。前端部分只在首页页面和现有路由守卫内收紧默认跳转与视觉表现；后端部分只保留并提交已经定位的 `getCockpit()` 数据读取修复与对应回归测试。

**Tech Stack:** Vue 3、Vue Router、Pinia、Element Plus、Vitest、TypeScript、NestJS、Jest

---

## 文件结构

- Modify: `nest-admin-frontend/src/views/index/index.vue`
  - 用户首页视觉打磨，强化工作台感与信息层级。
- Modify: `nest-admin-frontend/src/views/index/adminindex.vue`
  - 系统首页视觉打磨，强化驾驶舱感与概览节奏。
- Modify: `nest-admin-frontend/src/router/permission.js`
  - 显式按 `dashboard/adminIndex` 决定 `/` 默认落点。
- Modify: `nest-admin-frontend/src/views/index/home.routes.spec.ts`
  - 为默认跳转规则补源码级断言或必要说明断言。
- Modify: `nest-admin-frontend/src/views/index/index.structure.spec.ts`
  - 补用户首页视觉层级相关最小结构断言。
- Modify: `nest-admin-frontend/src/views/index/adminindex.structure.spec.ts`
  - 补系统首页视觉层级相关最小结构断言。
- Modify: `nest-admin/src/modulesBusi/projects/service.ts`
  - 保持 `getCockpit()` 使用 `list()` 返回值的 `list` 字段。
- Modify: `nest-admin/src/modulesBusi/projects/service.spec.ts`
  - 保持并验证“驾驶舱项目下拉使用 `list` 字段”的回归测试。

## 实现约束

1. 用户首页继续是 `/index`，系统首页继续是 `/adminindex`。
2. 根路径 `/` 的默认落点必须只按 `dashboard/adminIndex` 是否存在于 `permissions` 判断。
3. 不改动现有系统首页权限模型，不按角色名硬编码。
4. 驾驶舱修复要作为独立提交，不和首页打磨混成一个提交。
5. 不新增首页后端聚合接口。

### Task 1: 打磨用户首页视觉层级

**Files:**
- Modify: `nest-admin-frontend/src/views/index/index.vue`
- Modify: `nest-admin-frontend/src/views/index/index.structure.spec.ts`

- [ ] **Step 1: 先补用户首页视觉结构失败测试**

在 `nest-admin-frontend/src/views/index/index.structure.spec.ts` 追加以下断言，让测试先表达用户首页需要具备更明确的工作台层级：

```ts
it('用户首页保留欢迎区并强化工作台层级', () => {
  const source = readSource()

  expect(source).toContain('围绕消息、项目和知识入口开始今天的工作。')
  expect(source).toContain('当前待办')
  expect(source).toContain('当前待阅')
  expect(source).toContain('参与项目')
  expect(source).toContain('负责人：')
})
```

- [ ] **Step 2: 运行用户首页结构测试，确认先失败**

Run: `npm run test:unit -- src/views/index/index.structure.spec.ts`

Expected: FAIL，若现有文案或结构缺少上述断言项则应先红。

- [ ] **Step 3: 最小打磨用户首页视觉**

修改 `nest-admin-frontend/src/views/index/index.vue`，仅在现有用户首页基础上增强层级，不改变页面职责。

要求：

1. 欢迎区保留头像与问候，但让右侧版本信息更弱。
2. `我的工作摘要` 卡片更像工作台摘要，而不是普通信息块。
3. `我的待办`、`我的待阅` 列表卡片增加更明显的条目层级。
4. `我参与的项目` 卡片强化项目名、状态、负责人、进度的视觉优先级。
5. `快捷入口` 维持轻量，但整体视觉更统一。

最低实现要求：

```ts
const workSummaryCards = computed<SummaryCardItem[]>(() => [
  { title: '当前待办', value: unread.value.todo || 0, path: '/user/messages' },
  { title: '当前待阅', value: unread.value.cc || 0, path: '/user/messages' },
  { title: '参与项目', value: projectList.value.length || 0, path: '/business/projectManage/index' },
  {
    title: '我负责项目',
    value: projectList.value.filter((item) => getProjectOwner(item) === userStore.name).length,
    path: '/business/projectManage/index',
  },
])
```

如果真实接口字段不足以稳定计算“我负责项目”，允许保留三卡，但样式层级必须完成。

- [ ] **Step 4: 再次运行用户首页结构测试**

Run: `npm run test:unit -- src/views/index/index.structure.spec.ts`

Expected: PASS。

### Task 2: 打磨系统首页视觉层级

**Files:**
- Modify: `nest-admin-frontend/src/views/index/adminindex.vue`
- Modify: `nest-admin-frontend/src/views/index/adminindex.structure.spec.ts`

- [ ] **Step 1: 先补系统首页视觉结构失败测试**

在 `nest-admin-frontend/src/views/index/adminindex.structure.spec.ts` 追加：

```ts
it('系统首页具备更强的驾驶舱导语和管理导向', () => {
  const source = readSource()

  expect(source).toContain('集中查看系统状态、访问趋势和后台管理入口。')
  expect(source).toContain('当前在线人数')
  expect(source).toContain('未读系统消息')
  expect(source).toContain('系统日志')
})
```

- [ ] **Step 2: 运行系统首页结构测试，确认先失败**

Run: `npm run test:unit -- src/views/index/adminindex.structure.spec.ts`

Expected: FAIL，如果当前结构尚未满足新增断言项则应先红。

- [ ] **Step 3: 最小打磨系统首页视觉**

修改 `nest-admin-frontend/src/views/index/adminindex.vue`，只强化概览感和驾驶舱感，不改页面职责。

要求：

1. 顶部 Hero 更明确区分“系统首页”。
2. `系统概览` 数字卡片更强。
3. `管理工作摘要` 卡片与 `系统概览` 区分层级。
4. `系统管理快捷入口` 更像操作面板。
5. 趋势图区继续保留，但视觉上位于概览和入口之后。

最低结构要求示例：

```vue
<div class="hero-copy">
  <div class="wel --Color">系统首页</div>
  <div class="hero-desc">集中查看系统状态、访问趋势和后台管理入口。</div>
</div>
```

- [ ] **Step 4: 再次运行系统首页结构测试**

Run: `npm run test:unit -- src/views/index/adminindex.structure.spec.ts`

Expected: PASS。

### Task 3: 补根路径默认首页分流

**Files:**
- Modify: `nest-admin-frontend/src/router/permission.js`
- Modify: `nest-admin-frontend/src/views/index/home.routes.spec.ts`

- [ ] **Step 1: 先补默认跳转规则失败测试**

在 `nest-admin-frontend/src/views/index/home.routes.spec.ts` 追加以下源码级断言：

```ts
it('根路径默认落点按 dashboard/adminIndex 权限显式分流', () => {
  const permissionSource = readFileSync(resolve(__dirname, '..', '..', 'router', 'permission.js'), 'utf-8')

  expect(permissionSource).toContain("permissions?.includes('dashboard/adminIndex')")
  expect(permissionSource).toContain("return { path: '/adminindex', replace: true }")
  expect(permissionSource).toContain("return { path: '/index', replace: true }")
})
```

如果测试文件没有 `permission.js` 读取函数，就在同文件补一个最小版本。

- [ ] **Step 2: 运行首页路由测试，确认先失败**

Run: `npm run test:unit -- src/views/index/home.routes.spec.ts`

Expected: FAIL，因为当前 `/` 仍是按首个可见菜单落点分流。

- [ ] **Step 3: 在路由守卫中显式按权限决定 `/` 落点**

修改 `nest-admin-frontend/src/router/permission.js`，只在 `to.path === '/'` 场景下改默认落点，不影响明确业务路径。

推荐增加一个小函数：

```js
function getDefaultHomePath(permissions = []) {
  if (permissions?.includes('*') || permissions?.includes('dashboard/adminIndex')) {
    return '/adminindex'
  }
  return '/index'
}
```

并将原本依赖 `firstVisibleRoute?.path` 的 `/` 默认处理，最小改成：

```js
if (to.path === '/') {
  clearInitialBrowserPath()
  return { path: getDefaultHomePath(userStore.permissions || []), replace: true }
}
```

要求：

1. 只改根路径 `/` 的默认落点。
2. 不改变直接访问 `/adminindex`、`/index` 或业务详情页的行为。
3. 保留现有 `hasRoutePermission()` 逻辑。

- [ ] **Step 4: 再次运行首页路由测试**

Run: `npm run test:unit -- src/views/index/home.routes.spec.ts`

Expected: PASS。

### Task 4: 驾驶舱项目下拉修复独立收口

**Files:**
- Modify: `nest-admin/src/modulesBusi/projects/service.ts`
- Modify: `nest-admin/src/modulesBusi/projects/service.spec.ts`

- [ ] **Step 1: 确认现有回归测试仍能覆盖根因**

检查 `nest-admin/src/modulesBusi/projects/service.spec.ts` 中已有的测试：

```ts
it('驾驶舱应使用项目列表返回的 list 字段生成项目选项', async () => {
  // ...
})
```

如果存在且覆盖当前修复点，不新增重复测试。

- [ ] **Step 2: 运行后端驾驶舱修复测试，确认当前状态**

Run: `npm test -- src/modulesBusi/projects/service.spec.ts --runInBand`

Expected:

1. 如果 `service.ts` 里已是 `projectListRes?.list || []`，则直接 PASS。
2. 如果被回退，则 FAIL，并重新指向同一根因。

- [ ] **Step 3: 保持或恢复最小修复实现**

确保 `nest-admin/src/modulesBusi/projects/service.ts` 中的实现是：

```ts
const projectListRes = await this.list(query);
const rawProjects = projectListRes?.list || [];
```

不要改成 `data`、`rows` 或其它字段。

- [ ] **Step 4: 再次运行后端测试验证修复**

Run: `npm test -- src/modulesBusi/projects/service.spec.ts --runInBand`

Expected: PASS。

- [ ] **Step 5: 在 `nest-admin` 中运行最小 lint 验证**

Run: `npm run lint`

Expected: PASS。

### Task 5: 综合验证与分拆提交

**Files:**
- No new files; verify and commit previous changes

- [ ] **Step 1: 运行首页相关前端验证**

Run:

```bash
npm run test:unit -- src/views/index/home.routes.spec.ts
npm run test:unit -- src/views/index/index.structure.spec.ts
npm run test:unit -- src/views/index/adminindex.structure.spec.ts
npm run type-check
```

Expected: 全部 PASS。

- [ ] **Step 2: 分开查看前端首页改动与后端驾驶舱改动**

Run:

```bash
git diff -- nest-admin-frontend/src/router/permission.js nest-admin-frontend/src/views/index/index.vue nest-admin-frontend/src/views/index/adminindex.vue nest-admin-frontend/src/views/index/api.ts nest-admin-frontend/src/views/index/home.routes.spec.ts nest-admin-frontend/src/views/index/index.structure.spec.ts nest-admin-frontend/src/views/index/adminindex.structure.spec.ts
git diff -- nest-admin/src/modulesBusi/projects/service.ts nest-admin/src/modulesBusi/projects/service.spec.ts
```

Expected:

1. 前端首页改动和后端驾驶舱改动边界清晰。
2. 没有互相混杂。

- [ ] **Step 3: 先提交首页前端打磨与默认跳转**

Run:

```bash
git add nest-admin-frontend/src/router/permission.js nest-admin-frontend/src/views/index/index.vue nest-admin-frontend/src/views/index/adminindex.vue nest-admin-frontend/src/views/index/api.ts nest-admin-frontend/src/views/index/home.routes.spec.ts nest-admin-frontend/src/views/index/index.structure.spec.ts nest-admin-frontend/src/views/index/adminindex.structure.spec.ts
git commit -m "feat: polish homepages and default routing"
```

Expected: 提交成功。

- [ ] **Step 4: 再单独提交驾驶舱修复**

Run:

```bash
git add nest-admin/src/modulesBusi/projects/service.ts nest-admin/src/modulesBusi/projects/service.spec.ts
git commit -m "fix: restore cockpit project options"
```

Expected: 提交成功。

## 自检

1. Spec coverage: 已覆盖用户首页视觉打磨、系统首页视觉打磨、根路径默认跳转、`/adminindex` 权限分流、驾驶舱下拉修复独立提交。
2. Placeholder scan: 无 `TODO`、`TBD`、无“按需补齐”类空泛步骤。
3. Type consistency: 统一使用 `dashboard/adminIndex`、`/index`、`/adminindex`、`getDefaultHomePath()`、`projectListRes?.list || []` 这些关键约定。
