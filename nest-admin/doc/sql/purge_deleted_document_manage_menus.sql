SET NAMES utf8mb4;

DELETE FROM sys_role_menu
WHERE menu_id IN (
  SELECT id FROM sys_menu
  WHERE is_delete = '1'
    AND (
      path = 'documentManage'
      OR permissionKey LIKE 'business/documents%'
      OR component LIKE 'business/documentManage%'
    )
);

DELETE FROM sys_menu
WHERE is_delete = '1'
  AND parent_id IN (
    SELECT id FROM (
      SELECT id
      FROM sys_menu
      WHERE is_delete = '1'
        AND path = 'documentManage'
    ) AS document_parent
  );

DELETE FROM sys_menu
WHERE is_delete = '1'
  AND (
    permissionKey LIKE 'business/documents%'
    OR component LIKE 'business/documentManage%'
  );

DELETE FROM sys_menu
WHERE is_delete = '1'
  AND path = 'documentManage';

SELECT id, name, path, component, type, permissionKey, is_delete
FROM sys_menu
WHERE path = 'documentManage'
   OR permissionKey LIKE 'business/documents%'
   OR component LIKE 'business/documentManage%'
ORDER BY id;
