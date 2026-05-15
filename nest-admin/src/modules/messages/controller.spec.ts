import { MessagesController } from "./controller";

describe("MessagesController", () => {
  it("读取未读角标前先同步工作流待办状态", async () => {
    const service = {
      ensureWorkflowTodoMessages: jest.fn().mockResolvedValue(undefined),
      getUnreadCount: jest.fn().mockResolvedValue({ todo: 0, cc: 0, total: 0 }),
    };
    const controller = new MessagesController(service as any);

    await expect(
      controller.unreadCount({ user: { id: "u1" } }),
    ).resolves.toEqual({ todo: 0, cc: 0, total: 0 });

    expect(service.ensureWorkflowTodoMessages).toHaveBeenCalledTimes(1);
    expect(service.getUnreadCount).toHaveBeenCalledWith("u1");
    expect(
      service.ensureWorkflowTodoMessages.mock.invocationCallOrder[0],
    ).toBeLessThan(service.getUnreadCount.mock.invocationCallOrder[0]);
  });
});
