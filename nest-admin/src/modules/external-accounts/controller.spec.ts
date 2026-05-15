import { UserExternalAccountsController } from "./controller";
import { ExternalAccountPlatform } from "./entity";

describe("UserExternalAccountsController", () => {
  it("保存手动绑定映射", async () => {
    const service = {
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
});
