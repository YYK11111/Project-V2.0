-- ============================================
-- 工作流菜单初始化脚本
-- 添加工作流相关菜单到 sys_menu 表
-- 执行方式: mysql -uroot -p12345678 psd2 < add_workflow_menus.sql
-- ============================================

SET NAMES utf8mb4;

-- 1. 插入工作流顶级目录
INSERT INTO sys_menu (create_time, update_time, `desc`, parent_id, `order`, path, component, type, icon, is_hidden, is_active, is_delete, create_user, update_user, name) 
VALUES (NOW(), NOW(), '工作流管理', NULL, '3', 'workflow', '', 'catalog', 'workflow', '0', '1', NULL, 'admin', 'admin', '工作流管理');

-- 2. 插入子菜单
-- 说明: parent_id 通过子查询获取工作流管理目录的ID
INSERT INTO sys_menu (create_time, update_time, `desc`, parent_id, `order`, path, component, type, icon, is_hidden, is_active, is_delete, create_user, update_user, name) VALUES 
(NOW(), NOW(), '流程定义管理', (SELECT id FROM (SELECT id FROM sys_menu WHERE name = '工作流管理') as t), '1', 'index', 'business/workflow/index', 'menu', 'setting', '0', '1', NULL, 'admin', 'admin', '流程管理'),
(NOW(), NOW(), '流程设计器', (SELECT id FROM (SELECT id FROM sys_menu WHERE name = '工作流管理') as t), '2', 'designer', 'business/workflow/designer', 'menu', 'edit', '1', '1', NULL, 'admin', 'admin', '流程设计器'),
(NOW(), NOW(), '业务配置管理', (SELECT id FROM (SELECT id FROM sys_menu WHERE name = '工作流管理') as t), '3', 'businessConfig', 'business/workflow/businessConfig', 'menu', 'config', '0', '1', NULL, 'admin', 'admin', '业务配置'),
(NOW(), NOW(), '我的待办审批', (SELECT id FROM (SELECT id FROM sys_menu WHERE name = '工作流管理') as t), '4', 'tasks', 'business/workflow/tasks', 'menu', 'todo', '0', '1', NULL, 'admin', 'admin', '我的待办'),
(NOW(), NOW(), '流程实例列表', (SELECT id FROM (SELECT id FROM sys_menu WHERE name = '工作流管理') as t), '5', 'instances', 'business/workflow/instances', 'menu', 'list', '0', '1', NULL, 'admin', 'admin', '流程实例');

-- 3. 为 admin 角色添加权限 (roleId = 1)
INSERT INTO sys_role_menu (roleId, menuId)
SELECT 1, id FROM sys_menu WHERE name IN ('工作流管理', '流程管理', '流程设计器', '业务配置', '我的待办', '流程实例');

-- ============================================
-- 菜单结构说明:
-- 工作流管理 (catalog)
-- ├── 1. 流程管理        /workflow/index
-- ├── 2. 流程设计器      /workflow/designer (隐藏)
-- ├── 3. 业务配置        /workflow/businessConfig
-- ├── 4. 我的待办        /workflow/tasks
-- └── 5. 流程实例        /workflow/instances
-- ============================================