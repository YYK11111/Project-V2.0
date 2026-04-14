-- ========================================
-- Nest Admin 系统完整初始化脚本
-- ========================================
-- 使用说明：
-- 1. 确保数据库已创建：CREATE DATABASE IF NOT EXISTS psd2 DEFAULT CHARSET utf8mb4;
-- 2. 先执行 nest_admin.sql 创建所有表结构
-- 3. 执行 sys_menu.sql 插入菜单数据
-- 4. 执行 sys_menu_closure.sql 插入菜单关联数据
-- 5. 最后执行本脚本初始化用户、角色等基础数据
-- ========================================

-- 设置编码和外键检查
SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- ========================================
-- 1. 初始化用户数据
-- ========================================
-- 删除已存在的用户（避免重复）
DELETE FROM sys_user WHERE name IN ('admin', 'NestAdmin');

-- 插入超级管理员用户
-- 密码: 123456 (AES加密后: s3wmd2VReF1IjZhK59gLBY0OjYlzjA==)
INSERT INTO sys_user (
  id, name, nickname, password, email, phone, 
  is_active, is_delete, create_time, create_user
) VALUES (
  1, 'admin', '超级管理员', 's3wmd2VReF1IjZhK59gLBY0OjYlzjA==', 
  'admin@nestadmin.com', '13800138000',
  '1', NULL, NOW(), 'system'
);

-- ========================================
-- 2. 初始化角色数据
-- ========================================
-- 先清空角色，因为需要重新分配权限
DELETE FROM sys_role;

-- 插入角色数据
INSERT INTO sys_role (
  id, name, permissionKey, `order`, is_active, remark, 
  create_time, create_user, update_user
) VALUES 
(1, '超级管理员', 'admin', '1', '1', '系统超级管理员', NOW(), 'system', 'system'),
(2, '普通用户', 'user', '2', '1', '普通用户', NOW(), 'system', 'system');

-- ========================================
-- 3. 初始化用户角色关联
-- ========================================
-- 清空用户角色关联（避免重复）
DELETE FROM sys_user_role;

-- 为 admin 用户分配超级管理员角色
INSERT INTO sys_user_role (userId, roleId) VALUES (1, 1);

-- ========================================
-- 4. 初始化角色菜单权限
-- ========================================
-- 清空已存在的角色菜单关联
DELETE FROM sys_role_menu;

-- 为超级管理员角色分配所有菜单权限
-- 注意：这里从 sys_menu 表查询，所以必须先导入菜单数据
INSERT INTO sys_role_menu (roleId, menuId) 
SELECT 1, id FROM sys_menu;

-- ========================================
-- 5. 初始化系统配置
-- ========================================
-- 清空已存在的配置
DELETE FROM sys_config;

-- 插入系统配置
INSERT INTO sys_config (
  id, system_name, system_logo, 
  create_time, create_user, update_user
) VALUES (
  1, 'Nest Admin', '/static/logo.svg', 
  NOW(), 'system', 'system'
);

-- ========================================
-- 6. 初始化部门数据
-- ========================================
-- 清空已存在的部门（可选）
DELETE FROM sys_dept;

-- 插入顶级部门
INSERT INTO sys_dept (
  id, name, parent_id, 
  create_time, create_user, update_user
) VALUES (
  1, '总部', NULL, 
  NOW(), 'system', 'system'
);

-- ========================================
-- 验证初始化结果
-- ========================================
SELECT '========================================' AS '';
SELECT 'Nest Admin 系统初始化完成！' AS '';
SELECT '========================================' AS '';

-- 显示统计信息
SELECT '用户数量' AS '统计项', COUNT(*) AS '数量' FROM sys_user
UNION ALL
SELECT '角色数量', COUNT(*) FROM sys_role
UNION ALL
SELECT '用户角色关联', COUNT(*) FROM sys_user_role
UNION ALL
SELECT '菜单数量', COUNT(*) FROM sys_menu
UNION ALL
SELECT '菜单关联(树形结构)', COUNT(*) FROM sys_menu_closure
UNION ALL
SELECT '角色菜单权限', COUNT(*) FROM sys_role_menu
UNION ALL
SELECT '部门数量', COUNT(*) FROM sys_dept
UNION ALL
SELECT '系统配置', COUNT(*) FROM sys_config;

-- 显示用户及角色信息
SELECT 
  u.id AS '用户ID',
  u.name AS '用户名',
  u.email AS '邮箱',
  r.name AS '角色名',
  r.permissionKey AS '权限标识',
  (SELECT COUNT(*) FROM sys_role_menu WHERE roleId = r.id) AS '菜单权限数'
FROM sys_user u
LEFT JOIN sys_user_role ur ON u.id = ur.userId
LEFT JOIN sys_role r ON ur.roleId = r.id
ORDER BY u.id;

SET FOREIGN_KEY_CHECKS = 1;

-- ========================================
-- 登录信息
-- ========================================
-- 用户名: admin
-- 密码: 123456
-- ========================================
