SET NAMES utf8mb4;

SET @project_member_menu_id = (
  SELECT id FROM sys_menu WHERE path = 'projectMemberManage' AND is_delete IS NULL ORDER BY id LIMIT 1
);
SET @task_comment_menu_id = (
  SELECT id FROM sys_menu WHERE path = 'taskCommentManage' AND is_delete IS NULL ORDER BY id LIMIT 1
);
SET @task_report_menu_id = (
  SELECT id FROM sys_menu WHERE path = 'taskReportManage' AND is_delete IS NULL ORDER BY id LIMIT 1
);
SET @message_center_menu_id = (
  SELECT id FROM sys_menu WHERE path = 'messageCenter' AND is_delete IS NULL ORDER BY id LIMIT 1
);
SET @change_menu_id = (
  SELECT id FROM sys_menu WHERE path = 'changeManage' AND is_delete IS NULL ORDER BY id LIMIT 1
);
SET @customer_menu_id = (
  SELECT id FROM sys_menu WHERE path = 'customerManage' AND is_delete IS NULL ORDER BY id LIMIT 1
);
SET @interaction_menu_id = (
  SELECT id FROM sys_menu WHERE path = 'interactionManage' AND is_delete IS NULL ORDER BY id LIMIT 1
);
SET @opportunity_menu_id = (
  SELECT id FROM sys_menu WHERE path = 'opportunityManage' AND is_delete IS NULL ORDER BY id LIMIT 1
);
SET @contract_menu_id = (
  SELECT id FROM sys_menu WHERE path = 'contractManage' AND is_delete IS NULL ORDER BY id LIMIT 1
);
SET @workflow_menu_id = (
  SELECT id FROM sys_menu WHERE path = 'workflow' AND is_delete IS NULL ORDER BY id LIMIT 1
);
SET @admin_role_id = (
  SELECT id FROM sys_role WHERE permissionKey = 'admin' ORDER BY id LIMIT 1
);

-- 项目成员
INSERT INTO sys_menu (name, `desc`, parent_id, `order`, path, component, type, icon, is_hidden, is_active, create_user, update_user, permissionKey)
SELECT '项目成员列表', '项目成员列表权限', @project_member_menu_id, '481', 'project-members-list', '', 'button', '', '1', '1', 'system', 'system', 'business/projectMembers/list'
WHERE @project_member_menu_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM sys_menu WHERE permissionKey = 'business/projectMembers/list' AND is_delete IS NULL);
INSERT INTO sys_menu (name, `desc`, parent_id, `order`, path, component, type, icon, is_hidden, is_active, create_user, update_user, permissionKey)
SELECT '项目成员新增', '项目成员新增权限', @project_member_menu_id, '482', 'project-members-add', '', 'button', '', '1', '1', 'system', 'system', 'business/projectMembers/add'
WHERE @project_member_menu_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM sys_menu WHERE permissionKey = 'business/projectMembers/add' AND is_delete IS NULL);
INSERT INTO sys_menu (name, `desc`, parent_id, `order`, path, component, type, icon, is_hidden, is_active, create_user, update_user, permissionKey)
SELECT '项目成员修改', '项目成员修改权限', @project_member_menu_id, '483', 'project-members-update', '', 'button', '', '1', '1', 'system', 'system', 'business/projectMembers/update'
WHERE @project_member_menu_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM sys_menu WHERE permissionKey = 'business/projectMembers/update' AND is_delete IS NULL);
INSERT INTO sys_menu (name, `desc`, parent_id, `order`, path, component, type, icon, is_hidden, is_active, create_user, update_user, permissionKey)
SELECT '项目成员删除', '项目成员删除权限', @project_member_menu_id, '484', 'project-members-delete', '', 'button', '', '1', '1', 'system', 'system', 'business/projectMembers/delete'
WHERE @project_member_menu_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM sys_menu WHERE permissionKey = 'business/projectMembers/delete' AND is_delete IS NULL);

-- 任务评论
INSERT INTO sys_menu (name, `desc`, parent_id, `order`, path, component, type, icon, is_hidden, is_active, create_user, update_user, permissionKey)
SELECT '任务评论列表', '任务评论列表权限', @task_comment_menu_id, '485', 'task-comments-list', '', 'button', '', '1', '1', 'system', 'system', 'business/taskComments/list'
WHERE @task_comment_menu_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM sys_menu WHERE permissionKey = 'business/taskComments/list' AND is_delete IS NULL);
INSERT INTO sys_menu (name, `desc`, parent_id, `order`, path, component, type, icon, is_hidden, is_active, create_user, update_user, permissionKey)
SELECT '任务评论新增', '任务评论新增权限', @task_comment_menu_id, '486', 'task-comments-add', '', 'button', '', '1', '1', 'system', 'system', 'business/taskComments/add'
WHERE @task_comment_menu_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM sys_menu WHERE permissionKey = 'business/taskComments/add' AND is_delete IS NULL);
INSERT INTO sys_menu (name, `desc`, parent_id, `order`, path, component, type, icon, is_hidden, is_active, create_user, update_user, permissionKey)
SELECT '任务评论修改', '任务评论修改权限', @task_comment_menu_id, '487', 'task-comments-update', '', 'button', '', '1', '1', 'system', 'system', 'business/taskComments/update'
WHERE @task_comment_menu_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM sys_menu WHERE permissionKey = 'business/taskComments/update' AND is_delete IS NULL);
INSERT INTO sys_menu (name, `desc`, parent_id, `order`, path, component, type, icon, is_hidden, is_active, create_user, update_user, permissionKey)
SELECT '任务评论删除', '任务评论删除权限', @task_comment_menu_id, '488', 'task-comments-delete', '', 'button', '', '1', '1', 'system', 'system', 'business/taskComments/delete'
WHERE @task_comment_menu_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM sys_menu WHERE permissionKey = 'business/taskComments/delete' AND is_delete IS NULL);

-- 任务汇报
INSERT INTO sys_menu (name, `desc`, parent_id, `order`, path, component, type, icon, is_hidden, is_active, create_user, update_user, permissionKey)
SELECT '任务汇报列表', '任务汇报列表权限', @task_report_menu_id, '331', 'task-timelog-list', '', 'button', '', '1', '1', 'system', 'system', 'business/tasks/timelog/list'
WHERE @task_report_menu_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM sys_menu WHERE permissionKey = 'business/tasks/timelog/list' AND is_delete IS NULL);
INSERT INTO sys_menu (name, `desc`, parent_id, `order`, path, component, type, icon, is_hidden, is_active, create_user, update_user, permissionKey)
SELECT '新增任务汇报', '新增任务汇报权限', @task_report_menu_id, '332', 'task-timelog-add', '', 'button', '', '1', '1', 'system', 'system', 'business/tasks/timelog/add'
WHERE @task_report_menu_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM sys_menu WHERE permissionKey = 'business/tasks/timelog/add' AND is_delete IS NULL);
INSERT INTO sys_menu (name, `desc`, parent_id, `order`, path, component, type, icon, is_hidden, is_active, create_user, update_user, permissionKey)
SELECT '删除任务汇报', '删除任务汇报权限', @task_report_menu_id, '333', 'task-timelog-delete', '', 'button', '', '1', '1', 'system', 'system', 'business/tasks/timelog/delete'
WHERE @task_report_menu_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM sys_menu WHERE permissionKey = 'business/tasks/timelog/delete' AND is_delete IS NULL);

-- 消息中心
INSERT INTO sys_menu (name, `desc`, parent_id, `order`, path, component, type, icon, is_hidden, is_active, create_user, update_user, permissionKey)
SELECT '标记已读', '消息标记已读权限', @message_center_menu_id, '2', 'mark-read', '', 'button', '', '1', '1', 'system', 'system', 'system/messages/markRead'
WHERE @message_center_menu_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM sys_menu WHERE permissionKey = 'system/messages/markRead' AND is_delete IS NULL);
INSERT INTO sys_menu (name, `desc`, parent_id, `order`, path, component, type, icon, is_hidden, is_active, create_user, update_user, permissionKey)
SELECT '全部已读', '消息全部已读权限', @message_center_menu_id, '3', 'mark-all-read', '', 'button', '', '1', '1', 'system', 'system', 'system/messages/markAllRead'
WHERE @message_center_menu_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM sys_menu WHERE permissionKey = 'system/messages/markAllRead' AND is_delete IS NULL);
INSERT INTO sys_menu (name, `desc`, parent_id, `order`, path, component, type, icon, is_hidden, is_active, create_user, update_user, permissionKey)
SELECT '删除消息', '消息删除权限', @message_center_menu_id, '4', 'delete', '', 'button', '', '1', '1', 'system', 'system', 'system/messages/delete'
WHERE @message_center_menu_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM sys_menu WHERE permissionKey = 'system/messages/delete' AND is_delete IS NULL);

-- 变更管理补充
INSERT INTO sys_menu (name, `desc`, parent_id, `order`, path, component, type, icon, is_hidden, is_active, create_user, update_user, permissionKey)
SELECT '变更详情', '变更详情权限', @change_menu_id, '445', 'change-getOne', '', 'button', '', '1', '1', 'system', 'system', 'business/changes/getOne'
WHERE @change_menu_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM sys_menu WHERE permissionKey = 'business/changes/getOne' AND is_delete IS NULL);
INSERT INTO sys_menu (name, `desc`, parent_id, `order`, path, component, type, icon, is_hidden, is_active, create_user, update_user, permissionKey)
SELECT '变更审批', '变更审批权限', @change_menu_id, '446', 'change-approve', '', 'button', '', '1', '1', 'system', 'system', 'business/changes/approve'
WHERE @change_menu_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM sys_menu WHERE permissionKey = 'business/changes/approve' AND is_delete IS NULL);

-- CRM 详情权限
INSERT INTO sys_menu (name, `desc`, parent_id, `order`, path, component, type, icon, is_hidden, is_active, create_user, update_user, permissionKey)
SELECT '客户详情', '客户详情查看权限', @customer_menu_id, '505', 'customer-getOne', '', 'button', '', '1', '1', 'system', 'system', 'business/crm/customers/getOne'
WHERE @customer_menu_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM sys_menu WHERE permissionKey = 'business/crm/customers/getOne' AND is_delete IS NULL);
INSERT INTO sys_menu (name, `desc`, parent_id, `order`, path, component, type, icon, is_hidden, is_active, create_user, update_user, permissionKey)
SELECT '互动详情', '互动详情查看权限', @interaction_menu_id, '535', 'interaction-getOne', '', 'button', '', '1', '1', 'system', 'system', 'business/crm/interactions/getOne'
WHERE @interaction_menu_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM sys_menu WHERE permissionKey = 'business/crm/interactions/getOne' AND is_delete IS NULL);
INSERT INTO sys_menu (name, `desc`, parent_id, `order`, path, component, type, icon, is_hidden, is_active, create_user, update_user, permissionKey)
SELECT '商机详情', '商机详情查看权限', @opportunity_menu_id, '515', 'opportunity-getOne', '', 'button', '', '1', '1', 'system', 'system', 'business/crm/opportunities/getOne'
WHERE @opportunity_menu_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM sys_menu WHERE permissionKey = 'business/crm/opportunities/getOne' AND is_delete IS NULL);
INSERT INTO sys_menu (name, `desc`, parent_id, `order`, path, component, type, icon, is_hidden, is_active, create_user, update_user, permissionKey)
SELECT '合同详情', '合同详情查看权限', @contract_menu_id, '525', 'contract-getOne', '', 'button', '', '1', '1', 'system', 'system', 'business/crm/contracts/getOne'
WHERE @contract_menu_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM sys_menu WHERE permissionKey = 'business/crm/contracts/getOne' AND is_delete IS NULL);

-- 工作流定义详情
INSERT INTO sys_menu (name, `desc`, parent_id, `order`, path, component, type, icon, is_hidden, is_active, create_user, update_user, permissionKey)
SELECT '流程定义详情', '流程定义详情权限', @workflow_menu_id, '5521', 'workflow-definition-getOne', '', 'button', '', '1', '1', 'system', 'system', 'business/workflow/definitions/getOne'
WHERE @workflow_menu_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM sys_menu WHERE permissionKey = 'business/workflow/definitions/getOne' AND is_delete IS NULL);

INSERT IGNORE INTO sys_role_menu (role_id, menu_id)
SELECT @admin_role_id, id
FROM sys_menu
WHERE @admin_role_id IS NOT NULL
  AND is_delete IS NULL
  AND permissionKey IN (
    'business/projectMembers/list', 'business/projectMembers/add', 'business/projectMembers/update', 'business/projectMembers/delete',
    'business/taskComments/list', 'business/taskComments/add', 'business/taskComments/update', 'business/taskComments/delete',
    'business/tasks/timelog/list', 'business/tasks/timelog/add', 'business/tasks/timelog/delete',
    'system/messages/markRead', 'system/messages/markAllRead', 'system/messages/delete',
    'business/changes/getOne', 'business/changes/approve',
    'business/crm/customers/getOne', 'business/crm/interactions/getOne', 'business/crm/opportunities/getOne', 'business/crm/contracts/getOne',
    'business/workflow/definitions/getOne'
  );
