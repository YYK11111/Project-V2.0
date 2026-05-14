INSERT INTO `sys_role_menu` (`role_id`, `menu_id`)
SELECT 2, `id`
FROM `sys_menu`
WHERE `is_delete` IS NULL
  AND `type` = 'button'
  AND `permissionKey` LIKE 'business/%'
  AND `permissionKey` NOT LIKE '%/manageAll';
