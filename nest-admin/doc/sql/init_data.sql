-- 更新角色信息
UPDATE sys_role SET permissionKey='admin', `order`='1', is_active='1', remark='超级管理员' WHERE id=1;

-- 插入用户角色关联 (NestAdmin 用户分配超级管理员角色)
DELETE FROM sys_user_role WHERE userId=1;
INSERT INTO sys_user_role (userId, roleId) VALUES (1, 1);

-- 为超级管理员角色分配所有菜单权限
DELETE FROM sys_role_menu WHERE roleId=1;
INSERT INTO sys_role_menu (roleId, menuId) SELECT 1, id FROM sys_menu;
