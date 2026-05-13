SET NAMES utf8mb4;

UPDATE sys_menu
SET permissionKey = 'business/projects/dashboard',
    update_user = 'system',
    update_time = NOW()
WHERE is_delete IS NULL
  AND (
    id = 204
    OR component = 'business/projectManage/cockpit'
    OR permissionKey IN (
      'business/projectManage/cockpit',
      'business/projects/cockpit'
    )
  );

SELECT id, name, component, permissionKey
FROM sys_menu
WHERE is_delete IS NULL
  AND (
    id = 204
    OR component = 'business/projectManage/cockpit'
    OR permissionKey = 'business/projects/dashboard'
  )
ORDER BY id;
