SET NAMES utf8mb4;

SET @task_report_menu_id = (SELECT id FROM sys_menu WHERE path = 'taskReportManage' AND is_delete IS NULL ORDER BY id LIMIT 1);
SET @admin_role_id = (SELECT id FROM sys_role WHERE permissionKey = 'admin' ORDER BY id LIMIT 1);

INSERT INTO sys_menu (name, `desc`, parent_id, `order`, path, component, type, icon, is_hidden, is_active, create_user, update_user, permissionKey)
SELECT '任务汇报列表', '任务汇报列表权限', @task_report_menu_id, '531', 'task-report-list', '', 'button', '', '1', '1', 'system', 'system', 'business/tasks/timelog/list'
WHERE @task_report_menu_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM sys_menu WHERE permissionKey = 'business/tasks/timelog/list' AND is_delete IS NULL);

INSERT INTO sys_menu (name, `desc`, parent_id, `order`, path, component, type, icon, is_hidden, is_active, create_user, update_user, permissionKey)
SELECT '新增任务汇报', '新增任务汇报权限', @task_report_menu_id, '532', 'task-report-add', '', 'button', '', '1', '1', 'system', 'system', 'business/tasks/timelog/add'
WHERE @task_report_menu_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM sys_menu WHERE permissionKey = 'business/tasks/timelog/add' AND is_delete IS NULL);

INSERT INTO sys_menu (name, `desc`, parent_id, `order`, path, component, type, icon, is_hidden, is_active, create_user, update_user, permissionKey)
SELECT '删除任务汇报', '删除任务汇报权限', @task_report_menu_id, '533', 'task-report-delete', '', 'button', '', '1', '1', 'system', 'system', 'business/tasks/timelog/delete'
WHERE @task_report_menu_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM sys_menu WHERE permissionKey = 'business/tasks/timelog/delete' AND is_delete IS NULL);

INSERT IGNORE INTO sys_role_menu (role_id, menu_id)
SELECT @admin_role_id, id
FROM sys_menu
WHERE @admin_role_id IS NOT NULL
  AND is_delete IS NULL
  AND permissionKey IN (
    'business/tasks/timelog/list',
    'business/tasks/timelog/add',
    'business/tasks/timelog/delete'
  );
