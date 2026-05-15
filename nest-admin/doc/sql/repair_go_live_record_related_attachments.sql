-- 上线单相关附件字段补丁
-- 生产环境关闭 synchronize 时执行；已存在字段时不会重复添加。

SET @column_exists := (
  SELECT COUNT(1)
  FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'go_live_record'
    AND COLUMN_NAME = 'related_attachments'
);

SET @sql := IF(
  @column_exists = 0,
  'ALTER TABLE `go_live_record` ADD COLUMN `related_attachments` JSON NULL COMMENT ''相关附件''',
  'SELECT ''go_live_record.related_attachments already exists'' AS message'
);

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
