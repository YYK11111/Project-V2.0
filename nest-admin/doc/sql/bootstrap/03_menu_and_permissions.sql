SET NAMES utf8mb4;

-- 当前最终菜单与权限基线
-- 说明：此脚本直接恢复当前真实可运行状态，不再依赖历史 restore/repair/fix 脚本链。

SET FOREIGN_KEY_CHECKS = 0;

SET @admin_role_id := (SELECT id FROM sys_role WHERE permissionKey = 'admin' ORDER BY id LIMIT 1);
SET @user_role_id := (SELECT id FROM sys_role WHERE permissionKey = 'user' ORDER BY id LIMIT 1);

DELETE FROM sys_role_menu WHERE role_id IN (@admin_role_id, @user_role_id);
DELETE FROM sys_menu_closure;
DELETE FROM sys_menu;

SET FOREIGN_KEY_CHECKS = 1;

SOURCE generated/sys_menu_seed.sql;
SOURCE generated/sys_menu_closure_seed.sql;
SOURCE generated/sys_role_menu_seed.sql;
