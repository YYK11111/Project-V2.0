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

-- 普通用户：业务动作按钮权限（全量同步）
INSERT IGNORE INTO sys_role_menu (role_id, menu_id)
SELECT @user_role_id, id
FROM sys_menu
WHERE @user_role_id IS NOT NULL
  AND is_delete IS NULL
  AND type = 'button'
  AND permissionKey LIKE 'business/%'
  AND permissionKey NOT LIKE '%/manageAll';
