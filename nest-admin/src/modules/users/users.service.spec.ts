import { HttpException } from "@nestjs/common";
import { UsersService } from "./users.service";
import { verifyPassword } from "src/common/utils/password";

describe("UsersService", () => {
  const usersRepository = {
    findOne: jest.fn(),
    save: jest.fn(),
    createQueryBuilder: jest.fn(),
    manager: {
      getRepository: jest.fn(),
    },
  };
  const deptService = {
    getChildren: jest.fn(),
  };
  const sysFileService = {};
  const configService = {
    getDefaultUserPassword: jest.fn(),
  };

  const createService = () =>
    new UsersService(
      usersRepository as any,
      deptService as any,
      sysFileService as any,
      configService as any,
    );

  beforeEach(() => {
    jest.clearAllMocks();
    usersRepository.manager.getRepository.mockReturnValue({
      findOne: jest.fn().mockResolvedValue(null),
    });
    usersRepository.findOne.mockResolvedValue(null);
    usersRepository.save.mockImplementation(async (data) => ({ ...data }));
    sysFileService.findByPath = jest.fn().mockResolvedValue(null);
    sysFileService.softDeleteByPath = jest.fn();
    sysFileService.associateFiles = jest.fn();
    deptService.getChildren.mockResolvedValue([]);
  });

  it("人员选项只返回业务选择器需要的轻量字段", async () => {
    const getMany = jest.fn().mockResolvedValue([
      {
        id: "user-1",
        name: "zhangsan",
        nickname: "张三",
        avatar: "avatar.png",
        password: "secret",
        email: "zhangsan@example.com",
        deptId: "dept-1",
        dept: {
          id: "dept-1",
          name: "研发部",
          parentId: "0",
        },
      },
    ]);
    const qb = {
      leftJoinAndSelect: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      take: jest.fn().mockReturnThis(),
      getMany,
    };
    usersRepository.createQueryBuilder.mockReturnValue(qb);
    const service = createService();

    const result = await service.getOptions({
      pageNum: 1,
      pageSize: 100,
      keyword: "张",
    } as any);

    expect(result).toEqual([
      {
        id: "user-1",
        name: "zhangsan",
        nickname: "张三",
        avatar: "avatar.png",
        deptId: "dept-1",
        dept: {
          id: "dept-1",
          name: "研发部",
          parentId: "0",
        },
      },
    ]);
    expect(JSON.stringify(result)).not.toContain("secret");
    expect(JSON.stringify(result)).not.toContain("zhangsan@example.com");
  });

  it("人员选项在 includeAll=1 时不按当前用户数据权限范围过滤", async () => {
    const getMany = jest.fn().mockResolvedValue([]);
    const qb = {
      leftJoinAndSelect: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      take: jest.fn().mockReturnThis(),
      getMany,
    };
    usersRepository.createQueryBuilder.mockReturnValue(qb);
    const service = createService();

    await service.getOptions({
      pageNum: 1,
      pageSize: 100,
      includeAll: "1",
      _operatorId: "user-1",
      _operatorDeptId: "dept-1",
      _operatorPermissions: [],
      _operatorRoles: [
        {
          permissionKey: "normal",
          dataPermissionType: "self",
          isActive: "1",
        },
      ],
    } as any);

    expect(qb.andWhere).not.toHaveBeenCalledWith(
      "User.id = :currentUserId",
      expect.any(Object),
    );
  });

  it("用户列表应按当前用户数据权限范围过滤到本人", async () => {
    const getManyAndCount = jest.fn().mockResolvedValue([
      [
        {
          id: "user-1",
          name: "zhangsan",
          deptId: "dept-1",
          dept: {
            id: "dept-1",
            name: "研发部",
            parentId: "0",
          },
        },
      ],
      1,
    ]);
    const qb = {
      leftJoinAndSelect: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      take: jest.fn().mockReturnThis(),
      getManyAndCount,
    };
    usersRepository.createQueryBuilder.mockReturnValue(qb);
    const service = createService();

    await service.list({
      pageNum: 1,
      pageSize: 10,
      _operatorId: "user-1",
      _operatorDeptId: "dept-1",
      _operatorPermissions: [],
      _operatorRoles: [
        {
          permissionKey: "normal",
          dataPermissionType: "self",
          isActive: "1",
        },
      ],
    } as any);

    expect(qb.andWhere).toHaveBeenCalledWith("User.id = :currentUserId", {
      currentUserId: "user-1",
    });
  });

  it("用户详情应拒绝访问数据范围外的用户", async () => {
    const service = createService();
    usersRepository.findOne.mockResolvedValue({
      id: "user-2",
      deptId: "dept-2",
      dept: {
        id: "dept-2",
        name: "市场部",
      },
      roles: [],
    });

    const result = await service.getOne(
      {
        id: "user-2",
        _operatorId: "user-1",
        _operatorDeptId: "dept-1",
        _operatorPermissions: [],
        _operatorRoles: [
          {
            permissionKey: "normal",
            dataPermissionType: "self",
            isActive: "1",
          },
        ],
      } as any,
      false,
    );

    expect(result).toBeNull();
  });

  it("新增用户未填写密码时使用系统配置默认密码", async () => {
    const service = createService();
    configService.getDefaultUserPassword.mockResolvedValue("Init@123456");
    usersRepository.save = jest.fn(async (data) => ({ ...data, id: "user-1" }));

    const result = await service.save({ name: "zhangsan" } as any);

    await expect(verifyPassword("Init@123456", result.password)).resolves.toBe(
      true,
    );
    expect(result.password).not.toBe("Init@123456");
    expect(result.passwordVersion).toBe(2);
  });

  it("新增用户未填写密码且系统未配置默认密码时应拒绝新增", async () => {
    const service = createService();
    configService.getDefaultUserPassword.mockResolvedValue("");

    await expect(service.save({ name: "zhangsan" } as any)).rejects.toThrow(
      "请先在系统配置中设置默认用户密码",
    );
  });

  it("编辑用户未填写密码时不应套用默认密码", async () => {
    const service = createService();
    configService.getDefaultUserPassword.mockResolvedValue("Init@123456");
    jest.spyOn(service, "getOne").mockResolvedValue({ id: "user-1" } as any);
    usersRepository.save = jest.fn(async (data) => ({ ...data }));

    const result = await service.save({
      id: "user-1",
      nickname: "张三",
    } as any);

    expect(configService.getDefaultUserPassword).not.toHaveBeenCalled();
    expect(result.password).toBeUndefined();
  });

  it("有用户管理重置密码权限时无需旧密码即可重置", async () => {
    const service = createService();
    jest.spyOn(service, "getOne").mockResolvedValue({ id: "user-1" } as any);
    usersRepository.save = jest.fn(async (data) => ({ ...data }));

    const result = await service.resetPassword({
      id: "user-1",
      passwordNew: "New@123456",
      passwordNewConfirm: "New@123456",
      permissions: ["system/users/resetPassword"],
    } as any);

    await expect(verifyPassword("New@123456", result.password)).resolves.toBe(
      true,
    );
    expect(result.passwordVersion).toBe(2);
  });

  it("没有用户管理重置密码权限时不能调用管理员重置密码", async () => {
    const service = createService();
    jest.spyOn(service, "getOne").mockResolvedValue({
      id: "user-1",
      password: await (
        await import("src/common/utils/password")
      ).hashPassword("Old@123456"),
    } as any);

    await expect(
      service.resetPassword({
        id: "user-1",
        passwordOld: "Wrong@123456",
        passwordNew: "New@123456",
        passwordNewConfirm: "New@123456",
        permissions: [],
      } as any),
    ).rejects.toThrow("接口无权限");
  });

  it("个人中心修改密码必须校验旧密码", async () => {
    const service = createService();
    jest.spyOn(service, "getOne").mockResolvedValue({
      id: "user-1",
      password: await (
        await import("src/common/utils/password")
      ).hashPassword("Old@123456"),
    } as any);

    await expect(
      service.updatePassword({
        id: "user-1",
        passwordOld: "Wrong@123456",
        passwordNew: "New@123456",
        passwordNewConfirm: "New@123456",
      } as any),
    ).rejects.toThrow("旧密码不正确");
  });

  it("个人中心修改密码成功后应加密保存新密码", async () => {
    const service = createService();
    jest.spyOn(service, "getOne").mockResolvedValue({
      id: "user-1",
      password: await (
        await import("src/common/utils/password")
      ).hashPassword("Old@123456"),
    } as any);
    usersRepository.save = jest.fn(async (data) => ({ ...data }));

    const result = await service.updatePassword({
      id: "user-1",
      passwordOld: "Old@123456",
      passwordNew: "New@123456",
      passwordNewConfirm: "New@123456",
    } as any);

    await expect(verifyPassword("New@123456", result.password)).resolves.toBe(
      true,
    );
    expect(result.passwordVersion).toBe(2);
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
