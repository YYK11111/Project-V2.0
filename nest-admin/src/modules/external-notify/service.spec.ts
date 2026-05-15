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
      sendText: jest.fn().mockResolvedValue({ code: 0 }),
      batchGetUserId: jest.fn().mockResolvedValue(options.feishuUsers || []),
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
        platform: "feishu",
        messageId: "msg-1",
        externalUserId: "ou_1",
        sendStatus: ExternalMessageSendStatus.succeeded,
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
});
