-- Project workflow phase 1 migration.
-- Safe to re-run on MySQL 8+.

SET @has_project_type_column := (
  SELECT COUNT(*)
  FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'project'
    AND COLUMN_NAME = 'project_type'
);

SET @add_project_type_sql := IF(
  @has_project_type_column = 0,
  'ALTER TABLE `project` ADD COLUMN `project_type` char(1) NOT NULL DEFAULT ''1'' COMMENT ''项目类型:1实施类 2定制开发 3运维类'' AFTER `status`',
  'SELECT 1'
);

PREPARE stmt_add_project_type FROM @add_project_type_sql;
EXECUTE stmt_add_project_type;
DEALLOCATE PREPARE stmt_add_project_type;

UPDATE `project`
SET `project_type` = '1'
WHERE `project_type` IS NULL OR `project_type` = '';

INSERT INTO `wf_definition` (`name`, `code`, `description`, `version`, `category`, `nodes`, `flows`, `global_config`, `is_active`, `business_type`, `trigger_event`, `create_user`, `update_user`)
SELECT
  '项目立项审批',
  'PROJECT_APPROVAL',
  '项目立项审批流程',
  1,
  'project',
  JSON_ARRAY(
    JSON_OBJECT('id', 'start_1', 'name', '开始', 'type', 'start', 'properties', JSON_OBJECT()),
    JSON_OBJECT('id', 'approval_1', 'name', '交付经理审批', 'type', 'approval', 'properties', JSON_OBJECT('assigneeType', 'business_field', 'fieldPath', 'memberGroups.2', 'businessType', 'project', 'assigneeEmptyAction', 'assign_to', 'assigneeEmptyFallbackFieldPath', 'memberGroups.1')),
    JSON_OBJECT('id', 'end_1', 'name', '结束', 'type', 'end', 'properties', JSON_OBJECT())
  ),
  JSON_ARRAY(
    JSON_OBJECT('sourceNodeId', 'start_1', 'targetNodeId', 'approval_1'),
    JSON_OBJECT('sourceNodeId', 'approval_1', 'targetNodeId', 'end_1')
  ),
  JSON_OBJECT(),
  '1',
  'project',
  'manual',
  'system',
  'system'
WHERE NOT EXISTS (
  SELECT 1 FROM `wf_definition` WHERE `code` = 'PROJECT_APPROVAL' AND `is_delete` IS NULL
);

INSERT INTO `wf_definition` (`name`, `code`, `description`, `version`, `category`, `nodes`, `flows`, `global_config`, `is_active`, `business_type`, `trigger_event`, `create_user`, `update_user`)
SELECT
  '项目结项审批',
  'PROJECT_CLOSE_APPROVAL',
  '项目结项审批流程',
  1,
  'project',
  JSON_ARRAY(
    JSON_OBJECT('id', 'start_1', 'name', '开始', 'type', 'start', 'properties', JSON_OBJECT()),
    JSON_OBJECT('id', 'approval_1', 'name', '测试负责人审批', 'type', 'approval', 'properties', JSON_OBJECT('assigneeType', 'business_field', 'fieldPath', 'memberGroups.5', 'businessType', 'project', 'assigneeEmptyAction', 'assign_to', 'assigneeEmptyFallbackFieldPath', 'memberGroups.2')),
    JSON_OBJECT('id', 'end_1', 'name', '结束', 'type', 'end', 'properties', JSON_OBJECT())
  ),
  JSON_ARRAY(
    JSON_OBJECT('sourceNodeId', 'start_1', 'targetNodeId', 'approval_1'),
    JSON_OBJECT('sourceNodeId', 'approval_1', 'targetNodeId', 'end_1')
  ),
  JSON_OBJECT(),
  '1',
  'project',
  'manual',
  'system',
  'system'
WHERE NOT EXISTS (
  SELECT 1 FROM `wf_definition` WHERE `code` = 'PROJECT_CLOSE_APPROVAL' AND `is_delete` IS NULL
);

UPDATE `wf_definition`
SET `name` = '项目立项审批',
    `description` = '项目立项审批流程',
    `category` = 'project',
    `business_type` = 'project',
    `trigger_event` = 'manual',
    `is_active` = '1',
    `nodes` = JSON_ARRAY(
      JSON_OBJECT('id', 'start_1', 'name', '开始', 'type', 'start', 'properties', JSON_OBJECT()),
      JSON_OBJECT('id', 'approval_1', 'name', '交付经理审批', 'type', 'approval', 'properties', JSON_OBJECT('assigneeType', 'business_field', 'fieldPath', 'memberGroups.2', 'businessType', 'project', 'assigneeEmptyAction', 'assign_to', 'assigneeEmptyFallbackFieldPath', 'memberGroups.1')),
      JSON_OBJECT('id', 'end_1', 'name', '结束', 'type', 'end', 'properties', JSON_OBJECT())
    ),
    `flows` = JSON_ARRAY(
      JSON_OBJECT('sourceNodeId', 'start_1', 'targetNodeId', 'approval_1'),
      JSON_OBJECT('sourceNodeId', 'approval_1', 'targetNodeId', 'end_1')
    )
WHERE `code` = 'PROJECT_APPROVAL' AND `is_delete` IS NULL;

UPDATE `wf_definition`
SET `name` = '项目结项审批',
    `description` = '项目结项审批流程',
    `category` = 'project',
    `business_type` = 'project',
    `trigger_event` = 'manual',
    `is_active` = '1',
    `nodes` = JSON_ARRAY(
      JSON_OBJECT('id', 'start_1', 'name', '开始', 'type', 'start', 'properties', JSON_OBJECT()),
      JSON_OBJECT('id', 'approval_1', 'name', '测试负责人审批', 'type', 'approval', 'properties', JSON_OBJECT('assigneeType', 'business_field', 'fieldPath', 'memberGroups.5', 'businessType', 'project', 'assigneeEmptyAction', 'assign_to', 'assigneeEmptyFallbackFieldPath', 'memberGroups.2')),
      JSON_OBJECT('id', 'end_1', 'name', '结束', 'type', 'end', 'properties', JSON_OBJECT())
    ),
    `flows` = JSON_ARRAY(
      JSON_OBJECT('sourceNodeId', 'start_1', 'targetNodeId', 'approval_1'),
      JSON_OBJECT('sourceNodeId', 'approval_1', 'targetNodeId', 'end_1')
    )
WHERE `code` = 'PROJECT_CLOSE_APPROVAL' AND `is_delete` IS NULL;

INSERT INTO `wf_business_config` (`business_type`, `name`, `table_name`, `id_field`, `field_definitions`, `data_loader_class`, `trigger_config`, `is_active`)
SELECT
  'project',
  '项目',
  'project',
  'id',
  NULL,
  'ProjectLoader',
  JSON_OBJECT(),
  '1'
WHERE NOT EXISTS (
  SELECT 1 FROM `wf_business_config` WHERE `business_type` = 'project'
);

UPDATE `wf_business_config`
SET `name` = '项目',
    `table_name` = 'project',
    `id_field` = 'id',
    `data_loader_class` = 'ProjectLoader',
    `is_active` = '1'
WHERE `business_type` = 'project';
