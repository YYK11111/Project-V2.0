-- CRM模块权限分配SQL脚本
-- 为超级管理员角色（role_id=1）分配所有CRM菜单权限

-- 获取CRM相关菜单ID
SET @crm_menu_id = (SELECT id FROM sys_menu WHERE name = 'CRM客户管理' AND parent_id = 0);
SET @customer_menu_id = (SELECT id FROM sys_menu WHERE name = '客户管理' AND parent_id = @crm_menu_id);
SET @customer_list_menu_id = (SELECT id FROM sys_menu WHERE name = '客户列表');
SET @interaction_menu_id = (SELECT id FROM sys_menu WHERE name = '互动记录');
SET @interaction_list_menu_id = (SELECT id FROM sys_menu WHERE name = '互动列表');
SET @opportunity_menu_id = (SELECT id FROM sys_menu WHERE name = '销售机会');
SET @opportunity_list_menu_id = (SELECT id FROM sys_menu WHERE name = '机会列表');
SET @contract_menu_id = (SELECT id FROM sys_menu WHERE name = '合同管理');
SET @contract_list_menu_id = (SELECT id FROM sys_menu WHERE name = '合同列表');

-- 为超级管理员角色分配CRM菜单权限
INSERT INTO `sys_role_menu` (`roleId`, `menuId`) 
VALUES 
(1, @crm_menu_id),
(1, @customer_menu_id),
(1, @customer_list_menu_id),
(1, (SELECT id FROM sys_menu WHERE name = '客户表单')),
(1, (SELECT id FROM sys_menu WHERE name = '客户新增')),
(1, (SELECT id FROM sys_menu WHERE name = '客户编辑')),
(1, (SELECT id FROM sys_menu WHERE name = '客户删除')),
(1, @interaction_menu_id),
(1, @interaction_list_menu_id),
(1, (SELECT id FROM sys_menu WHERE name = '互动表单')),
(1, (SELECT id FROM sys_menu WHERE name = '互动新增')),
(1, (SELECT id FROM sys_menu WHERE name = '互动编辑')),
(1, (SELECT id FROM sys_menu WHERE name = '互动删除')),
(1, @opportunity_menu_id),
(1, @opportunity_list_menu_id),
(1, (SELECT id FROM sys_menu WHERE name = '机会表单')),
(1, (SELECT id FROM sys_menu WHERE name = '机会新增')),
(1, (SELECT id FROM sys_menu WHERE name = '机会编辑')),
(1, (SELECT id FROM sys_menu WHERE name = '机会删除')),
(1, @contract_menu_id),
(1, @contract_list_menu_id),
(1, (SELECT id FROM sys_menu WHERE name = '合同表单')),
(1, (SELECT id FROM sys_menu WHERE name = '合同新增')),
(1, (SELECT id FROM sys_menu WHERE name = '合同编辑')),
(1, (SELECT id FROM sys_menu WHERE name = '合同删除'));
