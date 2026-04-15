# 系统初始化脚本

这套脚本用于在以下场景快速恢复或初始化数据库：

1. 本地数据库丢失后的恢复
2. 新环境首次部署初始化
3. 需要从零构建一套最小可运行系统数据库时

## 目录结构

1. `01_schema.sql`
作用：创建当前系统运行所需的核心表结构。
包含：
- `nest_admin.sql`
- `create_workflow_tables.sql`
- `create_sys_file.sql`
- `create_sys_message.sql`

2. `02_base_data.sql`
作用：初始化最小基础数据。
包含：
- 管理员账号
- 角色
- 用户角色关联
- 基础部门
- 系统配置

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

5. `init_system.sql`
作用：统一入口，按顺序执行以上脚本。

## 推荐执行方式

先创建数据库：

```sql
CREATE DATABASE IF NOT EXISTS psd2 DEFAULT CHARSET utf8mb4;
```

然后执行：

```bash
mysql -u root -p12345678 -D psd2 < init_system.sql
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

## 注意事项

1. `nest_admin.sql` 为结构基线，但系统演进过程中仍可能新增字段，建议执行后启动一次后端，让 TypeORM 在开发环境补齐遗漏字段。
2. 如果是生产环境，不建议长期依赖 `synchronize: true`，应逐步将新增字段沉淀到结构基线。
3. 历史 `repair_*` / `fix_*` 脚本保留为迁移参考，不再作为新环境必跑项。
