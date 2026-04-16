SET NAMES utf8mb4;

INSERT INTO sys_menu (name, path, component, type, parent_id, `order`, icon, is_hidden, is_active, is_delete, permissionKey, create_time, create_user, update_user)
SELECT '消息中心', 'messageCenter', '', 'catalog', NULL, '16', 'Bell', '0', '1', NULL, 'system:messageCenter', NOW(), 'system', 'system'
WHERE NOT EXISTS (SELECT 1 FROM sys_menu WHERE path = 'messageCenter' AND is_delete IS NULL);

SET @message_center_id := (SELECT id FROM sys_menu WHERE path = 'messageCenter' AND is_delete IS NULL ORDER BY id LIMIT 1);

INSERT INTO sys_menu (name, path, component, type, parent_id, `order`, icon, is_hidden, is_active, is_delete, permissionKey, create_time, create_user, update_user)
SELECT '消息列表', 'index', 'system/messageCenter/index', 'menu', @message_center_id, '1', 'Bell', '0', '1', NULL, 'system/messages/list', NOW(), 'system', 'system'
WHERE @message_center_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM sys_menu WHERE component = 'system/messageCenter/index' AND is_delete IS NULL);

INSERT INTO sys_menu (name, path, component, type, parent_id, `order`, icon, is_hidden, is_active, is_delete, permissionKey, create_time, create_user, update_user)
SELECT '标记已读', 'mark-read', '', 'button', @message_center_id, '2', '', '1', '1', NULL, 'system/messages/markRead', NOW(), 'system', 'system'
WHERE @message_center_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM sys_menu WHERE permissionKey = 'system/messages/markRead' AND is_delete IS NULL);

INSERT INTO sys_menu (name, path, component, type, parent_id, `order`, icon, is_hidden, is_active, is_delete, permissionKey, create_time, create_user, update_user)
SELECT '全部已读', 'mark-all-read', '', 'button', @message_center_id, '3', '', '1', '1', NULL, 'system/messages/markAllRead', NOW(), 'system', 'system'
WHERE @message_center_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM sys_menu WHERE permissionKey = 'system/messages/markAllRead' AND is_delete IS NULL);

INSERT INTO sys_menu (name, path, component, type, parent_id, `order`, icon, is_hidden, is_active, is_delete, permissionKey, create_time, create_user, update_user)
SELECT '删除消息', 'delete', '', 'button', @message_center_id, '4', '', '1', '1', NULL, 'system/messages/delete', NOW(), 'system', 'system'
WHERE @message_center_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM sys_menu WHERE permissionKey = 'system/messages/delete' AND is_delete IS NULL);

INSERT IGNORE INTO sys_role_menu (role_id, menu_id)
SELECT role.id, menu.id
FROM sys_role role
JOIN sys_menu menu ON menu.is_delete IS NULL
WHERE role.permissionKey IN ('admin', 'user')
  AND role.is_delete IS NULL
  AND (
    menu.path = 'messageCenter'
    OR menu.component = 'system/messageCenter/index'
    OR menu.permissionKey IN ('system/messages/list', 'system/messages/markRead', 'system/messages/markAllRead', 'system/messages/delete')
  );
