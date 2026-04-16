# 系统初始化脚本

这套脚本用于在以下场景快速恢复或初始化数据库：

1. 本地数据库丢失后的恢复
2. 新环境首次部署初始化
3. 需要从零构建一套最小可运行系统数据库时

## 目录结构

1. `01_schema.sql`
作用：创建当前系统运行所需的核心表结构。
包含：
- 当前真实运行库导出的正式结构基线 `generated/schema_seed_raw.sql`

2. `02_base_data.sql`
作用：初始化最小基础数据。
包含：
- 管理员账号
- 角色
- 用户角色关联
- 基础部门
- 系统配置
- 当前已切换为“正式基础数据基线模式”：直接导入从真实运行库导出的最小种子数据

3. `03_menu_and_permissions.sql`
作用：恢复当前系统有效的菜单、按钮权限和角色绑定。
特点：
- 吸收任务评论、任务汇报、工作流等当前功能的最终菜单状态
- 不要求手工逐个运行历史菜单修复脚本
- 当前已切换为“正式基线模式”：直接导入从真实运行库导出的 `sys_menu`、`sys_menu_closure`、`sys_role_menu` 最终种子数据

4. `04_optional_modules.sql`
作用：恢复可选扩展能力。
当前包含：
- 工作流业务配置相关脚本
- 消息中心菜单与权限
- 项目管理驾驶舱菜单入口
- 内容管理/文档管理命名收口
- 通知管理命名收口（系统公告）

5. `init_system.sql`
作用：统一入口，按顺序执行以上脚本。

6. `verify_system.sql`
作用：初始化完成后的快速校验脚本。
可检查：
- 管理员账号
- admin/user 角色
- 任务管理/任务评论/任务汇报/工作流/消息中心菜单
- 角色菜单绑定
- workflow/file/message 关键表
- `task_time_log.attachments`
- `task_time_log.progress`

## 推荐执行方式

先创建数据库：

```sql
CREATE DATABASE IF NOT EXISTS psd2 DEFAULT CHARSET utf8mb4;
```

然后执行：

```bash
mysql -u root -p12345678 -D psd2 < init_system.sql
```

执行完成后，建议再运行一次校验：

```bash
mysql -u root -p12345678 -D psd2 < verify_system.sql
```

## 默认说明

1. 该入口以当前仓库真实运行状态为基线，不再要求手工拼装多个 `repair_*`、`fix_*`、`restore_*` 脚本。
2. 这套脚本主要保证：
- 系统可启动
- 管理员可登录
- 核心菜单可见
- 任务评论、任务汇报、工作流等当前能力可访问
3. 如需更细的环境定制，请在此基础上追加环境专属脚本，而不要修改历史修复脚本顺序。

## 关于菜单权限基线更新

`03_menu_and_permissions.sql` 依赖 `bootstrap/generated/` 下的种子文件：

1. `sys_menu_seed.sql`
2. `sys_menu_closure_seed.sql`
3. `sys_role_menu_seed.sql`

这些文件代表当前系统“菜单与权限的最终真实状态”。

如果后续菜单结构、按钮权限或角色绑定发生调整，建议在确认本地数据库状态正确后重新导出这些种子文件，而不是继续叠加新的 `repair_*` 脚本到初始化入口中。

## 关于基础数据基线更新

`02_base_data.sql` 依赖以下最小基础数据种子文件：

1. `sys_user_seed.sql`
2. `sys_role_base_seed.sql`
3. `sys_user_role_seed.sql`
4. `sys_config_seed.sql`
5. `sys_dept_seed.sql`
6. `sys_dept_closure_seed.sql`

这些文件只保留系统启动所需的最小基线数据，不应混入本地测试用户、业务演示数据或环境专属配置。

## 注意事项

1. `01_schema.sql` 现已切换为“正式结构基线模式”，直接使用当前真实数据库导出的结构，不再依赖旧的 `nest_admin.sql + create_*` 组合入口。
2. `02_base_data.sql` 现已切换为“正式基础数据基线模式”，直接恢复最小系统基础数据。
3. 如果后续实体结构有新增字段，建议在确认本地数据库状态正确后重新导出 `generated/schema_seed_raw.sql`，避免继续依赖运行时自动补字段。
4. 如果后续基础数据基线发生调整，建议同步更新 `generated/` 下的基础种子文件，而不是回退到 `init_all.sql / init_data.sql` 的历史拼装方式。
5. 如果是生产环境，不建议长期依赖 `synchronize: true`，应逐步将新增字段沉淀到结构基线。
6. 历史 `repair_*` / `fix_*` 脚本保留为迁移参考，不再作为新环境必跑项。
