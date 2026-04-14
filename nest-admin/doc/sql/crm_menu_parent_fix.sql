-- CRM菜单父节点修复
-- 问题：CRM子菜单的父节点(id=108)已被删除，导致菜单成为孤儿节点
-- 解决方案：将CRM子菜单的parent_id更新为正确的catalog(id=150)

SET FOREIGN_KEY_CHECKS = 0;

-- 更新所有CRM子菜单的父节点为CRM catalog(id=150)
UPDATE `sys_menu` 
SET `parent_id` = 150 
WHERE `parent_id` = 108;

-- 验证修复结果
SELECT id, name, type, parent_id 
FROM `sys_menu` 
WHERE parent_id = 150;

SET FOREIGN_KEY_CHECKS = 1;
