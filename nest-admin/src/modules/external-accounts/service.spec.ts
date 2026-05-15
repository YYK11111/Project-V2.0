import { UserExternalAccountsService } from "./service";
import { ExternalAccountBindStatus, ExternalAccountPlatform } from "./entity";

describe("UserExternalAccountsService", () => {
  const createService = () => {
    const repository = {
      findOne: jest.fn(),
      save: jest.fn(async (data) => data),
      createQueryBuilder: jest.fn(),
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

  it("列表关键字支持匹配 UserID、OpenID 和 UnionID", async () => {
    const { service, repository } = createService();
    const qb = {
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      addOrderBy: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      take: jest.fn().mockReturnThis(),
      getManyAndCount: jest.fn().mockResolvedValue([[], 0]),
    };
    repository.createQueryBuilder.mockReturnValue(qb);

    await service.list({ keyword: "open_1" } as any);

    expect(qb.andWhere).toHaveBeenCalledWith(
      expect.stringContaining("account.openId LIKE :keyword"),
      { keyword: "%open_1%" },
    );
    expect(qb.andWhere).toHaveBeenCalledWith(
      expect.stringContaining("account.unionId LIKE :keyword"),
      { keyword: "%open_1%" },
    );
  });
});
