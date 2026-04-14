-- 初始化部门数据
-- 为公司创建常用部门结构

SET FOREIGN_KEY_CHECKS = 0;

-- 插入一级部门（父ID为1，即总部）
INSERT INTO `sys_dept` (`name`, `parent_id`) VALUES ('销售部', 1);
SET @sales_dept_id = LAST_INSERT_ID();

INSERT INTO `sys_dept` (`name`, `parent_id`) VALUES ('市场部', 1);
SET @marketing_dept_id = LAST_INSERT_ID();

INSERT INTO `sys_dept` (`name`, `parent_id`) VALUES ('技术部', 1);
SET @tech_dept_id = LAST_INSERT_ID();

INSERT INTO `sys_dept` (`name`, `parent_id`) VALUES ('人力资源部', 1);
SET @hr_dept_id = LAST_INSERT_ID();

INSERT INTO `sys_dept` (`name`, `parent_id`) VALUES ('财务部', 1);
SET @finance_dept_id = LAST_INSERT_ID();

INSERT INTO `sys_dept` (`name`, `parent_id`) VALUES ('运营部', 1);
SET @operation_dept_id = LAST_INSERT_ID();

-- 二级部门 - 销售部下
INSERT INTO `sys_dept` (`name`, `parent_id`) VALUES ('大客户销售部', @sales_dept_id);
INSERT INTO `sys_dept` (`name`, `parent_id`) VALUES ('渠道销售部', @sales_dept_id);
INSERT INTO `sys_dept` (`name`, `parent_id`) VALUES ('电话销售部', @sales_dept_id);

-- 二级部门 - 技术部下
INSERT INTO `sys_dept` (`name`, `parent_id`) VALUES ('前端开发组', @tech_dept_id);
INSERT INTO `sys_dept` (`name`, `parent_id`) VALUES ('后端开发组', @tech_dept_id);
INSERT INTO `sys_dept` (`name`, `parent_id`) VALUES ('测试组', @tech_dept_id);
INSERT INTO `sys_dept` (`name`, `parent_id`) VALUES ('运维组', @tech_dept_id);

-- 二级部门 - 市场部下
INSERT INTO `sys_dept` (`name`, `parent_id`) VALUES ('品牌推广组', @marketing_dept_id);
INSERT INTO `sys_dept` (`name`, `parent_id`) VALUES ('活动策划组', @marketing_dept_id);

-- 验证结果
SELECT '=== 部门结构 ===' as info;
SELECT 
    d1.id as '一级ID',
    d1.name as '一级部门',
    d2.id as '二级ID',
    d2.name as '二级部门'
FROM `sys_dept` d1
LEFT JOIN `sys_dept` d2 ON d2.parent_id = d1.id
WHERE d1.parent_id IS NULL OR d1.id = 1
ORDER BY d1.id, d2.id;

SET FOREIGN_KEY_CHECKS = 1;
