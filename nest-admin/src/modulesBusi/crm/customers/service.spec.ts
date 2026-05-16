import { CustomersService } from "./service";
import { WorkflowHistory } from "src/modulesBusi/workflow/entity/workflow-history.entity";
import { WorkflowInstance } from "src/modulesBusi/workflow/entity/workflow-instance.entity";

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
      findAndCount: jest.fn().mockResolvedValue([[], 0]),
      findOne: jest.fn(),
      save: jest.fn(),
      update: jest.fn(),
    };
  }

  function createViewerRecordRepository() {
    return {
      find: jest.fn().mockResolvedValue([]),
      findAndCount: jest.fn().mockResolvedValue([[], 0]),
      save: jest.fn().mockImplementation(async (data) => data),
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
      {
        customerId: "c2",
        userId: "u1",
        sourceType: "approval",
        status: "1",
        grantType: "permanent",
      },
      {
        customerId: "c3",
        userId: "u1",
        sourceType: "manual",
        status: "1",
        grantType: "permanent",
        canEdit: "1",
      },
    ]);
    const approvalContextService = {
      findVisibleBusinessIdsForUser: jest.fn().mockResolvedValue(["c2"]),
      hasBusinessParticipantAccess: jest.fn(),
    };
    const service = new CustomersService(
      repository as never,
      viewerRepository as never,
      approvalContextService as never,
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
    expect(result.list[0].permissionContext).toEqual({ canEdit: true });
    expect(result.list[1].permissionContext).toEqual({ canEdit: false });
    expect(result.list[2].permissionContext).toEqual({ canEdit: true });
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
      {
        customerId: "c2",
        userId: "u1",
        sourceType: "manual",
        status: "1",
        grantType: "permanent",
      },
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

  it("具有可编辑授权的查看人可以修改客户", async () => {
    const repository = createRepository();
    repository.findOne.mockResolvedValueOnce({ id: "c1", createUser: "u2" });
    const viewerRepository = createViewerRepository();
    viewerRepository.findOne.mockResolvedValueOnce({
      id: "v1",
      customerId: "c1",
      userId: "u1",
      status: "1",
      grantType: "temporary",
      startTime: new Date("2026-05-15T00:00:00.000Z"),
      endTime: new Date("2026-05-20T00:00:00.000Z"),
      canEdit: "1",
    });
    repository.save.mockResolvedValue({ id: "c1", name: "已更新客户" });
    const service = new CustomersService(
      repository as never,
      viewerRepository as never,
    );

    await service.update({
      id: "c1",
      name: "已更新客户",
      _operatorId: "u1",
      _operatorName: "yyk",
      _operatorPermissions: [],
    } as any);

    expect(repository.save).toHaveBeenCalledWith(
      expect.objectContaining({
        id: "c1",
        name: "已更新客户",
      }),
    );
  });

  it("重复授权同一用户时应更新授权配置", async () => {
    const repository = createRepository();
    repository.findOne.mockResolvedValueOnce({ id: "c1", createUser: "u1" });
    const viewerRepository = createViewerRepository();
    viewerRepository.findOne.mockResolvedValueOnce({
      id: "v1",
      customerId: "c1",
      userId: "u2",
      sourceType: "manual",
      status: "1",
    });
    viewerRepository.update.mockResolvedValue({ affected: 1 });
    const service = new CustomersService(
      repository as never,
      viewerRepository as never,
    );

    await service.grantCustomerViewAccess("c1", ["u2"], "u1", "yyk", [], {
      grantType: "temporary",
      startTime: new Date("2026-05-16T00:00:00.000Z"),
      endTime: new Date("2026-05-17T00:00:00.000Z"),
      canEdit: "1",
      grantReason: "允许协同编辑",
    });

    expect(viewerRepository.update).toHaveBeenCalledWith(
      { id: "v1" },
      expect.objectContaining({
        grantType: "temporary",
        canEdit: "1",
        grantReason: "允许协同编辑",
        grantUserId: "u1",
        revokeUserId: null,
        revokeTime: null,
        revokeReason: null,
        status: "1",
        updateUser: "u1",
      }),
    );
  });

  it("批量新增客户查看授权时应写入同一批次授权历史", async () => {
    const repository = createRepository();
    repository.findOne.mockResolvedValueOnce({ id: "c1", createUser: "u1" });
    const viewerRepository = createViewerRepository();
    viewerRepository.findOne.mockResolvedValue(null);
    viewerRepository.save
      .mockResolvedValueOnce({ id: "v1", customerId: "c1", userId: "u2" })
      .mockResolvedValueOnce({ id: "v2", customerId: "c1", userId: "u3" });
    const recordRepository = createViewerRecordRepository();
    const service = new CustomersService(
      repository as never,
      viewerRepository as never,
      undefined,
      undefined,
      recordRepository as never,
    );

    const result = await service.selectCustomerViewers(
      "c1",
      {
        userIds: ["u2", "u3", "u2"],
        grantType: "temporary" as any,
        startTime: new Date("2026-05-16T00:00:00.000Z"),
        endTime: new Date("2026-05-17T00:00:00.000Z"),
        canEdit: "1",
        grantReason: "协同跟进",
      },
      { id: "u1", name: "yyk", permissions: [] },
    );

    expect(result.userIds).toEqual(["u2", "u3"]);
    expect(recordRepository.save).toHaveBeenCalledTimes(1);
    const records = recordRepository.save.mock.calls[0][0];
    expect(records).toHaveLength(2);
    expect(new Set(records.map((item) => item.batchNo)).size).toBe(1);
    expect(records).toEqual([
      expect.objectContaining({
        customerId: "c1",
        viewerId: "v1",
        userId: "u2",
        actionType: "grant",
        grantType: "temporary",
        canEdit: "1",
        grantReason: "协同跟进",
        operatorId: "u1",
        operatorName: "yyk",
      }),
      expect.objectContaining({
        customerId: "c1",
        viewerId: "v2",
        userId: "u3",
        actionType: "grant",
        grantType: "temporary",
        canEdit: "1",
        grantReason: "协同跟进",
        operatorId: "u1",
        operatorName: "yyk",
      }),
    ]);
  });

  it("批量取消客户查看授权时应禁用授权并写入同一批次取消历史", async () => {
    const repository = createRepository();
    repository.findOne.mockResolvedValueOnce({ id: "c1", createUser: "u1" });
    const viewerRepository = createViewerRepository();
    viewerRepository.find.mockResolvedValue([
      { id: "v1", customerId: "c1", userId: "u2", grantType: "permanent" },
      { id: "v2", customerId: "c1", userId: "u3", grantType: "temporary" },
    ]);
    viewerRepository.update.mockResolvedValue({ affected: 2 });
    const recordRepository = createViewerRecordRepository();
    const service = new CustomersService(
      repository as never,
      viewerRepository as never,
      undefined,
      undefined,
      recordRepository as never,
    );

    const result = await service.cancelCustomerViewers(
      "c1",
      {
        userIds: ["u2", "u3"],
        reason: "无需继续查看",
      },
      { id: "u1", name: "yyk", permissions: [] },
    );

    expect(result.count).toBe(2);
    expect(viewerRepository.update).toHaveBeenCalledWith(
      expect.objectContaining({
        customerId: "c1",
        userId: expect.objectContaining({
          _value: ["u2", "u3"],
        }),
        sourceType: "manual",
        isDelete: null,
      }),
      expect.objectContaining({
        status: "0",
        revokeUserId: "u1",
        revokeReason: "无需继续查看",
        updateUser: "u1",
      }),
    );
    const records = recordRepository.save.mock.calls[0][0];
    expect(records).toHaveLength(2);
    expect(new Set(records.map((item) => item.batchNo)).size).toBe(1);
    expect(records).toEqual([
      expect.objectContaining({
        customerId: "c1",
        viewerId: "v1",
        userId: "u2",
        actionType: "revoke",
        revokeReason: "无需继续查看",
        operatorId: "u1",
        operatorName: "yyk",
      }),
      expect.objectContaining({
        customerId: "c1",
        viewerId: "v2",
        userId: "u3",
        actionType: "revoke",
        revokeReason: "无需继续查看",
        operatorId: "u1",
        operatorName: "yyk",
      }),
    ]);
  });

  it("应分页返回当前已授权人员并合并用户信息", async () => {
    const userRepository = {
      find: jest.fn().mockResolvedValue([
        {
          id: "u2",
          name: "zhangsan",
          nickname: "张三",
          phone: "13800138000",
          dept: { name: "销售部" },
        },
      ]),
    };
    const repository = createRepository();
    repository.findOne.mockResolvedValueOnce({ id: "c1", createUser: "u1" });
    repository.manager.getRepository = jest
      .fn()
      .mockReturnValue(userRepository);
    const viewerRepository = createViewerRepository();
    viewerRepository.findAndCount.mockResolvedValue([
      [
        {
          id: "v1",
          customerId: "c1",
          userId: "u2",
          grantType: "permanent",
          canEdit: "1",
          grantReason: "协同",
          grantUserId: "u1",
          createTime: "2026-05-16 10:00:00",
          status: "1",
        },
      ],
      1,
    ]);
    const service = new CustomersService(
      repository as never,
      viewerRepository as never,
    );

    const result = await service.allocatedViewerList(
      "c1",
      { pageNum: 1, pageSize: 10 },
      { id: "u1", name: "yyk", permissions: [] },
    );

    expect(result.total).toBe(1);
    expect(result.list[0]).toEqual(
      expect.objectContaining({
        id: "u2",
        viewerId: "v1",
        name: "zhangsan",
        nickname: "张三",
        deptName: "销售部",
        grantType: "permanent",
        canEdit: "1",
      }),
    );
  });

  it("应分页返回未授权用户", async () => {
    const userQueryBuilder: any = {
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      leftJoinAndSelect: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      take: jest.fn().mockReturnThis(),
      getCount: jest.fn().mockResolvedValue(1),
      getMany: jest.fn().mockResolvedValue([{ id: "u4", name: "lisi" }]),
    };
    const userRepository = {
      createQueryBuilder: jest.fn().mockReturnValue(userQueryBuilder),
    };
    const repository = createRepository();
    repository.findOne.mockResolvedValueOnce({ id: "c1", createUser: "u1" });
    repository.manager.getRepository = jest
      .fn()
      .mockReturnValue(userRepository);
    const viewerRepository = createViewerRepository();
    viewerRepository.find.mockResolvedValue([{ userId: "u2" }]);
    const service = new CustomersService(
      repository as never,
      viewerRepository as never,
    );

    const result = await service.unallocatedViewerList(
      "c1",
      { pageNum: 1, pageSize: 10, userName: "li" },
      { id: "u1", name: "yyk", permissions: [] },
    );

    expect(result).toEqual({ list: [{ id: "u4", name: "lisi" }], total: 1 });
    expect(userQueryBuilder.andWhere).toHaveBeenCalledWith(
      "user.id NOT IN (:...allocatedUserIds)",
      { allocatedUserIds: ["u2"] },
    );
    expect(userQueryBuilder.andWhere).toHaveBeenCalledWith(
      "user.name LIKE :userName",
      { userName: "%li%" },
    );
  });

  it("应按批次返回授权记录", async () => {
    const repository = createRepository();
    repository.findOne.mockResolvedValueOnce({ id: "c1", createUser: "u1" });
    const recordRepository = createViewerRecordRepository();
    recordRepository.findAndCount.mockResolvedValue([
      [
        {
          id: "r1",
          batchNo: "b1",
          actionType: "grant",
          userId: "u2",
          operatorName: "yyk",
          operateTime: "2026-05-16 10:00:00",
        },
        {
          id: "r2",
          batchNo: "b1",
          actionType: "grant",
          userId: "u3",
          operatorName: "yyk",
          operateTime: "2026-05-16 10:00:00",
        },
      ],
      2,
    ]);
    const service = new CustomersService(
      repository as never,
      createViewerRepository() as never,
      undefined,
      undefined,
      recordRepository as never,
    );

    const result = await service.viewerRecords(
      "c1",
      { pageNum: 1, pageSize: 10 },
      { id: "u1", name: "yyk", permissions: [] },
    );

    expect(result.total).toBe(1);
    expect(result.list).toEqual([
      expect.objectContaining({
        batchNo: "b1",
        actionType: "grant",
        userCount: 2,
        items: [
          expect.objectContaining({ userId: "u2" }),
          expect.objectContaining({ userId: "u3" }),
        ],
      }),
    ]);
  });

  it("授权记录分页应按批次分页且不拆分同一批次", async () => {
    const repository = createRepository();
    repository.findOne.mockResolvedValueOnce({ id: "c1", createUser: "u1" });
    const recordRepository = createViewerRecordRepository();
    recordRepository.findAndCount.mockResolvedValue([
      [
        {
          id: "r1",
          batchNo: "b1",
          actionType: "grant",
          userId: "u2",
          operatorName: "yyk",
          operateTime: "2026-05-16 10:00:00",
        },
        {
          id: "r2",
          batchNo: "b1",
          actionType: "grant",
          userId: "u3",
          operatorName: "yyk",
          operateTime: "2026-05-16 10:00:00",
        },
        {
          id: "r3",
          batchNo: "b2",
          actionType: "revoke",
          userId: "u4",
          operatorName: "yyk",
          operateTime: "2026-05-15 10:00:00",
        },
      ],
      3,
    ]);
    const service = new CustomersService(
      repository as never,
      createViewerRepository() as never,
      undefined,
      undefined,
      recordRepository as never,
    );

    const result = await service.viewerRecords(
      "c1",
      { pageNum: 1, pageSize: 1 },
      { id: "u1", name: "yyk", permissions: [] },
    );

    expect(recordRepository.findAndCount.mock.calls[0][0]).not.toHaveProperty(
      "skip",
    );
    expect(recordRepository.findAndCount.mock.calls[0][0]).not.toHaveProperty(
      "take",
    );
    expect(result.total).toBe(2);
    expect(result.list).toEqual([
      expect.objectContaining({
        batchNo: "b1",
        userCount: 2,
      }),
    ]);
  });

  it("同步审批参与人时不应把 system 写入授权人ID", async () => {
    const repository = createRepository();
    repository.manager.getRepository = jest.fn().mockReturnValue({
      find: jest.fn().mockResolvedValue([{ operatorId: "7" }]),
    });
    const viewerRepository = createViewerRepository();
    viewerRepository.findOne.mockResolvedValue(null);
    const service = new CustomersService(
      repository as never,
      viewerRepository as never,
    );

    await service.syncApprovalParticipants("c1", "instance-1");

    expect(viewerRepository.save).toHaveBeenCalledWith(
      expect.objectContaining({
        customerId: "c1",
        userId: "7",
        sourceType: "approval",
        grantUserId: null,
        createUser: "system",
        updateUser: "system",
      }),
    );
  });

  it("客户详情应返回可编辑权限上下文", async () => {
    const repository = createRepository();
    repository.findOne.mockResolvedValue({ id: "c9", createUser: "u2" });
    const viewerRepository = createViewerRepository();
    viewerRepository.findOne.mockResolvedValue({
      id: "v1",
      customerId: "c9",
      userId: "u1",
      status: "1",
      grantType: "temporary",
      canEdit: "1",
      startTime: new Date("2026-05-15T00:00:00.000Z"),
      endTime: new Date("2026-05-20T00:00:00.000Z"),
    });
    const service = new CustomersService(
      repository as never,
      viewerRepository as never,
    );

    const result = await service.getOne({
      id: "c9",
      _operatorId: "u1",
      _operatorName: "yyk",
      _operatorPermissions: [],
    } as any);

    expect(result.permissionContext).toEqual({ canEdit: true });
  });

  it("客户详情应修正已结束流程遗留的审批中状态", async () => {
    const repository = createRepository();
    repository.findOne.mockResolvedValue({
      id: "8",
      createUser: "1",
      status: "1",
      approvalStatus: "1",
      currentNodeName: "客户审批中",
      workflowInstanceId: "25",
    });
    repository.update = jest.fn().mockResolvedValue({ affected: 1 });
    const workflowInstanceRepository = {
      findOne: jest.fn().mockResolvedValue({
        id: "25",
        status: "3",
        endTime: "2026-05-16 18:16:28",
      }),
    };
    const workflowHistoryRepository = {
      findOne: jest.fn().mockResolvedValue({
        id: "124",
        nodeName: "结束",
        action: "execute",
      }),
    };
    repository.manager.getRepository = jest.fn((entity) => {
      if (entity === WorkflowInstance) return workflowInstanceRepository;
      if (entity === WorkflowHistory) return workflowHistoryRepository;
      return { findOne: jest.fn() };
    });
    const service = new CustomersService(
      repository as never,
      createViewerRepository() as never,
    );

    const result = await service.getOne({ id: "8" } as any);

    expect(repository.update).toHaveBeenCalledWith(
      "8",
      expect.objectContaining({
        status: "2",
        approvalStatus: "2",
        currentNodeName: "客户审批已通过，转为意向客户",
      }),
    );
    expect(result).toEqual(
      expect.objectContaining({
        status: "2",
        approvalStatus: "2",
        currentNodeName: "客户审批已通过，转为意向客户",
      }),
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
