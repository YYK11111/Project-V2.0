SET NAMES utf8mb4;

SET @task_menu_id = (
  SELECT id FROM sys_menu
  WHERE path = 'taskManage' AND is_delete IS NULL
  ORDER BY id
  LIMIT 1
);

SET @task_list_menu_id = COALESCE(
  (
    SELECT id FROM sys_menu
    WHERE path = 'taskInfo'
      AND parent_id = @task_menu_id
      AND is_delete IS NULL
    ORDER BY id
    LIMIT 1
  ),
  @task_menu_id
);

UPDATE sys_menu
SET parent_id = @task_list_menu_id,
    path = CASE
      WHEN component = 'business/taskManage/form' THEN '/taskManage/form'
      ELSE path
    END,
    update_user = 'system',
    update_time = NOW()
WHERE @task_list_menu_id IS NOT NULL
  AND is_delete IS NULL
  AND (
    component = 'business/taskManage/form'
    OR permissionKey IN (
      'business/tasks/access',
      'business/tasks/list',
      'business/tasks/manageAll',
      'business/tasks/getOne',
      'business/tasks/add',
      'business/tasks/update',
      'business/tasks/delete',
      'business/tasks/updateProgress',
      'business/tasks/kanban',
      'business/tasks/dependency/list',
      'business/tasks/dependency/add',
      'business/tasks/dependency/delete'
    )
  );
