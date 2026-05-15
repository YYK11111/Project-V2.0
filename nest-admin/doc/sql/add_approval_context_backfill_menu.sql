-- 增加审批上下文历史参与人回填权限点。
-- 安全可重复执行：通过 permissionKey 判断是否已存在。

SET @scheduled_jobs_menu_id = (
  SELECT id
  FROM sys_menu
  WHERE permissionKey = 'system/scheduledJobs/list' AND is_delete IS NULL
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
  '回填审批参与人',
  '回填 business_approval_participant 历史审批参与人索引',
  @scheduled_jobs_menu_id,
  '990',
  'approval-contexts-backfill-participants',
  '',
  'button',
  '',
  '1',
  '1',
  'system',
  'system',
  'business/approval-contexts/backfillParticipants'
WHERE @scheduled_jobs_menu_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1
    FROM sys_menu
    WHERE permissionKey = 'business/approval-contexts/backfillParticipants'
      AND is_delete IS NULL
  );

INSERT IGNORE INTO sys_role_menu (role_id, menu_id)
SELECT @admin_role_id, id
FROM sys_menu
WHERE @admin_role_id IS NOT NULL
  AND is_delete IS NULL
  AND permissionKey = 'business/approval-contexts/backfillParticipants';
