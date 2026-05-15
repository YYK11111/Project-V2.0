import { ExternalNotifyController } from "./controller";

describe("ExternalNotifyController", () => {
  it("发送飞书测试消息给当前用户", async () => {
    const service = {
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
      sendFeishuTestMessage: jest.fn(),
      syncFeishuAccount: jest.fn().mockResolvedValue({ externalUserId: "ou_1" }),
      syncFeishuAccounts: jest.fn(),
    };
    const controller = new ExternalNotifyController(service as any);

    await expect(controller.syncFeishuUser("u1")).resolves.toEqual({
      externalUserId: "ou_1",
    });
    expect(service.syncFeishuAccount).toHaveBeenCalledWith("u1");
  });
});
