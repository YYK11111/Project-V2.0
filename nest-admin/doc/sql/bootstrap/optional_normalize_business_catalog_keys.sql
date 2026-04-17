SET NAMES utf8mb4;

UPDATE sys_menu
SET permissionKey = 'business/projectManage'
WHERE path = 'projectManage'
  AND type = 'catalog'
  AND is_delete IS NULL;

UPDATE sys_menu
SET permissionKey = 'business/projects/list'
WHERE id = 62
  AND is_delete IS NULL;

UPDATE sys_menu
SET permissionKey = 'business/taskManage'
WHERE path = 'taskManage'
  AND type = 'catalog'
  AND is_delete IS NULL;

UPDATE sys_menu
SET permissionKey = 'business/tasks/list'
WHERE id = 63
  AND is_delete IS NULL;

UPDATE sys_menu
SET permissionKey = 'business/ticketManage'
WHERE path = 'ticketManage'
  AND type = 'catalog'
  AND is_delete IS NULL;

UPDATE sys_menu
SET permissionKey = 'business/tickets/list'
WHERE id = 64
  AND is_delete IS NULL;

UPDATE sys_menu
SET permissionKey = 'business/projectInfo'
WHERE id = 62
  AND is_delete IS NULL;

UPDATE sys_menu
SET permissionKey = 'business/taskInfo'
WHERE id = 63
  AND is_delete IS NULL;

UPDATE sys_menu
SET permissionKey = 'business/ticketInfo'
WHERE id = 64
  AND is_delete IS NULL;

UPDATE sys_menu
SET name = '任务汇报',
    path = 'taskReportManage',
    component = 'business/taskReportManage/index',
    type = 'menu',
    parent_id = 32,
    permissionKey = 'business:taskReport',
    icon = 'el:Document',
    is_delete = NULL
WHERE path = 'taskReportManage'
  AND is_delete IS NULL;
