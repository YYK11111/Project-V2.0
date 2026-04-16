# 密码与认证迁移上线手册

## 适用范围

本手册对应以下改造：

1. 用户密码从可逆加密改为服务端单向哈希
2. 登录态从前端可读 token 改为 `HttpOnly Cookie`
3. 服务端增加 Redis 在线会话校验
4. 前端移除 token 持久化
5. 工作流接口不再信任前端传入的 `userId`

## 当前代码状态

当前仓库已完成以下准备：

1. 后端密码校验已切换为哈希逻辑
2. 登录接口已改为服务端下发 `admin_session` Cookie
3. `AuthGuard` 已支持从 Cookie 读取登录态并校验 Redis 会话
4. 前端主链路已不再读写 token
5. 密码迁移脚本已独立化，不依赖 `AppModule`

## 已知前提

1. 生产前后端同站部署
2. Docker 部署
3. 生产环境大概率不使用 HTTPS
4. 当前 Cookie 配置使用：
   - `HttpOnly: true`
   - `SameSite: 'lax'`
   - `Secure: false`
   - `Path: '/'`

## 上线前检查

上线前必须逐项确认：

1. 数据库已完整备份
2. Redis 可正常连接
3. 前后端镜像已基于当前代码构建完成
4. 已在预发或本地验证：
   - `nest-admin` 执行 `npm run build` 通过
   - `nest-admin-frontend` 执行 `npm run type-check` 通过
5. 关键单测已通过：

```bash
cd nest-admin
npx jest src/modules/auth/auth.service.spec.ts src/modules/auth/auth.guard.spec.ts src/modules/auth/auth.controller.spec.ts src/common/utils/password.spec.ts src/modulesBusi/workflow/controller.spec.ts src/modulesBusi/workflow/service.spec.ts --runInBand
```

6. 根目录契约检查可执行：

```bash
cd /path/to/Project-V2.0
npm run check:api-contract
```

## 数据库现状检查

先确认用户表密码列状态：

```bash
mysql -uroot -p12345678 -D psd2 -e "SHOW COLUMNS FROM sys_user LIKE 'password%';"
```

预期至少包含：

1. `password`
2. `passwordVersion`

再检查是否仍存在空密码用户：

```bash
mysql -uroot -p12345678 -D psd2 -e "SELECT id, name, email FROM sys_user WHERE password IS NULL OR password = '';"
```

如果结果非空，必须先处理这些账号，再执行正式迁移。

## 迁移前 dry-run

正式迁移前，先执行 dry-run：

```bash
cd nest-admin
npx ts-node -r tsconfig-paths/register scripts/migrate-passwords.ts env=dev --dry-run
```

输出字段说明：

1. `total`: 扫描到的用户数
2. `migrated`: 如果正式执行，将会迁移的用户数
3. `skipped`: 已经是哈希密码的用户数
4. `failed`: 无法自动迁移的用户数
5. `failedRecords`: 失败原因明细

只有在 `failed = 0` 时，才建议执行正式迁移。

## 正式迁移命令

在维护窗口内执行：

```bash
cd nest-admin
npx ts-node -r tsconfig-paths/register scripts/migrate-passwords.ts env=dev
```

如果生产环境配置通过 `env=prod` 读取，则执行：

```bash
cd nest-admin
npx ts-node -r tsconfig-paths/register scripts/migrate-passwords.ts env=prod
```

执行完成后，脚本会输出 JSON 汇总结果。

## 空密码或脏数据用户处理

如果 dry-run 输出类似：

```json
{
  "id": "1",
  "reason": "密码为空，无法迁移"
}
```

说明该用户必须人工修复。

### 处理方式 A：直接设置临时密码

先生成哈希：

```bash
cd nest-admin
node -e "const {randomBytes,scryptSync}=require('crypto'); const password='YourTempPassword#2026'; const salt=randomBytes(16).toString('hex'); const hash=scryptSync(password,salt,64).toString('hex'); console.log('scrypt$'+salt+'$'+hash);"
```

再写回数据库：

```bash
mysql -uroot -p12345678 -D psd2 -e 'UPDATE sys_user SET password="替换成上一步生成的哈希", passwordVersion="2" WHERE id=目标用户ID;'
```

### 处理方式 B：要求用户先走重置密码流程

如果该用户不是必须立即登录的系统账号，也可以在迁移前先让其完成密码重置，再重新执行 dry-run。

## Docker 发布顺序

建议发布顺序：

1. 进入维护窗口
2. 备份数据库
3. 执行 dry-run，确认 `failed = 0`
4. 执行正式迁移
5. 部署后端新镜像
6. 部署前端新镜像
7. 执行上线后冒烟验证
8. 结束维护窗口

## 上线后冒烟验证

至少验证以下场景：

1. 使用已迁移账号登录成功
2. 浏览器响应头中存在 `Set-Cookie: admin_session=...`
3. 刷新页面后仍保持登录态
4. 退出登录后 Cookie 被清理
5. 在线用户列表只有管理员可访问
6. 普通用户访问在线用户接口会被拒绝
7. 工作流待办、审批、撤回、转交等接口不再接受前端伪造 `userId`
8. 管理员强退在线用户后，对方会话失效

## 回滚策略

这次改造最关键的回滚点是数据库备份。

### 可以回滚的内容

1. 前端镜像
2. 后端镜像
3. 数据库

### 回滚顺序

1. 先回滚前后端镜像
2. 如果密码迁移导致实际登录不可恢复，再恢复数据库备份

### 注意

不要尝试把哈希密码“逆向还原”为旧 AES 密文。唯一可靠回滚方式是数据库备份恢复。

## 风险提示

1. 当前生产大概率不使用 HTTPS，因此 Cookie 不能开启 `Secure`
2. `HttpOnly Cookie` 可以防止前端 JS 读取登录态，但不能解决纯 HTTP 传输链路被窃听的问题
3. 如果生产代理层会改写 Cookie 或吞掉 `Set-Cookie`，会表现为“登录成功后刷新掉线”
4. 迁移脚本当前只会处理能识别的旧 AES 密文；脏数据必须人工修复

## 推荐上线后立即执行的核查命令

检查是否还有未迁移用户：

```bash
cd nest-admin
npx ts-node -r tsconfig-paths/register scripts/migrate-passwords.ts env=prod --dry-run
```

如果输出中：

1. `failed = 0`
2. `migrated = 0`

说明当前生产库的密码状态已全部完成迁移或已是哈希格式。
