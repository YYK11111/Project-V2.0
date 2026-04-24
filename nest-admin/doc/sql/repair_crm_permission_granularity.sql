SET NAMES utf8mb4;

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
SET @admin_role_id = (
  SELECT id FROM sys_role WHERE permissionKey = 'admin' ORDER BY id LIMIT 1
);

INSERT INTO sys_menu (name, `desc`, parent_id, `order`, path, component, type, icon, is_hidden, is_active, create_user, update_user, permissionKey)
SELECT '客户列表', '客户列表查询权限', @customer_menu_id, '501', 'crm-customers-list', '', 'button', '', '1', '1', 'system', 'system', 'business/crm/customers/list'
WHERE @customer_menu_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM sys_menu WHERE permissionKey = 'business/crm/customers/list' AND is_delete IS NULL);
INSERT INTO sys_menu (name, `desc`, parent_id, `order`, path, component, type, icon, is_hidden, is_active, create_user, update_user, permissionKey)
SELECT '客户新增', '客户新增权限', @customer_menu_id, '502', 'crm-customers-add', '', 'button', '', '1', '1', 'system', 'system', 'business/crm/customers/add'
WHERE @customer_menu_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM sys_menu WHERE permissionKey = 'business/crm/customers/add' AND is_delete IS NULL);
INSERT INTO sys_menu (name, `desc`, parent_id, `order`, path, component, type, icon, is_hidden, is_active, create_user, update_user, permissionKey)
SELECT '客户修改', '客户修改权限', @customer_menu_id, '503', 'crm-customers-update', '', 'button', '', '1', '1', 'system', 'system', 'business/crm/customers/update'
WHERE @customer_menu_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM sys_menu WHERE permissionKey = 'business/crm/customers/update' AND is_delete IS NULL);
INSERT INTO sys_menu (name, `desc`, parent_id, `order`, path, component, type, icon, is_hidden, is_active, create_user, update_user, permissionKey)
SELECT '客户删除', '客户删除权限', @customer_menu_id, '504', 'crm-customers-delete', '', 'button', '', '1', '1', 'system', 'system', 'business/crm/customers/delete'
WHERE @customer_menu_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM sys_menu WHERE permissionKey = 'business/crm/customers/delete' AND is_delete IS NULL);

INSERT INTO sys_menu (name, `desc`, parent_id, `order`, path, component, type, icon, is_hidden, is_active, create_user, update_user, permissionKey)
SELECT '互动列表', '互动列表查询权限', @interaction_menu_id, '531', 'crm-interactions-list', '', 'button', '', '1', '1', 'system', 'system', 'business/crm/interactions/list'
WHERE @interaction_menu_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM sys_menu WHERE permissionKey = 'business/crm/interactions/list' AND is_delete IS NULL);
INSERT INTO sys_menu (name, `desc`, parent_id, `order`, path, component, type, icon, is_hidden, is_active, create_user, update_user, permissionKey)
SELECT '互动新增', '互动新增权限', @interaction_menu_id, '532', 'crm-interactions-add', '', 'button', '', '1', '1', 'system', 'system', 'business/crm/interactions/add'
WHERE @interaction_menu_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM sys_menu WHERE permissionKey = 'business/crm/interactions/add' AND is_delete IS NULL);
INSERT INTO sys_menu (name, `desc`, parent_id, `order`, path, component, type, icon, is_hidden, is_active, create_user, update_user, permissionKey)
SELECT '互动修改', '互动修改权限', @interaction_menu_id, '533', 'crm-interactions-update', '', 'button', '', '1', '1', 'system', 'system', 'business/crm/interactions/update'
WHERE @interaction_menu_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM sys_menu WHERE permissionKey = 'business/crm/interactions/update' AND is_delete IS NULL);
INSERT INTO sys_menu (name, `desc`, parent_id, `order`, path, component, type, icon, is_hidden, is_active, create_user, update_user, permissionKey)
SELECT '互动删除', '互动删除权限', @interaction_menu_id, '534', 'crm-interactions-delete', '', 'button', '', '1', '1', 'system', 'system', 'business/crm/interactions/delete'
WHERE @interaction_menu_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM sys_menu WHERE permissionKey = 'business/crm/interactions/delete' AND is_delete IS NULL);

INSERT INTO sys_menu (name, `desc`, parent_id, `order`, path, component, type, icon, is_hidden, is_active, create_user, update_user, permissionKey)
SELECT '商机列表', '商机列表查询权限', @opportunity_menu_id, '511', 'crm-opportunities-list', '', 'button', '', '1', '1', 'system', 'system', 'business/crm/opportunities/list'
WHERE @opportunity_menu_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM sys_menu WHERE permissionKey = 'business/crm/opportunities/list' AND is_delete IS NULL);
INSERT INTO sys_menu (name, `desc`, parent_id, `order`, path, component, type, icon, is_hidden, is_active, create_user, update_user, permissionKey)
SELECT '商机新增', '商机新增权限', @opportunity_menu_id, '512', 'crm-opportunities-add', '', 'button', '', '1', '1', 'system', 'system', 'business/crm/opportunities/add'
WHERE @opportunity_menu_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM sys_menu WHERE permissionKey = 'business/crm/opportunities/add' AND is_delete IS NULL);
INSERT INTO sys_menu (name, `desc`, parent_id, `order`, path, component, type, icon, is_hidden, is_active, create_user, update_user, permissionKey)
SELECT '商机修改', '商机修改权限', @opportunity_menu_id, '513', 'crm-opportunities-update', '', 'button', '', '1', '1', 'system', 'system', 'business/crm/opportunities/update'
WHERE @opportunity_menu_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM sys_menu WHERE permissionKey = 'business/crm/opportunities/update' AND is_delete IS NULL);
INSERT INTO sys_menu (name, `desc`, parent_id, `order`, path, component, type, icon, is_hidden, is_active, create_user, update_user, permissionKey)
SELECT '商机删除', '商机删除权限', @opportunity_menu_id, '514', 'crm-opportunities-delete', '', 'button', '', '1', '1', 'system', 'system', 'business/crm/opportunities/delete'
WHERE @opportunity_menu_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM sys_menu WHERE permissionKey = 'business/crm/opportunities/delete' AND is_delete IS NULL);

INSERT INTO sys_menu (name, `desc`, parent_id, `order`, path, component, type, icon, is_hidden, is_active, create_user, update_user, permissionKey)
SELECT '合同列表', '合同列表查询权限', @contract_menu_id, '521', 'crm-contracts-list', '', 'button', '', '1', '1', 'system', 'system', 'business/crm/contracts/list'
WHERE @contract_menu_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM sys_menu WHERE permissionKey = 'business/crm/contracts/list' AND is_delete IS NULL);
INSERT INTO sys_menu (name, `desc`, parent_id, `order`, path, component, type, icon, is_hidden, is_active, create_user, update_user, permissionKey)
SELECT '合同新增', '合同新增权限', @contract_menu_id, '522', 'crm-contracts-add', '', 'button', '', '1', '1', 'system', 'system', 'business/crm/contracts/add'
WHERE @contract_menu_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM sys_menu WHERE permissionKey = 'business/crm/contracts/add' AND is_delete IS NULL);
INSERT INTO sys_menu (name, `desc`, parent_id, `order`, path, component, type, icon, is_hidden, is_active, create_user, update_user, permissionKey)
SELECT '合同修改', '合同修改权限', @contract_menu_id, '523', 'crm-contracts-update', '', 'button', '', '1', '1', 'system', 'system', 'business/crm/contracts/update'
WHERE @contract_menu_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM sys_menu WHERE permissionKey = 'business/crm/contracts/update' AND is_delete IS NULL);
INSERT INTO sys_menu (name, `desc`, parent_id, `order`, path, component, type, icon, is_hidden, is_active, create_user, update_user, permissionKey)
SELECT '合同删除', '合同删除权限', @contract_menu_id, '524', 'crm-contracts-delete', '', 'button', '', '1', '1', 'system', 'system', 'business/crm/contracts/delete'
WHERE @contract_menu_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM sys_menu WHERE permissionKey = 'business/crm/contracts/delete' AND is_delete IS NULL);

INSERT IGNORE INTO sys_role_menu (role_id, menu_id)
SELECT @admin_role_id, id
FROM sys_menu
WHERE @admin_role_id IS NOT NULL
  AND is_delete IS NULL
  AND permissionKey IN (
    'business/crm/customers/list', 'business/crm/customers/add', 'business/crm/customers/update', 'business/crm/customers/delete',
    'business/crm/interactions/list', 'business/crm/interactions/add', 'business/crm/interactions/update', 'business/crm/interactions/delete',
    'business/crm/opportunities/list', 'business/crm/opportunities/add', 'business/crm/opportunities/update', 'business/crm/opportunities/delete',
    'business/crm/contracts/list', 'business/crm/contracts/add', 'business/crm/contracts/update', 'business/crm/contracts/delete'
  );
