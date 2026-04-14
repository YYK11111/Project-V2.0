-- 里程碑菜单
INSERT INTO sys_menu (parent_id, name, path, component, type, `order`, icon, is_hidden) 
VALUES (0, '里程碑管理', '/milestoneManage', '', 'catalog', 0, 'flag', 0);

SET @milestone_catalog = LAST_INSERT_ID();

INSERT INTO sys_menu (parent_id, name, path, component, type, `order`, icon, is_hidden) 
VALUES (@milestone_catalog, '里程碑列表', 'index', 'business/milestoneManage/index', 'menu', 0, 'list', 0);

INSERT INTO sys_menu (parent_id, name, path, component, type, `order`, icon, is_hidden) 
VALUES (@milestone_catalog, '新增里程碑', 'form', 'business/milestoneManage/form', 'menu', 1, '', 1);

INSERT INTO sys_menu (parent_id, name, path, component, type, `order`, icon, is_hidden) 
VALUES (@milestone_catalog, '编辑里程碑', 'form', 'business/milestoneManage/form', 'menu', 2, '', 1);

-- 风险管理菜单
INSERT INTO sys_menu (parent_id, name, path, component, type, `order`, icon, is_hidden) 
VALUES (0, '风险管理', '/riskManage', '', 'catalog', 0, 'warning', 0);

SET @risk_catalog = LAST_INSERT_ID();

INSERT INTO sys_menu (parent_id, name, path, component, type, `order`, icon, is_hidden) 
VALUES (@risk_catalog, '风险列表', 'index', 'business/riskManage/index', 'menu', 0, 'list', 0);

INSERT INTO sys_menu (parent_id, name, path, component, type, `order`, icon, is_hidden) 
VALUES (@risk_catalog, '新增风险', 'form', 'business/riskManage/form', 'menu', 1, '', 1);

INSERT INTO sys_menu (parent_id, name, path, component, type, `order`, icon, is_hidden) 
VALUES (@risk_catalog, '编辑风险', 'form', 'business/riskManage/form', 'menu', 2, '', 1);

-- Sprint管理菜单
INSERT INTO sys_menu (parent_id, name, path, component, type, `order`, icon, is_hidden) 
VALUES (0, 'Sprint管理', '/sprintManage', '', 'catalog', 0, 'set-up', 0);

SET @sprint_catalog = LAST_INSERT_ID();

INSERT INTO sys_menu (parent_id, name, path, component, type, `order`, icon, is_hidden) 
VALUES (@sprint_catalog, 'Sprint列表', 'index', 'business/sprintManage/index', 'menu', 0, 'list', 0);

INSERT INTO sys_menu (parent_id, name, path, component, type, `order`, icon, is_hidden) 
VALUES (@sprint_catalog, '新建Sprint', 'form', 'business/sprintManage/form', 'menu', 1, '', 1);

INSERT INTO sys_menu (parent_id, name, path, component, type, `order`, icon, is_hidden) 
VALUES (@sprint_catalog, '编辑Sprint', 'form', 'business/sprintManage/form', 'menu', 2, '', 1);

-- 变更管理菜单
INSERT INTO sys_menu (parent_id, name, path, component, type, `order`, icon, is_hidden) 
VALUES (0, '变更管理', '/changeManage', '', 'catalog', 0, 'document', 0);

SET @change_catalog = LAST_INSERT_ID();

INSERT INTO sys_menu (parent_id, name, path, component, type, `order`, icon, is_hidden) 
VALUES (@change_catalog, '变更列表', 'index', 'business/changeManage/index', 'menu', 0, 'list', 0);

INSERT INTO sys_menu (parent_id, name, path, component, type, `order`, icon, is_hidden) 
VALUES (@change_catalog, '新建变更', 'form', 'business/changeManage/form', 'menu', 1, '', 1);

INSERT INTO sys_menu (parent_id, name, path, component, type, `order`, icon, is_hidden) 
VALUES (@change_catalog, '编辑变更', 'form', 'business/changeManage/form', 'menu', 2, '', 1);

-- 赋予管理员角色权限
INSERT INTO sys_role_menu (roleId, menuId)
SELECT 1, id FROM sys_menu WHERE parent_id IN (
  SELECT id FROM sys_menu WHERE parent_id = 0 AND name IN ('里程碑管理', '风险管理', 'Sprint管理', '变更管理')
);