-- 将业务管理的子模块提升为顶级菜单
-- 执行前请备份数据库

-- 1. 将所有业务子菜单的 parent_id 更新为对应的父菜单ID
-- 项目管理及其表单
UPDATE sys_menu SET parent_id = '26' WHERE name = '项目表单';

-- 任务管理及其表单
UPDATE sys_menu SET parent_id = '27' WHERE name = '任务表单';

-- 工单管理及其表单
UPDATE sys_menu SET parent_id = '28' WHERE name = '工单表单';

-- 文档管理及其表单
UPDATE sys_menu SET parent_id = '29' WHERE name = '文档表单';

-- CRM客户管理提升为顶级菜单
UPDATE sys_menu SET parent_id = NULL, `order` = '8' WHERE name = 'CRM客户管理';

-- 2. 将主要业务菜单的 parent_id 更新为 NULL（顶级菜单）
UPDATE sys_menu 
SET parent_id = NULL 
WHERE name IN ('项目管理', '任务管理', '工单管理', '文档管理');

-- 3. 调整排序，使这些菜单在系统中合理分布
-- 项目管理 - 排序4
UPDATE sys_menu SET `order` = '4' WHERE name = '项目管理';

-- 任务管理 - 排序5
UPDATE sys_menu SET `order` = '5' WHERE name = '任务管理';

-- 工单管理 - 排序6
UPDATE sys_menu SET `order` = '6' WHERE name = '工单管理';

-- 文档管理 - 排序7
UPDATE sys_menu SET `order` = '7' WHERE name = '文档管理';

-- 4. 隐藏"业务管理"这个父级菜单（不删除，保留数据完整性）
UPDATE sys_menu SET is_hidden = '1' WHERE name = '业务管理';

-- 5. 验证更新结果
SELECT '菜单结构调整完成' AS status;
SELECT id, name, path, component, type, parent_id, permissionKey, `order`, is_hidden 
FROM sys_menu 
WHERE name IN ('业务管理', '项目管理', '任务管理', '工单管理', '文档管理', 'CRM客户管理', '项目表单', '任务表单', '工单表单', '文档表单') 
ORDER BY parent_id, `order`;
