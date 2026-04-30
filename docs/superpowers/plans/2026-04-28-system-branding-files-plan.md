# 系统 Logo 与标签页图标失效修复 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 修复系统配置中的 `systemLogo` 和 `browserIcon` 附件未关联问题，避免被每日孤儿文件清理任务误删。

**Architecture:** 保持前端上传与展示逻辑不变，只在后端 `system/configs` 保存链路增加品牌图片附件同步。保存系统配置后，将新 logo/favicon 对应文件标记为已关联，并将被替换的旧文件标记为已删除，复用现有附件清理机制。

**Tech Stack:** NestJS、TypeORM、Jest、现有 `BaseController` / `BaseService` / `SysFileService`

---

## 文件结构

- Modify: `nest-admin/src/modules/configs/controller.ts`
  - 为系统配置提供显式 `POST /system/configs/save` 保存入口，接管基础控制器默认保存逻辑。
- Modify: `nest-admin/src/modules/configs/service.ts`
  - 注入 `SysFileService`，在配置保存后执行品牌附件关联与旧文件回收。
- Modify: `nest-admin/src/modules/configs/service.spec.ts`
  - 为系统配置保存与附件同步逻辑补充单元测试。
- Modify: `nest-admin/src/modules/sys/file/entity.ts`
  - 为系统配置附件增加统一业务类型枚举值。

## 实现约束

1. 不修改 `nest-admin-frontend`。
2. 不新增上传接口。
3. 不修改通用上传控制器与定时清理逻辑。
4. 只在系统配置保存成功后执行附件同步。
5. 对外链、空值、找不到附件记录的情况保持容错，不阻塞配置保存。

### Task 1: 为系统配置定义附件业务类型并补充失败测试

**Files:**
- Modify: `nest-admin/src/modules/sys/file/entity.ts`
- Modify: `nest-admin/src/modules/configs/service.spec.ts`

- [ ] **Step 1: 扩展品牌配置测试夹具，先写失败用例**

将 `nest-admin/src/modules/configs/service.spec.ts` 改为以下内容，先定义依赖 mock 和保存场景测试。此时测试会因 `save` 方法与附件逻辑不存在而失败。

```ts
import { SystenConfigsService } from "./service";
import { BusinessType, FileStatus } from "src/modules/sys/file/entity";

describe("SystenConfigsService", () => {
  function createRepository() {
    return {
      findOne: jest.fn(),
      save: jest.fn(),
    };
  }

  function createSysFileService() {
    return {
      findByPath: jest.fn(),
      associateFiles: jest.fn(),
      softDeleteByPath: jest.fn(),
    };
  }

  it("优先返回系统配置中的有效时间", async () => {
    const repository = createRepository();
    repository.findOne.mockResolvedValue({ sessionExpireMinutes: "45" });
    const service = new SystenConfigsService(
      repository as never,
      createSysFileService() as never,
    );

    await expect(service.getSessionExpireMinutes()).resolves.toBe(45);
  });

  it("未配置时回退到 30 分钟", async () => {
    const repository = createRepository();
    repository.findOne.mockResolvedValue({ sessionExpireMinutes: "" });
    const service = new SystenConfigsService(
      repository as never,
      createSysFileService() as never,
    );

    await expect(service.getSessionExpireMinutes()).resolves.toBe(30);
  });

  it("保存配置后应关联新的品牌附件并软删除被替换的旧附件", async () => {
    const repository = createRepository();
    const sysFileService = createSysFileService();
    const service = new SystenConfigsService(
      repository as never,
      sysFileService as never,
    );

    repository.findOne.mockResolvedValueOnce({
      id: "config-old",
      systemLogo: "branding/old-logo.png",
      browserIcon: "branding/old-icon.ico",
    });
    repository.save.mockImplementation(async (data) => ({
      id: data.id || "config-new",
      ...data,
    }));
    sysFileService.findByPath
      .mockResolvedValueOnce({ id: "file-logo", status: FileStatus.Pending })
      .mockResolvedValueOnce({ id: "file-icon", status: FileStatus.Pending });

    const result = await service.save({
      systemName: "项目系统",
      systemLogo: "branding/new-logo.png",
      browserIcon: "branding/new-icon.ico",
    } as never);

    expect(result).toEqual(
      expect.objectContaining({
        id: "config-new",
        systemLogo: "branding/new-logo.png",
        browserIcon: "branding/new-icon.ico",
      }),
    );
    expect(sysFileService.associateFiles).toHaveBeenCalledTimes(2);
    expect(sysFileService.associateFiles).toHaveBeenNthCalledWith(1, {
      businessType: BusinessType.SystemConfig,
      businessId: "config-new",
      fileIds: ["file-logo"],
    });
    expect(sysFileService.associateFiles).toHaveBeenNthCalledWith(2, {
      businessType: BusinessType.SystemConfig,
      businessId: "config-new",
      fileIds: ["file-icon"],
    });
    expect(sysFileService.softDeleteByPath).toHaveBeenCalledWith(
      "branding/old-logo.png",
    );
    expect(sysFileService.softDeleteByPath).toHaveBeenCalledWith(
      "branding/old-icon.ico",
    );
  });
});
```

- [ ] **Step 2: 运行配置服务测试，确认当前失败**

Run: `npm test -- src/modules/configs/service.spec.ts --runInBand`

Expected:

1. `SystenConfigsService` 构造参数不匹配，或
2. `service.save is not a function`，或
3. `BusinessType.SystemConfig` 未定义

- [ ] **Step 3: 为附件业务类型增加系统配置枚举值**

修改 `nest-admin/src/modules/sys/file/entity.ts` 中的 `BusinessType` 和 `businessTypeMap`，加入系统配置品牌附件类型：

```ts
export enum BusinessType {
  Avatar = "avatar",
  Project = "project",
  Task = "task",
  Ticket = "ticket",
  Change = "change",
  SystemConfig = "system_config",
}

export const businessTypeMap = {
  [BusinessType.Avatar]: "用户头像",
  [BusinessType.Project]: "项目附件",
  [BusinessType.Task]: "任务附件",
  [BusinessType.Ticket]: "工单附件",
  [BusinessType.Change]: "变更附件",
  [BusinessType.SystemConfig]: "系统配置附件",
};
```

- [ ] **Step 4: 再次运行测试，确认失败点只剩保存逻辑缺失**

Run: `npm test -- src/modules/configs/service.spec.ts --runInBand`

Expected: 仍然 FAIL，但失败点应收敛到 `SystenConfigsService.save` 相关逻辑缺失。

### Task 2: 在系统配置服务中实现品牌附件同步

**Files:**
- Modify: `nest-admin/src/modules/configs/service.ts`

- [ ] **Step 1: 先补充服务构造与保存骨架**

将 `nest-admin/src/modules/configs/service.ts` 的构造函数与新增方法补成以下结构，先让类型和调用入口成立：

```ts
import { Injectable } from "@nestjs/common";
import { SystenConfigDto } from "./dto";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { SystenConfig } from "./entity";
import { BaseService } from "src/common/BaseService";
import { SysFileService } from "src/modules/sys/file/service";
import { BusinessType } from "src/modules/sys/file/entity";

@Injectable()
export class SystenConfigsService extends BaseService<
  SystenConfig,
  SystenConfigDto
> {
  constructor(
    @InjectRepository(SystenConfig) repository: Repository<SystenConfig>,
    private readonly sysFileService: SysFileService,
  ) {
    super(SystenConfig, repository);
  }

  async save(createDto: SystenConfigDto) {
    const previousConfig = await this.getLatestConfig();
    const savedConfig = await super.save(createDto);
    await this.syncBrandingFiles(previousConfig, savedConfig);
    return savedConfig;
  }

  private async syncBrandingFiles(
    previousConfig?: Pick<SystenConfig, "systemLogo" | "browserIcon"> | null,
    savedConfig?: Pick<SystenConfig, "id" | "systemLogo" | "browserIcon"> | null,
  ) {
    return;
  }
}
```

- [ ] **Step 2: 运行测试，确认失败收敛到附件同步未实现**

Run: `npm test -- src/modules/configs/service.spec.ts --runInBand`

Expected: FAIL，断言会提示 `associateFiles` 或 `softDeleteByPath` 未按预期调用。

- [ ] **Step 3: 实现品牌附件同步最小逻辑**

在 `nest-admin/src/modules/configs/service.ts` 中补充以下方法。保持逻辑集中，不额外拆无关文件。

```ts
  private getBrandingPaths(config?: {
    systemLogo?: string | null;
    browserIcon?: string | null;
  } | null) {
    return [config?.systemLogo, config?.browserIcon]
      .map((item) => String(item || "").trim())
      .filter(Boolean);
  }

  private isExternalFile(path?: string | null) {
    return /^https?:\/\//i.test(String(path || ""));
  }

  private normalizeBrandingPaths(paths: string[]) {
    return Array.from(
      new Set(paths.filter((item) => item && !this.isExternalFile(item))),
    );
  }

  private async syncBrandingFiles(
    previousConfig?: Pick<SystenConfig, "systemLogo" | "browserIcon"> | null,
    savedConfig?: Pick<SystenConfig, "id" | "systemLogo" | "browserIcon"> | null,
  ) {
    if (!savedConfig?.id) return;

    const currentPaths = this.normalizeBrandingPaths(
      this.getBrandingPaths(savedConfig),
    );
    const previousPaths = this.normalizeBrandingPaths(
      this.getBrandingPaths(previousConfig),
    );

    for (const storedPath of currentPaths) {
      const file = await this.sysFileService.findByPath(storedPath);
      if (!file) continue;

      await this.sysFileService.associateFiles({
        businessType: BusinessType.SystemConfig,
        businessId: savedConfig.id,
        fileIds: [file.id],
      });
    }

    for (const storedPath of previousPaths) {
      if (currentPaths.includes(storedPath)) continue;
      await this.sysFileService.softDeleteByPath(storedPath);
    }
  }
```

- [ ] **Step 4: 运行配置服务测试，确认保存关联场景通过**

Run: `npm test -- src/modules/configs/service.spec.ts --runInBand`

Expected: PASS，三个测试全部通过。

### Task 3: 覆盖外链与复用路径边界，并显式接管配置保存入口

**Files:**
- Modify: `nest-admin/src/modules/configs/service.spec.ts`
- Modify: `nest-admin/src/modules/configs/controller.ts`

- [ ] **Step 1: 追加两个边界失败测试**

在 `nest-admin/src/modules/configs/service.spec.ts` 末尾追加以下两个测试：

```ts
  it("外链图片不应触发附件关联，且找不到记录时不阻塞保存", async () => {
    const repository = createRepository();
    const sysFileService = createSysFileService();
    const service = new SystenConfigsService(
      repository as never,
      sysFileService as never,
    );

    repository.findOne.mockResolvedValueOnce(null);
    repository.save.mockImplementation(async (data) => ({
      id: "config-ext",
      ...data,
    }));

    await expect(
      service.save({
        systemName: "项目系统",
        systemLogo: "https://cdn.example.com/logo.png",
        browserIcon: "branding/favicon.ico",
      } as never),
    ).resolves.toEqual(
      expect.objectContaining({
        id: "config-ext",
        browserIcon: "branding/favicon.ico",
      }),
    );

    expect(sysFileService.findByPath).toHaveBeenCalledTimes(1);
    expect(sysFileService.findByPath).toHaveBeenCalledWith(
      "branding/favicon.ico",
    );
    expect(sysFileService.associateFiles).not.toHaveBeenCalled();
  });

  it("logo 与 favicon 复用同一路径时只关联一次，也不删除当前仍使用的文件", async () => {
    const repository = createRepository();
    const sysFileService = createSysFileService();
    const service = new SystenConfigsService(
      repository as never,
      sysFileService as never,
    );

    repository.findOne.mockResolvedValueOnce({
      id: "config-old",
      systemLogo: "branding/shared.png",
      browserIcon: "branding/legacy.ico",
    });
    repository.save.mockImplementation(async (data) => ({
      id: "config-shared",
      ...data,
    }));
    sysFileService.findByPath.mockResolvedValue({
      id: "file-shared",
      status: FileStatus.Pending,
    });

    await service.save({
      systemName: "项目系统",
      systemLogo: "branding/shared.png",
      browserIcon: "branding/shared.png",
    } as never);

    expect(sysFileService.findByPath).toHaveBeenCalledTimes(1);
    expect(sysFileService.associateFiles).toHaveBeenCalledTimes(1);
    expect(sysFileService.associateFiles).toHaveBeenCalledWith({
      businessType: BusinessType.SystemConfig,
      businessId: "config-shared",
      fileIds: ["file-shared"],
    });
    expect(sysFileService.softDeleteByPath).toHaveBeenCalledTimes(1);
    expect(sysFileService.softDeleteByPath).toHaveBeenCalledWith(
      "branding/legacy.ico",
    );
  });
```

- [ ] **Step 2: 运行测试，确认边界测试先失败**

Run: `npm test -- src/modules/configs/service.spec.ts --runInBand`

Expected: FAIL，至少一条测试会因去重或外链跳过行为不完整而失败。

- [ ] **Step 3: 显式覆盖系统配置保存入口**

修改 `nest-admin/src/modules/configs/controller.ts`，增加与 `BaseController` 同路径的显式保存方法，确保路由进入 `SystenConfigsService.save`：

```ts
import {
  Controller,
  Get,
  Post,
  Body,
  Delete,
  Query,
  Req,
  HttpCode,
} from "@nestjs/common";

@Controller("system/configs")
export class SystenConfigsController extends BaseController<
  SystenConfig,
  SystenConfigsService
> {
  constructor(readonly service: SystenConfigsService) {
    super(service);
  }

  @Post("save")
  async save(@Body() body, @Req() req) {
    if (body.id) {
      delete body.createUser;
      body.updateUser = req.user.id;
    } else {
      delete body.updateUser;
      body.createUser = req.user.name;
    }
    body._operatorPermissions = req.user.permissions || [];
    body._operatorName = req.user.name;
    body._operatorId = req.user.id;
    return this.service.save(body);
  }
}
```

- [ ] **Step 4: 收紧服务实现以满足边界测试**

如果上一步测试仍失败，保持 `nest-admin/src/modules/configs/service.ts` 只做以下最小收紧：

1. `getBrandingPaths` 先返回原始两字段数组。
2. `normalizeBrandingPaths` 负责去空、去外链、去重。
3. 旧路径删除逻辑只删除 `previousPaths` 中不存在于 `currentPaths` 的路径。

目标是让外链跳过、同路径只关联一次、复用中的当前文件不被删除全部成立。

- [ ] **Step 5: 运行配置服务测试，确认所有边界场景通过**

Run: `npm test -- src/modules/configs/service.spec.ts --runInBand`

Expected: PASS，全部系统配置服务测试通过。

- [ ] **Step 6: 运行后端 lint，确认没有引入风格或类型问题**

Run: `npm run lint`

Expected: PASS。

- [ ] **Step 7: 查看变更并提交**

Run:

```bash
git status
git diff -- nest-admin/src/modules/sys/file/entity.ts nest-admin/src/modules/configs/controller.ts nest-admin/src/modules/configs/service.ts nest-admin/src/modules/configs/service.spec.ts
git add nest-admin/src/modules/sys/file/entity.ts nest-admin/src/modules/configs/controller.ts nest-admin/src/modules/configs/service.ts nest-admin/src/modules/configs/service.spec.ts
git commit -m "fix: retain system branding uploads"
```

Expected:

1. `git status` 只包含本次相关变更和已有其他未改文件。
2. 提交成功，提交信息为 `fix: retain system branding uploads`。

## 自检

1. Spec coverage: 已覆盖新附件关联、旧附件回收、外链容错、同路径去重、保存入口接管、验证命令。
2. Placeholder scan: 无 `TODO`、`TBD`、无“自行处理”类空泛描述。
3. Type consistency: 计划统一使用 `BusinessType.SystemConfig`、`SystenConfigsService.save`、`syncBrandingFiles`、`softDeleteByPath`。
