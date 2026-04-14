-- ========================================
-- Nest Admin 系统一键初始化脚本
-- ========================================
-- 使用方法：
-- 1. 先创建数据库: CREATE DATABASE psd2 DEFAULT CHARSET utf8mb4;
-- 2. 执行本脚本: mysql -u root -p123456 psd2 < init_complete.sql
-- ========================================

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- ========================================
-- 步骤1: 创建所有表结构
-- ========================================

-- sys_config 系统配置表
DROP TABLE IF EXISTS `sys_config`;
CREATE TABLE `sys_config` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `create_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `update_time` datetime DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  `is_delete` char(1) DEFAULT NULL COMMENT '是否删除',
  `create_user` varchar(255) DEFAULT NULL COMMENT '创建人',
  `update_user` varchar(255) DEFAULT NULL COMMENT '更新人',
  `system_name` varchar(255) DEFAULT NULL,
  `system_logo` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- sys_dept 部门表
DROP TABLE IF EXISTS `sys_dept`;
CREATE TABLE `sys_dept` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `create_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `update_time` datetime DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  `parent_id` bigint DEFAULT NULL COMMENT '父级id',
  `is_delete` char(1) DEFAULT NULL COMMENT '是否删除',
  `create_user` varchar(255) DEFAULT NULL COMMENT '创建人',
  `update_user` varchar(255) DEFAULT NULL COMMENT '更新人',
  `name` varchar(255) DEFAULT NULL COMMENT '部门名称',
  PRIMARY KEY (`id`),
  KEY `FK_92dad1cb42d3b62bc9f2e8e58ba` (`parent_id`),
  CONSTRAINT `FK_92dad1cb42d3b62bc9f2e8e58ba` FOREIGN KEY (`parent_id`) REFERENCES `sys_dept` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- sys_dept_closure 部门关联表
DROP TABLE IF EXISTS `sys_dept_closure`;
CREATE TABLE `sys_dept_closure` (
  `id_ancestor` bigint NOT NULL,
  `id_descendant` bigint NOT NULL,
  PRIMARY KEY (`id_ancestor`,`id_descendant`),
  KEY `IDX_cfc440ee3ad8e00d7706a5769b` (`id_ancestor`),
  KEY `IDX_aec3172874d6b45638d3c50566` (`id_descendant`),
  CONSTRAINT `FK_aec3172874d6b45638d3c505667` FOREIGN KEY (`id_descendant`) REFERENCES `sys_dept` (`id`) ON DELETE CASCADE,
  CONSTRAINT `FK_cfc440ee3ad8e00d7706a5769b1` FOREIGN KEY (`id_ancestor`) REFERENCES `sys_dept` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- sys_login_log 登录日志表
DROP TABLE IF EXISTS `sys_login_log`;
CREATE TABLE `sys_login_log` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `create_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `update_time` datetime DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  `is_delete` char(1) DEFAULT NULL COMMENT '是否删除',
  `is_success` char(1) NOT NULL DEFAULT '1' COMMENT '是否登录成功',
  `session` varchar(200) DEFAULT NULL COMMENT '会话编号',
  `msg` varchar(500) NOT NULL DEFAULT '登录成功' COMMENT '提示消息',
  `create_user` varchar(255) DEFAULT NULL COMMENT '创建人',
  `update_user` varchar(255) DEFAULT NULL COMMENT '更新人',
  `account` varchar(255) DEFAULT NULL COMMENT '登录账号',
  `password` varchar(255) DEFAULT NULL COMMENT '登录密码',
  `ip` varchar(255) DEFAULT NULL COMMENT 'ip地址',
  `address` varchar(255) DEFAULT NULL COMMENT '登录地点',
  `browser` varchar(255) DEFAULT NULL COMMENT '浏览器类型',
  `os` varchar(255) DEFAULT NULL COMMENT '操作系统',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- sys_menu 菜单表
DROP TABLE IF EXISTS `sys_menu`;
CREATE TABLE `sys_menu` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `create_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `update_time` datetime DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  `desc` varchar(100) DEFAULT NULL COMMENT '菜单描述',
  `parent_id` bigint DEFAULT NULL COMMENT '父级id',
  `order` varchar(8) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL DEFAULT '1' COMMENT '排序',
  `path` varchar(100) DEFAULT NULL COMMENT '路由地址',
  `component` varchar(100) DEFAULT NULL COMMENT '组件路径',
  `type` enum('catalog','menu','button') CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL DEFAULT 'catalog' COMMENT '菜单类型，默认catalog',
  `icon` varchar(100) DEFAULT NULL COMMENT '菜单图标',
  `is_hidden` char(1) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL DEFAULT '0' COMMENT '是否隐藏: 1是，0否，默认0',
  `is_active` char(1) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL DEFAULT '1' COMMENT '是否激活: 1是，0否，默认1',
  `is_delete` char(1) DEFAULT NULL COMMENT '是否删除: NULL未删除，1删除',
  `create_user` varchar(255) DEFAULT NULL COMMENT '创建人',
  `update_user` varchar(255) DEFAULT NULL COMMENT '更新人',
  `name` varchar(255) DEFAULT NULL COMMENT '菜单名称',
  `permissionKey` varchar(30) DEFAULT NULL COMMENT '权限字符',
  PRIMARY KEY (`id`) USING BTREE,
  KEY `FK_7cef4adcf9b01b2c6f14d52b0f3` (`parent_id`) USING BTREE,
  CONSTRAINT `FK_7cef4adcf9b01b2c6f14d52b0f3` FOREIGN KEY (`parent_id`) REFERENCES `sys_menu` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- sys_menu_closure 菜单关联表
DROP TABLE IF EXISTS `sys_menu_closure`;
CREATE TABLE `sys_menu_closure` (
  `id_ancestor` bigint NOT NULL,
  `id_descendant` bigint NOT NULL,
  PRIMARY KEY (`id_ancestor`,`id_descendant`),
  KEY `IDX_ee0a4003eda64ae8081ebdde04` (`id_ancestor`),
  KEY `IDX_78f742978fc6b23a674732d027` (`id_descendant`),
  CONSTRAINT `FK_78f742978fc6b23a674732d027c` FOREIGN KEY (`id_descendant`) REFERENCES `sys_menu` (`id`) ON DELETE CASCADE,
  CONSTRAINT `FK_ee0a4003eda64ae8081ebdde042` FOREIGN KEY (`id_ancestor`) REFERENCES `sys_menu` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- sys_notice 通知表
DROP TABLE IF EXISTS `sys_notice`;
CREATE TABLE `sys_notice` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `create_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `update_time` datetime DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  `is_delete` char(1) DEFAULT NULL COMMENT '是否删除',
  `is_active` char(1) NOT NULL DEFAULT '1' COMMENT '是否激活',
  `content` varchar(200) DEFAULT NULL COMMENT '公告内容',
  `remark` varchar(200) DEFAULT NULL COMMENT '备注',
  `create_user` varchar(255) DEFAULT NULL COMMENT '创建人',
  `update_user` varchar(255) DEFAULT NULL COMMENT '更新人',
  `title` varchar(255) DEFAULT NULL COMMENT '公告标题',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- sys_role 角色表
DROP TABLE IF EXISTS `sys_role`;
CREATE TABLE `sys_role` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `create_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `update_time` datetime DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  `remark` varchar(200) DEFAULT NULL COMMENT '备注',
  `order` varchar(8) NOT NULL DEFAULT '1' COMMENT '排序',
  `is_active` char(1) NOT NULL DEFAULT '1' COMMENT '是否激活',
  `is_delete` char(1) DEFAULT NULL COMMENT '是否删除',
  `create_user` varchar(255) DEFAULT NULL COMMENT '创建人',
  `update_user` varchar(255) DEFAULT NULL COMMENT '更新人',
  `name` varchar(255) DEFAULT NULL,
  `permissionKey` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- sys_role_menu 角色菜单关联表
DROP TABLE IF EXISTS `sys_role_menu`;
CREATE TABLE `sys_role_menu` (
  `roleId` bigint NOT NULL,
  `menuId` bigint NOT NULL,
  PRIMARY KEY (`roleId`,`menuId`),
  KEY `IDX_bdd82e5f4c2bedda41f89b69ba` (`roleId`),
  KEY `IDX_7e0fc887979c9dee7a3dbed7eb` (`menuId`),
  CONSTRAINT `fk_sys_menu_role` FOREIGN KEY (`menuId`) REFERENCES `sys_menu` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_sys_role_menu` FOREIGN KEY (`roleId`) REFERENCES `sys_role` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- sys_user 用户表
DROP TABLE IF EXISTS `sys_user`;
CREATE TABLE `sys_user` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `password` varchar(50) NOT NULL DEFAULT 's3wmd2VReF1IjZhK59gLBY0OjYlzjA==' COMMENT '密码',
  `avatar` varchar(255) DEFAULT NULL COMMENT '头像地址',
  `phone` varchar(11) DEFAULT NULL,
  `create_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `update_time` datetime DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  `dept_id` bigint DEFAULT NULL COMMENT '部门id',
  `is_active` char(1) NOT NULL DEFAULT '1' COMMENT '是否激活',
  `is_delete` char(1) DEFAULT NULL COMMENT '是否删除',
  `email` varchar(255) DEFAULT NULL,
  `gender` enum('man','woamn') DEFAULT NULL COMMENT '性别',
  `create_user` varchar(255) DEFAULT NULL COMMENT '创建人',
  `update_user` varchar(255) DEFAULT NULL COMMENT '更新人',
  `name` varchar(255) DEFAULT NULL,
  `nickname` varchar(255) DEFAULT NULL COMMENT '昵称',
  PRIMARY KEY (`id`),
  KEY `FK_96bde34263e2ae3b46f011124ac` (`dept_id`),
  CONSTRAINT `FK_96bde34263e2ae3b46f011124ac` FOREIGN KEY (`dept_id`) REFERENCES `sys_dept` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- sys_user_role 用户角色关联表
DROP TABLE IF EXISTS `sys_user_role`;
CREATE TABLE `sys_user_role` (
  `userId` bigint NOT NULL,
  `roleId` bigint NOT NULL,
  PRIMARY KEY (`userId`,`roleId`),
  KEY `IDX_3ec9b31612c830bf0221b9e7f3` (`roleId`),
  KEY `IDX_3c879483a655a9387b8c487608` (`userId`),
  CONSTRAINT `fk_sys_user_role_role` FOREIGN KEY (`roleId`) REFERENCES `sys_role` (`id`),
  CONSTRAINT `fk_sys_user_role_user` FOREIGN KEY (`userId`) REFERENCES `sys_user` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ========================================
-- 步骤2: 插入菜单数据
-- ========================================
INSERT INTO `sys_menu` (`id`, `create_time`, `update_time`, `desc`, `parent_id`, `order`, `path`, `component`, `type`, `icon`, `is_hidden`, `is_active`, `is_delete`, `create_user`, `update_user`, `name`) VALUES 
(5, '2024-08-06 22:03:07', '2024-10-27 17:43:22', '', NULL, '1', 'system', '', 'catalog', 'system', '0', '1', NULL, '', 'admin', '系统管理'),
(6, '2024-08-06 22:20:45', '2024-10-27 17:40:42', '用户管理', 5, '1', 'users', 'system/users/index', 'menu', 'user', '0', '1', NULL, '', 'admin', '用户管理'),
(7, '2024-08-06 22:22:56', '2024-10-27 17:43:12', '', 5, '2', 'roles', 'system/roles/index', 'menu', 'peoples', '0', '1', NULL, '', 'admin', '角色管理'),
(8, '2024-08-06 22:30:06', '2024-10-27 17:44:03', '', 5, '3', 'menus', 'system/menus/index', 'menu', 'tree-table', '0', '1', NULL, '', 'admin', '菜单管理'),
(9, '2024-08-15 00:04:06', '2024-10-27 17:50:00', '', NULL, '2', 'content', '', 'catalog', 'dict', '0', '1', NULL, '', 'admin', '内容管理'),
(10, '2024-08-15 00:06:53', '2024-10-27 17:45:47', '通知管理', 5, '4', 'notices', 'system/notices/index', 'menu', 'message', '0', '1', NULL, '', 'admin', '通知管理'),
(11, '2024-08-15 00:10:33', '2024-10-27 17:47:14', '系统监控', NULL, '2', 'systemMonitor', '', 'catalog', 'monitor', '0', '1', NULL, '', 'admin', '系统监控'),
(12, '2024-08-15 00:22:13', '2024-10-27 17:48:21', '登录日志', 11, '1', 'loginLog', 'systemMonitor/loginLog/index', 'menu', 'log', '0', '1', NULL, '', 'admin', '登录日志'),
(14, '2024-08-15 00:23:45', '2024-10-27 17:47:53', '', 11, '1', 'onlineUser', 'systemMonitor/onlineUser/index', 'menu', 'online', '0', '1', NULL, '', 'admin', '在线用户'),
(15, '2024-08-15 00:27:21', '2024-10-27 17:49:41', '服务监控', 11, '2', 'osInfo', 'systemMonitor/osInfo/index', 'menu', 'druid', '0', '1', NULL, '', 'admin', '服务监控'),
(16, '2024-08-15 00:33:54', '2024-10-27 17:50:07', '文章管理', 9, '1', 'articleManage', '', 'catalog', 'clipboard', '0', '1', NULL, '', 'admin', '文章管理'),
(17, '2024-08-15 00:36:52', '2024-10-27 17:46:28', '配置管理', 5, '5', 'configs', 'system/configs/index', 'menu', 'swagger', '0', '1', NULL, '', 'admin', '配置管理'),
(18, '2024-08-15 00:41:15', '2024-10-02 15:34:35', '首页', NULL, '1', 'index', '', 'catalog', 'dashboard', '0', '1', NULL, '', '', '首页'),
(19, '2024-08-15 00:44:53', '2024-10-27 17:50:34', '首页', 18, '1', 'index', 'index/index', 'menu', 'dashboard', '1', '1', NULL, '', 'admin', '首页'),
(23, '2024-10-19 00:24:43', '2024-10-19 00:25:25', NULL, 16, '1', 'index', 'content/articleManage/index', 'menu', NULL, '1', '1', NULL, 'admin', 'admin', '文章列表'),
(24, '2024-10-19 00:26:05', NULL, NULL, 16, '2', 'aev', 'content/articleManage/aev', 'menu', NULL, '1', '1', NULL, 'admin', NULL, '{新增}');

-- ========================================
-- 步骤3: 插入菜单关联数据（树形结构）
-- ========================================
INSERT INTO `sys_menu_closure` (`id_ancestor`, `id_descendant`) VALUES 
(5,5),(5,6),(5,7),(5,8),(5,10),(5,17),
(6,6),(7,7),(8,8),(9,9),(9,16),
(10,10),(11,11),(11,12),(11,14),(11,15),
(12,12),(14,14),(15,15),
(16,16),(16,23),(16,24),
(17,17),(18,18),(18,19),
(19,19),(23,23),(24,24);

-- ========================================
-- 步骤4: 插入基础数据（用户、角色、权限）
-- ========================================

-- 4.1 插入超级管理员用户
-- 密码: 123456 (AES加密后: s3wmd2VReF1IjZhK59gLBY0OjYlzjA==)
INSERT INTO `sys_user` (`id`, `name`, `nickname`, `password`, `email`, `phone`, `is_active`, `create_time`, `create_user`) 
VALUES (1, 'NestAdmin', '超级管理员', 's3wmd2VReF1IjZhK59gLBY0OjYlzjA==', 'admin@nestadmin.com', '13800138000', '1', NOW(), 'system');

-- 4.2 插入角色数据
INSERT INTO `sys_role` (`id`, `name`, `permissionKey`, `order`, `is_active`, `remark`, `create_time`, `create_user`, `update_user`) 
VALUES 
(1, '超级管理员', 'admin', '1', '1', '系统超级管理员', NOW(), 'system', 'system'),
(2, '普通用户', 'user', '2', '1', '普通用户', NOW(), 'system', 'system');

-- 4.3 插入用户角色关联
INSERT INTO `sys_user_role` (`userId`, `roleId`) VALUES (1, 1);

-- 4.4 为超级管理员角色分配所有菜单权限
INSERT INTO `sys_role_menu` (`roleId`, `menuId`) 
SELECT 1, id FROM `sys_menu`;

-- 4.5 插入系统配置
INSERT INTO `sys_config` (`id`, `system_name`, `system_logo`, `create_time`, `create_user`, `update_user`) 
VALUES (1, 'Nest Admin', '/static/logo.svg', NOW(), 'system', 'system');

-- 4.6 插入顶级部门
INSERT INTO `sys_dept` (`id`, `name`, `parent_id`, `create_time`, `create_user`, `update_user`) 
VALUES (1, '总部', NULL, NOW(), 'system', 'system');

SET FOREIGN_KEY_CHECKS = 1;

-- ========================================
-- 验证初始化结果
-- ========================================
SELECT '========================================' AS '';
SELECT '✅ Nest Admin 系统初始化完成！' AS '';
SELECT '========================================' AS '';

SELECT '用户数量' AS '统计项', COUNT(*) AS '数量' FROM sys_user
UNION ALL SELECT '角色数量', COUNT(*) FROM sys_role
UNION ALL SELECT '用户角色关联', COUNT(*) FROM sys_user_role
UNION ALL SELECT '菜单数量', COUNT(*) FROM sys_menu
UNION ALL SELECT '菜单关联(树形)', COUNT(*) FROM sys_menu_closure
UNION ALL SELECT '角色菜单权限', COUNT(*) FROM sys_role_menu
UNION ALL SELECT '系统配置', COUNT(*) FROM sys_config
UNION ALL SELECT '部门数量', COUNT(*) FROM sys_dept;

SELECT 
  u.name AS '用户名',
  r.name AS '角色名',
  r.permissionKey AS '权限标识',
  (SELECT COUNT(*) FROM sys_role_menu WHERE roleId = r.id) AS '菜单权限数'
FROM sys_user u
LEFT JOIN sys_user_role ur ON u.id = ur.userId
LEFT JOIN sys_role r ON ur.roleId = r.id;

-- ========================================
-- 登录信息
-- ========================================
SELECT '========================================' AS '';
SELECT '🔐 登录信息' AS '';
SELECT '用户名: NestAdmin' AS '';
SELECT '密码: 123456' AS '';
SELECT '========================================' AS '';
