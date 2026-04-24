SET NAMES utf8mb4;

SET @go_live_menu_id = (
  SELECT id FROM sys_menu WHERE path = 'goLiveManage' AND is_delete IS NULL ORDER BY id LIMIT 1
);
SET @acceptance_menu_id = (
  SELECT id FROM sys_menu WHERE path = 'acceptanceManage' AND is_delete IS NULL ORDER BY id LIMIT 1
);
SET @handover_menu_id = (
  SELECT id FROM sys_menu WHERE path = 'handoverManage' AND is_delete IS NULL ORDER BY id LIMIT 1
);
SET @admin_role_id = (
  SELECT id FROM sys_role WHERE permissionKey = 'admin' ORDER BY id LIMIT 1
);

INSERT INTO sys_menu (name, `desc`, parent_id, `order`, path, component, type, icon, is_hidden, is_active, create_user, update_user, permissionKey)
SELECT '上线单列表', '上线单列表权限', @go_live_menu_id, '601', 'go-live-list', '', 'button', '', '1', '1', 'system', 'system', 'business/go-live-records/list'
WHERE @go_live_menu_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM sys_menu WHERE permissionKey = 'business/go-live-records/list' AND is_delete IS NULL);
INSERT INTO sys_menu (name, `desc`, parent_id, `order`, path, component, type, icon, is_hidden, is_active, create_user, update_user, permissionKey)
SELECT '上线单详情', '上线单详情权限', @go_live_menu_id, '602', 'go-live-getOne', '', 'button', '', '1', '1', 'system', 'system', 'business/go-live-records/getOne'
WHERE @go_live_menu_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM sys_menu WHERE permissionKey = 'business/go-live-records/getOne' AND is_delete IS NULL);
INSERT INTO sys_menu (name, `desc`, parent_id, `order`, path, component, type, icon, is_hidden, is_active, create_user, update_user, permissionKey)
SELECT '新增上线单', '新增上线单权限', @go_live_menu_id, '603', 'go-live-add', '', 'button', '', '1', '1', 'system', 'system', 'business/go-live-records/add'
WHERE @go_live_menu_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM sys_menu WHERE permissionKey = 'business/go-live-records/add' AND is_delete IS NULL);
INSERT INTO sys_menu (name, `desc`, parent_id, `order`, path, component, type, icon, is_hidden, is_active, create_user, update_user, permissionKey)
SELECT '修改上线单', '修改上线单权限', @go_live_menu_id, '604', 'go-live-update', '', 'button', '', '1', '1', 'system', 'system', 'business/go-live-records/update'
WHERE @go_live_menu_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM sys_menu WHERE permissionKey = 'business/go-live-records/update' AND is_delete IS NULL);
INSERT INTO sys_menu (name, `desc`, parent_id, `order`, path, component, type, icon, is_hidden, is_active, create_user, update_user, permissionKey)
SELECT '删除上线单', '删除上线单权限', @go_live_menu_id, '605', 'go-live-delete', '', 'button', '', '1', '1', 'system', 'system', 'business/go-live-records/delete'
WHERE @go_live_menu_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM sys_menu WHERE permissionKey = 'business/go-live-records/delete' AND is_delete IS NULL);
INSERT INTO sys_menu (name, `desc`, parent_id, `order`, path, component, type, icon, is_hidden, is_active, create_user, update_user, permissionKey)
SELECT '提交上线审批', '提交上线审批权限', @go_live_menu_id, '606', 'go-live-submitApproval', '', 'button', '', '1', '1', 'system', 'system', 'business/go-live-records/submitApproval'
WHERE @go_live_menu_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM sys_menu WHERE permissionKey = 'business/go-live-records/submitApproval' AND is_delete IS NULL);

INSERT INTO sys_menu (name, `desc`, parent_id, `order`, path, component, type, icon, is_hidden, is_active, create_user, update_user, permissionKey)
SELECT '验收单列表', '验收单列表权限', @acceptance_menu_id, '611', 'acceptance-list', '', 'button', '', '1', '1', 'system', 'system', 'business/acceptance-records/list'
WHERE @acceptance_menu_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM sys_menu WHERE permissionKey = 'business/acceptance-records/list' AND is_delete IS NULL);
INSERT INTO sys_menu (name, `desc`, parent_id, `order`, path, component, type, icon, is_hidden, is_active, create_user, update_user, permissionKey)
SELECT '验收单详情', '验收单详情权限', @acceptance_menu_id, '612', 'acceptance-getOne', '', 'button', '', '1', '1', 'system', 'system', 'business/acceptance-records/getOne'
WHERE @acceptance_menu_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM sys_menu WHERE permissionKey = 'business/acceptance-records/getOne' AND is_delete IS NULL);
INSERT INTO sys_menu (name, `desc`, parent_id, `order`, path, component, type, icon, is_hidden, is_active, create_user, update_user, permissionKey)
SELECT '新增验收单', '新增验收单权限', @acceptance_menu_id, '613', 'acceptance-add', '', 'button', '', '1', '1', 'system', 'system', 'business/acceptance-records/add'
WHERE @acceptance_menu_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM sys_menu WHERE permissionKey = 'business/acceptance-records/add' AND is_delete IS NULL);
INSERT INTO sys_menu (name, `desc`, parent_id, `order`, path, component, type, icon, is_hidden, is_active, create_user, update_user, permissionKey)
SELECT '修改验收单', '修改验收单权限', @acceptance_menu_id, '614', 'acceptance-update', '', 'button', '', '1', '1', 'system', 'system', 'business/acceptance-records/update'
WHERE @acceptance_menu_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM sys_menu WHERE permissionKey = 'business/acceptance-records/update' AND is_delete IS NULL);
INSERT INTO sys_menu (name, `desc`, parent_id, `order`, path, component, type, icon, is_hidden, is_active, create_user, update_user, permissionKey)
SELECT '删除验收单', '删除验收单权限', @acceptance_menu_id, '615', 'acceptance-delete', '', 'button', '', '1', '1', 'system', 'system', 'business/acceptance-records/delete'
WHERE @acceptance_menu_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM sys_menu WHERE permissionKey = 'business/acceptance-records/delete' AND is_delete IS NULL);
INSERT INTO sys_menu (name, `desc`, parent_id, `order`, path, component, type, icon, is_hidden, is_active, create_user, update_user, permissionKey)
SELECT '提交验收审批', '提交验收审批权限', @acceptance_menu_id, '616', 'acceptance-submitApproval', '', 'button', '', '1', '1', 'system', 'system', 'business/acceptance-records/submitApproval'
WHERE @acceptance_menu_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM sys_menu WHERE permissionKey = 'business/acceptance-records/submitApproval' AND is_delete IS NULL);

INSERT INTO sys_menu (name, `desc`, parent_id, `order`, path, component, type, icon, is_hidden, is_active, create_user, update_user, permissionKey)
SELECT '交接单列表', '交接单列表权限', @handover_menu_id, '621', 'handover-list', '', 'button', '', '1', '1', 'system', 'system', 'business/handover-records/list'
WHERE @handover_menu_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM sys_menu WHERE permissionKey = 'business/handover-records/list' AND is_delete IS NULL);
INSERT INTO sys_menu (name, `desc`, parent_id, `order`, path, component, type, icon, is_hidden, is_active, create_user, update_user, permissionKey)
SELECT '交接单详情', '交接单详情权限', @handover_menu_id, '622', 'handover-getOne', '', 'button', '', '1', '1', 'system', 'system', 'business/handover-records/getOne'
WHERE @handover_menu_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM sys_menu WHERE permissionKey = 'business/handover-records/getOne' AND is_delete IS NULL);
INSERT INTO sys_menu (name, `desc`, parent_id, `order`, path, component, type, icon, is_hidden, is_active, create_user, update_user, permissionKey)
SELECT '新增交接单', '新增交接单权限', @handover_menu_id, '623', 'handover-add', '', 'button', '', '1', '1', 'system', 'system', 'business/handover-records/add'
WHERE @handover_menu_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM sys_menu WHERE permissionKey = 'business/handover-records/add' AND is_delete IS NULL);
INSERT INTO sys_menu (name, `desc`, parent_id, `order`, path, component, type, icon, is_hidden, is_active, create_user, update_user, permissionKey)
SELECT '修改交接单', '修改交接单权限', @handover_menu_id, '624', 'handover-update', '', 'button', '', '1', '1', 'system', 'system', 'business/handover-records/update'
WHERE @handover_menu_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM sys_menu WHERE permissionKey = 'business/handover-records/update' AND is_delete IS NULL);
INSERT INTO sys_menu (name, `desc`, parent_id, `order`, path, component, type, icon, is_hidden, is_active, create_user, update_user, permissionKey)
SELECT '删除交接单', '删除交接单权限', @handover_menu_id, '625', 'handover-delete', '', 'button', '', '1', '1', 'system', 'system', 'business/handover-records/delete'
WHERE @handover_menu_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM sys_menu WHERE permissionKey = 'business/handover-records/delete' AND is_delete IS NULL);
INSERT INTO sys_menu (name, `desc`, parent_id, `order`, path, component, type, icon, is_hidden, is_active, create_user, update_user, permissionKey)
SELECT '提交交接审批', '提交交接审批权限', @handover_menu_id, '626', 'handover-submitApproval', '', 'button', '', '1', '1', 'system', 'system', 'business/handover-records/submitApproval'
WHERE @handover_menu_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM sys_menu WHERE permissionKey = 'business/handover-records/submitApproval' AND is_delete IS NULL);

INSERT IGNORE INTO sys_role_menu (role_id, menu_id)
SELECT @admin_role_id, id
FROM sys_menu
WHERE @admin_role_id IS NOT NULL
  AND is_delete IS NULL
  AND permissionKey IN (
    'business/go-live-records/list', 'business/go-live-records/getOne', 'business/go-live-records/add', 'business/go-live-records/update', 'business/go-live-records/delete', 'business/go-live-records/submitApproval',
    'business/acceptance-records/list', 'business/acceptance-records/getOne', 'business/acceptance-records/add', 'business/acceptance-records/update', 'business/acceptance-records/delete', 'business/acceptance-records/submitApproval',
    'business/handover-records/list', 'business/handover-records/getOne', 'business/handover-records/add', 'business/handover-records/update', 'business/handover-records/delete', 'business/handover-records/submitApproval'
  );
