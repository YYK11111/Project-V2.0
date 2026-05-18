# Docker 部署说明

这份说明用于仓库的 Docker 部署。当前仓库提供两种方式：

1. 本机构建后直接在服务器上 `build` 启动：根目录 `docker-compose.yml`
2. 本地打包并推送到镜像仓库，服务器只拉取镜像启动：根目录 `docker-compose.prod.yml`

前端和后端都以 `frontend`、`backend` 两个服务启动，并通过外部 Docker network 连接既有 MySQL 和 Redis。

## 前提

1. 服务器已经安装 Docker 和 Docker Compose。
2. 已经准备好可用的 MySQL 和 Redis 实例。
3. 已经创建外部网络，默认名称由 `EXTERNAL_NETWORK` 控制，未设置时使用 `project-v2-network`。
4. 已经准备好后端数据库，例如 `psd2`。
5. 已经确认后端初始化脚本可用，路径为 `nest-admin/doc/sql/bootstrap/`。

## 首次部署

1. 拉取代码并进入仓库根目录。
2. 按需设置环境变量。
   - `MYSQL_HOST`
   - `MYSQL_PORT`
   - `MYSQL_DATABASE`
   - `MYSQL_USER`
   - `MYSQL_PASSWORD`
   - `MYSQL_SYNCHRONIZE`
   - `JWT_SECRET`
   - `SYSTEM_MENU_SYNC_ON_BOOT`
   - `REDIS_HOST`
   - `REDIS_PORT`
   - `REDIS_DB`
   - `REDIS_PASSWORD`
   - `BACKEND_PORT`
   - `FRONTEND_PORT`
   - `EXTERNAL_NETWORK`
   - `UPLOAD_VOLUME`
3. 启动服务。

```bash
docker compose up -d --build
```

4. 检查容器状态。

```bash
docker compose ps
```

## 阿里云镜像仓库部署

如果你使用阿里云 ACR，本仓库已经提供生产版编排文件 `docker-compose.prod.yml`，默认镜像地址如下：

- `crpi-oygnku9mfq22z345.cn-guangzhou.personal.cr.aliyuncs.com/yykpms/project-v2-backend:latest`
- `crpi-oygnku9mfq22z345.cn-guangzhou.personal.cr.aliyuncs.com/yykpms/project-v2-frontend:latest`

### 本地构建并推送

建议直接打 Linux 服务器常见平台：

```bash
docker login --username=yyk110911 crpi-oygnku9mfq22z345.cn-guangzhou.personal.cr.aliyuncs.com

docker buildx build \
  --platform linux/amd64 \
  -t crpi-oygnku9mfq22z345.cn-guangzhou.personal.cr.aliyuncs.com/yykpms/project-v2-backend:latest \
  --push \
  ./nest-admin

docker buildx build \
  --platform linux/amd64 \
  -t crpi-oygnku9mfq22z345.cn-guangzhou.personal.cr.aliyuncs.com/yykpms/project-v2-frontend:latest \
  --push \
  ./nest-admin-frontend
```

### 服务器拉取并启动

先复制环境变量模板：

```bash
cp .env.example .env
```

如果服务器位于阿里云同区域 VPC，优先使用内网地址登录：

```bash
docker login --username=yyk110911 crpi-oygnku9mfq22z345-vpc.cn-guangzhou.personal.cr.aliyuncs.com
```

如果不是，就用公网地址：

```bash
docker login --username=yyk110911 crpi-oygnku9mfq22z345.cn-guangzhou.personal.cr.aliyuncs.com
```

然后启动生产版编排：

```bash
docker compose -f docker-compose.prod.yml --env-file .env pull
docker compose -f docker-compose.prod.yml --env-file .env up -d
docker compose -f docker-compose.prod.yml ps
```

后续更新镜像时：

```bash
docker compose -f docker-compose.prod.yml --env-file .env pull
docker compose -f docker-compose.prod.yml --env-file .env up -d
```

## 初始化 SQL

首次部署时，后端数据库需要先导入初始化脚本。推荐使用 `bootstrap` 入口，不要手工拼接历史修复脚本。

1. 创建数据库。

```sql
CREATE DATABASE IF NOT EXISTS psd2 DEFAULT CHARSET utf8mb4;
```

2. 导入初始化脚本。

```bash
cd nest-admin/doc/sql/bootstrap
mysql -u root -p -D psd2 < init_system.sql
```

3. 导入完成后执行校验脚本。

```bash
mysql -u root -p -D psd2 < verify_system.sql
```

4. 如果当前环境需要额外菜单或可选模块，先确认 `bootstrap/README.md` 的说明，再决定是否补跑单独的可选脚本。

## 验证步骤

1. 确认后端健康运行。
   - 访问 `http://<后端地址>:${BACKEND_PORT:-3000}/api`
   - 正常情况下应能看到接口层返回，而不是容器报错或数据库连接错误
2. 确认前端可访问。
   - 访问 `http://<前端地址>:${FRONTEND_PORT:-80}`
   - 页面应能正常加载，并能发起 `/api` 请求
3. 确认初始化数据已生效。
   - 使用管理员账号登录
   - 检查菜单、角色、部门、基础配置是否存在
4. 确认 Redis 可用。
   - 登录后检查在线状态、缓存或会话相关功能是否正常
5. 确认持久化卷已挂载。
   - 上传文件后重新启动容器
   - 文件不应丢失

## 常见问题

1. 后端连不上数据库。
   - 检查 `MYSQL_HOST`、`MYSQL_PORT`、账号、密码和数据库名
   - 检查 MySQL 是否允许容器网络访问
2. 前端页面能打开但接口报错。
   - 检查后端服务是否监听在 `3000`
   - 检查 Nginx 是否正确反向代理 `/api`
3. 初始化脚本失败。
   - 先确认数据库已创建
   - 再确认脚本是在 `nest-admin/doc/sql/bootstrap/` 目录下执行
4. 容器无法加入网络。
   - 先创建外部网络，再执行 `docker compose up -d`
   - 例如：`docker network create project-v2-network`
