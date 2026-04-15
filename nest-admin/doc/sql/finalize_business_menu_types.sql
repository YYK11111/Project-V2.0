SET NAMES utf8mb4;

-- 项目管理下的子菜单改成可直接点击的 menu
UPDATE sys_menu SET type = 'menu' WHERE path IN ('sprintManage', 'milestoneManage', 'riskManage', 'changeManage', 'projectMemberManage', 'userStoryManage', 'taskCommentManage') AND is_delete IS NULL;

-- 隐藏路由补一个通用图标，避免后台菜单管理里空白
UPDATE sys_menu SET icon = 'el:Edit' WHERE path = 'form' AND is_delete IS NULL AND (icon IS NULL OR icon = '');
UPDATE sys_menu SET icon = 'el:View' WHERE path = 'detail' AND is_delete IS NULL AND (icon IS NULL OR icon = '');
