# Scheduled Jobs Log Detail Drawer Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 为“定时任务管理”补齐运行日志详情抽屉，让用户可以按需查看单条执行日志的完整信息。

**Architecture:** 后端在现有 `SystemScheduledJobsService` 和 `SystemScheduledJobsController` 上增加单条日志详情查询，并复用现有 `system/scheduledJobs/logs` 权限映射。前端在现有日志列表上增加 `详情` 操作，通过单独 API 按需拉取详情数据，再用 `el-drawer` 按四个区块展示完整日志内容与错误态。

**Tech Stack:** NestJS, TypeORM, Vue 3, Element Plus, Jest, Vitest

---

## File Structure

- Modify: `nest-admin/src/modules/systemScheduledJobs/service.ts`
  - 增加 `getLogDetail(id)`，按日志主键读取完整详情，不存在时抛 `NotFoundException`。
- Modify: `nest-admin/src/modules/systemScheduledJobs/controller.ts`
  - 新增 `GET /system/scheduled-jobs/logs/:id` 详情接口。
- Modify: `nest-admin/src/modules/systemScheduledJobs/service.spec.ts`
  - 为详情查询成功与不存在补 Jest 测试。
- Modify: `nest-admin/src/modules/auth/auth.guard.ts`
  - 给 `GET system/scheduled-jobs/logs/:id` 增加权限映射，复用 `system/scheduledJobs/logs`。
- Modify: `nest-admin/src/modules/auth/auth.guard.spec.ts`
  - 增加详情接口权限校验测试。
- Modify: `nest-admin-frontend/src/views/systemMonitor/scheduledJobs/api.ts`
  - 增加详情类型与 `getScheduledJobLogDetail(id)`。
- Modify: `nest-admin-frontend/src/views/systemMonitor/scheduledJobs/api.spec.ts`
  - 为详情接口响应解包补测试。
- Modify: `nest-admin-frontend/src/views/systemMonitor/scheduledJobs/index.vue`
  - 在日志表格增加 `详情` 按钮、抽屉状态、详情加载逻辑、长文本格式化展示与错误提示。
- Modify: `nest-admin-frontend/src/views/systemMonitor/scheduledJobs/index.behavior.spec.ts`
  - 覆盖点击详情、成功渲染、失败提示、无权限不展示入口。
- Modify: `nest-admin-frontend/src/views/systemMonitor/scheduledJobs/index.structure.spec.ts`
  - 固定结构关键字，确保页面保留 `详情` 入口和 `el-drawer` 详情分区。

### Task 1: 后端补齐日志详情服务与接口

**Files:**
- Modify: `nest-admin/src/modules/systemScheduledJobs/service.ts`
- Modify: `nest-admin/src/modules/systemScheduledJobs/controller.ts`
- Modify: `nest-admin/src/modules/systemScheduledJobs/service.spec.ts`

- [ ] **Step 1: 先写失败测试，固定详情查询行为**

```ts
it("getLogDetail 按 id 返回完整日志详情", async () => {
  const { service, logRepository } = createService();
  logRepository.findOne.mockResolvedValue({
    id: "log-1",
    jobKey: "sysFile.orphanCleanup",
    summary: "清理 3 个文件",
    processedCount: 3,
    successCount: 3,
    failedCount: 0,
    errorMessage: "",
    errorStack: "",
    payload: { totalSize: 2048 },
    operatorId: "u1",
    operatorName: "管理员",
  });

  await expect(service.getLogDetail("log-1")).resolves.toMatchObject({
    id: "log-1",
    jobKey: "sysFile.orphanCleanup",
    payload: { totalSize: 2048 },
    operatorName: "管理员",
  });
  expect(logRepository.findOne).toHaveBeenCalledWith({ where: { id: "log-1" } });
});

it("getLogDetail 在日志不存在时抛 NotFoundException", async () => {
  const { service, logRepository } = createService();
  logRepository.findOne.mockResolvedValue(null);

  await expect(service.getLogDetail("missing-log")).rejects.toThrow("日志不存在");
});
```

- [ ] **Step 2: 运行后端单测确认失败**

Run: `npm run test -- src/modules/systemScheduledJobs/service.spec.ts --runInBand`

Expected: FAIL，提示 `getLogDetail` 不存在，或 `findOne` mock 未被调用。

- [ ] **Step 3: 写最小实现，补服务方法与控制器路由**

```ts
// nest-admin/src/modules/systemScheduledJobs/service.ts
async getLogDetail(id: string) {
  const log = await this.logRepository.findOne({
    where: { id },
  });
  if (!log) {
    throw new NotFoundException("日志不存在");
  }
  return log;
}
```

```ts
// nest-admin/src/modules/systemScheduledJobs/controller.ts
@Get("logs/:id")
logDetail(@Param("id") id: string) {
  return this.service.getLogDetail(id);
}
```

- [ ] **Step 4: 再跑后端单测确认通过**

Run: `npm run test -- src/modules/systemScheduledJobs/service.spec.ts --runInBand`

Expected: PASS，输出包含 `getLogDetail` 两条新增用例。

- [ ] **Step 5: 提交本任务**

```bash
git add nest-admin/src/modules/systemScheduledJobs/service.ts nest-admin/src/modules/systemScheduledJobs/controller.ts nest-admin/src/modules/systemScheduledJobs/service.spec.ts
git commit -m "feat: add scheduled job log detail api"
```

### Task 2: 补齐详情接口权限映射

**Files:**
- Modify: `nest-admin/src/modules/auth/auth.guard.ts`
- Modify: `nest-admin/src/modules/auth/auth.guard.spec.ts`

- [ ] **Step 1: 先写失败测试，固定详情接口复用日志权限**

```ts
it("具备日志权限时放行定时任务日志详情接口", async () => {
  const guard = new AuthGuard(
    jwtService as unknown as JwtService,
    reflector as unknown as Reflector,
    redisService as any,
    rolesService as any,
  );
  const request: Record<string, any> = {
    headers: {
      cookie: "admin_session=header.payload.signature",
    },
    path: "/api/system/scheduled-jobs/logs/log-1",
    method: "GET",
  };

  jwtService.verifyAsync.mockResolvedValue({
    permissions: [],
    id: "user_1",
  });
  rolesService.getUserMenus.mockResolvedValue([
    { permissionKey: "system/scheduledJobs/logs" },
  ]);
  redisService.getPermissions.mockResolvedValue(["system/scheduledJobs/logs"]);

  await expect(guard.canActivate(createContext(request))).resolves.toBe(true);
});
```

- [ ] **Step 2: 运行权限测试确认失败**

Run: `npm run test -- src/modules/auth/auth.guard.spec.ts --runInBand`

Expected: FAIL，提示详情路径未命中权限映射而导致断言不成立。

- [ ] **Step 3: 增加详情路由权限映射**

```ts
["GET", /^system\/scheduled-jobs\/logs\/[^/]+$/, "system/scheduledJobs/logs"],
```

把这条映射放在现有：

```ts
["GET", /^system\/scheduled-jobs\/logs$/, "system/scheduledJobs/logs"],
```

之后，保持同一权限族集中定义。

- [ ] **Step 4: 再跑权限测试确认通过**

Run: `npm run test -- src/modules/auth/auth.guard.spec.ts --runInBand`

Expected: PASS，新增详情接口用例通过，原有定时任务权限用例继续通过。

- [ ] **Step 5: 提交本任务**

```bash
git add nest-admin/src/modules/auth/auth.guard.ts nest-admin/src/modules/auth/auth.guard.spec.ts
git commit -m "feat: map scheduled job log detail permission"
```

### Task 3: 前端 API 层补齐详情查询

**Files:**
- Modify: `nest-admin-frontend/src/views/systemMonitor/scheduledJobs/api.ts`
- Modify: `nest-admin-frontend/src/views/systemMonitor/scheduledJobs/api.spec.ts`

- [ ] **Step 1: 先写失败测试，固定详情接口解包行为**

```ts
it('日志详情接口应解包响应中的 data 对象', async () => {
  requestMocks.get.mockResolvedValue({
    code: 200,
    msg: 'success',
    data: {
      id: 'log-1',
      jobKey: 'sysFile.orphanCleanup',
      payload: { totalSize: 2048 },
      operatorName: '管理员',
    },
  })

  const { getScheduledJobLogDetail } = await import('./api')
  const result = await getScheduledJobLogDetail('log-1')

  expect(requestMocks.get).toHaveBeenCalledWith('/system/scheduled-jobs/logs/log-1')
  expect(result).toEqual({
    id: 'log-1',
    jobKey: 'sysFile.orphanCleanup',
    payload: { totalSize: 2048 },
    operatorName: '管理员',
  })
})
```

- [ ] **Step 2: 运行前端单测确认失败**

Run: `npm run test:unit -- src/views/systemMonitor/scheduledJobs/api.spec.ts`

Expected: FAIL，提示 `getScheduledJobLogDetail` 不存在。

- [ ] **Step 3: 写最小实现，补详情类型与接口函数**

```ts
function normalizeDetailData<T extends Record<string, unknown>>(
  res: { data?: T | { data?: T } } | T,
): T {
  if (Array.isArray(res)) return {} as T
  if (res && 'data' in res && res.data && !Array.isArray(res.data)) {
    return 'data' in res.data ? ((res.data.data || {}) as T) : (res.data as T)
  }
  return (res || {}) as T
}

export interface ScheduledJobLogDetail extends ScheduledJobLogItem {
  jobType: string
  module: string
  errorStack?: string
  payload?: Record<string, unknown> | string | null
  operatorId?: string
  operatorName?: string
}

export const getScheduledJobLogDetail = (id: string): Promise<ScheduledJobLogDetail> =>
  get(`${serve}/logs/${id}`).then(normalizeDetailData)
```

- [ ] **Step 4: 再跑前端单测确认通过**

Run: `npm run test:unit -- src/views/systemMonitor/scheduledJobs/api.spec.ts`

Expected: PASS，新增详情解包用例通过，列表与日志列表用例继续通过。

- [ ] **Step 5: 提交本任务**

```bash
git add nest-admin-frontend/src/views/systemMonitor/scheduledJobs/api.ts nest-admin-frontend/src/views/systemMonitor/scheduledJobs/api.spec.ts
git commit -m "feat: add scheduled job log detail request"
```

### Task 4: 在页面增加日志详情抽屉

**Files:**
- Modify: `nest-admin-frontend/src/views/systemMonitor/scheduledJobs/index.vue`
- Modify: `nest-admin-frontend/src/views/systemMonitor/scheduledJobs/index.behavior.spec.ts`
- Modify: `nest-admin-frontend/src/views/systemMonitor/scheduledJobs/index.structure.spec.ts`

- [ ] **Step 1: 先写失败测试，固定详情交互与错误态**

```ts
it('点击详情会打开抽屉并加载日志详情', async () => {
  apiMocks.getScheduledJobLogs.mockResolvedValue([
    {
      id: 'log-1',
      jobKey: 'sysFile.orphanCleanup',
      jobName: '孤儿文件清理',
      triggerMode: 'manual',
      status: 'success',
      summary: '清理 3 个文件',
    },
  ])
  apiMocks.getScheduledJobLogDetail.mockResolvedValue({
    id: 'log-1',
    jobKey: 'sysFile.orphanCleanup',
    jobName: '孤儿文件清理',
    jobType: 'cron',
    module: 'sysFile',
    triggerMode: 'manual',
    status: 'success',
    processedCount: 3,
    successCount: 3,
    failedCount: 0,
    summary: '清理 3 个文件',
    payload: { totalSize: 2048 },
    operatorId: 'u1',
    operatorName: '管理员',
  })

  const wrapper = mountView()
  await flushPromises()

  const detailButton = wrapper.findAll('button').find((item) => item.text() === '详情')
  await detailButton?.trigger('click')
  await flushPromises()

  expect(apiMocks.getScheduledJobLogDetail).toHaveBeenCalledWith('log-1')
  expect(wrapper.text()).toContain('执行统计')
  expect(wrapper.text()).toContain('执行上下文')
  expect(wrapper.text()).toContain('管理员')
  expect(wrapper.text()).toContain('totalSize')
})

it('详情接口失败时保留抽屉并显示错误提示', async () => {
  apiMocks.getScheduledJobLogs.mockResolvedValue([
    {
      id: 'log-2',
      jobKey: 'tasks.overdueReminder',
      jobName: '任务逾期提醒扫描',
      triggerMode: 'manual',
      status: 'failure',
      summary: '执行失败',
    },
  ])
  apiMocks.getScheduledJobLogDetail.mockRejectedValue(new Error('日志详情不存在'))

  const wrapper = mountView()
  await flushPromises()

  const detailButton = wrapper.findAll('button').find((item) => item.text() === '详情')
  await detailButton?.trigger('click')
  await flushPromises()

  expect(wrapper.text()).toContain('日志详情不存在')
  expect(wrapper.text()).toContain('日志详情')
})
```

- [ ] **Step 2: 运行页面行为测试确认失败**

Run: `npm run test:unit -- src/views/systemMonitor/scheduledJobs/index.behavior.spec.ts`

Expected: FAIL，提示 `详情` 按钮、详情状态或 `getScheduledJobLogDetail` mock 不存在。

- [ ] **Step 3: 写最小页面实现，增加抽屉、状态与格式化展示**

```ts
// script setup 中新增的核心状态
const logDetailVisible = ref(false)
const logDetailLoading = ref(false)
const logDetailError = ref('')
const logDetail = ref<ScheduledJobLogDetail | null>(null)

function formatDetailText(value?: Record<string, unknown> | string | null) {
  if (!value) return '--'
  if (typeof value === 'string') return value
  return JSON.stringify(value, null, 2)
}

async function handleViewLogDetail(row: ScheduledJobLogItem) {
  logDetailVisible.value = true
  logDetailLoading.value = true
  logDetailError.value = ''
  logDetail.value = null
  try {
    logDetail.value = await getScheduledJobLogDetail(String(row.id || ''))
  } catch (error) {
    logDetailError.value = error instanceof Error ? error.message : '日志详情加载失败'
  } finally {
    logDetailLoading.value = false
  }
}
```

```vue
<el-table-column label="操作" width="120" fixed="right">
  <template #default="{ row }">
    <el-button text type="primary" @click="handleViewLogDetail(row)">详情</el-button>
  </template>
</el-table-column>

<el-drawer v-model="logDetailVisible" title="日志详情" :size="drawerSize">
  <div v-loading="logDetailLoading" class="log-detail-body">
    <div v-if="logDetailError" class="log-detail-error">{{ logDetailError }}</div>
    <template v-else-if="logDetail">
      <section class="log-detail-section">
        <div class="log-detail-title">基本信息</div>
      </section>
      <section class="log-detail-section">
        <div class="log-detail-title">执行统计</div>
      </section>
      <section class="log-detail-section">
        <div class="log-detail-title">错误信息</div>
      </section>
      <section class="log-detail-section">
        <div class="log-detail-title">执行上下文</div>
        <pre>{{ formatDetailText(logDetail.payload) }}</pre>
      </section>
    </template>
  </div>
</el-drawer>
```

实现时同步补上：

```ts
const drawerSize = computed(() => (window.innerWidth <= 768 ? '100%' : '720px'))
```

以及 `errorStack`、`errorMessage`、`operatorId`、`operatorName`、`processedCount`、`successCount`、`failedCount` 的 `--` 兜底展示。

- [ ] **Step 4: 更新行为测试和结构测试桩，使抽屉场景可断言**

```ts
// index.behavior.spec.ts mock 扩展
const apiMocks = vi.hoisted(() => ({
  getScheduledJobs: vi.fn(),
  getScheduledJobLogs: vi.fn(),
  getScheduledJobLogDetail: vi.fn(),
  runScheduledJob: vi.fn(),
  enableScheduledJob: vi.fn(),
  disableScheduledJob: vi.fn(),
}))
```

```ts
// index.behavior.spec.ts stubs 扩展
ElDrawer: {
  props: ['modelValue', 'title', 'size'],
  template: '<div v-if="modelValue"><div>{{ title }}</div><slot /></div>',
},
```

```ts
// index.structure.spec.ts 增加关键结构断言
expect(source).toContain('getScheduledJobLogDetail')
expect(source).toContain('日志详情')
expect(source).toContain('执行统计')
expect(source).toContain('错误信息')
expect(source).toContain('执行上下文')
expect(source).toContain('el-drawer')
expect(source).toContain('formatDetailText')
```

- [ ] **Step 5: 跑前端页面测试确认通过**

Run: `npm run test:unit -- src/views/systemMonitor/scheduledJobs/index.behavior.spec.ts src/views/systemMonitor/scheduledJobs/index.structure.spec.ts`

Expected: PASS，新增 `详情` 行为与结构断言通过，原有按钮权限行为继续通过。

- [ ] **Step 6: 跑前端类型检查**

Run: `npm run type-check`

Expected: PASS，无新增类型错误。

- [ ] **Step 7: 提交本任务**

```bash
git add nest-admin-frontend/src/views/systemMonitor/scheduledJobs/index.vue nest-admin-frontend/src/views/systemMonitor/scheduledJobs/index.behavior.spec.ts nest-admin-frontend/src/views/systemMonitor/scheduledJobs/index.structure.spec.ts
git commit -m "feat: add scheduled job log detail drawer"
```

### Task 5: 做最终联调级验证

**Files:**
- Modify: 无新增代码；执行仓库校验命令并记录结果。

- [ ] **Step 1: 跑后端 lint**

Run: `npm run lint`

Workdir: `nest-admin`

Expected: PASS。

- [ ] **Step 2: 跑后端定向 Jest**

Run: `npm run test -- src/modules/systemScheduledJobs/service.spec.ts src/modules/auth/auth.guard.spec.ts --runInBand`

Workdir: `nest-admin`

Expected: PASS，包含日志详情与权限映射新增用例。

- [ ] **Step 3: 跑前端定向 Vitest**

Run: `npm run test:unit -- src/views/systemMonitor/scheduledJobs/api.spec.ts src/views/systemMonitor/scheduledJobs/index.behavior.spec.ts src/views/systemMonitor/scheduledJobs/index.structure.spec.ts`

Workdir: `nest-admin-frontend`

Expected: PASS，包含详情接口与抽屉行为新增用例。

- [ ] **Step 4: 若后端返回结构有变化，再跑根目录契约检查**

Run: `npm run check:api-contract`

Workdir: `/Users/yyk/工作/代码开发/Project-V2.0`

Expected: PASS；若日志详情接口未纳入现有契约扫描，也要记录该事实。

- [ ] **Step 5: 提交验证结果对应代码**

```bash
git status
```

Expected: 仅保留本计划相关改动；若全部已提交，则工作区干净或只剩无关改动。
