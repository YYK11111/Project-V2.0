-- 为工作流定义增加业务场景字段，并迁移项目主线流程

SET @has_business_scene := (
  SELECT COUNT(*)
  FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'wf_definition'
    AND COLUMN_NAME = 'business_scene'
);

SET @add_business_scene_sql := IF(
  @has_business_scene = 0,
  'ALTER TABLE `wf_definition` ADD COLUMN `business_scene` varchar(50) NULL COMMENT ''业务场景'' AFTER `business_type`',
  'SELECT 1'
);

PREPARE stmt_add_business_scene FROM @add_business_scene_sql;
EXECUTE stmt_add_business_scene;
DEALLOCATE PREPARE stmt_add_business_scene;

UPDATE `wf_definition`
SET `business_type` = 'project',
    `business_scene` = 'initiation',
    `trigger_event` = 'manual'
WHERE `code` = 'PROJECT_APPROVAL' AND `is_delete` IS NULL;

UPDATE `wf_definition`
SET `business_type` = 'project',
    `business_scene` = 'closure',
    `trigger_event` = 'manual'
WHERE `code` = 'PROJECT_CLOSE_APPROVAL' AND `is_delete` IS NULL;

UPDATE `wf_definition`
SET `business_scene` = 'approval'
WHERE `business_type` IN ('task', 'ticket', 'change', 'customer')
  AND (`business_scene` IS NULL OR `business_scene` = '')
  AND `is_delete` IS NULL;
