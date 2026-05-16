import { ExternalNotifyController } from "./controller";

describe("ExternalNotifyController", () => {
  it("发送飞书测试消息给当前用户", async () => {
    const service = {
      listLogs: jest.fn(),
      getMessageTrace: jest.fn(),
      getFeishuCompensationStatus: jest.fn(),
      diagnoseFeishuConfig: jest.fn(),
      sendFeishuTestMessage: jest.fn().mockResolvedValue({ success: true }),
      syncFeishuAccount: jest.fn(),
      syncFeishuAccounts: jest.fn(),
    };
    const controller = new ExternalNotifyController(service as any);

    await expect(
      controller.testFeishu({ user: { id: "u1" } }, {}),
    ).resolves.toEqual({ success: true });
    expect(service.sendFeishuTestMessage).toHaveBeenCalledWith("u1");
  });

  it("同步单个用户飞书映射", async () => {
    const service = {
      listLogs: jest.fn(),
      getMessageTrace: jest.fn(),
      getFeishuCompensationStatus: jest.fn(),
      diagnoseFeishuConfig: jest.fn(),
      sendFeishuTestMessage: jest.fn(),
      syncFeishuAccount: jest
        .fn()
        .mockResolvedValue({ externalUserId: "ou_1" }),
      syncFeishuAccounts: jest.fn(),
    };
    const controller = new ExternalNotifyController(service as any);

    await expect(controller.syncFeishuUser("u1")).resolves.toEqual({
      externalUserId: "ou_1",
    });
    expect(service.syncFeishuAccount).toHaveBeenCalledWith("u1");
  });

  it("查询外部通知发送日志", async () => {
    const service = {
      listLogs: jest.fn().mockResolvedValue({ data: [], total: 0 }),
      getMessageTrace: jest.fn(),
      getFeishuCompensationStatus: jest.fn(),
      diagnoseFeishuConfig: jest.fn(),
      sendFeishuTestMessage: jest.fn(),
      syncFeishuAccount: jest.fn(),
      syncFeishuAccounts: jest.fn(),
    };
    const controller = new ExternalNotifyController(service as any);

    await expect(
      controller.listLogs({ platform: "feishu", sendStatus: "1" }),
    ).resolves.toEqual({ data: [], total: 0 });
    expect(service.listLogs).toHaveBeenCalledWith({
      platform: "feishu",
      sendStatus: "1",
    });
  });

  it("按统一消息ID查询外部通知追踪日志", async () => {
    const service = {
      listLogs: jest.fn(),
      getMessageTrace: jest
        .fn()
        .mockResolvedValue({ messageId: "msg-1", logs: [] }),
      getFeishuCompensationStatus: jest.fn(),
      diagnoseFeishuConfig: jest.fn(),
      sendFeishuTestMessage: jest.fn(),
      syncFeishuAccount: jest.fn(),
      syncFeishuAccounts: jest.fn(),
    };
    const controller = new ExternalNotifyController(service as any);

    await expect(controller.traceLogs("msg-1")).resolves.toEqual({
      messageId: "msg-1",
      logs: [],
    });
    expect(service.getMessageTrace).toHaveBeenCalledWith("msg-1");
  });

  it("查询飞书卡片状态补偿概览", async () => {
    const service = {
      listLogs: jest.fn(),
      getMessageTrace: jest.fn(),
      getFeishuCompensationStatus: jest
        .fn()
        .mockResolvedValue({ pendingCount: 1 }),
      diagnoseFeishuConfig: jest.fn(),
      sendFeishuTestMessage: jest.fn(),
      syncFeishuAccount: jest.fn(),
      syncFeishuAccounts: jest.fn(),
    };
    const controller = new ExternalNotifyController(service as any);

    await expect(controller.feishuCompensationStatus()).resolves.toEqual({
      pendingCount: 1,
    });
    expect(service.getFeishuCompensationStatus).toHaveBeenCalledWith();
  });

  it("执行飞书配置自检", async () => {
    const service = {
      listLogs: jest.fn(),
      getMessageTrace: jest.fn(),
      getFeishuCompensationStatus: jest.fn(),
      diagnoseFeishuConfig: jest
        .fn()
        .mockResolvedValue({ success: true, steps: [] }),
      sendFeishuTestMessage: jest.fn(),
      syncFeishuAccount: jest.fn(),
      syncFeishuAccounts: jest.fn(),
    };
    const controller = new ExternalNotifyController(service as any);

    await expect(
      controller.diagnoseFeishu({ user: { id: "u1" } }, {}),
    ).resolves.toEqual({ success: true, steps: [] });
    expect(service.diagnoseFeishuConfig).toHaveBeenCalledWith("u1");
  });
});
