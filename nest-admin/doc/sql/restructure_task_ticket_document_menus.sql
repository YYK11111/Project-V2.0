SET NAMES utf8mb4;

SET @taskRoot := (SELECT id FROM sys_menu WHERE path = 'taskManage' AND is_delete IS NULL ORDER BY id LIMIT 1);
SET @ticketRoot := (SELECT id FROM sys_menu WHERE path = 'ticketManage' AND is_delete IS NULL ORDER BY id LIMIT 1);
SET @documentRoot := (SELECT id FROM sys_menu WHERE path = 'documentManage' AND is_delete IS NULL ORDER BY id LIMIT 1);

-- 任务管理：父级目录 + 子级列表入口
UPDATE sys_menu
SET component = '',
    type = 'catalog',
    icon = 'task'
WHERE id = @taskRoot;

INSERT INTO sys_menu (name, path, component, type, parent_id, `order`, icon, is_hidden, is_active, is_delete, permissionKey, create_time, create_user, update_user)
SELECT '任务信息', 'taskInfo', 'business/taskManage/index', 'menu', @taskRoot, '1', 'list', '0', '1', NULL, 'business/taskInfo', NOW(), 'system', 'system'
WHERE @taskRoot IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM sys_menu WHERE parent_id = @taskRoot AND path = 'taskInfo' AND is_delete IS NULL);

-- 工单管理：父级目录 + 子级列表入口
UPDATE sys_menu
SET component = '',
    type = 'catalog',
    icon = 'ticket'
WHERE id = @ticketRoot;

INSERT INTO sys_menu (name, path, component, type, parent_id, `order`, icon, is_hidden, is_active, is_delete, permissionKey, create_time, create_user, update_user)
SELECT '工单信息', 'ticketInfo', 'business/ticketManage/index', 'menu', @ticketRoot, '1', 'list', '0', '1', NULL, 'business/ticketInfo', NOW(), 'system', 'system'
WHERE @ticketRoot IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM sys_menu WHERE parent_id = @ticketRoot AND path = 'ticketInfo' AND is_delete IS NULL);

-- 文档管理：父级目录 + 子级列表入口
UPDATE sys_menu
SET component = '',
    type = 'catalog',
    icon = 'document'
WHERE id = @documentRoot;

INSERT INTO sys_menu (name, path, component, type, parent_id, `order`, icon, is_hidden, is_active, is_delete, permissionKey, create_time, create_user, update_user)
SELECT '文档信息', 'documentInfo', 'business/documentManage/index', 'menu', @documentRoot, '1', 'list', '0', '1', NULL, 'business:document', NOW(), 'system', 'system'
WHERE @documentRoot IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM sys_menu WHERE parent_id = @documentRoot AND path = 'documentInfo' AND is_delete IS NULL);

INSERT IGNORE INTO sys_role_menu (role_id, menu_id)
SELECT 1, id FROM sys_menu WHERE is_delete IS NULL;
