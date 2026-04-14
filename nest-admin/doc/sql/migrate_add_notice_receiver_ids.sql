-- ========================================
-- 工作流引擎数据库迁移脚本
-- 执行时间: 2026-04-09
-- 说明: 为 sys_notice 表添加 receiver_ids 字段
-- ========================================

-- 检查字段是否已存在，避免重复执行
SET @dbname = DATABASE();
SET @tablename = 'sys_notice';
SET @columnname = 'receiver_ids';
SET @preparedStatement = (SELECT IF(
  (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
    WHERE
      TABLE_SCHEMA = @dbname
      AND TABLE_NAME = @tablename
      AND COLUMN_NAME = @columnname
  ) > 0,
  'SELECT 1',
  CONCAT('ALTER TABLE ', @tablename, ' ADD COLUMN `', @columnname, '` json DEFAULT NULL COMMENT \'接收人ID列表JSON\' AFTER `remark`;')
));

PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

-- 验证字段是否添加成功
SELECT 
  COLUMN_NAME,
  COLUMN_TYPE,
  IS_NULLABLE,
  COLUMN_COMMENT
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_SCHEMA = DATABASE()
  AND TABLE_NAME = 'sys_notice'
  AND COLUMN_NAME = 'receiver_ids';

-- 显示执行结果
SELECT '✅ receiver_ids 字段添加成功' AS result;
