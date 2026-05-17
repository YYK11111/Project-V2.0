import { ArticleCatalogsService } from "./service";

describe("ArticleCatalogsService 删除保护", () => {
  const createService = () => {
    const repository = {
      findOne: jest.fn(),
      save: jest.fn().mockImplementation(async (value) => ({
        ...value,
        id: value.id || "catalog-1",
      })),
      update: jest.fn().mockResolvedValue({ affected: 1 }),
      findDescendants: jest.fn(),
    };
    const articleRepository = {
      count: jest.fn().mockResolvedValue(0),
    };
    const catalogManagerRepository = {
      delete: jest.fn().mockResolvedValue({ affected: 0 }),
      save: jest.fn().mockResolvedValue([]),
    };
    const service = new ArticleCatalogsService(
      repository as any,
      articleRepository as any,
      catalogManagerRepository as any,
    );
    return { service, repository, articleRepository, catalogManagerRepository };
  };

  it("存在子分类时禁止删除分类", async () => {
    const { service, repository } = createService();
    repository.findDescendants.mockResolvedValue([{ id: "1" }, { id: "2" }]);

    await expect(service.del("1", "管理员")).rejects.toThrow(
      "当前分类存在子分类，不能删除",
    );
  });

  it("分类下存在知识时禁止删除分类", async () => {
    const { service, repository, articleRepository } = createService();
    repository.findDescendants.mockResolvedValue([{ id: "1" }]);
    articleRepository.count.mockResolvedValue(1);

    await expect(service.del("1", "管理员")).rejects.toThrow(
      "当前分类下存在知识，不能删除",
    );
  });

  it("无子分类且无知识时允许删除分类", async () => {
    const { service, repository, articleRepository } = createService();
    repository.findDescendants.mockResolvedValue([{ id: "1" }]);
    articleRepository.count.mockResolvedValue(0);

    await service.del("1", "管理员");

    expect(repository.update).toHaveBeenCalledWith(["1"], {
      isDelete: "1",
      updateUser: "管理员",
    });
  });

  it("角色可见分类必须配置默认可见角色", async () => {
    const { service } = createService();

    await expect(
      service.save({
        name: "角色分类",
        defaultVisibilityType: "role",
        defaultVisibleRoleIds: [],
      }),
    ).rejects.toThrow("角色可见分类必须配置默认可见角色");
  });

  it("指定人员可见分类必须配置默认可见人员", async () => {
    const { service } = createService();

    await expect(
      service.save({
        name: "指定人员分类",
        defaultVisibilityType: "specified",
        defaultVisibleUserIds: [],
      }),
    ).rejects.toThrow("指定人员可见分类必须配置默认可见人员");
  });

  it("允许借阅时最大借阅天数必须大于 0", async () => {
    const { service } = createService();

    await expect(
      service.save({
        name: "可借阅分类",
        defaultVisibilityType: "public",
        allowBorrow: "1",
        maxBorrowDays: 0,
      }),
    ).rejects.toThrow("允许借阅时最大借阅天数必须大于 0");
  });

  it("借阅审批方式必须合法", async () => {
    const { service } = createService();

    await expect(
      service.save({
        name: "可借阅分类",
        defaultVisibilityType: "public",
        allowBorrow: "1",
        maxBorrowDays: 7,
        borrowApprovalMode: "unknown",
      }),
    ).rejects.toThrow("借阅审批方式不正确");
  });

  it("保存分类时应同步分类管理员关系表", async () => {
    const { service, catalogManagerRepository } = createService();

    const result = await service.save({
      name: "知识分类",
      defaultVisibilityType: "public",
      managerUserIds: ["u1", "u2"],
      allowBorrow: "0",
      borrowApprovalMode: "catalogManager",
      maxBorrowDays: 7,
      needBorrowReason: "1",
    });

    expect(catalogManagerRepository.delete).toHaveBeenCalledWith({
      catalogId: "catalog-1",
    });
    expect(catalogManagerRepository.save).toHaveBeenCalledWith([
      expect.objectContaining({ catalogId: "catalog-1", userId: "u1" }),
      expect.objectContaining({ catalogId: "catalog-1", userId: "u2" }),
    ]);
    expect(result.id).toBe("catalog-1");
  });

  it("保存分类时只根据本次提交同步分类管理员", async () => {
    const { service, catalogManagerRepository, repository } = createService();
    repository.save.mockResolvedValue({
      id: "catalog-1",
      name: "知识分类",
      managerUserIds: ["old-user"],
    });

    await service.save({
      id: "catalog-1",
      name: "知识分类",
      defaultVisibilityType: "public",
      allowBorrow: "0",
      borrowApprovalMode: "catalogManager",
      maxBorrowDays: 7,
      needBorrowReason: "1",
    });

    expect(catalogManagerRepository.delete).toHaveBeenCalledWith({
      catalogId: "catalog-1",
    });
    expect(catalogManagerRepository.save).not.toHaveBeenCalled();
  });
});
