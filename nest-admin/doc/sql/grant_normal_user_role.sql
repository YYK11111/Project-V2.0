SET NAMES utf8mb4;

SET @user_role_id := (SELECT id FROM sys_role WHERE permissionKey = 'user' ORDER BY id LIMIT 1);

-- 普通用户：可见菜单（首页、项目、任务、工单、文档、CRM、工作流查看）
INSERT IGNORE INTO sys_role_menu (role_id, menu_id)
SELECT @user_role_id, id
FROM sys_menu
WHERE @user_role_id IS NOT NULL
  AND is_delete IS NULL
  AND (
    path IN (
      'index',
      'projectManage', 'projectInfo', 'sprintManage', 'milestoneManage', 'riskManage', 'changeManage', 'projectMemberManage', 'userStoryManage',
      'taskManage', 'taskInfo', 'taskCommentManage', 'taskReportManage',
      'ticketManage', 'ticketInfo',
      'documentManage', 'documentInfo',
      'crm', 'customerManage', 'interactionManage', 'opportunityManage', 'contractManage',
      'workflow', 'tasks', 'instances'
    )
    OR component IN (
      'index/index',
      'business/projectManage/form', 'business/projectManage/detail',
      'business/taskManage/form',
      'business/ticketManage/form',
      'business/documentManage/form',
      'business/sprintManage/form', 'business/sprintManage/detail',
      'business/milestoneManage/form',
      'business/riskManage/form',
      'business/changeManage/form',
      'business/userStoryManage/form',
      'business/crm/customerManage/form',
      'business/crm/interactionManage/form',
      'business/crm/opportunityManage/form',
      'business/crm/contractManage/form'
    )
  );

-- 普通用户：系统内仅允许看公告和消息
INSERT IGNORE INTO sys_role_menu (role_id, menu_id)
SELECT @user_role_id, id
FROM sys_menu
WHERE @user_role_id IS NOT NULL
  AND is_delete IS NULL
  AND (
    path IN ('notices')
    OR component IN ('system/notices/index')
  );

-- 普通用户：业务动作按钮权限（最小可用）
INSERT IGNORE INTO sys_role_menu (role_id, menu_id)
SELECT @user_role_id, id
FROM sys_menu
WHERE @user_role_id IS NOT NULL
  AND is_delete IS NULL
  AND type = 'button'
  AND permissionKey IN (
    'business/projects/list', 'business/projects/getOne', 'business/projects/add', 'business/projects/update', 'business/projects/submitApproval', 'business/projects/submitClose',
    'business/tasks/list', 'business/tasks/getOne', 'business/tasks/add', 'business/tasks/update', 'business/tasks/updateProgress',
    'business/tickets/list', 'business/tickets/getOne', 'business/tickets/add', 'business/tickets/update',
    'business/documents/list', 'business/documents/getOne', 'business/documents/add', 'business/documents/update',
    'business/stories/list', 'business/stories/getOne', 'business/stories/add', 'business/stories/update', 'business/stories/backlog', 'business/stories/children',
    'business/sprints/list', 'business/sprints/getOne', 'business/sprints/add', 'business/sprints/update',
    'business/milestones/list', 'business/milestones/getOne', 'business/milestones/add', 'business/milestones/update',
    'business/risks/list', 'business/risks/getOne', 'business/risks/add', 'business/risks/update',
    'business/changes/list', 'business/changes/getOne', 'business/changes/add', 'business/changes/update', 'business/changes/approve',
    'business/projectMembers/list', 'business/projectMembers/add', 'business/projectMembers/update', 'business/projectMembers/delete',
    'business/taskComments/list', 'business/taskComments/add', 'business/taskComments/update', 'business/taskComments/delete',
    'business/tasks/timelog/list', 'business/tasks/timelog/add', 'business/tasks/timelog/delete',
    'business/crm/customers/list', 'business/crm/customers/getOne', 'business/crm/customers/add', 'business/crm/customers/update',
    'business/crm/opportunities/list', 'business/crm/opportunities/getOne', 'business/crm/opportunities/add', 'business/crm/opportunities/update',
    'business/crm/contracts/list', 'business/crm/contracts/getOne', 'business/crm/contracts/add', 'business/crm/contracts/update',
    'business/crm/interactions/list', 'business/crm/interactions/getOne', 'business/crm/interactions/add', 'business/crm/interactions/update',
    'business/workflow/tasks/list', 'business/workflow/tasks/complete', 'business/workflow/tasks/transfer', 'business/workflow/tasks/addSign',
    'business/workflow/instances/list', 'business/workflow/instances/getOne', 'business/workflow/instances/history', 'business/workflow/instances/tasks'
  );
