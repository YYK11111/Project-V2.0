SET NAMES utf8mb4;

SET @change_menu_id = (SELECT id FROM sys_menu WHERE path = 'changeManage' AND is_delete IS NULL ORDER BY id LIMIT 1);
SET @story_menu_id = (SELECT id FROM sys_menu WHERE path = 'userStoryManage' AND is_delete IS NULL ORDER BY id LIMIT 1);
SET @customer_menu_id = (SELECT id FROM sys_menu WHERE path = 'customerManage' AND is_delete IS NULL ORDER BY id LIMIT 1);
SET @interaction_menu_id = (SELECT id FROM sys_menu WHERE path = 'interactionManage' AND is_delete IS NULL ORDER BY id LIMIT 1);
SET @opportunity_menu_id = (SELECT id FROM sys_menu WHERE path = 'opportunityManage' AND is_delete IS NULL ORDER BY id LIMIT 1);
SET @contract_menu_id = (SELECT id FROM sys_menu WHERE path = 'contractManage' AND is_delete IS NULL ORDER BY id LIMIT 1);
SET @workflow_menu_id = (SELECT id FROM sys_menu WHERE path = 'workflow' AND is_delete IS NULL ORDER BY id LIMIT 1);
SET @admin_role_id = (SELECT id FROM sys_role WHERE permissionKey = 'admin' ORDER BY id LIMIT 1);

-- changes getOne / approve
INSERT INTO sys_menu (name, `desc`, parent_id, `order`, path, component, type, icon, is_hidden, is_active, create_user, update_user, permissionKey)
SELECT '变更详情', '变更详情查看权限', @change_menu_id, '445', 'change-getOne', '', 'button', '', '1', '1', 'system', 'system', 'business/changes/getOne'
WHERE @change_menu_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM sys_menu WHERE permissionKey = 'business/changes/getOne' AND is_delete IS NULL);

INSERT INTO sys_menu (name, `desc`, parent_id, `order`, path, component, type, icon, is_hidden, is_active, create_user, update_user, permissionKey)
SELECT '变更审批', '变更审批权限', @change_menu_id, '446', 'change-approve', '', 'button', '', '1', '1', 'system', 'system', 'business/changes/approve'
WHERE @change_menu_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM sys_menu WHERE permissionKey = 'business/changes/approve' AND is_delete IS NULL);

-- stories getOne
INSERT INTO sys_menu (name, `desc`, parent_id, `order`, path, component, type, icon, is_hidden, is_active, create_user, update_user, permissionKey)
SELECT '故事详情', '故事详情查看权限', @story_menu_id, '368', 'story-detail', '', 'button', '', '1', '1', 'system', 'system', 'business/stories/getOne'
WHERE @story_menu_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM sys_menu WHERE permissionKey = 'business/stories/getOne' AND is_delete IS NULL);

-- CRM getOne/list/add/update/delete
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

-- workflow definition detail
INSERT INTO sys_menu (name, `desc`, parent_id, `order`, path, component, type, icon, is_hidden, is_active, create_user, update_user, permissionKey)
SELECT '流程定义详情', '流程定义详情权限', @workflow_menu_id, '5541', 'workflow-definition-getOne', '', 'button', '', '1', '1', 'system', 'system', 'business/workflow/definitions/getOne'
WHERE @workflow_menu_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM sys_menu WHERE permissionKey = 'business/workflow/definitions/getOne' AND is_delete IS NULL);

INSERT IGNORE INTO sys_role_menu (role_id, menu_id)
SELECT @admin_role_id, id
FROM sys_menu
WHERE @admin_role_id IS NOT NULL
  AND is_delete IS NULL
  AND permissionKey IN (
    'business/changes/getOne',
    'business/changes/approve',
    'business/stories/getOne',
    'business/crm/customers/getOne',
    'business/crm/interactions/getOne',
    'business/crm/opportunities/getOne',
    'business/crm/contracts/getOne',
    'business/workflow/definitions/getOne'
  );
