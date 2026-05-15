import { HttpException } from "@nestjs/common";
import { RolesService } from "./service";

describe("RolesService", () => {
  const repository = {
    save: jest.fn(),
    findOne: jest.fn(),
    createQueryBuilder: jest.fn(),
  };
  const sysUserWithRoleEntityRep = {
    find: jest.fn(),
    delete: jest.fn(),
    save: jest.fn(),
  };
  const userRepository = {
    createQueryBuilder: jest.fn(),
  };
  const menuRepository = {
    find: jest.fn(),
  };

  const createService = () =>
    new RolesService(
      repository as any,
      sysUserWithRoleEntityRep as any,
      userRepository as any,
      menuRepository as any,
    );

  beforeEach(() => {
    jest.clearAllMocks();
    repository.save.mockImplementation(async (data) => data);
    repository.createQueryBuilder.mockReturnValue({
      leftJoinAndSelect: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      getMany: jest.fn().mockResolvedValue([]),
    });
  });

  it("编辑 admin 角色时应把操作人权限继续传给 BaseService", async () => {
    const service = createService();

    await expect(
      service.save({
        id: "1",
        name: "超级管理员",
        permissionKey: "admin",
        menuIds: ["5"],
        _operatorPermissions: ["system/roles/manageAdminRole"],
      } as any),
    ).resolves.toBeTruthy();
  });

  it("编辑 admin 角色时缺少 manageAdminRole 仍应拒绝", async () => {
    const service = createService();

    await expect(
      service.save({
        id: "1",
        name: "超级管理员",
        permissionKey: "admin",
        menuIds: ["5"],
        _operatorPermissions: [],
      } as any),
    ).rejects.toBeInstanceOf(HttpException);
  });

  it("拥有 admin 角色时菜单仍应按角色绑定返回而不是全量放行", async () => {
    const service = createService();
    const getMany = jest.fn().mockResolvedValue([
      {
        menus: [
          { id: "206", permissionKey: "content/articleManage/home" },
          { id: "207", permissionKey: "content/articleManage/search" },
        ],
      },
    ]);
    repository.createQueryBuilder.mockReturnValue({
      leftJoinAndSelect: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      getMany,
    });

    const menus = await service.getUserMenus({
      name: "admin",
      roles: [{ permissionKey: "admin", isActive: "1" }],
    });

    expect(menuRepository.find).not.toHaveBeenCalled();
    expect(getMany).toHaveBeenCalled();
    expect(menus.map((item) => item.id)).toEqual(["206", "207"]);
  });

  it("获取登录用户菜单时应把驾驶舱旧权限键归一为新权限键", async () => {
    const service = createService();
    const getMany = jest.fn().mockResolvedValue([
      {
        menus: [
          {
            id: "204",
            order: 2,
            createTime: "2026-04-16 18:57:25",
            permissionKey: "business/projectManage/cockpit",
          },
        ],
      },
    ]);
    repository.createQueryBuilder.mockReturnValue({
      leftJoinAndSelect: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      getMany,
    });

    const menus = await service.getUserMenus({
      name: "admin",
      roles: [{ permissionKey: "admin", isActive: "1" }],
    });

    expect(menus).toHaveLength(1);
    expect(menus[0].permissionKey).toBe("business/projects/dashboard");
  });

  it("基础访问权限应自动补齐对应导航菜单和隐藏表单菜单", async () => {
    const service = createService();
    const getMany = jest.fn().mockResolvedValue([
      {
        menus: [
          {
            id: "423",
            parentId: "63",
            order: 320,
            createTime: "2026-04-16 19:00:00",
            type: "button",
            permissionKey: "business/tasks/access",
          },
        ],
      },
    ]);
    repository.createQueryBuilder.mockReturnValue({
      leftJoinAndSelect: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      getMany,
    });
    menuRepository.find.mockResolvedValue([
      {
        id: "32",
        parentId: "0",
        order: 5,
        createTime: "2026-04-15 13:52:52",
        type: "catalog",
        path: "taskManage",
        component: "",
        permissionKey: "business/taskManage",
        name: "任务管理",
      },
      {
        id: "63",
        parentId: "32",
        order: 1,
        createTime: "2026-04-15 14:40:35",
        type: "menu",
        path: "taskInfo",
        component: "business/taskManage/index",
        permissionKey: "business/taskInfo",
        name: "任务列表",
      },
      {
        id: "49",
        parentId: "63",
        order: 1,
        createTime: "2026-04-15 14:29:06",
        type: "menu",
        path: "/taskManage/form",
        component: "business/taskManage/form",
        permissionKey: "business/taskManage/form",
        name: "任务表单",
        isHidden: "1",
      },
      {
        id: "423",
        parentId: "63",
        order: 320,
        createTime: "2026-04-16 19:00:00",
        type: "button",
        path: "task-access",
        permissionKey: "business/tasks/access",
        name: "任务基础访问",
      },
    ]);

    const menus = await service.getUserMenus({
      name: "normal",
      roles: [{ permissionKey: "user", isActive: "1" }],
    });

    expect(menus.map((item) => item.id)).toEqual(["63", "49", "32", "423"]);
  });

  it("目录下的基础访问权限应自动补齐对应列表菜单和隐藏表单菜单", async () => {
    const service = createService();
    const getMany = jest.fn().mockResolvedValue([
      {
        menus: [
          {
            id: "430",
            parentId: "33",
            order: 320,
            createTime: "2026-04-16 19:00:00",
            type: "button",
            permissionKey: "business/tickets/access",
          },
        ],
      },
    ]);
    repository.createQueryBuilder.mockReturnValue({
      leftJoinAndSelect: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      getMany,
    });
    menuRepository.find.mockResolvedValue([
      {
        id: "33",
        parentId: "0",
        order: 6,
        createTime: "2026-04-15 13:52:52",
        type: "catalog",
        path: "ticketManage",
        component: "",
        permissionKey: "business/ticketManage",
        name: "工单管理",
      },
      {
        id: "64",
        parentId: "33",
        order: 1,
        createTime: "2026-04-15 14:40:35",
        type: "menu",
        path: "ticketInfo",
        component: "business/ticketManage/index",
        permissionKey: "business/ticketInfo",
        name: "工单列表",
      },
      {
        id: "50",
        parentId: "33",
        order: 2,
        createTime: "2026-04-15 14:29:06",
        type: "menu",
        path: "/ticketManage/form",
        component: "business/ticketManage/form",
        permissionKey: "business/ticketManage/form",
        name: "工单表单",
        isHidden: "1",
      },
      {
        id: "430",
        parentId: "33",
        order: 320,
        createTime: "2026-04-16 19:00:00",
        type: "button",
        path: "ticket-access",
        permissionKey: "business/tickets/access",
        name: "工单基础访问",
      },
    ]);

    const menus = await service.getUserMenus({
      name: "normal",
      roles: [{ permissionKey: "user", isActive: "1" }],
    });

    expect(menus.map((item) => item.id)).toEqual(["64", "50", "33", "430"]);
  });

  it("工作流目录下的基础访问权限应自动补齐对应工作流页面菜单", async () => {
    const service = createService();
    const getMany = jest.fn().mockResolvedValue([
      {
        menus: [
          {
            id: "431",
            parentId: "25",
            order: 320,
            createTime: "2026-04-16 19:00:00",
            type: "button",
            permissionKey: "business/workflow/tasks/access",
          },
        ],
      },
    ]);
    repository.createQueryBuilder.mockReturnValue({
      leftJoinAndSelect: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      getMany,
    });
    menuRepository.find.mockResolvedValue([
      {
        id: "25",
        parentId: "0",
        order: 4,
        createTime: "2026-04-15 13:52:52",
        type: "catalog",
        path: "workflow",
        component: "",
        permissionKey: "business/workflow",
        name: "工作流管理",
      },
      {
        id: "26",
        parentId: "25",
        order: 1,
        createTime: "2026-04-15 14:40:35",
        type: "menu",
        path: "definitions",
        component: "business/workflow/index",
        permissionKey: "business/workflow/definitions",
        name: "流程管理",
      },
      {
        id: "29",
        parentId: "25",
        order: 3,
        createTime: "2026-04-15 14:40:35",
        type: "menu",
        path: "tasks",
        component: "business/workflow/tasks",
        permissionKey: "business/workflow/tasks",
        name: "我的待办",
      },
      {
        id: "431",
        parentId: "25",
        order: 320,
        createTime: "2026-04-16 19:00:00",
        type: "button",
        path: "workflow-tasks-access",
        permissionKey: "business/workflow/tasks/access",
        name: "待办基础访问",
      },
    ]);

    const menus = await service.getUserMenus({
      name: "normal",
      roles: [{ permissionKey: "user", isActive: "1" }],
    });

    expect(menus.map((item) => item.id)).toEqual(["29", "25", "431"]);
  });

  it("获取角色详情时应过滤操作人上下文字段", async () => {
    const service = createService();
    repository.findOne.mockResolvedValue({
      id: "1",
      name: "超级管理员",
      menus: [],
    });

    await service.getOne({
      id: "1",
      _operatorId: "u1",
      _operatorDeptId: "d1",
      _operatorPermissions: ["system/roles/getOne"],
      _operatorRoles: [{ permissionKey: "admin" }],
    });

    expect(repository.findOne).toHaveBeenCalledWith({
      where: { id: "1" },
      relations: { menus: true },
    });
  });
});
