SET NAMES utf8mb4;

UPDATE sys_menu
SET is_delete = '1'
WHERE (path = 'appTools' OR parent_id IN (SELECT id FROM (SELECT id FROM sys_menu WHERE path = 'appTools' AND is_delete IS NULL) AS t))
  AND is_delete IS NULL;
