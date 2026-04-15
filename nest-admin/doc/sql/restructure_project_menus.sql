SET NAMES utf8mb4;

SET @projectRoot := (SELECT id FROM sys_menu WHERE path = 'projectManage' AND is_delete IS NULL ORDER BY id LIMIT 1);

-- 项目管理本身只做父级容器
UPDATE sys_menu
SET component = '',
    type = 'catalog',
    icon = 'project'
WHERE id = @projectRoot;

-- 项目信息：项目列表入口
INSERT INTO sys_menu (name, path, component, type, parent_id, `order`, icon, is_hidden, is_active, is_delete, permissionKey, create_time, create_user, update_user)
SELECT '项目信息', 'projectInfo', 'business/projectManage/index', 'menu', @projectRoot, '1', 'list', '0', '1', NULL, 'business:project', NOW(), 'system', 'system'
WHERE @projectRoot IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM sys_menu WHERE parent_id = @projectRoot AND path = 'projectInfo' AND is_delete IS NULL);

-- 将项目相关模块挂到项目管理下
UPDATE sys_menu SET parent_id = @projectRoot, `order` = '2' WHERE path = 'sprintManage' AND is_delete IS NULL;
UPDATE sys_menu SET parent_id = @projectRoot, `order` = '3' WHERE path = 'milestoneManage' AND is_delete IS NULL;
UPDATE sys_menu SET parent_id = @projectRoot, `order` = '4' WHERE path = 'riskManage' AND is_delete IS NULL;
UPDATE sys_menu SET parent_id = @projectRoot, `order` = '5' WHERE path = 'changeManage' AND is_delete IS NULL;
UPDATE sys_menu SET parent_id = @projectRoot, `order` = '6' WHERE path = 'projectMemberManage' AND is_delete IS NULL;
UPDATE sys_menu SET parent_id = @projectRoot, `order` = '7' WHERE path = 'userStoryManage' AND is_delete IS NULL;

INSERT IGNORE INTO sys_role_menu (role_id, menu_id)
SELECT 1, id FROM sys_menu WHERE is_delete IS NULL;
