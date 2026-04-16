SET NAMES utf8mb4;

UPDATE sys_menu
SET name = '系统公告'
WHERE path = 'notices'
  AND component = 'system/notices/index'
  AND is_delete IS NULL;
