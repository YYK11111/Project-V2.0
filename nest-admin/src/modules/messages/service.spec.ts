import { MessagesService } from "./service";
import { MessageType } from "./entity";

describe("MessagesService 外部通知", () => {
  const createService = (options: any = {}) => {
    const repository = {
      save: jest.fn(async (data) => ({ ...data, id: "msg-1" })),
      find: jest.fn().mockResolvedValue([]),
      update: jest.fn().mockResolvedValue({ affected: 1 }),
    };
    const systemConfigsService = {
      getExternalNotifyRuntimeConfig: jest.fn().mockResolvedValue(
        options.externalNotifyConfig || {
          enabled: true,
          feishu: {
            enabled: true,
            enabledScenes: ["workflow.approval.todo"],
          },
        },
      ),
    };
    const externalNotifyService = {
      sendToUser: jest.fn().mockResolvedValue(undefined),
      saveSystemMessageLog: jest.fn().mockResolvedValue(undefined),
      saveSkippedExternalNotificationLog: jest
        .fn()
        .mockResolvedValue(undefined),
      updateWorkflowTodoCardStatus: jest.fn().mockResolvedValue(undefined),
    };
    const service = new MessagesService(
      repository as any,
      {} as any,
      {} as any,
      systemConfigsService as any,
      externalNotifyService as any,
    );
    return { service, repository, systemConfigsService, externalNotifyService };
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
        notificationId: expect.stringMatching(/^ntf_/),
        receiverId: "u1",
        templateKey: "workflowTodo",
        sceneKey: "workflow.approval.todo",
        linkUrl: "/projectManage/approval",
        linkParams: { id: "19", taskId: "task-1" },
        extraData: {},
        sourceType: "workflow_task",
        sourceId: "task-1",
      }),
    );
    expect(externalNotifyService.saveSystemMessageLog).toHaveBeenCalledWith(
      expect.objectContaining({
        id: "msg-1",
        notificationId: expect.stringMatching(/^ntf_/),
        receiverId: "u1",
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
    expect(
      externalNotifyService.saveSkippedExternalNotificationLog,
    ).not.toHaveBeenCalled();
    expect(externalNotifyService.saveSystemMessageLog).toHaveBeenCalledWith(
      expect.objectContaining({
        id: "msg-1",
        notificationId: expect.stringMatching(/^ntf_/),
        messageType: MessageType.cc,
      }),
    );
  });

  it("场景启用时可以发送项目提醒到飞书", async () => {
    const { service, externalNotifyService } = createService({
      externalNotifyConfig: {
        enabled: true,
        feishu: {
          enabled: true,
          enabledScenes: ["workflow.approval.todo", "project.alert"],
        },
      },
    });

    await service.sendMessage({
      title: "项目提醒",
      content: "项目有异常提醒",
      messageType: MessageType.cc,
      sourceType: "project_alert",
      sourceId: "p1",
      receiverId: "u1",
    });
    await Promise.resolve();

    expect(externalNotifyService.sendToUser).toHaveBeenCalledWith(
      "u1",
      expect.objectContaining({
        messageId: "msg-1",
        sceneKey: "project.alert",
        sourceType: "project_alert",
        title: "项目提醒",
        templateKey: "feishuCard",
      }),
    );
    expect(
      externalNotifyService.saveSkippedExternalNotificationLog,
    ).not.toHaveBeenCalled();
  });

  it("停用工作流待办时触发外部卡片状态回写", async () => {
    const { service, repository, externalNotifyService } = createService();
    repository.find.mockResolvedValue([
      {
        id: "msg-1",
        receiverId: "u1",
        title: "待办审批：项目立项",
        content: "您有一个新的审批任务待处理。",
        sourceType: "workflow_task",
        sourceId: "task-1",
        messageType: MessageType.todo,
        linkUrl: "/projectManage/approval",
        linkParams: { id: "19", taskId: "task-1" },
        extraData: { businessLabel: "客户项目A" },
      },
    ]);

    await service.deactivateWorkflowTaskMessages("task-1", {
      status: "approved",
      statusText: "已同意",
    });

    expect(repository.update).toHaveBeenCalled();
    expect(
      externalNotifyService.updateWorkflowTodoCardStatus,
    ).toHaveBeenCalledWith(
      expect.objectContaining({
        status: "approved",
        statusText: "已同意",
        messages: [
          expect.objectContaining({
            id: "msg-1",
            sourceId: "task-1",
          }),
        ],
      }),
    );
  });

  it("清理过期已读和失效系统消息时不清理当前待办", async () => {
    const { service, repository } = createService();

    await service.cleanupExpiredMessages({ retentionDays: 180, limit: 1000 });

    expect(repository.update).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({
          isDelete: null,
        }),
      ]),
      expect.objectContaining({ isDelete: "1" }),
    );
  });

  it("清理项目提醒时写入 MySQL datetime 可接受的已读时间", async () => {
    const { service, repository } = createService();

    await service.clearProjectAlerts("u1");

    expect(repository.update).toHaveBeenCalledWith(
      expect.objectContaining({
        receiverId: "u1",
        sourceType: "project_alert",
        messageType: MessageType.cc,
      }),
      expect.objectContaining({
        readTime: expect.stringMatching(
          /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/,
        ),
      }),
    );
  });
});
