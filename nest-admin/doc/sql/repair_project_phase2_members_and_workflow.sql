-- Project phase 2 migration.
-- 1. 项目成员改为明细模型，补充 is_core / remark / sort
-- 2. 工作流处理人来源收敛为 user / department / business_field
-- 3. 项目流程定义改为按 memberGroups 取人

SET @has_is_core := (
  SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'project_member' AND COLUMN_NAME = 'is_core'
);
SET @sql_is_core := IF(
  @has_is_core = 0,
  'ALTER TABLE `project_member` ADD COLUMN `is_core` char(1) NOT NULL DEFAULT ''0'' COMMENT ''是否核心成员'' AFTER `is_active`',
  'SELECT 1'
);
PREPARE stmt_is_core FROM @sql_is_core;
EXECUTE stmt_is_core;
DEALLOCATE PREPARE stmt_is_core;

SET @has_remark := (
  SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'project_member' AND COLUMN_NAME = 'remark'
);
SET @sql_remark := IF(
  @has_remark = 0,
  'ALTER TABLE `project_member` ADD COLUMN `remark` varchar(255) NULL COMMENT ''成员备注'' AFTER `is_core`',
  'SELECT 1'
);
PREPARE stmt_remark FROM @sql_remark;
EXECUTE stmt_remark;
DEALLOCATE PREPARE stmt_remark;

SET @has_sort := (
  SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'project_member' AND COLUMN_NAME = 'sort'
);
SET @sql_sort := IF(
  @has_sort = 0,
  'ALTER TABLE `project_member` ADD COLUMN `sort` int NOT NULL DEFAULT 0 COMMENT ''排序'' AFTER `remark`',
  'SELECT 1'
);
PREPARE stmt_sort FROM @sql_sort;
EXECUTE stmt_sort;
DEALLOCATE PREPARE stmt_sort;

UPDATE `project_member`
SET `is_core` = CASE
  WHEN `role` IN ('1', '2', '3', '4', '5', '6', '7') THEN '1'
  ELSE '0'
END
WHERE `is_core` IS NULL OR `is_core` = '';

UPDATE `project_member`
SET `sort` = 0
WHERE `sort` IS NULL;

UPDATE `wf_definition`
SET `is_active` = '1',
`nodes` = JSON_ARRAY(
  JSON_OBJECT('id', 'start_1', 'name', '开始', 'type', 'start', 'properties', JSON_OBJECT()),
  JSON_OBJECT(
    'id', 'approval_1',
    'name', '交付经理审批',
    'type', 'approval',
    'properties', JSON_OBJECT(
      'assigneeType', 'business_field',
      'fieldPath', 'memberGroups.2',
      'businessType', 'project',
      'assigneeEmptyAction', 'assign_to',
      'assigneeEmptyFallbackFieldPath', 'memberGroups.1'
    )
  ),
  JSON_OBJECT('id', 'end_1', 'name', '结束', 'type', 'end', 'properties', JSON_OBJECT())
),
`flows` = JSON_ARRAY(
  JSON_OBJECT('sourceNodeId', 'start_1', 'targetNodeId', 'approval_1'),
  JSON_OBJECT('sourceNodeId', 'approval_1', 'targetNodeId', 'end_1')
)
WHERE `code` = 'PROJECT_APPROVAL' AND `is_delete` IS NULL;

INSERT INTO `wf_definition` (`name`, `code`, `description`, `version`, `category`, `nodes`, `flows`, `global_config`, `is_active`, `business_type`, `trigger_event`, `create_user`, `update_user`, `is_delete`)
SELECT
  '项目立项审批',
  'PROJECT_APPROVAL',
  '项目立项审批流程',
  1,
  'project',
  JSON_ARRAY(
    JSON_OBJECT('id', 'start_1', 'name', '开始', 'type', 'start', 'properties', JSON_OBJECT()),
    JSON_OBJECT(
      'id', 'approval_1',
      'name', '交付经理审批',
      'type', 'approval',
      'properties', JSON_OBJECT(
        'assigneeType', 'business_field',
        'fieldPath', 'memberGroups.2',
        'businessType', 'project',
        'assigneeEmptyAction', 'assign_to',
        'assigneeEmptyFallbackFieldPath', 'memberGroups.1'
      )
    ),
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
  'system',
  NULL
WHERE NOT EXISTS (
  SELECT 1 FROM `wf_definition` WHERE `code` = 'PROJECT_APPROVAL' AND `is_delete` IS NULL
);

UPDATE `wf_definition`
SET `nodes` = JSON_ARRAY(
  JSON_OBJECT('id', 'start_1', 'name', '开始', 'type', 'start', 'properties', JSON_OBJECT()),
  JSON_OBJECT(
    'id', 'approval_1',
    'name', '测试负责人审批',
    'type', 'approval',
    'properties', JSON_OBJECT(
      'assigneeType', 'business_field',
      'fieldPath', 'memberGroups.5',
      'businessType', 'project',
      'assigneeEmptyAction', 'assign_to',
      'assigneeEmptyFallbackFieldPath', 'memberGroups.2'
    )
  ),
  JSON_OBJECT('id', 'end_1', 'name', '结束', 'type', 'end', 'properties', JSON_OBJECT())
),
`flows` = JSON_ARRAY(
  JSON_OBJECT('sourceNodeId', 'start_1', 'targetNodeId', 'approval_1'),
  JSON_OBJECT('sourceNodeId', 'approval_1', 'targetNodeId', 'end_1')
)
WHERE `code` = 'PROJECT_CLOSE_APPROVAL' AND `is_delete` IS NULL;
