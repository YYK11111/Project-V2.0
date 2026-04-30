import { BoolNum } from "src/common/type/base";
import { LoginLogsService } from "./service";

interface RawChartRow {
  date?: string;
  num?: number;
  account?: string;
  address?: string | null;
  createTime?: string;
  id?: number;
}

describe("LoginLogsService charts", () => {
  function createService(rawRows: RawChartRow[] = []) {
    const queryBuilder = {
      select: jest.fn().mockReturnThis(),
      distinctOn: jest.fn().mockReturnThis(),
      addSelect: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      groupBy: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      getRawMany: jest.fn().mockResolvedValue(rawRows),
    };
    const repository = {
      createQueryBuilder: jest.fn().mockReturnValue(queryBuilder),
    };
    const service = new LoginLogsService(repository as never, {} as never);

    return { service, queryBuilder };
  }

  it("访问趋势未传时间范围时默认返回最近 7 天数据", async () => {
    const { service, queryBuilder } = createService([]);

    const result = await service.getVisitedNumChart({});

    expect(result).toHaveLength(7);
    expect(result.every((item) => typeof item.date === "string")).toBe(true);
    expect(result.every((item) => item.num === 0)).toBe(true);
    expect(queryBuilder.where).toHaveBeenCalledWith(
      "DATE(LoginLog.createTime) BETWEEN :beginTime AND :endTime",
      expect.objectContaining({
        beginTime: expect.any(String),
        endTime: expect.any(String),
      }),
    );
  });

  it("用户地区分布应保留本地登录数据", async () => {
    const { service, queryBuilder } = createService([
      { address: "本地", num: 91 },
    ]);

    await expect(service.getUserAreaList({} as never)).resolves.toEqual([
      { name: "本地", value: 91 },
    ]);
    expect(queryBuilder.where).toHaveBeenCalledWith(
      "LoginLog.address IS NOT NULL AND LoginLog.address != ''",
    );
  });

  it("最近成功登录省份分布按账号去重并归一化省份", async () => {
    const { service } = createService([
      {
        id: 12,
        account: "alice",
        address: "广东省深圳市",
        createTime: "2026-04-30 10:00:00",
      },
      {
        id: 11,
        account: "alice",
        address: "上海",
        createTime: "2026-04-30 10:00:00",
      },
      {
        id: 20,
        account: "bob",
        address: "北京",
        createTime: "2026-04-30 09:00:00",
      },
      {
        id: 30,
        account: "carol",
        address: "北京市",
        createTime: "2026-04-30 08:00:00",
      },
      {
        id: 40,
        account: "dave",
        address: "浙江杭州",
        createTime: "2026-04-30 07:00:00",
      },
      {
        id: 50,
        account: "eric",
        address: "本地",
        createTime: "2026-04-30 06:00:00",
      },
      {
        id: 60,
        account: "frank",
        address: null,
        createTime: "2026-04-30 05:00:00",
      },
    ]);

    await expect(service.getUserLoginProvinceList()).resolves.toEqual([
      { name: "北京", value: 2 },
      { name: "未知", value: 2 },
      { name: "广东", value: 1 },
      { name: "浙江", value: 1 },
    ]);
  });

  it("最近成功登录省份分布只查询成功登录且账号非空日志", async () => {
    const { service, queryBuilder } = createService([]);

    await service.getUserLoginProvinceList();

    expect(queryBuilder.where).toHaveBeenCalledWith(
      "LoginLog.isSuccess = :isSuccess",
      { isSuccess: BoolNum.Yes },
    );
    expect(queryBuilder.andWhere).toHaveBeenCalledWith(
      "LoginLog.account IS NOT NULL AND TRIM(LoginLog.account) != ''",
    );
    expect(queryBuilder.orderBy).toHaveBeenCalledWith({
      "LoginLog.account": "ASC",
      "LoginLog.createTime": "DESC",
      "LoginLog.id": "DESC",
    });
  });

  it("最近成功登录省份分布应在数据库层筛选每个账号最新记录", async () => {
    const { service, queryBuilder } = createService([]);

    await service.getUserLoginProvinceList();

    expect(queryBuilder.andWhere).toHaveBeenCalledWith(
      "LoginLog.account IS NOT NULL AND TRIM(LoginLog.account) != ''",
    );
    expect(queryBuilder.andWhere).toHaveBeenCalledWith(
      expect.stringContaining("NOT EXISTS"),
    );
    expect(queryBuilder.andWhere).toHaveBeenCalledWith(
      expect.stringContaining("NewerLoginLog.account = LoginLog.account"),
    );
    expect(queryBuilder.andWhere).toHaveBeenCalledWith(
      expect.stringContaining("NewerLoginLog.is_delete IS NULL"),
    );
    expect(queryBuilder.andWhere).toHaveBeenCalledWith(
      expect.stringContaining(
        "NewerLoginLog.create_time > LoginLog.create_time",
      ),
    );
    expect(queryBuilder.andWhere).toHaveBeenCalledWith(
      expect.stringContaining("NewerLoginLog.id > LoginLog.id"),
    );
  });
});
