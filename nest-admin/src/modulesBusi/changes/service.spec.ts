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
});
