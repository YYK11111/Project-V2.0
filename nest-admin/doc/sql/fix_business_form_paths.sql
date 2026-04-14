-- =====================================================
-- 修复业务模块表单页路径：确保使用完整路径
-- =====================================================
-- 问题：表单页 path 为 'form'，导致 goRoute 拼接后变成 '/projectManage/index/form'
-- 解决：将表单页 path 改为 'projectManage/form'，让 transRouter 正确识别

SET FOREIGN_KEY_CHECKS = 0;

-- 1. 项目管理 - 表单页路径
UPDATE sys_menu SET path = 'projectManage/form' WHERE id = 172 AND name = '项目表单';

-- 2. 任务管理 - 表单页路径
UPDATE sys_menu SET path = 'taskManage/form' WHERE id = 174 AND name = '任务表单';

-- 3. 工单管理 - 表单页路径
UPDATE sys_menu SET path = 'ticketManage/form' WHERE id = 176 AND name = '工单表单';

-- 4. 文档管理 - 表单页路径
UPDATE sys_menu SET path = 'documentManage/form' WHERE id = 178 AND name = '文档表单';

-- 5. 首页 - 工作台路径（修正为正确的相对路径）
UPDATE sys_menu SET path = 'home' WHERE id = 186 AND name = '工作台';

SET FOREIGN_KEY_CHECKS = 1;

-- 验证结果
SELECT 
  m.id,
  m.name AS '菜单名称',
  m.path AS '路由路径',
  parent.path AS '父级路径',
  CONCAT('/', IF(parent.path IS NULL OR parent.path = '', m.path, CONCAT(parent.path, '/', m.path))) AS '完整路径'
FROM sys_menu m
LEFT JOIN sys_menu parent ON m.parent_id = parent.id
WHERE m.id IN (172, 174, 176, 178, 186)
ORDER BY m.id;
