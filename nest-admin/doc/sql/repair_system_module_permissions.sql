-- Enrich remaining system modules with granular permissions.

SET FOREIGN_KEY_CHECKS = 0;

SET @menus_menu_id = (SELECT id FROM sys_menu WHERE path = 'menus' AND is_delete IS NULL ORDER BY id LIMIT 1);
SET @notices_menu_id = (SELECT id FROM sys_menu WHERE path = 'notices' AND is_delete IS NULL ORDER BY id LIMIT 1);
SET @configs_menu_id = (SELECT id FROM sys_menu WHERE path = 'configs' AND is_delete IS NULL ORDER BY id LIMIT 1);
SET @admin_role_id = (SELECT id FROM sys_role WHERE permissionKey = 'admin' ORDER BY id LIMIT 1);

-- Menus
INSERT INTO sys_menu (name, `desc`, parent_id, `order`, path, component, type, icon, is_hidden, is_active, create_user, update_user, permissionKey)
SELECT '菜单树', '菜单树查询权限', @menus_menu_id, '151', 'menus-tree', '', 'button', '', '1', '1', 'system', 'system', 'system/menus/tree'
WHERE @menus_menu_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM sys_menu WHERE permissionKey = 'system/menus/tree' AND is_delete IS NULL);
INSERT INTO sys_menu (name, `desc`, parent_id, `order`, path, component, type, icon, is_hidden, is_active, create_user, update_user, permissionKey)
SELECT '菜单详情', '菜单详情权限', @menus_menu_id, '152', 'menus-getOne', '', 'button', '', '1', '1', 'system', 'system', 'system/menus/getOne'
WHERE @menus_menu_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM sys_menu WHERE permissionKey = 'system/menus/getOne' AND is_delete IS NULL);
INSERT INTO sys_menu (name, `desc`, parent_id, `order`, path, component, type, icon, is_hidden, is_active, create_user, update_user, permissionKey)
SELECT '菜单类型', '菜单类型查询权限', @menus_menu_id, '153', 'menus-getTypes', '', 'button', '', '1', '1', 'system', 'system', 'system/menus/getTypes'
WHERE @menus_menu_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM sys_menu WHERE permissionKey = 'system/menus/getTypes' AND is_delete IS NULL);
INSERT INTO sys_menu (name, `desc`, parent_id, `order`, path, component, type, icon, is_hidden, is_active, create_user, update_user, permissionKey)
SELECT '新增菜单', '新增菜单权限', @menus_menu_id, '154', 'menus-add', '', 'button', '', '1', '1', 'system', 'system', 'system/menus/add'
WHERE @menus_menu_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM sys_menu WHERE permissionKey = 'system/menus/add' AND is_delete IS NULL);
INSERT INTO sys_menu (name, `desc`, parent_id, `order`, path, component, type, icon, is_hidden, is_active, create_user, update_user, permissionKey)
SELECT '修改菜单', '修改菜单权限', @menus_menu_id, '155', 'menus-update', '', 'button', '', '1', '1', 'system', 'system', 'system/menus/update'
WHERE @menus_menu_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM sys_menu WHERE permissionKey = 'system/menus/update' AND is_delete IS NULL);
INSERT INTO sys_menu (name, `desc`, parent_id, `order`, path, component, type, icon, is_hidden, is_active, create_user, update_user, permissionKey)
SELECT '删除菜单', '删除菜单权限', @menus_menu_id, '156', 'menus-delete', '', 'button', '', '1', '1', 'system', 'system', 'system/menus/delete'
WHERE @menus_menu_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM sys_menu WHERE permissionKey = 'system/menus/delete' AND is_delete IS NULL);
INSERT INTO sys_menu (name, `desc`, parent_id, `order`, path, component, type, icon, is_hidden, is_active, create_user, update_user, permissionKey)
SELECT '管理受保护菜单', '管理受保护菜单权限', @menus_menu_id, '157', 'menus-manageProtected', '', 'button', '', '1', '1', 'system', 'system', 'system/menus/manageProtected'
WHERE @menus_menu_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM sys_menu WHERE permissionKey = 'system/menus/manageProtected' AND is_delete IS NULL);

-- Notices
INSERT INTO sys_menu (name, `desc`, parent_id, `order`, path, component, type, icon, is_hidden, is_active, create_user, update_user, permissionKey)
SELECT '公告详情', '公告详情权限', @notices_menu_id, '171', 'notices-getOne', '', 'button', '', '1', '1', 'system', 'system', 'system/notices/getOne'
WHERE @notices_menu_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM sys_menu WHERE permissionKey = 'system/notices/getOne' AND is_delete IS NULL);
INSERT INTO sys_menu (name, `desc`, parent_id, `order`, path, component, type, icon, is_hidden, is_active, create_user, update_user, permissionKey)
SELECT '新增公告', '新增公告权限', @notices_menu_id, '172', 'notices-add', '', 'button', '', '1', '1', 'system', 'system', 'system/notices/add'
WHERE @notices_menu_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM sys_menu WHERE permissionKey = 'system/notices/add' AND is_delete IS NULL);
INSERT INTO sys_menu (name, `desc`, parent_id, `order`, path, component, type, icon, is_hidden, is_active, create_user, update_user, permissionKey)
SELECT '修改公告', '修改公告权限', @notices_menu_id, '173', 'notices-update', '', 'button', '', '1', '1', 'system', 'system', 'system/notices/update'
WHERE @notices_menu_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM sys_menu WHERE permissionKey = 'system/notices/update' AND is_delete IS NULL);
INSERT INTO sys_menu (name, `desc`, parent_id, `order`, path, component, type, icon, is_hidden, is_active, create_user, update_user, permissionKey)
SELECT '删除公告', '删除公告权限', @notices_menu_id, '174', 'notices-delete', '', 'button', '', '1', '1', 'system', 'system', 'system/notices/delete'
WHERE @notices_menu_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM sys_menu WHERE permissionKey = 'system/notices/delete' AND is_delete IS NULL);

-- Configs
INSERT INTO sys_menu (name, `desc`, parent_id, `order`, path, component, type, icon, is_hidden, is_active, create_user, update_user, permissionKey)
SELECT '配置修改', '系统配置修改权限', @configs_menu_id, '191', 'configs-update', '', 'button', '', '1', '1', 'system', 'system', 'system/configs/update'
WHERE @configs_menu_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM sys_menu WHERE permissionKey = 'system/configs/update' AND is_delete IS NULL);

INSERT IGNORE INTO sys_role_menu (role_id, menu_id)
SELECT @admin_role_id, id
FROM sys_menu
WHERE @admin_role_id IS NOT NULL
  AND is_delete IS NULL
  AND permissionKey IN (
    'system/menus/tree', 'system/menus/getOne', 'system/menus/getTypes', 'system/menus/add', 'system/menus/update', 'system/menus/delete', 'system/menus/manageProtected',
    'system/notices/getOne', 'system/notices/add', 'system/notices/update', 'system/notices/delete',
    'system/configs/update'
  );

SET FOREIGN_KEY_CHECKS = 1;
