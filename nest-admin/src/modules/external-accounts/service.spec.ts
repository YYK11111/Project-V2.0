import { UserExternalAccountsService } from "./service";
import {
  ExternalAccountBindStatus,
  ExternalAccountPlatform,
} from "./entity";

describe("UserExternalAccountsService", () => {
  const createService = () => {
    const repository = {
      findOne: jest.fn(),
      save: jest.fn(async (data) => data),
    };
    const service = new UserExternalAccountsService(repository as any);
    return { service, repository };
  };

  it("查询指定平台的有效用户映射", async () => {
    const { service, repository } = createService();
    repository.findOne.mockResolvedValue({
      userId: "1",
      platform: ExternalAccountPlatform.feishu,
      externalUserId: "ou_1",
    });

    const result = await service.getActiveAccount(
      "1",
      ExternalAccountPlatform.feishu,
    );

    expect(result.externalUserId).toBe("ou_1");
    expect(repository.findOne).toHaveBeenCalledWith({
      where: expect.objectContaining({
        userId: "1",
        platform: ExternalAccountPlatform.feishu,
        bindStatus: ExternalAccountBindStatus.bound,
      }),
    });
  });

  it("手动绑定时复用同用户同平台旧记录", async () => {
    const { service, repository } = createService();
    repository.findOne.mockResolvedValue({ id: "map-1", userId: "1" });

    await service.upsertManualAccount({
      userId: "1",
      platform: ExternalAccountPlatform.feishu,
      externalUserId: "ou_2",
    });

    expect(repository.save).toHaveBeenCalledWith(
      expect.objectContaining({
        id: "map-1",
        userId: "1",
        platform: ExternalAccountPlatform.feishu,
        externalUserId: "ou_2",
        bindStatus: ExternalAccountBindStatus.bound,
        bindSource: "manual",
      }),
    );
  });
});
