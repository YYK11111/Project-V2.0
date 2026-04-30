# 双首页拆分 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 将现有统一首页拆分为 `/index` 用户首页和 `/adminindex` 系统首页，并让系统首页按实际权限配置控制可见与可访问。

**Architecture:** 保留现有首页文件作为用户首页基础，通过新增系统首页页面和显式路由完成双入口拆分。用户首页优先复用消息中心、项目列表与当前首页统计接口；系统首页优先复用现有系统统计与管理入口，不先引入新的后端聚合接口。

**Tech Stack:** Vue 3、Vue Router、Pinia、Element Plus、现有 `request` API 封装、现有菜单/权限体系

---

## 文件结构

- Modify: `nest-admin-frontend/src/views/index/index.vue`
  - 将当前通用首页重构为用户首页，突出待办、待阅、参与项目、快捷入口。
- Modify: `nest-admin-frontend/src/views/index/api.ts`
  - 扩展首页复用 API，按最小范围补用户首页所需请求封装。
- Create: `nest-admin-frontend/src/views/index/adminindex.vue`
  - 新增系统首页页面，展示系统摘要、管理快捷入口、趋势图表。
- Modify: `nest-admin-frontend/src/router/routes.js`
  - 增加 `/adminindex` 路由与首页显示配置，确保两个页面都在导航中可见。
- Create or Modify: `nest-admin-frontend/src/views/index/index.spec.ts` 或现有 route/spec 文件
  - 增加双首页路由与权限显示相关的最小前端回归测试。
- Optional Modify: `nest-admin-frontend/src/stores/user.js`
  - 如果实现时发现首页权限判断需要统一封装，再最小补充管理员首页可见性判断；否则不动。

## 实现约束

1. `/index` 是用户首页，保留“首页”名称。
2. `/adminindex` 是系统首页，显示名称为“系统首页”。
3. 两个页面都要显示在导航结构中，不使用隐藏路由。
4. `/adminindex` 的访问权限按角色配置的实际权限判断，不按 `admin` 角色名硬编码。
5. 优先复用已有接口，不先新增后端聚合接口。
6. 不在本次实现中重做全局布局和设计系统。

### Task 1: 路由与权限入口拆分

**Files:**
- Modify: `nest-admin-frontend/src/router/routes.js`
- Test: `nest-admin-frontend/src/views/index/index.route.spec.ts` 或新增 `src/views/index/home.routes.spec.ts`

- [ ] **Step 1: 先写路由失败测试**

如果 `src/views/index` 下还没有首页路由测试，新建 `nest-admin-frontend/src/views/index/home.routes.spec.ts`，内容如下：

```ts
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

function readRoutesSource() {
  return readFileSync(resolve(__dirname, '..', '..', 'router', 'routes.js'), 'utf-8')
}

describe('home routes', () => {
  it('注册了用户首页与系统首页路由', () => {
    const source = readRoutesSource()

    expect(source).toContain("path: '/index'")
    expect(source).toContain("@/views/index/index.vue")
    expect(source).toContain("title: '首页'")

    expect(source).toContain("path: '/adminindex'")
    expect(source).toContain("@/views/index/adminindex.vue")
    expect(source).toContain("title: '系统首页'")
  })

  it('系统首页路由声明了独立权限控制', () => {
    const source = readRoutesSource()
    expect(source).toContain('dashboard/adminIndex')
  })
})
```

- [ ] **Step 2: 运行路由测试，确认先失败**

Run: `npm test -- src/views/index/home.routes.spec.ts`

Expected: FAIL，因为当前还没有 `/adminindex` 路由和对应页面引用。

- [ ] **Step 3: 在路由中增加双首页入口**

修改 `nest-admin-frontend/src/router/routes.js`，在可见导航区增加两个路由：

```js
{
  path: '/index',
  component: Layout,
  children: [
    {
      path: '',
      component: () => import('@/views/index/index.vue'),
      name: 'UserHome',
      meta: { title: '首页', icon: 'home' },
    },
  ],
},
{
  path: '/adminindex',
  component: Layout,
  children: [
    {
      path: '',
      component: () => import('@/views/index/adminindex.vue'),
      name: 'AdminHome',
      meta: { title: '系统首页', icon: 'dashboard', permissionKey: 'dashboard/adminIndex' },
    },
  ],
},
```

要求：

1. 不移除当前 `/` 容器路由。
2. 系统首页使用独立权限字符 `dashboard/adminIndex`。
3. 保持现有路由文件风格，不额外做大规模整理。

- [ ] **Step 4: 再次运行路由测试，确认转绿**

Run: `npm test -- src/views/index/home.routes.spec.ts`

Expected: PASS。

### Task 2: 将现有首页重构为用户首页

**Files:**
- Modify: `nest-admin-frontend/src/views/index/index.vue`
- Modify: `nest-admin-frontend/src/views/index/api.ts`

- [ ] **Step 1: 先写用户首页内容结构失败测试**

如果当前仓库没有适合渲染测试的首页测试，新增一个源码断言测试 `nest-admin-frontend/src/views/index/index.structure.spec.ts`，内容如下：

```ts
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

function readSource() {
  return readFileSync(resolve(__dirname, 'index.vue'), 'utf-8')
}

describe('user home structure', () => {
  it('展示用户首页核心区块', () => {
    const source = readSource()

    expect(source).toContain('我的工作摘要')
    expect(source).toContain('我的待办')
    expect(source).toContain('我的待阅')
    expect(source).toContain('我参与的项目')
    expect(source).toContain('快捷入口')
  })
})
```

- [ ] **Step 2: 运行用户首页结构测试，确认先失败**

Run: `npm test -- src/views/index/index.structure.spec.ts`

Expected: FAIL，因为当前首页没有这些用户工作区块。

- [ ] **Step 3: 扩展首页 API 封装，保持最小复用**

修改 `nest-admin-frontend/src/views/index/api.ts`，补充用户首页会复用的请求：

```ts
// @ts-nocheck
import request from '@/utils/request'
import { getMessageList, getUnreadCount } from '@/api/system/message'
import { getList as getProjectList } from '@/views/business/projectManage/api'

const { get } = request
const serve = window.sysConfig.serves.system + '/common'

export const getIndexCountData = () => get(`${serve}/getIndexCountData`)

export const getHomeUnreadCount = () => getUnreadCount()

export const getHomeTodoList = () =>
  getMessageList({ pageNum: 1, pageSize: 5, messageType: 'todo', scope: 'current' })

export const getHomeCcList = () =>
  getMessageList({ pageNum: 1, pageSize: 5, messageType: 'cc', scope: 'current' })

export const getHomeProjectList = () =>
  getProjectList({ pageNum: 1, pageSize: 8 })
```

- [ ] **Step 4: 以最小改动重构用户首页页面**

在 `nest-admin-frontend/src/views/index/index.vue` 中：

1. 保留欢迎区与版本区。
2. 将原系统监控卡片改为用户工作摘要卡片。
3. 新增以下区块文案与数据承载：
   - `我的工作摘要`
   - `我的待办`
   - `我的待阅`
   - `我参与的项目`
   - `快捷入口`
4. 快捷入口至少包含：
   - 消息中心
   - 项目列表
   - 知识中心
   - 个人中心
5. 项目列表优先使用 `getHomeProjectList` 返回结果，不新增复杂项目维度切分。
6. 布局优先沿用现有 `Gcard`、`gridCard` 和现有样式风格。

最低脚本骨架应类似：

```ts
const loading = ref(false)
const unread = ref({ total: 0, todo: 0, cc: 0 })
const todoList = ref([])
const ccList = ref([])
const projectList = ref([])
const workSummaryCards = computed(() => [
  { title: '当前待办', value: unread.value.todo || 0, route: '/user/messages' },
  { title: '当前待阅', value: unread.value.cc || 0, route: '/user/messages' },
  { title: '参与项目', value: projectList.value.length || 0, route: '/business/projectManage/index' },
])

async function loadHomeData() {
  loading.value = true
  try {
    const [countRes, todoRes, ccRes, projectRes] = await Promise.all([
      api.getHomeUnreadCount(),
      api.getHomeTodoList(),
      api.getHomeCcList(),
      api.getHomeProjectList(),
    ])
    unread.value = countRes.data || countRes || {}
    todoList.value = todoRes.list || todoRes.data?.list || []
    ccList.value = ccRes.list || ccRes.data?.list || []
    projectList.value = projectRes.list || []
  } finally {
    loading.value = false
  }
}
```

- [ ] **Step 5: 运行用户首页结构测试，确认通过**

Run: `npm test -- src/views/index/index.structure.spec.ts`

Expected: PASS。

### Task 3: 新建系统首页页面

**Files:**
- Create: `nest-admin-frontend/src/views/index/adminindex.vue`
- Modify: `nest-admin-frontend/src/views/index/api.ts`

- [ ] **Step 1: 先写系统首页结构失败测试**

新增 `nest-admin-frontend/src/views/index/adminindex.structure.spec.ts`：

```ts
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

function readSource() {
  return readFileSync(resolve(__dirname, 'adminindex.vue'), 'utf-8')
}

describe('admin home structure', () => {
  it('展示系统首页核心区块', () => {
    const source = readSource()

    expect(source).toContain('系统概览')
    expect(source).toContain('管理工作摘要')
    expect(source).toContain('系统管理快捷入口')
    expect(source).toContain('访问趋势')
    expect(source).toContain('用户地区分布')
  })
})
```

- [ ] **Step 2: 运行系统首页结构测试，确认先失败**

Run: `npm test -- src/views/index/adminindex.structure.spec.ts`

Expected: FAIL，因为文件还不存在。

- [ ] **Step 3: 复用现有系统统计 API，创建系统首页页面**

创建 `nest-admin-frontend/src/views/index/adminindex.vue`，要求：

1. 顶部展示“系统首页”欢迎与版本信息。
2. 展示 `系统概览` 与 `管理工作摘要` 数字卡片。
3. 展示 `系统管理快捷入口`。
4. 复用现有：
   - `getIndexCountData`
   - `getVisitedNumChart`
   - `getUserAreaList`
5. 快捷入口至少包括：
   - 用户管理 `/system/users/index`
   - 角色管理 `/system/roles/index`
   - 菜单管理 `/system/menus/index`
   - 系统配置 `/system/configs/index`
   - 在线用户 `/systemMonitor/onlineUser/index`
   - 登录日志 `/systemMonitor/loginLog/index`
   - 系统日志 `/systemMonitor/systemLog/index`

页面骨架至少包含这些标题文本：

```vue
<div class="admin-home-page">
  <div class="GcardTitle">系统概览</div>
  <div class="GcardTitle">管理工作摘要</div>
  <div class="GcardTitle">系统管理快捷入口</div>
  <RequestChartTable title="用户地区分布" />
  <RequestChartTable title="访问趋势" />
</div>
```

- [ ] **Step 4: 运行系统首页结构测试，确认通过**

Run: `npm test -- src/views/index/adminindex.structure.spec.ts`

Expected: PASS。

### Task 4: 收紧系统首页权限与最终验证

**Files:**
- Modify: `nest-admin-frontend/src/router/routes.js`
- Optional Modify: `nest-admin-frontend/src/stores/user.js`
- Test: `nest-admin-frontend/src/views/index/home.routes.spec.ts`

- [ ] **Step 1: 为系统首页权限控制补断言测试**

在 `home.routes.spec.ts` 中补充：

```ts
it('系统首页菜单使用独立权限字符控制', () => {
  const source = readRoutesSource()
  expect(source).toContain("permissionKey: 'dashboard/adminIndex'")
})
```

- [ ] **Step 2: 如果现有路由过滤逻辑需要，最小补齐权限可见性字段**

若路由系统依赖 `meta.permissionKey` 或与现有菜单接口的字段映射有关，则保证 `/adminindex` 使用与当前菜单权限过滤一致的字段名，不引入新的路由权限协议。

目标代码示例：

```js
meta: { title: '系统首页', icon: 'dashboard', permissionKey: 'dashboard/adminIndex' }
```

- [ ] **Step 3: 运行首页相关测试**

Run:

```bash
npm test -- src/views/index/home.routes.spec.ts
npm test -- src/views/index/index.structure.spec.ts
npm test -- src/views/index/adminindex.structure.spec.ts
```

Expected: 全部 PASS。

- [ ] **Step 4: 运行前端类型或最小验证命令**

Run: `npm run type-check`

Expected: PASS。

- [ ] **Step 5: 查看变更并提交**

Run:

```bash
git status
git diff -- nest-admin-frontend/src/router/routes.js nest-admin-frontend/src/views/index/index.vue nest-admin-frontend/src/views/index/api.ts nest-admin-frontend/src/views/index/adminindex.vue nest-admin-frontend/src/views/index/home.routes.spec.ts nest-admin-frontend/src/views/index/index.structure.spec.ts nest-admin-frontend/src/views/index/adminindex.structure.spec.ts
git add nest-admin-frontend/src/router/routes.js nest-admin-frontend/src/views/index/index.vue nest-admin-frontend/src/views/index/api.ts nest-admin-frontend/src/views/index/adminindex.vue nest-admin-frontend/src/views/index/home.routes.spec.ts nest-admin-frontend/src/views/index/index.structure.spec.ts nest-admin-frontend/src/views/index/adminindex.structure.spec.ts
git commit -m "feat: split user and admin homepages"
```

Expected:

1. 只包含双首页相关变更。
2. 提交成功，提交信息为 `feat: split user and admin homepages`。

## 自检

1. Spec coverage: 已覆盖双路由、导航可见、系统首页权限字符、用户首页内容、系统首页内容、最小 API 复用、验证命令。
2. Placeholder scan: 无 `TODO`、`TBD`、无“自行补齐”类模糊步骤。
3. Type consistency: 计划统一使用 `/index`、`/adminindex`、`dashboard/adminIndex`、`adminindex.vue`、`UserHome`、`AdminHome` 命名。
