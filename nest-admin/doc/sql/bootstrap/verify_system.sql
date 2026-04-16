SET NAMES utf8mb4;

SELECT '==== 系统初始化校验 ====' AS result;

SELECT '管理员账号' AS item, COUNT(*) AS total
FROM sys_user
WHERE id = 1 AND is_delete IS NULL;

SELECT '基础角色(admin/user)' AS item, COUNT(*) AS total
FROM sys_role
WHERE permissionKey IN ('admin', 'user') AND is_delete IS NULL;

SELECT '任务管理菜单' AS item, COUNT(*) AS total
FROM sys_menu
WHERE path = 'taskManage' AND is_delete IS NULL;

SELECT '任务评论菜单' AS item, COUNT(*) AS total
FROM sys_menu
WHERE path = 'taskCommentManage' AND is_delete IS NULL;

SELECT '任务汇报菜单' AS item, COUNT(*) AS total
FROM sys_menu
WHERE path = 'taskReportManage' AND is_delete IS NULL;

SELECT '工作流菜单' AS item, COUNT(*) AS total
FROM sys_menu
WHERE path = 'workflow' AND is_delete IS NULL;

SELECT '消息中心菜单' AS item, COUNT(*) AS total
FROM sys_menu
WHERE path = 'messageCenter' AND is_delete IS NULL;

SELECT 'admin角色菜单绑定' AS item, COUNT(*) AS total
FROM sys_role_menu
WHERE role_id = (SELECT id FROM sys_role WHERE permissionKey = 'admin' AND is_delete IS NULL ORDER BY id LIMIT 1);

SELECT 'user角色菜单绑定' AS item, COUNT(*) AS total
FROM sys_role_menu
WHERE role_id = (SELECT id FROM sys_role WHERE permissionKey = 'user' AND is_delete IS NULL ORDER BY id LIMIT 1);

SELECT '工作流定义表' AS item, COUNT(*) AS total
FROM information_schema.tables
WHERE table_schema = DATABASE() AND table_name = 'wf_definition';

SELECT '附件表' AS item, COUNT(*) AS total
FROM information_schema.tables
WHERE table_schema = DATABASE() AND table_name = 'sys_file';

SELECT '消息表' AS item, COUNT(*) AS total
FROM information_schema.tables
WHERE table_schema = DATABASE() AND table_name = 'sys_message';

SELECT '任务汇报附件字段' AS item, COUNT(*) AS total
FROM information_schema.columns
WHERE table_schema = DATABASE() AND table_name = 'task_time_log' AND column_name = 'attachments';

SELECT '任务汇报进度字段' AS item, COUNT(*) AS total
FROM information_schema.columns
WHERE table_schema = DATABASE() AND table_name = 'task_time_log' AND column_name = 'progress';

SELECT '==== 校验完成：total=1 表示已就绪，total=0 表示缺失 ====' AS result;
