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
});
