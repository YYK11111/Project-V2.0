SET NAMES utf8mb4;

-- workflow 顶级目录
INSERT INTO sys_menu (create_time, update_time, `desc`, parent_id, `order`, path, component, type, icon, is_hidden, is_active, is_delete, create_user, update_user, name, permissionKey)
SELECT NOW(), NOW(), '工作流管理', NULL, '3', 'workflow', '', 'catalog', 'workflow', '0', '1', NULL, 'admin', 'admin', '工作流管理', NULL
WHERE NOT EXISTS (SELECT 1 FROM sys_menu WHERE path = 'workflow' AND is_delete IS NULL);

SET @workflowId := (SELECT id FROM sys_menu WHERE path = 'workflow' AND is_delete IS NULL LIMIT 1);

INSERT INTO sys_menu (create_time, update_time, `desc`, parent_id, `order`, path, component, type, icon, is_hidden, is_active, is_delete, create_user, update_user, name, permissionKey)
SELECT NOW(), NOW(), '流程定义管理', @workflowId, '1', 'index', 'business/workflow/index', 'menu', 'setting', '0', '1', NULL, 'admin', 'admin', '流程管理', NULL
WHERE NOT EXISTS (SELECT 1 FROM sys_menu WHERE component = 'business/workflow/index' AND is_delete IS NULL);

INSERT INTO sys_menu (create_time, update_time, `desc`, parent_id, `order`, path, component, type, icon, is_hidden, is_active, is_delete, create_user, update_user, name, permissionKey)
SELECT NOW(), NOW(), '流程设计器', @workflowId, '2', 'designer', 'business/workflow/designer', 'menu', 'edit', '1', '1', NULL, 'admin', 'admin', '流程设计器', NULL
WHERE NOT EXISTS (SELECT 1 FROM sys_menu WHERE component = 'business/workflow/designer' AND is_delete IS NULL);

INSERT INTO sys_menu (create_time, update_time, `desc`, parent_id, `order`, path, component, type, icon, is_hidden, is_active, is_delete, create_user, update_user, name, permissionKey)
SELECT NOW(), NOW(), '自动触发配置', @workflowId, '3', 'businessConfig', 'business/workflow/businessConfig', 'menu', 'config', '0', '1', NULL, 'admin', 'admin', '自动触发配置', NULL
WHERE NOT EXISTS (SELECT 1 FROM sys_menu WHERE component = 'business/workflow/businessConfig' AND is_delete IS NULL);

INSERT INTO sys_menu (create_time, update_time, `desc`, parent_id, `order`, path, component, type, icon, is_hidden, is_active, is_delete, create_user, update_user, name, permissionKey)
SELECT NOW(), NOW(), '我的待办审批', @workflowId, '4', 'tasks', 'business/workflow/tasks', 'menu', 'todo', '0', '1', NULL, 'admin', 'admin', '我的待办', NULL
WHERE NOT EXISTS (SELECT 1 FROM sys_menu WHERE component = 'business/workflow/tasks' AND is_delete IS NULL);

INSERT INTO sys_menu (create_time, update_time, `desc`, parent_id, `order`, path, component, type, icon, is_hidden, is_active, is_delete, create_user, update_user, name, permissionKey)
SELECT NOW(), NOW(), '流程实例列表', @workflowId, '5', 'instances', 'business/workflow/instances', 'menu', 'list', '0', '1', NULL, 'admin', 'admin', '流程实例', NULL
WHERE NOT EXISTS (SELECT 1 FROM sys_menu WHERE component = 'business/workflow/instances' AND is_delete IS NULL);

-- 业务核心菜单
INSERT INTO sys_menu (name, path, component, type, parent_id, `order`, icon, is_hidden, is_active, is_delete, permissionKey, create_time, create_user, update_user)
SELECT '项目管理', 'projectManage', 'business/projectManage/index', 'catalog', NULL, '4', 'project', '0', '1', NULL, 'business:project', NOW(), 'system', 'system'
WHERE NOT EXISTS (SELECT 1 FROM sys_menu WHERE path = 'projectManage' AND is_delete IS NULL);

INSERT INTO sys_menu (name, path, component, type, parent_id, `order`, icon, is_hidden, is_active, is_delete, permissionKey, create_time, create_user, update_user)
SELECT '任务管理', 'taskManage', 'business/taskManage/index', 'catalog', NULL, '5', 'task', '0', '1', NULL, 'business:task', NOW(), 'system', 'system'
WHERE NOT EXISTS (SELECT 1 FROM sys_menu WHERE path = 'taskManage' AND is_delete IS NULL);

INSERT INTO sys_menu (name, path, component, type, parent_id, `order`, icon, is_hidden, is_active, is_delete, permissionKey, create_time, create_user, update_user)
SELECT '工单管理', 'ticketManage', 'business/ticketManage/index', 'catalog', NULL, '6', 'ticket', '0', '1', NULL, 'business:ticket', NOW(), 'system', 'system'
WHERE NOT EXISTS (SELECT 1 FROM sys_menu WHERE path = 'ticketManage' AND is_delete IS NULL);

INSERT INTO sys_menu (name, path, component, type, parent_id, `order`, icon, is_hidden, is_active, is_delete, permissionKey, create_time, create_user, update_user)
SELECT '文档管理', 'documentManage', 'business/documentManage/index', 'catalog', NULL, '7', 'document', '0', '1', NULL, 'business:document', NOW(), 'system', 'system'
WHERE NOT EXISTS (SELECT 1 FROM sys_menu WHERE path = 'documentManage' AND is_delete IS NULL);

-- 管理员授权全部菜单
INSERT IGNORE INTO sys_role_menu (role_id, menu_id)
SELECT 1, id FROM sys_menu WHERE is_delete IS NULL;
