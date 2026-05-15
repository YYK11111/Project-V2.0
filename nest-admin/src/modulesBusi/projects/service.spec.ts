import { BadRequestException, ForbiddenException } from "@nestjs/common";
import { ProjectsService } from "./service";

describe("ProjectsService closure guards", () => {
  const createService = () => {
    const repository = {
      findOne: jest.fn(),
      update: jest.fn(),
      find: jest.fn(),
      count: jest.fn(),
      save: jest.fn(),
      createQueryBuilder: jest.fn(),
    };

    const service = new ProjectsService(
      repository as any,
      { count: jest.fn(), find: jest.fn() } as any,
      { count: jest.fn(), find: jest.fn() } as any,
      { count: jest.fn(), findOne: jest.fn() } as any,
      { find: jest.fn() } as any,
      { find: jest.fn() } as any,
      { find: jest.fn() } as any,
      { find: jest.fn() } as any,
      { find: jest.fn() } as any,
      { findOne: jest.fn() } as any,
      { findOne: jest.fn() } as any,
      {
        findOne: jest.fn(),
        findDescendants: jest.fn(),
        save: jest.fn(),
      } as any,
      { findOne: jest.fn(), save: jest.fn() } as any,
      { count: jest.fn(), find: jest.fn() } as any,
      { count: jest.fn(), find: jest.fn() } as any,
      { count: jest.fn(), find: jest.fn() } as any,
      { update: jest.fn() } as any,
      { getOne: jest.fn() } as any,
      {
        getProjectFieldPermissions: jest.fn(),
        getGroupFieldMap: jest.fn().mockReturnValue({
          projectBasic: [
            "name",
            "code",
            "projectType",
            "priority",
            "description",
            "category",
            "tags",
            "departmentId",
            "leaderId",
            "creatorId",
          ],
          projectMember: ["members"],
          projectPlan: [
            "startDate",
            "endDate",
            "planStartDate",
            "planEndDate",
            "actualStartDate",
            "actualEndDate",
            "phase",
            "phaseStartDate",
            "phaseEndDate",
            "baselinePlanNote",
            "scopeBoundary",
            "baselineDeliverables",
            "milestones",
          ],
          projectBusiness: [
            "customerId",
            "budget",
            "actualCost",
            "currency",
            "spentHours",
            "businessLine",
            "industry",
            "projectSource",
          ],
          projectClosure: [
            "closeSummary",
            "closeDeliverables",
            "closeOpenIssues",
            "closeReview",
            "acceptanceDate",
          ],
          projectKnowledge: [],
        }),
      } as any,
      { getProjectWorkspacePrefs: jest.fn(), getOne: jest.fn() } as any,
      { findOne: jest.fn() } as any,
      { findOne: jest.fn() } as any,
      { getRepository: jest.fn(), transaction: jest.fn() } as any,
      { findOne: jest.fn() } as any,
    );

    (service as any).projectFieldPermissionService = {
      getProjectFieldPermissions: jest.fn(),
      getGroupFieldMap: jest.fn().mockReturnValue({
        projectBasic: [
          "name",
          "code",
          "projectType",
          "priority",
          "description",
          "category",
          "tags",
          "departmentId",
          "leaderId",
          "creatorId",
        ],
        projectMember: ["members"],
        projectPlan: [
          "startDate",
          "endDate",
          "planStartDate",
          "planEndDate",
          "actualStartDate",
          "actualEndDate",
          "phase",
          "phaseStartDate",
          "phaseEndDate",
          "baselinePlanNote",
          "scopeBoundary",
          "baselineDeliverables",
          "milestones",
        ],
        projectBusiness: [
          "customerId",
          "budget",
          "actualCost",
          "currency",
          "spentHours",
          "businessLine",
          "industry",
          "projectSource",
        ],
        projectClosure: [
          "closeSummary",
          "closeDeliverables",
          "closeOpenIssues",
          "closeReview",
          "acceptanceDate",
        ],
        projectKnowledge: [],
      }),
    };
    (service as any).projectMemberRepository = {
      find: jest.fn(),
      findOne: jest.fn(),
    };
    (service as any).workflowTaskRepository = {
      findOne: jest.fn(),
      find: jest.fn().mockResolvedValue([]),
    };
    (service as any).workflowHistoryRepository = {
      findOne: jest.fn(),
      find: jest.fn().mockResolvedValue([]),
    };

    return { service, repository };
  };

  it("发起结项审批前要求至少存在一条成功上线单", async () => {
    const { service } = createService();
    jest.spyOn(service, "getOne").mockResolvedValue({
      id: "p1",
      closeSummary: "验收通过",
      closeDeliverables: "交付清单",
      closeReview: "项目复盘",
      acceptanceDate: "2026-04-21",
    } as any);
    (service as any).goLiveRecordRepository = {
      count: jest.fn().mockResolvedValue(0),
    };
    (service as any).acceptanceRecordRepository = {
      count: jest.fn().mockResolvedValue(1),
    };

    await expect(service.validateClosePlan("p1")).rejects.toThrow(
      new BadRequestException("发起结项审批前，请至少维护一条已成功的上线记录"),
    );
  });

  it("发起结项审批前要求至少存在一条已通过验收单", async () => {
    const { service } = createService();
    jest.spyOn(service, "getOne").mockResolvedValue({
      id: "p1",
      closeSummary: "验收通过",
      closeDeliverables: "交付清单",
      closeReview: "项目复盘",
      acceptanceDate: "2026-04-21",
    } as any);
    (service as any).goLiveRecordRepository = {
      count: jest.fn().mockResolvedValue(1),
    };
    (service as any).acceptanceRecordRepository = {
      count: jest.fn().mockResolvedValue(0),
    };

    await expect(service.validateClosePlan("p1")).rejects.toThrow(
      new BadRequestException("发起结项审批前，请至少维护一条已通过的验收记录"),
    );
  });

  it("归档前要求至少存在一条已确认的运维交接单", async () => {
    const { service, repository } = createService();
    jest.spyOn(service, "getOne").mockResolvedValue({
      id: "p1",
      status: "6",
      closeSummary: "验收通过",
      closeDeliverables: "交付清单",
      closeReview: "项目复盘",
      acceptanceDate: "2026-04-21",
    } as any);
    repository.update.mockResolvedValue({ affected: 1 });
    (service as any).goLiveRecordRepository = {
      count: jest.fn().mockResolvedValue(1),
    };
    (service as any).acceptanceRecordRepository = {
      count: jest.fn().mockResolvedValue(1),
    };
    (service as any).handoverRecordRepository = {
      count: jest.fn().mockResolvedValue(0),
    };

    await expect(service.archive("p1")).rejects.toThrow(
      new BadRequestException("归档前，请至少维护一条已确认的运维交接记录"),
    );
  });

  it("立项后不允许编辑项目基础字段", () => {
    const { service } = createService();
    expect(() =>
      (service as any).assertProjectLifecycleEditable({ status: "3" }, [
        "name",
      ]),
    ).toThrow(ForbiddenException);
  });

  it("立项后不允许编辑里程碑集合", () => {
    const { service } = createService();
    expect(() =>
      (service as any).assertProjectLifecycleEditable({ status: "3" }, [
        "milestones",
      ]),
    ).toThrow(ForbiddenException);
  });

  it("立项后不允许通过项目编辑维护结项字段", () => {
    const { service } = createService();
    expect(() =>
      (service as any).assertProjectLifecycleEditable({ status: "3" }, [
        "closeSummary",
      ]),
    ).toThrow(ForbiddenException);
  });

  it("草稿项目仍允许通过项目编辑维护字段", () => {
    const { service } = createService();
    expect(() =>
      (service as any).assertProjectLifecycleEditable({ status: "1" }, [
        "name",
      ]),
    ).not.toThrow();
  });

  it("项目列表应返回创建人自己的草稿项目", async () => {
    const { service, repository } = createService();
    const queryBuilder = {
      leftJoinAndSelect: jest.fn().mockReturnThis(),
      leftJoin: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      take: jest.fn().mockReturnThis(),
      getManyAndCount: jest.fn().mockResolvedValue([
        [
          {
            id: "p1",
            name: "我的草稿项目",
            creatorId: "operator-1",
            leaderId: "other-leader",
            status: "1",
          },
        ],
        1,
      ]),
    };
    repository.createQueryBuilder.mockReturnValue(queryBuilder as any);
    (service as any).projectMemberRepository.find.mockResolvedValue([]);

    const result = await service.list({
      pageNum: 1,
      pageSize: 10,
      _operatorId: "operator-1",
      _operatorPermissions: [],
    } as any);

    expect(result.list).toHaveLength(1);
    expect(result.list[0]).toEqual(
      expect.objectContaining({
        id: "p1",
        creatorId: "operator-1",
        status: "1",
      }),
    );
    expect(queryBuilder.andWhere).toHaveBeenCalledWith(
      "(project.leaderId = :operatorId OR project.creatorId = :operatorId OR project.createUser = :operatorName OR projectMember.id IS NOT NULL)",
      { operatorId: "operator-1", operatorName: "" },
    );
  });

  it("草稿项目列表仅允许项目发起人可见", async () => {
    const { service, repository } = createService();
    const queryBuilder = {
      leftJoinAndSelect: jest.fn().mockReturnThis(),
      leftJoin: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      take: jest.fn().mockReturnThis(),
      getManyAndCount: jest.fn().mockResolvedValue([[], 0]),
    };
    repository.createQueryBuilder.mockReturnValue(queryBuilder as any);

    await service.list({
      pageNum: 1,
      pageSize: 10,
      _operatorId: "operator-1",
      _operatorName: "zhangsan",
      _operatorPermissions: ["business/projects/manageAll"],
    } as any);

    expect(queryBuilder.andWhere).toHaveBeenCalledWith(
      "(project.status NOT IN (:...creatorOnlyStatuses) OR project.creatorId = :operatorId OR project.createUser = :operatorName)",
      {
        creatorOnlyStatuses: ["1", "2"],
        operatorId: "operator-1",
        operatorName: "zhangsan",
      },
    );
  });

  it("立项审批中项目列表允许当前待办审批人可见", async () => {
    const { service, repository } = createService();
    const queryBuilder = {
      leftJoinAndSelect: jest.fn().mockReturnThis(),
      leftJoin: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      take: jest.fn().mockReturnThis(),
      getManyAndCount: jest.fn().mockResolvedValue([
        [
          {
            id: "p19",
            name: "立项审批项目",
            creatorId: "creator-1",
            leaderId: "leader-1",
            status: "2",
            workflowInstanceId: "22",
          },
        ],
        1,
      ]),
    };
    repository.createQueryBuilder.mockReturnValue(queryBuilder as any);
    (service as any).projectMemberRepository.find.mockResolvedValue([]);
    jest
      .spyOn(service as any, "getWorkflowVisibleProjectIdsForUser")
      .mockResolvedValue(["p19"]);

    const result = await service.list({
      pageNum: 1,
      pageSize: 10,
      _operatorId: "approver-1",
      _operatorName: "approver",
      _operatorPermissions: [],
    } as any);

    expect(result.list).toHaveLength(1);
    expect(result.list[0].id).toBe("p19");
    expect(queryBuilder.andWhere).toHaveBeenCalledWith(
      "(project.status NOT IN (:...creatorOnlyStatuses) OR project.creatorId = :operatorId OR project.createUser = :operatorName OR project.id IN (:...workflowVisibleProjectIds))",
      {
        creatorOnlyStatuses: ["1", "2"],
        operatorId: "approver-1",
        operatorName: "approver",
        workflowVisibleProjectIds: ["p19"],
      },
    );
  });

  it("项目可见 ID 范围和列表使用同一套审批中可见条件", async () => {
    const { service, repository } = createService();
    const queryBuilder = {
      leftJoin: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      getMany: jest.fn().mockResolvedValue([{ id: "p19" }]),
    };
    repository.createQueryBuilder.mockReturnValue(queryBuilder as any);
    jest
      .spyOn(service as any, "getWorkflowVisibleProjectIdsForUser")
      .mockResolvedValue(["p19"]);

    const result = await service.getVisibleProjectIdsForUser("approver-1", []);

    expect(result).toEqual(["p19"]);
    expect(queryBuilder.andWhere).toHaveBeenCalledWith(
      "(project.status NOT IN (:...creatorOnlyStatuses) OR project.creatorId = :operatorId OR project.createUser = :operatorName OR project.id IN (:...workflowVisibleProjectIds))",
      {
        creatorOnlyStatuses: ["1", "2"],
        operatorId: "approver-1",
        operatorName: "",
        workflowVisibleProjectIds: ["p19"],
      },
    );
  });

  it("草稿项目详情权限拒绝非发起人查看", async () => {
    const { service, repository } = createService();
    repository.findOne.mockResolvedValue({
      id: "p1",
      status: "1",
      creatorId: "creator-1",
      leaderId: "operator-1",
    });

    await expect(
      service.assertProjectPermission("p1", "operator-1", "view", [
        "business/projects/manageAll",
      ]),
    ).rejects.toThrow(new ForbiddenException("当前无该项目的操作权限"));
  });

  it("草稿项目详情查询拒绝非发起人直接读取", async () => {
    const { service, repository } = createService();
    repository.findOne.mockResolvedValue({
      id: "p1",
      status: "1",
      creatorId: "creator-1",
      createUser: "creator",
    });

    await expect(
      service.getOne({
        id: "p1",
        _operatorId: "operator-1",
        _operatorName: "operator",
      }),
    ).rejects.toThrow(new ForbiddenException("项目不存在或当前无访问权限"));
  });

  it("草稿项目详情权限允许按创建用户名识别发起人", async () => {
    const { service, repository } = createService();
    repository.findOne.mockResolvedValue({
      id: "p1",
      status: "1",
      creatorId: "",
      createUser: "zhangsan",
      leaderId: "operator-1",
    });

    const context = await service.assertProjectPermission(
      "p1",
      "operator-1",
      "view",
      ["business/projects/manageAll"],
      "zhangsan",
    );

    expect(context.canView).toBe(true);
  });

  it("项目管理全部权限应让列表行展示编辑删除等管理操作", async () => {
    const { service, repository } = createService();
    const queryBuilder = {
      leftJoinAndSelect: jest.fn().mockReturnThis(),
      leftJoin: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      take: jest.fn().mockReturnThis(),
      getManyAndCount: jest.fn().mockResolvedValue([
        [
          {
            id: "p1",
            name: "非成员草稿项目",
            creatorId: "creator-1",
            leaderId: "leader-1",
            status: "1",
          },
        ],
        1,
      ]),
    };
    repository.createQueryBuilder.mockReturnValue(queryBuilder as any);
    (service as any).projectMemberRepository.find.mockResolvedValue([]);

    const result = await service.list({
      pageNum: 1,
      pageSize: 10,
      _operatorId: "admin-1",
      _operatorPermissions: ["business/projects/manageAll"],
    } as any);

    expect(result.list[0].permissionContext).toEqual(
      expect.objectContaining({
        canViewAll: true,
        canManageAll: true,
        isManager: true,
        canView: true,
        canEdit: true,
        canSubmitApproval: true,
        canSubmitClose: true,
        canArchive: true,
        canDelete: true,
      }),
    );
    expect(queryBuilder.andWhere).not.toHaveBeenCalledWith(
      "(project.leaderId = :operatorId OR project.creatorId = :operatorId OR project.createUser = :operatorName OR projectMember.id IS NOT NULL)",
      expect.anything(),
    );
  });

  it("项目列表应返回当前用户是否为项目核心成员", async () => {
    const { service, repository } = createService();
    const queryBuilder = {
      leftJoinAndSelect: jest.fn().mockReturnThis(),
      leftJoin: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      take: jest.fn().mockReturnThis(),
      getManyAndCount: jest.fn().mockResolvedValue([
        [
          {
            id: "p1",
            name: "核心成员项目",
            creatorId: "creator-1",
            leaderId: "leader-1",
            status: "3",
          },
        ],
        1,
      ]),
    };
    repository.createQueryBuilder.mockReturnValue(queryBuilder as any);
    (service as any).projectMemberRepository.find.mockResolvedValue([
      {
        id: "m1",
        projectId: "p1",
        userId: "operator-1",
        role: "8",
        isCore: "1",
      },
    ]);

    const result = await service.list({
      pageNum: 1,
      pageSize: 10,
      _operatorId: "operator-1",
      _operatorPermissions: [],
    } as any);

    expect(result.list[0].permissionContext).toEqual(
      expect.objectContaining({
        isCore: true,
        canView: true,
      }),
    );
  });

  it("项目全量权限可以绕过项目编辑权限", async () => {
    const { service, repository } = createService();
    const assertProjectPermissionSpy = jest.spyOn(
      service,
      "assertProjectPermission",
    );
    repository.findOne.mockResolvedValue({
      id: "p1",
      status: "3",
      leaderId: "leader-1",
    });
    repository.update.mockResolvedValue({ affected: 1 });

    await expect(
      service.update({
        id: "p1",
        name: "已立项项目改名",
        _operatorId: "viewer-1",
        _operatorPermissions: ["business/projects/manageAll"],
      } as any),
    ).resolves.toBeUndefined();
    expect(assertProjectPermissionSpy).not.toHaveBeenCalled();
  });

  it("全量查看权限可以查看项目详情", async () => {
    const { service, repository } = createService();
    repository.findOne.mockResolvedValue({
      id: "p1",
      status: "3",
      leaderId: "leader-1",
    });
    (service as any).projectMemberRepository.findOne.mockResolvedValue(null);

    const context = await service.assertProjectPermission(
      "p1",
      "viewer-1",
      "view",
      ["business/projects/manageAll"],
    );

    expect(context.canView).toBe(true);
    expect(context.canViewAll).toBe(true);
    expect(context.canEdit).toBe(true);
    expect(context.canSubmitApproval).toBe(true);
  });

  it("立项审批未结束时当前待办审批人可以只读查看项目详情", async () => {
    const { service, repository } = createService();
    repository.findOne.mockResolvedValue({
      id: "p1",
      status: "1",
      workflowInstanceId: "inst-1",
      leaderId: "leader-1",
    });
    (service as any).projectMemberRepository.findOne.mockResolvedValue(null);
    (service as any).workflowTaskRepository.findOne.mockResolvedValue({
      id: "task-1",
    });

    const context = await service.assertProjectPermission(
      "p1",
      "approver-1",
      "view",
      [],
    );

    expect(context.canView).toBe(true);
    expect(context.canEdit).toBe(false);
    expect(context.canSubmitApproval).toBe(false);
  });

  it("立项审批未结束时历史审批人可以只读查看项目详情", async () => {
    const { service, repository } = createService();
    repository.findOne.mockResolvedValue({
      id: "p1",
      status: "2",
      workflowInstanceId: "inst-1",
      leaderId: "leader-1",
    });
    (service as any).projectMemberRepository.findOne.mockResolvedValue(null);
    (service as any).workflowTaskRepository.findOne.mockResolvedValue(null);
    (service as any).workflowHistoryRepository.findOne.mockResolvedValue({
      id: "history-1",
    });

    const context = await service.assertProjectPermission(
      "p1",
      "approver-1",
      "view",
      [],
    );

    expect(context.canView).toBe(true);
    expect(context.canEdit).toBe(false);
    expect(context.canSubmitApproval).toBe(false);
  });

  it("工作流审批人可以直接读取立项审批中的项目详情", async () => {
    const { service, repository } = createService();
    repository.findOne.mockResolvedValue({
      id: "p1",
      status: "2",
      workflowInstanceId: "inst-1",
      creatorId: "creator-1",
      createUser: "creator",
    });
    repository.update.mockResolvedValue({ affected: 1 });
    (service as any).projectMemberRepository.find.mockResolvedValue([]);
    (service as any).milestoneRepository.find.mockResolvedValue([]);
    (service as any).workflowTaskRepository.findOne.mockResolvedValue({
      id: "task-1",
    });
    jest.spyOn(service, "calculateProjectProgress").mockResolvedValue(0);

    const result = await service.getOne({
      id: "p1",
      _operatorId: "approver-1",
    } as any);

    expect(result).toEqual(expect.objectContaining({ id: "p1" }));
  });

  it("历史审批人应能在项目列表中看到项目", async () => {
    const { service, repository } = createService();
    const queryBuilder = {
      leftJoinAndSelect: jest.fn().mockReturnThis(),
      leftJoin: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      take: jest.fn().mockReturnThis(),
      getManyAndCount: jest.fn().mockResolvedValue([
        [
          {
            id: "p18",
            name: "已立项审批项目",
            creatorId: "1",
            leaderId: "1",
            status: "3",
            workflowInstanceId: "21",
          },
        ],
        1,
      ]),
    };
    repository.createQueryBuilder.mockReturnValue(queryBuilder as any);
    (service as any).projectMemberRepository.find.mockResolvedValue([]);
    jest
      .spyOn(service as any, "getWorkflowVisibleProjectIdsForUser")
      .mockResolvedValue(["p18"]);

    const result = await service.list({
      pageNum: 1,
      pageSize: 10,
      _operatorId: "2",
      _operatorPermissions: [],
    } as any);

    expect(result.list).toHaveLength(1);
    expect(result.list[0].id).toBe("p18");
    expect(queryBuilder.andWhere).toHaveBeenCalledWith(
      expect.stringContaining("project.id IN"),
      expect.objectContaining({
        workflowVisibleProjectIds: ["p18"],
      }),
    );
  });

  it("驾驶舱应使用项目列表返回的 list 字段生成项目选项", async () => {
    const { service } = createService();
    jest.spyOn(service, "list").mockResolvedValue({
      list: [
        {
          id: "p1",
          name: "项目A",
          leader: { id: "u1", name: "admin" },
          status: "2",
          priority: "1",
          progress: 60,
          category: "交付",
          riskLevel: "low",
          qualityLevel: "high",
          currency: "CNY",
          spentHours: 12,
          budget: 100,
          actualCost: 80,
        },
      ],
      total: 1,
    } as any);
    jest.spyOn(service, "getDashboard").mockResolvedValue({
      summary: {
        healthSummary: { totalScore: 88, level: "healthy", levelLabel: "健康" },
        knowledgeSummary: { recentUpdatedCount: 1 },
      },
      focus: { alerts: [] },
    } as any);
    jest.spyOn(service as any, "getProjectTrend").mockResolvedValue({
      dates: [],
      healthScores: [],
      riskCounts: [],
      knowledgeUpdateCounts: [],
      costVariances: [],
    });

    const result = await service.getCockpit({
      pageNum: 1,
      pageSize: 20,
    } as any);

    expect(result.projectOptions).toEqual([
      expect.objectContaining({
        id: "p1",
        name: "项目A",
      }),
    ]);
    expect(result.selectedProjectId).toBe("p1");
  });

  it("驾驶舱系统总览不应默认混入具体项目详情", async () => {
    const { service } = createService();
    jest.spyOn(service, "list").mockResolvedValue({
      list: [
        {
          id: "p1",
          name: "项目A",
          leader: { id: "u1", name: "admin" },
          status: "2",
          priority: "1",
          progress: 60,
          category: "交付",
          riskLevel: "low",
          qualityLevel: "high",
          currency: "CNY",
          spentHours: 12,
          budget: 100,
          actualCost: 80,
        },
      ],
      total: 1,
    } as any);
    const getDashboardSpy = jest.spyOn(service, "getDashboard");
    getDashboardSpy.mockResolvedValue({
      summary: {
        healthSummary: { totalScore: 88, level: "healthy", levelLabel: "健康" },
        knowledgeSummary: { recentUpdatedCount: 1 },
      },
      focus: { alerts: [] },
    } as any);

    const result = await service.getCockpitOverview({
      pageNum: 1,
      pageSize: 20,
    } as any);

    expect(result.projectOptions).toEqual([
      expect.objectContaining({ id: "p1", name: "项目A" }),
    ]);
    expect(result).not.toHaveProperty("selectedProject");
    expect(result).not.toHaveProperty("selectedTrend");
    expect(result).not.toHaveProperty("selectedProjectId");
    expect(getDashboardSpy).toHaveBeenCalledTimes(1);
  });

  it("单项目驾驶舱只返回指定项目的详情与趋势", async () => {
    const { service } = createService();
    jest.spyOn(service, "getDashboard").mockResolvedValue({
      project: { id: "p1", name: "项目A" },
      summary: { taskSummary: { total: 3 } },
      focus: { alerts: [] },
    } as any);
    jest.spyOn(service as any, "getProjectTrend").mockResolvedValue({
      dates: ["2026-05-14"],
      healthScores: [90],
      riskCounts: [1],
      knowledgeUpdateCounts: [2],
      costVariances: [0],
    });

    const result = await service.getProjectCockpit("p1");

    expect(result.project).toEqual({ id: "p1", name: "项目A" });
    expect(result.trend).toEqual(
      expect.objectContaining({
        dates: ["2026-05-14"],
        healthScores: [90],
      }),
    );
  });

  it("自动生成里程碑缺少负责人时应默认回填项目负责人和操作人", async () => {
    const { service } = createService();
    const milestoneRepository = {
      find: jest.fn().mockResolvedValue([]),
      update: jest.fn(),
      save: jest.fn(),
    };
    (service as any).repository.findOne = jest.fn().mockResolvedValue({
      id: "p1",
      leaderId: "leader-1",
    });

    await (service as any).syncMilestones(
      "p1",
      [
        {
          name: "项目启动",
        },
      ],
      milestoneRepository as any,
      "operator-1",
    );

    expect(milestoneRepository.save).toHaveBeenCalledWith(
      expect.objectContaining({
        ownerId: "leader-1",
        creatorId: "operator-1",
      }),
    );
  });

  it("项目查看上下文返回项目、字段权限、审批上下文和默认当前审批", async () => {
    const { service } = createService();
    const project = { id: "19", status: "2", name: "项目A" };
    const fieldPermissions = { projectBasic: { visible: true } };
    const approvalContexts = [
      {
        id: "ctx-running",
        workflowInstanceId: "wf-running",
        businessScene: "closure",
        status: "1",
        startedAt: "2026-05-15 11:00:00",
      },
      {
        id: "ctx-done",
        workflowInstanceId: "wf-done",
        businessScene: "initiation",
        status: "2",
        startedAt: "2026-05-15 10:00:00",
      },
    ];
    jest
      .spyOn(service, "assertProjectPermission")
      .mockResolvedValue({ role: "visitor", canView: true } as any);
    jest.spyOn(service, "getOne").mockResolvedValue(project as any);
    (service as any).projectFieldPermissionService = {
      getProjectFieldPermissions: jest.fn().mockReturnValue(fieldPermissions),
    };
    (service as any).businessApprovalContextService = {
      findByRootBusiness: jest.fn().mockResolvedValue(approvalContexts),
    };

    const result = await service.getProjectViewContext("19", {
      operatorId: "u1",
      operatorName: "李四",
      permissions: ["business/projects/access"],
    });

    expect(result).toEqual({
      project,
      fieldPermissions,
      approvalContexts,
      currentApprovalContext: approvalContexts[0],
      permissionContext: { role: "visitor", canView: true },
    });
  });

  it("项目查看上下文优先选择传入流程实例对应的审批上下文", async () => {
    const { service } = createService();
    const approvalContexts = [
      {
        id: "ctx-running",
        workflowInstanceId: "wf-running",
        status: "1",
        startedAt: "2026-05-15 11:00:00",
      },
      {
        id: "ctx-target",
        workflowInstanceId: "wf-target",
        status: "2",
        startedAt: "2026-05-15 10:00:00",
      },
    ];
    jest
      .spyOn(service, "assertProjectPermission")
      .mockResolvedValue({ role: "visitor", canView: true } as any);
    jest.spyOn(service, "getOne").mockResolvedValue({ id: "19" } as any);
    (service as any).projectFieldPermissionService = {
      getProjectFieldPermissions: jest.fn().mockReturnValue({}),
    };
    (service as any).businessApprovalContextService = {
      findByRootBusiness: jest.fn().mockResolvedValue(approvalContexts),
    };

    const result = await service.getProjectViewContext("19", {
      operatorId: "u1",
      operatorName: "李四",
      permissions: ["business/projects/access"],
      instanceId: "wf-target",
    });

    expect(result.currentApprovalContext).toBe(approvalContexts[1]);
  });
});
