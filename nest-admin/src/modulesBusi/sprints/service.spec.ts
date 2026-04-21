import { BadRequestException } from "@nestjs/common";
import { SprintsService } from "./service";

describe("SprintsService completeSprint guards", () => {
  it("未完成任务存在时不允许直接完成 Sprint", async () => {
    const repository = {
      findOne: jest.fn(),
      update: jest.fn(),
    };
    const taskRepository = {
      find: jest.fn().mockResolvedValue([
        { id: "t1", storyPoints: 3, status: "3" },
        { id: "t2", storyPoints: 5, status: "2" },
      ]),
    };

    const service = new SprintsService(
      repository as any,
      taskRepository as any,
    );
    jest
      .spyOn(service, "getOne")
      .mockResolvedValue({ id: "s1", status: "2" } as any);

    await expect(service.completeSprint("s1")).rejects.toThrow(
      new BadRequestException("Sprint 下仍有 1 个未完成任务，不能直接完成"),
    );
  });

  it("可将未完成任务结转到 backlog", async () => {
    const repository = {
      findOne: jest.fn(),
      update: jest.fn(),
    };
    const taskRepository = {
      find: jest.fn().mockResolvedValue([
        { id: "t1", storyPoints: 3, status: "3" },
        { id: "t2", storyPoints: 5, status: "2" },
      ]),
      update: jest.fn(),
    };

    const service = new SprintsService(
      repository as any,
      taskRepository as any,
    );
    jest
      .spyOn(service, "getOne")
      .mockResolvedValue({ id: "s1", status: "2" } as any);

    const result = await service.completeSprint("s1", {
      carryOverMode: "backlog",
    } as any);

    expect(taskRepository.update).toHaveBeenCalledWith("t2", {
      sprintId: null,
    });
    expect(result.carryOverCount).toBe(1);
  });
});
