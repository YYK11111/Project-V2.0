-- 获取业务管理菜单ID
SET @businessId = (SELECT id FROM sys_menu WHERE path = 'business' AND parent_id IS NULL LIMIT 1);

-- 为超级管理员角色分配所有新菜单权限
INSERT INTO sys_role_menu (roleId, menuId) 
SELECT 1, id FROM sys_menu WHERE id >= @businessId;

-- 插入菜单关联表数据（树形结构）
-- 业务管理关联自身和所有子菜单
INSERT INTO sys_menu_closure (id_ancestor, id_descendant) VALUES 
(@businessId, @businessId);

-- 获取子菜单ID
SET @projectId = (SELECT id FROM sys_menu WHERE path = 'projectManage' AND parent_id = @businessId);
SET @taskId = (SELECT id FROM sys_menu WHERE path = 'taskManage' AND parent_id = @businessId);
SET @ticketId = (SELECT id FROM sys_menu WHERE path = 'ticketManage' AND parent_id = @businessId);
SET @documentId = (SELECT id FROM sys_menu WHERE path = 'documentManage' AND parent_id = @businessId);

-- 业务管理关联子菜单
INSERT INTO sys_menu_closure (id_ancestor, id_descendant) VALUES 
(@businessId, @projectId),
(@businessId, @taskId),
(@businessId, @ticketId),
(@businessId, @documentId);

-- 子菜单关联自身
INSERT INTO sys_menu_closure (id_ancestor, id_descendant) VALUES 
(@projectId, @projectId),
(@taskId, @taskId),
(@ticketId, @ticketId),
(@documentId, @documentId);

-- 验证结果
SELECT '菜单权限分配完成' AS status;
SELECT r.name AS '角色名', COUNT(rm.menuId) AS '菜单数量' 
FROM sys_role r 
LEFT JOIN sys_role_menu rm ON r.id = rm.roleId 
WHERE r.id = 1
GROUP BY r.id;

SELECT '菜单关联表统计' AS info, COUNT(*) AS count FROM sys_menu_closure;
