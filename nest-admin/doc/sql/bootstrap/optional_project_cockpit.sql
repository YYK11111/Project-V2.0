SET NAMES utf8mb4;

INSERT INTO sys_menu (name, path, component, type, parent_id, `order`, icon, is_hidden, is_active, is_delete, permissionKey, create_time, create_user, update_user)
SELECT '驾驶舱', 'cockpit', 'business/projectManage/cockpit', 'menu', NULL, '17', 'dashboard', '0', '1', NULL, 'business/projects/cockpit', NOW(), 'system', 'system'
WHERE NOT EXISTS (SELECT 1 FROM sys_menu WHERE component = 'business/projectManage/cockpit' AND is_delete IS NULL);

UPDATE sys_menu
SET name = '驾驶舱',
    parent_id = NULL,
    `type` = 'menu',
    `path` = 'cockpit',
    component = 'business/projectManage/cockpit',
    permissionKey = 'business/projects/cockpit',
    icon = 'dashboard'
WHERE component = 'business/projectManage/cockpit'
  AND is_delete IS NULL;

UPDATE sys_menu
SET is_delete = '1'
WHERE path = 'cockpit'
  AND component = ''
  AND type = 'catalog'
  AND is_delete IS NULL;

UPDATE sys_menu
SET is_delete = '1'
WHERE path = 'projectCockpit'
  AND component = 'business/projectManage/cockpit'
  AND is_delete IS NULL;

INSERT IGNORE INTO sys_role_menu (role_id, menu_id)
SELECT role.id, menu.id
FROM sys_role role
JOIN sys_menu menu ON menu.is_delete IS NULL
WHERE role.permissionKey IN ('admin', 'user')
  AND role.is_delete IS NULL
  AND menu.component = 'business/projectManage/cockpit';
