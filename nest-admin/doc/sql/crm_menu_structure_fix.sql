-- CRM菜单结构最终修复（参照项目管理模块）
-- 目标：将CRM改为一层结构，列表页和表单页都是一级菜单的直接子路由

SET FOREIGN_KEY_CHECKS = 0;

-- 1. 删除所有CRM相关菜单
DELETE m FROM `sys_menu` m
WHERE m.id IN (
    SELECT tmp.id FROM (
        SELECT id FROM `sys_menu` 
        WHERE name = 'CRM客户管理' 
        OR parent_id IN (SELECT id FROM `sys_menu` WHERE name = 'CRM客户管理')
        OR parent_id IN (
            SELECT id FROM `sys_menu` 
            WHERE parent_id IN (SELECT id FROM `sys_menu` WHERE name = 'CRM客户管理')
        )
    ) AS tmp
);

-- 删除权限关联
DELETE rm FROM `sys_role_menu` rm
INNER JOIN `sys_menu` m ON rm.menuId = m.id
WHERE m.name = 'CRM客户管理' 
OR m.parent_id IN (SELECT id FROM `sys_menu` WHERE name = 'CRM客户管理');

SET FOREIGN_KEY_CHECKS = 1;

-- 2. 重新创建CRM一级菜单（catalog - 路由容器）
INSERT INTO `sys_menu` (`name`, `parent_id`, `type`, `path`, `component`, `icon`, `order`, `is_hidden`, `create_time`) 
VALUES ('CRM客户管理', 25, 'catalog', '/crm', '', 'peoples', '4', '0', NOW());

SET @crm_catalog_id = LAST_INSERT_ID();

-- 3. 创建子菜单（直接作为一级菜单的子路由，参照项目管理结构）

-- 客户管理（列表页）
INSERT INTO `sys_menu` (`name`, `parent_id`, `type`, `path`, `component`, `icon`, `order`, `is_hidden`, `create_time`) 
VALUES ('客户管理', @crm_catalog_id, 'menu', 'customer', 'business/crm/customerManage/index', 'peoples', '1', '0', NOW());

SET @customer_menu_id = LAST_INSERT_ID();

-- 客户表单（隐藏，路径包含父级路径）
INSERT INTO `sys_menu` (`name`, `parent_id`, `type`, `path`, `component`, `icon`, `order`, `is_hidden`, `create_time`) 
VALUES ('客户表单', @crm_catalog_id, 'menu', 'customer/form', 'business/crm/customerManage/form', '', '2', '1', NOW());

-- 客户按钮权限（挂在客户管理下）
INSERT INTO `sys_menu` (`name`, `parent_id`, `type`, `path`, `component`, `icon`, `order`, `is_hidden`, `create_time`) 
VALUES ('客户新增', @customer_menu_id, 'button', '', '', '', '3', '1', NOW());

INSERT INTO `sys_menu` (`name`, `parent_id`, `type`, `path`, `component`, `icon`, `order`, `is_hidden`, `create_time`) 
VALUES ('客户编辑', @customer_menu_id, 'button', '', '', '', '4', '1', NOW());

INSERT INTO `sys_menu` (`name`, `parent_id`, `type`, `path`, `component`, `icon`, `order`, `is_hidden`, `create_time`) 
VALUES ('客户删除', @customer_menu_id, 'button', '', '', '', '5', '1', NOW());

-- 互动记录（列表页）
INSERT INTO `sys_menu` (`name`, `parent_id`, `type`, `path`, `component`, `icon`, `order`, `is_hidden`, `create_time`) 
VALUES ('互动记录', @crm_catalog_id, 'menu', 'interaction', 'business/crm/interactionManage/index', 'phone', '2', '0', NOW());

SET @interaction_menu_id = LAST_INSERT_ID();

-- 互动表单（隐藏）
INSERT INTO `sys_menu` (`name`, `parent_id`, `type`, `path`, `component`, `icon`, `order`, `is_hidden`, `create_time`) 
VALUES ('互动表单', @crm_catalog_id, 'menu', 'interaction/form', 'business/crm/interactionManage/form', '', '2', '1', NOW());

INSERT INTO `sys_menu` (`name`, `parent_id`, `type`, `path`, `component`, `icon`, `order`, `is_hidden`, `create_time`) 
VALUES ('互动新增', @interaction_menu_id, 'button', '', '', '', '3', '1', NOW());

INSERT INTO `sys_menu` (`name`, `parent_id`, `type`, `path`, `component`, `icon`, `order`, `is_hidden`, `create_time`) 
VALUES ('互动编辑', @interaction_menu_id, 'button', '', '', '', '4', '1', NOW());

INSERT INTO `sys_menu` (`name`, `parent_id`, `type`, `path`, `component`, `icon`, `order`, `is_hidden`, `create_time`) 
VALUES ('互动删除', @interaction_menu_id, 'button', '', '', '', '5', '1', NOW());

-- 销售机会（列表页）
INSERT INTO `sys_menu` (`name`, `parent_id`, `type`, `path`, `component`, `icon`, `order`, `is_hidden`, `create_time`) 
VALUES ('销售机会', @crm_catalog_id, 'menu', 'opportunity', 'business/crm/opportunityManage/index', 'opportunity', '3', '0', NOW());

SET @opportunity_menu_id = LAST_INSERT_ID();

-- 机会表单（隐藏）
INSERT INTO `sys_menu` (`name`, `parent_id`, `type`, `path`, `component`, `icon`, `order`, `is_hidden`, `create_time`) 
VALUES ('机会表单', @crm_catalog_id, 'menu', 'opportunity/form', 'business/crm/opportunityManage/form', '', '2', '1', NOW());

INSERT INTO `sys_menu` (`name`, `parent_id`, `type`, `path`, `component`, `icon`, `order`, `is_hidden`, `create_time`) 
VALUES ('机会新增', @opportunity_menu_id, 'button', '', '', '', '3', '1', NOW());

INSERT INTO `sys_menu` (`name`, `parent_id`, `type`, `path`, `component`, `icon`, `order`, `is_hidden`, `create_time`) 
VALUES ('机会编辑', @opportunity_menu_id, 'button', '', '', '', '4', '1', NOW());

INSERT INTO `sys_menu` (`name`, `parent_id`, `type`, `path`, `component`, `icon`, `order`, `is_hidden`, `create_time`) 
VALUES ('机会删除', @opportunity_menu_id, 'button', '', '', '', '5', '1', NOW());

-- 合同管理（列表页）
INSERT INTO `sys_menu` (`name`, `parent_id`, `type`, `path`, `component`, `icon`, `order`, `is_hidden`, `create_time`) 
VALUES ('合同管理', @crm_catalog_id, 'menu', 'contract', 'business/crm/contractManage/index', 'document', '4', '0', NOW());

SET @contract_menu_id = LAST_INSERT_ID();

-- 合同表单（隐藏）
INSERT INTO `sys_menu` (`name`, `parent_id`, `type`, `path`, `component`, `icon`, `order`, `is_hidden`, `create_time`) 
VALUES ('合同表单', @crm_catalog_id, 'menu', 'contract/form', 'business/crm/contractManage/form', '', '2', '1', NOW());

INSERT INTO `sys_menu` (`name`, `parent_id`, `type`, `path`, `component`, `icon`, `order`, `is_hidden`, `create_time`) 
VALUES ('合同新增', @contract_menu_id, 'button', '', '', '', '3', '1', NOW());

INSERT INTO `sys_menu` (`name`, `parent_id`, `type`, `path`, `component`, `icon`, `order`, `is_hidden`, `create_time`) 
VALUES ('合同编辑', @contract_menu_id, 'button', '', '', '', '4', '1', NOW());

INSERT INTO `sys_menu` (`name`, `parent_id`, `type`, `path`, `component`, `icon`, `order`, `is_hidden`, `create_time`) 
VALUES ('合同删除', @contract_menu_id, 'button', '', '', '', '5', '1', NOW());

-- 4. 为超级管理员分配权限
INSERT INTO `sys_role_menu` (`roleId`, `menuId`) 
SELECT 1, id FROM `sys_menu` 
WHERE name = 'CRM客户管理' 
OR parent_id IN (SELECT id FROM `sys_menu` WHERE name = 'CRM客户管理')
ON DUPLICATE KEY UPDATE roleId = roleId;

-- 验证结果
SELECT '=== CRM菜单结构（最终版 - 参照项目管理）===' as info;
SELECT 
    m1.id as '一级ID',
    m1.name as '一级菜单',
    m1.type as '类型',
    m1.path as '路径',
    m1.component as '组件',
    m2.id as '子菜单ID',
    m2.name as '子菜单',
    m2.type as '类型',
    m2.path as '路径',
    m2.component as '组件',
    m2.is_hidden as '是否隐藏'
FROM `sys_menu` m1
LEFT JOIN `sys_menu` m2 ON m2.parent_id = m1.id
WHERE m1.name = 'CRM客户管理'
ORDER BY m1.id, m2.`order`;
