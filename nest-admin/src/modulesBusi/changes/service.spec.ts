import { ChangesService } from "./service";

describe("ChangesService apply impact", () => {
  it("可将变更应用到任务计划日期", async () => {
    const repository = { update: jest.fn(), findOne: jest.fn() };
    const historyRepository = { save: jest.fn() };
    const taskRepository = { update: jest.fn() };
    const service = new ChangesService(
      repository as any,
      {} as any,
      historyRepository as any,
      {} as any,
      {} as any,
      {} as any,
      {} as any,
      {} as any,
    );

    (service as any).taskRepository = taskRepository;

    await service.applyPlanImpactTarget(
      "c1",
      "task",
      "t1",
      { plannedStartDate: "2026-04-22", plannedEndDate: "2026-04-28" },
      "u1",
      "调整计划",
      "tester",
    );

    expect(taskRepository.update).toHaveBeenCalledWith("t1", {
      plannedStartDate: "2026-04-22",
      plannedEndDate: "2026-04-28",
    });
    expect(historyRepository.save).toHaveBeenCalled();
  });

  it("可将变更应用到里程碑计划日期", async () => {
    const repository = { update: jest.fn(), findOne: jest.fn() };
    const historyRepository = { save: jest.fn() };
    const milestoneRepository = { update: jest.fn() };
    const service = new ChangesService(
      repository as any,
      {} as any,
      historyRepository as any,
      {} as any,
      {} as any,
      {} as any,
      {} as any,
      {} as any,
    );

    (service as any).milestoneRepository = milestoneRepository;

    await service.applyPlanImpactTarget(
      "c1",
      "milestone",
      "m1",
      { dueDate: "2026-05-02" },
      "u1",
      "调整里程碑",
      "tester",
    );

    expect(milestoneRepository.update).toHaveBeenCalledWith("m1", {
      dueDate: "2026-05-02",
      changeImpactFlag: "1",
    });
  });

  it("可将变更应用到 Sprint 计划日期", async () => {
    const repository = { update: jest.fn(), findOne: jest.fn() };
    const historyRepository = { save: jest.fn() };
    const sprintRepository = { update: jest.fn() };
    const service = new ChangesService(
      repository as any,
      {} as any,
      historyRepository as any,
      {} as any,
      {} as any,
      {} as any,
      {} as any,
      {} as any,
    );

    (service as any).sprintRepository = sprintRepository;

    await service.applyPlanImpactTarget(
      "c1",
      "sprint",
      "s1",
      { endDate: "2026-05-05" },
      "u1",
      "调整 Sprint",
      "tester",
    );

    expect(sprintRepository.update).toHaveBeenCalledWith("s1", {
      endDate: "2026-05-05",
      changeImpactFlag: "1",
    });
  });

  it("将变更审批中状态映射为统一审批视图", () => {
    const repository = { update: jest.fn(), findOne: jest.fn() };
    const service = new ChangesService(
      repository as any,
      {} as any,
      { save: jest.fn() } as any,
      {} as any,
      {} as any,
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
    );

    const result = (service as any).projectsService.buildApprovalViewModel({
      approvalStatus: "1",
      currentNodeName: "变更审批中",
    });

    expect(result).toEqual({
      status: "pending",
      label: "审批中",
      currentNodeName: "变更审批中",
      canSubmit: false,
      canResubmit: false,
    });
  });

  it("将变更退回发起人状态映射为统一审批视图", () => {
    const repository = { update: jest.fn(), findOne: jest.fn() };
    const service = new ChangesService(
      repository as any,
      {} as any,
      { save: jest.fn() } as any,
      {} as any,
      {} as any,
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
    );

    const result = (service as any).projectsService.buildApprovalViewModel({
      approvalStatus: "3",
      currentNodeName: "退回发起人-补充说明",
    });

    expect(result).toEqual({
      status: "returned",
      label: "已退回发起人",
      currentNodeName: "退回发起人-补充说明",
      canSubmit: false,
      canResubmit: true,
    });
  });

  it("返回变更对象权限上下文", async () => {
    const repository = { update: jest.fn(), findOne: jest.fn() };
    const projectsService = {
      getProjectPermissionContext: jest.fn().mockResolvedValue({
        isManager: false,
        isDeliveryManager: true,
        isFunctionalLead: false,
      }),
    };
    const service = new ChangesService(
      repository as any,
      {} as any,
      { save: jest.fn() } as any,
      {} as any,
      {} as any,
      {} as any,
      {} as any,
      projectsService as any,
    );

    const result = await (service as any).getChangePermissions(
      {
        projectId: "p1",
        requesterId: "u2",
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
