SET NAMES utf8mb4;

-- 当前真实基础数据基线
-- 说明：此脚本仅恢复系统启动所需的最小基础数据，不包含业务演示数据。

SET FOREIGN_KEY_CHECKS = 0;

DELETE FROM sys_user_role;
DELETE FROM sys_role;
DELETE FROM sys_dept_closure;
DELETE FROM sys_dept;
DELETE FROM sys_config;
DELETE FROM sys_user WHERE id = 1;

SET FOREIGN_KEY_CHECKS = 1;

SOURCE generated/sys_user_seed.sql;
SOURCE generated/sys_role_base_seed.sql;
SOURCE generated/sys_user_role_seed.sql;
SOURCE generated/sys_config_seed.sql;
SOURCE generated/sys_dept_seed.sql;
SOURCE generated/sys_dept_closure_seed.sql;
