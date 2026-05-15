import { ExternalNotifyService } from "./service";
import { ExternalMessageSendStatus } from "./entity/external-message-log.entity";

describe("ExternalNotifyService", () => {
  const createService = (options: any = {}) => {
    const externalNotifyConfig = options.externalNotifyConfig || {
      enabled: true,
      feishu: {
        enabled: options.feishuEnabled ?? true,
        appId: "app_1",
        appSecret: "secret_1",
        baseUrl: "https://open.feishu.cn",
      },
      siteUrl: "https://admin.example.com",
      dingtalk: { enabled: false },
    };
    const externalAccountsService = {
      getActiveAccount: jest.fn().mockResolvedValue(options.account || null),
      upsertManualAccount: jest.fn(async (data) => data),
    };
    const systemConfigsService = {
      getExternalNotifyRuntimeConfig: jest
        .fn()
        .mockResolvedValue(externalNotifyConfig),
    };
    const logRepository = {
      save: jest.fn(async (data) => data),
      update: jest.fn().mockResolvedValue({ affected: 1 }),
      find: jest.fn().mockResolvedValue(options.logs || []),
    };
    const userRepository = {
      findOne: jest.fn().mockResolvedValue(options.user || null),
      find: jest.fn().mockResolvedValue(options.users || []),
    };
    const feishuProvider = {
      platform: "feishu",
      isEnabled: jest.fn(
        (config) =>
          config.enabled &&
          config.feishu?.enabled &&
          Boolean(config.feishu?.appId) &&
          Boolean(config.feishu?.appSecret),
      ),
      sendText: jest
        .fn()
        .mockResolvedValue(options.sendResponse || { code: 0 }),
      batchGetUserId: jest.fn().mockResolvedValue(options.feishuUsers || []),
      getUserDetail: jest
        .fn()
        .mockResolvedValue(options.feishuUserDetail || null),
      updateWorkflowTodoCard: jest.fn().mockResolvedValue({ code: 0 }),
    };
    const dingtalkProvider = {
      platform: "dingtalk",
      isEnabled: jest.fn(() => false),
      sendText: jest.fn(),
    };
    const service = new ExternalNotifyService(
      externalAccountsService as any,
      systemConfigsService as any,
      logRepository as any,
      userRepository as any,
      feishuProvider as any,
      dingtalkProvider as any,
    );
    return {
      service,
      externalAccountsService,
      systemConfigsService,
      logRepository,
      userRepository,
      feishuProvider,
      dingtalkProvider,
    };
  };

  it("用户绑定外部账号时发送启用平台消息并记录成功日志", async () => {
    const { service, feishuProvider, logRepository } = createService({
      account: { userId: "1", externalUserId: "ou_1" },
    });

    await service.sendToUser("1", {
      receiverId: "1",
      templateKey: "workflowTodo",
      title: "审批待办",
      content: "您有一个新的审批任务",
      messageId: "msg-1",
    });

    expect(feishuProvider.sendText).toHaveBeenCalledWith(
      expect.objectContaining({ externalUserId: "ou_1" }),
      expect.objectContaining({ title: "审批待办" }),
      expect.objectContaining({
        enabled: true,
        feishu: expect.objectContaining({ enabled: true }),
      }),
    );
    expect(logRepository.save).toHaveBeenCalledWith(
      expect.objectContaining({
        notificationId: expect.stringMatching(/^ntf_/),
        platform: "feishu",
        operationType: "send_card",
        messageId: "msg-1",
        externalUserId: "ou_1",
        sendStatus: ExternalMessageSendStatus.succeeded,
      }),
    );
  });

  it("飞书发送日志保存统一通知ID和飞书消息ID", async () => {
    const { service, logRepository } = createService({
      account: { userId: "1", externalUserId: "ou_1" },
      sendResponse: { code: 0, data: { message_id: "om_1" } },
    });

    await service.sendToUser("1", {
      notificationId: "ntf_1",
      receiverId: "1",
      templateKey: "workflowTodo",
      title: "审批待办",
      content: "您有一个新的审批任务",
      messageId: "msg-1",
    });

    expect(logRepository.save).toHaveBeenCalledWith(
      expect.objectContaining({
        notificationId: "ntf_1",
        platform: "feishu",
        operationType: "send_card",
        messageId: "msg-1",
        externalMessageId: "om_1",
        sendStatus: ExternalMessageSendStatus.succeeded,
      }),
    );
  });

  it("记录系统内消息投递日志", async () => {
    const { service, logRepository } = createService();

    await service.saveSystemMessageLog({
      id: "msg-1",
      notificationId: "ntf_1",
      receiverId: "u1",
      title: "普通待阅",
      content: "请查看",
      messageType: "cc",
      sourceType: "project_alert",
      sourceId: "p1",
    } as any);

    expect(logRepository.save).toHaveBeenCalledWith(
      expect.objectContaining({
        notificationId: "ntf_1",
        platform: "system",
        operationType: "create_message",
        messageId: "msg-1",
        receiverId: "u1",
        sendStatus: ExternalMessageSendStatus.succeeded,
      }),
    );
  });

  it("工作流待办发送前补全系统审批绝对链接", async () => {
    const { service, feishuProvider } = createService({
      account: { userId: "1", externalUserId: "ou_1" },
    });

    await service.sendToUser("1", {
      receiverId: "1",
      templateKey: "workflowTodo",
      title: "审批待办",
      content: "您有一个新的审批任务",
      linkUrl: "/projectManage/approval",
      linkParams: { id: "19", taskId: "task-1", fromWorkflow: "1" },
      messageId: "msg-1",
    });

    expect(feishuProvider.sendText).toHaveBeenCalledWith(
      expect.objectContaining({ externalUserId: "ou_1" }),
      expect.objectContaining({
        linkUrl:
          "https://admin.example.com/projectManage/approval?id=19&taskId=task-1&fromWorkflow=1",
      }),
      expect.objectContaining({
        enabled: true,
        siteUrl: "https://admin.example.com",
      }),
    );
  });

  it("用户未绑定时跳过发送并记录跳过日志", async () => {
    const { service, feishuProvider, logRepository } = createService();

    await service.sendToUser("1", {
      receiverId: "1",
      templateKey: "workflowTodo",
      title: "审批待办",
      content: "您有一个新的审批任务",
    });

    expect(feishuProvider.sendText).not.toHaveBeenCalled();
    expect(logRepository.save).toHaveBeenCalledWith(
      expect.objectContaining({
        platform: "feishu",
        sendStatus: ExternalMessageSendStatus.skipped,
        errorMessage: "用户未绑定外部平台账号",
      }),
    );
  });

  it("用户未绑定时先按邮箱或手机号自动同步飞书账号再发送", async () => {
    const {
      service,
      externalAccountsService,
      userRepository,
      feishuProvider,
      logRepository,
    } = createService({
      user: { id: "1", email: "u1@example.com", phone: "13800138000" },
      feishuUsers: [
        {
          user_id: "ou_1",
          open_id: "open_1",
          union_id: "union_1",
          email: "u1@example.com",
          mobile: "13800138000",
          name: "用户1",
        },
      ],
    });

    await service.sendToUser("1", {
      receiverId: "1",
      templateKey: "workflowTodo",
      title: "审批待办",
      content: "您有一个新的审批任务",
    });

    expect(userRepository.findOne).toHaveBeenCalledWith({
      where: { id: "1", isDelete: null },
    });
    expect(feishuProvider.batchGetUserId).toHaveBeenCalledWith(
      { emails: ["u1@example.com"], mobiles: ["13800138000"] },
      expect.objectContaining({ enabled: true }),
    );
    expect(externalAccountsService.upsertManualAccount).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: "1",
        platform: "feishu",
        externalUserId: "ou_1",
        bindSource: "sync",
      }),
    );
    expect(feishuProvider.sendText).toHaveBeenCalledWith(
      expect.objectContaining({ externalUserId: "ou_1" }),
      expect.objectContaining({ title: "审批待办" }),
      expect.objectContaining({ enabled: true }),
    );
    expect(logRepository.save).toHaveBeenCalledWith(
      expect.objectContaining({
        platform: "feishu",
        externalUserId: "ou_1",
        sendStatus: ExternalMessageSendStatus.succeeded,
      }),
    );
  });

  it("同步飞书账号时按 UserID 再获取 OpenID 和外部用户姓名", async () => {
    const { service, feishuProvider, externalAccountsService } = createService({
      user: { id: "1", email: "u1@example.com", phone: "13800138000" },
      feishuUsers: [
        {
          user_id: "ou_1",
          email: "u1@example.com",
          mobile: "13800138000",
        },
      ],
      feishuUserDetail: {
        user_id: "ou_1",
        open_id: "open_1",
        union_id: "union_1",
        name: "用户1",
        email: "u1@example.com",
        mobile: "13800138000",
      },
    });

    await service.syncFeishuAccount("1");

    expect(feishuProvider.getUserDetail).toHaveBeenCalledWith(
      "ou_1",
      expect.objectContaining({ enabled: true }),
    );
    expect(externalAccountsService.upsertManualAccount).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: "1",
        platform: "feishu",
        externalUserId: "ou_1",
        openId: "open_1",
        unionId: "union_1",
        name: "用户1",
        email: "u1@example.com",
        mobile: "13800138000",
        extraData: expect.objectContaining({
          user_id: "ou_1",
          open_id: "open_1",
        }),
      }),
    );
  });

  it("外部平台发送失败只记录失败日志", async () => {
    const { service, feishuProvider, logRepository } = createService({
      account: { userId: "1", externalUserId: "ou_1" },
    });
    feishuProvider.sendText.mockRejectedValue(new Error("飞书限流"));

    await service.sendToUser("1", {
      receiverId: "1",
      title: "审批待办",
      content: "您有一个新的审批任务",
    });

    expect(logRepository.save).toHaveBeenCalledWith(
      expect.objectContaining({
        sendStatus: ExternalMessageSendStatus.failed,
        errorMessage: "飞书限流",
      }),
    );
  });

  it("系统配置关闭外部通知时不查询账号也不发送", async () => {
    const { service, externalAccountsService, feishuProvider, logRepository } =
      createService({
        externalNotifyConfig: {
          enabled: false,
          feishu: { enabled: true, appId: "app_1", appSecret: "secret_1" },
        },
      });

    await service.sendToUser("1", {
      receiverId: "1",
      title: "审批待办",
      content: "您有一个新的审批任务",
    });

    expect(feishuProvider.isEnabled).toHaveBeenCalledWith(
      expect.objectContaining({ enabled: false }),
    );
    expect(externalAccountsService.getActiveAccount).not.toHaveBeenCalled();
    expect(feishuProvider.sendText).not.toHaveBeenCalled();
    expect(logRepository.save).not.toHaveBeenCalled();
  });

  it("飞书测试消息在未绑定时自动同步账号并返回发送结果", async () => {
    const { service, feishuProvider, logRepository } = createService({
      user: { id: "1", email: "u1@example.com", phone: "" },
      feishuUsers: [{ user_id: "ou_1", email: "u1@example.com" }],
    });

    await expect(service.sendFeishuTestMessage("1")).resolves.toEqual({
      success: true,
      externalUserId: "ou_1",
    });
    expect(feishuProvider.sendText).toHaveBeenCalledWith(
      expect.objectContaining({ externalUserId: "ou_1" }),
      expect.objectContaining({
        templateKey: "feishuTest",
        title: "飞书通知测试",
      }),
      expect.objectContaining({ enabled: true }),
    );
    expect(logRepository.save).toHaveBeenCalledWith(
      expect.objectContaining({
        platform: "feishu",
        externalUserId: "ou_1",
        sendStatus: ExternalMessageSendStatus.succeeded,
      }),
    );
  });

  it("飞书测试消息在已有旧映射时优先重新同步后发送", async () => {
    const { service, externalAccountsService, feishuProvider, logRepository } =
      createService({
        account: { userId: "1", externalUserId: "ou_old" },
        user: { id: "1", email: "u1@example.com", phone: "" },
        feishuUsers: [{ user_id: "ou_new", email: "u1@example.com" }],
      });

    await expect(service.sendFeishuTestMessage("1")).resolves.toEqual({
      success: true,
      externalUserId: "ou_new",
    });
    expect(externalAccountsService.upsertManualAccount).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: "1",
        platform: "feishu",
        externalUserId: "ou_new",
        bindSource: "sync",
      }),
    );
    expect(feishuProvider.sendText).toHaveBeenCalledWith(
      expect.objectContaining({ externalUserId: "ou_new" }),
      expect.objectContaining({
        templateKey: "feishuTest",
        title: "飞书通知测试",
      }),
      expect.objectContaining({ enabled: true }),
    );
    expect(logRepository.save).toHaveBeenCalledWith(
      expect.objectContaining({
        platform: "feishu",
        externalUserId: "ou_new",
        sendStatus: ExternalMessageSendStatus.succeeded,
      }),
    );
  });

  it("飞书测试消息在配置不完整时抛出明确错误", async () => {
    const { service } = createService({
      externalNotifyConfig: {
        enabled: true,
        feishu: { enabled: true, appId: "", appSecret: "" },
      },
    });

    await expect(service.sendFeishuTestMessage("1")).rejects.toThrow(
      "飞书通知未启用或配置不完整",
    );
  });

  it("根据发送成功日志更新飞书工作流待办卡片状态", async () => {
    const { service, logRepository, feishuProvider } = createService({
      logs: [
        {
          messageId: "msg-1",
          responsePayload: { data: { message_id: "om_message_1" } },
        },
      ],
    });

    await service.updateWorkflowTodoCardStatus({
      status: "approved",
      statusText: "已同意",
      messages: [
        {
          id: "msg-1",
          receiverId: "u1",
          title: "待办审批：项目立项",
          content: "您有一个新的审批任务待处理。",
          linkUrl: "/projectManage/approval",
          linkParams: { id: "19", taskId: "task-1" },
          extraData: { businessLabel: "客户项目A" },
          sourceType: "workflow_task",
          sourceId: "task-1",
          messageType: "todo",
        },
      ],
    });

    expect(logRepository.find).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          platform: "feishu",
          templateKey: "workflowTodo",
          sendStatus: ExternalMessageSendStatus.succeeded,
        }),
      }),
    );
    expect(feishuProvider.updateWorkflowTodoCard).toHaveBeenCalledWith(
      "om_message_1",
      expect.objectContaining({
        messageId: "msg-1",
        linkUrl:
          "https://admin.example.com/projectManage/approval?id=19&taskId=task-1",
        extraData: { businessLabel: "客户项目A" },
      }),
      expect.objectContaining({ status: "approved", statusText: "已同意" }),
      expect.objectContaining({ enabled: true }),
    );
    expect(logRepository.save).toHaveBeenCalledWith(
      expect.objectContaining({
        platform: "feishu",
        operationType: "update_card_status",
        messageId: "msg-1",
        externalMessageId: "om_message_1",
        sendStatus: ExternalMessageSendStatus.succeeded,
      }),
    );
  });

  it("更新飞书卡片失败时只记录失败日志不向外抛出", async () => {
    const { service, logRepository, feishuProvider } = createService({
      logs: [
        {
          messageId: "msg-1",
          responsePayload: { data: { message_id: "om_message_1" } },
        },
      ],
    });
    feishuProvider.updateWorkflowTodoCard.mockRejectedValue(
      new Error("飞书更新失败"),
    );

    await expect(
      service.updateWorkflowTodoCardStatus({
        status: "cancelled",
        statusText: "已失效",
        messages: [
          {
            id: "msg-1",
            receiverId: "u1",
            title: "待办审批：项目立项",
            content: "您有一个新的审批任务待处理。",
            sourceType: "workflow_task",
            sourceId: "task-1",
          },
        ],
      }),
    ).resolves.toBeUndefined();
    expect(logRepository.save).toHaveBeenCalledWith(
      expect.objectContaining({
        notificationId: expect.stringMatching(/^ntf_/),
        platform: "feishu",
        messageId: "msg-1",
        templateKey: "workflowTodoStatus",
        operationType: "update_card_status",
        sendStatus: ExternalMessageSendStatus.failed,
        errorMessage: "飞书更新失败",
      }),
    );
  });

  it("原始飞书发送日志未写入时写入待补偿卡片状态日志", async () => {
    const { service, logRepository, feishuProvider } = createService({
      logs: [],
    });

    await service.updateWorkflowTodoCardStatus({
      status: "approved",
      statusText: "已同意",
      messages: [
        {
          id: "msg-1",
          notificationId: "ntf_1",
          receiverId: "u1",
          title: "待办审批：项目立项",
          content: "您有一个新的审批任务待处理。",
          sourceType: "workflow_task",
          sourceId: "task-1",
        },
      ],
    });

    expect(feishuProvider.updateWorkflowTodoCard).not.toHaveBeenCalled();
    expect(logRepository.save).toHaveBeenCalledWith(
      expect.objectContaining({
        notificationId: "ntf_1",
        platform: "feishu",
        operationType: "update_card_status",
        templateKey: "workflowTodoStatus",
        messageId: "msg-1",
        sendStatus: ExternalMessageSendStatus.pending,
      }),
    );
  });

  it("补偿任务找到原始飞书消息后更新卡片并标记成功", async () => {
    const { service, logRepository, feishuProvider } = createService();
    logRepository.find
      .mockResolvedValueOnce([
        {
          id: "retry-1",
          notificationId: "ntf_1",
          messageId: "msg-1",
          receiverId: "u1",
          requestPayload: {
            title: "待办审批：项目立项",
            content: "您有一个新的审批任务待处理。",
            status: "approved",
            statusText: "已同意",
            linkUrl: "/projectManage/approval",
            linkParams: { id: "19", taskId: "task-1" },
          },
          retryCount: 0,
        },
      ])
      .mockResolvedValueOnce([
        {
          notificationId: "ntf_1",
          messageId: "msg-1",
          responsePayload: { data: { message_id: "om_1" } },
        },
      ]);

    const result = await service.retryPendingWorkflowTodoCardStatuses({
      limit: 10,
    });

    expect(feishuProvider.updateWorkflowTodoCard).toHaveBeenCalledWith(
      "om_1",
      expect.objectContaining({
        messageId: "msg-1",
        linkUrl:
          "https://admin.example.com/projectManage/approval?id=19&taskId=task-1",
      }),
      expect.objectContaining({ status: "approved", statusText: "已同意" }),
      expect.any(Object),
    );
    expect(logRepository.update).toHaveBeenCalledWith(
      "retry-1",
      expect.objectContaining({
        sendStatus: ExternalMessageSendStatus.succeeded,
        externalMessageId: "om_1",
      }),
    );
    expect(result).toEqual(
      expect.objectContaining({ processedCount: 1, successCount: 1 }),
    );
  });

  it("清理过期通知投递日志时跳过待补偿日志", async () => {
    const { service, logRepository } = createService();

    await service.cleanupDeliveryLogs({ succeededDays: 90, failedDays: 180 });

    expect(logRepository.update).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({
          sendStatus: ExternalMessageSendStatus.succeeded,
        }),
        expect.objectContaining({
          sendStatus: ExternalMessageSendStatus.failed,
        }),
      ]),
      expect.objectContaining({ isDelete: "1" }),
    );
  });
});
