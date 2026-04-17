-- 最终菜单清理 SQL 模板
-- 用途：按风险类型分步清理菜单配置问题。
-- 原则：先查询确认，再迁移角色绑定，最后软删除。

-- =========================
-- 0. 执行前备份
-- =========================
-- mysqldump -u <user> -p <database> sys_menu sys_role_menu > backup_menu_cleanup_$(date +%Y%m%d_%H%M%S).sql


-- =========================
-- 1. 清理重复隐藏路由菜单
-- =========================
-- 参考文件：cleanup_redundant_hidden_route_menus.sql
-- 建议优先执行，因为这类菜单通常只与隐藏页跳转有关，风险最低。


-- =========================
-- 2. 清理缺少组件的 menu 菜单
-- =========================
-- 先查询
SELECT id, name, parent_id, path, component, type, is_hidden, is_active
FROM sys_menu
WHERE is_delete IS NULL
  AND type = 'menu'
  AND (component IS NULL OR TRIM(component) = '')
ORDER BY parent_id, path, id;

-- 对于确认无业务价值的 menu 菜单，先删除角色绑定，再软删除。
-- 将下面的 <menu_ids> 替换成确认要清理的菜单 id 列表，例如 101,102,103

-- DELETE FROM sys_role_menu WHERE menu_id IN (<menu_ids>);

-- UPDATE sys_menu
-- SET is_delete = '1', update_time = NOW(), update_user = 'menu-cleanup'
-- WHERE id IN (<menu_ids>)
--   AND is_delete IS NULL;


-- =========================
-- 3. 清理空目录 catalog 菜单
-- =========================
-- 先查询
SELECT m.id, m.name, m.parent_id, m.path, m.component, m.type, m.is_hidden, m.is_active
FROM sys_menu m
LEFT JOIN sys_menu c
  ON c.parent_id = m.id
 AND c.is_delete IS NULL
 AND c.is_hidden = '0'
WHERE m.is_delete IS NULL
  AND m.type = 'catalog'
  AND (m.component IS NULL OR TRIM(m.component) = '')
GROUP BY m.id, m.name, m.parent_id, m.path, m.component, m.type, m.is_hidden, m.is_active
HAVING COUNT(c.id) = 0
ORDER BY m.parent_id, m.path, m.id;

-- 对于确认无业务价值的空目录，先删角色绑定，再软删除。
-- 仍然把 <menu_ids> 换成目标 id 列表。

-- DELETE FROM sys_role_menu WHERE menu_id IN (<menu_ids>);

-- UPDATE sys_menu
-- SET is_delete = '1', update_time = NOW(), update_user = 'menu-cleanup'
-- WHERE id IN (<menu_ids>)
--   AND is_delete IS NULL;


-- =========================
-- 4. 处理同级重复路由菜单
-- =========================
-- 先查询重复组
SELECT parent_id,
       CASE WHEN LEFT(path, 1) = '/' THEN path ELSE CONCAT('/', path) END AS normalized_path,
       type,
       COUNT(*) AS cnt,
       GROUP_CONCAT(id ORDER BY id) AS ids,
       GROUP_CONCAT(name ORDER BY id) AS names
FROM sys_menu
WHERE is_delete IS NULL
  AND type <> 'button'
  AND path IS NOT NULL
  AND TRIM(path) <> ''
GROUP BY parent_id,
         CASE WHEN LEFT(path, 1) = '/' THEN path ELSE CONCAT('/', path) END,
         type
HAVING COUNT(*) > 1
ORDER BY cnt DESC, parent_id, normalized_path;

-- 处理策略：
-- 1) 在每个重复组中保留一个主菜单 <keep_menu_id>
-- 2) 把其余菜单 <drop_menu_ids> 的角色绑定迁移到主菜单
-- 3) 删除 drop_menu_ids 的角色绑定
-- 4) 软删除 drop_menu_ids

-- 示例模板：
-- INSERT IGNORE INTO sys_role_menu (role_id, menu_id)
-- SELECT role_id, <keep_menu_id>
-- FROM sys_role_menu
-- WHERE menu_id IN (<drop_menu_ids>);

-- DELETE FROM sys_role_menu WHERE menu_id IN (<drop_menu_ids>);

-- UPDATE sys_menu
-- SET is_delete = '1', update_time = NOW(), update_user = 'menu-cleanup'
-- WHERE id IN (<drop_menu_ids>)
--   AND is_delete IS NULL;


-- =========================
-- 5. 验证清理结果
-- =========================

-- 5.1 再次检查缺少组件的 menu 菜单
SELECT COUNT(*) AS missing_component_menu_count
FROM sys_menu
WHERE is_delete IS NULL
  AND type = 'menu'
  AND (component IS NULL OR TRIM(component) = '');

-- 5.2 再次检查空目录
SELECT COUNT(*) AS empty_catalog_count
FROM (
  SELECT m.id
  FROM sys_menu m
  LEFT JOIN sys_menu c
    ON c.parent_id = m.id
   AND c.is_delete IS NULL
   AND c.is_hidden = '0'
  WHERE m.is_delete IS NULL
    AND m.type = 'catalog'
    AND (m.component IS NULL OR TRIM(m.component) = '')
  GROUP BY m.id
  HAVING COUNT(c.id) = 0
) t;

-- 5.3 再次检查同级重复路由
SELECT COUNT(*) AS duplicate_sibling_path_group_count
FROM (
  SELECT parent_id,
         CASE WHEN LEFT(path, 1) = '/' THEN path ELSE CONCAT('/', path) END AS normalized_path,
         type
  FROM sys_menu
  WHERE is_delete IS NULL
    AND type <> 'button'
    AND path IS NOT NULL
    AND TRIM(path) <> ''
  GROUP BY parent_id,
           CASE WHEN LEFT(path, 1) = '/' THEN path ELSE CONCAT('/', path) END,
           type
  HAVING COUNT(*) > 1
) t;


-- =========================
-- 6. 回滚说明
-- =========================
-- 如果清理后发现异常：
-- 1) 使用备份文件恢复 sys_menu / sys_role_menu
-- 2) 或把误删菜单的 is_delete 改回 NULL
-- 3) 再恢复对应的 sys_role_menu 绑定
