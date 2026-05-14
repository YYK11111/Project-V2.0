SET NAMES utf8mb4;

SET @admin_role_id = (SELECT id FROM sys_role WHERE permissionKey = 'admin' ORDER BY id LIMIT 1);
SET @user_role_id = (SELECT id FROM sys_role WHERE permissionKey = 'user' ORDER BY id LIMIT 1);

SET @project_menu_id = (SELECT id FROM sys_menu WHERE path = 'projectManage' AND is_delete IS NULL ORDER BY id LIMIT 1);
SET @project_list_menu_id = COALESCE(
  (SELECT id FROM sys_menu WHERE path = 'projectInfo' AND is_delete IS NULL ORDER BY id LIMIT 1),
  @project_menu_id
);
SET @task_menu_id = (SELECT id FROM sys_menu WHERE path = 'taskManage' AND is_delete IS NULL ORDER BY id LIMIT 1);
SET @task_report_menu_id = COALESCE(
  (SELECT id FROM sys_menu WHERE path = 'taskReportManage' AND is_delete IS NULL ORDER BY id LIMIT 1),
  @task_menu_id
);
SET @ticket_menu_id = (SELECT id FROM sys_menu WHERE path = 'ticketManage' AND is_delete IS NULL ORDER BY id LIMIT 1);
SET @story_menu_id = (SELECT id FROM sys_menu WHERE path = 'userStoryManage' AND is_delete IS NULL ORDER BY id LIMIT 1);
SET @sprint_menu_id = (SELECT id FROM sys_menu WHERE path = 'sprintManage' AND is_delete IS NULL ORDER BY id LIMIT 1);
SET @milestone_menu_id = (SELECT id FROM sys_menu WHERE path = 'milestoneManage' AND is_delete IS NULL ORDER BY id LIMIT 1);
SET @risk_menu_id = (SELECT id FROM sys_menu WHERE path = 'riskManage' AND is_delete IS NULL ORDER BY id LIMIT 1);
SET @change_menu_id = (SELECT id FROM sys_menu WHERE path = 'changeManage' AND is_delete IS NULL ORDER BY id LIMIT 1);
SET @project_member_menu_id = (SELECT id FROM sys_menu WHERE path = 'projectMemberManage' AND is_delete IS NULL ORDER BY id LIMIT 1);
SET @task_comment_menu_id = (SELECT id FROM sys_menu WHERE path = 'taskCommentManage' AND is_delete IS NULL ORDER BY id LIMIT 1);
SET @go_live_menu_id = (SELECT id FROM sys_menu WHERE path = 'goLiveManage' AND is_delete IS NULL ORDER BY id LIMIT 1);
SET @acceptance_menu_id = (SELECT id FROM sys_menu WHERE path = 'acceptanceManage' AND is_delete IS NULL ORDER BY id LIMIT 1);
SET @handover_menu_id = (SELECT id FROM sys_menu WHERE path = 'handoverManage' AND is_delete IS NULL ORDER BY id LIMIT 1);
SET @customer_menu_id = (SELECT id FROM sys_menu WHERE path = 'customerManage' AND is_delete IS NULL ORDER BY id LIMIT 1);
SET @interaction_menu_id = (SELECT id FROM sys_menu WHERE path = 'interactionManage' AND is_delete IS NULL ORDER BY id LIMIT 1);
SET @opportunity_menu_id = (SELECT id FROM sys_menu WHERE path = 'opportunityManage' AND is_delete IS NULL ORDER BY id LIMIT 1);
SET @contract_menu_id = (SELECT id FROM sys_menu WHERE path = 'contractManage' AND is_delete IS NULL ORDER BY id LIMIT 1);
SET @article_menu_id = COALESCE(
  (SELECT id FROM sys_menu WHERE component = 'content/articleManage/index' AND is_delete IS NULL ORDER BY id LIMIT 1),
  (SELECT id FROM sys_menu WHERE path = 'content' AND is_delete IS NULL ORDER BY id LIMIT 1)
);
SET @workflow_menu_id = (SELECT id FROM sys_menu WHERE path = 'workflow' AND is_delete IS NULL ORDER BY id LIMIT 1);

INSERT INTO sys_menu (name, `desc`, parent_id, `order`, path, component, type, icon, is_hidden, is_active, create_user, update_user, permissionKey)
SELECT '项目基础访问', '项目基础访问权限：允许查看本人可见范围内的项目列表、详情、统计、驾驶舱及页面只读基础数据', @project_list_menu_id, '300', 'project-access', '', 'button', '', '1', '1', 'system', 'system', 'business/projects/access'
WHERE @project_list_menu_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM sys_menu WHERE permissionKey = 'business/projects/access' AND is_delete IS NULL);

INSERT INTO sys_menu (name, `desc`, parent_id, `order`, path, component, type, icon, is_hidden, is_active, create_user, update_user, permissionKey)
SELECT '任务基础访问', '任务基础访问权限：允许查看本人可见范围内的任务列表、详情、看板、任务依赖及页面只读基础数据', @task_menu_id, '320', 'task-access', '', 'button', '', '1', '1', 'system', 'system', 'business/tasks/access'
WHERE @task_menu_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM sys_menu WHERE permissionKey = 'business/tasks/access' AND is_delete IS NULL);

INSERT INTO sys_menu (name, `desc`, parent_id, `order`, path, component, type, icon, is_hidden, is_active, create_user, update_user, permissionKey)
SELECT '任务汇报基础访问', '任务汇报基础访问权限：允许查看本人可见范围内的任务汇报列表和详情', @task_report_menu_id, '520', 'task-timelog-access', '', 'button', '', '1', '1', 'system', 'system', 'business/tasks/timelog/access'
WHERE @task_report_menu_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM sys_menu WHERE permissionKey = 'business/tasks/timelog/access' AND is_delete IS NULL);

INSERT INTO sys_menu (name, `desc`, parent_id, `order`, path, component, type, icon, is_hidden, is_active, create_user, update_user, permissionKey)
SELECT '工单基础访问', '工单基础访问权限：允许查看本人可见范围内的工单列表、详情及页面只读基础数据', @ticket_menu_id, '340', 'ticket-access', '', 'button', '', '1', '1', 'system', 'system', 'business/tickets/access'
WHERE @ticket_menu_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM sys_menu WHERE permissionKey = 'business/tickets/access' AND is_delete IS NULL);

INSERT INTO sys_menu (name, `desc`, parent_id, `order`, path, component, type, icon, is_hidden, is_active, create_user, update_user, permissionKey)
SELECT '用户故事基础访问', '用户故事基础访问权限：允许查看本人可见范围内的故事列表、详情、Backlog、子故事及页面只读基础数据', @story_menu_id, '360', 'story-access', '', 'button', '', '1', '1', 'system', 'system', 'business/stories/access'
WHERE @story_menu_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM sys_menu WHERE permissionKey = 'business/stories/access' AND is_delete IS NULL);

INSERT INTO sys_menu (name, `desc`, parent_id, `order`, path, component, type, icon, is_hidden, is_active, create_user, update_user, permissionKey)
SELECT 'Sprint基础访问', 'Sprint基础访问权限：允许查看本人可见范围内的 Sprint 列表、详情、燃尽图和速度图', @sprint_menu_id, '380', 'sprint-access', '', 'button', '', '1', '1', 'system', 'system', 'business/sprints/access'
WHERE @sprint_menu_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM sys_menu WHERE permissionKey = 'business/sprints/access' AND is_delete IS NULL);

INSERT INTO sys_menu (name, `desc`, parent_id, `order`, path, component, type, icon, is_hidden, is_active, create_user, update_user, permissionKey)
SELECT '里程碑基础访问', '里程碑基础访问权限：允许查看本人可见范围内的里程碑列表、详情及页面只读基础数据', @milestone_menu_id, '400', 'milestone-access', '', 'button', '', '1', '1', 'system', 'system', 'business/milestones/access'
WHERE @milestone_menu_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM sys_menu WHERE permissionKey = 'business/milestones/access' AND is_delete IS NULL);

INSERT INTO sys_menu (name, `desc`, parent_id, `order`, path, component, type, icon, is_hidden, is_active, create_user, update_user, permissionKey)
SELECT '风险基础访问', '风险基础访问权限：允许查看本人可见范围内的风险列表、详情及页面只读基础数据', @risk_menu_id, '420', 'risk-access', '', 'button', '', '1', '1', 'system', 'system', 'business/risks/access'
WHERE @risk_menu_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM sys_menu WHERE permissionKey = 'business/risks/access' AND is_delete IS NULL);

INSERT INTO sys_menu (name, `desc`, parent_id, `order`, path, component, type, icon, is_hidden, is_active, create_user, update_user, permissionKey)
SELECT '变更基础访问', '变更基础访问权限：允许查看本人可见范围内的变更列表、详情及页面只读基础数据', @change_menu_id, '440', 'change-access', '', 'button', '', '1', '1', 'system', 'system', 'business/changes/access'
WHERE @change_menu_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM sys_menu WHERE permissionKey = 'business/changes/access' AND is_delete IS NULL);

INSERT INTO sys_menu (name, `desc`, parent_id, `order`, path, component, type, icon, is_hidden, is_active, create_user, update_user, permissionKey)
SELECT '项目成员基础访问', '项目成员基础访问权限：允许查看本人可见范围内的项目成员列表、角色、统计和项目成员概览', @project_member_menu_id, '500', 'project-members-access', '', 'button', '', '1', '1', 'system', 'system', 'business/projectMembers/access'
WHERE @project_member_menu_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM sys_menu WHERE permissionKey = 'business/projectMembers/access' AND is_delete IS NULL);

INSERT INTO sys_menu (name, `desc`, parent_id, `order`, path, component, type, icon, is_hidden, is_active, create_user, update_user, permissionKey)
SELECT '任务评论基础访问', '任务评论基础访问权限：允许查看本人可见范围内的任务评论列表、任务评论和用户评论', @task_comment_menu_id, '520', 'task-comments-access', '', 'button', '', '1', '1', 'system', 'system', 'business/taskComments/access'
WHERE @task_comment_menu_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM sys_menu WHERE permissionKey = 'business/taskComments/access' AND is_delete IS NULL);

INSERT INTO sys_menu (name, `desc`, parent_id, `order`, path, component, type, icon, is_hidden, is_active, create_user, update_user, permissionKey)
SELECT '上线单基础访问', '上线单基础访问权限：允许查看本人可见范围内的上线单列表、详情及页面只读基础数据', @go_live_menu_id, '450', 'go-live-access', '', 'button', '', '1', '1', 'system', 'system', 'business/go-live-records/access'
WHERE @go_live_menu_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM sys_menu WHERE permissionKey = 'business/go-live-records/access' AND is_delete IS NULL);

INSERT INTO sys_menu (name, `desc`, parent_id, `order`, path, component, type, icon, is_hidden, is_active, create_user, update_user, permissionKey)
SELECT '验收单基础访问', '验收单基础访问权限：允许查看本人可见范围内的验收单列表、详情及页面只读基础数据', @acceptance_menu_id, '470', 'acceptance-access', '', 'button', '', '1', '1', 'system', 'system', 'business/acceptance-records/access'
WHERE @acceptance_menu_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM sys_menu WHERE permissionKey = 'business/acceptance-records/access' AND is_delete IS NULL);

INSERT INTO sys_menu (name, `desc`, parent_id, `order`, path, component, type, icon, is_hidden, is_active, create_user, update_user, permissionKey)
SELECT '交接单基础访问', '交接单基础访问权限：允许查看本人可见范围内的交接单列表、详情及页面只读基础数据', @handover_menu_id, '490', 'handover-access', '', 'button', '', '1', '1', 'system', 'system', 'business/handover-records/access'
WHERE @handover_menu_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM sys_menu WHERE permissionKey = 'business/handover-records/access' AND is_delete IS NULL);

INSERT INTO sys_menu (name, `desc`, parent_id, `order`, path, component, type, icon, is_hidden, is_active, create_user, update_user, permissionKey)
SELECT '客户基础访问', '客户基础访问权限：允许查看本人可见范围内的客户列表、详情、授权用户及页面只读基础数据', @customer_menu_id, '500', 'customer-access', '', 'button', '', '1', '1', 'system', 'system', 'business/crm/customers/access'
WHERE @customer_menu_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM sys_menu WHERE permissionKey = 'business/crm/customers/access' AND is_delete IS NULL);

INSERT INTO sys_menu (name, `desc`, parent_id, `order`, path, component, type, icon, is_hidden, is_active, create_user, update_user, permissionKey)
SELECT '互动记录基础访问', '互动记录基础访问权限：允许查看本人可见范围内的互动记录列表、详情、客户互动记录及页面只读基础数据', @interaction_menu_id, '530', 'interaction-access', '', 'button', '', '1', '1', 'system', 'system', 'business/crm/interactions/access'
WHERE @interaction_menu_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM sys_menu WHERE permissionKey = 'business/crm/interactions/access' AND is_delete IS NULL);

INSERT INTO sys_menu (name, `desc`, parent_id, `order`, path, component, type, icon, is_hidden, is_active, create_user, update_user, permissionKey)
SELECT '销售机会基础访问', '销售机会基础访问权限：允许查看本人可见范围内的销售机会列表、详情、统计及页面只读基础数据', @opportunity_menu_id, '510', 'opportunity-access', '', 'button', '', '1', '1', 'system', 'system', 'business/crm/opportunities/access'
WHERE @opportunity_menu_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM sys_menu WHERE permissionKey = 'business/crm/opportunities/access' AND is_delete IS NULL);

INSERT INTO sys_menu (name, `desc`, parent_id, `order`, path, component, type, icon, is_hidden, is_active, create_user, update_user, permissionKey)
SELECT '合同基础访问', '合同基础访问权限：允许查看本人可见范围内的合同列表、详情、统计及页面只读基础数据', @contract_menu_id, '520', 'contract-access', '', 'button', '', '1', '1', 'system', 'system', 'business/crm/contracts/access'
WHERE @contract_menu_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM sys_menu WHERE permissionKey = 'business/crm/contracts/access' AND is_delete IS NULL);

INSERT INTO sys_menu (name, `desc`, parent_id, `order`, path, component, type, icon, is_hidden, is_active, create_user, update_user, permissionKey)
SELECT '知识文章基础访问', '知识文章基础访问权限：允许查看本人可见范围内的知识文章列表、详情、首页、热词及页面只读基础数据', @article_menu_id, '600', 'article-access', '', 'button', '', '1', '1', 'system', 'system', 'business/articles/access'
WHERE @article_menu_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM sys_menu WHERE permissionKey = 'business/articles/access' AND is_delete IS NULL);

INSERT INTO sys_menu (name, `desc`, parent_id, `order`, path, component, type, icon, is_hidden, is_active, create_user, update_user, permissionKey)
SELECT '知识分类基础访问', '知识分类基础访问权限：允许查看知识分类树', @article_menu_id, '601', 'article-catalog-access', '', 'button', '', '1', '1', 'system', 'system', 'business/articleCatalogs/access'
WHERE @article_menu_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM sys_menu WHERE permissionKey = 'business/articleCatalogs/access' AND is_delete IS NULL);

INSERT INTO sys_menu (name, `desc`, parent_id, `order`, path, component, type, icon, is_hidden, is_active, create_user, update_user, permissionKey)
SELECT '流程定义基础访问', '流程定义基础访问权限：允许查看流程定义列表和详情', @workflow_menu_id, '5500', 'workflow-definitions-access', '', 'button', '', '1', '1', 'system', 'system', 'business/workflow/definitions/access'
WHERE @workflow_menu_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM sys_menu WHERE permissionKey = 'business/workflow/definitions/access' AND is_delete IS NULL);

INSERT INTO sys_menu (name, `desc`, parent_id, `order`, path, component, type, icon, is_hidden, is_active, create_user, update_user, permissionKey)
SELECT '流程实例基础访问', '流程实例基础访问权限：允许查看流程实例列表、详情、历史和任务', @workflow_menu_id, '5520', 'workflow-instances-access', '', 'button', '', '1', '1', 'system', 'system', 'business/workflow/instances/access'
WHERE @workflow_menu_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM sys_menu WHERE permissionKey = 'business/workflow/instances/access' AND is_delete IS NULL);

INSERT INTO sys_menu (name, `desc`, parent_id, `order`, path, component, type, icon, is_hidden, is_active, create_user, update_user, permissionKey)
SELECT '我的待办基础访问', '我的待办基础访问权限：允许查看我的待办和已处理记录', @workflow_menu_id, '5530', 'workflow-tasks-access', '', 'button', '', '1', '1', 'system', 'system', 'business/workflow/tasks/access'
WHERE @workflow_menu_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM sys_menu WHERE permissionKey = 'business/workflow/tasks/access' AND is_delete IS NULL);

INSERT INTO sys_menu (name, `desc`, parent_id, `order`, path, component, type, icon, is_hidden, is_active, create_user, update_user, permissionKey)
SELECT '流程业务配置基础访问', '流程业务配置基础访问权限：允许查看流程业务配置列表和详情', @workflow_menu_id, '5540', 'workflow-configs-access', '', 'button', '', '1', '1', 'system', 'system', 'business/workflow/configs/access'
WHERE @workflow_menu_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM sys_menu WHERE permissionKey = 'business/workflow/configs/access' AND is_delete IS NULL);

INSERT INTO sys_menu (name, `desc`, parent_id, `order`, path, component, type, icon, is_hidden, is_active, create_user, update_user, permissionKey)
SELECT '流程业务字段基础访问', '流程业务字段基础访问权限：允许查看流程业务字段列表和详情', @workflow_menu_id, '5550', 'workflow-fields-access', '', 'button', '', '1', '1', 'system', 'system', 'business/workflow/fields/access'
WHERE @workflow_menu_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM sys_menu WHERE permissionKey = 'business/workflow/fields/access' AND is_delete IS NULL);

INSERT IGNORE INTO sys_role_menu (role_id, menu_id)
SELECT @user_role_id, id
FROM sys_menu
WHERE @user_role_id IS NOT NULL
  AND is_delete IS NULL
  AND permissionKey IN (
    'business/projects/access',
    'business/tasks/access',
    'business/tasks/timelog/access',
    'business/tickets/access',
    'business/stories/access',
    'business/sprints/access',
    'business/milestones/access',
    'business/risks/access',
    'business/changes/access',
    'business/projectMembers/access',
    'business/taskComments/access',
    'business/go-live-records/access',
    'business/acceptance-records/access',
    'business/handover-records/access',
    'business/crm/customers/access',
    'business/crm/interactions/access',
    'business/crm/opportunities/access',
    'business/crm/contracts/access',
    'business/articles/access',
    'business/articleCatalogs/access',
    'business/workflow/definitions/access',
    'business/workflow/instances/access',
    'business/workflow/tasks/access',
    'business/workflow/configs/access',
    'business/workflow/fields/access'
  );
