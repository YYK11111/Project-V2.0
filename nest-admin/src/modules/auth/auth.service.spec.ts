import { ForbiddenException } from "@nestjs/common";
import { AuthService } from "./auth.service";
import { BoolNum } from "src/common/type/base";
import * as passwordUtils from "src/common/utils/password";
import * as commonUtils from "src/common/utils/common";

describe("AuthService", () => {
  const usersService = {
    getOne: jest.fn(),
  };

  const rolesService = {
    getUserMenus: jest.fn(),
  };

  const jwtService = {
    signAsync: jest.fn(),
  };

  const loginLogsService = {
    createLog: jest.fn(),
  };

  const redisService = {
    setRedisOnlineUser: jest.fn(),
    delRedisOnlineUser: jest.fn(),
    getRedisOnlineUser: jest.fn(),
  };

  const captchaService = {
    validateCaptcha: jest.fn(),
  };

  const systemConfigsService = {
    getSessionExpireMinutes: jest.fn(),
    getExternalNotifyRuntimeConfig: jest.fn(),
  };

  const externalAccountsService = {
    findActiveAccountByExternalIdentity: jest.fn(),
  };

  const feishuProvider = {
    isEnabled: jest.fn(),
    buildOAuthAuthorizeUrl: jest.fn(),
    getOAuthUser: jest.fn(),
  };

  const createService = () => {
    return new AuthService(
      usersService as any,
      rolesService as any,
      jwtService as any,
      loginLogsService as any,
      redisService as any,
      systemConfigsService as any,
      captchaService as any,
      externalAccountsService as any,
      feishuProvider as any,
    );
  };

  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(commonUtils, "getIpAddress").mockResolvedValue("本地");
    captchaService.validateCaptcha.mockReturnValue("true");
    systemConfigsService.getSessionExpireMinutes.mockResolvedValue(30);
    systemConfigsService.getExternalNotifyRuntimeConfig.mockResolvedValue({
      enabled: true,
      siteUrl: "https://admin.example.com",
      feishu: {
        enabled: true,
        appId: "app_1",
        appSecret: "secret_1",
        baseUrl: "https://open.feishu.test",
      },
    });
    loginLogsService.createLog.mockResolvedValue({ session: "signature" });
    redisService.setRedisOnlineUser.mockResolvedValue(undefined);
    redisService.delRedisOnlineUser.mockResolvedValue(undefined);
    jwtService.signAsync.mockResolvedValue("header.payload.signature");
    rolesService.getUserMenus.mockResolvedValue([]);
    feishuProvider.isEnabled.mockReturnValue(true);
    feishuProvider.buildOAuthAuthorizeUrl.mockReturnValue(
      "https://open.feishu.test/open-apis/authen/v1/index?app_id=app_1",
    );
    feishuProvider.getOAuthUser.mockResolvedValue({
      externalUserId: "ou_1",
      openId: "open_1",
      unionId: "union_1",
    });
    externalAccountsService.findActiveAccountByExternalIdentity.mockResolvedValue(
      { userId: "user_1" },
    );
  });

  it("登录成功时写入 HttpOnly Cookie 并记录在线会话", async () => {
    const service = createService();
    const verifyPasswordSpy = jest
      .spyOn(passwordUtils, "verifyPassword")
      .mockResolvedValue(true);
    const req = {
      body: {
        account: "tester",
        password: "Password@123",
        uuid: "uuid-1",
        code: "1234",
      },
      headers: {},
      connection: { remoteAddress: "127.0.0.1" },
    };
    const res = {
      cookie: jest.fn(),
    };

    usersService.getOne.mockResolvedValue({
      id: "user_1",
      name: "tester",
      password: "scrypt$hash",
      roles: [],
    });

    const result = await service.login(req as any, res as any);

    expect(result).toEqual({ success: true });
    expect(verifyPasswordSpy).toHaveBeenCalledWith(
      "Password@123",
      "scrypt$hash",
    );
    expect(res.cookie).toHaveBeenCalledWith(
      "admin_session",
      "header.payload.signature",
      expect.objectContaining({
        httpOnly: true,
        sameSite: "lax",
        secure: false,
        path: "/",
      }),
    );
    expect(redisService.setRedisOnlineUser).toHaveBeenCalled();
  });

  it("超级管理员登录时不再把全量 permissions 写入 JWT", async () => {
    const service = createService();
    jest.spyOn(passwordUtils, "verifyPassword").mockResolvedValue(true);
    const req = {
      body: {
        account: "admin",
        password: "Password@123",
        uuid: "uuid-1",
        code: "1234",
      },
      headers: {},
      connection: { remoteAddress: "127.0.0.1" },
    };
    const res = {
      cookie: jest.fn(),
    };

    usersService.getOne.mockResolvedValue({
      id: "1",
      name: "admin",
      password: "scrypt$hash",
      roles: [{ id: "1", permissionKey: "admin", isActive: 1 }],
    });
    rolesService.getUserMenus.mockResolvedValue([
      { id: "m1", permissionKey: "system/users/getOne" },
      { id: "m2", permissionKey: "system/users/update" },
      { id: "m3", permissionKey: "system/users/update" },
    ]);

    await service.login(req as any, res as any);

    expect(jwtService.signAsync).toHaveBeenCalledWith(
      expect.not.objectContaining({
        permissions: expect.anything(),
      }),
      expect.any(Object),
    );
  });

  it("退出登录时清理 Cookie 并删除在线会话", async () => {
    const service = createService();
    const req = {
      user: {
        session: "signature",
        id: "user_1",
      },
      headers: {},
      connection: { remoteAddress: "127.0.0.1" },
    };
    const res = {
      clearCookie: jest.fn(),
    };

    const result = await service.logout(req as any, false, res as any);

    expect(result).toEqual({ success: true });
    expect(redisService.delRedisOnlineUser).toHaveBeenCalledWith("signature");
    expect(res.clearCookie).toHaveBeenCalledWith(
      "admin_session",
      expect.objectContaining({
        httpOnly: true,
        sameSite: "lax",
        secure: false,
        path: "/",
      }),
    );
  });

  it("非管理员强退会话时拒绝执行", async () => {
    const service = createService();
    const req = {
      user: {
        permissions: ["system/users/list"],
      },
      body: {
        session: "target-session",
      },
    };

    await expect(service.logout(req as any, true)).rejects.toBeInstanceOf(
      ForbiddenException,
    );
    expect(redisService.delRedisOnlineUser).not.toHaveBeenCalled();
  });

  it("拥有 admin 角色时允许执行管理员限定能力", () => {
    const service = createService();

    expect(() =>
      service.ensureAdmin({
        roles: [{ permissionKey: "admin" }],
        permissions: [],
      } as any),
    ).not.toThrow();
  });

  it("登录失败时记录失败日志", async () => {
    const service = createService();
    const verifyPasswordSpy = jest
      .spyOn(passwordUtils, "verifyPassword")
      .mockResolvedValue(false);
    const req = {
      body: {
        account: "tester",
        password: "wrong-password",
        uuid: "uuid-1",
        code: "1234",
      },
      headers: {},
      connection: { remoteAddress: "127.0.0.1" },
    };
    const res = {
      cookie: jest.fn(),
    };

    usersService.getOne.mockResolvedValue({
      id: "user_1",
      name: "tester",
      password: "scrypt$hash",
      roles: [],
    });

    await expect(service.login(req as any, res as any)).rejects.toThrow(
      "密码错误",
    );
    expect(verifyPasswordSpy).toHaveBeenCalled();
    expect(loginLogsService.createLog).toHaveBeenCalledWith(
      req,
      expect.objectContaining({
        isSuccess: BoolNum.No,
        msg: "密码错误",
      }),
    );
  });

  it("生成飞书 OAuth 授权地址并把目标地址放入 state", async () => {
    const service = createService();
    jwtService.signAsync.mockResolvedValue("state-token");

    const url = await service.getFeishuLoginUrl("/projectManage/approval");

    expect(url).toContain("open-apis/authen/v1/index");
    expect(jwtService.signAsync).toHaveBeenCalledWith(
      expect.objectContaining({
        redirect: "https://admin.example.com/projectManage/approval",
      }),
      expect.objectContaining({ expiresIn: "10m" }),
    );
    expect(feishuProvider.buildOAuthAuthorizeUrl).toHaveBeenCalledWith(
      expect.objectContaining({
        redirectUri: "https://admin.example.com/api/auth/feishu/callback",
        state: "state-token",
      }),
      expect.any(Object),
    );
  });

  it("飞书 OAuth 回调匹配外部账号后签发系统 Cookie", async () => {
    const service = createService();
    jwtService.verifyAsync = jest.fn().mockResolvedValue({
      redirect: "https://admin.example.com/projectManage/approval",
    });
    usersService.getOne.mockResolvedValue({
      id: "user_1",
      name: "tester",
      roles: [],
    });
    const req = {
      headers: {},
      connection: { remoteAddress: "127.0.0.1" },
    };
    const res = {
      cookie: jest.fn(),
    };

    const result = await service.loginWithFeishuCode(req as any, res as any, {
      code: "code_1",
      state: "state-token",
    });

    expect(result.redirect).toBe(
      "https://admin.example.com/projectManage/approval",
    );
    expect(feishuProvider.getOAuthUser).toHaveBeenCalledWith(
      "code_1",
      expect.any(Object),
    );
    expect(
      externalAccountsService.findActiveAccountByExternalIdentity,
    ).toHaveBeenCalledWith(
      "feishu",
      expect.objectContaining({
        externalUserId: "ou_1",
        openId: "open_1",
        unionId: "union_1",
      }),
    );
    expect(res.cookie).toHaveBeenCalledWith(
      "admin_session",
      "header.payload.signature",
      expect.objectContaining({ httpOnly: true }),
    );
  });
});
