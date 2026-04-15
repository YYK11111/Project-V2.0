SET NAMES utf8mb4;

SET @projectId := (SELECT id FROM sys_menu WHERE path = 'projectManage' AND is_delete IS NULL LIMIT 1);
SET @taskId := (SELECT id FROM sys_menu WHERE path = 'taskManage' AND is_delete IS NULL LIMIT 1);
SET @ticketId := (SELECT id FROM sys_menu WHERE path = 'ticketManage' AND is_delete IS NULL LIMIT 1);
SET @documentId := (SELECT id FROM sys_menu WHERE path = 'documentManage' AND is_delete IS NULL LIMIT 1);
SET @sprintId := (SELECT id FROM sys_menu WHERE path = 'sprintManage' AND is_delete IS NULL LIMIT 1);
SET @milestoneId := (SELECT id FROM sys_menu WHERE path = 'milestoneManage' AND is_delete IS NULL LIMIT 1);
SET @riskId := (SELECT id FROM sys_menu WHERE path = 'riskManage' AND is_delete IS NULL LIMIT 1);
SET @changeId := (SELECT id FROM sys_menu WHERE path = 'changeManage' AND is_delete IS NULL LIMIT 1);
SET @storyId := (SELECT id FROM sys_menu WHERE path = 'userStoryManage' AND is_delete IS NULL LIMIT 1);
SET @customerId := (SELECT id FROM sys_menu WHERE path = 'customerManage' AND is_delete IS NULL LIMIT 1);
SET @interactionId := (SELECT id FROM sys_menu WHERE path = 'interactionManage' AND is_delete IS NULL LIMIT 1);
SET @opportunityId := (SELECT id FROM sys_menu WHERE path = 'opportunityManage' AND is_delete IS NULL LIMIT 1);
SET @contractId := (SELECT id FROM sys_menu WHERE path = 'contractManage' AND is_delete IS NULL LIMIT 1);

INSERT INTO sys_menu (name, path, component, type, parent_id, `order`, icon, is_hidden, is_active, is_delete, permissionKey, create_time, create_user, update_user)
SELECT '项目表单', 'form', 'business/projectManage/form', 'menu', @projectId, '90', '', '1', '1', NULL, NULL, NOW(), 'system', 'system'
WHERE @projectId IS NOT NULL AND NOT EXISTS (SELECT 1 FROM sys_menu WHERE parent_id = @projectId AND component = 'business/projectManage/form' AND is_delete IS NULL);

INSERT INTO sys_menu (name, path, component, type, parent_id, `order`, icon, is_hidden, is_active, is_delete, permissionKey, create_time, create_user, update_user)
SELECT '项目详情', 'detail', 'business/projectManage/detail', 'menu', @projectId, '91', '', '1', '1', NULL, NULL, NOW(), 'system', 'system'
WHERE @projectId IS NOT NULL AND NOT EXISTS (SELECT 1 FROM sys_menu WHERE parent_id = @projectId AND component = 'business/projectManage/detail' AND is_delete IS NULL);

INSERT INTO sys_menu (name, path, component, type, parent_id, `order`, icon, is_hidden, is_active, is_delete, permissionKey, create_time, create_user, update_user)
SELECT '任务表单', 'form', 'business/taskManage/form', 'menu', @taskId, '90', '', '1', '1', NULL, NULL, NOW(), 'system', 'system'
WHERE @taskId IS NOT NULL AND NOT EXISTS (SELECT 1 FROM sys_menu WHERE parent_id = @taskId AND component = 'business/taskManage/form' AND is_delete IS NULL);

INSERT INTO sys_menu (name, path, component, type, parent_id, `order`, icon, is_hidden, is_active, is_delete, permissionKey, create_time, create_user, update_user)
SELECT '工单表单', 'form', 'business/ticketManage/form', 'menu', @ticketId, '90', '', '1', '1', NULL, NULL, NOW(), 'system', 'system'
WHERE @ticketId IS NOT NULL AND NOT EXISTS (SELECT 1 FROM sys_menu WHERE parent_id = @ticketId AND component = 'business/ticketManage/form' AND is_delete IS NULL);

INSERT INTO sys_menu (name, path, component, type, parent_id, `order`, icon, is_hidden, is_active, is_delete, permissionKey, create_time, create_user, update_user)
SELECT '文档表单', 'form', 'business/documentManage/form', 'menu', @documentId, '90', '', '1', '1', NULL, NULL, NOW(), 'system', 'system'
WHERE @documentId IS NOT NULL AND NOT EXISTS (SELECT 1 FROM sys_menu WHERE parent_id = @documentId AND component = 'business/documentManage/form' AND is_delete IS NULL);

INSERT INTO sys_menu (name, path, component, type, parent_id, `order`, icon, is_hidden, is_active, is_delete, permissionKey, create_time, create_user, update_user)
SELECT 'Sprint表单', 'form', 'business/sprintManage/form', 'menu', @sprintId, '90', '', '1', '1', NULL, NULL, NOW(), 'system', 'system'
WHERE @sprintId IS NOT NULL AND NOT EXISTS (SELECT 1 FROM sys_menu WHERE parent_id = @sprintId AND component = 'business/sprintManage/form' AND is_delete IS NULL);

INSERT INTO sys_menu (name, path, component, type, parent_id, `order`, icon, is_hidden, is_active, is_delete, permissionKey, create_time, create_user, update_user)
SELECT 'Sprint详情', 'detail', 'business/sprintManage/detail', 'menu', @sprintId, '91', '', '1', '1', NULL, NULL, NOW(), 'system', 'system'
WHERE @sprintId IS NOT NULL AND NOT EXISTS (SELECT 1 FROM sys_menu WHERE parent_id = @sprintId AND component = 'business/sprintManage/detail' AND is_delete IS NULL);

INSERT INTO sys_menu (name, path, component, type, parent_id, `order`, icon, is_hidden, is_active, is_delete, permissionKey, create_time, create_user, update_user)
SELECT '里程碑表单', 'form', 'business/milestoneManage/form', 'menu', @milestoneId, '90', '', '1', '1', NULL, NULL, NOW(), 'system', 'system'
WHERE @milestoneId IS NOT NULL AND NOT EXISTS (SELECT 1 FROM sys_menu WHERE parent_id = @milestoneId AND component = 'business/milestoneManage/form' AND is_delete IS NULL);

INSERT INTO sys_menu (name, path, component, type, parent_id, `order`, icon, is_hidden, is_active, is_delete, permissionKey, create_time, create_user, update_user)
SELECT '风险表单', 'form', 'business/riskManage/form', 'menu', @riskId, '90', '', '1', '1', NULL, NULL, NOW(), 'system', 'system'
WHERE @riskId IS NOT NULL AND NOT EXISTS (SELECT 1 FROM sys_menu WHERE parent_id = @riskId AND component = 'business/riskManage/form' AND is_delete IS NULL);

INSERT INTO sys_menu (name, path, component, type, parent_id, `order`, icon, is_hidden, is_active, is_delete, permissionKey, create_time, create_user, update_user)
SELECT '变更表单', 'form', 'business/changeManage/form', 'menu', @changeId, '90', '', '1', '1', NULL, NULL, NOW(), 'system', 'system'
WHERE @changeId IS NOT NULL AND NOT EXISTS (SELECT 1 FROM sys_menu WHERE parent_id = @changeId AND component = 'business/changeManage/form' AND is_delete IS NULL);

INSERT INTO sys_menu (name, path, component, type, parent_id, `order`, icon, is_hidden, is_active, is_delete, permissionKey, create_time, create_user, update_user)
SELECT '用户故事表单', 'form', 'business/userStoryManage/form', 'menu', @storyId, '90', '', '1', '1', NULL, NULL, NOW(), 'system', 'system'
WHERE @storyId IS NOT NULL AND NOT EXISTS (SELECT 1 FROM sys_menu WHERE parent_id = @storyId AND component = 'business/userStoryManage/form' AND is_delete IS NULL);

INSERT INTO sys_menu (name, path, component, type, parent_id, `order`, icon, is_hidden, is_active, is_delete, permissionKey, create_time, create_user, update_user)
SELECT '客户表单', 'form', 'business/crm/customerManage/form', 'menu', @customerId, '90', '', '1', '1', NULL, NULL, NOW(), 'system', 'system'
WHERE @customerId IS NOT NULL AND NOT EXISTS (SELECT 1 FROM sys_menu WHERE parent_id = @customerId AND component = 'business/crm/customerManage/form' AND is_delete IS NULL);

INSERT INTO sys_menu (name, path, component, type, parent_id, `order`, icon, is_hidden, is_active, is_delete, permissionKey, create_time, create_user, update_user)
SELECT '互动表单', 'form', 'business/crm/interactionManage/form', 'menu', @interactionId, '90', '', '1', '1', NULL, NULL, NOW(), 'system', 'system'
WHERE @interactionId IS NOT NULL AND NOT EXISTS (SELECT 1 FROM sys_menu WHERE parent_id = @interactionId AND component = 'business/crm/interactionManage/form' AND is_delete IS NULL);

INSERT INTO sys_menu (name, path, component, type, parent_id, `order`, icon, is_hidden, is_active, is_delete, permissionKey, create_time, create_user, update_user)
SELECT '机会表单', 'form', 'business/crm/opportunityManage/form', 'menu', @opportunityId, '90', '', '1', '1', NULL, NULL, NOW(), 'system', 'system'
WHERE @opportunityId IS NOT NULL AND NOT EXISTS (SELECT 1 FROM sys_menu WHERE parent_id = @opportunityId AND component = 'business/crm/opportunityManage/form' AND is_delete IS NULL);

INSERT INTO sys_menu (name, path, component, type, parent_id, `order`, icon, is_hidden, is_active, is_delete, permissionKey, create_time, create_user, update_user)
SELECT '合同表单', 'form', 'business/crm/contractManage/form', 'menu', @contractId, '90', '', '1', '1', NULL, NULL, NOW(), 'system', 'system'
WHERE @contractId IS NOT NULL AND NOT EXISTS (SELECT 1 FROM sys_menu WHERE parent_id = @contractId AND component = 'business/crm/contractManage/form' AND is_delete IS NULL);

INSERT IGNORE INTO sys_role_menu (role_id, menu_id)
SELECT 1, id FROM sys_menu WHERE is_delete IS NULL;
