SET NAMES utf8mb4;

SET @taskRoot := (
  SELECT id FROM sys_menu
  WHERE path = 'taskManage' AND is_delete IS NULL
  ORDER BY id
  LIMIT 1
);

UPDATE sys_menu
SET parent_id = @taskRoot,
    `order` = '2',
    icon = 'el:ChatDotRound'
WHERE path = 'taskCommentManage'
  AND is_delete IS NULL;

INSERT IGNORE INTO sys_role_menu (role_id, menu_id)
SELECT 1, id FROM sys_menu
WHERE path = 'taskCommentManage'
  AND is_delete IS NULL;
