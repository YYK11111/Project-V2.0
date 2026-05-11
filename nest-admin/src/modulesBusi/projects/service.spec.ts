import { BadRequestException, ForbiddenException } from "@nestjs/common";
import { ProjectsService } from "./service";
import { ProjectStatus } from "./entity";

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
      { count: jest.fn() } as any,
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

  it("为草稿项目构建可提交立项审批的动作上下文", () => {
    const { service } = createService();

    const result = (service as any).buildProjectLifecycleContext(
      {
        id: "p1",
        status: ProjectStatus.draft,
        isArchived: "0",
      },
      {
        role: "1",
        canEdit: true,
        canSubmitApproval: true,
        canSubmitClose: true,
        canArchive: true,
        canDelete: true,
      },
    );

    expect(result.lifecycleContext).toEqual({
      status: ProjectStatus.draft,
      isArchived: false,
      isLifecycleLocked: false,
    });
    expect(result.actions).toEqual(
      expect.objectContaining({
        canEdit: true,
        canSubmitApproval: true,
        canSubmitClose: false,
        canArchive: false,
        canDelete: true,
      }),
    );
    expect(result.actions.reasons.submitClose).toBe("草稿项目未进入结项阶段");
    expect(result.actions.reasons.archive).toBe("项目未结项，不允许归档");
  });

  it("为已归档项目构建只读动作上下文", () => {
    const { service } = createService();

    const result = (service as any).buildProjectLifecycleContext(
      {
        id: "p1",
        status: ProjectStatus.completed,
        isArchived: "1",
      },
      {
        role: "1",
        canEdit: true,
        canSubmitApproval: true,
        canSubmitClose: true,
        canArchive: true,
        canDelete: true,
      },
    );

    expect(result.lifecycleContext).toEqual({
      status: ProjectStatus.completed,
      isArchived: true,
      isLifecycleLocked: true,
    });
    expect(result.actions).toEqual(
      expect.objectContaining({
        canEdit: false,
        canSubmitApproval: false,
        canSubmitClose: false,
        canArchive: false,
        canDelete: false,
      }),
    );
    expect(result.actions.reasons.edit).toBe("项目已归档，仅允许查看");
    expect(result.actions.reasons.archive).toBe("项目已归档，无需重复归档");
  });

  it("将项目审批状态映射为统一审批视图", () => {
    const { service } = createService();

    const result = (service as any).buildApprovalViewModel({
      approvalStatus: "3",
      currentNodeName: "退回发起人-补充资料",
    });

    expect(result).toEqual({
      status: "returned",
      label: "已退回发起人",
      currentNodeName: "退回发起人-补充资料",
      canSubmit: false,
      canResubmit: true,
    });
  });

  it("驾驶舱应使用项目列表返回的 list 字段生成项目选项", async () => {
    const { service } = createService();
    jest.spyOn(service, "list").mockResolvedValue({
      list: [
        {
          id: "p1",
          name: "项目A",
          leader: { id: "u1", name: "NestAdmin" },
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

  it("项目列表结果应携带生命周期动作与审批视图", async () => {
    const { service } = createService();
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
            leaderId: "u1",
            status: ProjectStatus.draft,
            approvalStatus: "0",
            currentNodeName: "",
            isArchived: "0",
          },
        ],
        1,
      ]),
    };
    (service as any).repository.createQueryBuilder.mockReturnValue(
      queryBuilder,
    );
    (service as any).projectMemberRepository = {
      find: jest.fn().mockResolvedValue([]),
    };

    const result = await service.list({
      pageNum: 1,
      pageSize: 10,
      _operatorId: "u1",
      _operatorPermissions: [],
    } as any);

    expect(result.list[0]).toEqual(
      expect.objectContaining({
        actions: expect.objectContaining({
          canEdit: true,
          canSubmitApproval: true,
        }),
        lifecycleContext: expect.objectContaining({
          status: ProjectStatus.draft,
          isArchived: false,
        }),
        approvalView: expect.objectContaining({
          status: "none",
          label: "无需审批",
        }),
      }),
    );
  });

  it("项目详情结果应携带审批视图", async () => {
    const { service } = createService();
    jest
      .spyOn(service as any, "calculateProjectProgress")
      .mockResolvedValue(30);
    (service as any).repository.findOne.mockResolvedValue({
      id: "p1",
      name: "项目A",
      status: ProjectStatus.executing,
      approvalStatus: "1",
      currentNodeName: "立项审批中",
      progress: 0,
      contractId: null,
      opportunityId: null,
    });
    (service as any).projectMemberRepository = {
      find: jest.fn().mockResolvedValue([]),
    };
    (service as any).milestoneRepository = {
      find: jest.fn().mockResolvedValue([]),
    };

    const result = await service.getOne({ id: "p1" });

    expect(result).toEqual(
      expect.objectContaining({
        approvalView: expect.objectContaining({
          status: "pending",
          label: "审批中",
        }),
      }),
    );
  });

  it("项目驾驶舱结果应返回统一权限上下文", async () => {
    const { service } = createService();
    jest.spyOn(service, "getOne").mockResolvedValue({
      id: "p1",
      name: "项目A",
      status: ProjectStatus.executing,
      approvalStatus: "1",
      currentNodeName: "立项审批中",
      isArchived: "0",
      progress: 30,
    } as any);
    jest.spyOn(service, "getProjectPermissionContext").mockResolvedValue({
      role: "1",
      isManager: true,
      isDeliveryManager: false,
      isFunctionalLead: false,
      isVisitor: false,
      canView: true,
      canEdit: true,
      canSubmitApproval: true,
      canSubmitClose: true,
      canArchive: true,
      canDelete: true,
    } as any);
    (
      service as any
    ).projectFieldPermissionService.getProjectFieldPermissions.mockResolvedValue(
      {
        groups: {
          projectBasic: "readonly",
        },
        fields: {
          name: "readonly",
        },
        contextRules: {
          lifecycleLocked: true,
        },
      },
    );
    jest.spyOn(service, "getStatistics").mockResolvedValue({});
    jest
      .spyOn(service, "getDashboard")
      .mockResolvedValue({ project: { id: "p1" } } as any);

    const permissionContext = await service.getProjectPermissionContext(
      "p1",
      "u1",
    );
    const fieldPermissions = await (
      service as any
    ).projectFieldPermissionService.getProjectFieldPermissions({
      project: await service.getOne({ id: "p1" }),
      rawRole: permissionContext.role,
      canVisit: true,
    });

    expect({
      ...permissionContext,
      fieldPermissions,
    }).toEqual(
      expect.objectContaining({
        canEdit: true,
        canSubmitClose: true,
        fieldPermissions: expect.objectContaining({
          groups: expect.objectContaining({
            projectBasic: "readonly",
          }),
          contextRules: expect.objectContaining({
            lifecycleLocked: true,
          }),
        }),
      }),
    );
  });
});
