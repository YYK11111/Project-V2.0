-- Enrich business modules with granular permission buttons.
-- Safe to re-run.

SET FOREIGN_KEY_CHECKS = 0;

SET @business_root_id = (
  SELECT id FROM sys_menu WHERE path = 'business' AND type = 'menu' AND is_delete IS NULL ORDER BY id LIMIT 1
);
SET @project_menu_id = (SELECT id FROM sys_menu WHERE path = 'projectManage' AND is_delete IS NULL ORDER BY id LIMIT 1);
SET @task_menu_id = (SELECT id FROM sys_menu WHERE path = 'taskManage' AND is_delete IS NULL ORDER BY id LIMIT 1);
SET @ticket_menu_id = (SELECT id FROM sys_menu WHERE path = 'ticketManage' AND is_delete IS NULL ORDER BY id LIMIT 1);
SET @milestone_menu_id = (SELECT id FROM sys_menu WHERE path = 'milestoneManage' AND is_delete IS NULL ORDER BY id LIMIT 1);
SET @risk_menu_id = (SELECT id FROM sys_menu WHERE path = 'riskManage' AND is_delete IS NULL ORDER BY id LIMIT 1);
SET @sprint_menu_id = (SELECT id FROM sys_menu WHERE path = 'sprintManage' AND is_delete IS NULL ORDER BY id LIMIT 1);
SET @change_menu_id = (SELECT id FROM sys_menu WHERE path = 'changeManage' AND is_delete IS NULL ORDER BY id LIMIT 1);
SET @story_menu_id = COALESCE((SELECT id FROM sys_menu WHERE path = 'userStoryManage' AND is_delete IS NULL ORDER BY id LIMIT 1), @business_root_id);
SET @document_menu_id = (SELECT id FROM sys_menu WHERE path = 'documentManage' AND is_delete IS NULL ORDER BY id LIMIT 1);
SET @workflow_menu_id = (SELECT id FROM sys_menu WHERE path = 'workflow' AND is_delete IS NULL ORDER BY id LIMIT 1);
SET @admin_role_id = (SELECT id FROM sys_role WHERE permissionKey = 'admin' ORDER BY id LIMIT 1);

-- Projects
INSERT INTO sys_menu (name, `desc`, parent_id, `order`, path, component, type, icon, is_hidden, is_active, create_user, update_user, permissionKey)
SELECT '项目列表', '项目列表查询权限', @project_menu_id, '301', 'project-list', '', 'button', '', '1', '1', 'system', 'system', 'business/projects/list'
WHERE @project_menu_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM sys_menu WHERE permissionKey = 'business/projects/list' AND is_delete IS NULL);
INSERT INTO sys_menu (name, `desc`, parent_id, `order`, path, component, type, icon, is_hidden, is_active, create_user, update_user, permissionKey)
SELECT '项目详情', '项目详情查看权限', @project_menu_id, '302', 'project-getOne', '', 'button', '', '1', '1', 'system', 'system', 'business/projects/getOne'
WHERE @project_menu_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM sys_menu WHERE permissionKey = 'business/projects/getOne' AND is_delete IS NULL);
INSERT INTO sys_menu (name, `desc`, parent_id, `order`, path, component, type, icon, is_hidden, is_active, create_user, update_user, permissionKey)
SELECT '新增项目', '新增项目权限', @project_menu_id, '303', 'project-add', '', 'button', '', '1', '1', 'system', 'system', 'business/projects/add'
WHERE @project_menu_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM sys_menu WHERE permissionKey = 'business/projects/add' AND is_delete IS NULL);
INSERT INTO sys_menu (name, `desc`, parent_id, `order`, path, component, type, icon, is_hidden, is_active, create_user, update_user, permissionKey)
SELECT '修改项目', '修改项目权限', @project_menu_id, '304', 'project-update', '', 'button', '', '1', '1', 'system', 'system', 'business/projects/update'
WHERE @project_menu_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM sys_menu WHERE permissionKey = 'business/projects/update' AND is_delete IS NULL);
INSERT INTO sys_menu (name, `desc`, parent_id, `order`, path, component, type, icon, is_hidden, is_active, create_user, update_user, permissionKey)
SELECT '删除项目', '删除项目权限', @project_menu_id, '305', 'project-delete', '', 'button', '', '1', '1', 'system', 'system', 'business/projects/delete'
WHERE @project_menu_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM sys_menu WHERE permissionKey = 'business/projects/delete' AND is_delete IS NULL);
INSERT INTO sys_menu (name, `desc`, parent_id, `order`, path, component, type, icon, is_hidden, is_active, create_user, update_user, permissionKey)
SELECT '归档项目', '归档项目权限', @project_menu_id, '306', 'project-archive', '', 'button', '', '1', '1', 'system', 'system', 'business/projects/archive'
WHERE @project_menu_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM sys_menu WHERE permissionKey = 'business/projects/archive' AND is_delete IS NULL);
INSERT INTO sys_menu (name, `desc`, parent_id, `order`, path, component, type, icon, is_hidden, is_active, create_user, update_user, permissionKey)
SELECT '项目统计', '项目统计查看权限', @project_menu_id, '307', 'project-statistics', '', 'button', '', '1', '1', 'system', 'system', 'business/projects/statistics'
WHERE @project_menu_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM sys_menu WHERE permissionKey = 'business/projects/statistics' AND is_delete IS NULL);
INSERT INTO sys_menu (name, `desc`, parent_id, `order`, path, component, type, icon, is_hidden, is_active, create_user, update_user, permissionKey)
SELECT '提交项目审批', '提交项目审批权限', @project_menu_id, '308', 'project-submitApproval', '', 'button', '', '1', '1', 'system', 'system', 'business/projects/submitApproval'
WHERE @project_menu_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM sys_menu WHERE permissionKey = 'business/projects/submitApproval' AND is_delete IS NULL);
INSERT INTO sys_menu (name, `desc`, parent_id, `order`, path, component, type, icon, is_hidden, is_active, create_user, update_user, permissionKey)
SELECT '提交项目结项', '提交项目结项权限', @project_menu_id, '309', 'project-submitClose', '', 'button', '', '1', '1', 'system', 'system', 'business/projects/submitClose'
WHERE @project_menu_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM sys_menu WHERE permissionKey = 'business/projects/submitClose' AND is_delete IS NULL);

-- Tasks
INSERT INTO sys_menu (name, `desc`, parent_id, `order`, path, component, type, icon, is_hidden, is_active, create_user, update_user, permissionKey)
SELECT '任务列表', '任务列表查询权限', @task_menu_id, '321', 'task-list', '', 'button', '', '1', '1', 'system', 'system', 'business/tasks/list'
WHERE @task_menu_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM sys_menu WHERE permissionKey = 'business/tasks/list' AND is_delete IS NULL);
INSERT INTO sys_menu (name, `desc`, parent_id, `order`, path, component, type, icon, is_hidden, is_active, create_user, update_user, permissionKey)
SELECT '任务详情', '任务详情查看权限', @task_menu_id, '322', 'task-getOne', '', 'button', '', '1', '1', 'system', 'system', 'business/tasks/getOne'
WHERE @task_menu_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM sys_menu WHERE permissionKey = 'business/tasks/getOne' AND is_delete IS NULL);
INSERT INTO sys_menu (name, `desc`, parent_id, `order`, path, component, type, icon, is_hidden, is_active, create_user, update_user, permissionKey)
SELECT '新增任务', '新增任务权限', @task_menu_id, '323', 'task-add', '', 'button', '', '1', '1', 'system', 'system', 'business/tasks/add'
WHERE @task_menu_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM sys_menu WHERE permissionKey = 'business/tasks/add' AND is_delete IS NULL);
INSERT INTO sys_menu (name, `desc`, parent_id, `order`, path, component, type, icon, is_hidden, is_active, create_user, update_user, permissionKey)
SELECT '修改任务', '修改任务权限', @task_menu_id, '324', 'task-update', '', 'button', '', '1', '1', 'system', 'system', 'business/tasks/update'
WHERE @task_menu_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM sys_menu WHERE permissionKey = 'business/tasks/update' AND is_delete IS NULL);
INSERT INTO sys_menu (name, `desc`, parent_id, `order`, path, component, type, icon, is_hidden, is_active, create_user, update_user, permissionKey)
SELECT '删除任务', '删除任务权限', @task_menu_id, '325', 'task-delete', '', 'button', '', '1', '1', 'system', 'system', 'business/tasks/delete'
WHERE @task_menu_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM sys_menu WHERE permissionKey = 'business/tasks/delete' AND is_delete IS NULL);
INSERT INTO sys_menu (name, `desc`, parent_id, `order`, path, component, type, icon, is_hidden, is_active, create_user, update_user, permissionKey)
SELECT '更新任务进度', '更新任务进度权限', @task_menu_id, '326', 'task-updateProgress', '', 'button', '', '1', '1', 'system', 'system', 'business/tasks/updateProgress'
WHERE @task_menu_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM sys_menu WHERE permissionKey = 'business/tasks/updateProgress' AND is_delete IS NULL);
INSERT INTO sys_menu (name, `desc`, parent_id, `order`, path, component, type, icon, is_hidden, is_active, create_user, update_user, permissionKey)
SELECT '任务看板', '任务看板查看权限', @task_menu_id, '327', 'task-kanban', '', 'button', '', '1', '1', 'system', 'system', 'business/tasks/kanban'
WHERE @task_menu_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM sys_menu WHERE permissionKey = 'business/tasks/kanban' AND is_delete IS NULL);
INSERT INTO sys_menu (name, `desc`, parent_id, `order`, path, component, type, icon, is_hidden, is_active, create_user, update_user, permissionKey)
SELECT '任务依赖列表', '任务依赖列表权限', @task_menu_id, '328', 'task-dependency-list', '', 'button', '', '1', '1', 'system', 'system', 'business/tasks/dependency/list'
WHERE @task_menu_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM sys_menu WHERE permissionKey = 'business/tasks/dependency/list' AND is_delete IS NULL);
INSERT INTO sys_menu (name, `desc`, parent_id, `order`, path, component, type, icon, is_hidden, is_active, create_user, update_user, permissionKey)
SELECT '任务依赖新增', '任务依赖新增权限', @task_menu_id, '329', 'task-dependency-add', '', 'button', '', '1', '1', 'system', 'system', 'business/tasks/dependency/add'
WHERE @task_menu_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM sys_menu WHERE permissionKey = 'business/tasks/dependency/add' AND is_delete IS NULL);
INSERT INTO sys_menu (name, `desc`, parent_id, `order`, path, component, type, icon, is_hidden, is_active, create_user, update_user, permissionKey)
SELECT '任务依赖删除', '任务依赖删除权限', @task_menu_id, '330', 'task-dependency-delete', '', 'button', '', '1', '1', 'system', 'system', 'business/tasks/dependency/delete'
WHERE @task_menu_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM sys_menu WHERE permissionKey = 'business/tasks/dependency/delete' AND is_delete IS NULL);
INSERT INTO sys_menu (name, `desc`, parent_id, `order`, path, component, type, icon, is_hidden, is_active, create_user, update_user, permissionKey)
SELECT '工时记录列表', '工时记录列表权限', @task_menu_id, '331', 'task-timelog-list', '', 'button', '', '1', '1', 'system', 'system', 'business/tasks/timelog/list'
WHERE @task_menu_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM sys_menu WHERE permissionKey = 'business/tasks/timelog/list' AND is_delete IS NULL);
INSERT INTO sys_menu (name, `desc`, parent_id, `order`, path, component, type, icon, is_hidden, is_active, create_user, update_user, permissionKey)
SELECT '工时记录新增', '工时记录新增权限', @task_menu_id, '332', 'task-timelog-add', '', 'button', '', '1', '1', 'system', 'system', 'business/tasks/timelog/add'
WHERE @task_menu_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM sys_menu WHERE permissionKey = 'business/tasks/timelog/add' AND is_delete IS NULL);
INSERT INTO sys_menu (name, `desc`, parent_id, `order`, path, component, type, icon, is_hidden, is_active, create_user, update_user, permissionKey)
SELECT '工时记录删除', '工时记录删除权限', @task_menu_id, '333', 'task-timelog-delete', '', 'button', '', '1', '1', 'system', 'system', 'business/tasks/timelog/delete'
WHERE @task_menu_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM sys_menu WHERE permissionKey = 'business/tasks/timelog/delete' AND is_delete IS NULL);

-- Tickets
INSERT INTO sys_menu (name, `desc`, parent_id, `order`, path, component, type, icon, is_hidden, is_active, create_user, update_user, permissionKey)
SELECT '工单列表', '工单列表查询权限', @ticket_menu_id, '341', 'ticket-list', '', 'button', '', '1', '1', 'system', 'system', 'business/tickets/list'
WHERE @ticket_menu_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM sys_menu WHERE permissionKey = 'business/tickets/list' AND is_delete IS NULL);
INSERT INTO sys_menu (name, `desc`, parent_id, `order`, path, component, type, icon, is_hidden, is_active, create_user, update_user, permissionKey)
SELECT '工单详情', '工单详情查看权限', @ticket_menu_id, '342', 'ticket-getOne', '', 'button', '', '1', '1', 'system', 'system', 'business/tickets/getOne'
WHERE @ticket_menu_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM sys_menu WHERE permissionKey = 'business/tickets/getOne' AND is_delete IS NULL);
INSERT INTO sys_menu (name, `desc`, parent_id, `order`, path, component, type, icon, is_hidden, is_active, create_user, update_user, permissionKey)
SELECT '新增工单', '新增工单权限', @ticket_menu_id, '343', 'ticket-add', '', 'button', '', '1', '1', 'system', 'system', 'business/tickets/add'
WHERE @ticket_menu_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM sys_menu WHERE permissionKey = 'business/tickets/add' AND is_delete IS NULL);
INSERT INTO sys_menu (name, `desc`, parent_id, `order`, path, component, type, icon, is_hidden, is_active, create_user, update_user, permissionKey)
SELECT '修改工单', '修改工单权限', @ticket_menu_id, '344', 'ticket-update', '', 'button', '', '1', '1', 'system', 'system', 'business/tickets/update'
WHERE @ticket_menu_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM sys_menu WHERE permissionKey = 'business/tickets/update' AND is_delete IS NULL);
INSERT INTO sys_menu (name, `desc`, parent_id, `order`, path, component, type, icon, is_hidden, is_active, create_user, update_user, permissionKey)
SELECT '删除工单', '删除工单权限', @ticket_menu_id, '345', 'ticket-delete', '', 'button', '', '1', '1', 'system', 'system', 'business/tickets/delete'
WHERE @ticket_menu_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM sys_menu WHERE permissionKey = 'business/tickets/delete' AND is_delete IS NULL);

-- Stories
INSERT INTO sys_menu (name, `desc`, parent_id, `order`, path, component, type, icon, is_hidden, is_active, create_user, update_user, permissionKey)
SELECT '故事列表', '故事列表查询权限', @story_menu_id, '361', 'story-list', '', 'button', '', '1', '1', 'system', 'system', 'business/stories/list'
WHERE @story_menu_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM sys_menu WHERE permissionKey = 'business/stories/list' AND is_delete IS NULL);
INSERT INTO sys_menu (name, `desc`, parent_id, `order`, path, component, type, icon, is_hidden, is_active, create_user, update_user, permissionKey)
SELECT '故事详情', '故事详情查看权限', @story_menu_id, '362', 'story-getOne', '', 'button', '', '1', '1', 'system', 'system', 'business/stories/getOne'
WHERE @story_menu_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM sys_menu WHERE permissionKey = 'business/stories/getOne' AND is_delete IS NULL);
INSERT INTO sys_menu (name, `desc`, parent_id, `order`, path, component, type, icon, is_hidden, is_active, create_user, update_user, permissionKey)
SELECT '新增故事', '新增故事权限', @story_menu_id, '363', 'story-add', '', 'button', '', '1', '1', 'system', 'system', 'business/stories/add'
WHERE @story_menu_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM sys_menu WHERE permissionKey = 'business/stories/add' AND is_delete IS NULL);
INSERT INTO sys_menu (name, `desc`, parent_id, `order`, path, component, type, icon, is_hidden, is_active, create_user, update_user, permissionKey)
SELECT '修改故事', '修改故事权限', @story_menu_id, '364', 'story-update', '', 'button', '', '1', '1', 'system', 'system', 'business/stories/update'
WHERE @story_menu_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM sys_menu WHERE permissionKey = 'business/stories/update' AND is_delete IS NULL);
INSERT INTO sys_menu (name, `desc`, parent_id, `order`, path, component, type, icon, is_hidden, is_active, create_user, update_user, permissionKey)
SELECT '删除故事', '删除故事权限', @story_menu_id, '365', 'story-delete', '', 'button', '', '1', '1', 'system', 'system', 'business/stories/delete'
WHERE @story_menu_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM sys_menu WHERE permissionKey = 'business/stories/delete' AND is_delete IS NULL);
INSERT INTO sys_menu (name, `desc`, parent_id, `order`, path, component, type, icon, is_hidden, is_active, create_user, update_user, permissionKey)
SELECT 'Backlog查询', '故事Backlog查询权限', @story_menu_id, '366', 'story-backlog', '', 'button', '', '1', '1', 'system', 'system', 'business/stories/backlog'
WHERE @story_menu_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM sys_menu WHERE permissionKey = 'business/stories/backlog' AND is_delete IS NULL);
INSERT INTO sys_menu (name, `desc`, parent_id, `order`, path, component, type, icon, is_hidden, is_active, create_user, update_user, permissionKey)
SELECT '子故事查询', '子故事查询权限', @story_menu_id, '367', 'story-children', '', 'button', '', '1', '1', 'system', 'system', 'business/stories/children'
WHERE @story_menu_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM sys_menu WHERE permissionKey = 'business/stories/children' AND is_delete IS NULL);

-- Sprints / Milestones / Risks / Changes
INSERT INTO sys_menu (name, `desc`, parent_id, `order`, path, component, type, icon, is_hidden, is_active, create_user, update_user, permissionKey)
SELECT 'Sprint列表', 'Sprint列表查询权限', @sprint_menu_id, '381', 'sprint-list', '', 'button', '', '1', '1', 'system', 'system', 'business/sprints/list'
WHERE @sprint_menu_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM sys_menu WHERE permissionKey = 'business/sprints/list' AND is_delete IS NULL);
INSERT INTO sys_menu (name, `desc`, parent_id, `order`, path, component, type, icon, is_hidden, is_active, create_user, update_user, permissionKey)
SELECT 'Sprint新增', 'Sprint新增权限', @sprint_menu_id, '382', 'sprint-add', '', 'button', '', '1', '1', 'system', 'system', 'business/sprints/add'
WHERE @sprint_menu_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM sys_menu WHERE permissionKey = 'business/sprints/add' AND is_delete IS NULL);
INSERT INTO sys_menu (name, `desc`, parent_id, `order`, path, component, type, icon, is_hidden, is_active, create_user, update_user, permissionKey)
SELECT 'Sprint修改', 'Sprint修改权限', @sprint_menu_id, '383', 'sprint-update', '', 'button', '', '1', '1', 'system', 'system', 'business/sprints/update'
WHERE @sprint_menu_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM sys_menu WHERE permissionKey = 'business/sprints/update' AND is_delete IS NULL);
INSERT INTO sys_menu (name, `desc`, parent_id, `order`, path, component, type, icon, is_hidden, is_active, create_user, update_user, permissionKey)
SELECT 'Sprint删除', 'Sprint删除权限', @sprint_menu_id, '384', 'sprint-delete', '', 'button', '', '1', '1', 'system', 'system', 'business/sprints/delete'
WHERE @sprint_menu_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM sys_menu WHERE permissionKey = 'business/sprints/delete' AND is_delete IS NULL);

INSERT INTO sys_menu (name, `desc`, parent_id, `order`, path, component, type, icon, is_hidden, is_active, create_user, update_user, permissionKey)
SELECT '里程碑列表', '里程碑列表查询权限', @milestone_menu_id, '401', 'milestone-list', '', 'button', '', '1', '1', 'system', 'system', 'business/milestones/list'
WHERE @milestone_menu_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM sys_menu WHERE permissionKey = 'business/milestones/list' AND is_delete IS NULL);
INSERT INTO sys_menu (name, `desc`, parent_id, `order`, path, component, type, icon, is_hidden, is_active, create_user, update_user, permissionKey)
SELECT '里程碑新增', '里程碑新增权限', @milestone_menu_id, '402', 'milestone-add', '', 'button', '', '1', '1', 'system', 'system', 'business/milestones/add'
WHERE @milestone_menu_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM sys_menu WHERE permissionKey = 'business/milestones/add' AND is_delete IS NULL);
INSERT INTO sys_menu (name, `desc`, parent_id, `order`, path, component, type, icon, is_hidden, is_active, create_user, update_user, permissionKey)
SELECT '里程碑修改', '里程碑修改权限', @milestone_menu_id, '403', 'milestone-update', '', 'button', '', '1', '1', 'system', 'system', 'business/milestones/update'
WHERE @milestone_menu_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM sys_menu WHERE permissionKey = 'business/milestones/update' AND is_delete IS NULL);
INSERT INTO sys_menu (name, `desc`, parent_id, `order`, path, component, type, icon, is_hidden, is_active, create_user, update_user, permissionKey)
SELECT '里程碑删除', '里程碑删除权限', @milestone_menu_id, '404', 'milestone-delete', '', 'button', '', '1', '1', 'system', 'system', 'business/milestones/delete'
WHERE @milestone_menu_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM sys_menu WHERE permissionKey = 'business/milestones/delete' AND is_delete IS NULL);

INSERT INTO sys_menu (name, `desc`, parent_id, `order`, path, component, type, icon, is_hidden, is_active, create_user, update_user, permissionKey)
SELECT '风险列表', '风险列表查询权限', @risk_menu_id, '421', 'risk-list', '', 'button', '', '1', '1', 'system', 'system', 'business/risks/list'
WHERE @risk_menu_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM sys_menu WHERE permissionKey = 'business/risks/list' AND is_delete IS NULL);
INSERT INTO sys_menu (name, `desc`, parent_id, `order`, path, component, type, icon, is_hidden, is_active, create_user, update_user, permissionKey)
SELECT '风险新增', '风险新增权限', @risk_menu_id, '422', 'risk-add', '', 'button', '', '1', '1', 'system', 'system', 'business/risks/add'
WHERE @risk_menu_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM sys_menu WHERE permissionKey = 'business/risks/add' AND is_delete IS NULL);
INSERT INTO sys_menu (name, `desc`, parent_id, `order`, path, component, type, icon, is_hidden, is_active, create_user, update_user, permissionKey)
SELECT '风险修改', '风险修改权限', @risk_menu_id, '423', 'risk-update', '', 'button', '', '1', '1', 'system', 'system', 'business/risks/update'
WHERE @risk_menu_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM sys_menu WHERE permissionKey = 'business/risks/update' AND is_delete IS NULL);
INSERT INTO sys_menu (name, `desc`, parent_id, `order`, path, component, type, icon, is_hidden, is_active, create_user, update_user, permissionKey)
SELECT '风险删除', '风险删除权限', @risk_menu_id, '424', 'risk-delete', '', 'button', '', '1', '1', 'system', 'system', 'business/risks/delete'
WHERE @risk_menu_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM sys_menu WHERE permissionKey = 'business/risks/delete' AND is_delete IS NULL);

INSERT INTO sys_menu (name, `desc`, parent_id, `order`, path, component, type, icon, is_hidden, is_active, create_user, update_user, permissionKey)
SELECT '变更列表', '变更列表查询权限', @change_menu_id, '441', 'change-list', '', 'button', '', '1', '1', 'system', 'system', 'business/changes/list'
WHERE @change_menu_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM sys_menu WHERE permissionKey = 'business/changes/list' AND is_delete IS NULL);
INSERT INTO sys_menu (name, `desc`, parent_id, `order`, path, component, type, icon, is_hidden, is_active, create_user, update_user, permissionKey)
SELECT '变更新增', '变更新增权限', @change_menu_id, '442', 'change-add', '', 'button', '', '1', '1', 'system', 'system', 'business/changes/add'
WHERE @change_menu_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM sys_menu WHERE permissionKey = 'business/changes/add' AND is_delete IS NULL);
INSERT INTO sys_menu (name, `desc`, parent_id, `order`, path, component, type, icon, is_hidden, is_active, create_user, update_user, permissionKey)
SELECT '变更修改', '变更修改权限', @change_menu_id, '443', 'change-update', '', 'button', '', '1', '1', 'system', 'system', 'business/changes/update'
WHERE @change_menu_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM sys_menu WHERE permissionKey = 'business/changes/update' AND is_delete IS NULL);
INSERT INTO sys_menu (name, `desc`, parent_id, `order`, path, component, type, icon, is_hidden, is_active, create_user, update_user, permissionKey)
SELECT '变更删除', '变更删除权限', @change_menu_id, '444', 'change-delete', '', 'button', '', '1', '1', 'system', 'system', 'business/changes/delete'
WHERE @change_menu_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM sys_menu WHERE permissionKey = 'business/changes/delete' AND is_delete IS NULL);

-- Documents
INSERT INTO sys_menu (name, `desc`, parent_id, `order`, path, component, type, icon, is_hidden, is_active, create_user, update_user, permissionKey)
SELECT '文档列表', '文档列表查询权限', @document_menu_id, '461', 'document-list', '', 'button', '', '1', '1', 'system', 'system', 'business/documents/list'
WHERE @document_menu_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM sys_menu WHERE permissionKey = 'business/documents/list' AND is_delete IS NULL);
INSERT INTO sys_menu (name, `desc`, parent_id, `order`, path, component, type, icon, is_hidden, is_active, create_user, update_user, permissionKey)
SELECT '文档新增', '文档新增权限', @document_menu_id, '462', 'document-add', '', 'button', '', '1', '1', 'system', 'system', 'business/documents/add'
WHERE @document_menu_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM sys_menu WHERE permissionKey = 'business/documents/add' AND is_delete IS NULL);
INSERT INTO sys_menu (name, `desc`, parent_id, `order`, path, component, type, icon, is_hidden, is_active, create_user, update_user, permissionKey)
SELECT '文档修改', '文档修改权限', @document_menu_id, '463', 'document-update', '', 'button', '', '1', '1', 'system', 'system', 'business/documents/update'
WHERE @document_menu_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM sys_menu WHERE permissionKey = 'business/documents/update' AND is_delete IS NULL);
INSERT INTO sys_menu (name, `desc`, parent_id, `order`, path, component, type, icon, is_hidden, is_active, create_user, update_user, permissionKey)
SELECT '文档删除', '文档删除权限', @document_menu_id, '464', 'document-delete', '', 'button', '', '1', '1', 'system', 'system', 'business/documents/delete'
WHERE @document_menu_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM sys_menu WHERE permissionKey = 'business/documents/delete' AND is_delete IS NULL);

-- Project members / task comments / CRM under business root
INSERT INTO sys_menu (name, `desc`, parent_id, `order`, path, component, type, icon, is_hidden, is_active, create_user, update_user, permissionKey)
SELECT '项目成员列表', '项目成员列表权限', @business_root_id, '481', 'project-members-list', '', 'button', '', '1', '1', 'system', 'system', 'business/projectMembers/list'
WHERE @business_root_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM sys_menu WHERE permissionKey = 'business/projectMembers/list' AND is_delete IS NULL);
INSERT INTO sys_menu (name, `desc`, parent_id, `order`, path, component, type, icon, is_hidden, is_active, create_user, update_user, permissionKey)
SELECT '项目成员新增', '项目成员新增权限', @business_root_id, '482', 'project-members-add', '', 'button', '', '1', '1', 'system', 'system', 'business/projectMembers/add'
WHERE @business_root_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM sys_menu WHERE permissionKey = 'business/projectMembers/add' AND is_delete IS NULL);
INSERT INTO sys_menu (name, `desc`, parent_id, `order`, path, component, type, icon, is_hidden, is_active, create_user, update_user, permissionKey)
SELECT '项目成员修改', '项目成员修改权限', @business_root_id, '483', 'project-members-update', '', 'button', '', '1', '1', 'system', 'system', 'business/projectMembers/update'
WHERE @business_root_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM sys_menu WHERE permissionKey = 'business/projectMembers/update' AND is_delete IS NULL);
INSERT INTO sys_menu (name, `desc`, parent_id, `order`, path, component, type, icon, is_hidden, is_active, create_user, update_user, permissionKey)
SELECT '项目成员删除', '项目成员删除权限', @business_root_id, '484', 'project-members-delete', '', 'button', '', '1', '1', 'system', 'system', 'business/projectMembers/delete'
WHERE @business_root_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM sys_menu WHERE permissionKey = 'business/projectMembers/delete' AND is_delete IS NULL);

INSERT INTO sys_menu (name, `desc`, parent_id, `order`, path, component, type, icon, is_hidden, is_active, create_user, update_user, permissionKey)
SELECT '任务评论列表', '任务评论列表权限', @business_root_id, '485', 'task-comments-list', '', 'button', '', '1', '1', 'system', 'system', 'business/taskComments/list'
WHERE @business_root_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM sys_menu WHERE permissionKey = 'business/taskComments/list' AND is_delete IS NULL);
INSERT INTO sys_menu (name, `desc`, parent_id, `order`, path, component, type, icon, is_hidden, is_active, create_user, update_user, permissionKey)
SELECT '任务评论新增', '任务评论新增权限', @business_root_id, '486', 'task-comments-add', '', 'button', '', '1', '1', 'system', 'system', 'business/taskComments/add'
WHERE @business_root_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM sys_menu WHERE permissionKey = 'business/taskComments/add' AND is_delete IS NULL);
INSERT INTO sys_menu (name, `desc`, parent_id, `order`, path, component, type, icon, is_hidden, is_active, create_user, update_user, permissionKey)
SELECT '任务评论修改', '任务评论修改权限', @business_root_id, '487', 'task-comments-update', '', 'button', '', '1', '1', 'system', 'system', 'business/taskComments/update'
WHERE @business_root_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM sys_menu WHERE permissionKey = 'business/taskComments/update' AND is_delete IS NULL);
INSERT INTO sys_menu (name, `desc`, parent_id, `order`, path, component, type, icon, is_hidden, is_active, create_user, update_user, permissionKey)
SELECT '任务评论删除', '任务评论删除权限', @business_root_id, '488', 'task-comments-delete', '', 'button', '', '1', '1', 'system', 'system', 'business/taskComments/delete'
WHERE @business_root_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM sys_menu WHERE permissionKey = 'business/taskComments/delete' AND is_delete IS NULL);

INSERT INTO sys_menu (name, `desc`, parent_id, `order`, path, component, type, icon, is_hidden, is_active, create_user, update_user, permissionKey)
SELECT '客户列表', '客户列表查询权限', @business_root_id, '501', 'crm-customers-list', '', 'button', '', '1', '1', 'system', 'system', 'business/crm/customers/list'
WHERE @business_root_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM sys_menu WHERE permissionKey = 'business/crm/customers/list' AND is_delete IS NULL);
INSERT INTO sys_menu (name, `desc`, parent_id, `order`, path, component, type, icon, is_hidden, is_active, create_user, update_user, permissionKey)
SELECT '客户新增', '客户新增权限', @business_root_id, '502', 'crm-customers-add', '', 'button', '', '1', '1', 'system', 'system', 'business/crm/customers/add'
WHERE @business_root_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM sys_menu WHERE permissionKey = 'business/crm/customers/add' AND is_delete IS NULL);
INSERT INTO sys_menu (name, `desc`, parent_id, `order`, path, component, type, icon, is_hidden, is_active, create_user, update_user, permissionKey)
SELECT '客户修改', '客户修改权限', @business_root_id, '503', 'crm-customers-update', '', 'button', '', '1', '1', 'system', 'system', 'business/crm/customers/update'
WHERE @business_root_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM sys_menu WHERE permissionKey = 'business/crm/customers/update' AND is_delete IS NULL);
INSERT INTO sys_menu (name, `desc`, parent_id, `order`, path, component, type, icon, is_hidden, is_active, create_user, update_user, permissionKey)
SELECT '客户删除', '客户删除权限', @business_root_id, '504', 'crm-customers-delete', '', 'button', '', '1', '1', 'system', 'system', 'business/crm/customers/delete'
WHERE @business_root_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM sys_menu WHERE permissionKey = 'business/crm/customers/delete' AND is_delete IS NULL);

INSERT INTO sys_menu (name, `desc`, parent_id, `order`, path, component, type, icon, is_hidden, is_active, create_user, update_user, permissionKey)
SELECT '商机列表', '商机列表查询权限', @business_root_id, '511', 'crm-opportunities-list', '', 'button', '', '1', '1', 'system', 'system', 'business/crm/opportunities/list'
WHERE @business_root_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM sys_menu WHERE permissionKey = 'business/crm/opportunities/list' AND is_delete IS NULL);
INSERT INTO sys_menu (name, `desc`, parent_id, `order`, path, component, type, icon, is_hidden, is_active, create_user, update_user, permissionKey)
SELECT '商机新增', '商机新增权限', @business_root_id, '512', 'crm-opportunities-add', '', 'button', '', '1', '1', 'system', 'system', 'business/crm/opportunities/add'
WHERE @business_root_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM sys_menu WHERE permissionKey = 'business/crm/opportunities/add' AND is_delete IS NULL);
INSERT INTO sys_menu (name, `desc`, parent_id, `order`, path, component, type, icon, is_hidden, is_active, create_user, update_user, permissionKey)
SELECT '商机修改', '商机修改权限', @business_root_id, '513', 'crm-opportunities-update', '', 'button', '', '1', '1', 'system', 'system', 'business/crm/opportunities/update'
WHERE @business_root_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM sys_menu WHERE permissionKey = 'business/crm/opportunities/update' AND is_delete IS NULL);
INSERT INTO sys_menu (name, `desc`, parent_id, `order`, path, component, type, icon, is_hidden, is_active, create_user, update_user, permissionKey)
SELECT '商机删除', '商机删除权限', @business_root_id, '514', 'crm-opportunities-delete', '', 'button', '', '1', '1', 'system', 'system', 'business/crm/opportunities/delete'
WHERE @business_root_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM sys_menu WHERE permissionKey = 'business/crm/opportunities/delete' AND is_delete IS NULL);

INSERT INTO sys_menu (name, `desc`, parent_id, `order`, path, component, type, icon, is_hidden, is_active, create_user, update_user, permissionKey)
SELECT '合同列表', '合同列表查询权限', @business_root_id, '521', 'crm-contracts-list', '', 'button', '', '1', '1', 'system', 'system', 'business/crm/contracts/list'
WHERE @business_root_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM sys_menu WHERE permissionKey = 'business/crm/contracts/list' AND is_delete IS NULL);
INSERT INTO sys_menu (name, `desc`, parent_id, `order`, path, component, type, icon, is_hidden, is_active, create_user, update_user, permissionKey)
SELECT '合同新增', '合同新增权限', @business_root_id, '522', 'crm-contracts-add', '', 'button', '', '1', '1', 'system', 'system', 'business/crm/contracts/add'
WHERE @business_root_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM sys_menu WHERE permissionKey = 'business/crm/contracts/add' AND is_delete IS NULL);
INSERT INTO sys_menu (name, `desc`, parent_id, `order`, path, component, type, icon, is_hidden, is_active, create_user, update_user, permissionKey)
SELECT '合同修改', '合同修改权限', @business_root_id, '523', 'crm-contracts-update', '', 'button', '', '1', '1', 'system', 'system', 'business/crm/contracts/update'
WHERE @business_root_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM sys_menu WHERE permissionKey = 'business/crm/contracts/update' AND is_delete IS NULL);
INSERT INTO sys_menu (name, `desc`, parent_id, `order`, path, component, type, icon, is_hidden, is_active, create_user, update_user, permissionKey)
SELECT '合同删除', '合同删除权限', @business_root_id, '524', 'crm-contracts-delete', '', 'button', '', '1', '1', 'system', 'system', 'business/crm/contracts/delete'
WHERE @business_root_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM sys_menu WHERE permissionKey = 'business/crm/contracts/delete' AND is_delete IS NULL);

INSERT INTO sys_menu (name, `desc`, parent_id, `order`, path, component, type, icon, is_hidden, is_active, create_user, update_user, permissionKey)
SELECT '互动列表', '互动列表查询权限', @business_root_id, '531', 'crm-interactions-list', '', 'button', '', '1', '1', 'system', 'system', 'business/crm/interactions/list'
WHERE @business_root_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM sys_menu WHERE permissionKey = 'business/crm/interactions/list' AND is_delete IS NULL);
INSERT INTO sys_menu (name, `desc`, parent_id, `order`, path, component, type, icon, is_hidden, is_active, create_user, update_user, permissionKey)
SELECT '互动新增', '互动新增权限', @business_root_id, '532', 'crm-interactions-add', '', 'button', '', '1', '1', 'system', 'system', 'business/crm/interactions/add'
WHERE @business_root_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM sys_menu WHERE permissionKey = 'business/crm/interactions/add' AND is_delete IS NULL);
INSERT INTO sys_menu (name, `desc`, parent_id, `order`, path, component, type, icon, is_hidden, is_active, create_user, update_user, permissionKey)
SELECT '互动修改', '互动修改权限', @business_root_id, '533', 'crm-interactions-update', '', 'button', '', '1', '1', 'system', 'system', 'business/crm/interactions/update'
WHERE @business_root_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM sys_menu WHERE permissionKey = 'business/crm/interactions/update' AND is_delete IS NULL);
INSERT INTO sys_menu (name, `desc`, parent_id, `order`, path, component, type, icon, is_hidden, is_active, create_user, update_user, permissionKey)
SELECT '互动删除', '互动删除权限', @business_root_id, '534', 'crm-interactions-delete', '', 'button', '', '1', '1', 'system', 'system', 'business/crm/interactions/delete'
WHERE @business_root_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM sys_menu WHERE permissionKey = 'business/crm/interactions/delete' AND is_delete IS NULL);

-- Workflow
INSERT INTO sys_menu (name, `desc`, parent_id, `order`, path, component, type, icon, is_hidden, is_active, create_user, update_user, permissionKey)
SELECT '流程定义列表', '流程定义列表权限', @workflow_menu_id, '551', 'workflow-definitions-list', '', 'button', '', '1', '1', 'system', 'system', 'business/workflow/definitions/list'
WHERE @workflow_menu_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM sys_menu WHERE permissionKey = 'business/workflow/definitions/list' AND is_delete IS NULL);
INSERT INTO sys_menu (name, `desc`, parent_id, `order`, path, component, type, icon, is_hidden, is_active, create_user, update_user, permissionKey)
SELECT '流程定义新增', '流程定义新增权限', @workflow_menu_id, '552', 'workflow-definitions-add', '', 'button', '', '1', '1', 'system', 'system', 'business/workflow/definitions/add'
WHERE @workflow_menu_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM sys_menu WHERE permissionKey = 'business/workflow/definitions/add' AND is_delete IS NULL);
INSERT INTO sys_menu (name, `desc`, parent_id, `order`, path, component, type, icon, is_hidden, is_active, create_user, update_user, permissionKey)
SELECT '流程定义修改', '流程定义修改权限', @workflow_menu_id, '553', 'workflow-definitions-update', '', 'button', '', '1', '1', 'system', 'system', 'business/workflow/definitions/update'
WHERE @workflow_menu_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM sys_menu WHERE permissionKey = 'business/workflow/definitions/update' AND is_delete IS NULL);
INSERT INTO sys_menu (name, `desc`, parent_id, `order`, path, component, type, icon, is_hidden, is_active, create_user, update_user, permissionKey)
SELECT '流程定义删除', '流程定义删除权限', @workflow_menu_id, '554', 'workflow-definitions-delete', '', 'button', '', '1', '1', 'system', 'system', 'business/workflow/definitions/delete'
WHERE @workflow_menu_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM sys_menu WHERE permissionKey = 'business/workflow/definitions/delete' AND is_delete IS NULL);
INSERT INTO sys_menu (name, `desc`, parent_id, `order`, path, component, type, icon, is_hidden, is_active, create_user, update_user, permissionKey)
SELECT '流程定义发布', '流程定义发布权限', @workflow_menu_id, '555', 'workflow-definitions-publish', '', 'button', '', '1', '1', 'system', 'system', 'business/workflow/definitions/publish'
WHERE @workflow_menu_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM sys_menu WHERE permissionKey = 'business/workflow/definitions/publish' AND is_delete IS NULL);
INSERT INTO sys_menu (name, `desc`, parent_id, `order`, path, component, type, icon, is_hidden, is_active, create_user, update_user, permissionKey)
SELECT '流程定义发起', '流程定义发起权限', @workflow_menu_id, '5551', 'workflow-definitions-start', '', 'button', '', '1', '1', 'system', 'system', 'business/workflow/definitions/start'
WHERE @workflow_menu_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM sys_menu WHERE permissionKey = 'business/workflow/definitions/start' AND is_delete IS NULL);
INSERT INTO sys_menu (name, `desc`, parent_id, `order`, path, component, type, icon, is_hidden, is_active, create_user, update_user, permissionKey)
SELECT '流程定义复制', '流程定义复制权限', @workflow_menu_id, '5552', 'workflow-definitions-copy', '', 'button', '', '1', '1', 'system', 'system', 'business/workflow/definitions/copy'
WHERE @workflow_menu_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM sys_menu WHERE permissionKey = 'business/workflow/definitions/copy' AND is_delete IS NULL);
INSERT INTO sys_menu (name, `desc`, parent_id, `order`, path, component, type, icon, is_hidden, is_active, create_user, update_user, permissionKey)
SELECT '流程实例列表', '流程实例列表权限', @workflow_menu_id, '556', 'workflow-instances-list', '', 'button', '', '1', '1', 'system', 'system', 'business/workflow/instances/list'
WHERE @workflow_menu_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM sys_menu WHERE permissionKey = 'business/workflow/instances/list' AND is_delete IS NULL);
INSERT INTO sys_menu (name, `desc`, parent_id, `order`, path, component, type, icon, is_hidden, is_active, create_user, update_user, permissionKey)
SELECT '流程实例详情', '流程实例详情权限', @workflow_menu_id, '5561', 'workflow-instances-getOne', '', 'button', '', '1', '1', 'system', 'system', 'business/workflow/instances/getOne'
WHERE @workflow_menu_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM sys_menu WHERE permissionKey = 'business/workflow/instances/getOne' AND is_delete IS NULL);
INSERT INTO sys_menu (name, `desc`, parent_id, `order`, path, component, type, icon, is_hidden, is_active, create_user, update_user, permissionKey)
SELECT '流程实例撤回', '流程实例撤回权限', @workflow_menu_id, '5562', 'workflow-instances-withdraw', '', 'button', '', '1', '1', 'system', 'system', 'business/workflow/instances/withdraw'
WHERE @workflow_menu_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM sys_menu WHERE permissionKey = 'business/workflow/instances/withdraw' AND is_delete IS NULL);
INSERT INTO sys_menu (name, `desc`, parent_id, `order`, path, component, type, icon, is_hidden, is_active, create_user, update_user, permissionKey)
SELECT '流程实例终止', '流程实例终止权限', @workflow_menu_id, '5563', 'workflow-instances-cancel', '', 'button', '', '1', '1', 'system', 'system', 'business/workflow/instances/cancel'
WHERE @workflow_menu_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM sys_menu WHERE permissionKey = 'business/workflow/instances/cancel' AND is_delete IS NULL);
INSERT INTO sys_menu (name, `desc`, parent_id, `order`, path, component, type, icon, is_hidden, is_active, create_user, update_user, permissionKey)
SELECT '流程实例历史', '流程实例历史权限', @workflow_menu_id, '5564', 'workflow-instances-history', '', 'button', '', '1', '1', 'system', 'system', 'business/workflow/instances/history'
WHERE @workflow_menu_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM sys_menu WHERE permissionKey = 'business/workflow/instances/history' AND is_delete IS NULL);
INSERT INTO sys_menu (name, `desc`, parent_id, `order`, path, component, type, icon, is_hidden, is_active, create_user, update_user, permissionKey)
SELECT '流程实例任务', '流程实例任务权限', @workflow_menu_id, '5565', 'workflow-instances-tasks', '', 'button', '', '1', '1', 'system', 'system', 'business/workflow/instances/tasks'
WHERE @workflow_menu_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM sys_menu WHERE permissionKey = 'business/workflow/instances/tasks' AND is_delete IS NULL);
INSERT INTO sys_menu (name, `desc`, parent_id, `order`, path, component, type, icon, is_hidden, is_active, create_user, update_user, permissionKey)
SELECT '我的待办列表', '我的待办列表权限', @workflow_menu_id, '557', 'workflow-tasks-list', '', 'button', '', '1', '1', 'system', 'system', 'business/workflow/tasks/list'
WHERE @workflow_menu_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM sys_menu WHERE permissionKey = 'business/workflow/tasks/list' AND is_delete IS NULL);
INSERT INTO sys_menu (name, `desc`, parent_id, `order`, path, component, type, icon, is_hidden, is_active, create_user, update_user, permissionKey)
SELECT '待办审批', '待办审批权限', @workflow_menu_id, '5571', 'workflow-tasks-complete', '', 'button', '', '1', '1', 'system', 'system', 'business/workflow/tasks/complete'
WHERE @workflow_menu_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM sys_menu WHERE permissionKey = 'business/workflow/tasks/complete' AND is_delete IS NULL);
INSERT INTO sys_menu (name, `desc`, parent_id, `order`, path, component, type, icon, is_hidden, is_active, create_user, update_user, permissionKey)
SELECT '待办转交', '待办转交权限', @workflow_menu_id, '5572', 'workflow-tasks-transfer', '', 'button', '', '1', '1', 'system', 'system', 'business/workflow/tasks/transfer'
WHERE @workflow_menu_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM sys_menu WHERE permissionKey = 'business/workflow/tasks/transfer' AND is_delete IS NULL);
INSERT INTO sys_menu (name, `desc`, parent_id, `order`, path, component, type, icon, is_hidden, is_active, create_user, update_user, permissionKey)
SELECT '待办加签', '待办加签权限', @workflow_menu_id, '5573', 'workflow-tasks-add-sign', '', 'button', '', '1', '1', 'system', 'system', 'business/workflow/tasks/addSign'
WHERE @workflow_menu_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM sys_menu WHERE permissionKey = 'business/workflow/tasks/addSign' AND is_delete IS NULL);
INSERT INTO sys_menu (name, `desc`, parent_id, `order`, path, component, type, icon, is_hidden, is_active, create_user, update_user, permissionKey)
SELECT '业务配置列表', '业务配置列表权限', @workflow_menu_id, '558', 'workflow-configs-list', '', 'button', '', '1', '1', 'system', 'system', 'business/workflow/configs/list'
WHERE @workflow_menu_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM sys_menu WHERE permissionKey = 'business/workflow/configs/list' AND is_delete IS NULL);
INSERT INTO sys_menu (name, `desc`, parent_id, `order`, path, component, type, icon, is_hidden, is_active, create_user, update_user, permissionKey)
SELECT '业务配置详情', '业务配置详情权限', @workflow_menu_id, '5581', 'workflow-configs-getOne', '', 'button', '', '1', '1', 'system', 'system', 'business/workflow/configs/getOne'
WHERE @workflow_menu_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM sys_menu WHERE permissionKey = 'business/workflow/configs/getOne' AND is_delete IS NULL);
INSERT INTO sys_menu (name, `desc`, parent_id, `order`, path, component, type, icon, is_hidden, is_active, create_user, update_user, permissionKey)
SELECT '业务配置新增', '业务配置新增权限', @workflow_menu_id, '559', 'workflow-configs-add', '', 'button', '', '1', '1', 'system', 'system', 'business/workflow/configs/add'
WHERE @workflow_menu_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM sys_menu WHERE permissionKey = 'business/workflow/configs/add' AND is_delete IS NULL);
INSERT INTO sys_menu (name, `desc`, parent_id, `order`, path, component, type, icon, is_hidden, is_active, create_user, update_user, permissionKey)
SELECT '业务配置修改', '业务配置修改权限', @workflow_menu_id, '560', 'workflow-configs-update', '', 'button', '', '1', '1', 'system', 'system', 'business/workflow/configs/update'
WHERE @workflow_menu_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM sys_menu WHERE permissionKey = 'business/workflow/configs/update' AND is_delete IS NULL);
INSERT INTO sys_menu (name, `desc`, parent_id, `order`, path, component, type, icon, is_hidden, is_active, create_user, update_user, permissionKey)
SELECT '业务配置删除', '业务配置删除权限', @workflow_menu_id, '561', 'workflow-configs-delete', '', 'button', '', '1', '1', 'system', 'system', 'business/workflow/configs/delete'
WHERE @workflow_menu_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM sys_menu WHERE permissionKey = 'business/workflow/configs/delete' AND is_delete IS NULL);
INSERT INTO sys_menu (name, `desc`, parent_id, `order`, path, component, type, icon, is_hidden, is_active, create_user, update_user, permissionKey)
SELECT '业务字段列表', '业务字段列表权限', @workflow_menu_id, '562', 'workflow-fields-list', '', 'button', '', '1', '1', 'system', 'system', 'business/workflow/fields/list'
WHERE @workflow_menu_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM sys_menu WHERE permissionKey = 'business/workflow/fields/list' AND is_delete IS NULL);
INSERT INTO sys_menu (name, `desc`, parent_id, `order`, path, component, type, icon, is_hidden, is_active, create_user, update_user, permissionKey)
SELECT '业务字段初始化', '业务字段初始化权限', @workflow_menu_id, '563', 'workflow-fields-generate', '', 'button', '', '1', '1', 'system', 'system', 'business/workflow/fields/generate'
WHERE @workflow_menu_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM sys_menu WHERE permissionKey = 'business/workflow/fields/generate' AND is_delete IS NULL);
INSERT INTO sys_menu (name, `desc`, parent_id, `order`, path, component, type, icon, is_hidden, is_active, create_user, update_user, permissionKey)
SELECT '业务字段修改', '业务字段修改权限', @workflow_menu_id, '564', 'workflow-fields-update', '', 'button', '', '1', '1', 'system', 'system', 'business/workflow/fields/update'
WHERE @workflow_menu_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM sys_menu WHERE permissionKey = 'business/workflow/fields/update' AND is_delete IS NULL);
INSERT INTO sys_menu (name, `desc`, parent_id, `order`, path, component, type, icon, is_hidden, is_active, create_user, update_user, permissionKey)
SELECT '业务字段删除', '业务字段删除权限', @workflow_menu_id, '565', 'workflow-fields-delete', '', 'button', '', '1', '1', 'system', 'system', 'business/workflow/fields/delete'
WHERE @workflow_menu_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM sys_menu WHERE permissionKey = 'business/workflow/fields/delete' AND is_delete IS NULL);

-- Grant all first-batch business permissions to admin role.
INSERT IGNORE INTO sys_role_menu (role_id, menu_id)
SELECT @admin_role_id, id
FROM sys_menu
WHERE @admin_role_id IS NOT NULL
  AND is_delete IS NULL
  AND permissionKey IN (
    'business/projects/list', 'business/projects/getOne', 'business/projects/add', 'business/projects/update', 'business/projects/delete', 'business/projects/archive', 'business/projects/statistics', 'business/projects/submitApproval', 'business/projects/submitClose',
    'business/tasks/list', 'business/tasks/getOne', 'business/tasks/add', 'business/tasks/update', 'business/tasks/delete', 'business/tasks/updateProgress', 'business/tasks/kanban', 'business/tasks/dependency/list', 'business/tasks/dependency/add', 'business/tasks/dependency/delete', 'business/tasks/timelog/list', 'business/tasks/timelog/add', 'business/tasks/timelog/delete',
    'business/tickets/list', 'business/tickets/getOne', 'business/tickets/add', 'business/tickets/update', 'business/tickets/delete',
    'business/stories/list', 'business/stories/getOne', 'business/stories/add', 'business/stories/update', 'business/stories/delete', 'business/stories/backlog', 'business/stories/children',
    'business/sprints/list', 'business/sprints/add', 'business/sprints/update', 'business/sprints/delete',
    'business/milestones/list', 'business/milestones/add', 'business/milestones/update', 'business/milestones/delete',
    'business/risks/list', 'business/risks/add', 'business/risks/update', 'business/risks/delete',
    'business/changes/list', 'business/changes/add', 'business/changes/update', 'business/changes/delete'
    ,'business/documents/list', 'business/documents/add', 'business/documents/update', 'business/documents/delete'
    ,'business/projectMembers/list', 'business/projectMembers/add', 'business/projectMembers/update', 'business/projectMembers/delete'
    ,'business/taskComments/list', 'business/taskComments/add', 'business/taskComments/update', 'business/taskComments/delete'
    ,'business/crm/customers/list', 'business/crm/customers/add', 'business/crm/customers/update', 'business/crm/customers/delete'
    ,'business/crm/opportunities/list', 'business/crm/opportunities/add', 'business/crm/opportunities/update', 'business/crm/opportunities/delete'
    ,'business/crm/contracts/list', 'business/crm/contracts/add', 'business/crm/contracts/update', 'business/crm/contracts/delete'
    ,'business/crm/interactions/list', 'business/crm/interactions/add', 'business/crm/interactions/update', 'business/crm/interactions/delete'
    ,'business/workflow/definitions/list', 'business/workflow/definitions/add', 'business/workflow/definitions/update', 'business/workflow/definitions/delete', 'business/workflow/definitions/publish', 'business/workflow/definitions/start', 'business/workflow/definitions/copy'
    ,'business/workflow/instances/list', 'business/workflow/instances/getOne', 'business/workflow/instances/withdraw', 'business/workflow/instances/cancel', 'business/workflow/instances/history', 'business/workflow/instances/tasks'
    ,'business/workflow/tasks/list', 'business/workflow/tasks/complete', 'business/workflow/tasks/transfer', 'business/workflow/tasks/addSign'
    ,'business/workflow/configs/list', 'business/workflow/configs/getOne', 'business/workflow/configs/add', 'business/workflow/configs/update', 'business/workflow/configs/delete'
    ,'business/workflow/fields/list', 'business/workflow/fields/generate', 'business/workflow/fields/update', 'business/workflow/fields/delete'
  );

SET FOREIGN_KEY_CHECKS = 1;
