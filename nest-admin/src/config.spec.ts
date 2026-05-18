describe("config database synchronize", () => {
  const originalArgv = process.argv;
  const originalEnv = {
    APP_PORT: process.env.APP_PORT,
    APP_DEBUG_PORT: process.env.APP_DEBUG_PORT,
    MYSQL_HOST: process.env.MYSQL_HOST,
    MYSQL_PORT: process.env.MYSQL_PORT,
    MYSQL_USER: process.env.MYSQL_USER,
    MYSQL_PASSWORD: process.env.MYSQL_PASSWORD,
    MYSQL_DATABASE: process.env.MYSQL_DATABASE,
    MYSQL_SYNCHRONIZE: process.env.MYSQL_SYNCHRONIZE,
    JWT_SECRET: process.env.JWT_SECRET,
  };
  const restoreEnvVar = (key: keyof typeof originalEnv) => {
    const value = originalEnv[key];

    if (value === undefined) {
      delete process.env[key];
      return;
    }

    process.env[key] = value;
  };

  afterEach(() => {
    process.argv = originalArgv;
    restoreEnvVar("APP_PORT");
    restoreEnvVar("APP_DEBUG_PORT");
    restoreEnvVar("MYSQL_HOST");
    restoreEnvVar("MYSQL_PORT");
    restoreEnvVar("MYSQL_USER");
    restoreEnvVar("MYSQL_PASSWORD");
    restoreEnvVar("MYSQL_DATABASE");
    restoreEnvVar("MYSQL_SYNCHRONIZE");
    restoreEnvVar("JWT_SECRET");
    jest.resetModules();
  });

  beforeEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
  });

  const mockSecretModule = (secret: Record<string, unknown>) => {
    jest.doMock(
      "../config/secret.js",
      () => ({
        __esModule: true,
        secret,
      }),
      {
        virtual: true,
      },
    );
  };

  const getConfigByEnv = (envName: "dev" | "prod") => {
    process.argv = ["node", "jest", `env=${envName}`];
    jest.resetModules();

    return require("config").config;
  };

  const getConfigWithoutEnv = () => {
    process.argv = ["node", "jest"];
    jest.resetModules();

    return () => require("config");
  };

  const getConfigByEnvWithSecret = (
    envName: "dev" | "prod",
    secret: Record<string, unknown>,
  ) => {
    mockSecretModule(secret);
    return getConfigByEnv(envName);
  };

  it("prod 环境变量优先覆盖配置", () => {
    process.env.APP_PORT = "4000";
    process.env.APP_DEBUG_PORT = "9333";
    process.env.MYSQL_HOST = "db.example.com";
    process.env.MYSQL_PORT = "3307";
    process.env.MYSQL_USER = "alice";
    process.env.MYSQL_PASSWORD = "secret";
    process.env.MYSQL_DATABASE = "prod_db";
    process.env.MYSQL_SYNCHRONIZE = "true";
    process.env.JWT_SECRET = "prod-secret";

    const config = getConfigByEnv("prod");

    expect(config.server.port).toBe(4000);
    expect(config.server.debugPort).toBe(9333);
    expect(config.database.host).toBe("db.example.com");
    expect(config.database.port).toBe(3307);
    expect(config.database.username).toBe("alice");
    expect(config.database.password).toBe("secret");
    expect(config.database.database).toBe("prod_db");
    expect(config.database.synchronize).toBe(false);
    expect(config.jwtSecret).toBe("prod-secret");
  });

  it("prod 环境默认关闭数据库结构同步", () => {
    const config = getConfigByEnv("prod");

    expect(config.database.synchronize).toBe(false);
  });

  it("prod 环境会被兜底逻辑关闭数据库结构同步", () => {
    const { enforceProductionDatabaseSafety } = require("config");
    const appConfig = { database: { synchronize: true } };

    enforceProductionDatabaseSafety(appConfig, "prod");

    expect(appConfig.database.synchronize).toBe(false);
  });

  it("dev 环境保持数据库结构同步", () => {
    const config = getConfigByEnv("dev");

    expect(config.database.synchronize).toBe(true);
  });

  it("缺少 env 参数时应尽早报错", () => {
    const loadConfig = getConfigWithoutEnv();

    expect(loadConfig).toThrow(/env=/);
  });

  it("secret 保留未被环境变量覆盖的数据库配置，环境变量显式设置时优先", () => {
    const secret = {
      prod: {
        database: {
          host: "secret-host",
          port: 3308,
          username: "secret-user",
          password: "secret-pass",
          database: "secret-db",
        },
      },
    };

    const secretConfig = getConfigByEnvWithSecret("prod", secret);

    expect(secretConfig.database.host).toBe("secret-host");
    expect(secretConfig.database.port).toBe(3308);
    expect(secretConfig.database.username).toBe("secret-user");
    expect(secretConfig.database.password).toBe("secret-pass");
    expect(secretConfig.database.database).toBe("secret-db");

    process.env.MYSQL_HOST = "env-host";
    process.env.MYSQL_PORT = "3309";
    process.env.MYSQL_USER = "env-user";
    process.env.MYSQL_PASSWORD = "env-pass";
    process.env.MYSQL_DATABASE = "env-db";

    const envConfig = getConfigByEnvWithSecret("prod", secret);

    expect(envConfig.database.host).toBe("env-host");
    expect(envConfig.database.port).toBe(3309);
    expect(envConfig.database.username).toBe("env-user");
    expect(envConfig.database.password).toBe("env-pass");
    expect(envConfig.database.database).toBe("env-db");
  });

  it("未设置 JWT_SECRET 时保留默认硬编码值", () => {
    const config = getConfigByEnv("prod");

    expect(config.jwtSecret).toBe(
      "DO NOT USE THIS VALUE. INSTEAD, CREATE A COMPLEX SECRET AND KEEP IT SAFE OUTSIDE OF THE SOURCE CODE.",
    );
  });

  it("显式设置 JWT_SECRET 时环境变量优先", () => {
    process.env.JWT_SECRET = "env-jwt-secret";

    const config = getConfigByEnv("prod");

    expect(config.jwtSecret).toBe("env-jwt-secret");
  });
});
