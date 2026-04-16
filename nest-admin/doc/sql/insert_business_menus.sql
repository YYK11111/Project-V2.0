-- 插入业务管理模块为顶级菜单（已移除"业务管理"父级容器）
-- 所有模块直接作为一级菜单

-- 插入项目管理菜单（顶级菜单，type=catalog支持子路由）
INSERT INTO sys_menu (name, path, component, type, parent_id, `order`, icon, is_hidden, is_active, is_delete, permissionKey, create_time, create_user) 
VALUES ('项目管理', 'projectManage', 'business/projectManage/index', 'catalog', NULL, '4', 'project', '0', '1', NULL, 'business/projectManage', NOW(), 'system');

-- 插入任务管理菜单（顶级菜单）
INSERT INTO sys_menu (name, path, component, type, parent_id, `order`, icon, is_hidden, is_active, is_delete, permissionKey, create_time, create_user) 
VALUES ('任务管理', 'taskManage', 'business/taskManage/index', 'catalog', NULL, '5', 'task', '0', '1', NULL, 'business/taskManage', NOW(), 'system');

-- 插入工单管理菜单（顶级菜单）
INSERT INTO sys_menu (name, path, component, type, parent_id, `order`, icon, is_hidden, is_active, is_delete, permissionKey, create_time, create_user) 
VALUES ('工单管理', 'ticketManage', 'business/ticketManage/index', 'catalog', NULL, '6', 'ticket', '0', '1', NULL, 'business/ticketManage', NOW(), 'system');

-- 插入文档管理菜单（顶级菜单）
INSERT INTO sys_menu (name, path, component, type, parent_id, `order`, icon, is_hidden, is_active, is_delete, permissionKey, create_time, create_user) 
VALUES ('文档管理', 'documentManage', 'business/documentManage/index', 'catalog', NULL, '7', 'document', '0', '1', NULL, 'business:document', NOW(), 'system');

-- 验证插入结果
SELECT '顶级业务菜单插入完成' AS status;
SELECT id, name, path, component, type, parent_id, permissionKey, `order` FROM sys_menu WHERE name IN ('项目管理', '任务管理', '工单管理', '文档管理') ORDER BY `order`;
