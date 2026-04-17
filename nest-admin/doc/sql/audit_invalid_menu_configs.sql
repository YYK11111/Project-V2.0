-- 菜单体检 SQL：用于排查空目录、无组件菜单、同级重复路由。
-- 本文件默认只提供查询语句，不直接修改数据。

-- 1. menu 类型但未配置组件
SELECT id, name, parent_id, path, component, type, is_hidden, is_active
FROM sys_menu
WHERE is_delete IS NULL
  AND type = 'menu'
  AND (component IS NULL OR TRIM(component) = '')
ORDER BY parent_id, path, id;

-- 2. catalog 类型既没有组件，也没有可见子菜单
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

-- 3. 同级菜单下 path 重复（按钮除外）
SELECT parent_id, path, type, COUNT(*) AS cnt, GROUP_CONCAT(id ORDER BY id) AS ids, GROUP_CONCAT(name ORDER BY id) AS names
FROM sys_menu
WHERE is_delete IS NULL
  AND type <> 'button'
  AND path IS NOT NULL
  AND TRIM(path) <> ''
GROUP BY parent_id, path, type
HAVING COUNT(*) > 1
ORDER BY cnt DESC, parent_id, path;

-- 4. 同级菜单下规范化 path 重复（兼容 /a 与 a）
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
