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
      path: "/api/system/users/updateTheme",
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
});
