import { getHttpPort } from "./main.config";

describe("getHttpPort", () => {
  const originalPort = process.env.PORT;

  afterEach(() => {
    if (originalPort === undefined) {
      delete process.env.PORT;
      return;
    }

    process.env.PORT = originalPort;
  });

  it("使用默认配置端口", () => {
    delete process.env.PORT;

    expect(getHttpPort({ server: { port: 3001 } })).toBe(3001);
  });

  it("优先使用 PORT 环境变量", () => {
    process.env.PORT = "4001";

    expect(getHttpPort({ server: { port: 3001 } })).toBe(4001);
  });

  it("非法 PORT 回退 3000", () => {
    process.env.PORT = "abc";

    expect(getHttpPort({ server: { port: 3001 } })).toBe(3000);
  });
});
