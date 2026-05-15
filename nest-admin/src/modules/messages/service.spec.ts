import { MessagesService } from "./service";
import { MessageType } from "./entity";

describe("MessagesService 外部通知", () => {
  const createService = () => {
    const repository = {
      save: jest.fn(async (data) => ({ ...data, id: "msg-1" })),
    };
    const externalNotifyService = {
      sendToUser: jest.fn().mockResolvedValue(undefined),
    };
    const service = new MessagesService(
      repository as any,
      {} as any,
      {} as any,
      {} as any,
      externalNotifyService as any,
    );
    return { service, repository, externalNotifyService };
  };

  it("创建工作流待办站内信后触发外部通知", async () => {
    const { service, externalNotifyService } = createService();

    await service.sendMessage({
      title: "审批待办",
      content: "您有一个新的审批任务",
      messageType: MessageType.todo,
      sourceType: "workflow_task",
      sourceId: "task-1",
      receiverId: "u1",
      linkUrl: "/projectManage/approval",
      linkParams: { id: "19", taskId: "task-1" },
    });
    await Promise.resolve();

    expect(externalNotifyService.sendToUser).toHaveBeenCalledWith(
      "u1",
      expect.objectContaining({
        messageId: "msg-1",
        receiverId: "u1",
        templateKey: "workflowTodo",
        sourceType: "workflow_task",
        sourceId: "task-1",
      }),
    );
  });

  it("外部通知失败不影响站内信创建", async () => {
    const { service, externalNotifyService } = createService();
    externalNotifyService.sendToUser.mockRejectedValue(new Error("飞书失败"));

    await expect(
      service.sendMessage({
        title: "审批待办",
        content: "您有一个新的审批任务",
        messageType: MessageType.todo,
        sourceType: "workflow_task",
        sourceId: "task-1",
        receiverId: "u1",
      }),
    ).resolves.toEqual(expect.objectContaining({ id: "msg-1" }));
  });

  it("非工作流待办不触发外部通知", async () => {
    const { service, externalNotifyService } = createService();

    await service.sendMessage({
      title: "普通待阅",
      content: "请查看",
      messageType: MessageType.cc,
      sourceType: "project_alert",
      receiverId: "u1",
    });

    expect(externalNotifyService.sendToUser).not.toHaveBeenCalled();
  });
});
