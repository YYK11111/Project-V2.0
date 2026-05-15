-- 增加飞书/外部通知管理菜单。
-- 安全可重复执行：通过 permissionKey 判断是否已存在。

SET @system_parent_id = (
  SELECT id
  FROM sys_menu
  WHERE path = 'system' AND type = 'catalog' AND is_delete IS NULL
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

INSERT INTO sys_menu (name, `desc`, parent_id, `order`, path, component, type, icon, is_hidden, is_active, create_user, update_user, permissionKey)
SELECT '外部账号映射', '维护系统用户与飞书等外部平台账号映射', @system_parent_id, '7', 'externalAccounts', 'system/externalAccounts/index', 'menu', 'user', '0', '1', 'system', 'system', 'system/externalAccounts/list'
WHERE @system_parent_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM sys_menu WHERE permissionKey = 'system/externalAccounts/list' AND is_delete IS NULL);

SET @external_accounts_menu_id = (
  SELECT id
  FROM sys_menu
  WHERE permissionKey = 'system/externalAccounts/list' AND is_delete IS NULL
  ORDER BY id
  LIMIT 1
);

INSERT INTO sys_menu (name, `desc`, parent_id, `order`, path, component, type, icon, is_hidden, is_active, create_user, update_user, permissionKey)
SELECT '维护外部账号映射', '新增、编辑、同步外部账号映射', @external_accounts_menu_id, '701', 'externalAccounts-update', '', 'button', '', '1', '1', 'system', 'system', 'system/externalAccounts/update'
WHERE @external_accounts_menu_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM sys_menu WHERE permissionKey = 'system/externalAccounts/update' AND is_delete IS NULL);

INSERT INTO sys_menu (name, `desc`, parent_id, `order`, path, component, type, icon, is_hidden, is_active, create_user, update_user, permissionKey)
SELECT '外部通知日志', '查看飞书等外部通知发送日志', @system_parent_id, '8', 'externalNotifyLogs', 'system/externalNotifyLogs/index', 'menu', 'bell', '0', '1', 'system', 'system', 'system/externalNotifyLogs/list'
WHERE @system_parent_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM sys_menu WHERE permissionKey = 'system/externalNotifyLogs/list' AND is_delete IS NULL);

INSERT IGNORE INTO sys_role_menu (role_id, menu_id)
SELECT @admin_role_id, id
FROM sys_menu
WHERE @admin_role_id IS NOT NULL
  AND is_delete IS NULL
  AND permissionKey IN (
    'system/externalAccounts/list',
    'system/externalAccounts/update',
    'system/externalNotifyLogs/list'
  );
