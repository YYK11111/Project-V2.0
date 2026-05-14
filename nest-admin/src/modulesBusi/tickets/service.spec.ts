import { TicketsService } from "./service";

describe("TicketsService convert to task", () => {
  it("工单全量管理权限在列表行上返回可操作权限", async () => {
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
    const service = new TicketsService(
      {} as any,
      {} as any,
      {} as any,
      projectsService as any,
      {} as any,
    );
    jest.spyOn(service as any, "listBy").mockResolvedValue({
      list: [
        {
          id: "ticket-1",
          projectId: "project-1",
          handlerId: "handler-1",
          submitterId: "submitter-1",
          createUser: "creator-1",
        },
      ],
      total: 1,
    });

    const result = await service.list({
      pageNum: 1,
      pageSize: 10,
      _operatorId: "admin-1",
      _operatorPermissions: ["business/tickets/manageAll"],
    } as any);

    expect(result.list[0]).toEqual(
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

  it("可将工单转换为任务并写入来源字段", async () => {
    const repository = { findOne: jest.fn(), update: jest.fn() };
    const tasksService = {
      add: jest
        .fn()
        .mockResolvedValue({ id: "t2", name: "工单处理：登录异常" }),
    };
    const service = new TicketsService(
      repository as any,
      {} as any,
      {} as any,
      {} as any,
      tasksService as any,
    );

    jest.spyOn(service, "getOne").mockResolvedValue({
      id: "tk1",
      title: "登录异常",
      projectId: "p1",
      content: "登录失败",
      stepsToReproduce: "输入账号密码",
      solution: "检查认证链路",
      handlerId: "u2",
      submitterId: "u3",
    } as any);

    const result = await service.convertToTask("tk1", {
      id: "u2",
      name: "tester",
    });

    expect(tasksService.add).toHaveBeenCalledWith(
      expect.objectContaining({
        projectId: "p1",
        sourceType: "ticket",
        sourceId: "tk1",
      }),
    );
    expect(result.taskId).toBe("t2");
  });
});
