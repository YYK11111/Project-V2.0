SET NAMES utf8mb4;

SET @task_report_menu_id = (
  SELECT id FROM sys_menu WHERE path = 'taskReportManage' AND is_delete IS NULL ORDER BY id LIMIT 1
);

DELETE FROM sys_role_menu
WHERE menu_id IN (
  SELECT id FROM sys_menu
  WHERE parent_id = @task_report_menu_id
    AND type = 'button'
    AND is_delete IS NULL
    AND path IN ('task-timelog-list', 'task-timelog-add', 'task-timelog-delete')
    AND (permissionKey IS NULL OR permissionKey = '')
);

UPDATE sys_menu
SET is_delete = '1'
WHERE parent_id = @task_report_menu_id
  AND type = 'button'
  AND is_delete IS NULL
  AND path IN ('task-timelog-list', 'task-timelog-add', 'task-timelog-delete')
  AND (permissionKey IS NULL OR permissionKey = '');

SELECT id, name, path, parent_id, permissionKey, is_delete
FROM sys_menu
WHERE parent_id = @task_report_menu_id
ORDER BY id;
