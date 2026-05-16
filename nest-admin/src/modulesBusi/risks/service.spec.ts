import { RisksService } from "./service";

describe("RisksService convert to task", () => {
  it("基础访问权限允许查看本人相关风险", async () => {
    const projectsService = {
      getVisibleProjectIdsForUser: jest.fn().mockResolvedValue([]),
      getProjectPermissionContext: jest.fn(async () => ({
        isManager: false,
        isDeliveryManager: false,
        isFunctionalLead: false,
      })),
    };
    const service = new RisksService(
      {} as any,
      {} as any,
      {} as any,
      projectsService as any,
      {} as any,
    );
    jest.spyOn(service as any, "listBy").mockResolvedValue({
      data: [
        {
          id: "risk-1",
          projectId: "project-1",
          riskOwnerId: "user-1",
          createUser: "creator-1",
        },
      ],
      total: 1,
    });

    const result = await service.list({
      pageNum: 1,
      pageSize: 10,
      _operatorId: "user-1",
      _operatorPermissions: ["business/risks/access"],
    } as any);

    expect(result.total).toBe(1);
    expect((service as any).listBy).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.arrayContaining([
          expect.objectContaining({ riskOwnerId: "user-1" }),
          expect.objectContaining({ createUser: "user-1" }),
        ]),
      }),
      expect.any(Object),
    );
  });

  it("基础访问权限允许查看本人相关风险详情", async () => {
    const projectsService = {
      assertExecutionObjectPermission: jest
        .fn()
        .mockRejectedValue(new Error("当前无访问权限")),
      getProjectPermissionContext: jest.fn(async () => null),
    };
    const repository = {
      findOne: jest.fn().mockResolvedValue({
        id: "risk-1",
        projectId: "project-1",
        riskOwnerId: "user-1",
        createUser: "creator-1",
      }),
    };
    const service = new RisksService(
      repository as any,
      {} as any,
      { findOne: jest.fn() } as any,
      projectsService as any,
      {} as any,
    );

    const result = await service.getOne({
      id: "risk-1",
      _operatorId: "user-1",
      _operatorPermissions: ["business/risks/access"],
    } as any);

    expect(result).toEqual(expect.objectContaining({ id: "risk-1" }));
  });

  it("风险全量管理权限在列表行上返回可操作权限", async () => {
    const projectsService = {
      getVisibleProjectIdsForUser: jest.fn().mockResolvedValue(null),
      getProjectPermissionContext: jest.fn(
        async (_projectId, _operatorId, permissions = []) => ({
          isManager: permissions.includes("business/projects/manageAll"),
          isDeliveryManager: false,
          isFunctionalLead: false,
        }),
      ),
    };
    const service = new RisksService(
      {} as any,
      {} as any,
      {} as any,
      projectsService as any,
      {} as any,
    );
    jest.spyOn(service as any, "listBy").mockResolvedValue({
      data: [
        {
          id: "risk-1",
          projectId: "project-1",
          riskOwnerId: "owner-1",
          createUser: "creator-1",
        },
      ],
      total: 1,
    });

    const result = await service.list({
      pageNum: 1,
      pageSize: 10,
      _operatorId: "admin-1",
      _operatorPermissions: ["business/risks/manageAll"],
    } as any);

    expect(result.data[0]).toEqual(
      expect.objectContaining({
        canEdit: true,
        canDelete: true,
      }),
    );
    expect(projectsService.getProjectPermissionContext).toHaveBeenCalledWith(
      "project-1",
      "admin-1",
      expect.arrayContaining(["business/projects/manageAll"]),
    );
  });

  it("可将风险转换为任务并写入来源字段", async () => {
    const repository = { findOne: jest.fn(), update: jest.fn() };
    const tasksService = {
      add: jest
        .fn()
        .mockResolvedValue({ id: "t1", name: "风险应对：接口性能风险" }),
    };
    const service = new RisksService(
      repository as any,
      {} as any,
      {} as any,
      {} as any,
      tasksService as any,
    );

    jest.spyOn(service, "getOne").mockResolvedValue({
      id: "r1",
      name: "接口性能风险",
      projectId: "p1",
      description: "性能存在不确定性",
      mitigation: "压测并优化",
      riskOwnerId: "u1",
      dueDate: "2026-05-01",
    } as any);

    const result = await service.convertToTask("r1", {
      id: "u1",
      name: "tester",
      permissions: ["business/tasks/add"],
    });

    expect(tasksService.add).toHaveBeenCalledWith(
      expect.objectContaining({
        projectId: "p1",
        sourceType: "risk",
        sourceId: "r1",
        _operatorPermissions: ["business/tasks/add"],
      }),
    );
    expect(result.taskId).toBe("t1");
  });
});
