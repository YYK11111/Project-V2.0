-- CRM客户管理模块菜单初始化SQL脚本
-- 包含：CRM主菜单、客户管理、互动记录、销售机会、合同管理

-- 插入CRM一级菜单（目录类型）
INSERT INTO `sys_menu` (`name`, `parent_id`, `type`, `path`, `component`, `icon`, `order`, `is_hidden`, `create_time`) 
VALUES ('CRM客户管理', 0, 'catalog', '/crm', '', 'customer', '5', '0', NOW());

-- 获取刚插入的CRM菜单ID
SET @crm_menu_id = LAST_INSERT_ID();

-- 插入客户管理菜单（目录类型）
INSERT INTO `sys_menu` (`name`, `parent_id`, `type`, `path`, `component`, `icon`, `order`, `is_hidden`, `create_time`) 
VALUES ('客户管理', @crm_menu_id, 'catalog', 'customer', 'business/crm/customerManage/index', 'peoples', '1', '0', NOW());

SET @customer_menu_id = LAST_INSERT_ID();

-- 客户管理子菜单 - 列表页
INSERT INTO `sys_menu` (`name`, `parent_id`, `type`, `path`, `component`, `icon`, `order`, `is_hidden`, `create_time`) 
VALUES ('客户列表', @customer_menu_id, 'menu', 'index', 'business/crm/customerManage/index', 'list', '1', '0', NOW());

SET @customer_list_menu_id = LAST_INSERT_ID();

-- 客户管理子菜单 - 新增/编辑页（隐藏）
INSERT INTO `sys_menu` (`name`, `parent_id`, `type`, `path`, `component`, `icon`, `order`, `is_hidden`, `create_time`) 
VALUES ('客户表单', @customer_menu_id, 'menu', 'form', 'business/crm/customerManage/form', '', '2', '1', NOW());

-- 客户管理按钮权限
INSERT INTO `sys_menu` (`name`, `parent_id`, `type`, `path`, `component`, `icon`, `order`, `is_hidden`, `create_time`) 
VALUES ('客户新增', @customer_list_menu_id, 'button', '', '', '', '1', '1', NOW());

INSERT INTO `sys_menu` (`name`, `parent_id`, `type`, `path`, `component`, `icon`, `order`, `is_hidden`, `create_time`) 
VALUES ('客户编辑', @customer_list_menu_id, 'button', '', '', '', '2', '1', NOW());

INSERT INTO `sys_menu` (`name`, `parent_id`, `type`, `path`, `component`, `icon`, `order`, `is_hidden`, `create_time`) 
VALUES ('客户删除', @customer_list_menu_id, 'button', '', '', '', '3', '1', NOW());

-- 插入互动记录菜单（目录类型）
INSERT INTO `sys_menu` (`name`, `parent_id`, `type`, `path`, `component`, `icon`, `order`, `is_hidden`, `create_time`) 
VALUES ('互动记录', @crm_menu_id, 'catalog', 'interaction', 'business/crm/interactionManage/index', 'phone', '2', '0', NOW());

SET @interaction_menu_id = LAST_INSERT_ID();

-- 互动记录子菜单 - 列表页
INSERT INTO `sys_menu` (`name`, `parent_id`, `type`, `path`, `component`, `icon`, `order`, `is_hidden`, `create_time`) 
VALUES ('互动列表', @interaction_menu_id, 'menu', 'index', 'business/crm/interactionManage/index', 'list', '1', '0', NOW());

SET @interaction_list_menu_id = LAST_INSERT_ID();

-- 互动记录子菜单 - 新增/编辑页（隐藏）
INSERT INTO `sys_menu` (`name`, `parent_id`, `type`, `path`, `component`, `icon`, `order`, `is_hidden`, `create_time`) 
VALUES ('互动表单', @interaction_menu_id, 'menu', 'form', 'business/crm/interactionManage/form', '', '2', '1', NOW());

-- 互动记录按钮权限
INSERT INTO `sys_menu` (`name`, `parent_id`, `type`, `path`, `component`, `icon`, `order`, `is_hidden`, `create_time`) 
VALUES ('互动新增', @interaction_list_menu_id, 'button', '', '', '', '1', '1', NOW());

INSERT INTO `sys_menu` (`name`, `parent_id`, `type`, `path`, `component`, `icon`, `order`, `is_hidden`, `create_time`) 
VALUES ('互动编辑', @interaction_list_menu_id, 'button', '', '', '', '2', '1', NOW());

INSERT INTO `sys_menu` (`name`, `parent_id`, `type`, `path`, `component`, `icon`, `order`, `is_hidden`, `create_time`) 
VALUES ('互动删除', @interaction_list_menu_id, 'button', '', '', '', '3', '1', NOW());

-- 插入销售机会菜单（目录类型）
INSERT INTO `sys_menu` (`name`, `parent_id`, `type`, `path`, `component`, `icon`, `order`, `is_hidden`, `create_time`) 
VALUES ('销售机会', @crm_menu_id, 'catalog', 'opportunity', 'business/crm/opportunityManage/index', 'opportunity', '3', '0', NOW());

SET @opportunity_menu_id = LAST_INSERT_ID();

-- 销售机会子菜单 - 列表页
INSERT INTO `sys_menu` (`name`, `parent_id`, `type`, `path`, `component`, `icon`, `order`, `is_hidden`, `create_time`) 
VALUES ('机会列表', @opportunity_menu_id, 'menu', 'index', 'business/crm/opportunityManage/index', 'list', '1', '0', NOW());

SET @opportunity_list_menu_id = LAST_INSERT_ID();

-- 销售机会子菜单 - 新增/编辑页（隐藏）
INSERT INTO `sys_menu` (`name`, `parent_id`, `type`, `path`, `component`, `icon`, `order`, `is_hidden`, `create_time`) 
VALUES ('机会表单', @opportunity_menu_id, 'menu', 'form', 'business/crm/opportunityManage/form', '', '2', '1', NOW());

-- 销售机会按钮权限
INSERT INTO `sys_menu` (`name`, `parent_id`, `type`, `path`, `component`, `icon`, `order`, `is_hidden`, `create_time`) 
VALUES ('机会新增', @opportunity_list_menu_id, 'button', '', '', '', '1', '1', NOW());

INSERT INTO `sys_menu` (`name`, `parent_id`, `type`, `path`, `component`, `icon`, `order`, `is_hidden`, `create_time`) 
VALUES ('机会编辑', @opportunity_list_menu_id, 'button', '', '', '', '2', '1', NOW());

INSERT INTO `sys_menu` (`name`, `parent_id`, `type`, `path`, `component`, `icon`, `order`, `is_hidden`, `create_time`) 
VALUES ('机会删除', @opportunity_list_menu_id, 'button', '', '', '', '3', '1', NOW());

-- 插入合同管理菜单（目录类型）
INSERT INTO `sys_menu` (`name`, `parent_id`, `type`, `path`, `component`, `icon`, `order`, `is_hidden`, `create_time`) 
VALUES ('合同管理', @crm_menu_id, 'catalog', 'contract', 'business/crm/contractManage/index', 'document', '4', '0', NOW());

SET @contract_menu_id = LAST_INSERT_ID();

-- 合同管理子菜单 - 列表页
INSERT INTO `sys_menu` (`name`, `parent_id`, `type`, `path`, `component`, `icon`, `order`, `is_hidden`, `create_time`) 
VALUES ('合同列表', @contract_menu_id, 'menu', 'index', 'business/crm/contractManage/index', 'list', '1', '0', NOW());

SET @contract_list_menu_id = LAST_INSERT_ID();

-- 合同管理子菜单 - 新增/编辑页（隐藏）
INSERT INTO `sys_menu` (`name`, `parent_id`, `type`, `path`, `component`, `icon`, `order`, `is_hidden`, `create_time`) 
VALUES ('合同表单', @contract_menu_id, 'menu', 'form', 'business/crm/contractManage/form', '', '2', '1', NOW());

-- 合同管理按钮权限
INSERT INTO `sys_menu` (`name`, `parent_id`, `type`, `path`, `component`, `icon`, `order`, `is_hidden`, `create_time`) 
VALUES ('合同新增', @contract_list_menu_id, 'button', '', '', '', '1', '1', NOW());

INSERT INTO `sys_menu` (`name`, `parent_id`, `type`, `path`, `component`, `icon`, `order`, `is_hidden`, `create_time`) 
VALUES ('合同编辑', @contract_list_menu_id, 'button', '', '', '', '2', '1', NOW());

INSERT INTO `sys_menu` (`name`, `parent_id`, `type`, `path`, `component`, `icon`, `order`, `is_hidden`, `create_time`) 
VALUES ('合同删除', @contract_list_menu_id, 'button', '', '', '', '3', '1', NOW());
