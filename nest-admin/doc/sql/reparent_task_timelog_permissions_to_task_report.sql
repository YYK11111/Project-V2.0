SET NAMES utf8mb4;

SET @task_report_menu_id = (
  SELECT id FROM sys_menu
  WHERE path = 'taskReportManage' AND is_delete IS NULL
  ORDER BY id
  LIMIT 1
);

UPDATE sys_menu
SET parent_id = @task_report_menu_id,
    name = '任务汇报列表',
    `desc` = '任务汇报列表权限'
WHERE permissionKey = 'business/tasks/timelog/list'
  AND is_delete IS NULL;

UPDATE sys_menu
SET parent_id = @task_report_menu_id,
    name = '新增任务汇报',
    `desc` = '新增任务汇报权限'
WHERE permissionKey = 'business/tasks/timelog/add'
  AND is_delete IS NULL;

UPDATE sys_menu
SET parent_id = @task_report_menu_id,
    name = '删除任务汇报',
    `desc` = '删除任务汇报权限'
WHERE permissionKey = 'business/tasks/timelog/delete'
  AND is_delete IS NULL;
