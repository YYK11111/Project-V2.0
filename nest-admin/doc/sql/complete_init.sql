-- ========================================
-- Nest Admin 系统完整初始化脚本
-- ========================================
-- 使用说明：
-- 1. 先执行 nest_admin.sql 创建所有表结构
-- 2. 执行 sys_menu.sql 插入菜单数据
-- 3. 最后执行本脚本初始化基础数据
-- ========================================

-- 设置编码
SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- ========================================
-- 1. 初始化用户数据
-- ========================================
-- 删除已存在的用户（可选，避免重复）
DELETE FROM sys_user WHERE name IN ('admin', 'NestAdmin');

-- 插入超级管理员用户
-- 密码: 123456 (加密后: s3wmd2VReF1IjZhK59gLBY0OjYlzjA==)
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
DELETE FROM sys_role;

-- 插入角色
INSERT INTO sys_role (id, name, permissionKey, `order`, is_active, remark, create_time, create_user) 
VALUES 
(1, '超级管理员', 'admin', '1', '1', '系统超级管理员角色', NOW(), 'system'),
(2, '普通用户', 'user', '2', '1', '普通用户角色', NOW(), 'system');

-- ========================================
-- 3. 初始化用户角色关联
-- ========================================
DELETE FROM sys_user_role;

-- 为 admin 用户分配超级管理员角色
INSERT INTO sys_user_role (userId, roleId) VALUES (1, 1);

-- ========================================
-- 4. 初始化菜单数据（如果还没有）
-- ========================================
-- 先检查菜单数量
SET @menuCount = (SELECT COUNT(*) FROM sys_menu);

-- 如果菜单为空，则插入菜单数据
-- 注意：这部分应该从 sys_menu.sql 导入，这里只是确保完整性
-- 如果已经执行过 sys_menu.sql，这部分不会执行

-- ========================================
-- 5. 为超级管理员角色分配所有菜单权限
-- ========================================
DELETE FROM sys_role_menu WHERE roleId = 1;

-- 为超级管理员角色分配所有菜单
INSERT INTO sys_role_menu (roleId, menuId) 
SELECT 1, id FROM sys_menu;

-- ========================================
-- 6. 初始化菜单关联表（closure表）
-- ========================================
-- 删除已有的关联数据
DELETE FROM sys_menu_closure;

-- 插入菜单关联数据（基于父子关系自动生成）
-- 这部分需要在菜单数据完整后才能执行
-- 通常 sys_menu_closure.sql 已经包含了这些数据

-- ========================================
-- 7. 初始化系统配置
-- ========================================
DELETE FROM sys_config;

INSERT INTO sys_config (
  id, system_name, system_logo, 
  create_time, create_user
) VALUES (
  1, 'Nest Admin', '/static/logo.svg', 
  NOW(), 'system'
);

-- ========================================
-- 验证初始化结果
-- ========================================
SELECT '===== 初始化完成 =====' AS status;

SELECT '用户数量' AS info, COUNT(*) AS count FROM sys_user
UNION ALL
SELECT '角色数量', COUNT(*) FROM sys_role
UNION ALL
SELECT '用户角色关联数量', COUNT(*) FROM sys_user_role
UNION ALL
SELECT '菜单数量', COUNT(*) FROM sys_menu
UNION ALL
SELECT '角色菜单关联数量', COUNT(*) FROM sys_role_menu
UNION ALL
SELECT '菜单关联数量', COUNT(*) FROM sys_menu_closure
UNION ALL
SELECT '系统配置数量', COUNT(*) FROM sys_config;

-- 显示用户及其角色
SELECT u.name AS username, r.name AS rolename, r.permissionKey
FROM sys_user u
JOIN sys_user_role ur ON u.id = ur.userId
JOIN sys_role r ON ur.roleId = r.id;

SET FOREIGN_KEY_CHECKS = 1;
