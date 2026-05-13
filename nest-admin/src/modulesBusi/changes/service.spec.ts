import { BadRequestException, ForbiddenException } from "@nestjs/common";
import { ChangesService } from "./service";
import { ChangeStatus } from "./entity";

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

  it("直接审批要求变更处于待审批状态", async () => {
    const repository = {
      findOne: jest.fn().mockResolvedValue({
        id: "c1",
        projectId: "p1",
        status: ChangeStatus.draft,
      }),
      update: jest.fn(),
    };
    const projectsService = {
      assertProjectPermission: jest.fn().mockResolvedValue({ isManager: true }),
    };
    const service = new ChangesService(
      repository as any,
      {} as any,
      {} as any,
      {} as any,
      {} as any,
      {} as any,
      {} as any,
      projectsService as any,
    );

    await expect(service.approve("c1", "u1", "同意")).rejects.toThrow(
      BadRequestException,
    );
    expect(repository.update).not.toHaveBeenCalled();
  });

  it("直接审批要求项目管理权限", async () => {
    const repository = {
      findOne: jest.fn().mockResolvedValue({
        id: "c1",
        projectId: "p1",
        status: ChangeStatus.pending,
      }),
      update: jest.fn(),
    };
    const projectsService = {
      assertProjectPermission: jest
        .fn()
        .mockResolvedValue({ isManager: false }),
    };
    const service = new ChangesService(
      repository as any,
      {} as any,
      {} as any,
      {} as any,
      {} as any,
      {} as any,
      {} as any,
      projectsService as any,
    );

    await expect(service.reject("c1", "u1", "拒绝")).rejects.toThrow(
      ForbiddenException,
    );
    expect(repository.update).not.toHaveBeenCalled();
  });

  it("全量管理权限允许直接审批", async () => {
    const repository = {
      findOne: jest.fn().mockResolvedValue({
        id: "c1",
        projectId: "p1",
        status: ChangeStatus.pending,
      }),
      update: jest.fn().mockResolvedValue({ affected: 1 }),
    };
    const projectsService = {
      assertProjectPermission: jest.fn().mockResolvedValue({
        isManager: false,
        isDeliveryManager: false,
        canManageAll: true,
      }),
    };
    const service = new ChangesService(
      repository as any,
      {} as any,
      {} as any,
      {} as any,
      {} as any,
      {} as any,
      {} as any,
      projectsService as any,
    );

    await service.approve("c1", "u1", "同意", ["business/projects/manageAll"]);

    expect(projectsService.assertProjectPermission).toHaveBeenCalledWith(
      "p1",
      "u1",
      "view",
      ["business/projects/manageAll"],
    );
    expect(repository.update).toHaveBeenCalledWith(
      "c1",
      expect.objectContaining({
        status: ChangeStatus.approved,
        approverId: "u1",
        approvalComment: "同意",
      }),
    );
  });

  it("项目经理允许直接审批", async () => {
    const repository = {
      findOne: jest.fn().mockResolvedValue({
        id: "c1",
        projectId: "p1",
        status: ChangeStatus.pending,
      }),
      update: jest.fn().mockResolvedValue({ affected: 1 }),
    };
    const projectsService = {
      assertProjectPermission: jest.fn().mockResolvedValue({
        isManager: true,
        isDeliveryManager: false,
        canManageAll: false,
      }),
    };
    const service = new ChangesService(
      repository as any,
      {} as any,
      {} as any,
      {} as any,
      {} as any,
      {} as any,
      {} as any,
      projectsService as any,
    );

    await service.approve("c1", "u1", "同意");

    expect(repository.update).toHaveBeenCalledWith(
      "c1",
      expect.objectContaining({
        status: ChangeStatus.approved,
        approverId: "u1",
        approvalComment: "同意",
      }),
    );
  });

  it("交付经理允许直接驳回", async () => {
    const repository = {
      findOne: jest.fn().mockResolvedValue({
        id: "c1",
        projectId: "p1",
        status: ChangeStatus.pending,
      }),
      update: jest.fn().mockResolvedValue({ affected: 1 }),
    };
    const projectsService = {
      assertProjectPermission: jest.fn().mockResolvedValue({
        isManager: false,
        isDeliveryManager: true,
        canManageAll: false,
      }),
    };
    const service = new ChangesService(
      repository as any,
      {} as any,
      {} as any,
      {} as any,
      {} as any,
      {} as any,
      {} as any,
      projectsService as any,
    );

    await service.reject("c1", "u1", "拒绝");

    expect(projectsService.assertProjectPermission).toHaveBeenCalledWith(
      "p1",
      "u1",
      "view",
      [],
    );
    expect(repository.update).toHaveBeenCalledWith(
      "c1",
      expect.objectContaining({
        status: ChangeStatus.rejected,
        approverId: "u1",
        approvalComment: "拒绝",
      }),
    );
  });
});
