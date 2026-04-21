-- 在业务菜单中补充上线单、验收单、运维交接单入口

SET @project_manage_id := (
  SELECT id
  FROM sys_menu
  WHERE is_delete IS NULL
    AND path = 'projectManage'
  ORDER BY create_time ASC
  LIMIT 1
);

INSERT INTO sys_menu (
  name, path, component, type, parent_id, `order`, icon,
  is_hidden, is_active, is_delete, permissionKey, create_time, create_user, update_user
)
SELECT '上线单管理', 'goLiveManage', 'business/goLiveManage/index', 'menu', @project_manage_id, 31, 'upload', 0, 1, NULL, 'business/go-live-records/page', NOW(), 'system', 'system'
WHERE @project_manage_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM sys_menu WHERE is_delete IS NULL AND parent_id = @project_manage_id AND path = 'goLiveManage'
  );

INSERT INTO sys_menu (
  name, path, component, type, parent_id, `order`, icon,
  is_hidden, is_active, is_delete, permissionKey, create_time, create_user, update_user
)
SELECT '验收单管理', 'acceptanceManage', 'business/acceptanceManage/index', 'menu', @project_manage_id, 32, 'finished', 0, 1, NULL, 'business/acceptance-records/page', NOW(), 'system', 'system'
WHERE @project_manage_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM sys_menu WHERE is_delete IS NULL AND parent_id = @project_manage_id AND path = 'acceptanceManage'
  );

INSERT INTO sys_menu (
  name, path, component, type, parent_id, `order`, icon,
  is_hidden, is_active, is_delete, permissionKey, create_time, create_user, update_user
)
SELECT '运维交接单', 'handoverManage', 'business/handoverManage/index', 'menu', @project_manage_id, 33, 'connection', 0, 1, NULL, 'business/handover-records/page', NOW(), 'system', 'system'
WHERE @project_manage_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM sys_menu WHERE is_delete IS NULL AND parent_id = @project_manage_id AND path = 'handoverManage'
  );
