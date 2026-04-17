-- 清理与前端常量隐藏路由重复的数据库隐藏菜单。
-- 仅建议处理纯页面跳转类隐藏菜单，不处理可见导航菜单和按钮权限。

-- 执行前先备份：
-- mysqldump -u <user> -p <database> sys_menu sys_role_menu > backup_hidden_route_menus.sql

-- 1. 先查看候选项
SELECT id, name, parent_id, path, component, type, is_hidden, permissionKey
FROM sys_menu
WHERE is_delete IS NULL
  AND is_hidden = '1'
  AND type <> 'button'
  AND (
    path IN (
      'documentManage/form',
      '/documentManage/form',
      'projectManage/approval',
      '/projectManage/approval',
      'content/articleManage/aev',
      '/content/articleManage/aev',
      'content/aev',
      '/content/aev',
      'content/articleManage/myBorrows',
      '/content/articleManage/myBorrows',
      'content/articleManage/home',
      '/content/articleManage/home',
      'content/articleManage/index',
      '/content/articleManage/index',
      'content/articleManage/manage',
      '/content/articleManage/manage',
      'content/articleManage/search',
      '/content/articleManage/search',
      'content/articleManage/aiRetrieveDebug',
      '/content/articleManage/aiRetrieveDebug',
      'content/articleManage/detail',
      '/content/articleManage/detail',
      'content/articleManage/borrowApproval',
      '/content/articleManage/borrowApproval'
    )
    OR component IN (
      'business/documentManage/form',
      'business/projectManage/approval',
      'content/articleManage/aev',
      'content/articleManage/myBorrows',
      'content/articleManage/home',
      'content/articleManage/index',
      'content/articleManage/search',
      'content/articleManage/aiRetrieveDebug',
      'content/articleManage/detail',
      'content/articleManage/borrowApproval'
    )
  )
ORDER BY parent_id, path, id;

-- 2. 再查看这些菜单是否仍被角色绑定
SELECT rm.role_id, rm.menu_id, m.name, m.path, m.component
FROM sys_role_menu rm
JOIN sys_menu m ON m.id = rm.menu_id
WHERE m.is_delete IS NULL
  AND m.is_hidden = '1'
  AND m.type <> 'button'
  AND (
    m.path IN (
      'documentManage/form', '/documentManage/form',
      'projectManage/approval', '/projectManage/approval',
      'content/articleManage/aev', '/content/articleManage/aev',
      'content/aev', '/content/aev',
      'content/articleManage/myBorrows', '/content/articleManage/myBorrows',
      'content/articleManage/home', '/content/articleManage/home',
      'content/articleManage/index', '/content/articleManage/index',
      'content/articleManage/manage', '/content/articleManage/manage',
      'content/articleManage/search', '/content/articleManage/search',
      'content/articleManage/aiRetrieveDebug', '/content/articleManage/aiRetrieveDebug',
      'content/articleManage/detail', '/content/articleManage/detail',
      'content/articleManage/borrowApproval', '/content/articleManage/borrowApproval'
    )
    OR m.component IN (
      'business/documentManage/form',
      'business/projectManage/approval',
      'content/articleManage/aev',
      'content/articleManage/myBorrows',
      'content/articleManage/home',
      'content/articleManage/index',
      'content/articleManage/search',
      'content/articleManage/aiRetrieveDebug',
      'content/articleManage/detail',
      'content/articleManage/borrowApproval'
    )
  )
ORDER BY rm.role_id, rm.menu_id;

-- 3. 确认无误后，先删角色关联，再软删除菜单
-- DELETE rm
-- FROM sys_role_menu rm
-- JOIN sys_menu m ON m.id = rm.menu_id
-- WHERE m.is_delete IS NULL
--   AND m.is_hidden = '1'
--   AND m.type <> 'button'
--   AND (
--     m.path IN (
--       'documentManage/form', '/documentManage/form',
--       'projectManage/approval', '/projectManage/approval',
--       'content/articleManage/aev', '/content/articleManage/aev',
--       'content/aev', '/content/aev',
--       'content/articleManage/myBorrows', '/content/articleManage/myBorrows',
--       'content/articleManage/home', '/content/articleManage/home',
--       'content/articleManage/index', '/content/articleManage/index',
--       'content/articleManage/manage', '/content/articleManage/manage',
--       'content/articleManage/search', '/content/articleManage/search',
--       'content/articleManage/aiRetrieveDebug', '/content/articleManage/aiRetrieveDebug',
--       'content/articleManage/detail', '/content/articleManage/detail',
--       'content/articleManage/borrowApproval', '/content/articleManage/borrowApproval'
--     )
--     OR m.component IN (
--       'business/documentManage/form',
--       'business/projectManage/approval',
--       'content/articleManage/aev',
--       'content/articleManage/myBorrows',
--       'content/articleManage/home',
--       'content/articleManage/index',
--       'content/articleManage/search',
--       'content/articleManage/aiRetrieveDebug',
--       'content/articleManage/detail',
--       'content/articleManage/borrowApproval'
--     )
--   );

-- UPDATE sys_menu
-- SET is_delete = '1', update_time = NOW(), update_user = 'menu-cleanup'
-- WHERE is_delete IS NULL
--   AND is_hidden = '1'
--   AND type <> 'button'
--   AND (
--     path IN (
--       'documentManage/form', '/documentManage/form',
--       'projectManage/approval', '/projectManage/approval',
--       'content/articleManage/aev', '/content/articleManage/aev',
--       'content/aev', '/content/aev',
--       'content/articleManage/myBorrows', '/content/articleManage/myBorrows',
--       'content/articleManage/home', '/content/articleManage/home',
--       'content/articleManage/index', '/content/articleManage/index',
--       'content/articleManage/manage', '/content/articleManage/manage',
--       'content/articleManage/search', '/content/articleManage/search',
--       'content/articleManage/aiRetrieveDebug', '/content/articleManage/aiRetrieveDebug',
--       'content/articleManage/detail', '/content/articleManage/detail',
--       'content/articleManage/borrowApproval', '/content/articleManage/borrowApproval'
--     )
--     OR component IN (
--       'business/documentManage/form',
--       'business/projectManage/approval',
--       'content/articleManage/aev',
--       'content/articleManage/myBorrows',
--       'content/articleManage/home',
--       'content/articleManage/index',
--       'content/articleManage/search',
--       'content/articleManage/aiRetrieveDebug',
--       'content/articleManage/detail',
--       'content/articleManage/borrowApproval'
--     )
--   );
