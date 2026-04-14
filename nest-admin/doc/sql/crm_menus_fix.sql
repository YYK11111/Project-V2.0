-- CRM菜单路由名称冲突修复脚本
-- 问题：二级菜单使用catalog类型且有component，导致与子菜单生成相同的路由名称
-- 解决：将二级菜单改为menu类型，移除冗余的子菜单结构

-- 删除现有的CRM相关菜单（先删权限，再按层级从子到父删除）

-- 1. 先删除所有角色权限关联
DELETE FROM `sys_role_menu` WHERE `menuId` IN (
    SELECT id FROM (SELECT id FROM `sys_menu` WHERE name LIKE '%CRM%' OR name LIKE '%客户管理%' OR name LIKE '%互动记录%' OR name LIKE '%销售机会%' OR name LIKE '%合同管理%' OR name LIKE '%客户列表%' OR name LIKE '%互动列表%' OR name LIKE '%机会列表%' OR name LIKE '%合同列表%' OR name LIKE '%客户表单%' OR name LIKE '%互动表单%' OR name LIKE '%机会表单%' OR name LIKE '%合同表单%' OR name LIKE '%客户新增%' OR name LIKE '%客户编辑%' OR name LIKE '%客户删除%' OR name LIKE '%互动新增%' OR name LIKE '%互动编辑%' OR name LIKE '%互动删除%' OR name LIKE '%机会新增%' OR name LIKE '%机会编辑%' OR name LIKE '%机会删除%' OR name LIKE '%合同新增%' OR name LIKE '%合同编辑%' OR name LIKE '%合同删除%') AS tmp
);

-- 2. 删除所有按钮权限（最底层 - 第4层）
DELETE FROM `sys_menu` WHERE type = 'button' AND parent_id IN (
    SELECT id FROM (SELECT id FROM `sys_menu` WHERE path = 'index' AND name IN ('客户列表', '互动列表', '机会列表', '合同列表')) AS tmp
);

-- 3. 删除所有表单页（第3层）
DELETE FROM `sys_menu` WHERE type = 'menu' AND path = 'form' AND parent_id IN (
    SELECT id FROM (SELECT id FROM `sys_menu` WHERE type = 'catalog' AND name IN ('客户管理', '互动记录', '销售机会', '合同管理')) AS tmp
);

-- 4. 删除所有列表页（第3层）
DELETE FROM `sys_menu` WHERE type = 'menu' AND path = 'index' AND name IN ('客户列表', '互动列表', '机会列表', '合同列表');

-- 5. 删除二级目录菜单（第2层）
DELETE FROM `sys_menu` WHERE type = 'catalog' AND name IN ('客户管理', '互动记录', '销售机会', '合同管理');

-- 6. 最后删除一级目录
DELETE FROM `sys_menu` WHERE name = 'CRM客户管理';

-- 重新插入CRM一级菜单（目录类型）
INSERT INTO `sys_menu` (`name`, `parent_id`, `type`, `path`, `component`, `icon`, `order`, `is_hidden`, `create_time`) 
VALUES ('CRM客户管理', 0, 'catalog', '/crm', '', 'customer', '5', '0', NOW());

SET @crm_menu_id = LAST_INSERT_ID();

-- 插入客户管理菜单（menu类型，直接指向列表页）
INSERT INTO `sys_menu` (`name`, `parent_id`, `type`, `path`, `component`, `icon`, `order`, `is_hidden`, `create_time`) 
VALUES ('客户管理', @crm_menu_id, 'menu', 'customer', 'business/crm/customerManage/index', 'peoples', '1', '0', NOW());

SET @customer_menu_id = LAST_INSERT_ID();

-- 客户管理子菜单 - 新增/编辑页（隐藏）
INSERT INTO `sys_menu` (`name`, `parent_id`, `type`, `path`, `component`, `icon`, `order`, `is_hidden`, `create_time`) 
VALUES ('客户表单', @customer_menu_id, 'menu', 'form', 'business/crm/customerManage/form', '', '1', '1', NOW());

-- 客户管理按钮权限
INSERT INTO `sys_menu` (`name`, `parent_id`, `type`, `path`, `component`, `icon`, `order`, `is_hidden`, `create_time`) 
VALUES ('客户新增', @customer_menu_id, 'button', '', '', '', '2', '1', NOW());

INSERT INTO `sys_menu` (`name`, `parent_id`, `type`, `path`, `component`, `icon`, `order`, `is_hidden`, `create_time`) 
VALUES ('客户编辑', @customer_menu_id, 'button', '', '', '', '3', '1', NOW());

INSERT INTO `sys_menu` (`name`, `parent_id`, `type`, `path`, `component`, `icon`, `order`, `is_hidden`, `create_time`) 
VALUES ('客户删除', @customer_menu_id, 'button', '', '', '', '4', '1', NOW());

-- 插入互动记录菜单（menu类型）
INSERT INTO `sys_menu` (`name`, `parent_id`, `type`, `path`, `component`, `icon`, `order`, `is_hidden`, `create_time`) 
VALUES ('互动记录', @crm_menu_id, 'menu', 'interaction', 'business/crm/interactionManage/index', 'phone', '2', '0', NOW());

SET @interaction_menu_id = LAST_INSERT_ID();

-- 互动记录子菜单 - 新增/编辑页（隐藏）
INSERT INTO `sys_menu` (`name`, `parent_id`, `type`, `path`, `component`, `icon`, `order`, `is_hidden`, `create_time`) 
VALUES ('互动表单', @interaction_menu_id, 'menu', 'form', 'business/crm/interactionManage/form', '', '1', '1', NOW());

-- 互动记录按钮权限
INSERT INTO `sys_menu` (`name`, `parent_id`, `type`, `path`, `component`, `icon`, `order`, `is_hidden`, `create_time`) 
VALUES ('互动新增', @interaction_menu_id, 'button', '', '', '', '2', '1', NOW());

INSERT INTO `sys_menu` (`name`, `parent_id`, `type`, `path`, `component`, `icon`, `order`, `is_hidden`, `create_time`) 
VALUES ('互动编辑', @interaction_menu_id, 'button', '', '', '', '3', '1', NOW());

INSERT INTO `sys_menu` (`name`, `parent_id`, `type`, `path`, `component`, `icon`, `order`, `is_hidden`, `create_time`) 
VALUES ('互动删除', @interaction_menu_id, 'button', '', '', '', '4', '1', NOW());

-- 插入销售机会菜单（menu类型）
INSERT INTO `sys_menu` (`name`, `parent_id`, `type`, `path`, `component`, `icon`, `order`, `is_hidden`, `create_time`) 
VALUES ('销售机会', @crm_menu_id, 'menu', 'opportunity', 'business/crm/opportunityManage/index', 'opportunity', '3', '0', NOW());

SET @opportunity_menu_id = LAST_INSERT_ID();

-- 销售机会子菜单 - 新增/编辑页（隐藏）
INSERT INTO `sys_menu` (`name`, `parent_id`, `type`, `path`, `component`, `icon`, `order`, `is_hidden`, `create_time`) 
VALUES ('机会表单', @opportunity_menu_id, 'menu', 'form', 'business/crm/opportunityManage/form', '', '1', '1', NOW());

-- 销售机会按钮权限
INSERT INTO `sys_menu` (`name`, `parent_id`, `type`, `path`, `component`, `icon`, `order`, `is_hidden`, `create_time`) 
VALUES ('机会新增', @opportunity_menu_id, 'button', '', '', '', '2', '1', NOW());

INSERT INTO `sys_menu` (`name`, `parent_id`, `type`, `path`, `component`, `icon`, `order`, `is_hidden`, `create_time`) 
VALUES ('机会编辑', @opportunity_menu_id, 'button', '', '', '', '3', '1', NOW());

INSERT INTO `sys_menu` (`name`, `parent_id`, `type`, `path`, `component`, `icon`, `order`, `is_hidden`, `create_time`) 
VALUES ('机会删除', @opportunity_menu_id, 'button', '', '', '', '4', '1', NOW());

-- 插入合同管理菜单（menu类型）
INSERT INTO `sys_menu` (`name`, `parent_id`, `type`, `path`, `component`, `icon`, `order`, `is_hidden`, `create_time`) 
VALUES ('合同管理', @crm_menu_id, 'menu', 'contract', 'business/crm/contractManage/index', 'document', '4', '0', NOW());

SET @contract_menu_id = LAST_INSERT_ID();

-- 合同管理子菜单 - 新增/编辑页（隐藏）
INSERT INTO `sys_menu` (`name`, `parent_id`, `type`, `path`, `component`, `icon`, `order`, `is_hidden`, `create_time`) 
VALUES ('合同表单', @contract_menu_id, 'menu', 'form', 'business/crm/contractManage/form', '', '1', '1', NOW());

-- 合同管理按钮权限
INSERT INTO `sys_menu` (`name`, `parent_id`, `type`, `path`, `component`, `icon`, `order`, `is_hidden`, `create_time`) 
VALUES ('合同新增', @contract_menu_id, 'button', '', '', '', '2', '1', NOW());

INSERT INTO `sys_menu` (`name`, `parent_id`, `type`, `path`, `component`, `icon`, `order`, `is_hidden`, `create_time`) 
VALUES ('合同编辑', @contract_menu_id, 'button', '', '', '', '3', '1', NOW());

INSERT INTO `sys_menu` (`name`, `parent_id`, `type`, `path`, `component`, `icon`, `order`, `is_hidden`, `create_time`) 
VALUES ('合同删除', @contract_menu_id, 'button', '', '', '', '4', '1', NOW());

-- 为超级管理员角色分配所有CRM菜单权限
INSERT INTO `sys_role_menu` (`roleId`, `menuId`) 
SELECT 1, id FROM `sys_menu` WHERE name LIKE '%CRM%' OR name LIKE '%客户管理%' OR name LIKE '%互动记录%' OR name LIKE '%销售机会%' OR name LIKE '%合同管理%';

-- 验证结果
SELECT '=== CRM菜单结构 ===' as info;
SELECT id, name, parent_id, type, path, component, is_hidden FROM sys_menu WHERE name LIKE '%CRM%' OR name LIKE '%客户管理%' OR name LIKE '%互动记录%' OR name LIKE '%销售机会%' OR name LIKE '%合同管理%' ORDER BY id;
