-- 修复角色数据
UPDATE sys_role 
SET permissionKey='admin', `order`='1', is_active='1' 
WHERE id=1;

-- 验证修复结果
SELECT id, name, permissionKey, `order`, is_active FROM sys_role;
