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
});
