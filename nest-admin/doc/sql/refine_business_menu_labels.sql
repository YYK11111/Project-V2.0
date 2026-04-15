SET NAMES utf8mb4;

-- 统一列表类菜单命名
UPDATE sys_menu
SET name = '项目列表'
WHERE path = 'projectInfo' AND is_delete IS NULL;

UPDATE sys_menu
SET name = '任务列表'
WHERE path = 'taskInfo' AND is_delete IS NULL;

UPDATE sys_menu
SET name = '工单列表'
WHERE path = 'ticketInfo' AND is_delete IS NULL;

UPDATE sys_menu
SET name = '文档列表'
WHERE path = 'documentInfo' AND is_delete IS NULL;

-- 任务评论继续明确挂在任务管理下
SET @taskRoot := (SELECT id FROM sys_menu WHERE path = 'taskManage' AND is_delete IS NULL LIMIT 1);
UPDATE sys_menu
SET parent_id = @taskRoot,
    `order` = '3',
    type = 'menu',
    name = '任务评论'
WHERE path = 'taskCommentManage' AND is_delete IS NULL;

-- 任务表单和评论顺序微调，保证列表在前，表单隐藏在后
UPDATE sys_menu SET `order` = '90' WHERE parent_id = @taskRoot AND path = 'form' AND component = 'business/taskManage/form' AND is_delete IS NULL;

INSERT IGNORE INTO sys_role_menu (role_id, menu_id)
SELECT 1, id FROM sys_menu WHERE is_delete IS NULL;
