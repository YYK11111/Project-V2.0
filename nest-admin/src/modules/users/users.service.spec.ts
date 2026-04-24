import { HttpException } from "@nestjs/common";
import { UsersService } from "./users.service";

describe("UsersService", () => {
  const usersRepository = {
    manager: {
      getRepository: jest.fn(),
    },
  };
  const deptService = {};
  const sysFileService = {};

  const createService = () =>
    new UsersService(
      usersRepository as any,
      deptService as any,
      sysFileService as any,
    );

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("管理员用户更新自己的主题或提醒偏好时不应因 manageAdmin 权限被拒绝", async () => {
    const service = createService();
    jest.spyOn(service, "getOne").mockResolvedValue({
      id: "1",
      roles: [{ permissionKey: "admin" }],
    } as any);

    await expect(
      service.dataValidate({
        id: "1",
        updateUser: "1",
        permissions: ["system/users/update"],
      } as any),
    ).resolves.toBe(true);
  });

  it("普通管理员权限不足时更新其他管理员账号仍应被拒绝", async () => {
    const service = createService();
    jest.spyOn(service, "getOne").mockResolvedValue({
      id: "1",
      roles: [{ permissionKey: "admin" }],
    } as any);

    await expect(
      service.dataValidate({
        id: "1",
        updateUser: "other-user",
        permissions: ["system/users/update"],
      } as any),
    ).rejects.toBeInstanceOf(HttpException);
  });
});
