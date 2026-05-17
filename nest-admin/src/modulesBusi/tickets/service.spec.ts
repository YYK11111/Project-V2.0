import { TicketsService } from "./service";

describe("TicketsService convert to task", () => {
  it("基础访问权限允许查看本人相关工单", async () => {
    const projectsService = {
      getVisibleProjectIdsForUser: jest.fn().mockResolvedValue([]),
      getProjectPermissionContext: jest.fn(async () => ({
        isManager: false,
        isDeliveryManager: false,
        isFunctionalLead: false,
      })),
    };
    const service = new TicketsService(
      {} as any,
      {} as any,
      {} as any,
      projectsService as any,
      {} as any,
    );
    jest.spyOn(service as any, "listBy").mockResolvedValue({
      data: [
        {
          id: "ticket-1",
          projectId: "project-1",
          handlerId: "user-1",
          submitterId: "submitter-1",
          createUser: "creator-1",
        },
      ],
      total: 1,
    });

    const result = await service.list({
      pageNum: 1,
      pageSize: 10,
      _operatorId: "user-1",
      _operatorPermissions: ["business/tickets/access"],
    } as any);

    expect(result.total).toBe(1);
    expect((service as any).listBy).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.arrayContaining([
          expect.objectContaining({ handlerId: "user-1" }),
          expect.objectContaining({ submitterId: "user-1" }),
          expect.objectContaining({ createUser: "user-1" }),
        ]),
      }),
      expect.any(Object),
    );
  });

  it("基础访问权限允许查看本人相关工单详情", async () => {
    const projectsService = {
      assertExecutionObjectPermission: jest
        .fn()
        .mockRejectedValue(new Error("当前无访问权限")),
      getProjectPermissionContext: jest.fn(async () => null),
    };
    const repository = {
      findOne: jest.fn().mockResolvedValue({
        id: "ticket-1",
        projectId: "project-1",
        handlerId: "user-1",
        submitterId: "submitter-1",
        createUser: "creator-1",
      }),
    };
    const service = new TicketsService(
      repository as any,
      {} as any,
      {} as any,
      projectsService as any,
      {} as any,
    );

    const result = await service.getOne({
      id: "ticket-1",
      _operatorId: "user-1",
      _operatorPermissions: ["business/tickets/access"],
    } as any);

    expect(result).toEqual(expect.objectContaining({ id: "ticket-1" }));
  });

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
      data: [
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
      permissions: ["business/tasks/add"],
    });

    expect(tasksService.add).toHaveBeenCalledWith(
      expect.objectContaining({
        projectId: "p1",
        sourceType: "ticket",
        sourceId: "tk1",
        _operatorPermissions: ["business/tasks/add"],
      }),
    );
    expect(result.taskId).toBe("t2");
  });

  it("分派工单后应进入处理中并记录动作日志", async () => {
    const repository = {
      findOne: jest.fn().mockResolvedValue({
        id: "ticket-1",
        projectId: "project-1",
        status: "1",
        handlerId: null,
        submitterId: "submitter-1",
        createUser: "creator-1",
      }),
      update: jest.fn().mockResolvedValue({}),
    };
    const actionLogRepository = {
      save: jest.fn().mockResolvedValue({ id: "log-1" }),
    };
    const projectsService = {
      assertExecutionObjectPermission: jest.fn().mockResolvedValue(true),
      getProjectPermissionContext: jest.fn().mockResolvedValue({
        canManageTasks: true,
        isManager: true,
        isDeliveryManager: false,
        isFunctionalLead: false,
      }),
    };
    const service = new TicketsService(
      repository as any,
      {} as any,
      {} as any,
      projectsService as any,
      {} as any,
      actionLogRepository as any,
    );

    await (service as any).dispatchTicket(
      "ticket-1",
      {
        id: "admin-1",
        name: "管理员",
        permissions: ["business/tickets/update"],
      },
      {
        handlerId: "handler-2",
      },
    );

    expect(repository.update).toHaveBeenCalledWith(
      "ticket-1",
      expect.objectContaining({
        handlerId: "handler-2",
        status: "2",
      }),
    );
    expect(actionLogRepository.save).toHaveBeenCalledWith(
      expect.objectContaining({
        ticketId: "ticket-1",
        actionType: "dispatch",
      }),
    );
  });

  it("提交待验证后应把工单状态流转为待验证", async () => {
    const repository = {
      findOne: jest.fn().mockResolvedValue({
        id: "ticket-1",
        projectId: "project-1",
        status: "2",
        handlerId: "handler-1",
        submitterId: "submitter-1",
        createUser: "creator-1",
      }),
      update: jest.fn().mockResolvedValue({}),
    };
    const actionLogRepository = {
      save: jest.fn().mockResolvedValue({ id: "log-1" }),
    };
    const service = new TicketsService(
      repository as any,
      {} as any,
      {} as any,
      {
        assertExecutionObjectPermission: jest.fn().mockResolvedValue(true),
        getProjectPermissionContext: jest.fn().mockResolvedValue({
          canManageTasks: true,
          isManager: true,
          isDeliveryManager: false,
          isFunctionalLead: false,
        }),
      } as any,
      {} as any,
      actionLogRepository as any,
    );

    await (service as any).submitForVerification("ticket-1", {
      id: "handler-1",
      name: "处理人",
      permissions: ["business/tickets/update"],
    });

    expect(repository.update).toHaveBeenCalledWith(
      "ticket-1",
      expect.objectContaining({
        status: "3",
      }),
    );
    expect(actionLogRepository.save).toHaveBeenCalledWith(
      expect.objectContaining({
        ticketId: "ticket-1",
        actionType: "finish",
      }),
    );
  });

  it("验证通过后应把工单状态流转为已关闭，验证退回应回到处理中", async () => {
    const repository = {
      findOne: jest.fn().mockResolvedValue({
        id: "ticket-1",
        projectId: "project-1",
        status: "3",
        handlerId: "handler-1",
        submitterId: "submitter-1",
        createUser: "creator-1",
      }),
      update: jest.fn().mockResolvedValue({}),
    };
    const actionLogRepository = {
      save: jest.fn().mockResolvedValue({ id: "log-1" }),
    };
    const service = new TicketsService(
      repository as any,
      {} as any,
      {} as any,
      {
        assertExecutionObjectPermission: jest.fn().mockResolvedValue(true),
        getProjectPermissionContext: jest.fn().mockResolvedValue({
          canManageTasks: true,
          isManager: true,
          isDeliveryManager: false,
          isFunctionalLead: false,
        }),
      } as any,
      {} as any,
      actionLogRepository as any,
    );

    await (service as any).verifyTicket("ticket-1", {
      passed: true,
      id: "submitter-1",
      name: "提交人",
      permissions: ["business/tickets/update"],
    });

    expect(repository.update).toHaveBeenCalledWith(
      "ticket-1",
      expect.objectContaining({
        status: "4",
      }),
    );

    await (service as any).rejectVerification("ticket-1", {
      reason: "还要补充截图",
      id: "submitter-1",
      name: "提交人",
      permissions: ["business/tickets/update"],
    });

    expect(repository.update).toHaveBeenCalledWith(
      "ticket-1",
      expect.objectContaining({
        status: "2",
      }),
    );
  });

  it("已关闭工单重开后应回到处理中并累加重开次数", async () => {
    const repository = {
      findOne: jest.fn().mockResolvedValue({
        id: "ticket-1",
        projectId: "project-1",
        status: "4",
        reopenedCount: 1,
        handlerId: "handler-1",
        submitterId: "submitter-1",
        createUser: "creator-1",
      }),
      update: jest.fn().mockResolvedValue({}),
    };
    const actionLogRepository = {
      save: jest.fn().mockResolvedValue({ id: "log-1" }),
    };
    const service = new TicketsService(
      repository as any,
      {} as any,
      {} as any,
      {
        assertExecutionObjectPermission: jest.fn().mockResolvedValue(true),
        getProjectPermissionContext: jest.fn().mockResolvedValue({
          canManageTasks: true,
          isManager: true,
          isDeliveryManager: false,
          isFunctionalLead: false,
        }),
      } as any,
      {} as any,
      actionLogRepository as any,
    );

    await (service as any).reopenTicket("ticket-1", {
      id: "submitter-1",
      name: "提交人",
      permissions: ["business/tickets/update"],
    });

    expect(repository.update).toHaveBeenCalledWith(
      "ticket-1",
      expect.objectContaining({
        status: "2",
        reopenedCount: 2,
      }),
    );
  });

  it("批量分派应返回成功和失败明细", async () => {
    const repository = {
      findOne: jest
        .fn()
        .mockResolvedValueOnce({
          id: "ticket-1",
          projectId: "project-1",
          status: "1",
          handlerId: null,
          submitterId: "submitter-1",
          createUser: "creator-1",
        })
        .mockResolvedValueOnce({
          id: "ticket-2",
          projectId: "project-1",
          status: "2",
          handlerId: "handler-1",
          submitterId: "submitter-1",
          createUser: "creator-1",
        }),
      update: jest.fn().mockResolvedValue({}),
    };
    const actionLogRepository = {
      save: jest.fn().mockResolvedValue({ id: "log-1" }),
    };
    const service = new TicketsService(
      repository as any,
      {} as any,
      {} as any,
      {
        assertExecutionObjectPermission: jest.fn().mockResolvedValue(true),
        getProjectPermissionContext: jest.fn().mockResolvedValue({
          canManageTasks: true,
          isManager: true,
          isDeliveryManager: false,
          isFunctionalLead: false,
        }),
      } as any,
      {} as any,
      actionLogRepository as any,
    );

    const result = await (service as any).batchDispatchTickets(
      ["ticket-1", "ticket-2"],
      {
        id: "admin-1",
        name: "管理员",
        permissions: ["business/tickets/update"],
      },
      {
        handlerId: "handler-2",
      },
    );

    expect(result).toEqual(
      expect.objectContaining({
        successCount: 1,
        failedCount: 1,
        successIds: ["ticket-1"],
      }),
    );
    expect(result.failed[0]).toEqual(
      expect.objectContaining({
        id: "ticket-2",
      }),
    );
  });
});
