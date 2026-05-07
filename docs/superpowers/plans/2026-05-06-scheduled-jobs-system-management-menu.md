# Scheduled Jobs System Management Menu Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 补齐“定时任务管理”在系统管理下的菜单、权限、角色授权可分配能力，并让新老环境都能自动获得这组菜单资产。

**Architecture:** 后端新增一份定时任务菜单定义，并在应用启动后通过幂等同步把页面菜单和四个按钮权限补齐到 `sys_menu`。同时补齐 `auth.guard.ts` 的接口权限映射，并在前端现有 `scheduledJobs` 页面上增加 `checkPermi` 按钮显隐控制与对应测试。

**Tech Stack:** NestJS, TypeORM, Vue 3, Element Plus, Vitest, Jest

---

## File Structure

- Create: `nest-admin/src/modules/systemScheduledJobs/menu.seed.ts`
  - 维护“定时任务管理”页面菜单和四个按钮权限的静态定义，作为新环境基线和启动补齐输入源。
- Create: `nest-admin/src/modules/systemScheduledJobs/menu-sync.service.ts`
  - 负责在应用启动后幂等补齐目标菜单，并只同步目标菜单自身的结构字段。
- Create: `nest-admin/src/modules/systemScheduledJobs/menu-sync.service.spec.ts`
  - 验证菜单创建、幂等更新、按钮补齐、不自动赋权等行为。
- Modify: `nest-admin/src/modules/systemScheduledJobs/module.ts`
  - 注入 `Menu` 仓库并注册菜单同步服务。
- Modify: `nest-admin/src/modules/auth/auth.guard.ts`
  - 增加定时任务相关接口到权限标识的映射。
- Modify: `nest-admin/src/modules/auth/auth.guard.spec.ts`
  - 为五个新增接口权限映射补测试。
- Modify: `nest-admin-frontend/src/views/systemMonitor/scheduledJobs/index.vue`
  - 增加 `checkPermi` 计算属性并控制“运行日志 / 立即执行 / 启用 / 停用”按钮显隐。
- Modify: `nest-admin-frontend/src/views/systemMonitor/scheduledJobs/index.behavior.spec.ts`
  - 为按钮权限显隐补行为测试，并保留现有点击行为测试。
- Modify: `nest-admin-frontend/src/views/systemMonitor/scheduledJobs/index.structure.spec.ts`
  - 将结构测试从“固定出现按钮文案”收敛到“存在权限控制和页面标题”，避免和权限显隐冲突。

### Task 1: 定义定时任务菜单基线

**Files:**
- Create: `nest-admin/src/modules/systemScheduledJobs/menu.seed.ts`
- Test: `nest-admin/src/modules/systemScheduledJobs/menu-sync.service.spec.ts`

- [ ] **Step 1: 写失败测试，固定菜单种子结构**

```ts
import { scheduledJobsMenuSeed } from './menu.seed';

describe('scheduled jobs menu seed', () => {
  it('定义系统管理下的页面菜单与四个按钮权限', () => {
    expect(scheduledJobsMenuSeed.parent.permissionKey).toBe('system');
    expect(scheduledJobsMenuSeed.page).toMatchObject({
      name: '定时任务管理',
      type: 'menu',
      component: 'systemMonitor/scheduledJobs/index',
      permissionKey: 'system/scheduledJobs/list',
    });
    expect(scheduledJobsMenuSeed.buttons.map((item) => item.permissionKey)).toEqual([
      'system/scheduledJobs/logs',
      'system/scheduledJobs/run',
      'system/scheduledJobs/enable',
      'system/scheduledJobs/disable',
    ]);
  });
});
```

- [ ] **Step 2: 运行测试确认失败**

Run: `npm run test -- src/modules/systemScheduledJobs/menu-sync.service.spec.ts --runInBand`

Expected: FAIL，提示 `./menu.seed` 或 `scheduledJobsMenuSeed` 不存在。

- [ ] **Step 3: 写最小菜单种子实现**

```ts
import { MenuType } from 'src/modules/menus/menu.entity';

type ScheduledJobsMenuSeedItem = {
  name: string;
  type: MenuType;
  path: string;
  component: string;
  permissionKey: string;
  icon: string;
  order: number;
  isHidden: '0' | '1';
  isActive: '0' | '1';
};

export const scheduledJobsMenuSeed = {
  parent: {
    permissionKey: 'system',
  },
  page: {
    name: '定时任务管理',
    type: MenuType.menu,
    path: '/systemManage/scheduledJobs/index',
    component: 'systemMonitor/scheduledJobs/index',
    permissionKey: 'system/scheduledJobs/list',
    icon: 'timer',
    order: 98,
    isHidden: '0',
    isActive: '1',
  } satisfies ScheduledJobsMenuSeedItem,
  buttons: [
    {
      name: '查看日志',
      type: MenuType.button,
      path: '',
      component: '',
      permissionKey: 'system/scheduledJobs/logs',
      icon: '',
      order: 1,
      isHidden: '0',
      isActive: '1',
    },
    {
      name: '立即执行',
      type: MenuType.button,
      path: '',
      component: '',
      permissionKey: 'system/scheduledJobs/run',
      icon: '',
      order: 2,
      isHidden: '0',
      isActive: '1',
    },
    {
      name: '启用',
      type: MenuType.button,
      path: '',
      component: '',
      permissionKey: 'system/scheduledJobs/enable',
      icon: '',
      order: 3,
      isHidden: '0',
      isActive: '1',
    },
    {
      name: '停用',
      type: MenuType.button,
      path: '',
      component: '',
      permissionKey: 'system/scheduledJobs/disable',
      icon: '',
      order: 4,
      isHidden: '0',
      isActive: '1',
    },
  ] satisfies ScheduledJobsMenuSeedItem[],
};
```

- [ ] **Step 4: 运行测试确认通过**

Run: `npm run test -- src/modules/systemScheduledJobs/menu-sync.service.spec.ts --runInBand`

Expected: PASS，且测试输出包含 `scheduled jobs menu seed`。

- [ ] **Step 5: 提交本任务**

```bash
git add nest-admin/src/modules/systemScheduledJobs/menu.seed.ts nest-admin/src/modules/systemScheduledJobs/menu-sync.service.spec.ts
git commit -m "feat: define scheduled jobs menu seed"
```

### Task 2: 实现启动时幂等菜单补齐

**Files:**
- Create: `nest-admin/src/modules/systemScheduledJobs/menu-sync.service.ts`
- Modify: `nest-admin/src/modules/systemScheduledJobs/module.ts`
- Modify: `nest-admin/src/modules/systemScheduledJobs/menu-sync.service.spec.ts`

- [ ] **Step 1: 写失败测试，覆盖创建与幂等更新**

```ts
import { MenuType } from 'src/modules/menus/menu.entity';
import { SystemScheduledJobsMenuSyncService } from './menu-sync.service';

describe('SystemScheduledJobsMenuSyncService', () => {
  function createRepository() {
    return {
      findOne: jest.fn(),
      save: jest.fn().mockImplementation(async (value) => ({ id: value.id || 'generated-id', ...value })),
    };
  }

  it('缺失页面菜单时会在系统管理下创建页面和按钮权限', async () => {
    const repository = createRepository();
    repository.findOne
      .mockResolvedValueOnce({ id: 'system-root', permissionKey: 'system', type: MenuType.catalog })
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(null);

    const service = new SystemScheduledJobsMenuSyncService(repository as never);
    await service.sync();

    expect(repository.save).toHaveBeenCalledWith(expect.objectContaining({
      parentId: 'system-root',
      permissionKey: 'system/scheduledJobs/list',
      component: 'systemMonitor/scheduledJobs/index',
    }));
    expect(repository.save).toHaveBeenCalledWith(expect.objectContaining({
      parentId: 'generated-id',
      permissionKey: 'system/scheduledJobs/run',
      type: MenuType.button,
    }));
  });

  it('已存在菜单时只更新结构字段且不创建角色关系', async () => {
    const repository = createRepository();
    repository.findOne
      .mockResolvedValueOnce({ id: 'system-root', permissionKey: 'system', type: MenuType.catalog })
      .mockResolvedValueOnce({
        id: 'page-id',
        parentId: 'legacy-root',
        name: '旧任务中心',
        path: '/legacy/path',
        component: 'legacy/component',
        type: MenuType.menu,
        permissionKey: 'system/scheduledJobs/list',
        icon: 'old',
        order: 1,
        isHidden: '1',
        isActive: '0',
      })
      .mockResolvedValueOnce({ id: 'btn-logs', permissionKey: 'system/scheduledJobs/logs', parentId: 'wrong-page', type: MenuType.button })
      .mockResolvedValueOnce({ id: 'btn-run', permissionKey: 'system/scheduledJobs/run', parentId: 'wrong-page', type: MenuType.button })
      .mockResolvedValueOnce({ id: 'btn-enable', permissionKey: 'system/scheduledJobs/enable', parentId: 'wrong-page', type: MenuType.button })
      .mockResolvedValueOnce({ id: 'btn-disable', permissionKey: 'system/scheduledJobs/disable', parentId: 'wrong-page', type: MenuType.button });

    const service = new SystemScheduledJobsMenuSyncService(repository as never);
    await service.sync();

    expect(repository.save).toHaveBeenCalledWith(expect.objectContaining({
      id: 'page-id',
      parentId: 'system-root',
      name: '定时任务管理',
      path: '/systemManage/scheduledJobs/index',
      component: 'systemMonitor/scheduledJobs/index',
      icon: 'timer',
      isHidden: '0',
      isActive: '1',
    }));
    expect(repository.save).not.toHaveBeenCalledWith(expect.objectContaining({ menus: expect.anything() }));
  });
});
```

- [ ] **Step 2: 运行测试确认失败**

Run: `npm run test -- src/modules/systemScheduledJobs/menu-sync.service.spec.ts --runInBand`

Expected: FAIL，提示 `SystemScheduledJobsMenuSyncService` 不存在。

- [ ] **Step 3: 写最小同步服务实现并接入模块**

```ts
import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Menu } from 'src/modules/menus/menu.entity';
import { Repository } from 'typeorm';
import { scheduledJobsMenuSeed } from './menu.seed';

@Injectable()
export class SystemScheduledJobsMenuSyncService implements OnApplicationBootstrap {
  private readonly logger = new Logger(SystemScheduledJobsMenuSyncService.name);

  constructor(
    @InjectRepository(Menu)
    private readonly menuRepository: Repository<Menu>,
  ) {}

  async onApplicationBootstrap() {
    await this.sync();
  }

  async sync() {
    const parentMenu = await this.menuRepository.findOne({
      where: { permissionKey: scheduledJobsMenuSeed.parent.permissionKey } as never,
    });
    if (!parentMenu) {
      this.logger.error('未找到系统管理父菜单，跳过定时任务管理菜单补齐');
      return;
    }

    const pageMenu = await this.upsertMenu({
      ...scheduledJobsMenuSeed.page,
      parentId: parentMenu.id,
    });

    for (const button of scheduledJobsMenuSeed.buttons) {
      await this.upsertMenu({
        ...button,
        parentId: pageMenu.id,
      });
    }
  }

  private async upsertMenu(input: Partial<Menu> & { permissionKey: string; parentId: string }) {
    const current = await this.menuRepository.findOne({
      where: { permissionKey: input.permissionKey } as never,
    });
    const nextValue = Object.assign(new Menu(), current || {}, {
      name: input.name,
      parentId: input.parentId,
      path: input.path,
      component: input.component,
      type: input.type,
      permissionKey: input.permissionKey,
      order: input.order,
      icon: input.icon,
      isHidden: input.isHidden,
      isActive: input.isActive,
    });
    if (input.parentId && input.parentId !== '0') {
      nextValue.parent = Object.assign(new Menu(), { id: input.parentId });
    }
    return this.menuRepository.save(nextValue);
  }
}
```

```ts
import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Menu } from 'src/modules/menus/menu.entity';
import { SystemScheduledJobsMenuSyncService } from './menu-sync.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      SystemScheduledJobConfig,
      SystemScheduledJobExecutionLog,
      Menu,
    ]),
    forwardRef(() => TasksBusiModule),
    forwardRef(() => ProjectsModule),
    forwardRef(() => SysFileModule),
    forwardRef(() => ArticleBorrowsModule),
  ],
  providers: [SystemScheduledJobsService, SystemScheduledJobsMenuSyncService],
  controllers: [SystemScheduledJobsController],
  exports: [SystemScheduledJobsService],
})
export class SystemScheduledJobsModule {}
```

- [ ] **Step 4: 运行测试确认通过**

Run: `npm run test -- src/modules/systemScheduledJobs/menu-sync.service.spec.ts --runInBand`

Expected: PASS，且两个同步场景都通过。

- [ ] **Step 5: 提交本任务**

```bash
git add nest-admin/src/modules/systemScheduledJobs/menu.seed.ts nest-admin/src/modules/systemScheduledJobs/menu-sync.service.ts nest-admin/src/modules/systemScheduledJobs/menu-sync.service.spec.ts nest-admin/src/modules/systemScheduledJobs/module.ts
git commit -m "feat: sync scheduled jobs menu entries"
```

### Task 3: 补齐后端接口权限映射

**Files:**
- Modify: `nest-admin/src/modules/auth/auth.guard.ts`
- Modify: `nest-admin/src/modules/auth/auth.guard.spec.ts`

- [ ] **Step 1: 写失败测试，固定定时任务接口权限映射**

```ts
  it('定时任务列表接口需要 system/scheduledJobs/list 权限', async () => {
    const guard = new AuthGuard(
      jwtService as unknown as JwtService,
      reflector as unknown as Reflector,
      redisService as any,
      rolesService as any,
    );
    const request: Record<string, any> = {
      headers: {
        cookie: 'admin_session=header.payload.signature',
      },
      path: '/api/system/scheduled-jobs/list',
      method: 'GET',
    };

    jwtService.verifyAsync.mockResolvedValue({ permissions: [], id: 'user_1' });
    rolesService.getUserMenus.mockResolvedValue([]);
    redisService.getPermissions.mockResolvedValue(['system/scheduledJobs/list']);

    await expect(guard.canActivate(createContext(request))).rejects.toThrow('接口无权限');
  });

  it('拥有 run 权限时可以访问立即执行接口', async () => {
    const guard = new AuthGuard(
      jwtService as unknown as JwtService,
      reflector as unknown as Reflector,
      redisService as any,
      rolesService as any,
    );
    const request: Record<string, any> = {
      headers: {
        cookie: 'admin_session=header.payload.signature',
      },
      path: '/api/system/scheduled-jobs/run/tasks.dueSoonReminder',
      method: 'POST',
    };

    jwtService.verifyAsync.mockResolvedValue({ permissions: [], id: 'user_1' });
    rolesService.getUserMenus.mockResolvedValue([{ permissionKey: 'system/scheduledJobs/run' }]);
    redisService.getPermissions.mockResolvedValue(['system/scheduledJobs/run']);

    await expect(guard.canActivate(createContext(request))).resolves.toBe(true);
  });
```

- [ ] **Step 2: 运行测试确认失败**

Run: `npm run test -- src/modules/auth/auth.guard.spec.ts --runInBand`

Expected: FAIL，定时任务接口未被映射到对应权限标识。

- [ ] **Step 3: 在守卫中补齐五个接口映射**

```ts
      ['GET', /^system\/scheduled-jobs\/list$/, 'system/scheduledJobs/list'],
      ['GET', /^system\/scheduled-jobs\/logs$/, 'system/scheduledJobs/logs'],
      ['POST', /^system\/scheduled-jobs\/run\/[^/]+$/, 'system/scheduledJobs/run'],
      ['POST', /^system\/scheduled-jobs\/enable\/[^/]+$/, 'system/scheduledJobs/enable'],
      ['POST', /^system\/scheduled-jobs\/disable\/[^/]+$/, 'system/scheduledJobs/disable'],
```

把这五行放到 `system/*` 权限映射段，与 `system/messages/*` 和 `system/menus/*` 同一区域。

- [ ] **Step 4: 运行测试确认通过**

Run: `npm run test -- src/modules/auth/auth.guard.spec.ts --runInBand`

Expected: PASS，新旧守卫测试全部通过。

- [ ] **Step 5: 提交本任务**

```bash
git add nest-admin/src/modules/auth/auth.guard.ts nest-admin/src/modules/auth/auth.guard.spec.ts
git commit -m "feat: guard scheduled jobs permissions"
```

### Task 4: 为前端页面补按钮权限显隐

**Files:**
- Modify: `nest-admin-frontend/src/views/systemMonitor/scheduledJobs/index.vue`
- Modify: `nest-admin-frontend/src/views/systemMonitor/scheduledJobs/index.structure.spec.ts`

- [ ] **Step 1: 写失败测试，固定权限控制结构**

```ts
  it('页面通过 checkPermi 控制日志与执行按钮', () => {
    const source = readSource();

    expect(source).toContain("checkPermi(['system/scheduledJobs/logs'])");
    expect(source).toContain("checkPermi(['system/scheduledJobs/run'])");
    expect(source).toContain("checkPermi(['system/scheduledJobs/enable'])");
    expect(source).toContain("checkPermi(['system/scheduledJobs/disable'])");
  });
```

- [ ] **Step 2: 运行测试确认失败**

Run: `npm run test -- src/views/systemMonitor/scheduledJobs/index.structure.spec.ts`

Expected: FAIL，页面源码中还没有这些权限判断。

- [ ] **Step 3: 写最小前端实现**

```ts
import { computed, onMounted, ref } from 'vue'
import { checkPermi } from '@/utils/permission'

const canViewLogs = computed(() => checkPermi(['system/scheduledJobs/logs']))
const canRunJob = computed(() => checkPermi(['system/scheduledJobs/run']))
const canEnableJob = computed(() => checkPermi(['system/scheduledJobs/enable']))
const canDisableJob = computed(() => checkPermi(['system/scheduledJobs/disable']))
```

```vue
<el-button v-if="canViewLogs" text type="primary" @click="handleViewLogs(row)">运行日志</el-button>
<el-button v-if="canRunJob" text type="primary" @click="handleRunJob(row)">立即执行</el-button>
<el-button v-if="row.enabled === '0' && canEnableJob" text type="success" @click="handleEnableJob(row)">启用</el-button>
<el-button v-else-if="canDisableJob" text type="danger" @click="handleDisableJob(row)">停用</el-button>
```

### 注意

- 保留原有按钮顺序
- 仅增加权限显隐，不改现有请求逻辑
- `enable/disable` 必须避免 `v-else` 误让无启用权限时落到停用分支，因此要用 `v-else-if`

- [ ] **Step 4: 运行测试确认通过**

Run: `npm run test -- src/views/systemMonitor/scheduledJobs/index.structure.spec.ts`

Expected: PASS，结构测试确认存在四个权限判断。

- [ ] **Step 5: 提交本任务**

```bash
git add nest-admin-frontend/src/views/systemMonitor/scheduledJobs/index.vue nest-admin-frontend/src/views/systemMonitor/scheduledJobs/index.structure.spec.ts
git commit -m "feat: gate scheduled jobs actions by permission"
```

### Task 5: 补前端权限行为测试

**Files:**
- Modify: `nest-admin-frontend/src/views/systemMonitor/scheduledJobs/index.behavior.spec.ts`

- [ ] **Step 1: 写失败测试，覆盖按钮显隐**

```ts
const permissionState = vi.hoisted(() => ({
  permissions: ['system/scheduledJobs/list'],
}));

vi.mock('@/stores/user', () => ({
  useUserStore: () => permissionState,
}));

it('仅有页面权限时不显示日志和执行按钮', async () => {
  const wrapper = mount(ScheduledJobsView, {
    global: {
      stubs: {
        ElTable,
        ElTableColumn,
        ElButton: {
          emits: ['click'],
          template: '<button type="button" @click="$emit(\'click\')"><slot /></button>',
        },
      },
    },
  });

  await flushPromises();

  const buttonTexts = wrapper.findAll('button').map((item) => item.text());
  expect(buttonTexts).not.toContain('运行日志');
  expect(buttonTexts).not.toContain('立即执行');
  expect(buttonTexts).not.toContain('停用');
});

it('拥有对应权限时显示日志和停用按钮', async () => {
  permissionState.permissions = [
    'system/scheduledJobs/list',
    'system/scheduledJobs/logs',
    'system/scheduledJobs/run',
    'system/scheduledJobs/disable',
  ];

  const wrapper = mount(ScheduledJobsView, {
    global: {
      stubs: {
        ElTable,
        ElTableColumn,
        ElButton: {
          emits: ['click'],
          template: '<button type="button" @click="$emit(\'click\')"><slot /></button>',
        },
      },
    },
  });

  await flushPromises();

  const buttonTexts = wrapper.findAll('button').map((item) => item.text());
  expect(buttonTexts).toContain('运行日志');
  expect(buttonTexts).toContain('立即执行');
  expect(buttonTexts).toContain('停用');
});
```

- [ ] **Step 2: 运行测试确认失败**

Run: `npm run test -- src/views/systemMonitor/scheduledJobs/index.behavior.spec.ts`

Expected: FAIL，当前页面无权限显隐，按钮始终出现。

- [ ] **Step 3: 调整测试初始化并确保现有行为用例继续通过**

```ts
beforeEach(() => {
  vi.clearAllMocks()
  permissionState.permissions = [
    'system/scheduledJobs/list',
    'system/scheduledJobs/logs',
    'system/scheduledJobs/run',
    'system/scheduledJobs/enable',
    'system/scheduledJobs/disable',
  ]
  apiMocks.getScheduledJobs.mockResolvedValue(tableData)
  apiMocks.getScheduledJobLogs.mockResolvedValue([])
  apiMocks.runScheduledJob.mockResolvedValue({})
  apiMocks.enableScheduledJob.mockResolvedValue({})
  apiMocks.disableScheduledJob.mockResolvedValue({})
})
```

### 注意

- 不修改已有“点击立即执行 / 启用 / 停用”的断言目标
- 仅在测试中补用户权限状态，保证原有行为测试仍能拿到按钮

- [ ] **Step 4: 运行测试确认通过**

Run: `npm run test -- src/views/systemMonitor/scheduledJobs/index.behavior.spec.ts`

Expected: PASS，新增显隐测试和原有交互测试全部通过。

- [ ] **Step 5: 提交本任务**

```bash
git add nest-admin-frontend/src/views/systemMonitor/scheduledJobs/index.behavior.spec.ts
git commit -m "test: cover scheduled jobs permission visibility"
```

### Task 6: 完整验证

**Files:**
- Modify: `docs/superpowers/plans/2026-05-06-scheduled-jobs-system-management-menu.md`

- [ ] **Step 1: 运行后端定向测试**

Run: `npm run test -- src/modules/systemScheduledJobs/menu-sync.service.spec.ts --runInBand`

Expected: PASS，菜单种子和同步逻辑测试通过。

- [ ] **Step 2: 运行权限守卫测试**

Run: `npm run test -- src/modules/auth/auth.guard.spec.ts --runInBand`

Expected: PASS，新增定时任务权限映射测试通过。

- [ ] **Step 3: 运行前端定向测试**

Run: `npm run test -- src/views/systemMonitor/scheduledJobs/index.structure.spec.ts src/views/systemMonitor/scheduledJobs/index.behavior.spec.ts`

Expected: PASS，结构和行为测试全部通过。

- [ ] **Step 4: 运行前后端静态校验**

Run: `npm run lint`
Workdir: `nest-admin`
Expected: PASS

Run: `npm run type-check`
Workdir: `nest-admin-frontend`
Expected: PASS

- [ ] **Step 5: 提交最终验证结果**

```bash
git add docs/superpowers/plans/2026-05-06-scheduled-jobs-system-management-menu.md
git commit -m "docs: record scheduled jobs menu verification"
```

## Self-Review

- Spec coverage：已覆盖菜单归属、页面复用、按钮权限、后端守卫、启动幂等补齐、新老环境兼容、不自动授予角色、前后端验证。
- Placeholder scan：计划中未保留 TBD、TODO、或“自行处理异常”这类空泛描述。
- Type consistency：权限标识统一使用 `system/scheduledJobs/*`；页面组件路径统一使用 `systemMonitor/scheduledJobs/index`；路由路径统一使用 `/systemManage/scheduledJobs/index`。
