SET NAMES utf8mb4;

SET @document_menu_id = (
  SELECT id FROM sys_menu WHERE path = 'documentManage' AND is_delete IS NULL ORDER BY id LIMIT 1
);

DELETE FROM sys_role_menu
WHERE menu_id IN (
  SELECT id FROM sys_menu
  WHERE is_delete IS NULL
    AND (
      id = @document_menu_id
      OR parent_id = @document_menu_id
      OR permissionKey LIKE 'business/documents%'
      OR component LIKE 'business/documentManage%'
    )
);

UPDATE sys_menu
SET is_delete = '1'
WHERE is_delete IS NULL
  AND (
    id = @document_menu_id
    OR parent_id = @document_menu_id
    OR permissionKey LIKE 'business/documents%'
    OR component LIKE 'business/documentManage%'
  );

SELECT id, name, path, component, type, permissionKey, is_delete
FROM sys_menu
WHERE path = 'documentManage'
   OR permissionKey LIKE 'business/documents%'
   OR component LIKE 'business/documentManage%'
ORDER BY id;
