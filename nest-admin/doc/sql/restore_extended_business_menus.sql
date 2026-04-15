SET NAMES utf8mb4;

INSERT INTO sys_menu (name, path, component, type, parent_id, `order`, icon, is_hidden, is_active, is_delete, permissionKey, create_time, create_user, update_user)
SELECT 'Sprint管理', 'sprintManage', 'business/sprintManage/index', 'catalog', NULL, '8', 'calendar', '0', '1', NULL, 'business:sprint', NOW(), 'system', 'system'
WHERE NOT EXISTS (SELECT 1 FROM sys_menu WHERE path = 'sprintManage' AND is_delete IS NULL);

INSERT INTO sys_menu (name, path, component, type, parent_id, `order`, icon, is_hidden, is_active, is_delete, permissionKey, create_time, create_user, update_user)
SELECT '里程碑管理', 'milestoneManage', 'business/milestoneManage/index', 'catalog', NULL, '9', 'flag', '0', '1', NULL, 'business:milestone', NOW(), 'system', 'system'
WHERE NOT EXISTS (SELECT 1 FROM sys_menu WHERE path = 'milestoneManage' AND is_delete IS NULL);

INSERT INTO sys_menu (name, path, component, type, parent_id, `order`, icon, is_hidden, is_active, is_delete, permissionKey, create_time, create_user, update_user)
SELECT '风险管理', 'riskManage', 'business/riskManage/index', 'catalog', NULL, '10', 'warning', '0', '1', NULL, 'business:risk', NOW(), 'system', 'system'
WHERE NOT EXISTS (SELECT 1 FROM sys_menu WHERE path = 'riskManage' AND is_delete IS NULL);

INSERT INTO sys_menu (name, path, component, type, parent_id, `order`, icon, is_hidden, is_active, is_delete, permissionKey, create_time, create_user, update_user)
SELECT '变更管理', 'changeManage', 'business/changeManage/index', 'catalog', NULL, '11', 'refresh', '0', '1', NULL, 'business:change', NOW(), 'system', 'system'
WHERE NOT EXISTS (SELECT 1 FROM sys_menu WHERE path = 'changeManage' AND is_delete IS NULL);

INSERT INTO sys_menu (name, path, component, type, parent_id, `order`, icon, is_hidden, is_active, is_delete, permissionKey, create_time, create_user, update_user)
SELECT '项目成员', 'projectMemberManage', 'business/projectMemberManage/index', 'catalog', NULL, '12', 'peoples', '0', '1', NULL, 'business:projectMember', NOW(), 'system', 'system'
WHERE NOT EXISTS (SELECT 1 FROM sys_menu WHERE path = 'projectMemberManage' AND is_delete IS NULL);

INSERT INTO sys_menu (name, path, component, type, parent_id, `order`, icon, is_hidden, is_active, is_delete, permissionKey, create_time, create_user, update_user)
SELECT '任务评论', 'taskCommentManage', 'business/taskCommentManage/index', 'catalog', NULL, '13', 'message', '0', '1', NULL, 'business:taskComment', NOW(), 'system', 'system'
WHERE NOT EXISTS (SELECT 1 FROM sys_menu WHERE path = 'taskCommentManage' AND is_delete IS NULL);

INSERT INTO sys_menu (name, path, component, type, parent_id, `order`, icon, is_hidden, is_active, is_delete, permissionKey, create_time, create_user, update_user)
SELECT '任务汇报', 'taskReportManage', 'business/taskReportManage/index', 'catalog', NULL, '14', 'document', '0', '1', NULL, 'business:taskReport', NOW(), 'system', 'system'
WHERE NOT EXISTS (SELECT 1 FROM sys_menu WHERE path = 'taskReportManage' AND is_delete IS NULL);

INSERT INTO sys_menu (name, path, component, type, parent_id, `order`, icon, is_hidden, is_active, is_delete, permissionKey, create_time, create_user, update_user)
SELECT '用户故事', 'userStoryManage', 'business/userStoryManage/index', 'catalog', NULL, '15', 'list', '0', '1', NULL, 'business:userStory', NOW(), 'system', 'system'
WHERE NOT EXISTS (SELECT 1 FROM sys_menu WHERE path = 'userStoryManage' AND is_delete IS NULL);

-- CRM 主菜单及子菜单
INSERT INTO sys_menu (name, path, component, type, parent_id, `order`, icon, is_hidden, is_active, is_delete, permissionKey, create_time, create_user, update_user)
SELECT 'CRM客户管理', 'crm', '', 'catalog', NULL, '15', 'customer', '0', '1', NULL, 'business:crm', NOW(), 'system', 'system'
WHERE NOT EXISTS (SELECT 1 FROM sys_menu WHERE path = 'crm' AND is_delete IS NULL);

SET @crmId := (SELECT id FROM sys_menu WHERE path = 'crm' AND is_delete IS NULL LIMIT 1);

INSERT INTO sys_menu (name, path, component, type, parent_id, `order`, icon, is_hidden, is_active, is_delete, permissionKey, create_time, create_user, update_user)
SELECT '客户管理', 'customerManage', 'business/crm/customerManage/index', 'menu', @crmId, '1', 'peoples', '0', '1', NULL, 'business:crm:customer', NOW(), 'system', 'system'
WHERE NOT EXISTS (SELECT 1 FROM sys_menu WHERE component = 'business/crm/customerManage/index' AND is_delete IS NULL);

INSERT INTO sys_menu (name, path, component, type, parent_id, `order`, icon, is_hidden, is_active, is_delete, permissionKey, create_time, create_user, update_user)
SELECT '互动记录', 'interactionManage', 'business/crm/interactionManage/index', 'menu', @crmId, '2', 'phone', '0', '1', NULL, 'business:crm:interaction', NOW(), 'system', 'system'
WHERE NOT EXISTS (SELECT 1 FROM sys_menu WHERE component = 'business/crm/interactionManage/index' AND is_delete IS NULL);

INSERT INTO sys_menu (name, path, component, type, parent_id, `order`, icon, is_hidden, is_active, is_delete, permissionKey, create_time, create_user, update_user)
SELECT '销售机会', 'opportunityManage', 'business/crm/opportunityManage/index', 'menu', @crmId, '3', 'trend-charts', '0', '1', NULL, 'business:crm:opportunity', NOW(), 'system', 'system'
WHERE NOT EXISTS (SELECT 1 FROM sys_menu WHERE component = 'business/crm/opportunityManage/index' AND is_delete IS NULL);

INSERT INTO sys_menu (name, path, component, type, parent_id, `order`, icon, is_hidden, is_active, is_delete, permissionKey, create_time, create_user, update_user)
SELECT '合同管理', 'contractManage', 'business/crm/contractManage/index', 'menu', @crmId, '4', 'document', '0', '1', NULL, 'business:crm:contract', NOW(), 'system', 'system'
WHERE NOT EXISTS (SELECT 1 FROM sys_menu WHERE component = 'business/crm/contractManage/index' AND is_delete IS NULL);

INSERT IGNORE INTO sys_role_menu (role_id, menu_id)
SELECT 1, id FROM sys_menu WHERE is_delete IS NULL;
