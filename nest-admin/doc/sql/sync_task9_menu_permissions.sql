SET NAMES utf8mb4;

SET @project_manage_id = (
  SELECT id FROM sys_menu WHERE path = 'projectManage' AND is_delete IS NULL ORDER BY id LIMIT 1
);
SET @go_live_menu_id = (
  SELECT id FROM sys_menu WHERE path = 'goLiveManage' AND is_delete IS NULL ORDER BY id LIMIT 1
);
SET @acceptance_menu_id = (
  SELECT id FROM sys_menu WHERE path = 'acceptanceManage' AND is_delete IS NULL ORDER BY id LIMIT 1
);
SET @handover_menu_id = (
  SELECT id FROM sys_menu WHERE path = 'handoverManage' AND is_delete IS NULL ORDER BY id LIMIT 1
);
SET @change_menu_id = (
  SELECT id FROM sys_menu WHERE path = 'changeManage' AND is_delete IS NULL ORDER BY id LIMIT 1
);
SET @workflow_menu_id = (
  SELECT id FROM sys_menu WHERE path = 'workflow' AND is_delete IS NULL ORDER BY id LIMIT 1
);
SET @cockpit_menu_id = (
  SELECT id FROM sys_menu WHERE component = 'business/projectManage/cockpit' AND is_delete IS NULL ORDER BY id LIMIT 1
);
SET @admin_role_id = (
  SELECT id FROM sys_role WHERE permissionKey = 'admin' AND is_delete IS NULL ORDER BY id LIMIT 1
);

INSERT INTO sys_menu (
  name, path, component, type, parent_id, `order`, icon,
  is_hidden, is_active, is_delete, permissionKey, create_time, create_user, update_user
)
SELECT '上线单管理', 'goLiveManage', 'business/goLiveManage/index', 'menu', @project_manage_id, 31, 'upload', 0, 1, NULL, 'business/go-live-records/page', NOW(), 'system', 'system'
WHERE @project_manage_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM sys_menu WHERE is_delete IS NULL AND path = 'goLiveManage'
  );

INSERT INTO sys_menu (
  name, path, component, type, parent_id, `order`, icon,
  is_hidden, is_active, is_delete, permissionKey, create_time, create_user, update_user
)
SELECT '验收单管理', 'acceptanceManage', 'business/acceptanceManage/index', 'menu', @project_manage_id, 32, 'finished', 0, 1, NULL, 'business/acceptance-records/page', NOW(), 'system', 'system'
WHERE @project_manage_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM sys_menu WHERE is_delete IS NULL AND path = 'acceptanceManage'
  );

INSERT INTO sys_menu (
  name, path, component, type, parent_id, `order`, icon,
  is_hidden, is_active, is_delete, permissionKey, create_time, create_user, update_user
)
SELECT '运维交接单', 'handoverManage', 'business/handoverManage/index', 'menu', @project_manage_id, 33, 'connection', 0, 1, NULL, 'business/handover-records/page', NOW(), 'system', 'system'
WHERE @project_manage_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM sys_menu WHERE is_delete IS NULL AND path = 'handoverManage'
  );

SET @go_live_menu_id = (
  SELECT id FROM sys_menu WHERE path = 'goLiveManage' AND is_delete IS NULL ORDER BY id LIMIT 1
);
SET @acceptance_menu_id = (
  SELECT id FROM sys_menu WHERE path = 'acceptanceManage' AND is_delete IS NULL ORDER BY id LIMIT 1
);
SET @handover_menu_id = (
  SELECT id FROM sys_menu WHERE path = 'handoverManage' AND is_delete IS NULL ORDER BY id LIMIT 1
);

UPDATE sys_menu
SET permissionKey = 'business/projects/dashboard',
    update_user = 'system',
    update_time = NOW()
WHERE id = @cockpit_menu_id
  AND permissionKey IN (
    'business/projectManage/cockpit',
    'business/projects/cockpit'
  )
  AND is_delete IS NULL;

INSERT INTO sys_menu (name, `desc`, parent_id, `order`, path, component, type, icon, is_hidden, is_active, create_user, update_user, permissionKey)
SELECT '上线单提交审批', '上线单提交审批权限', @go_live_menu_id, '451', 'go-live-submitApproval', '', 'button', '', '1', '1', 'system', 'system', 'business/go-live-records/submitApproval'
WHERE @go_live_menu_id IS NOT NULL AND NOT EXISTS (
  SELECT 1 FROM sys_menu WHERE permissionKey = 'business/go-live-records/submitApproval' AND is_delete IS NULL
);

INSERT INTO sys_menu (name, `desc`, parent_id, `order`, path, component, type, icon, is_hidden, is_active, create_user, update_user, permissionKey)
SELECT '验收单提交审批', '验收单提交审批权限', @acceptance_menu_id, '452', 'acceptance-submitApproval', '', 'button', '', '1', '1', 'system', 'system', 'business/acceptance-records/submitApproval'
WHERE @acceptance_menu_id IS NOT NULL AND NOT EXISTS (
  SELECT 1 FROM sys_menu WHERE permissionKey = 'business/acceptance-records/submitApproval' AND is_delete IS NULL
);

INSERT INTO sys_menu (name, `desc`, parent_id, `order`, path, component, type, icon, is_hidden, is_active, create_user, update_user, permissionKey)
SELECT '运维交接单提交审批', '运维交接单提交审批权限', @handover_menu_id, '453', 'handover-submitApproval', '', 'button', '', '1', '1', 'system', 'system', 'business/handover-records/submitApproval'
WHERE @handover_menu_id IS NOT NULL AND NOT EXISTS (
  SELECT 1 FROM sys_menu WHERE permissionKey = 'business/handover-records/submitApproval' AND is_delete IS NULL
);

INSERT INTO sys_menu (name, `desc`, parent_id, `order`, path, component, type, icon, is_hidden, is_active, create_user, update_user, permissionKey)
SELECT '确认方案影响', '确认方案影响权限', @change_menu_id, '447', 'change-confirmPlanImpact', '', 'button', '', '1', '1', 'system', 'system', 'business/changes/confirmPlanImpact'
WHERE @change_menu_id IS NOT NULL AND NOT EXISTS (
  SELECT 1 FROM sys_menu WHERE permissionKey = 'business/changes/confirmPlanImpact' AND is_delete IS NULL
);

INSERT INTO sys_menu (name, `desc`, parent_id, `order`, path, component, type, icon, is_hidden, is_active, create_user, update_user, permissionKey)
SELECT '关闭退回流程', '关闭退回流程权限', @workflow_menu_id, '5542', 'workflow-closeReturned', '', 'button', '', '1', '1', 'system', 'system', 'business/workflow/closeReturned'
WHERE @workflow_menu_id IS NOT NULL AND NOT EXISTS (
  SELECT 1 FROM sys_menu WHERE permissionKey = 'business/workflow/closeReturned' AND is_delete IS NULL
);

INSERT IGNORE INTO sys_role_menu (role_id, menu_id)
SELECT @admin_role_id, id
FROM sys_menu
WHERE @admin_role_id IS NOT NULL
  AND is_delete IS NULL
  AND permissionKey IN (
    'business/go-live-records/page',
    'business/acceptance-records/page',
    'business/handover-records/page',
    'business/go-live-records/submitApproval',
    'business/acceptance-records/submitApproval',
    'business/handover-records/submitApproval',
    'business/projects/dashboard',
    'business/changes/confirmPlanImpact',
    'business/workflow/closeReturned'
  );
