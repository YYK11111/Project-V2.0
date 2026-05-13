SET NAMES utf8mb4;

SET @user_role_id := (
  SELECT id
  FROM sys_role
  WHERE permissionKey = 'user'
    AND is_delete IS NULL
  ORDER BY id
  LIMIT 1
);

-- 执行前先保留普通用户角色当前授权快照，便于误操作回滚。
CREATE TABLE IF NOT EXISTS sys_role_menu_backup_user_20260513 AS
SELECT rm.*
FROM sys_role_menu rm
JOIN sys_role r ON r.id = rm.role_id
WHERE r.permissionKey = 'user';

START TRANSACTION;

-- 普通用户只保留基础菜单、只读业务权限、个人消息和我的待办权限。
DELETE rm
FROM sys_role_menu rm
JOIN sys_role r ON r.id = rm.role_id
LEFT JOIN sys_menu m ON m.id = rm.menu_id
WHERE r.permissionKey = 'user'
  AND (
    m.id IS NULL
    OR m.is_delete IS NOT NULL
    OR NOT (
      m.path IN (
        'index',
        'projectManage', 'projectInfo', 'detail',
        'taskManage', 'taskInfo',
        'ticketManage', 'ticketInfo',
        'documentManage', 'documentInfo',
        'sprintManage', 'milestoneManage', 'riskManage', 'changeManage',
        'projectMemberManage', 'userStoryManage',
        'crm', 'customerManage', 'interactionManage', 'opportunityManage', 'contractManage',
        'workflow', 'tasks',
        'messageCenter'
      )
      OR m.component IN (
        'index/index',
        'business/projectManage/index',
        'business/projectManage/detail',
        'business/taskManage/index',
        'business/ticketManage/index',
        'business/documentManage/index',
        'business/sprintManage/index',
        'business/sprintManage/detail',
        'business/milestoneManage/index',
        'business/riskManage/index',
        'business/changeManage/index',
        'business/projectMemberManage/index',
        'business/userStoryManage/index',
        'business/crm/customerManage/index',
        'business/crm/interactionManage/index',
        'business/crm/opportunityManage/index',
        'business/crm/contractManage/index',
        'business/workflow/tasks',
        'system/messageCenter/index'
      )
      OR m.permissionKey IN (
        'business/projects/list',
        'business/projects/getOne',
        'business/projects/statistics',
        'business/tasks/list',
        'business/tasks/getOne',
        'business/tasks/kanban',
        'business/tasks/dependency/list',
        'business/tasks/timelog/list',
        'business/tickets/list',
        'business/tickets/getOne',
        'business/stories/list',
        'business/stories/getOne',
        'business/stories/backlog',
        'business/stories/children',
        'business/sprints/list',
        'business/milestones/list',
        'business/risks/list',
        'business/changes/list',
        'business/changes/getOne',
        'business/documents/list',
        'business/projectMembers/list',
        'business/taskComments/list',
        'business/crm/customers/list',
        'business/crm/customers/getOne',
        'business/crm/interactions/list',
        'business/crm/interactions/getOne',
        'business/crm/opportunities/list',
        'business/crm/opportunities/getOne',
        'business/crm/contracts/list',
        'business/crm/contracts/getOne',
        'business/workflow/tasks/list',
        'business/workflow/tasks/complete',
        'business/workflow/tasks/transfer',
        'business/workflow/tasks/addSign',
        'system/messages/list',
        'system/messages/markRead',
        'system/messages/markAllRead',
        'system/messages/delete'
      )
    )
  );

-- 如果普通用户缺少上述只读基线权限，则补齐。
INSERT IGNORE INTO sys_role_menu (role_id, menu_id)
SELECT @user_role_id, m.id
FROM sys_menu m
WHERE @user_role_id IS NOT NULL
  AND m.is_delete IS NULL
  AND (
    m.path IN (
      'index',
      'projectManage', 'projectInfo', 'detail',
      'taskManage', 'taskInfo',
      'ticketManage', 'ticketInfo',
      'documentManage', 'documentInfo',
      'sprintManage', 'milestoneManage', 'riskManage', 'changeManage',
      'projectMemberManage', 'userStoryManage',
      'crm', 'customerManage', 'interactionManage', 'opportunityManage', 'contractManage',
      'workflow', 'tasks',
      'messageCenter'
    )
    OR m.component IN (
      'index/index',
      'business/projectManage/index',
      'business/projectManage/detail',
      'business/taskManage/index',
      'business/ticketManage/index',
      'business/documentManage/index',
      'business/sprintManage/index',
      'business/sprintManage/detail',
      'business/milestoneManage/index',
      'business/riskManage/index',
      'business/changeManage/index',
      'business/projectMemberManage/index',
      'business/userStoryManage/index',
      'business/crm/customerManage/index',
      'business/crm/interactionManage/index',
      'business/crm/opportunityManage/index',
      'business/crm/contractManage/index',
      'business/workflow/tasks',
      'system/messageCenter/index'
    )
    OR m.permissionKey IN (
      'business/projects/list',
      'business/projects/getOne',
      'business/projects/statistics',
      'business/tasks/list',
      'business/tasks/getOne',
      'business/tasks/kanban',
      'business/tasks/dependency/list',
      'business/tasks/timelog/list',
      'business/tickets/list',
      'business/tickets/getOne',
      'business/stories/list',
      'business/stories/getOne',
      'business/stories/backlog',
      'business/stories/children',
      'business/sprints/list',
      'business/milestones/list',
      'business/risks/list',
      'business/changes/list',
      'business/changes/getOne',
      'business/documents/list',
      'business/projectMembers/list',
      'business/taskComments/list',
      'business/crm/customers/list',
      'business/crm/customers/getOne',
      'business/crm/interactions/list',
      'business/crm/interactions/getOne',
      'business/crm/opportunities/list',
      'business/crm/opportunities/getOne',
      'business/crm/contracts/list',
      'business/crm/contracts/getOne',
      'business/workflow/tasks/list',
      'business/workflow/tasks/complete',
      'business/workflow/tasks/transfer',
      'business/workflow/tasks/addSign',
      'system/messages/list',
      'system/messages/markRead',
      'system/messages/markAllRead',
      'system/messages/delete'
    )
  );

COMMIT;

-- 回滚参考：
-- DELETE rm FROM sys_role_menu rm JOIN sys_role r ON r.id = rm.role_id WHERE r.permissionKey = 'user';
-- INSERT IGNORE INTO sys_role_menu (role_id, menu_id)
-- SELECT role_id, menu_id FROM sys_role_menu_backup_user_20260513;
