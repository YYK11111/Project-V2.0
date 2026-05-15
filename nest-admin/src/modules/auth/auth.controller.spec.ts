import { AuthController } from "./auth.controller";

describe("AuthController", () => {
  const authService = {
    login: jest.fn(),
    getFeishuLoginUrl: jest.fn(),
    loginWithFeishuCode: jest.fn(),
    logout: jest.fn(),
    ensureAdmin: jest.fn(),
    getOnlineUsers: jest.fn(),
  };

  const usersService = {
    add: jest.fn(),
    getOne: jest.fn(),
  };

  const captchaService = {
    validateCaptcha: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    captchaService.validateCaptcha.mockReturnValue("true");
  });

  it("登录时透传响应对象以设置 HttpOnly Cookie", async () => {
    const controller = new AuthController(
      authService as any,
      usersService as any,
      captchaService as any,
    );
    const req = { body: { account: "admin", password: "123456" } };
    const res = { cookie: jest.fn() };
    authService.login.mockResolvedValue({ success: true });

    await controller.login(req, res as any);

    expect(authService.login).toHaveBeenCalledWith(req, res);
  });

  it("飞书登录入口重定向到飞书授权地址", async () => {
    const controller = new AuthController(
      authService as any,
      usersService as any,
      captchaService as any,
    );
    const res = { redirect: jest.fn() };
    authService.getFeishuLoginUrl.mockResolvedValue(
      "https://open.feishu.cn/open-apis/authen/v1/index",
    );

    await controller.redirectToFeishuLogin(
      "/projectManage/approval",
      res as any,
    );

    expect(authService.getFeishuLoginUrl).toHaveBeenCalledWith(
      "/projectManage/approval",
    );
    expect(res.redirect).toHaveBeenCalledWith(
      "https://open.feishu.cn/open-apis/authen/v1/index",
    );
  });

  it("飞书登录回调签发会话后跳转目标页面", async () => {
    const controller = new AuthController(
      authService as any,
      usersService as any,
      captchaService as any,
    );
    const req = { headers: {}, connection: {} };
    const res = { cookie: jest.fn(), redirect: jest.fn() };
    authService.loginWithFeishuCode.mockResolvedValue({
      redirect: "https://admin.example.com/projectManage/approval",
    });

    await controller.handleFeishuCallback(
      req as any,
      "code_1",
      "state-token",
      res as any,
    );

    expect(authService.loginWithFeishuCode).toHaveBeenCalledWith(req, res, {
      code: "code_1",
      state: "state-token",
    });
    expect(res.redirect).toHaveBeenCalledWith(
      "https://admin.example.com/projectManage/approval",
    );
  });

  it("获取在线用户前要求管理员权限", async () => {
    const controller = new AuthController(
      authService as any,
      usersService as any,
      captchaService as any,
    );
    const req = { user: { permissions: ["*"] } };
    const query = { pageNum: 1, pageSize: 10 };
    authService.getOnlineUsers.mockResolvedValue({ total: 0, data: [] });

    await controller.getOnlineUsers(req as any, query as any);

    expect(authService.ensureAdmin).toHaveBeenCalledWith(req.user);
    expect(authService.getOnlineUsers).toHaveBeenCalledWith(query);
  });
});
