import { UserExternalAccountsController } from "./controller";
import { ExternalAccountPlatform } from "./entity";

describe("UserExternalAccountsController", () => {
  it("保存手动绑定映射", async () => {
    const service = {
      list: jest.fn(),
      upsertManualAccount: jest.fn(async (data) => data),
      getActiveAccount: jest.fn(),
    };
    const controller = new UserExternalAccountsController(service as any);

    await controller.save({
      userId: "1",
      platform: ExternalAccountPlatform.feishu,
      externalUserId: "ou_1",
    });

    expect(service.upsertManualAccount).toHaveBeenCalledWith({
      userId: "1",
      platform: ExternalAccountPlatform.feishu,
      externalUserId: "ou_1",
    });
  });

  it("查询外部账号映射列表", async () => {
    const service = {
      list: jest.fn().mockResolvedValue({ data: [], total: 0 }),
      upsertManualAccount: jest.fn(),
      getActiveAccount: jest.fn(),
    };
    const controller = new UserExternalAccountsController(service as any);

    await expect(
      controller.list({ platform: "feishu", pageNum: 1 }),
    ).resolves.toEqual({ data: [], total: 0 });
    expect(service.list).toHaveBeenCalledWith({
      platform: "feishu",
      pageNum: 1,
    });
  });
});
