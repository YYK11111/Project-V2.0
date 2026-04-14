-- Repair and enrich system management granular permissions.
-- Covers users, departments and roles management buttons.
-- Safe to re-run: inserts are guarded by permissionKey checks.

SET FOREIGN_KEY_CHECKS = 0;

SET @users_menu_id = (
  SELECT id
  FROM sys_menu
  WHERE path = 'users' AND type = 'menu' AND is_delete IS NULL
  ORDER BY id
  LIMIT 1
);

SET @roles_menu_id = (
  SELECT id
  FROM sys_menu
  WHERE path = 'roles' AND type = 'menu' AND is_delete IS NULL
  ORDER BY id
  LIMIT 1
);

SET @admin_role_id = (
  SELECT id
  FROM sys_role
  WHERE permissionKey = 'admin'
  ORDER BY id
  LIMIT 1
);

-- Users permission buttons
INSERT INTO sys_menu (name, `desc`, parent_id, `order`, path, component, type, icon, is_hidden, is_active, create_user, update_user, permissionKey)
SELECT '用户列表', '用户列表查询权限', @users_menu_id, '101', 'users-list', '', 'button', '', '1', '1', 'system', 'system', 'system/users/list'
WHERE @users_menu_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM sys_menu WHERE permissionKey = 'system/users/list' AND is_delete IS NULL);

INSERT INTO sys_menu (name, `desc`, parent_id, `order`, path, component, type, icon, is_hidden, is_active, create_user, update_user, permissionKey)
SELECT '用户详情', '用户详情查询权限', @users_menu_id, '102', 'users-getOne', '', 'button', '', '1', '1', 'system', 'system', 'system/users/getOne'
WHERE @users_menu_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM sys_menu WHERE permissionKey = 'system/users/getOne' AND is_delete IS NULL);

INSERT INTO sys_menu (name, `desc`, parent_id, `order`, path, component, type, icon, is_hidden, is_active, create_user, update_user, permissionKey)
SELECT '新增用户', '新增用户权限', @users_menu_id, '103', 'users-add', '', 'button', '', '1', '1', 'system', 'system', 'system/users/add'
WHERE @users_menu_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM sys_menu WHERE permissionKey = 'system/users/add' AND is_delete IS NULL);

INSERT INTO sys_menu (name, `desc`, parent_id, `order`, path, component, type, icon, is_hidden, is_active, create_user, update_user, permissionKey)
SELECT '修改用户', '修改用户权限', @users_menu_id, '104', 'users-update', '', 'button', '', '1', '1', 'system', 'system', 'system/users/update'
WHERE @users_menu_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM sys_menu WHERE permissionKey = 'system/users/update' AND is_delete IS NULL);

INSERT INTO sys_menu (name, `desc`, parent_id, `order`, path, component, type, icon, is_hidden, is_active, create_user, update_user, permissionKey)
SELECT '删除用户', '删除用户权限', @users_menu_id, '105', 'users-delete', '', 'button', '', '1', '1', 'system', 'system', 'system/users/delete'
WHERE @users_menu_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM sys_menu WHERE permissionKey = 'system/users/delete' AND is_delete IS NULL);

INSERT INTO sys_menu (name, `desc`, parent_id, `order`, path, component, type, icon, is_hidden, is_active, create_user, update_user, permissionKey)
SELECT '重置密码', '重置密码权限', @users_menu_id, '106', 'users-resetPassword', '', 'button', '', '1', '1', 'system', 'system', 'system/users/resetPassword'
WHERE @users_menu_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM sys_menu WHERE permissionKey = 'system/users/resetPassword' AND is_delete IS NULL);

INSERT INTO sys_menu (name, `desc`, parent_id, `order`, path, component, type, icon, is_hidden, is_active, create_user, update_user, permissionKey)
SELECT '管理管理员用户', '操作管理员用户权限', @users_menu_id, '107', 'users-manageAdmin', '', 'button', '', '1', '1', 'system', 'system', 'system/users/manageAdmin'
WHERE @users_menu_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM sys_menu WHERE permissionKey = 'system/users/manageAdmin' AND is_delete IS NULL);

-- Department permission buttons (managed inside users page)
INSERT INTO sys_menu (name, `desc`, parent_id, `order`, path, component, type, icon, is_hidden, is_active, create_user, update_user, permissionKey)
SELECT '部门树查询', '查询部门树权限', @users_menu_id, '121', 'dept-tree', '', 'button', '', '1', '1', 'system', 'system', 'system/dept/tree'
WHERE @users_menu_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM sys_menu WHERE permissionKey = 'system/dept/tree' AND is_delete IS NULL);

INSERT INTO sys_menu (name, `desc`, parent_id, `order`, path, component, type, icon, is_hidden, is_active, create_user, update_user, permissionKey)
SELECT '部门详情', '查询部门详情权限', @users_menu_id, '122', 'dept-getOne', '', 'button', '', '1', '1', 'system', 'system', 'system/dept/getOne'
WHERE @users_menu_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM sys_menu WHERE permissionKey = 'system/dept/getOne' AND is_delete IS NULL);

INSERT INTO sys_menu (name, `desc`, parent_id, `order`, path, component, type, icon, is_hidden, is_active, create_user, update_user, permissionKey)
SELECT '新增部门', '新增部门权限', @users_menu_id, '123', 'dept-add', '', 'button', '', '1', '1', 'system', 'system', 'system/dept/add'
WHERE @users_menu_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM sys_menu WHERE permissionKey = 'system/dept/add' AND is_delete IS NULL);

INSERT INTO sys_menu (name, `desc`, parent_id, `order`, path, component, type, icon, is_hidden, is_active, create_user, update_user, permissionKey)
SELECT '修改部门', '修改部门权限', @users_menu_id, '124', 'dept-update', '', 'button', '', '1', '1', 'system', 'system', 'system/dept/update'
WHERE @users_menu_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM sys_menu WHERE permissionKey = 'system/dept/update' AND is_delete IS NULL);

INSERT INTO sys_menu (name, `desc`, parent_id, `order`, path, component, type, icon, is_hidden, is_active, create_user, update_user, permissionKey)
SELECT '删除部门', '删除部门权限', @users_menu_id, '125', 'dept-delete', '', 'button', '', '1', '1', 'system', 'system', 'system/dept/delete'
WHERE @users_menu_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM sys_menu WHERE permissionKey = 'system/dept/delete' AND is_delete IS NULL);

INSERT INTO sys_menu (name, `desc`, parent_id, `order`, path, component, type, icon, is_hidden, is_active, create_user, update_user, permissionKey)
SELECT '管理受保护部门', '操作受保护部门权限', @users_menu_id, '126', 'dept-manageProtected', '', 'button', '', '1', '1', 'system', 'system', 'system/dept/manageProtected'
WHERE @users_menu_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM sys_menu WHERE permissionKey = 'system/dept/manageProtected' AND is_delete IS NULL);

-- Roles permission buttons
INSERT INTO sys_menu (name, `desc`, parent_id, `order`, path, component, type, icon, is_hidden, is_active, create_user, update_user, permissionKey)
SELECT '角色列表', '角色列表查询权限', @roles_menu_id, '201', 'roles-list', '', 'button', '', '1', '1', 'system', 'system', 'system/roles/list'
WHERE @roles_menu_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM sys_menu WHERE permissionKey = 'system/roles/list' AND is_delete IS NULL);

INSERT INTO sys_menu (name, `desc`, parent_id, `order`, path, component, type, icon, is_hidden, is_active, create_user, update_user, permissionKey)
SELECT '角色详情', '角色详情权限', @roles_menu_id, '202', 'roles-getOne', '', 'button', '', '1', '1', 'system', 'system', 'system/roles/getOne'
WHERE @roles_menu_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM sys_menu WHERE permissionKey = 'system/roles/getOne' AND is_delete IS NULL);

INSERT INTO sys_menu (name, `desc`, parent_id, `order`, path, component, type, icon, is_hidden, is_active, create_user, update_user, permissionKey)
SELECT '新增角色', '新增角色权限', @roles_menu_id, '203', 'roles-add', '', 'button', '', '1', '1', 'system', 'system', 'system/roles/add'
WHERE @roles_menu_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM sys_menu WHERE permissionKey = 'system/roles/add' AND is_delete IS NULL);

INSERT INTO sys_menu (name, `desc`, parent_id, `order`, path, component, type, icon, is_hidden, is_active, create_user, update_user, permissionKey)
SELECT '修改角色', '修改角色权限', @roles_menu_id, '204', 'roles-update', '', 'button', '', '1', '1', 'system', 'system', 'system/roles/update'
WHERE @roles_menu_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM sys_menu WHERE permissionKey = 'system/roles/update' AND is_delete IS NULL);

INSERT INTO sys_menu (name, `desc`, parent_id, `order`, path, component, type, icon, is_hidden, is_active, create_user, update_user, permissionKey)
SELECT '删除角色', '删除角色权限', @roles_menu_id, '205', 'roles-delete', '', 'button', '', '1', '1', 'system', 'system', 'system/roles/delete'
WHERE @roles_menu_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM sys_menu WHERE permissionKey = 'system/roles/delete' AND is_delete IS NULL);

INSERT INTO sys_menu (name, `desc`, parent_id, `order`, path, component, type, icon, is_hidden, is_active, create_user, update_user, permissionKey)
SELECT '角色菜单权限', '角色菜单权限管理', @roles_menu_id, '206', 'roles-menuAssign', '', 'button', '', '1', '1', 'system', 'system', 'system/roles/menuAssign'
WHERE @roles_menu_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM sys_menu WHERE permissionKey = 'system/roles/menuAssign' AND is_delete IS NULL);

INSERT INTO sys_menu (name, `desc`, parent_id, `order`, path, component, type, icon, is_hidden, is_active, create_user, update_user, permissionKey)
SELECT '已分配用户列表', '已分配用户列表权限', @roles_menu_id, '207', 'roles-authUser-list', '', 'button', '', '1', '1', 'system', 'system', 'system/roles/authUser/list'
WHERE @roles_menu_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM sys_menu WHERE permissionKey = 'system/roles/authUser/list' AND is_delete IS NULL);

INSERT INTO sys_menu (name, `desc`, parent_id, `order`, path, component, type, icon, is_hidden, is_active, create_user, update_user, permissionKey)
SELECT '未分配用户列表', '未分配用户列表权限', @roles_menu_id, '208', 'roles-authUser-unallocatedList', '', 'button', '', '1', '1', 'system', 'system', 'system/roles/authUser/unallocatedList'
WHERE @roles_menu_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM sys_menu WHERE permissionKey = 'system/roles/authUser/unallocatedList' AND is_delete IS NULL);

INSERT INTO sys_menu (name, `desc`, parent_id, `order`, path, component, type, icon, is_hidden, is_active, create_user, update_user, permissionKey)
SELECT '分配用户', '角色分配用户权限', @roles_menu_id, '209', 'roles-authUser-select', '', 'button', '', '1', '1', 'system', 'system', 'system/roles/authUser/select'
WHERE @roles_menu_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM sys_menu WHERE permissionKey = 'system/roles/authUser/select' AND is_delete IS NULL);

INSERT INTO sys_menu (name, `desc`, parent_id, `order`, path, component, type, icon, is_hidden, is_active, create_user, update_user, permissionKey)
SELECT '取消授权', '角色取消授权权限', @roles_menu_id, '210', 'roles-authUser-cancel', '', 'button', '', '1', '1', 'system', 'system', 'system/roles/authUser/cancel'
WHERE @roles_menu_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM sys_menu WHERE permissionKey = 'system/roles/authUser/cancel' AND is_delete IS NULL);

INSERT INTO sys_menu (name, `desc`, parent_id, `order`, path, component, type, icon, is_hidden, is_active, create_user, update_user, permissionKey)
SELECT '批量取消授权', '角色批量取消授权权限', @roles_menu_id, '211', 'roles-authUser-cancelAll', '', 'button', '', '1', '1', 'system', 'system', 'system/roles/authUser/cancelAll'
WHERE @roles_menu_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM sys_menu WHERE permissionKey = 'system/roles/authUser/cancelAll' AND is_delete IS NULL);

INSERT INTO sys_menu (name, `desc`, parent_id, `order`, path, component, type, icon, is_hidden, is_active, create_user, update_user, permissionKey)
SELECT '管理管理员角色', '操作管理员角色权限', @roles_menu_id, '212', 'roles-manageAdminRole', '', 'button', '', '1', '1', 'system', 'system', 'system/roles/manageAdminRole'
WHERE @roles_menu_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM sys_menu WHERE permissionKey = 'system/roles/manageAdminRole' AND is_delete IS NULL);

-- Grant all system granular permissions to admin role.
INSERT IGNORE INTO sys_role_menu (role_id, menu_id)
SELECT @admin_role_id, m.id
FROM sys_menu m
WHERE @admin_role_id IS NOT NULL
  AND m.is_delete IS NULL
  AND m.permissionKey IN (
    'system/users/list',
    'system/users/getOne',
    'system/users/add',
    'system/users/update',
    'system/users/delete',
    'system/users/resetPassword',
    'system/users/manageAdmin',
    'system/dept/tree',
    'system/dept/getOne',
    'system/dept/add',
    'system/dept/update',
    'system/dept/delete',
    'system/dept/manageProtected',
    'system/roles/list',
    'system/roles/getOne',
    'system/roles/add',
    'system/roles/update',
    'system/roles/delete',
    'system/roles/menuAssign',
    'system/roles/authUser/list',
    'system/roles/authUser/unallocatedList',
    'system/roles/authUser/select',
    'system/roles/authUser/cancel',
    'system/roles/authUser/cancelAll',
    'system/roles/manageAdminRole'
  );

SET FOREIGN_KEY_CHECKS = 1;

-- Verification
SELECT id, name, parent_id, type, permissionKey
FROM sys_menu
WHERE permissionKey LIKE 'system/users/%'
   OR permissionKey LIKE 'system/dept/%'
   OR permissionKey LIKE 'system/roles/%'
ORDER BY id;
