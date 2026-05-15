import { CustomersService } from "./service";

describe("CustomersService", () => {
  function createRepository() {
    return {
      save: jest.fn().mockImplementation(async (data) => data),
      find: jest.fn().mockResolvedValue([]),
      findOne: jest.fn(),
      count: jest.fn(),
      findAndCount: jest.fn(),
      manager: {
        query: jest.fn(),
      },
    };
  }

  function createViewerRepository() {
    return {
      find: jest.fn().mockResolvedValue([]),
      findOne: jest.fn(),
      save: jest.fn(),
      update: jest.fn(),
    };
  }

  it("新增客户时应把空字符串销售负责人归一化为 null", async () => {
    const repository = createRepository();
    const service = new CustomersService(
      repository as never,
      createViewerRepository() as never,
    );

    await service.save({
      name: "测试客户",
      contactPerson: "张三",
      contactPhone: "13800138000",
      salesId: "",
    } as never);

    expect(repository.save).toHaveBeenCalledWith(
      expect.objectContaining({
        salesId: null,
      }),
    );
  });

  it("通过 add 新增客户时也应把空字符串销售负责人归一化为 null", async () => {
    const repository = createRepository();
    const service = new CustomersService(
      repository as never,
      createViewerRepository() as never,
    );

    await service.add({
      name: "测试客户",
      contactPerson: "李四",
      contactPhone: "13900139000",
      salesId: "",
    } as never);

    expect(repository.save).toHaveBeenCalledWith(
      expect.objectContaining({
        salesId: null,
      }),
    );
  });

  it("客户列表只返回创建人、审批参与人和授权人可见的客户", async () => {
    const customerRows = [
      { id: "c1", name: "自己创建", createUser: "u1" },
      { id: "c2", name: "审批参与", createUser: "u2" },
      { id: "c3", name: "授权查看", createUser: "u3" },
      { id: "c4", name: "不可见", createUser: "u4" },
    ];
    const repository = createRepository();
    const queryBuilder: any = {
      leftJoinAndSelect: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      take: jest.fn().mockReturnThis(),
      getManyAndCount: jest
        .fn()
        .mockResolvedValue([customerRows.slice(0, 3), 3]),
    };
    repository.createQueryBuilder = jest.fn().mockReturnValue(queryBuilder);
    const viewerRepository = createViewerRepository();
    viewerRepository.find.mockResolvedValue([
      { customerId: "c2", userId: "u1", sourceType: "approval" },
      { customerId: "c3", userId: "u1", sourceType: "manual" },
    ]);
    const service = new CustomersService(
      repository as never,
      viewerRepository as never,
    );

    const result = await service.list({
      pageNum: 1,
      pageSize: 10,
      _operatorId: "u1",
      _operatorName: "yyk",
      _operatorPermissions: [],
    } as any);

    expect(queryBuilder.andWhere).toHaveBeenCalledWith(
      "(customer.createUser IN (:...creatorKeys) OR customer.id IN (:...visibleCustomerIds))",
      { creatorKeys: ["u1", "yyk"], visibleCustomerIds: ["c2", "c3"] },
    );
    expect(viewerRepository.find).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          userId: expect.objectContaining({
            _value: ["u1", "yyk"],
          }),
        }),
      }),
    );
    expect(result).toEqual({ list: customerRows.slice(0, 3), total: 3 });
  });

  it("客户列表优先使用审批上下文参与人索引合并可见客户", async () => {
    const repository = createRepository();
    const queryBuilder: any = {
      leftJoinAndSelect: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      take: jest.fn().mockReturnThis(),
      getManyAndCount: jest.fn().mockResolvedValue([[{ id: "c5" }], 1]),
    };
    repository.createQueryBuilder = jest.fn().mockReturnValue(queryBuilder);
    const viewerRepository = createViewerRepository();
    viewerRepository.find.mockResolvedValue([
      { customerId: "c2", userId: "u1", sourceType: "manual" },
    ]);
    const approvalContextService = {
      findVisibleBusinessIdsForUser: jest.fn().mockResolvedValue(["c5"]),
      hasBusinessParticipantAccess: jest.fn(),
    };
    const service = new CustomersService(
      repository as never,
      viewerRepository as never,
      approvalContextService as never,
    );

    await service.list({
      pageNum: 1,
      pageSize: 10,
      _operatorId: "u1",
      _operatorName: "yyk",
      _operatorPermissions: [],
    } as any);

    expect(
      approvalContextService.findVisibleBusinessIdsForUser,
    ).toHaveBeenCalledWith("u1", "customer");
    expect(queryBuilder.andWhere).toHaveBeenCalledWith(
      "(customer.createUser IN (:...creatorKeys) OR customer.id IN (:...visibleCustomerIds))",
      { creatorKeys: ["u1", "yyk"], visibleCustomerIds: ["c2", "c5"] },
    );
  });

  it("审批上下文参与人可以直接查看客户详情", async () => {
    const repository = createRepository();
    repository.findOne.mockResolvedValue({ id: "c5", createUser: "u2" });
    const viewerRepository = createViewerRepository();
    viewerRepository.findOne.mockResolvedValue(null);
    const approvalContextService = {
      findVisibleBusinessIdsForUser: jest.fn(),
      hasBusinessParticipantAccess: jest.fn().mockResolvedValue(true),
    };
    const service = new CustomersService(
      repository as never,
      viewerRepository as never,
      approvalContextService as never,
    );

    const result = await service.getOne({
      id: "c5",
      _operatorId: "u1",
      _operatorPermissions: [],
    } as any);

    expect(result).toEqual(expect.objectContaining({ id: "c5" }));
    expect(
      approvalContextService.hasBusinessParticipantAccess,
    ).toHaveBeenCalledWith("u1", "customer", "c5");
  });
});
