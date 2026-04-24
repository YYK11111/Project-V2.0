SET NAMES utf8mb4;

DROP TEMPORARY TABLE IF EXISTS temp_replaced_null_buttons;
CREATE TEMPORARY TABLE temp_replaced_null_buttons AS
SELECT oldm.id
FROM sys_menu oldm
JOIN sys_menu replacement
  ON replacement.parent_id = oldm.parent_id
 AND replacement.path = oldm.path
 AND replacement.type = oldm.type
 AND replacement.id <> oldm.id
 AND replacement.is_delete IS NULL
 AND replacement.permissionKey IS NOT NULL
WHERE oldm.type = 'button'
  AND oldm.is_delete IS NULL
  AND (oldm.permissionKey IS NULL OR oldm.permissionKey = '');

DELETE FROM sys_role_menu
WHERE menu_id IN (SELECT id FROM temp_replaced_null_buttons);

UPDATE sys_menu
SET is_delete = '1'
WHERE id IN (SELECT id FROM temp_replaced_null_buttons);

SELECT COUNT(*) AS cleanedButtonCount FROM temp_replaced_null_buttons;

SELECT p.name AS parentName, p.path AS parentPath, COUNT(*) AS unresolvedCount
FROM sys_menu m
LEFT JOIN sys_menu p ON p.id = m.parent_id
LEFT JOIN sys_menu replacement
  ON replacement.parent_id = m.parent_id
 AND replacement.path = m.path
 AND replacement.type = m.type
 AND replacement.id <> m.id
 AND replacement.is_delete IS NULL
 AND replacement.permissionKey IS NOT NULL
WHERE m.type = 'button'
  AND m.is_delete IS NULL
  AND (m.permissionKey IS NULL OR m.permissionKey = '')
  AND replacement.id IS NULL
GROUP BY p.id, p.name, p.path
ORDER BY unresolvedCount DESC, p.id;
