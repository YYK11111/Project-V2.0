-- 将系统首页写入数据库菜单，供角色管理权限树和动态导航使用。
-- 前端已有 /adminindex 常量路由；该菜单记录负责授权和侧边栏展示。

INSERT INTO sys_menu (
  name,
  `desc`,
  parent_id,
  `order`,
  path,
  component,
  type,
  icon,
  is_hidden,
  is_active,
  create_user,
  update_user,
  permissionKey
)
SELECT
  '系统首页',
  '系统首页',
  '0',
  0,
  'adminindex',
  'index/adminindex',
  'menu',
  'dashboard',
  '0',
  '1',
  'system',
  'system',
  'dashboard/adminIndex'
WHERE NOT EXISTS (
  SELECT 1
  FROM sys_menu
  WHERE permissionKey = 'dashboard/adminIndex'
    AND is_delete IS NULL
);
