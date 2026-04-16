SET NAMES utf8mb4;

SET @project_manage_id := (
  SELECT id FROM sys_menu
  WHERE path = 'projectManage' AND is_delete IS NULL
  ORDER BY id
  LIMIT 1
);

INSERT INTO sys_menu (name, path, component, type, parent_id, `order`, icon, is_hidden, is_active, is_delete, permissionKey, create_time, create_user, update_user)
SELECT '项目驾驶舱', 'projectCockpit', 'business/projectManage/cockpit', 'menu', @project_manage_id, '1', 'monitor', '0', '1', NULL, 'business/projects/cockpit', NOW(), 'system', 'system'
WHERE @project_manage_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM sys_menu WHERE component = 'business/projectManage/cockpit' AND is_delete IS NULL);

INSERT IGNORE INTO sys_role_menu (role_id, menu_id)
SELECT role.id, menu.id
FROM sys_role role
JOIN sys_menu menu ON menu.component = 'business/projectManage/cockpit' AND menu.is_delete IS NULL
WHERE role.permissionKey IN ('admin', 'user')
  AND role.is_delete IS NULL;
