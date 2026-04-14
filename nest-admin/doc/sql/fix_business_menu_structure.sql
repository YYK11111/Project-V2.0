-- =====================================================
-- 修复业务模块菜单结构：添加列表页
-- =====================================================
-- 问题：当前业务模块只有隐藏的表单页，没有可见的列表页
-- 解决：为每个业务模块添加列表页菜单

-- 确保外键检查关闭
SET FOREIGN_KEY_CHECKS = 0;

-- =====================================================
-- 1. 项目管理
-- =====================================================
-- 获取项目管理的ID
SET @projectId = (SELECT id FROM sys_menu WHERE path = 'projectManage' AND type = 'catalog' AND parent_id IS NULL LIMIT 1);

-- 删除旧的表单页（path 包含 projectManage/form 的）
DELETE FROM sys_menu WHERE path = 'projectManage/form' AND parent_id = @projectId;
DELETE FROM sys_menu WHERE path = '/projectManage/form' AND parent_id = @projectId;

-- 添加项目列表页
INSERT INTO sys_menu (name, path, component, type, parent_id, `order`, icon, is_hidden, is_active, is_delete, permissionKey, create_time, create_user) 
VALUES ('项目列表', 'index', 'business/projectManage/index', 'menu', @projectId, '1', 'list', '0', '1', NULL, 'business:project:list', NOW(), 'system');

-- 重新添加项目表单页（使用相对路径）
INSERT INTO sys_menu (name, path, component, type, parent_id, `order`, icon, is_hidden, is_active, is_delete, permissionKey, create_time, create_user) 
VALUES ('项目表单', 'form', 'business/projectManage/form', 'menu', @projectId, '2', '', '1', '1', NULL, 'business:project:edit', NOW(), 'system');

-- =====================================================
-- 2. 任务管理
-- =====================================================
SET @taskId = (SELECT id FROM sys_menu WHERE path = 'taskManage' AND type = 'catalog' AND parent_id IS NULL LIMIT 1);

DELETE FROM sys_menu WHERE path = 'taskManage/form' AND parent_id = @taskId;
DELETE FROM sys_menu WHERE path = '/taskManage/form' AND parent_id = @taskId;

INSERT INTO sys_menu (name, path, component, type, parent_id, `order`, icon, is_hidden, is_active, is_delete, permissionKey, create_time, create_user) 
VALUES ('任务列表', 'index', 'business/taskManage/index', 'menu', @taskId, '1', 'list', '0', '1', NULL, 'business:task:list', NOW(), 'system');

INSERT INTO sys_menu (name, path, component, type, parent_id, `order`, icon, is_hidden, is_active, is_delete, permissionKey, create_time, create_user) 
VALUES ('任务表单', 'form', 'business/taskManage/form', 'menu', @taskId, '2', '', '1', '1', NULL, 'business:task:edit', NOW(), 'system');

-- =====================================================
-- 3. 工单管理
-- =====================================================
SET @ticketId = (SELECT id FROM sys_menu WHERE path = 'ticketManage' AND type = 'catalog' AND parent_id IS NULL LIMIT 1);

DELETE FROM sys_menu WHERE path = 'ticketManage/form' AND parent_id = @ticketId;
DELETE FROM sys_menu WHERE path = '/ticketManage/form' AND parent_id = @ticketId;

INSERT INTO sys_menu (name, path, component, type, parent_id, `order`, icon, is_hidden, is_active, is_delete, permissionKey, create_time, create_user) 
VALUES ('工单列表', 'index', 'business/ticketManage/index', 'menu', @ticketId, '1', 'list', '0', '1', NULL, 'business:ticket:list', NOW(), 'system');

INSERT INTO sys_menu (name, path, component, type, parent_id, `order`, icon, is_hidden, is_active, is_delete, permissionKey, create_time, create_user) 
VALUES ('工单表单', 'form', 'business/ticketManage/form', 'menu', @ticketId, '2', '', '1', '1', NULL, 'business:ticket:edit', NOW(), 'system');

-- =====================================================
-- 4. 文档管理
-- =====================================================
SET @documentId = (SELECT id FROM sys_menu WHERE path = 'documentManage' AND type = 'catalog' AND parent_id IS NULL LIMIT 1);

DELETE FROM sys_menu WHERE path = 'documentManage/form' AND parent_id = @documentId;
DELETE FROM sys_menu WHERE path = '/documentManage/form' AND parent_id = @documentId;

INSERT INTO sys_menu (name, path, component, type, parent_id, `order`, icon, is_hidden, is_active, is_delete, permissionKey, create_time, create_user) 
VALUES ('文档列表', 'index', 'business/documentManage/index', 'menu', @documentId, '1', 'list', '0', '1', NULL, 'business:document:list', NOW(), 'system');

INSERT INTO sys_menu (name, path, component, type, parent_id, `order`, icon, is_hidden, is_active, is_delete, permissionKey, create_time, create_user) 
VALUES ('文档表单', 'form', 'business/documentManage/form', 'menu', @documentId, '2', '', '1', '1', NULL, 'business:document:edit', NOW(), 'system');

-- =====================================================
-- 5. 修复菜单关联表 (sys_menu_closure)
-- =====================================================
-- 删除旧的关联关系
DELETE mc FROM sys_menu_closure mc
INNER JOIN sys_menu m ON mc.id_descendant = m.id
WHERE m.parent_id IN (@projectId, @taskId, @ticketId, @documentId)
AND mc.id_ancestor != mc.id_descendant;

-- 添加新的关联关系（项目管理）
INSERT INTO sys_menu_closure (id_ancestor, id_descendant)
SELECT @projectId, id FROM sys_menu WHERE parent_id = @projectId
ON DUPLICATE KEY UPDATE id_ancestor = id_ancestor;

-- 添加新的关联关系（任务管理）
INSERT INTO sys_menu_closure (id_ancestor, id_descendant)
SELECT @taskId, id FROM sys_menu WHERE parent_id = @taskId
ON DUPLICATE KEY UPDATE id_ancestor = id_ancestor;

-- 添加新的关联关系（工单管理）
INSERT INTO sys_menu_closure (id_ancestor, id_descendant)
SELECT @ticketId, id FROM sys_menu WHERE parent_id = @ticketId
ON DUPLICATE KEY UPDATE id_ancestor = id_ancestor;

-- 添加新的关联关系（文档管理）
INSERT INTO sys_menu_closure (id_ancestor, id_descendant)
SELECT @documentId, id FROM sys_menu WHERE parent_id = @documentId
ON DUPLICATE KEY UPDATE id_ancestor = id_ancestor;

-- 恢复外键检查
SET FOREIGN_KEY_CHECKS = 1;

-- =====================================================
-- 验证结果
-- =====================================================
SELECT '========================================' AS '';
SELECT '✅ 业务模块菜单结构修复完成！' AS '';
SELECT '========================================' AS '';

SELECT 
  m.name AS '菜单名称',
  m.path AS '路由路径',
  m.component AS '组件路径',
  m.type AS '类型',
  m.is_hidden AS '是否隐藏',
  m.`order` AS '排序'
FROM sys_menu m
WHERE m.parent_id IN (@projectId, @taskId, @ticketId, @documentId)
ORDER BY m.parent_id, m.`order`;

SELECT '菜单结构说明：' AS '';
SELECT '- 列表页 (index): 可见，显示数据列表' AS '';
SELECT '- 表单页 (form): 隐藏，用于新增/编辑' AS '';
