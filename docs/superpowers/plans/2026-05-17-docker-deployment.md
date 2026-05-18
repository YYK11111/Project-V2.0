# Docker Deployment Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 为当前仓库补齐一套可运行的 Docker 部署方案，让前后端容器通过外部 Docker network 接入已存在的 MySQL 和 Redis，并提供首次部署初始化与验证流程。

**Architecture:** 后端继续使用 Nest 生产启动方式 `node dist/src/main env=prod`，但将数据库、Redis、JWT、端口和同步策略改为环境变量驱动；前端采用多阶段构建，最终由 Nginx 托管静态资源并反向代理 `/api` 到后端。部署编排只包含 `backend` 和 `frontend` 两个服务，并通过外部 network 连接既有基础设施。

**Tech Stack:** NestJS 11, TypeORM, ioredis, Vue 3, Vite, Nginx, Docker, Docker Compose, Jest, Vitest

---

### Task 1: 后端配置环境变量化

**Files:**
- Modify: `nest-admin/config/index.ts`
- Test: `nest-admin/src/config.spec.ts`

- [ ] **Step 1: 编写失败测试，先定义生产环境必须优先读取环境变量**

在 `nest-admin/src/config.spec.ts` 追加以下测试：

```ts
describe("config env overrides", () => {
  const originalArgv = process.argv;
  const originalEnv = process.env;

  afterEach(() => {
    process.argv = originalArgv;
    process.env = originalEnv;
    jest.resetModules();
  });

  it("prod 环境优先读取数据库与端口环境变量", () => {
    process.argv = ["node", "jest", "env=prod"];
    process.env = {
      ...originalEnv,
      APP_PORT: "4300",
      MYSQL_HOST: "mysql-service",
      MYSQL_PORT: "3307",
      MYSQL_USER: "docker_user",
      MYSQL_PASSWORD: "docker_pass",
      MYSQL_DATABASE: "docker_db",
      MYSQL_SYNCHRONIZE: "false",
      JWT_SECRET: "docker-jwt-secret",
    };

    jest.resetModules();
    const { config } = require("config");

    expect(config.server.port).toBe(4300);
    expect(config.database.host).toBe("mysql-service");
    expect(config.database.port).toBe(3307);
    expect(config.database.username).toBe("docker_user");
    expect(config.database.password).toBe("docker_pass");
    expect(config.database.database).toBe("docker_db");
    expect(config.database.synchronize).toBe(false);
    expect(config.jwtSecret).toBe("docker-jwt-secret");
  });

  it("prod 环境默认关闭数据库结构同步", () => {
    process.argv = ["node", "jest", "env=prod"];
    process.env = {
      ...originalEnv,
      MYSQL_SYNCHRONIZE: "",
    };

    jest.resetModules();
    const { config } = require("config");

    expect(config.database.synchronize).toBe(false);
  });
});
```

- [ ] **Step 2: 运行测试，确认当前实现失败**

Run:

```bash
cd /Users/yyk/work/Code/Project-V2.0/nest-admin
npx jest src/config.spec.ts --runInBand
```

Expected:

- `prod 环境优先读取数据库与端口环境变量` 失败
- `prod 环境默认关闭数据库结构同步` 失败

- [ ] **Step 3: 在配置文件中实现环境变量优先策略**

将 `nest-admin/config/index.ts` 改成以下结构要点：

```ts
import dayjs from "dayjs";
import merge from "lodash.merge";

const mode = process.argv.find((e) => e.includes("env="))?.split("=")[1] || "dev";

const toNumber = (value: string | undefined, fallback: number) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const toBoolean = (value: string | undefined, fallback: boolean) => {
  if (value === undefined || value === "") return fallback;
  return value === "true";
};

const env = {
  dev: {
    database: {
      type: "mysql",
      host: process.env.MYSQL_HOST || "localhost",
      port: toNumber(process.env.MYSQL_PORT, 3306),
      username: process.env.MYSQL_USER || "root",
      password: process.env.MYSQL_PASSWORD || "12345678",
      database: process.env.MYSQL_DATABASE || "psd2",
      synchronize: toBoolean(process.env.MYSQL_SYNCHRONIZE, true),
      autoLoadEntities: true,
      logging: true,
    },
  },
  prod: {
    database: {
      type: "mysql",
      host: process.env.MYSQL_HOST || "localhost",
      port: toNumber(process.env.MYSQL_PORT, 3306),
      username: process.env.MYSQL_USER || "root",
      password: process.env.MYSQL_PASSWORD || "12345678",
      database: process.env.MYSQL_DATABASE || "psd2",
      synchronize: toBoolean(process.env.MYSQL_SYNCHRONIZE, false),
      autoLoadEntities: true,
    },
  },
};

export function enforceProductionDatabaseSafety(appConfig, currentMode: string) {
  if (currentMode === "prod" && appConfig.database) {
    appConfig.database.synchronize = toBoolean(
      process.env.MYSQL_SYNCHRONIZE,
      false,
    );
  }
  return appConfig;
}

export const config = {
  apiBase: "/api",
  adminKey: "admin",
  isPublicKey: "isPublic",
  server: {
    port: toNumber(process.env.APP_PORT, 3000),
    debugPort: toNumber(process.env.APP_DEBUG_PORT, 9229),
  },
  featureFlags: {
    syncMenusOnBoot: process.env.SYSTEM_MENU_SYNC_ON_BOOT === "true",
  },
  get jwtExpires() {
    return dayjs().endOf("day").diff(dayjs(), "second") + "s";
  },
  jwtSecret:
    process.env.JWT_SECRET ||
    "DO NOT USE THIS VALUE. INSTEAD, CREATE A COMPLEX SECRET AND KEEP IT SAFE OUTSIDE OF THE SOURCE CODE.",
  ...env[mode],
};
```

要求：

- 保留 `secret.js` / `secret.copy.js` 合并逻辑
- 保留 `env=prod` 这种模式解析
- 生产默认 `synchronize=false`

- [ ] **Step 4: 更新原有测试断言，使生产同步策略与新设计一致**

把 `nest-admin/src/config.spec.ts` 中以下旧断言改掉：

```ts
it("prod 环境开启数据库结构同步", () => {
  const config = getConfigByEnv("prod");

  expect(config.database.synchronize).toBe(true);
});

it("prod 环境不会被兜底逻辑关闭数据库结构同步", () => {
  const { enforceProductionDatabaseSafety } = require("config");
  const appConfig = { database: { synchronize: true } };

  enforceProductionDatabaseSafety(appConfig, "prod");

  expect(appConfig.database.synchronize).toBe(true);
});
```

改为：

```ts
it("prod 环境默认关闭数据库结构同步", () => {
  const config = getConfigByEnv("prod");

  expect(config.database.synchronize).toBe(false);
});

it("prod 环境兜底逻辑会关闭数据库结构同步", () => {
  const { enforceProductionDatabaseSafety } = require("config");
  const appConfig = { database: { synchronize: true } };

  enforceProductionDatabaseSafety(appConfig, "prod");

  expect(appConfig.database.synchronize).toBe(false);
});
```

- [ ] **Step 5: 运行测试，确认配置行为通过**

Run:

```bash
cd /Users/yyk/work/Code/Project-V2.0/nest-admin
npx jest src/config.spec.ts --runInBand
```

Expected:

- PASS `config database synchronize`
- PASS `config env overrides`

- [ ] **Step 6: 提交这一组变更**

```bash
git add nest-admin/config/index.ts nest-admin/src/config.spec.ts
git commit -m "refactor: make backend config environment-driven"
```

### Task 2: Redis 连接环境变量化

**Files:**
- Modify: `nest-admin/src/modules/global/redis.service.ts`
- Create: `nest-admin/src/modules/global/redis.service.spec.ts`

- [ ] **Step 1: 先写失败测试，定义 Redis 连接配置来源**

创建 `nest-admin/src/modules/global/redis.service.spec.ts`：

```ts
jest.mock("ioredis", () => {
  return {
    Redis: jest.fn().mockImplementation(function Redis(this: any, options: any) {
      this.options = options;
      this.set = jest.fn();
      this.get = jest.fn();
      this.del = jest.fn();
      this.ttl = jest.fn();
      this.keys = jest.fn();
      this.expire = jest.fn();
      this.exists = jest.fn();
      this.hset = jest.fn();
      this.hget = jest.fn();
      this.hdel = jest.fn();
      this.scan = jest.fn();
    }),
  };
});

describe("RedisService config", () => {
  const originalEnv = process.env;

  afterEach(() => {
    process.env = originalEnv;
    jest.resetModules();
  });

  it("优先读取 Redis 环境变量", () => {
    process.env = {
      ...originalEnv,
      REDIS_HOST: "redis-service",
      REDIS_PORT: "6381",
      REDIS_DB: "5",
      REDIS_PASSWORD: "docker-redis-pass",
    };

    const { RedisService } = require("./redis.service");
    const service = new RedisService(
      { createLog: jest.fn(), dateToEndTime: jest.fn() },
      { list: jest.fn() },
      { getSessionExpireMinutes: jest.fn() },
    );

    expect(service.redis.options).toEqual({
      host: "redis-service",
      port: 6381,
      db: 5,
      password: "docker-redis-pass",
    });
  });

  it("未传环境变量时使用本地默认值", () => {
    process.env = {
      ...originalEnv,
      REDIS_HOST: "",
      REDIS_PORT: "",
      REDIS_DB: "",
      REDIS_PASSWORD: "",
    };

    const { RedisService } = require("./redis.service");
    const service = new RedisService(
      { createLog: jest.fn(), dateToEndTime: jest.fn() },
      { list: jest.fn() },
      { getSessionExpireMinutes: jest.fn() },
    );

    expect(service.redis.options).toEqual({
      host: "127.0.0.1",
      port: 6379,
      db: 1,
      password: undefined,
    });
  });
});
```

- [ ] **Step 2: 运行测试，确认当前实现失败**

Run:

```bash
cd /Users/yyk/work/Code/Project-V2.0/nest-admin
npx jest src/modules/global/redis.service.spec.ts --runInBand
```

Expected:

- 断言失败，因为当前 Redis 配置没有读取环境变量

- [ ] **Step 3: 实现 Redis 环境变量读取**

把 `nest-admin/src/modules/global/redis.service.ts` 中构造函数内的 Redis 初始化改为：

```ts
const redisPort = Number(process.env.REDIS_PORT || 6379);
const redisDb = Number(process.env.REDIS_DB || 1);
const redisPassword = process.env.REDIS_PASSWORD || undefined;

this.redis = new Redis({
  host: process.env.REDIS_HOST || "127.0.0.1",
  port: Number.isFinite(redisPort) ? redisPort : 6379,
  db: Number.isFinite(redisDb) ? redisDb : 1,
  password: redisPassword,
});
```

要求：

- 不改 RedisService 现有公开方法签名
- 不影响现有业务调用方

- [ ] **Step 4: 运行测试，确认 Redis 配置通过**

Run:

```bash
cd /Users/yyk/work/Code/Project-V2.0/nest-admin
npx jest src/modules/global/redis.service.spec.ts --runInBand
```

Expected:

- PASS `RedisService config`

- [ ] **Step 5: 提交这一组变更**

```bash
git add nest-admin/src/modules/global/redis.service.ts nest-admin/src/modules/global/redis.service.spec.ts
git commit -m "refactor: support env-based redis connection"
```

### Task 3: 前端生产配置与容器构建

**Files:**
- Modify: `nest-admin-frontend/sys.config.js`
- Create: `nest-admin-frontend/Dockerfile`
- Create: `nest-admin-frontend/.dockerignore`
- Create: `nest-admin-frontend/nginx.conf`
- Test: `nest-admin-frontend/src/config.spec.ts`

- [ ] **Step 1: 先写失败测试，约束生产环境配置不再保留示例域名**

在 `nest-admin-frontend/src/config.spec.ts` 追加：

```ts
it("生产配置不应继续保留示例域名", () => {
  const source = readSysConfigSource()

  expect(source).not.toContain("https://nestts.com")
  expect(source).toContain("BASE_API: '/api'")
})
```

- [ ] **Step 2: 运行测试，确认当前实现失败**

Run:

```bash
cd /Users/yyk/work/Code/Project-V2.0/nest-admin-frontend
npx vitest run src/config.spec.ts
```

Expected:

- 失败，因为 `sys.config.js` 仍包含 `https://nestts.com`

- [ ] **Step 3: 调整前端生产配置，适配同域反代部署**

把 `nest-admin-frontend/sys.config.js` 中 `production` 配置改成：

```js
production: {
  DOMAIN: window?.location?.origin || '',
  BASE_URL: '/',
  BASE_API: '/api',
},
```

并保持：

- `development.BASE_API` 继续使用本地开发地址
- `test` 配置不动，除非与新实现冲突

- [ ] **Step 4: 新增前端 Nginx 配置**

创建 `nest-admin-frontend/nginx.conf`：

```nginx
server {
  listen 80;
  server_name _;

  root /usr/share/nginx/html;
  index index.html;

  location / {
    try_files $uri $uri/ /index.html;
  }

  location /api/ {
    proxy_pass http://backend:3000/api/;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
  }
}
```

- [ ] **Step 5: 新增前端 Dockerfile 与忽略文件**

创建 `nest-admin-frontend/Dockerfile`：

```dockerfile
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build

FROM nginx:1.27-alpine

COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=builder /app/dist /usr/share/nginx/html
```

创建 `nest-admin-frontend/.dockerignore`：

```gitignore
node_modules
dist
.git
.DS_Store
coverage
```

- [ ] **Step 6: 运行测试，确认前端配置通过**

Run:

```bash
cd /Users/yyk/work/Code/Project-V2.0/nest-admin-frontend
npx vitest run src/config.spec.ts
```

Expected:

- PASS `applyBrowserBranding`
- PASS `生产配置不应继续保留示例域名`

- [ ] **Step 7: 提交这一组变更**

```bash
git add nest-admin-frontend/sys.config.js nest-admin-frontend/src/config.spec.ts nest-admin-frontend/Dockerfile nest-admin-frontend/.dockerignore nest-admin-frontend/nginx.conf
git commit -m "feat: add frontend docker image and nginx config"
```

### Task 4: 后端容器镜像与编排文件

**Files:**
- Create: `nest-admin/Dockerfile`
- Create: `nest-admin/.dockerignore`
- Create: `docker-compose.yml`
- Create: `.env.example`

- [ ] **Step 1: 新增后端 Dockerfile**

创建 `nest-admin/Dockerfile`：

```dockerfile
FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build

RUN mkdir -p /app/upload

EXPOSE 3000

CMD ["node", "dist/src/main", "env=prod"]
```

- [ ] **Step 2: 新增后端忽略文件**

创建 `nest-admin/.dockerignore`：

```gitignore
node_modules
dist
upload
.git
.DS_Store
coverage
```

- [ ] **Step 3: 新增根目录环境变量模板**

创建 `.env.example`：

```dotenv
COMPOSE_PROJECT_NAME=project-v2
DOCKER_EXTERNAL_NETWORK=shared-services

BACKEND_PORT=3000

APP_PORT=3000
APP_DEBUG_PORT=9229
JWT_SECRET=replace-with-a-real-secret

MYSQL_HOST=mysql
MYSQL_PORT=3306
MYSQL_USER=root
MYSQL_PASSWORD=12345678
MYSQL_DATABASE=psd2
MYSQL_SYNCHRONIZE=false

REDIS_HOST=redis
REDIS_PORT=6379
REDIS_DB=1
REDIS_PASSWORD=

SYSTEM_MENU_SYNC_ON_BOOT=false
UPLOAD_VOLUME=project_v2_upload
```

- [ ] **Step 4: 新增根目录编排文件**

创建 `docker-compose.yml`：

```yaml
services:
  backend:
    build:
      context: ./nest-admin
    container_name: project-v2-backend
    restart: unless-stopped
    environment:
      APP_PORT: ${APP_PORT}
      APP_DEBUG_PORT: ${APP_DEBUG_PORT}
      JWT_SECRET: ${JWT_SECRET}
      MYSQL_HOST: ${MYSQL_HOST}
      MYSQL_PORT: ${MYSQL_PORT}
      MYSQL_USER: ${MYSQL_USER}
      MYSQL_PASSWORD: ${MYSQL_PASSWORD}
      MYSQL_DATABASE: ${MYSQL_DATABASE}
      MYSQL_SYNCHRONIZE: ${MYSQL_SYNCHRONIZE}
      REDIS_HOST: ${REDIS_HOST}
      REDIS_PORT: ${REDIS_PORT}
      REDIS_DB: ${REDIS_DB}
      REDIS_PASSWORD: ${REDIS_PASSWORD}
      SYSTEM_MENU_SYNC_ON_BOOT: ${SYSTEM_MENU_SYNC_ON_BOOT}
    ports:
      - "${BACKEND_PORT}:3000"
    volumes:
      - ${UPLOAD_VOLUME}:/app/upload
    networks:
      - external-services

  frontend:
    build:
      context: ./nest-admin-frontend
    container_name: project-v2-frontend
    restart: unless-stopped
    depends_on:
      - backend
    ports:
      - "80:80"
    networks:
      - external-services

volumes:
  project_v2_upload:
    name: ${UPLOAD_VOLUME}

networks:
  external-services:
    external: true
    name: ${DOCKER_EXTERNAL_NETWORK}
```

- [ ] **Step 5: 校验 Compose 文件语法**

Run:

```bash
cd /Users/yyk/work/Code/Project-V2.0
docker compose --env-file .env.example config
```

Expected:

- 输出展开后的 compose 配置
- 无 YAML 语法错误

- [ ] **Step 6: 提交这一组变更**

```bash
git add nest-admin/Dockerfile nest-admin/.dockerignore docker-compose.yml .env.example
git commit -m "feat: add backend docker image and compose stack"
```

### Task 5: 部署说明与端到端验证

**Files:**
- Create: `docs/docker-deployment.md`
- Modify: `nest-admin/README.md`
- Modify: `nest-admin-frontend/README.md`

- [ ] **Step 1: 新增部署说明文档**

创建 `docs/docker-deployment.md`，至少包含以下内容：

```md
# Docker 部署说明

## 前提

- 已有可用的 MySQL Docker 服务
- 已有可用的 Redis Docker 服务
- 前后端容器与它们加入同一个 Docker network

## 首次部署

1. 复制环境变量模板
2. 修改 `.env`
3. 创建外部 network（如果还没有）
4. 启动前后端容器
5. 初始化数据库
6. 执行校验脚本

## 命令

```bash
cp .env.example .env
docker compose up -d --build
mysql -h 127.0.0.1 -u root -p -e "CREATE DATABASE IF NOT EXISTS psd2 DEFAULT CHARSET utf8mb4 COLLATE utf8mb4_unicode_ci;"
cd nest-admin/doc/sql/bootstrap
mysql -h 127.0.0.1 -u root -p -D psd2 < init_system.sql
mysql -h 127.0.0.1 -u root -p -D psd2 < verify_system.sql
```

## 验证

- `docker compose ps`
- `docker compose logs backend`
- 浏览器访问首页
- 检查登录
- 检查上传
```

- [ ] **Step 2: 在前后端 README 中增加 Docker 部署入口说明**

在 `nest-admin/README.md` 和 `nest-admin-frontend/README.md` 末尾各追加一段简短说明：

```md
## Docker 部署

本仓库的 Docker 部署以仓库根目录 `docker-compose.yml` 为入口，详细步骤见 `docs/docker-deployment.md`。
```

- [ ] **Step 3: 运行后端验证命令**

Run:

```bash
cd /Users/yyk/work/Code/Project-V2.0/nest-admin
npm run lint
npx jest src/config.spec.ts src/modules/global/redis.service.spec.ts --runInBand
```

Expected:

- `eslint` 执行完成
- 两个测试文件全部通过

- [ ] **Step 4: 运行前端验证命令**

Run:

```bash
cd /Users/yyk/work/Code/Project-V2.0/nest-admin-frontend
npm run type-check
npx vitest run src/config.spec.ts
```

Expected:

- `vue-tsc` 通过
- `src/config.spec.ts` 通过

- [ ] **Step 5: 校验根目录 API 契约检查**

Run:

```bash
cd /Users/yyk/work/Code/Project-V2.0
npm run check:api-contract
```

Expected:

- 检查通过

- [ ] **Step 6: 提交文档与验证结果相关变更**

```bash
git add docs/docker-deployment.md nest-admin/README.md nest-admin-frontend/README.md
git commit -m "docs: add docker deployment guide"
```
