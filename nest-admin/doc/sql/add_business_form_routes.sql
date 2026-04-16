-- =====================================================
-- 添加业务模块表单路由（隐藏路由，不显示在菜单中）
-- =====================================================

-- 获取业务模块父级菜单ID
SET @businessId = (SELECT id FROM sys_menu WHERE path = 'business' AND type = 'catalog');

-- 获取各业务菜单ID
SET @projectId = (SELECT id FROM sys_menu WHERE path = 'projectManage' AND parent_id = @businessId);
SET @taskId = (SELECT id FROM sys_menu WHERE path = 'taskManage' AND parent_id = @businessId);
SET @ticketId = (SELECT id FROM sys_menu WHERE path = 'ticketManage' AND parent_id = @businessId);
SET @documentId = (SELECT id FROM sys_menu WHERE path = 'documentManage' AND parent_id = @businessId);

-- =====================================================
-- 项目管理 - 表单路由
-- =====================================================
INSERT INTO sys_menu (name, path, component, type, parent_id, `order`, icon, is_hidden, is_active, is_delete, permissionKey, create_time, create_user) 
VALUES ('项目表单', 'form', 'business/projectManage/form', 'menu', @projectId, '99', '', '1', '1', NULL, 'business/projects/update', NOW(), 'system')
ON DUPLICATE KEY UPDATE update_time = NOW();

-- =====================================================
-- 任务管理 - 表单路由
-- =====================================================
INSERT INTO sys_menu (name, path, component, type, parent_id, `order`, icon, is_hidden, is_active, is_delete, permissionKey, create_time, create_user) 
VALUES ('任务表单', 'form', 'business/taskManage/form', 'menu', @taskId, '99', '', '1', '1', NULL, 'business/tasks/update', NOW(), 'system')
ON DUPLICATE KEY UPDATE update_time = NOW();

-- =====================================================
-- 工单管理 - 表单路由
-- =====================================================
INSERT INTO sys_menu (name, path, component, type, parent_id, `order`, icon, is_hidden, is_active, is_delete, permissionKey, create_time, create_user) 
VALUES ('工单表单', 'form', 'business/ticketManage/form', 'menu', @ticketId, '99', '', '1', '1', NULL, 'business/tickets/update', NOW(), 'system')
ON DUPLICATE KEY UPDATE update_time = NOW();

-- =====================================================
-- 文档管理 - 表单路由
-- =====================================================
INSERT INTO sys_menu (name, path, component, type, parent_id, `order`, icon, is_hidden, is_active, is_delete, permissionKey, create_time, create_user) 
VALUES ('文档表单', 'form', 'business/documentManage/form', 'menu', @documentId, '99', '', '1', '1', NULL, 'business:document:edit', NOW(), 'system')
ON DUPLICATE KEY UPDATE update_time = NOW();

-- =====================================================
-- 创建缺失的表单组件文件
-- =====================================================
-- 注意：以下文件需要在 nest-admin-frontend/src/views/business/ 目录下创建：
-- - ticketManage/form.vue
-- - documentManage/form.vue

SELECT '业务表单路由添加完成！' AS message;
