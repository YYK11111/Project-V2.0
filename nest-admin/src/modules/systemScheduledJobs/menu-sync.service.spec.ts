import { BoolNum } from "src/common/type/base";
import { Menu, MenuType } from "src/modules/menus/menu.entity";
import { scheduledJobsMenuSeed } from "./menu.seed";
import { MenuSyncService } from "./menu-sync.service";

type MockMenuRepository = {
  findOne: jest.Mock<Promise<Menu | null>, [unknown]>;
  save: jest.Mock<Promise<Menu>, [Menu]>;
};

type MockLogger = {
  error: jest.Mock<void, [string]>;
  log: jest.Mock<void, [string]>;
};

type MenuWithRelations = Menu & {
  roles?: Array<{ id: string }>;
  roleMenus?: Array<{ id: string }>;
};

describe("scheduledJobsMenuSeed", () => {
  it("菜单种子结构正确", () => {
    expect(scheduledJobsMenuSeed.parentPermissionKey).toBe("system");
    expect(scheduledJobsMenuSeed.page).toMatchObject({
      name: "定时任务管理",
      path: "/systemManage/scheduledJobs/index",
      component: "systemMonitor/scheduledJobs/index",
      permissionKey: "system/scheduledJobs/list",
      type: MenuType.menu,
    });
    expect(scheduledJobsMenuSeed.buttons).toEqual([
      expect.objectContaining({
        name: "查看日志",
        permissionKey: "system/scheduledJobs/logs",
        type: MenuType.button,
      }),
      expect.objectContaining({
        name: "立即执行",
        permissionKey: "system/scheduledJobs/run",
        type: MenuType.button,
      }),
      expect.objectContaining({
        name: "启用",
        permissionKey: "system/scheduledJobs/enable",
        type: MenuType.button,
      }),
      expect.objectContaining({
        name: "停用",
        permissionKey: "system/scheduledJobs/disable",
        type: MenuType.button,
      }),
    ]);
  });
});

describe("MenuSyncService", () => {
  function createMenuRepository(): MockMenuRepository {
    return {
      findOne: jest.fn<Promise<Menu | null>, [unknown]>(),
      save: jest
        .fn<Promise<Menu>, [Menu]>()
        .mockImplementation(async (menu) => {
          return menu;
        }),
    };
  }

  function createService(syncMenusOnBoot = true) {
    const menuRepository = createMenuRepository();
    const service = new MenuSyncService(menuRepository as never);
    (service as unknown as { appConfig: unknown }).appConfig = {
      featureFlags: {
        syncMenusOnBoot,
      },
    };
    const logger = (service as unknown as { logger: MockLogger }).logger;
    logger.error = jest.fn<void, [string]>();
    logger.log = jest.fn<void, [string]>();
    return { service, menuRepository, logger };
  }

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("只通过构造函数注入菜单仓库", () => {
    const paramTypes = Reflect.getMetadata(
      "design:paramtypes",
      MenuSyncService,
    );

    expect(paramTypes).toHaveLength(1);
  });

  it("默认未开启开关时，启动不会查询或保存菜单", async () => {
    const menuRepository = createMenuRepository();
    const service = new MenuSyncService(menuRepository as never);
    const logger = (service as unknown as { logger: MockLogger }).logger;
    logger.log = jest.fn<void, [string]>();

    await service.onApplicationBootstrap();

    expect(menuRepository.findOne).not.toHaveBeenCalled();
    expect(menuRepository.save).not.toHaveBeenCalled();
    expect(logger.log).toHaveBeenCalledWith(
      expect.stringContaining("SYSTEM_MENU_SYNC_ON_BOOT"),
    );
  });

  it("显式关闭开关时，启动不会查询或保存菜单", async () => {
    const { service, menuRepository, logger } = createService(false);

    await service.onApplicationBootstrap();

    expect(menuRepository.findOne).not.toHaveBeenCalled();
    expect(menuRepository.save).not.toHaveBeenCalled();
    expect(logger.log).toHaveBeenCalledWith(
      expect.stringContaining("SYSTEM_MENU_SYNC_ON_BOOT"),
    );
  });

  it("缺失页面菜单时，会在系统管理下创建页面和按钮权限", async () => {
    const { service, menuRepository } = createService();
    const systemMenu = new Menu({
      id: "1",
      permissionKey: "system",
      name: "系统管理",
    });

    menuRepository.findOne.mockImplementation(async (options) => {
      const permissionKey = (options as { where?: { permissionKey?: string } })
        .where?.permissionKey;
      if (permissionKey === "system") {
        return systemMenu;
      }
      return null;
    });
    menuRepository.save
      .mockImplementationOnce(async (menu) => new Menu({ ...menu, id: "100" }))
      .mockImplementationOnce(async (menu) => new Menu({ ...menu, id: "101" }))
      .mockImplementationOnce(async (menu) => new Menu({ ...menu, id: "102" }))
      .mockImplementationOnce(async (menu) => new Menu({ ...menu, id: "103" }))
      .mockImplementationOnce(async (menu) => new Menu({ ...menu, id: "104" }));

    await service.onApplicationBootstrap();

    expect(menuRepository.save).toHaveBeenCalledTimes(5);
    expect(menuRepository.save).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({
        parentId: "1",
        name: "定时任务管理",
        path: "/systemManage/scheduledJobs/index",
        component: "systemMonitor/scheduledJobs/index",
        type: MenuType.menu,
        permissionKey: "system/scheduledJobs/list",
        isHidden: BoolNum.No,
        isActive: BoolNum.Yes,
      }),
    );
    expect(menuRepository.save).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        parentId: "100",
        name: "查看日志",
        permissionKey: "system/scheduledJobs/logs",
        type: MenuType.button,
      }),
    );
    expect(menuRepository.save).toHaveBeenNthCalledWith(
      5,
      expect.objectContaining({
        parentId: "100",
        name: "停用",
        permissionKey: "system/scheduledJobs/disable",
        type: MenuType.button,
      }),
    );
  });

  it("已存在菜单时，会更新结构字段且不写入角色关系字段", async () => {
    const { service, menuRepository } = createService();
    const systemMenu = new Menu({
      id: "1",
      permissionKey: "system",
      name: "系统管理",
    });
    const existingPage = Object.assign(
      new Menu({
        id: "10",
        parentId: "9",
        name: "旧名称",
        path: "/old",
        component: "old/component",
        type: MenuType.catalog,
        permissionKey: "system/scheduledJobs/list",
        order: 1,
        icon: "old-icon",
        isHidden: BoolNum.Yes,
        isActive: BoolNum.No,
      }),
      {
        roles: [{ id: "r1" }],
        roleMenus: [{ id: "rm1" }],
      },
    ) as MenuWithRelations;
    const existingButton = Object.assign(
      new Menu({
        id: "11",
        parentId: "9",
        name: "旧按钮",
        path: "/should-clear",
        component: "should/clear",
        type: MenuType.menu,
        permissionKey: "system/scheduledJobs/logs",
        order: 1,
        icon: "old-icon",
        isHidden: BoolNum.Yes,
        isActive: BoolNum.No,
      }),
      {
        roles: [{ id: "r2" }],
        roleMenus: [{ id: "rm2" }],
      },
    ) as MenuWithRelations;

    menuRepository.findOne.mockImplementation(async (options) => {
      const permissionKey = (options as { where?: { permissionKey?: string } })
        .where?.permissionKey;
      if (permissionKey === "system") {
        return systemMenu;
      }
      if (permissionKey === "system/scheduledJobs/list") {
        return existingPage;
      }
      if (permissionKey === "system/scheduledJobs/logs") {
        return existingButton;
      }
      return null;
    });
    menuRepository.save.mockImplementation(async (menu) => menu);

    await service.onApplicationBootstrap();

    expect(menuRepository.save).toHaveBeenCalledWith(
      expect.objectContaining({
        id: "10",
        parentId: "1",
        name: "定时任务管理",
        path: "/systemManage/scheduledJobs/index",
        component: "systemMonitor/scheduledJobs/index",
        type: MenuType.menu,
        permissionKey: "system/scheduledJobs/list",
        order: scheduledJobsMenuSeed.page.order,
        icon: scheduledJobsMenuSeed.page.icon,
        isHidden: scheduledJobsMenuSeed.page.isHidden,
        isActive: scheduledJobsMenuSeed.page.isActive,
      }),
    );
    const pageMenuSave = menuRepository.save.mock.calls[0];
    expect(pageMenuSave).toBeDefined();
    expect(pageMenuSave?.[0]).not.toHaveProperty("roles");
    expect(pageMenuSave?.[0]).not.toHaveProperty("roleMenus");

    const logsButtonSave = menuRepository.save.mock.calls.find(
      ([menu]) => menu.permissionKey === "system/scheduledJobs/logs",
    );
    expect(logsButtonSave).toBeDefined();
    expect(logsButtonSave?.[0]).toMatchObject({
      id: "11",
      parentId: "10",
      name: "查看日志",
      path: "",
      component: "",
      type: MenuType.button,
      permissionKey: "system/scheduledJobs/logs",
      order: scheduledJobsMenuSeed.buttons[0].order,
      icon: scheduledJobsMenuSeed.buttons[0].icon,
      isHidden: scheduledJobsMenuSeed.buttons[0].isHidden,
      isActive: scheduledJobsMenuSeed.buttons[0].isActive,
    });
    expect(existingPage.roles).toEqual([{ id: "r1" }]);
    expect(existingPage.roleMenus).toEqual([{ id: "rm1" }]);
    expect(existingButton.roles).toEqual([{ id: "r2" }]);
    expect(existingButton.roleMenus).toEqual([{ id: "rm2" }]);
    expect(logsButtonSave?.[0]).not.toHaveProperty("roles");
    expect(logsButtonSave?.[0]).not.toHaveProperty("roleMenus");
  });

  it("找不到父菜单时只记录错误并返回", async () => {
    const { service, menuRepository, logger } = createService();

    menuRepository.findOne.mockResolvedValue(null);

    await service.onApplicationBootstrap();

    expect(menuRepository.save).not.toHaveBeenCalled();
    expect(logger.error).toHaveBeenCalledWith(
      expect.stringContaining("system"),
    );
  });
});
