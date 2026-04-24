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
      name: "NestAdmin",
      roles: [{ permissionKey: "admin", isActive: "1" }],
    });

    expect(menuRepository.find).not.toHaveBeenCalled();
    expect(getMany).toHaveBeenCalled();
    expect(menus.map((item) => item.id)).toEqual(["206", "207"]);
  });
});
