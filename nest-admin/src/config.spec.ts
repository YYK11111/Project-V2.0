describe("config database synchronize", () => {
  const originalArgv = process.argv;

  afterEach(() => {
    process.argv = originalArgv;
    jest.resetModules();
  });

  const getConfigByEnv = (envName: "dev" | "prod") => {
    process.argv = ["node", "jest", `env=${envName}`];
    jest.resetModules();

    return require("config").config;
  };

  it("prod 环境关闭数据库结构同步", () => {
    const config = getConfigByEnv("prod");

    expect(config.database.synchronize).toBe(false);
  });

  it("dev 环境保持数据库结构同步", () => {
    const config = getConfigByEnv("dev");

    expect(config.database.synchronize).toBe(true);
  });

  it("prod 环境强制关闭数据库结构同步兜底", () => {
    const { enforceProductionDatabaseSafety } = require("config");
    const appConfig = { database: { synchronize: true } };

    enforceProductionDatabaseSafety(appConfig, "prod");

    expect(appConfig.database.synchronize).toBe(false);
  });

  it("dev 环境不会被生产兜底逻辑修改", () => {
    const { enforceProductionDatabaseSafety } = require("config");
    const appConfig = { database: { synchronize: true } };

    enforceProductionDatabaseSafety(appConfig, "dev");

    expect(appConfig.database.synchronize).toBe(true);
  });
});
