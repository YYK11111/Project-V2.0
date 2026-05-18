jest.mock("ioredis", () => {
  const Redis = jest.fn().mockImplementation(() => ({}));
  return { Redis };
});

import { Redis } from "ioredis";
import { RedisService } from "./redis.service";

describe("RedisService", () => {
  const originalEnv = {
    REDIS_HOST: process.env.REDIS_HOST,
    REDIS_PORT: process.env.REDIS_PORT,
    REDIS_DB: process.env.REDIS_DB,
    REDIS_PASSWORD: process.env.REDIS_PASSWORD,
  };

  function restoreEnv(key: keyof typeof originalEnv) {
    const value = originalEnv[key];
    if (value === undefined) {
      delete process.env[key];
    } else {
      process.env[key] = value;
    }
  }

  afterEach(() => {
    restoreEnv("REDIS_HOST");
    restoreEnv("REDIS_PORT");
    restoreEnv("REDIS_DB");
    restoreEnv("REDIS_PASSWORD");
    (Redis as jest.Mock).mockClear();
  });

  it("环境变量优先于默认值", () => {
    process.env.REDIS_HOST = "10.0.0.8";
    process.env.REDIS_PORT = "6380";
    process.env.REDIS_DB = "2";
    process.env.REDIS_PASSWORD = "secret-password";

    new RedisService({} as never, {} as never, {} as never);

    expect(Redis).toHaveBeenCalledWith({
      host: "10.0.0.8",
      port: 6380,
      db: 2,
      password: "secret-password",
    });
  });

  it("未设置环境变量时使用默认值", () => {
    delete process.env.REDIS_HOST;
    delete process.env.REDIS_PORT;
    delete process.env.REDIS_DB;
    delete process.env.REDIS_PASSWORD;

    new RedisService({} as never, {} as never, {} as never);

    expect(Redis).toHaveBeenCalledWith({
      host: "127.0.0.1",
      port: 6379,
      db: 1,
      password: undefined,
    });
  });

  it.each([
    ["非法字符串", "abc", "xyz"],
    ["负数", "-1", "-2"],
    ["小数", "1.5", "2.7"],
  ])("端口和数据库配置为%s时应回退默认值", (_, portValue, dbValue) => {
    process.env.REDIS_PORT = portValue;
    process.env.REDIS_DB = dbValue;

    new RedisService({} as never, {} as never, {} as never);

    expect(Redis).toHaveBeenCalledWith({
      host: "127.0.0.1",
      port: 6379,
      db: 1,
      password: undefined,
    });
  });

  it("前后空格包裹的合法整数应被正确解析", () => {
    process.env.REDIS_PORT = " 6380 ";
    process.env.REDIS_DB = " 2 ";

    new RedisService({} as never, {} as never, {} as never);

    expect(Redis).toHaveBeenCalledWith({
      host: "127.0.0.1",
      port: 6380,
      db: 2,
      password: undefined,
    });
  });
});
