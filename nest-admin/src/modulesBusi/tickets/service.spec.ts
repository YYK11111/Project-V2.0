import { TicketsService } from "./service";

describe("TicketsService convert to task", () => {
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

  it("将工单审批中状态映射为统一审批视图", () => {
    const repository = { findOne: jest.fn(), update: jest.fn() };
    const service = new TicketsService(
      repository as any,
      {} as any,
      {} as any,
      {
        getProjectPermissionContext: jest.fn(),
        buildApprovalViewModel: jest.fn((entity) => ({
          status: String(entity?.approvalStatus || '0') === '1' ? 'pending' : String(entity?.approvalStatus || '0') === '3' && String(entity?.currentNodeName || '').includes('退回发起人') ? 'returned' : String(entity?.approvalStatus || '0') === '2' ? 'approved' : String(entity?.approvalStatus || '0') === '3' ? 'rejected' : 'none',
          label: String(entity?.approvalStatus || '0') === '1' ? '审批中' : String(entity?.approvalStatus || '0') === '3' && String(entity?.currentNodeName || '').includes('退回发起人') ? '已退回发起人' : String(entity?.approvalStatus || '0') === '2' ? '已通过' : String(entity?.approvalStatus || '0') === '3' ? '已驳回' : '无需审批',
          currentNodeName: String(entity?.currentNodeName || ''),
          canSubmit: String(entity?.approvalStatus || '0') === '0',
          canResubmit: String(entity?.approvalStatus || '0') === '3',
        })),
      } as any,
      { add: jest.fn() } as any,
    );

    const result = (service as any).projectsService.buildApprovalViewModel({
      approvalStatus: "1",
      currentNodeName: "工单审批中",
    });

    expect(result).toEqual({
      status: "pending",
      label: "审批中",
      currentNodeName: "工单审批中",
      canSubmit: false,
      canResubmit: false,
    });
  });

  it("将工单退回发起人状态映射为统一审批视图", () => {
    const repository = { findOne: jest.fn(), update: jest.fn() };
    const service = new TicketsService(
      repository as any,
      {} as any,
      {} as any,
      {
        getProjectPermissionContext: jest.fn(),
        buildApprovalViewModel: jest.fn((entity) => ({
          status: String(entity?.approvalStatus || '0') === '1' ? 'pending' : String(entity?.approvalStatus || '0') === '3' && String(entity?.currentNodeName || '').includes('退回发起人') ? 'returned' : String(entity?.approvalStatus || '0') === '2' ? 'approved' : String(entity?.approvalStatus || '0') === '3' ? 'rejected' : 'none',
          label: String(entity?.approvalStatus || '0') === '1' ? '审批中' : String(entity?.approvalStatus || '0') === '3' && String(entity?.currentNodeName || '').includes('退回发起人') ? '已退回发起人' : String(entity?.approvalStatus || '0') === '2' ? '已通过' : String(entity?.approvalStatus || '0') === '3' ? '已驳回' : '无需审批',
          currentNodeName: String(entity?.currentNodeName || ''),
          canSubmit: String(entity?.approvalStatus || '0') === '0',
          canResubmit: String(entity?.approvalStatus || '0') === '3',
        })),
      } as any,
      { add: jest.fn() } as any,
    );

    const result = (service as any).projectsService.buildApprovalViewModel({
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

  it("返回工单对象权限上下文", async () => {
    const repository = { findOne: jest.fn(), update: jest.fn() };
    const projectsService = {
      getProjectPermissionContext: jest.fn().mockResolvedValue({
        isManager: false,
        isDeliveryManager: true,
        isFunctionalLead: false,
      }),
    };
    const service = new TicketsService(
      repository as any,
      {} as any,
      {} as any,
      projectsService as any,
      { add: jest.fn() } as any,
    );

    const result = await (service as any).getTicketPermissions(
      {
        projectId: "p1",
        handlerId: "u2",
        submitterId: "u3",
        createUser: "creator-1",
      },
      "u1",
    );

    expect(result).toEqual(
      expect.objectContaining({
        canEdit: true,
        canDelete: true,
        permissionContext: expect.objectContaining({
          canEdit: true,
          canDelete: true,
        }),
      }),
    );
  });
});
