-- CRM二级菜单类型修复
-- 问题：二级菜单是menu类型但包含子路由，导致子路由无法渲染（404）
-- 解决：将二级菜单改为catalog类型作为路由容器

-- 1. 删除现有二级菜单及其子菜单
-- 先禁用外键检查
SET FOREIGN_KEY_CHECKS = 0;

-- 删除三级菜单（表单页、按钮权限）
DELETE m3 FROM `sys_menu` m3
INNER JOIN `sys_menu` m2 ON m3.parent_id = m2.id
INNER JOIN `sys_menu` m1 ON m2.parent_id = m1.id
WHERE m1.name = 'CRM客户管理';

-- 删除二级菜单
DELETE m2 FROM `sys_menu` m2
INNER JOIN `sys_menu` m1 ON m2.parent_id = m1.id
WHERE m1.name = 'CRM客户管理';

-- 删除权限关联
DELETE rm FROM `sys_role_menu` rm
INNER JOIN `sys_menu` m ON rm.menuId = m.id
WHERE m.parent_id IN (
    SELECT tmp.id FROM (
        SELECT id FROM `sys_menu` WHERE name = 'CRM客户管理'
    ) AS tmp
);

-- 恢复外键检查
SET FOREIGN_KEY_CHECKS = 1;

-- 2. 重新创建二级菜单为catalog类型（路由容器）

-- 客户管理（catalog - 路由容器）
INSERT INTO `sys_menu` (`name`, `parent_id`, `type`, `path`, `component`, `icon`, `order`, `is_hidden`, `create_time`) 
SELECT '客户管理', id, 'catalog', 'customer', '', 'peoples', '1', '0', NOW()
FROM `sys_menu` WHERE name = 'CRM客户管理';

SET @customer_catalog_id = LAST_INSERT_ID();

-- 客户管理 - 列表页（子路由）
INSERT INTO `sys_menu` (`name`, `parent_id`, `type`, `path`, `component`, `icon`, `order`, `is_hidden`, `create_time`) 
VALUES ('客户列表', @customer_catalog_id, 'menu', 'index', 'business/crm/customerManage/index', '', '1', '0', NOW());

SET @customer_list_id = LAST_INSERT_ID();

-- 客户管理 - 表单页（隐藏子路由）
INSERT INTO `sys_menu` (`name`, `parent_id`, `type`, `path`, `component`, `icon`, `order`, `is_hidden`, `create_time`) 
VALUES ('客户表单', @customer_catalog_id, 'menu', 'form', 'business/crm/customerManage/form', '', '2', '1', NOW());

-- 客户管理 - 按钮权限
INSERT INTO `sys_menu` (`name`, `parent_id`, `type`, `path`, `component`, `icon`, `order`, `is_hidden`, `create_time`) 
VALUES ('客户新增', @customer_catalog_id, 'button', '', '', '', '3', '1', NOW());

INSERT INTO `sys_menu` (`name`, `parent_id`, `type`, `path`, `component`, `icon`, `order`, `is_hidden`, `create_time`) 
VALUES ('客户编辑', @customer_catalog_id, 'button', '', '', '', '4', '1', NOW());

INSERT INTO `sys_menu` (`name`, `parent_id`, `type`, `path`, `component`, `icon`, `order`, `is_hidden`, `create_time`) 
VALUES ('客户删除', @customer_catalog_id, 'button', '', '', '', '5', '1', NOW());

-- 互动记录（catalog）
INSERT INTO `sys_menu` (`name`, `parent_id`, `type`, `path`, `component`, `icon`, `order`, `is_hidden`, `create_time`) 
SELECT '互动记录', id, 'catalog', 'interaction', '', 'phone', '2', '0', NOW()
FROM `sys_menu` WHERE name = 'CRM客户管理';

SET @interaction_catalog_id = LAST_INSERT_ID();

INSERT INTO `sys_menu` (`name`, `parent_id`, `type`, `path`, `component`, `icon`, `order`, `is_hidden`, `create_time`) 
VALUES ('互动列表', @interaction_catalog_id, 'menu', 'index', 'business/crm/interactionManage/index', '', '1', '0', NOW());

INSERT INTO `sys_menu` (`name`, `parent_id`, `type`, `path`, `component`, `icon`, `order`, `is_hidden`, `create_time`) 
VALUES ('互动表单', @interaction_catalog_id, 'menu', 'form', 'business/crm/interactionManage/form', '', '2', '1', NOW());

INSERT INTO `sys_menu` (`name`, `parent_id`, `type`, `path`, `component`, `icon`, `order`, `is_hidden`, `create_time`) 
VALUES ('互动新增', @interaction_catalog_id, 'button', '', '', '', '3', '1', NOW());

INSERT INTO `sys_menu` (`name`, `parent_id`, `type`, `path`, `component`, `icon`, `order`, `is_hidden`, `create_time`) 
VALUES ('互动编辑', @interaction_catalog_id, 'button', '', '', '', '4', '1', NOW());

INSERT INTO `sys_menu` (`name`, `parent_id`, `type`, `path`, `component`, `icon`, `order`, `is_hidden`, `create_time`) 
VALUES ('互动删除', @interaction_catalog_id, 'button', '', '', '', '5', '1', NOW());

-- 销售机会（catalog）
INSERT INTO `sys_menu` (`name`, `parent_id`, `type`, `path`, `component`, `icon`, `order`, `is_hidden`, `create_time`) 
SELECT '销售机会', id, 'catalog', 'opportunity', '', 'opportunity', '3', '0', NOW()
FROM `sys_menu` WHERE name = 'CRM客户管理';

SET @opportunity_catalog_id = LAST_INSERT_ID();

INSERT INTO `sys_menu` (`name`, `parent_id`, `type`, `path`, `component`, `icon`, `order`, `is_hidden`, `create_time`) 
VALUES ('机会列表', @opportunity_catalog_id, 'menu', 'index', 'business/crm/opportunityManage/index', '', '1', '0', NOW());

INSERT INTO `sys_menu` (`name`, `parent_id`, `type`, `path`, `component`, `icon`, `order`, `is_hidden`, `create_time`) 
VALUES ('机会表单', @opportunity_catalog_id, 'menu', 'form', 'business/crm/opportunityManage/form', '', '2', '1', NOW());

INSERT INTO `sys_menu` (`name`, `parent_id`, `type`, `path`, `component`, `icon`, `order`, `is_hidden`, `create_time`) 
VALUES ('机会新增', @opportunity_catalog_id, 'button', '', '', '', '3', '1', NOW());

INSERT INTO `sys_menu` (`name`, `parent_id`, `type`, `path`, `component`, `icon`, `order`, `is_hidden`, `create_time`) 
VALUES ('机会编辑', @opportunity_catalog_id, 'button', '', '', '', '4', '1', NOW());

INSERT INTO `sys_menu` (`name`, `parent_id`, `type`, `path`, `component`, `icon`, `order`, `is_hidden`, `create_time`) 
VALUES ('机会删除', @opportunity_catalog_id, 'button', '', '', '', '5', '1', NOW());

-- 合同管理（catalog）
INSERT INTO `sys_menu` (`name`, `parent_id`, `type`, `path`, `component`, `icon`, `order`, `is_hidden`, `create_time`) 
SELECT '合同管理', id, 'catalog', 'contract', '', 'document', '4', '0', NOW()
FROM `sys_menu` WHERE name = 'CRM客户管理';

SET @contract_catalog_id = LAST_INSERT_ID();

INSERT INTO `sys_menu` (`name`, `parent_id`, `type`, `path`, `component`, `icon`, `order`, `is_hidden`, `create_time`) 
VALUES ('合同列表', @contract_catalog_id, 'menu', 'index', 'business/crm/contractManage/index', '', '1', '0', NOW());

INSERT INTO `sys_menu` (`name`, `parent_id`, `type`, `path`, `component`, `icon`, `order`, `is_hidden`, `create_time`) 
VALUES ('合同表单', @contract_catalog_id, 'menu', 'form', 'business/crm/contractManage/form', '', '2', '1', NOW());

INSERT INTO `sys_menu` (`name`, `parent_id`, `type`, `path`, `component`, `icon`, `order`, `is_hidden`, `create_time`) 
VALUES ('合同新增', @contract_catalog_id, 'button', '', '', '', '3', '1', NOW());

INSERT INTO `sys_menu` (`name`, `parent_id`, `type`, `path`, `component`, `icon`, `order`, `is_hidden`, `create_time`) 
VALUES ('合同编辑', @contract_catalog_id, 'button', '', '', '', '4', '1', NOW());

INSERT INTO `sys_menu` (`name`, `parent_id`, `type`, `path`, `component`, `icon`, `order`, `is_hidden`, `create_time`) 
VALUES ('合同删除', @contract_catalog_id, 'button', '', '', '', '5', '1', NOW());

-- 3. 重新为超级管理员分配权限
INSERT INTO `sys_role_menu` (`roleId`, `menuId`) 
SELECT 1, id FROM `sys_menu` 
WHERE parent_id IN (SELECT id FROM `sys_menu` WHERE name = 'CRM客户管理')
OR parent_id IN (
    SELECT id FROM `sys_menu` 
    WHERE parent_id IN (SELECT id FROM `sys_menu` WHERE name = 'CRM客户管理')
)
ON DUPLICATE KEY UPDATE roleId = roleId;

-- 验证结果
SELECT '=== CRM菜单结构（修复后）===' as info;
SELECT 
    m1.id as '一级ID',
    m1.name as '一级菜单',
    m1.type as '一级类型',
    m2.id as '二级ID',
    m2.name as '二级菜单',
    m2.type as '二级类型',
    m2.path as '二级路径',
    m3.id as '三级ID',
    m3.name as '三级菜单',
    m3.type as '三级类型',
    m3.path as '三级路径',
    m3.component as '组件路径',
    m3.is_hidden as '是否隐藏'
FROM `sys_menu` m1
LEFT JOIN `sys_menu` m2 ON m2.parent_id = m1.id
LEFT JOIN `sys_menu` m3 ON m3.parent_id = m2.id
WHERE m1.name = 'CRM客户管理'
ORDER BY m1.id, m2.order, m3.order;
