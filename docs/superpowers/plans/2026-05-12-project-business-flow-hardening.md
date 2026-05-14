# 项目管理业务流治理 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 一次性治理项目管理业务流剩余的启动副作用、权限口径分散、审批双通道、HTTP 权限覆盖、前端项目角色按钮、交付状态流转和 TypeORM 同步风险。

**Architecture:** 后端以“项目执行对象权限 helper + 状态机校验 + 启动配置显式化”为主线，先用单测锁定行为，再做最小实现；前端只在项目详情页把菜单权限和后端 `permissionContext` 合并判断。保留现有 API 兼容，不删除已有审批入口，但通过服务层统一约束让旧入口无法绕过状态和权限。

**Tech Stack:** NestJS、TypeORM、Jest、Vue 3、Element Plus、Vite、TypeScript。

---

## 当前边界

- 当前工作区已有大量未提交业务流修复，本计划执行时不得回滚已有改动。
- 不运行 `nest-admin/bin/build.sh`。
- 后端验证顺序：`npm run lint`、相关 Jest、必要时 `npm run build`。
- 前端验证顺序：`npm run type-check`，API shape 变更后运行根目录 `npm run check:api-contract`。
- 本计划不包含自动 `git commit`，避免把当前未提交修复和本轮治理强制拆分；执行完成后再统一决定提交策略。

## 文件结构

- Modify: `nest-admin/src/main.ts`
  - 使用启动配置工具读取 HTTP 端口，避免硬编码 `3000`。
- Create: `nest-admin/src/main.config.ts`
  - 导出可单测的启动端口解析函数，避免测试 import `main.ts` 时触发 Nest 启动。
- Modify: `nest-admin/package.json`
  - 拆分普通 watch 启动和 debug 启动，避免默认占用 `9229`。
- Modify: `nest-admin/config/index.ts`
  - 增加 `server.port`、`server.debugPort`、`featureFlags.syncMenusOnBoot`、生产 `synchronize: false`。
- Modify: `nest-admin/src/modules/systemScheduledJobs/menu-sync.service.ts`
  - 启动菜单同步改为显式开关控制，默认不写库。
- Test: `nest-admin/src/modules/systemScheduledJobs/menu-sync.service.spec.ts`
  - 覆盖默认跳过启动写库、开启后同步菜单。
- Create: `nest-admin/src/modulesBusi/projects/project-execution-permission.service.ts`
  - 抽取项目执行对象统一权限方法，降低各业务 service 重复实现。
- Modify: `nest-admin/src/modulesBusi/projects/module.ts`
  - 导出新增权限 helper。
- Modify: `nest-admin/src/modulesBusi/{tasks,tickets,risks,changes,sprints,milestones,go-live-records,acceptance-records,handover-records}/service.ts`
  - 替换重复的项目可见性、详情权限、写入权限校验。
- Test: 对应 `service.spec.ts`
  - 锁定列表过滤、详情权限、写入权限、归档项目不可写。
- Modify: `nest-admin/src/modulesBusi/changes/service.ts`
  - 直接审批入口委托统一审批决策，保留兼容路由但禁止绕过状态机。
- Test: `nest-admin/src/modulesBusi/changes/service.spec.ts`
  - 覆盖非 pending 不可直接审批、无项目管理权限不可审批、工作流回调一致。
- Create: `nest-admin/src/modulesBusi/project-http-permission.spec.ts`
  - HTTP 层验证继承 `BaseController` 的项目执行对象路由不会绕过权限。
- Modify: `nest-admin-frontend/src/views/business/projectManage/detail.vue`
  - 项目详情页的新增任务、工单、风险、变更、Sprint、知识按钮同时看菜单权限和项目角色上下文。
- Modify: `nest-admin/src/modulesBusi/go-live-records/service.ts`
- Modify: `nest-admin/src/modulesBusi/acceptance-records/service.ts`
- Modify: `nest-admin/src/modulesBusi/handover-records/service.ts`
  - 增加细粒度状态流转校验。
- Test: `nest-admin/src/modulesBusi/{go-live-records,acceptance-records,handover-records}/service.spec.ts`
  - 覆盖允许和禁止的状态流转。
- Modify: `nest-admin/src/common/services/workflow-integration.service.ts`
- Test: `nest-admin/src/common/services/workflow-integration.service.spec.ts`
  - 审批发起前校验当前状态，回调只更新符合预期状态的业务单。

---

### Task 1: 启动配置和端口冲突治理

**Files:**
- Modify: `nest-admin/config/index.ts`
- Modify: `nest-admin/src/main.ts`
- Create: `nest-admin/src/main.config.ts`
- Modify: `nest-admin/package.json`
- Test: `nest-admin/src/main.config.spec.ts`

- [ ] **Step 1: 写失败测试，锁定启动端口来自配置**

Create `nest-admin/src/main.config.spec.ts`:

```ts
describe("bootstrap 配置", () => {
  afterEach(() => {
    delete process.env.PORT;
  });

  it("默认 HTTP 端口使用配置值 3000", async () => {
    const { getHttpPort } = await import("./main.config");
    expect(getHttpPort({ server: { port: 3000 } } as any)).toBe(3000);
  });

  it("PORT 环境变量优先于配置值", async () => {
    process.env.PORT = "3100";
    const { getHttpPort } = await import("./main.config");
    expect(getHttpPort({ server: { port: 3000 } } as any)).toBe(3100);
  });
});
```

- [ ] **Step 2: 运行失败测试**

Run:

```bash
cd nest-admin && npm run test -- main.config.spec.ts
```

Expected: FAIL，提示 `getHttpPort` 未导出。

- [ ] **Step 3: 实现端口读取**

Update `nest-admin/config/index.ts`:

```ts
server: {
  port: 3000,
  debugPort: 9229,
},
```

Create `nest-admin/src/main.config.ts`:

```ts
export function getHttpPort(appConfig: any) {
  const rawPort = process.env.PORT || appConfig.server?.port || 3000;
  const port = Number(rawPort);
  return Number.isFinite(port) && port > 0 ? port : 3000;
}
```

Update `nest-admin/src/main.ts`:

```ts
import { getHttpPort } from "./main.config";

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { abortOnError: false });
  // 保留现有中间件和全局配置
  const port = getHttpPort(config);
  await app.listen(port);
  console.log(`localhost:${port} 启动成功`);
}
```

Update `nest-admin/package.json` scripts:

```json
{
  "dev": "nest start --watch -- -b swc env=dev",
  "start:dev": "nest start --watch -- -b swc env=dev",
  "start:debug": "nest start --debug 0.0.0.0:9229 --watch -- -b swc env=dev"
}
```

- [ ] **Step 4: 运行端口测试**

Run:

```bash
cd nest-admin && npm run test -- main.config.spec.ts
```

Expected: PASS。

---

### Task 2: 启动写库治理

**Files:**
- Modify: `nest-admin/config/index.ts`
- Modify: `nest-admin/src/modules/systemScheduledJobs/menu-sync.service.ts`
- Modify: `nest-admin/src/modules/systemScheduledJobs/menu-sync.service.spec.ts`

- [ ] **Step 1: 写失败测试，默认启动不同步菜单**

Add to `menu-sync.service.spec.ts`:

```ts
it("默认配置下应用启动不写入菜单", async () => {
  const menuRepository = {
    findOne: jest.fn(),
    save: jest.fn(),
  };
  const service = new MenuSyncService(menuRepository as never, {
    featureFlags: { syncMenusOnBoot: false },
  } as any);

  await service.onApplicationBootstrap();

  expect(menuRepository.findOne).not.toHaveBeenCalled();
  expect(menuRepository.save).not.toHaveBeenCalled();
});
```

- [ ] **Step 2: 写开启后同步菜单测试**

Add:

```ts
it("显式开启启动同步时才同步菜单", async () => {
  const menuRepository = {
    findOne: jest
      .fn()
      .mockResolvedValueOnce({ id: "parent" })
      .mockResolvedValue({ id: "page" }),
    save: jest.fn((menu) => Promise.resolve({ ...menu, id: menu.id || "page" })),
  };
  const service = new MenuSyncService(menuRepository as never, {
    featureFlags: { syncMenusOnBoot: true },
  } as any);

  await service.onApplicationBootstrap();

  expect(menuRepository.findOne).toHaveBeenCalled();
  expect(menuRepository.save).toHaveBeenCalled();
});
```

- [ ] **Step 3: 运行失败测试**

Run:

```bash
cd nest-admin && npm run test -- modules/systemScheduledJobs/menu-sync.service.spec.ts
```

Expected: FAIL，构造函数还不接收配置，默认仍会查询菜单。

- [ ] **Step 4: 实现显式开关**

Update `nest-admin/config/index.ts`:

```ts
featureFlags: {
  syncMenusOnBoot: process.env.SYSTEM_MENU_SYNC_ON_BOOT === "true",
},
```

Update `menu-sync.service.ts`:

```ts
import { config } from "config";

constructor(
  @InjectRepository(Menu)
  private readonly menuRepository: Repository<Menu>,
  private readonly appConfig = config,
) {}

async onApplicationBootstrap() {
  if (!this.appConfig.featureFlags?.syncMenusOnBoot) {
    this.logger.log("已跳过启动菜单同步，设置 SYSTEM_MENU_SYNC_ON_BOOT=true 可启用");
    return;
  }
  await this.syncScheduledJobsMenus();
}

async syncScheduledJobsMenus() {
  const parentMenu = await this.menuRepository.findOne({
    where: { permissionKey: scheduledJobsMenuSeed.parentPermissionKey },
  });
  if (!parentMenu) {
    this.logger.error(
      `菜单同步失败：未找到父菜单 ${scheduledJobsMenuSeed.parentPermissionKey}`,
    );
    return;
  }

  const pageMenu = await this.syncMenu(parentMenu.id, scheduledJobsMenuSeed.page);
  for (const button of scheduledJobsMenuSeed.buttons) {
    await this.syncMenu(pageMenu.id, button);
  }
}
```

- [ ] **Step 5: 运行菜单同步测试**

Run:

```bash
cd nest-admin && npm run test -- modules/systemScheduledJobs/menu-sync.service.spec.ts
```

Expected: PASS。

---

### Task 3: TypeORM synchronize 风险治理

**Files:**
- Modify: `nest-admin/config/index.ts`
- Test: `nest-admin/src/config.spec.ts`

- [ ] **Step 1: 写失败测试，生产环境默认不同步表结构**

Create `nest-admin/src/config.spec.ts`:

```ts
describe("数据库配置", () => {
  const originalArgv = process.argv;

  afterEach(() => {
    jest.resetModules();
    process.argv = originalArgv;
  });

  it("prod 环境默认关闭 synchronize", async () => {
    process.argv = ["node", "main", "env=prod"];
    const { config } = await import("config");
    expect(config.database.synchronize).toBe(false);
  });

  it("dev 环境保留 synchronize，减少本地开发破坏性变更", async () => {
    process.argv = ["node", "main", "env=dev"];
    const { config } = await import("config");
    expect(config.database.synchronize).toBe(true);
  });
});
```

- [ ] **Step 2: 运行失败测试**

Run:

```bash
cd nest-admin && npm run test -- config.spec.ts
```

Expected: FAIL，当前 `prod.database.synchronize` 是 `true`。

- [ ] **Step 3: 修改生产同步配置**

Update `nest-admin/config/index.ts`:

```ts
prod: {
  database: {
    type: "mysql",
    host: "localhost",
    port: 3306,
    username: "root",
    password: "12345678",
    database: "psd2",
    synchronize: false,
    autoLoadEntities: true,
  },
},
```

- [ ] **Step 4: 运行配置测试**

Run:

```bash
cd nest-admin && npm run test -- config.spec.ts
```

Expected: PASS。

---

### Task 4: 项目执行对象权限 helper 收口

**Files:**
- Create: `nest-admin/src/modulesBusi/projects/project-execution-permission.service.ts`
- Modify: `nest-admin/src/modulesBusi/projects/module.ts`
- Modify: `nest-admin/src/modulesBusi/{tasks,tickets,risks,changes,sprints,milestones,go-live-records,acceptance-records,handover-records}/service.ts`
- Test: `nest-admin/src/modulesBusi/projects/project-execution-permission.service.spec.ts`

- [ ] **Step 1: 写 helper 单测**

Create `project-execution-permission.service.spec.ts`:

```ts
import { ProjectExecutionPermissionService } from "./project-execution-permission.service";

describe("ProjectExecutionPermissionService", () => {
  const projectsService = {
    getVisibleProjectIdsForUser: jest.fn(),
    assertExecutionObjectPermission: jest.fn(),
    assertProjectNotArchived: jest.fn(),
  };

  beforeEach(() => jest.clearAllMocks());

  it("获取用户可见项目 ID 时透传用户权限", async () => {
    projectsService.getVisibleProjectIdsForUser.mockResolvedValue(["p1"]);
    const service = new ProjectExecutionPermissionService(projectsService as any);

    await expect(
      service.getVisibleProjectIds("u1", ["business/projects/manageAll"]),
    ).resolves.toEqual(["p1"]);

    expect(projectsService.getVisibleProjectIdsForUser).toHaveBeenCalledWith(
      "u1",
      ["business/projects/manageAll"],
    );
  });

  it("写入项目执行对象时同时校验项目未归档和执行对象权限", async () => {
    const service = new ProjectExecutionPermissionService(projectsService as any);

    await service.assertWritableProject("p1", "u1");

    expect(projectsService.assertProjectNotArchived).toHaveBeenCalledWith("p1");
    expect(projectsService.assertExecutionObjectPermission).toHaveBeenCalledWith(
      "p1",
      "u1",
    );
  });
});
```

- [ ] **Step 2: 运行失败测试**

Run:

```bash
cd nest-admin && npm run test -- modulesBusi/projects/project-execution-permission.service.spec.ts
```

Expected: FAIL，helper 文件不存在。

- [ ] **Step 3: 实现 helper**

Create `project-execution-permission.service.ts`:

```ts
import { Injectable } from "@nestjs/common";
import { ProjectsService } from "./service";

@Injectable()
export class ProjectExecutionPermissionService {
  constructor(private readonly projectsService: ProjectsService) {}

  getVisibleProjectIds(userId: string, permissions: string[] = []) {
    return this.projectsService.getVisibleProjectIdsForUser(userId, permissions);
  }

  assertReadableProject(projectId: string, userId: string) {
    return this.projectsService.assertExecutionObjectPermission(projectId, userId);
  }

  async assertWritableProject(projectId: string, userId: string) {
    await this.projectsService.assertProjectNotArchived(projectId);
    await this.projectsService.assertExecutionObjectPermission(projectId, userId);
  }
}
```

Update `projects/module.ts` providers/exports:

```ts
providers: [ProjectsService, ProjectExecutionPermissionService],
exports: [ProjectsService, ProjectExecutionPermissionService],
```

- [ ] **Step 4: 替换重复服务逻辑**

在每个项目执行对象 service 中注入 `ProjectExecutionPermissionService`，把以下调用集中替换：

```ts
await this.projectExecutionPermission.assertReadableProject(projectId, operatorId);
await this.projectExecutionPermission.assertWritableProject(projectId, operatorId);
const visibleProjectIds = await this.projectExecutionPermission.getVisibleProjectIds(
  operatorId,
  permissions,
);
```

`ChangesService` 仍保留 `ProjectsService`，因为直接审批要调用项目管理权限；其他服务只保留当前业务所需的依赖。

- [ ] **Step 5: 运行权限相关单测**

Run:

```bash
cd nest-admin && npm run test -- projects/service.spec.ts tasks/service.spec.ts changes/service.spec.ts sprints/service.spec.ts milestones/service.spec.ts
```

Expected: PASS。

---

### Task 5: 变更直接审批双通道收敛

**Files:**
- Modify: `nest-admin/src/modulesBusi/changes/service.ts`
- Modify: `nest-admin/src/modulesBusi/changes/service.spec.ts`
- Modify: `nest-admin-frontend/src/views/business/changeManage/form.vue`

- [ ] **Step 1: 写服务层测试，旧入口不能绕过 pending 状态和项目权限**

Add to `changes/service.spec.ts`:

```ts
it("直接审批只允许 pending 状态", async () => {
  repository.findOne.mockResolvedValue({
    id: "c1",
    projectId: "p1",
    status: ChangeStatus.approved,
  });

  await expect(service.approve("c1", "u1", "同意")).rejects.toThrow(
    "只有待审批状态的变更才能审批",
  );
});

it("直接审批必须具备项目管理权限", async () => {
  repository.findOne.mockResolvedValue({
    id: "c1",
    projectId: "p1",
    status: ChangeStatus.pending,
  });
  projectsService.assertProjectManagePermission.mockRejectedValue(
    new Error("当前无审批该变更的权限"),
  );

  await expect(service.approve("c1", "u1", "同意")).rejects.toThrow(
    "当前无审批该变更的权限",
  );
});
```

- [ ] **Step 2: 运行变更测试**

Run:

```bash
cd nest-admin && npm run test -- modulesBusi/changes/service.spec.ts
```

Expected: PASS。若该测试失败，说明服务层审批状态或权限约束和计划目标不一致，执行 Step 3。

- [ ] **Step 3: 服务层统一审批决策**

确保 `approve/reject` 只做兼容入口，不信任 body approver，并统一校验：

```ts
private async assertChangeApprovalAllowed(id: string, approverId: string) {
  const change = await this.repository.findOne({
    where: { id, isDelete: null as any } as any,
  });
  if (!change) throw new Error("变更不存在");
  if (change.status !== ChangeStatus.pending) {
    throw new Error("只有待审批状态的变更才能审批");
  }
  await this.projectsService.assertProjectManagePermission(
    change.projectId,
    approverId,
  );
  return change;
}
```

- [ ] **Step 4: 前端去掉无效 approverId 传参**

Update `changeManage/form.vue`：

```ts
await approve(route.query.id, { comment: form.value.approvalComment || "同意" });
await reject(route.query.id, { comment: form.value.approvalComment || "不同意" });
```

- [ ] **Step 5: 验证变更流**

Run:

```bash
cd nest-admin && npm run test -- modulesBusi/changes/service.spec.ts common/services/workflow-integration.service.spec.ts
cd nest-admin-frontend && npm run type-check
```

Expected: PASS。

---

### Task 6: HTTP 层权限测试补齐

**Files:**
- Create: `nest-admin/src/modulesBusi/project-http-permission.spec.ts`
- Verify: `nest-admin/src/modulesBusi/{tasks,tickets,risks,changes,sprints,milestones,go-live-records,acceptance-records,handover-records}/controller.ts`

- [ ] **Step 1: 写 HTTP 层路由测试**

Create `project-http-permission.spec.ts`:

```ts
import "reflect-metadata";
import { PATH_METADATA } from "@nestjs/common/constants";
import { TasksController } from "./tasks/controller";
import { TicketsController } from "./tickets/controller";
import { RisksController } from "./risks/controller";
import { ChangesController } from "./changes/controller";
import { SprintsController } from "./sprints/controller";
import { MilestonesController } from "./milestones/controller";
import { GoLiveRecordsController } from "./go-live-records/controller";
import { AcceptanceRecordsController } from "./acceptance-records/controller";
import { HandoverRecordsController } from "./handover-records/controller";

describe("项目执行对象 HTTP 权限入口", () => {
  const controllers = [
    TasksController,
    TicketsController,
    RisksController,
    ChangesController,
    SprintsController,
    MilestonesController,
    GoLiveRecordsController,
    AcceptanceRecordsController,
    HandoverRecordsController,
  ];

  it.each(controllers)("%p 必须覆盖 list/getOne 路由", (ControllerClass) => {
    expect(Object.prototype.hasOwnProperty.call(ControllerClass.prototype, "list")).toBe(true);
    expect(Object.prototype.hasOwnProperty.call(ControllerClass.prototype, "getOne")).toBe(true);
    expect(Reflect.getMetadata(PATH_METADATA, ControllerClass.prototype.list)).toBe("list");
    expect(Reflect.getMetadata(PATH_METADATA, ControllerClass.prototype.getOne)).toBe("getOne/:id");
  });
});
```

- [ ] **Step 2: 运行 HTTP 权限入口测试**

Run:

```bash
cd nest-admin && npm run test -- modulesBusi/project-http-permission.spec.ts common/base-controller-route-override.spec.ts
```

Expected: PASS。

- [ ] **Step 3: 路由覆盖实现标准**

每个 controller 都必须直接声明：

```ts
@Get("list")
async list(@Query() query: QueryListDto, @Req() req: any) {
  query.pageNum ??= 1;
  query.pageSize ??= 10;
  return this.service.list({
    ...query,
    _operatorId: req.user?.id,
    _operatorPermissions: req.user?.permissions || [],
  } as any);
}

@Get("getOne/:id")
async getOne(@Param("id") id: string, @Req() req?: any) {
  return this.service.getOne({ id, _operatorId: req.user?.id } as any);
}
```

这一步用于修复 Step 2 暴露的回归；当前代码已经按该标准覆盖时，不需要修改 controller。

---

### Task 7: 前端项目详情页按钮结合项目角色

**Files:**
- Modify: `nest-admin-frontend/src/views/business/projectManage/detail.vue`

- [ ] **Step 1: 增加业务按钮权限计算**

在 `projectManage/detail.vue` 中保留已有 `checkPermi`，增加：

```ts
const canOperateExecutionObjects = computed(() => {
  const context = projectPermissionContext.value || {};
  return context.canEdit !== false || context.isManager || context.isDeliveryManager;
});

const canAddTaskInProject = computed(() => canTaskAdd.value && canOperateExecutionObjects.value);
const canAddTicketInProject = computed(() => canTicketAdd.value && canOperateExecutionObjects.value);
const canAddRiskInProject = computed(() => canRiskAdd.value && canOperateExecutionObjects.value);
const canAddChangeInProject = computed(() => canChangeAdd.value && canOperateExecutionObjects.value);
const canAddSprintInProject = computed(() => canSprintAdd.value && canOperateExecutionObjects.value);
const canAddKnowledgeInProject = computed(() => canKnowledgeAdd.value && canOperateExecutionObjects.value);
```

- [ ] **Step 2: 替换模板中的按钮判断**

把详情页项目内动作从：

```vue
v-if="canTaskAdd"
```

替换为：

```vue
v-if="canAddTaskInProject"
```

同理替换工单、风险、变更、Sprint、知识新增按钮。

- [ ] **Step 3: 运行前端类型检查**

Run:

```bash
cd nest-admin-frontend && npm run type-check
```

Expected: PASS。

---

### Task 8: 上线/验收/交接状态机约束

**Files:**
- Modify: `nest-admin/src/modulesBusi/go-live-records/service.ts`
- Modify: `nest-admin/src/modulesBusi/acceptance-records/service.ts`
- Modify: `nest-admin/src/modulesBusi/handover-records/service.ts`
- Create/Modify tests:
  - `nest-admin/src/modulesBusi/go-live-records/service.spec.ts`
  - `nest-admin/src/modulesBusi/acceptance-records/service.spec.ts`
  - `nest-admin/src/modulesBusi/handover-records/service.spec.ts`

- [ ] **Step 1: 写上线状态机失败测试**

Create `go-live-records/service.spec.ts`:

```ts
it("上线单不允许从已成功改回草稿", async () => {
  repository.findOne.mockResolvedValue({
    id: "g1",
    projectId: "p1",
    status: GoLiveRecordStatus.succeeded,
  });

  await expect(
    service.update({
      id: "g1",
      projectId: "p1",
      status: GoLiveRecordStatus.draft,
      _operatorId: "u1",
    } as any),
  ).rejects.toThrow("上线单当前状态不允许变更为草稿");
});
```

- [ ] **Step 2: 写验收状态机失败测试**

Create `acceptance-records/service.spec.ts`:

```ts
it("验收通过后不允许改为整改中", async () => {
  repository.findOne.mockResolvedValue({
    id: "a1",
    projectId: "p1",
    result: AcceptanceRecordResult.passed,
  });

  await expect(
    service.update({
      id: "a1",
      projectId: "p1",
      result: AcceptanceRecordResult.rectifying,
      _operatorId: "u1",
    } as any),
  ).rejects.toThrow("验收单当前结果不允许变更为整改中");
});
```

- [ ] **Step 3: 写交接状态机失败测试**

Create `handover-records/service.spec.ts`:

```ts
it("交接确认后不允许改回草稿", async () => {
  repository.findOne.mockResolvedValue({
    id: "h1",
    projectId: "p1",
    status: HandoverRecordStatus.confirmed,
  });

  await expect(
    service.update({
      id: "h1",
      projectId: "p1",
      status: HandoverRecordStatus.draft,
      _operatorId: "u1",
    } as any),
  ).rejects.toThrow("交接单当前状态不允许变更为草稿");
});
```

- [ ] **Step 4: 实现状态流转表**

上线单允许流转：

```ts
const goLiveAllowedTransitions = {
  [GoLiveRecordStatus.draft]: [
    GoLiveRecordStatus.pendingApproval,
    GoLiveRecordStatus.cancelled,
  ],
  [GoLiveRecordStatus.pendingApproval]: [
    GoLiveRecordStatus.approved,
    GoLiveRecordStatus.cancelled,
  ],
  [GoLiveRecordStatus.approved]: [
    GoLiveRecordStatus.executing,
    GoLiveRecordStatus.cancelled,
  ],
  [GoLiveRecordStatus.executing]: [
    GoLiveRecordStatus.succeeded,
    GoLiveRecordStatus.rolledBack,
  ],
  [GoLiveRecordStatus.succeeded]: [],
  [GoLiveRecordStatus.rolledBack]: [],
  [GoLiveRecordStatus.cancelled]: [],
};
```

验收单允许流转：

```ts
const acceptanceAllowedTransitions = {
  [AcceptanceRecordResult.pending]: [
    AcceptanceRecordResult.passed,
    AcceptanceRecordResult.rejected,
  ],
  [AcceptanceRecordResult.rejected]: [AcceptanceRecordResult.rectifying],
  [AcceptanceRecordResult.rectifying]: [
    AcceptanceRecordResult.pending,
    AcceptanceRecordResult.passed,
  ],
  [AcceptanceRecordResult.passed]: [],
};
```

交接单允许流转：

```ts
const handoverAllowedTransitions = {
  [HandoverRecordStatus.draft]: [HandoverRecordStatus.confirmed],
  [HandoverRecordStatus.confirmed]: [],
};
```

在 `update` 中读取当前记录，只有请求状态字段存在且发生变化时校验。

- [ ] **Step 5: 运行状态机测试**

Run:

```bash
cd nest-admin && npm run test -- go-live-records/service.spec.ts acceptance-records/service.spec.ts handover-records/service.spec.ts
```

Expected: PASS。

---

### Task 9: 工作流发起和回调状态一致性

**Files:**
- Modify: `nest-admin/src/common/services/workflow-integration.service.ts`
- Modify: `nest-admin/src/common/services/workflow-integration.service.spec.ts`

- [ ] **Step 1: 写审批发起前状态测试**

Add:

```ts
it("只有草稿上线单可以提交上线审批", async () => {
  goLiveRecordRepository.findOne.mockResolvedValue({
    id: "g1",
    projectId: "p1",
    status: GoLiveRecordStatus.succeeded,
  });

  await expect(service.startGoLiveApproval("g1", "u1")).rejects.toThrow(
    "只有草稿状态的上线单才能提交审批",
  );
});

it("只有待验收或整改中的验收单可以提交验收审批", async () => {
  acceptanceRecordRepository.findOne.mockResolvedValue({
    id: "a1",
    projectId: "p1",
    result: AcceptanceRecordResult.passed,
  });

  await expect(service.startAcceptanceApproval("a1", "u1")).rejects.toThrow(
    "当前验收结果不允许提交审批",
  );
});

it("只有草稿交接单可以提交交接审批", async () => {
  handoverRecordRepository.findOne.mockResolvedValue({
    id: "h1",
    projectId: "p1",
    status: HandoverRecordStatus.confirmed,
  });

  await expect(service.startHandoverApproval("h1", "u1")).rejects.toThrow(
    "只有草稿状态的交接单才能提交审批",
  );
});
```

- [ ] **Step 2: 写回调幂等/状态保护测试**

Add:

```ts
it("上线审批回调只更新待审批上线单", async () => {
  goLiveRecordRepository.findOne.mockResolvedValue({
    id: "g1",
    status: GoLiveRecordStatus.succeeded,
  });

  await service.handleWorkflowCallback("wf1", "completed", {
    businessKey: "goLive_g1",
  });

  expect(goLiveRecordRepository.update).not.toHaveBeenCalled();
});
```

- [ ] **Step 3: 运行失败测试**

Run:

```bash
cd nest-admin && npm run test -- common/services/workflow-integration.service.spec.ts
```

Expected: FAIL，当前发起和回调状态约束还不完整。

- [ ] **Step 4: 实现状态保护**

在 `startGoLiveApproval/startAcceptanceApproval/startHandoverApproval` 中增加状态校验：

```ts
if (record.status !== GoLiveRecordStatus.draft) {
  throw new BadRequestException("只有草稿状态的上线单才能提交审批");
}
```

回调前先查当前记录，非预期状态直接返回：

```ts
const record = await this.goLiveRecordRepository.findOne({
  where: { id: recordId, isDelete: null as any } as any,
});
if (record?.status !== GoLiveRecordStatus.pendingApproval) return;
```

- [ ] **Step 5: 运行工作流测试**

Run:

```bash
cd nest-admin && npm run test -- common/services/workflow-integration.service.spec.ts
```

Expected: PASS。

---

### Task 10: 全量回归验证

**Files:**
- Verify: backend/frontend/root commands。

- [ ] **Step 1: 后端 lint**

Run:

```bash
cd nest-admin && npm run lint
```

Expected: PASS。

- [ ] **Step 2: 后端相关 Jest**

Run:

```bash
cd nest-admin && npm run test -- common/base-controller-route-override.spec.ts modulesBusi/project-http-permission.spec.ts projects/service.spec.ts projects/project-execution-permission.service.spec.ts tasks/service.spec.ts changes/service.spec.ts sprints/service.spec.ts milestones/service.spec.ts go-live-records/service.spec.ts acceptance-records/service.spec.ts handover-records/service.spec.ts common/services/workflow-integration.service.spec.ts modules/systemScheduledJobs/menu-sync.service.spec.ts config.spec.ts main.config.spec.ts
```

Expected: PASS。

- [ ] **Step 3: 后端 build**

Run:

```bash
cd nest-admin && npm run build
```

Expected: PASS。

- [ ] **Step 4: 前端 type-check**

Run:

```bash
cd nest-admin-frontend && npm run type-check
```

Expected: PASS。

- [ ] **Step 5: API contract 和空白字符检查**

Run:

```bash
npm run check:api-contract
git diff --check
```

Expected: PASS。

- [ ] **Step 6: DI 启动验证**

Run:

```bash
cd nest-admin && PORT=3100 npm run dev
```

Expected: Nest 完成依赖注入和路由映射；如果数据库不可达，只记录数据库连接错误，不把它误判为 DI 错误。

---

## 自检

- 覆盖 8 个剩余问题：启动写库、端口/debug 端口、权限模型分散、变更审批双通道、HTTP 权限测试、前端项目角色按钮、上线/验收/交接状态约束、生产 `synchronize` 风险。
- 没有直接删除兼容接口，旧前端入口仍可调用，但服务层统一约束权限和状态。
- 生产数据库同步风险优先关闭，dev 暂保留以减少本地开发破坏性切换。
- 每个任务都有明确文件、测试命令和预期结果。
