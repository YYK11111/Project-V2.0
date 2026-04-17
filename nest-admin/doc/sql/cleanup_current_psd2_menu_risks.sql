-- 当前本地 psd2 数据库菜单风险清理 SQL
-- 生成时间：基于当前库实时审计结果
-- 说明：当前仅识别出 2 条与前端常量隐藏路由重复的数据库隐藏菜单
-- 风险菜单：
--   24 -> {新增} -> content/articleManage/aev
--   51 -> 文档表单 -> business/documentManage/form

-- 建议先备份：
-- mysqldump -uroot -p12345678 psd2 sys_menu sys_role_menu > backup_psd2_menu_cleanup.sql


-- 1. 核对目标菜单
SELECT id, name, parent_id, path, component, type, is_hidden, is_active, is_delete
FROM sys_menu
WHERE id IN (24, 51);

-- 2. 核对角色绑定
SELECT rm.role_id, rm.menu_id, m.name, m.path, m.component
FROM sys_role_menu rm
JOIN sys_menu m ON m.id = rm.menu_id
WHERE rm.menu_id IN (24, 51)
ORDER BY rm.role_id, rm.menu_id;

-- 3. 删除角色绑定
DELETE FROM sys_role_menu
WHERE menu_id IN (24, 51);

-- 4. 软删除菜单
UPDATE sys_menu
SET is_delete = '1', update_time = NOW(), update_user = 'menu-cleanup'
WHERE id IN (24, 51)
  AND is_delete IS NULL;

-- 5. 清理后验证
SELECT id, name, is_delete, update_user, update_time
FROM sys_menu
WHERE id IN (24, 51);

SELECT COUNT(*) AS remaining_role_bindings
FROM sys_role_menu
WHERE menu_id IN (24, 51);

-- 6. 重新跑当前风险审计
SELECT id, name, parent_id, path, component, type, is_hidden
FROM sys_menu
WHERE is_delete IS NULL
  AND is_hidden='1'
  AND type<>'button'
  AND (
    path IN (
      'documentManage/form','/documentManage/form',
      'projectManage/approval','/projectManage/approval',
      'content/articleManage/aev','/content/articleManage/aev',
      'content/aev','/content/aev',
      'content/articleManage/myBorrows','/content/articleManage/myBorrows',
      'content/articleManage/home','/content/articleManage/home',
      'content/articleManage/index','/content/articleManage/index',
      'content/articleManage/manage','/content/articleManage/manage',
      'content/articleManage/search','/content/articleManage/search',
      'content/articleManage/aiRetrieveDebug','/content/articleManage/aiRetrieveDebug',
      'content/articleManage/detail','/content/articleManage/detail',
      'content/articleManage/borrowApproval','/content/articleManage/borrowApproval'
    )
    OR component IN (
      'business/documentManage/form',
      'business/projectManage/approval',
      'content/articleManage/aev',
      'content/articleManage/myBorrows',
      'content/articleManage/home',
      'content/articleManage/index',
      'content/articleManage/search',
      'content/articleManage/aiRetrieveDebug',
      'content/articleManage/detail',
      'content/articleManage/borrowApproval'
    )
  )
ORDER BY parent_id, path, id;
