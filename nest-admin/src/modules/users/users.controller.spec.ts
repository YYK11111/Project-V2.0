import { UsersController } from "./users.controller";

describe("UsersController", () => {
  const createController = () => {
    const usersService = {
      resetPassword: jest.fn().mockResolvedValue({ affected: 1 }),
      updatePassword: jest.fn().mockResolvedValue({ affected: 1 }),
    };
    const captchaService = {
      validateCaptcha: jest.fn().mockReturnValue("验证码错误"),
    };
    const controller = new UsersController(
      usersService as any,
      captchaService as any,
      {} as any,
    );

    return { controller, usersService, captchaService };
  };

  it("超级管理员重置密码时不应校验验证码", async () => {
    const { controller, usersService, captchaService } = createController();
    const body = {
      id: "user-1",
      passwordNew: "New@123456",
      passwordNewConfirm: "New@123456",
    };

    await expect(
      controller.resetPassword(body, { user: { permissions: ["*"] } }),
    ).resolves.toEqual({ affected: 1 });

    expect(captchaService.validateCaptcha).not.toHaveBeenCalled();
    expect(usersService.resetPassword).toHaveBeenCalledWith({
      ...body,
      permissions: ["*"],
    });
  });

  it("管理员重置密码接口不应依赖验证码", async () => {
    const { controller, usersService, captchaService } = createController();
    const body = {
      id: "user-1",
      passwordOld: "Old@123456",
      passwordNew: "New@123456",
      passwordNewConfirm: "New@123456",
    };

    await expect(
      controller.resetPassword(body, {
        user: { permissions: ["system/users/resetPassword"] },
      }),
    ).resolves.toEqual({ affected: 1 });

    expect(captchaService.validateCaptcha).not.toHaveBeenCalled();
    expect(usersService.resetPassword).toHaveBeenCalledWith({
      ...body,
      permissions: ["system/users/resetPassword"],
    });
  });

  it("个人中心修改密码应使用当前登录用户 id", async () => {
    const { controller, usersService, captchaService } = createController();
    const body = {
      id: "other-user",
      passwordOld: "Old@123456",
      passwordNew: "New@123456",
      passwordNewConfirm: "New@123456",
    };

    await expect(
      controller.updatePassword(body, { user: { id: "current-user" } }),
    ).resolves.toEqual({ affected: 1 });

    expect(captchaService.validateCaptcha).not.toHaveBeenCalled();
    expect(usersService.updatePassword).toHaveBeenCalledWith({
      passwordOld: "Old@123456",
      passwordNew: "New@123456",
      passwordNewConfirm: "New@123456",
      id: "current-user",
    });
  });
});
