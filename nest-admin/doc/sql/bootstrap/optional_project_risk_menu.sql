-- 在“项目管理”下新增可见子菜单“风险管理”
-- 执行后需要为对应角色分配该菜单权限，否则左侧菜单不会显示

SET @project_manage_id := (
  SELECT id
  FROM sys_menu
  WHERE is_delete IS NULL
    AND name = '项目管理'
  ORDER BY create_time ASC
  LIMIT 1
);

INSERT INTO sys_menu (
  name,
  path,
  component,
  type,
  parent_id,
  `order`,
  icon,
  is_hidden,
  is_active,
  is_delete,
  permissionKey,
  create_time,
  create_user,
  update_user
)
SELECT
  '风险管理',
  'riskManage',
  'business/riskManage/index',
  'menu',
  @project_manage_id,
  30,
  'warning',
  0,
  1,
  NULL,
  'business/risks/page',
  NOW(),
  'system',
  'system'
WHERE @project_manage_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1
    FROM sys_menu
    WHERE is_delete IS NULL
      AND parent_id = @project_manage_id
      AND path = 'riskManage'
  );

UPDATE sys_menu
SET
  name = '风险管理',
  component = 'business/riskManage/index',
  type = 'menu',
  icon = COALESCE(NULLIF(icon, ''), 'warning'),
  is_hidden = 0,
  is_active = 1,
  permissionKey = 'business/risks/page',
  update_time = NOW(),
  update_user = 'system'
WHERE is_delete IS NULL
  AND parent_id = @project_manage_id
  AND path = 'riskManage';

SET @project_risk_menu_id := (
  SELECT id
  FROM sys_menu
  WHERE is_delete IS NULL
    AND permissionKey = 'business/risks/page'
  ORDER BY create_time ASC
  LIMIT 1
);

SET @admin_role_id := (
  SELECT id
  FROM sys_role
  WHERE is_delete IS NULL
    AND permissionKey = 'admin'
  ORDER BY id ASC
  LIMIT 1
);

INSERT IGNORE INTO sys_role_menu (role_id, menu_id)
SELECT @admin_role_id, @project_risk_menu_id
WHERE @admin_role_id IS NOT NULL
  AND @project_risk_menu_id IS NOT NULL;
