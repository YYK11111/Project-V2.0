-- =====================================================
-- 隐藏业务模块子菜单：实现一级菜单直接显示列表页
-- =====================================================
-- 目标：点击一级菜单时，左侧不展开子菜单，右侧直接显示列表页

-- 确保外键检查关闭
SET FOREIGN_KEY_CHECKS = 0;

-- =====================================================
-- 将业务模块的"列表页"子菜单设为隐藏
-- =====================================================

-- 1. 项目管理 - 隐藏"项目列表"
UPDATE sys_menu 
SET is_hidden = '1' 
WHERE id = 171 AND name = '项目列表';

-- 2. 任务管理 - 隐藏"任务列表"
UPDATE sys_menu 
SET is_hidden = '1' 
WHERE id = 173 AND name = '任务列表';

-- 3. 工单管理 - 隐藏"工单列表"
UPDATE sys_menu 
SET is_hidden = '1' 
WHERE id = 175 AND name = '工单列表';

-- 4. 文档管理 - 隐藏"文档列表"
UPDATE sys_menu 
SET is_hidden = '1' 
WHERE id = 177 AND name = '文档列表';

-- 恢复外键检查
SET FOREIGN_KEY_CHECKS = 1;

-- =====================================================
-- 验证结果
-- =====================================================
SELECT '========================================' AS '';
SELECT '✅ 业务模块子菜单隐藏完成！' AS '';
SELECT '========================================' AS '';

SELECT 
  m.name AS '菜单名称',
  m.path AS '路由路径',
  m.component AS '组件路径',
  m.type AS '类型',
  m.is_hidden AS '是否隐藏',
  m.`order` AS '排序'
FROM sys_menu m
WHERE m.parent_id IN (26, 27, 28, 29)
ORDER BY m.parent_id, m.`order`;

SELECT '预期效果：' AS '';
SELECT '1. 点击"项目管理" → 自动跳转到 /projectManage/index' AS '';
SELECT '2. 左侧侧边栏不显示"项目列表"子菜单' AS '';
SELECT '3. 右侧直接显示项目列表页内容' AS '';
