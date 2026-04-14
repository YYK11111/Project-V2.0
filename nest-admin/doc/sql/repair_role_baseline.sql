-- Repair framework role baseline without resetting business tables.
-- Safe to re-run: uses upsert/merge style writes where possible.

SET FOREIGN_KEY_CHECKS = 0;

-- 1. Ensure framework baseline roles exist and carry expected keys.
INSERT INTO `sys_role` (`id`, `name`, `permissionKey`, `dataPermissionType`, `order`, `is_active`, `remark`, `create_time`, `create_user`, `update_user`)
VALUES
  (1, '超级管理员', 'admin', 'self', '1', '1', '系统超级管理员', NOW(), 'system', 'system'),
  (2, '普通用户', 'user', 'self', '2', '1', '普通用户', NOW(), 'system', 'system')
ON DUPLICATE KEY UPDATE
  `name` = VALUES(`name`),
  `permissionKey` = VALUES(`permissionKey`),
  `dataPermissionType` = VALUES(`dataPermissionType`),
  `order` = VALUES(`order`),
  `is_active` = VALUES(`is_active`),
  `remark` = VALUES(`remark`),
  `update_user` = 'system';

-- Normalize any leftover temporary/common role back to framework baseline key.
UPDATE `sys_role`
SET `name` = '普通用户',
    `permissionKey` = 'user',
    `dataPermissionType` = 'self',
    `order` = '2',
    `is_active` = '1',
    `remark` = '普通用户',
    `update_user` = 'system'
WHERE `id` = 2;

-- 2. Ensure admin user keeps the admin role.
INSERT IGNORE INTO `sys_user_role` (`userId`, `roleId`) VALUES (1, 1);

-- 3. Ensure the normal test user keeps the framework user role.
INSERT IGNORE INTO `sys_user_role` (`userId`, `roleId`) VALUES (3, 2);

-- 4. Keep admin role mapped to all active menus, including business extensions.
INSERT IGNORE INTO `sys_role_menu` (`role_id`, `menu_id`)
SELECT 1, `id`
FROM `sys_menu`
WHERE `is_active` = '1' AND `is_delete` IS NULL;

-- 5. Give the framework user role a minimal usable menu set.
DELETE FROM `sys_role_menu` WHERE `role_id` = 2;
INSERT INTO `sys_role_menu` (`role_id`, `menu_id`)
SELECT 2, `id`
FROM `sys_menu`
WHERE `path` IN ('index', 'content')
   OR `name` IN ('首页', '工作台', '内容管理', '文章管理', '文章列表');

SET FOREIGN_KEY_CHECKS = 1;

-- Verification snapshot
SELECT `id`, `name`, `permissionKey`, `is_active`, `dataPermissionType`, `order`
FROM `sys_role`
ORDER BY `id`;

SELECT `roleId`, COUNT(*) AS `user_count`
FROM `sys_user_role`
GROUP BY `roleId`
ORDER BY `roleId`;

SELECT `role_id`, COUNT(*) AS `menu_count`
FROM `sys_role_menu`
GROUP BY `role_id`
ORDER BY `role_id`;
