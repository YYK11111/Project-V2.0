import { ExecutionContext, UnauthorizedException } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { JwtService } from "@nestjs/jwt";
import { AuthGuard } from "./auth.guard";

describe("AuthGuard", () => {
  const jwtService = {
    verifyAsync: jest.fn(),
  };

  const reflector = {
    getAllAndOverride: jest.fn(),
  };

  const redisService = {
    getPermissions: jest.fn(),
    existsOnlineUser: jest.fn(),
    refreshOnlineUser: jest.fn(),
  };

  const rolesService = {
    getUserMenus: jest.fn(),
  };

  const createContext = (request: Record<string, any>): ExecutionContext => {
    return {
      getHandler: jest.fn(),
      getClass: jest.fn(),
      switchToHttp: () => ({
        getRequest: () => request,
      }),
    } as any;
  };

  beforeEach(() => {
    jest.clearAllMocks();
    reflector.getAllAndOverride.mockReturnValue(undefined);
    redisService.getPermissions.mockResolvedValue([]);
    redisService.existsOnlineUser.mockResolvedValue(1);
    redisService.refreshOnlineUser.mockResolvedValue(1);
    rolesService.getUserMenus.mockResolvedValue([]);
  });

  it("从 Cookie 读取 token 并通过在线会话校验", async () => {
    const guard = new AuthGuard(
      jwtService as unknown as JwtService,
      reflector as unknown as Reflector,
      redisService as any,
      rolesService as any,
    );
    const request: Record<string, any> = {
      headers: {
        cookie: "foo=bar; admin_session=token-from-cookie",
      },
      path: "/api/auth/getLoginUser",
      method: "GET",
    };

    jwtService.verifyAsync.mockResolvedValue({
      permissions: ["*"],
      id: "user_1",
    });
    rolesService.getUserMenus.mockResolvedValue([]);

    await expect(guard.canActivate(createContext(request))).resolves.toBe(true);
    expect(jwtService.verifyAsync).toHaveBeenCalledWith(
      "token-from-cookie",
      expect.any(Object),
    );
    expect(redisService.existsOnlineUser).toHaveBeenCalledWith(
      "token-from-cookie".split(".").at(-1),
    );
    expect(redisService.refreshOnlineUser).toHaveBeenCalledWith(
      "token-from-cookie".split(".").at(-1),
    );
    expect(request.user.id).toBe("user_1");
  });

  it("在线会话不存在时拒绝访问", async () => {
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
      path: "/api/auth/getLoginUser",
      method: "GET",
    };

    jwtService.verifyAsync.mockResolvedValue({
      permissions: ["*"],
      id: "user_1",
    });
    rolesService.getUserMenus.mockResolvedValue([]);
    redisService.existsOnlineUser.mockResolvedValue(0);

    await expect(
      guard.canActivate(createContext(request)),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it("JWT 中的星号不会绕过角色菜单权限模型", async () => {
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
      path: "/api/system/users/update",
      method: "PUT",
      body: {},
    };

    jwtService.verifyAsync.mockResolvedValue({
      permissions: ["*"],
      id: "user_1",
    });
    rolesService.getUserMenus.mockResolvedValue([]);
    redisService.getPermissions.mockResolvedValue(["system/users/update"]);

    await expect(guard.canActivate(createContext(request))).rejects.toThrow(
      "接口无权限",
    );
  });

  it("业务模块全量权限可访问同模块列表和按钮接口", () => {
    const guard = new AuthGuard(
      jwtService as unknown as JwtService,
      reflector as unknown as Reflector,
      redisService as any,
      rolesService as any,
    );

    expect(
      (guard as any).hasPermission(
        ["business/tasks/manageAll"],
        "business/tasks/list",
      ),
    ).toBe(true);
    expect(
      (guard as any).hasPermission(
        ["business/tasks/manageAll"],
        "business/tasks/update",
      ),
    ).toBe(true);
    expect(
      (guard as any).hasPermission(
        ["business/tasks/manageAll"],
        "business/tickets/list",
      ),
    ).toBe(false);
  });

  it("业务基础访问权限只放行同模块只读接口", () => {
    const guard = new AuthGuard(
      jwtService as unknown as JwtService,
      reflector as unknown as Reflector,
      redisService as any,
      rolesService as any,
    );

    expect(
      (guard as any).hasPermission(
        ["business/articles/access"],
        "business/articles/list",
      ),
    ).toBe(true);
    expect(
      (guard as any).hasPermission(
        ["business/articles/access"],
        "business/articles/update",
      ),
    ).toBe(false);
    expect(
      (guard as any).hasPermission(
        ["business/tasks/access"],
        "business/tasks/dependency/list",
      ),
    ).toBe(true);
  });

  it("工作流任务 access 可以处理本人待办但不包含流程定义详情", () => {
    const guard = new AuthGuard(
      jwtService as unknown as JwtService,
      reflector as unknown as Reflector,
      redisService as any,
      rolesService as any,
    );

    expect(
      (guard as any).hasPermission(
        ["business/workflow/tasks/access"],
        "business/workflow/tasks/list",
      ),
    ).toBe(true);
    expect(
      (guard as any).hasPermission(
        ["business/workflow/tasks/access"],
        "business/workflow/tasks/complete",
      ),
    ).toBe(true);
    expect(
      (guard as any).hasPermission(
        ["business/workflow/tasks/access"],
        "business/workflow/tasks/transfer",
      ),
    ).toBe(true);
    expect(
      (guard as any).hasPermission(
        ["business/workflow/tasks/access"],
        "business/workflow/tasks/addSign",
      ),
    ).toBe(true);
    expect(
      (guard as any).hasPermission(
        ["business/workflow/tasks/access"],
        "business/workflow/definitions/getOne",
      ),
    ).toBe(false);
  });

  it("工作流任务 access 可以读取审批中的项目详情和字段权限", () => {
    const guard = new AuthGuard(
      jwtService as unknown as JwtService,
      reflector as unknown as Reflector,
      redisService as any,
      rolesService as any,
    );

    expect(
      (guard as any).hasPermission(
        ["business/workflow/tasks/access"],
        "business/projects/getOne",
      ),
    ).toBe(true);
    expect(
      (guard as any).hasPermission(
        ["business/workflow/tasks/access"],
        "business/projects/fieldPermissions",
      ),
    ).toBe(true);
    expect(
      (guard as any).hasPermission(
        ["business/workflow/tasks/access"],
        "business/projects/update",
      ),
    ).toBe(false);
  });

  it("项目 access 可以进入项目作用域操作但不能删除或归档项目", () => {
    const guard = new AuthGuard(
      jwtService as unknown as JwtService,
      reflector as unknown as Reflector,
      redisService as any,
      rolesService as any,
    );

    expect(
      (guard as any).hasPermission(
        ["business/projects/access"],
        "business/projects/update",
      ),
    ).toBe(true);
    expect(
      (guard as any).hasPermission(
        ["business/projects/access"],
        "business/projects/submitApproval",
      ),
    ).toBe(true);
    expect(
      (guard as any).hasPermission(
        ["business/projects/access"],
        "business/projects/submitClose",
      ),
    ).toBe(true);
    expect(
      (guard as any).hasPermission(
        ["business/projects/access"],
        "business/projects/add",
      ),
    ).toBe(false);
    expect(
      (guard as any).hasPermission(
        ["business/projects/access"],
        "business/projects/delete",
      ),
    ).toBe(false);
    expect(
      (guard as any).hasPermission(
        ["business/projects/access"],
        "business/projects/archive",
      ),
    ).toBe(false);
  });

  it("项目 access 可以进入项目成员维护接口并交给项目内角色二次校验", () => {
    const guard = new AuthGuard(
      jwtService as unknown as JwtService,
      reflector as unknown as Reflector,
      redisService as any,
      rolesService as any,
    );

    expect(
      (guard as any).hasPermission(
        ["business/projects/access"],
        "business/projectMembers/list",
      ),
    ).toBe(true);
    expect(
      (guard as any).hasPermission(
        ["business/projects/access"],
        "business/projectMembers/add",
      ),
    ).toBe(true);
    expect(
      (guard as any).hasPermission(
        ["business/projects/access"],
        "business/projectMembers/update",
      ),
    ).toBe(true);
    expect(
      (guard as any).hasPermission(
        ["business/projects/access"],
        "business/projectMembers/delete",
      ),
    ).toBe(true);
  });

  it("实例作用域的流程定义详情接口使用实例详情权限", () => {
    const guard = new AuthGuard(
      jwtService as unknown as JwtService,
      reflector as unknown as Reflector,
      redisService as any,
      rolesService as any,
    );

    expect(
      (guard as any).resolvePermissionByRequest({
        method: "GET",
        path: "/api/workflow/instances/wf-1/definition",
      }),
    ).toBe("business/workflow/instances/getOne");
  });

  it("角色菜单解析出的星号权限可以访问用户管理重置密码接口", async () => {
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
      path: "/api/system/users/resetPassword",
      method: "PUT",
      body: {},
    };

    jwtService.verifyAsync.mockResolvedValue({
      permissions: [],
      id: "user_1",
    });
    rolesService.getUserMenus.mockResolvedValue([{ permissionKey: "*" }]);
    redisService.getPermissions.mockResolvedValue([
      "system/users/resetPassword",
    ]);

    await expect(guard.canActivate(createContext(request))).resolves.toBe(true);
  });

  it("个人提醒偏好接口未出现在菜单权限清单时不应被拒绝", async () => {
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
      path: "/api/system/users/updateProjectReminderPreference",
      method: "PUT",
      body: {
        projectReminderPreference: {
          enabled: true,
        },
      },
    };

    jwtService.verifyAsync.mockResolvedValue({
      permissions: ["system/users/update"],
      id: "user_1",
    });
    rolesService.getUserMenus.mockResolvedValue([
      { permissionKey: "system/users/update" },
    ]);
    redisService.getPermissions.mockResolvedValue(["system/users/update"]);

    await expect(guard.canActivate(createContext(request))).resolves.toBe(true);
  });

  it("登录后获取当前用户菜单不要求菜单或角色管理权限", async () => {
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
      path: "/api/system/roles/getLoginUserMenus",
      method: "GET",
    };

    jwtService.verifyAsync.mockResolvedValue({
      permissions: [],
      id: "user_yyk",
      name: "yyk",
      roles: [{ permissionKey: "project_member" }],
    });
    rolesService.getUserMenus.mockResolvedValue([
      { permissionKey: "business/project/list" },
    ]);
    redisService.getPermissions.mockResolvedValue([
      "system/roles/list",
      "system/roles/getLoginUserMenus",
    ]);

    await expect(guard.canActivate(createContext(request))).resolves.toBe(true);
  });

  it("登录后获取当前用户主题不要求用户管理权限", async () => {
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
      path: "/api/system/users/getTheme",
      method: "GET",
    };

    jwtService.verifyAsync.mockResolvedValue({
      permissions: [],
      id: "user_yyk",
      name: "yyk",
      roles: [{ permissionKey: "project_member" }],
    });
    rolesService.getUserMenus.mockResolvedValue([
      { permissionKey: "business/project/list" },
    ]);
    redisService.getPermissions.mockResolvedValue([
      "system/users/getOne",
      "system/users/getTheme",
    ]);

    await expect(guard.canActivate(createContext(request))).resolves.toBe(true);
  });

  it("登录后获取当前用户项目提醒偏好不要求用户管理权限", async () => {
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
      path: "/api/system/users/getProjectReminderPreference",
      method: "GET",
    };

    jwtService.verifyAsync.mockResolvedValue({
      permissions: [],
      id: "user_yyk",
      name: "yyk",
      roles: [{ permissionKey: "user" }],
    });
    rolesService.getUserMenus.mockResolvedValue([]);

    await expect(guard.canActivate(createContext(request))).resolves.toBe(true);
  });

  it("登录后访问当前用户消息接口不要求消息中心菜单权限", async () => {
    const guard = new AuthGuard(
      jwtService as unknown as JwtService,
      reflector as unknown as Reflector,
      redisService as any,
      rolesService as any,
    );
    const baseUser = {
      permissions: [],
      id: "user_yyk",
      name: "yyk",
      roles: [{ permissionKey: "user" }],
    };
    const requests = [
      { path: "/api/system/messages/unread-count", method: "GET" },
      { path: "/api/system/messages/recent", method: "GET" },
      { path: "/api/system/messages/list", method: "GET" },
    ];

    for (const requestInfo of requests) {
      const request: Record<string, any> = {
        headers: {
          cookie: "admin_session=header.payload.signature",
        },
        ...requestInfo,
      };
      jwtService.verifyAsync.mockResolvedValue(baseUser);
      rolesService.getUserMenus.mockResolvedValue([]);

      await expect(guard.canActivate(createContext(request))).resolves.toBe(
        true,
      );
    }
  });

  it("登录后访问首页项目列表不应被菜单权限拦截", async () => {
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
      path: "/api/business/projects/list",
      method: "GET",
    };

    jwtService.verifyAsync.mockResolvedValue({
      permissions: [],
      id: "user_yyk",
      name: "yyk",
      roles: [{ permissionKey: "project_member" }],
    });
    rolesService.getUserMenus.mockResolvedValue([
      { permissionKey: "business/project/list" },
    ]);
    redisService.getPermissions.mockResolvedValue(["business/projects/list"]);

    await expect(guard.canActivate(createContext(request))).resolves.toBe(true);
  });

  it("登录后访问部门树基础选项不要求部门管理权限", async () => {
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
      path: "/api/system/dept/getTrees",
      method: "GET",
    };

    jwtService.verifyAsync.mockResolvedValue({
      permissions: [],
      id: "user_yyk",
      name: "yyk",
      roles: [{ permissionKey: "user" }],
    });
    rolesService.getUserMenus.mockResolvedValue([
      { permissionKey: "business/project/list" },
    ]);
    redisService.getPermissions.mockResolvedValue(["system/dept/tree"]);

    await expect(guard.canActivate(createContext(request))).resolves.toBe(true);
  });

  it("登录后访问用户选择选项不要求用户管理权限", async () => {
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
      path: "/api/system/users/options",
      method: "GET",
      query: {
        pageNum: 1,
        pageSize: 100,
      },
    };

    jwtService.verifyAsync.mockResolvedValue({
      permissions: [],
      id: "user_yyk",
      name: "yyk",
      roles: [{ permissionKey: "user" }],
    });
    rolesService.getUserMenus.mockResolvedValue([
      { permissionKey: "business/projectMembers/add" },
    ]);
    redisService.getPermissions.mockResolvedValue(["system/users/list"]);

    await expect(guard.canActivate(createContext(request))).resolves.toBe(true);
  });

  it("登录后访问部门选择选项不要求部门管理权限", async () => {
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
      path: "/api/system/dept/options",
      method: "GET",
      query: {
        pageNum: 1,
        pageSize: 1000,
      },
    };

    jwtService.verifyAsync.mockResolvedValue({
      permissions: [],
      id: "user_yyk",
      name: "yyk",
      roles: [{ permissionKey: "user" }],
    });
    rolesService.getUserMenus.mockResolvedValue([
      { permissionKey: "business/projectMembers/add" },
    ]);
    redisService.getPermissions.mockResolvedValue([]);

    await expect(guard.canActivate(createContext(request))).resolves.toBe(true);
  });

  it("登录后通用文件上传不要求菜单权限", async () => {
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
      path: "/api/system/common/upload",
      method: "POST",
      body: {},
    };

    jwtService.verifyAsync.mockResolvedValue({
      permissions: [],
      id: "user_yyk",
      name: "yyk",
      roles: [{ permissionKey: "user" }],
    });
    rolesService.getUserMenus.mockResolvedValue([]);

    await expect(guard.canActivate(createContext(request))).resolves.toBe(true);
  });

  it("缺少用户管理列表权限时拒绝访问系统用户列表", async () => {
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
      path: "/api/system/users/list",
      method: "GET",
    };

    jwtService.verifyAsync.mockResolvedValue({
      permissions: [],
      id: "user_yyk",
      name: "yyk",
      roles: [{ permissionKey: "user" }],
    });
    rolesService.getUserMenus.mockResolvedValue([]);
    redisService.getPermissions.mockResolvedValue(["system/users/list"]);

    await expect(guard.canActivate(createContext(request))).rejects.toThrow(
      "接口无权限",
    );
  });

  it("缺少部门管理列表权限时拒绝访问系统部门列表", async () => {
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
      path: "/api/system/dept/list",
      method: "GET",
    };

    jwtService.verifyAsync.mockResolvedValue({
      permissions: [],
      id: "user_yyk",
      name: "yyk",
      roles: [{ permissionKey: "user" }],
    });
    rolesService.getUserMenus.mockResolvedValue([]);
    redisService.getPermissions.mockResolvedValue([]);

    await expect(guard.canActivate(createContext(request))).rejects.toThrow(
      "接口无权限",
    );
  });

  it("缺少部门新增权限时仍拒绝访问部门新增接口", async () => {
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
      path: "/api/system/dept/add",
      method: "POST",
      body: {
        deptName: "测试部门",
      },
    };

    jwtService.verifyAsync.mockResolvedValue({
      permissions: [],
      id: "user_yyk",
      name: "yyk",
      roles: [{ permissionKey: "user" }],
    });
    rolesService.getUserMenus.mockResolvedValue([]);
    redisService.getPermissions.mockResolvedValue(["system/dept/add"]);

    await expect(guard.canActivate(createContext(request))).rejects.toThrow(
      "接口无权限",
    );
  });

  it("项目成员统计接口使用项目成员列表权限控制", async () => {
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
      path: "/api/business/project-members/stats",
      method: "GET",
    };

    jwtService.verifyAsync.mockResolvedValue({
      permissions: [],
      id: "user_yyk",
      name: "yyk",
      roles: [{ permissionKey: "user" }],
    });
    rolesService.getUserMenus.mockResolvedValue([
      { permissionKey: "business/projectMembers/list" },
    ]);
    redisService.getPermissions.mockResolvedValue([
      "business/projectMembers/list",
    ]);

    await expect(guard.canActivate(createContext(request))).resolves.toBe(true);
  });

  it("缺少项目成员列表权限时拒绝访问项目成员统计接口", async () => {
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
      path: "/api/business/project-members/stats",
      method: "GET",
    };

    jwtService.verifyAsync.mockResolvedValue({
      permissions: [],
      id: "user_yyk",
      name: "yyk",
      roles: [{ permissionKey: "user" }],
    });
    rolesService.getUserMenus.mockResolvedValue([]);
    redisService.getPermissions.mockResolvedValue([
      "business/projectMembers/list",
    ]);

    await expect(guard.canActivate(createContext(request))).rejects.toThrow(
      "接口无权限",
    );
  });

  it("具备项目驾驶舱旧菜单权限时仍应放行并归一为新权限键", async () => {
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
      path: "/api/business/projects/cockpit",
      method: "GET",
    };

    jwtService.verifyAsync.mockResolvedValue({
      permissions: [],
      id: "admin_1",
      name: "admin",
      roles: [{ permissionKey: "admin" }],
    });
    rolesService.getUserMenus.mockResolvedValue([
      { permissionKey: "business/projectManage/cockpit" },
    ]);
    redisService.getPermissions.mockResolvedValue([
      "business/projects/dashboard",
    ]);

    await expect(guard.canActivate(createContext(request))).resolves.toBe(true);
    expect(request.user.permissions).toEqual(["business/projects/dashboard"]);
  });

  it("项目详情页自动同步提醒只需要项目驾驶舱查看权限", async () => {
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
      path: "/api/business/projects/18/sync-alerts",
      method: "POST",
    };

    jwtService.verifyAsync.mockResolvedValue({
      permissions: [],
      id: "user_1",
      name: "user",
      roles: [{ permissionKey: "project_member" }],
    });
    rolesService.getUserMenus.mockResolvedValue([
      { permissionKey: "business/projects/dashboard" },
    ]);

    await expect(guard.canActivate(createContext(request))).resolves.toBe(true);
  });

  it("缺少定时任务列表权限时拒绝访问列表接口", async () => {
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
      path: "/api/system/scheduled-jobs/list",
      method: "GET",
    };

    jwtService.verifyAsync.mockResolvedValue({
      permissions: [],
      id: "user_1",
    });
    rolesService.getUserMenus.mockResolvedValue([]);
    redisService.getPermissions.mockResolvedValue([
      "system/scheduledJobs/list",
    ]);

    await expect(guard.canActivate(createContext(request))).rejects.toThrow(
      "接口无权限",
    );
  });

  it("具备登录日志菜单权限时放行登录日志列表和统计接口", async () => {
    const guard = new AuthGuard(
      jwtService as unknown as JwtService,
      reflector as unknown as Reflector,
      redisService as any,
      rolesService as any,
    );
    const baseUser = {
      permissions: [],
      id: "admin_1",
      name: "admin",
      roles: [{ permissionKey: "admin" }],
    };
    const requests = [
      { path: "/api/system/loginLogs/list", method: "GET" },
      { path: "/api/system/loginLogs/getVisitedNumChart", method: "GET" },
      { path: "/api/system/loginLogs/getUserAreaList", method: "GET" },
      {
        path: "/api/system/loginLogs/getUserLoginProvinceList",
        method: "GET",
      },
    ];

    for (const requestInfo of requests) {
      const request: Record<string, any> = {
        headers: {
          cookie: "admin_session=header.payload.signature",
        },
        ...requestInfo,
      };
      jwtService.verifyAsync.mockResolvedValue(baseUser);
      rolesService.getUserMenus.mockResolvedValue([
        { permissionKey: "systemMonitor/loginLog/index" },
      ]);
      redisService.getPermissions.mockResolvedValue([
        "systemMonitor/loginLog/index",
      ]);

      await expect(guard.canActivate(createContext(request))).resolves.toBe(
        true,
      );
    }
  });

  it("缺少登录日志菜单权限时拒绝访问登录日志统计接口", async () => {
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
      path: "/api/system/loginLogs/getVisitedNumChart",
      method: "GET",
    };

    jwtService.verifyAsync.mockResolvedValue({
      permissions: [],
      id: "user_1",
      name: "user",
      roles: [{ permissionKey: "user" }],
    });
    rolesService.getUserMenus.mockResolvedValue([]);
    redisService.getPermissions.mockResolvedValue([
      "systemMonitor/loginLog/index",
    ]);

    await expect(guard.canActivate(createContext(request))).rejects.toThrow(
      "接口无权限",
    );
  });

  it("未声明权限的受保护接口默认拒绝访问", async () => {
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
      path: "/api/business/internal/unmapped-action",
      method: "POST",
    };

    jwtService.verifyAsync.mockResolvedValue({
      permissions: ["business/tasks/update"],
      id: "user_1",
    });
    rolesService.getUserMenus.mockResolvedValue([
      { permissionKey: "business/tasks/update" },
    ]);
    redisService.getPermissions.mockResolvedValue(["business/tasks/update"]);

    await expect(guard.canActivate(createContext(request))).rejects.toThrow(
      "接口无权限",
    );
  });

  it("任务启动接口使用任务更新权限控制", async () => {
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
      path: "/api/business/tasks/task-1/start",
      method: "POST",
    };

    jwtService.verifyAsync.mockResolvedValue({
      permissions: [],
      id: "user_1",
    });
    rolesService.getUserMenus.mockResolvedValue([
      { permissionKey: "business/tasks/update" },
    ]);
    redisService.getPermissions.mockResolvedValue(["business/tasks/update"]);

    await expect(guard.canActivate(createContext(request))).resolves.toBe(true);
  });

  it("上线单执行结果接口使用上线单更新权限控制", async () => {
    const guard = new AuthGuard(
      jwtService as unknown as JwtService,
      reflector as unknown as Reflector,
      redisService as any,
      rolesService as any,
    );
    const requests = [
      "/api/business/go-live-records/go-1/start",
      "/api/business/go-live-records/go-1/success",
      "/api/business/go-live-records/go-1/rollback",
    ];

    jwtService.verifyAsync.mockResolvedValue({
      permissions: [],
      id: "user_1",
    });
    rolesService.getUserMenus.mockResolvedValue([
      { permissionKey: "business/go-live-records/update" },
    ]);
    redisService.getPermissions.mockResolvedValue([
      "business/go-live-records/update",
    ]);

    for (const path of requests) {
      await expect(
        guard.canActivate(
          createContext({
            headers: {
              cookie: "admin_session=header.payload.signature",
            },
            path,
            method: "POST",
          }),
        ),
      ).resolves.toBe(true);
    }
  });

  it("登录后访问业务字典接口不要求菜单按钮权限", async () => {
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
      path: "/api/business/projects/getStatus",
      method: "GET",
    };

    jwtService.verifyAsync.mockResolvedValue({
      permissions: [],
      id: "user_1",
    });
    rolesService.getUserMenus.mockResolvedValue([]);
    redisService.getPermissions.mockResolvedValue([]);

    await expect(guard.canActivate(createContext(request))).resolves.toBe(true);
  });

  it("工作流待办审批人访问项目详情和字段权限接口可通过接口权限校验", async () => {
    const guard = new AuthGuard(
      jwtService as unknown as JwtService,
      reflector as unknown as Reflector,
      redisService as any,
      rolesService as any,
    );
    jwtService.verifyAsync.mockResolvedValue({
      permissions: [],
      id: "user_1",
    });
    rolesService.getUserMenus.mockResolvedValue([
      { permissionKey: "business/workflow/tasks/access" },
    ]);

    await expect(
      guard.canActivate(
        createContext({
          headers: {
            cookie: "admin_session=header.payload.signature",
          },
          path: "/api/business/projects/getOne/19",
          method: "GET",
        }),
      ),
    ).resolves.toBe(true);

    await expect(
      guard.canActivate(
        createContext({
          headers: {
            cookie: "admin_session=header.payload.signature",
          },
          path: "/api/business/projects/field-permissions/19",
          method: "GET",
        }),
      ),
    ).resolves.toBe(true);

    await expect(
      guard.canActivate(
        createContext({
          headers: {
            cookie: "admin_session=header.payload.signature",
          },
          path: "/api/business/projects/19/view-context",
          method: "GET",
        }),
      ),
    ).resolves.toBe(true);
  });

  it("登录后访问文章知识类型字典接口不要求菜单按钮权限", async () => {
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
      path: "/api/business/articles/getKnowledgeTypes",
      method: "GET",
    };

    jwtService.verifyAsync.mockResolvedValue({
      permissions: [],
      id: "user_1",
    });
    rolesService.getUserMenus.mockResolvedValue([]);
    redisService.getPermissions.mockResolvedValue([]);

    await expect(guard.canActivate(createContext(request))).resolves.toBe(true);
  });

  it("具备知识分类基础访问权限时放行知识分类树接口", async () => {
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
      path: "/api/business/articleCatalogs/getTrees",
      method: "GET",
    };

    jwtService.verifyAsync.mockResolvedValue({
      permissions: [],
      id: "user_1",
    });
    rolesService.getUserMenus.mockResolvedValue([
      { permissionKey: "business/articleCatalogs/access" },
    ]);

    await expect(guard.canActivate(createContext(request))).resolves.toBe(true);
  });

  it("知识分类保存接口按新增和更新权限控制", async () => {
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
      path: "/api/business/articleCatalogs/save",
      method: "POST",
      body: { id: "catalog-1" },
    };

    jwtService.verifyAsync.mockResolvedValue({
      permissions: [],
      id: "user_1",
    });
    rolesService.getUserMenus.mockResolvedValue([
      { permissionKey: "business/articleCatalogs/update" },
    ]);

    await expect(guard.canActivate(createContext(request))).resolves.toBe(true);
  });

  it("知识分类删除接口使用分类删除权限控制", async () => {
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
      path: "/api/business/articleCatalogs/del/catalog-1",
      method: "DELETE",
    };

    jwtService.verifyAsync.mockResolvedValue({
      permissions: [],
      id: "user_1",
    });
    rolesService.getUserMenus.mockResolvedValue([
      { permissionKey: "business/articleCatalogs/delete" },
    ]);

    await expect(guard.canActivate(createContext(request))).resolves.toBe(true);
  });

  it("知识运营重建接口使用 AI 运营权限控制", async () => {
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
      path: "/api/business/articles/rebuildEmbeddings/article-1",
      method: "POST",
    };

    jwtService.verifyAsync.mockResolvedValue({
      permissions: [],
      id: "user_1",
    });
    rolesService.getUserMenus.mockResolvedValue([
      { permissionKey: "content/articles/aiOperate" },
    ]);

    await expect(guard.canActivate(createContext(request))).resolves.toBe(true);
  });

  it("知识检索调试接口允许 aiDebug 权限访问", async () => {
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
      path: "/api/business/articles/retrieveForAi",
      method: "GET",
    };

    jwtService.verifyAsync.mockResolvedValue({
      permissions: [],
      id: "user_1",
    });
    rolesService.getUserMenus.mockResolvedValue([
      { permissionKey: "content/articles/aiDebug" },
    ]);

    await expect(guard.canActivate(createContext(request))).resolves.toBe(true);
  });

  it("知识检索调试接口允许 viewAll 权限访问", async () => {
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
      path: "/api/business/articles/retrieveForAi",
      method: "GET",
    };

    jwtService.verifyAsync.mockResolvedValue({
      permissions: [],
      id: "user_1",
    });
    rolesService.getUserMenus.mockResolvedValue([
      { permissionKey: "content/articles/viewAll" },
    ]);

    await expect(guard.canActivate(createContext(request))).resolves.toBe(true);
  });

  it("知识搜索记录接口使用知识首页权限控制", async () => {
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
      path: "/api/business/articles/search-records",
      method: "POST",
    };

    jwtService.verifyAsync.mockResolvedValue({
      permissions: [],
      id: "user_1",
    });
    rolesService.getUserMenus.mockResolvedValue([
      { permissionKey: "business/articles/home" },
    ]);

    await expect(guard.canActivate(createContext(request))).resolves.toBe(true);
  });

  it("知识问答接口使用知识首页权限控制", async () => {
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
      path: "/api/business/knowledge-qa/ask",
      method: "POST",
      body: {
        question: "上线失败如何回滚",
      },
    };

    jwtService.verifyAsync.mockResolvedValue({
      permissions: [],
      id: "user_1",
    });
    rolesService.getUserMenus.mockResolvedValue([
      { permissionKey: "business/articles/home" },
    ]);

    await expect(guard.canActivate(createContext(request))).resolves.toBe(true);
  });

  it("embedding 预览接口允许 aiDebug 权限访问", async () => {
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
      path: "/api/business/knowledge-qa/embed-preview",
      method: "POST",
      body: {
        text: "项目复盘风险",
      },
    };

    jwtService.verifyAsync.mockResolvedValue({
      permissions: [],
      id: "user_1",
    });
    rolesService.getUserMenus.mockResolvedValue([
      { permissionKey: "content/articles/aiDebug" },
    ]);

    await expect(guard.canActivate(createContext(request))).resolves.toBe(true);
  });

  it("验收单提交审批接口使用验收单提交审批权限控制", async () => {
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
      path: "/api/business/acceptance-records/record-1/submit-approval",
      method: "POST",
    };

    jwtService.verifyAsync.mockResolvedValue({
      permissions: [],
      id: "user_1",
    });
    rolesService.getUserMenus.mockResolvedValue([
      { permissionKey: "business/acceptance-records/submitApproval" },
    ]);
    redisService.getPermissions.mockResolvedValue([
      "business/acceptance-records/submitApproval",
    ]);

    await expect(guard.canActivate(createContext(request))).resolves.toBe(true);
  });

  it("普通消息列表权限不能触发重建待办维护接口", async () => {
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
      path: "/api/system/messages/rebuild-todo",
      method: "POST",
    };

    jwtService.verifyAsync.mockResolvedValue({
      permissions: [],
      id: "user_1",
    });
    rolesService.getUserMenus.mockResolvedValue([
      { permissionKey: "system/messages/list" },
    ]);
    redisService.getPermissions.mockResolvedValue(["system/messages/list"]);

    await expect(guard.canActivate(createContext(request))).rejects.toThrow(
      "接口无权限",
    );
  });

  it("具备审批上下文回填权限时放行参与人索引回填接口", async () => {
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
      path: "/api/business/approval-contexts/backfill-participants",
      method: "POST",
    };

    jwtService.verifyAsync.mockResolvedValue({
      permissions: [],
      id: "user_1",
    });
    rolesService.getUserMenus.mockResolvedValue([
      { permissionKey: "business/approval-contexts/backfillParticipants" },
    ]);
    redisService.getPermissions.mockResolvedValue([
      "business/approval-contexts/backfillParticipants",
    ]);

    await expect(guard.canActivate(createContext(request))).resolves.toBe(true);
  });

  it("具备定时任务立即执行权限时放行运行接口", async () => {
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
      path: "/api/system/scheduled-jobs/run/demo-job",
      method: "POST",
    };

    jwtService.verifyAsync.mockResolvedValue({
      permissions: [],
      id: "user_1",
    });
    rolesService.getUserMenus.mockResolvedValue([
      { permissionKey: "system/scheduledJobs/run" },
    ]);
    redisService.getPermissions.mockResolvedValue(["system/scheduledJobs/run"]);

    await expect(guard.canActivate(createContext(request))).resolves.toBe(true);
  });

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
    redisService.getPermissions.mockResolvedValue([
      "system/scheduledJobs/logs",
    ]);

    await expect(guard.canActivate(createContext(request))).resolves.toBe(true);
  });

  it("缺少日志权限时拒绝访问定时任务日志详情接口", async () => {
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
    rolesService.getUserMenus.mockResolvedValue([]);
    redisService.getPermissions.mockResolvedValue([
      "system/scheduledJobs/logs",
    ]);

    await expect(guard.canActivate(createContext(request))).rejects.toThrow(
      "接口无权限",
    );
  });

  it("具备客户详情权限时放行客户授权人员列表接口", async () => {
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
      path: "/api/business/crm/customers/customer-1/auth-users",
      method: "GET",
    };

    jwtService.verifyAsync.mockResolvedValue({
      permissions: [],
      id: "user_1",
    });
    rolesService.getUserMenus.mockResolvedValue([
      { permissionKey: "business/crm/customers/getOne" },
    ]);

    await expect(guard.canActivate(createContext(request))).resolves.toBe(true);
  });

  it("具备客户更新权限时放行客户查看授权接口", async () => {
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
      path: "/api/business/crm/customers/customer-1/auth",
      method: "POST",
      body: { userIds: ["user_2"] },
    };

    jwtService.verifyAsync.mockResolvedValue({
      permissions: [],
      id: "user_1",
    });
    rolesService.getUserMenus.mockResolvedValue([
      { permissionKey: "business/crm/customers/update" },
    ]);

    await expect(guard.canActivate(createContext(request))).resolves.toBe(true);
  });

  it("具备客户更新权限时放行批量客户查看授权接口", async () => {
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
      path: "/api/business/crm/customers/grantViewAccess",
      method: "POST",
      body: {
        customerId: "customer-1",
        userIds: ["user-2"],
      },
    };

    jwtService.verifyAsync.mockResolvedValue({
      permissions: [],
      id: "user_1",
    });
    rolesService.getUserMenus.mockResolvedValue([
      { permissionKey: "business/crm/customers/update" },
    ]);

    await expect(guard.canActivate(createContext(request))).resolves.toBe(true);
  });

  it("具备客户更新权限时放行角色式新增客户查看授权接口", async () => {
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
      path: "/api/business/crm/customers/customer-1/viewers/selectAll",
      method: "POST",
      body: {
        userIds: ["user-2"],
      },
    };

    jwtService.verifyAsync.mockResolvedValue({
      permissions: [],
      id: "user_1",
    });
    rolesService.getUserMenus.mockResolvedValue([
      { permissionKey: "business/crm/customers/update" },
    ]);

    await expect(guard.canActivate(createContext(request))).resolves.toBe(true);
  });

  it("具备客户详情权限时放行客户授权记录接口", async () => {
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
      path: "/api/business/crm/customers/customer-1/viewers/records",
      method: "GET",
    };

    jwtService.verifyAsync.mockResolvedValue({
      permissions: [],
      id: "user_1",
    });
    rolesService.getUserMenus.mockResolvedValue([
      { permissionKey: "business/crm/customers/getOne" },
    ]);

    await expect(guard.canActivate(createContext(request))).resolves.toBe(true);
  });

  it("缺少客户更新权限时拒绝客户查看授权接口", async () => {
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
      path: "/api/business/crm/customers/customer-1/auth",
      method: "POST",
      body: { userIds: ["user_2"] },
    };

    jwtService.verifyAsync.mockResolvedValue({
      permissions: [],
      id: "user_1",
    });
    rolesService.getUserMenus.mockResolvedValue([
      { permissionKey: "business/crm/customers/getOne" },
    ]);

    await expect(guard.canActivate(createContext(request))).rejects.toThrow(
      "接口无权限",
    );
  });
});
