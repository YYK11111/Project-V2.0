import { SystenConfigsService } from "./service";
import { BusinessType } from "src/modules/sys/file/entity";
import { SystenConfigsController } from "./controller";
import { readFileSync } from "fs";
import { resolve } from "path";

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

  it("配置列表应按创建时间倒序返回最新配置", async () => {
    const repository = createRepository();
    const service = new SystenConfigsService(
      repository as never,
      createSysFileService() as never,
    );
    repository.findAndCount = jest
      .fn()
      .mockResolvedValue([
        [{ id: "config-new", defaultUserPassword: "new-password" }],
        1,
      ]);

    await expect(
      service.list({ pageNum: 1, pageSize: 10 } as any),
    ).resolves.toEqual({
      total: 1,
      data: [{ id: "config-new", defaultUserPassword: "new-password" }],
      _flag: true,
    });
    expect(repository.findAndCount).toHaveBeenCalledWith(
      expect.objectContaining({
        order: { createTime: "DESC" },
      }),
    );
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
      ...data,
      id: data.id || "config-new",
    }));
    sysFileService.findByPath
      .mockResolvedValueOnce({ id: "file-logo" })
      .mockResolvedValueOnce({ id: "file-icon" });

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

  it("默认用户密码作为普通配置项留空保存时应清空", async () => {
    const repository = createRepository();
    const service = new SystenConfigsService(
      repository as never,
      createSysFileService() as never,
    );

    repository.findOne.mockResolvedValueOnce({
      id: "config-1",
      defaultUserPassword: "old-password",
    });
    repository.save.mockImplementation(async (data) => data);

    await expect(
      service.save({
        id: "config-1",
        systemName: "项目系统",
        defaultUserPassword: "",
      } as never),
    ).resolves.toEqual(
      expect.objectContaining({
        defaultUserPassword: "",
      }),
    );
  });

  it("配置列表返回默认用户密码明文配置值", async () => {
    const repository = createRepository();
    const service = new SystenConfigsService(
      repository as never,
      createSysFileService() as never,
    );
    repository.findAndCount = jest
      .fn()
      .mockResolvedValue([
        [{ id: "config-1", defaultUserPassword: "secret-password" }],
        1,
      ]);

    await expect(
      service.list({ pageNum: 1, pageSize: 10 } as any),
    ).resolves.toEqual({
      total: 1,
      data: [{ id: "config-1", defaultUserPassword: "secret-password" }],
      _flag: true,
    });
  });

  it("外链图片不应触发附件关联，且找不到记录时不阻塞保存", async () => {
    const repository = createRepository();
    const sysFileService = createSysFileService();
    const service = new SystenConfigsService(
      repository as never,
      sysFileService as never,
    );

    repository.findOne.mockResolvedValueOnce({
      id: "config-old",
      systemLogo: "https://legacy.example.com/logo.png",
      browserIcon: "branding/old-favicon.ico",
    });
    repository.save.mockImplementation(async (data) => ({
      ...data,
      id: "config-ext",
    }));
    sysFileService.findByPath.mockResolvedValueOnce(null);

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
    expect(sysFileService.softDeleteByPath).toHaveBeenCalledTimes(1);
    expect(sysFileService.softDeleteByPath).toHaveBeenCalledWith(
      "branding/old-favicon.ico",
    );
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
      ...data,
      id: "config-shared",
    }));
    sysFileService.findByPath.mockResolvedValueOnce({
      id: "file-shared",
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

  it("旧路径仍被复用时不删除", async () => {
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
      ...data,
      id: "config-reuse",
    }));
    sysFileService.findByPath.mockResolvedValueOnce({
      id: "file-legacy",
    });

    await service.save({
      systemName: "项目系统",
      systemLogo: "branding/new-logo.png",
      browserIcon: "branding/legacy.ico",
    } as never);

    expect(sysFileService.softDeleteByPath).toHaveBeenCalledTimes(1);
    expect(sysFileService.softDeleteByPath).toHaveBeenCalledWith(
      "branding/shared.png",
    );
    expect(sysFileService.softDeleteByPath).not.toHaveBeenCalledWith(
      "branding/legacy.ico",
    );
  });

  it("外部通知配置应合并默认飞书与钉钉结构", async () => {
    const repository = createRepository();
    const service = new SystenConfigsService(
      repository as never,
      createSysFileService() as never,
    );
    repository.findOne.mockResolvedValueOnce({
      id: "config-1",
      externalNotifyConfig: {
        enabled: true,
        feishu: {
          enabled: true,
          appId: "app_1",
        },
      },
    });

    await expect(service.getExternalNotifyConfig()).resolves.toEqual(
      expect.objectContaining({
        enabled: true,
        feishu: expect.objectContaining({
          enabled: true,
          appId: "app_1",
          appSecret: "",
          baseUrl: "https://open.feishu.cn",
        }),
        dingtalk: expect.objectContaining({
          enabled: false,
          baseUrl: "https://oapi.dingtalk.com",
        }),
      }),
    );
  });
});

describe("SystenConfig entity", () => {
  it("支持手动配置系统版本字段", () => {
    const source = readFileSync(resolve(__dirname, "entity.ts"), "utf-8");

    expect(source).toContain('name: "system_version"');
    expect(source).toContain("systemVersion: string");
  });
});

describe("SystenConfigsController", () => {
  function createRequest() {
    return {
      user: {
        id: "user-1",
        name: "tester",
        permissions: ["system:configs:save"],
      },
    };
  }

  it("显式定义 save 入口并转发到 SystenConfigsService.save", async () => {
    const service = {
      save: jest.fn().mockResolvedValue({ id: "config-1" }),
    };
    const controller = new SystenConfigsController(service as never);
    const body = { systemName: "项目系统" };
    const req = createRequest();

    expect(
      Object.prototype.hasOwnProperty.call(
        SystenConfigsController.prototype,
        "save",
      ),
    ).toBe(true);

    await expect(controller.save(body, req)).resolves.toEqual({
      id: "config-1",
    });
    expect(service.save).toHaveBeenCalledWith({
      systemName: "项目系统",
      createUser: "tester",
      _operatorPermissions: ["system:configs:save"],
      _operatorName: "tester",
      _operatorId: "user-1",
    });
  });
});
