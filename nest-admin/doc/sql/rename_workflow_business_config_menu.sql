-- 将“业务配置”菜单重命名为“自动触发配置”

UPDATE sys_menu
SET name = '自动触发配置',
    `desc` = '自动触发配置'
WHERE path = 'businessConfig'
  AND component = 'business/workflow/businessConfig'
  AND is_delete IS NULL;
