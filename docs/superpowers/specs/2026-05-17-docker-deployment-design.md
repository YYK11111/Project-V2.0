# Docker 部署设计

## 目标

为当前仓库补齐一套可直接落地的 Docker 部署方案，用于在前后端分离结构下部署：

- `nest-admin` 后端
- `nest-admin-frontend` 前端

本次部署明确依赖外部已存在的 MySQL 和 Redis Docker 服务，不在新的部署编排中重复创建数据库和缓存服务。

本次设计的目标是：

- 后端容器可通过同一 Docker network 访问外部 MySQL 和 Redis
- 前端以静态资源形式由 Nginx 提供
- Nginx 反向代理 `/api` 到后端容器
- 上传目录持久化，避免容器重建后附件丢失
- 后端配置不再依赖写死的本地地址，而由环境变量驱动

## 已确认约束

- MySQL 和 Redis 已经是独立 Docker 服务
- 新的前后端容器会与现有 MySQL / Redis 加入同一个 Docker network
- 本次需要同时补 Docker 部署文件和后端环境变量化改造
- 数据库初始化继续沿用仓库当前推荐的 `bootstrap` SQL 入口

## 当前问题

当前仓库还不适合直接容器化上线，主要问题有：

### 1. 后端 Redis 地址写死

[nest-admin/src/modules/global/redis.service.ts](/Users/yyk/work/Code/Project-V2.0/nest-admin/src/modules/global/redis.service.ts) 当前固定连接：

- host: `127.0.0.1`
- port: `6379`
- db: `1`

容器化后，`127.0.0.1` 指向后端容器自身，而不是外部 Redis 服务，因此当前实现无法直接在 Docker 中工作。

### 2. 后端数据库配置写死在代码中

[nest-admin/config/index.ts](/Users/yyk/work/Code/Project-V2.0/nest-admin/config/index.ts) 当前数据库配置主要写死在 `env.dev` 和 `env.prod` 中，不适合通过部署环境灵活切换。

### 3. 生产环境数据库同步风险

当前 `prod.database.synchronize` 仍为 `true`。正式部署不应长期依赖 TypeORM 自动同步表结构，避免线上不可控的结构变更。

### 4. 仓库缺少容器部署文件

当前仓库没有：

- `Dockerfile`
- `docker-compose.yml`
- 前端 Nginx 生产配置
- 容器部署用环境变量模板

### 5. 前端生产环境域名与接口配置仍是示例值

[nest-admin-frontend/sys.config.js](/Users/yyk/work/Code/Project-V2.0/nest-admin-frontend/sys.config.js) 中 `production` 环境当前仍是示例地址，需要改成更适合容器部署和反向代理的方式。

## 方案对比

### 方案一：前后端都容器化，后端连接外部 MySQL / Redis

做法：

- 后端容器单独运行 Nest 服务
- 前端构建后交给 Nginx 容器托管
- 通过外部 Docker network 连接已存在的 MySQL 和 Redis

优点：

- 结构清晰，符合当前仓库前后端拆分方式
- 部署、回滚、迁移都统一
- 不会重复维护数据库和缓存服务
- 前端反向代理、上传目录持久化都容易处理

缺点：

- 需要补 Docker 文件和少量配置改造

### 方案二：只容器化后端，前端继续手工部署

优点：

- 改动较少

缺点：

- 前后端部署方式不统一
- 后续维护、迁移和排查更分裂

### 方案三：前后端放进同一个运行容器

优点：

- 表面上文件更少

缺点：

- 容器职责混杂
- 不利于升级、排障和资源隔离
- 与当前项目结构不匹配

## 选定方案

采用方案一：

`docker compose + 后端环境变量化 + 前端 Nginx 静态托管 + 外部 MySQL/Redis`

选择原因：

- 与当前仓库边界一致
- 能直接复用现有 MySQL / Redis 服务
- 容器职责单一，后续扩展和维护成本最低

## 架构设计

### 1. 容器边界

本次只定义两个新服务：

- `backend`
- `frontend`

不在新编排中创建：

- `mysql`
- `redis`

数据库和缓存通过外部网络服务名访问：

- `mysql`
- `redis`

具体服务名由部署环境通过环境变量注入。

### 2. 后端运行方式

后端容器职责：

- 安装依赖
- 构建 `nest-admin`
- 以生产模式启动 `node dist/src/main env=prod`

关键要求：

- 保留当前项目依赖 `env=prod` 的配置选择方式
- 端口默认暴露 `3000`
- 所有数据库、Redis、JWT 和端口参数支持环境变量覆盖
- 上传目录使用数据卷挂载

### 3. 前端运行方式

前端容器采用多阶段构建：

1. Node 阶段执行 `npm install` 和 `npm run build`
2. Nginx 阶段托管 `dist`

Nginx 职责：

- 提供前端静态资源
- 支持 Vue history 路由回退到 `index.html`
- 将 `/api` 请求代理到 `backend:3000`

### 4. 网络连接

`backend` 和 `frontend` 加入一个外部已存在的 Docker network。

这个 network 同时连接：

- 现有 MySQL 容器
- 现有 Redis 容器
- 新的后端容器
- 新的前端容器

这样后端可以直接通过服务名访问外部 MySQL / Redis。

### 5. 存储设计

后端 `upload` 目录需要持久化挂载。

原因：

- 用户上传附件和头像都依赖 `upload`
- 容器重建不能丢失文件
- 前端静态文件访问路径最终仍由后端 `/api/static/*` 和 `/api/upload/*` 提供

## 配置设计

### 1. 后端配置来源

后端改为优先读取环境变量，默认值只作为本地开发兜底。

建议支持以下环境变量：

- `APP_PORT`
- `MYSQL_HOST`
- `MYSQL_PORT`
- `MYSQL_USER`
- `MYSQL_PASSWORD`
- `MYSQL_DATABASE`
- `MYSQL_SYNCHRONIZE`
- `REDIS_HOST`
- `REDIS_PORT`
- `REDIS_DB`
- `REDIS_PASSWORD`
- `JWT_SECRET`
- `SYSTEM_MENU_SYNC_ON_BOOT`

策略：

- 容器部署时全部通过 `.env` 或 `docker-compose.yml` 注入
- 非容器本地开发时仍可使用当前默认值

### 2. 数据库同步策略

生产部署默认：

- `MYSQL_SYNCHRONIZE=false`

数据库结构初始化与变更由 SQL 脚本和受控迁移承担，不依赖自动同步。

### 3. 前端配置策略

前端保留当前 `sys.config.js` 的运行时域名判断机制，但生产环境配置需要调整为真实部署域名。

本次不重写前端整套配置模型，只保证：

- Docker 部署时前端能通过 Nginx 正常访问
- `/api` 可正确代理到后端
- `window.location.origin` 与生产域名匹配时能进入正确运行环境

如部署使用单域名同源访问，推荐使用你的正式业务域名，并保持：

- 页面域名：`https://<正式域名>`
- 接口域名：`https://<正式域名>/api`

## 文件设计

本次预计新增或修改以下文件：

### 新增

- `docker-compose.yml`
- `nest-admin/Dockerfile`
- `nest-admin/.dockerignore`
- `nest-admin-frontend/Dockerfile`
- `nest-admin-frontend/.dockerignore`
- `nest-admin-frontend/nginx.conf`
- 根目录 `.env.example`
- 根目录部署说明文档

### 修改

- `nest-admin/config/index.ts`
- `nest-admin/src/modules/global/redis.service.ts`
- `nest-admin-frontend/sys.config.js`
- 可选：补充 README 或部署文档

## 数据初始化流程

首次部署时，不在 `compose` 内自动创建库表。

统一使用当前仓库推荐脚本：

1. 创建数据库 `psd2`
2. 执行 `nest-admin/doc/sql/bootstrap/init_system.sql`
3. 执行 `nest-admin/doc/sql/bootstrap/verify_system.sql`

这样可以避免把历史 `init_all.sql`、`repair_*`、`fix_*` 脚本混进正式初始化流程。

## 错误处理与边界

### 1. 外部服务名错误

如果 `MYSQL_HOST` 或 `REDIS_HOST` 配错，后端容器会启动失败或运行时报连接错误。

本次不额外引入复杂重试编排，只保证：

- 配置项明确
- 启动方式固定
- 日志可直接暴露连接失败原因

### 2. 前端与后端不同源

当前后端已开启 CORS。若未来不是同域部署，仍可工作，但本次推荐同域部署以降低复杂度。

### 3. 上传目录权限

挂载卷目录必须可被 Node 进程写入，否则上传接口会失败。

### 4. SQL 初始化顺序

必须先确认外部 MySQL 可访问，再执行 `bootstrap` SQL。新方案不在容器启动时自动做库初始化，避免重复执行和污染现有数据。

## 验证设计

完成部署后至少验证：

1. `docker compose up -d` 后前后端容器正常运行
2. 后端能成功连接外部 MySQL 和 Redis
3. 前端首页能正常打开
4. `/api` 代理正常
5. 登录接口正常
6. 上传文件后，重建 `backend` 容器文件仍在
7. 首次初始化后的 `verify_system.sql` 输出关键项为已就绪

## 范围

本次范围只包括：

- Docker 部署文件补齐
- 后端配置环境变量化
- 前端 Nginx 静态托管方案
- 外部 MySQL / Redis 接入
- 首次部署初始化与验证说明

本次不包括：

- 引入 Kubernetes
- 改造成多环境多集群发布体系
- 增加数据库迁移框架
- 自动化 SSL 证书签发
- 现有业务模块逻辑改造

## 第一阶段交付

第一阶段完成后，应达到以下结果：

- 可以通过 `docker compose` 启动前后端
- 后端可连接外部 MySQL / Redis
- 前端可通过 Nginx 正常访问并代理 API
- 上传目录持久化
- 首次部署有明确 SQL 初始化和验证步骤
