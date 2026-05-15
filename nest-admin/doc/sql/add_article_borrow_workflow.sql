-- 知识借阅接入工作流审批。
-- 安全可重复执行：字段通过 information_schema 判断，默认流程通过 code 判断。

SET @article_borrow_table = 'busi_article_borrow';

ALTER TABLE `busi_article_borrow`
  MODIFY COLUMN `status` enum(
    'pending',
    'waitingStart',
    'active',
    'approved',
    'rejected',
    'expired',
    'revoked'
  ) NOT NULL DEFAULT 'pending' COMMENT '借阅状态';

SET @ddl = (
  SELECT IF(
    COUNT(*) = 0,
    'ALTER TABLE `busi_article_borrow` ADD COLUMN `requested_start_time` varchar(255) NULL COMMENT ''申请开始借阅时间''',
    'SELECT 1'
  )
  FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = @article_borrow_table
    AND COLUMN_NAME = 'requested_start_time'
);
PREPARE stmt FROM @ddl;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @ddl = (
  SELECT IF(
    COUNT(*) = 0,
    'ALTER TABLE `busi_article_borrow` ADD COLUMN `workflow_instance_id` varchar(255) NULL COMMENT ''流程实例ID''',
    'SELECT 1'
  )
  FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = @article_borrow_table
    AND COLUMN_NAME = 'workflow_instance_id'
);
PREPARE stmt FROM @ddl;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @ddl = (
  SELECT IF(
    COUNT(*) = 0,
    'ALTER TABLE `busi_article_borrow` ADD COLUMN `approval_status` varchar(255) NULL DEFAULT ''0'' COMMENT ''审批状态''',
    'SELECT 1'
  )
  FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = @article_borrow_table
    AND COLUMN_NAME = 'approval_status'
);
PREPARE stmt FROM @ddl;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @ddl = (
  SELECT IF(
    COUNT(*) = 0,
    'ALTER TABLE `busi_article_borrow` ADD COLUMN `current_node_name` varchar(255) NULL COMMENT ''当前流程节点''',
    'SELECT 1'
  )
  FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = @article_borrow_table
    AND COLUMN_NAME = 'current_node_name'
);
PREPARE stmt FROM @ddl;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

INSERT INTO `wf_definition` (
  `name`,
  `code`,
  `description`,
  `version`,
  `category`,
  `nodes`,
  `flows`,
  `global_config`,
  `is_active`,
  `business_type`,
  `business_scene`,
  `trigger_event`,
  `status_trigger_values`,
  `create_user`,
  `update_user`
)
SELECT
  '知识借阅审批流程',
  'WF_ARTICLE_BORROW_APPROVAL',
  '默认按知识分类管理员审批借阅申请',
  1,
  'Other',
  JSON_ARRAY(
    JSON_OBJECT(
      'id', 'start-1',
      'type', 'start',
      'name', '开始',
      'x', 80,
      'y', 180,
      'properties', JSON_OBJECT()
    ),
    JSON_OBJECT(
      'id', 'approval-1',
      'type', 'approval',
      'name', '分类管理员审批',
      'x', 300,
      'y', 180,
      'properties', JSON_OBJECT(
        'assigneeType', 'business_field',
        'businessType', 'articleBorrow',
        'fieldPath', 'catalog.managerUserIds',
        'assigneeEmptyAction', 'error',
        'multiInstanceType', 'sequential',
        'allowRollback', true
      )
    ),
    JSON_OBJECT(
      'id', 'end-1',
      'type', 'end',
      'name', '结束',
      'x', 520,
      'y', 180,
      'properties', JSON_OBJECT()
    )
  ),
  JSON_ARRAY(
    JSON_OBJECT('id', 'flow-1', 'sourceNodeId', 'start-1', 'targetNodeId', 'approval-1'),
    JSON_OBJECT('id', 'flow-2', 'sourceNodeId', 'approval-1', 'targetNodeId', 'end-1')
  ),
  JSON_OBJECT(),
  '1',
  'articleBorrow',
  'approval',
  'manual',
  JSON_ARRAY(),
  'system',
  'system'
WHERE NOT EXISTS (
  SELECT 1
  FROM `wf_definition`
  WHERE `code` = 'WF_ARTICLE_BORROW_APPROVAL'
    AND `is_delete` IS NULL
);
