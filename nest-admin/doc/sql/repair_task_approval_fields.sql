-- 为 task 表补审批相关字段

SET @has_workflow_instance := (
  SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'task' AND COLUMN_NAME = 'workflowInstanceId'
);
SET @sql_workflow_instance := IF(
  @has_workflow_instance = 0,
  'ALTER TABLE `task` ADD COLUMN `workflowInstanceId` varchar(100) NULL COMMENT ''工作流实例ID'' AFTER `storyPoints`',
  'SELECT 1'
);
PREPARE stmt_workflow_instance FROM @sql_workflow_instance;
EXECUTE stmt_workflow_instance;
DEALLOCATE PREPARE stmt_workflow_instance;

SET @has_approval_status := (
  SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'task' AND COLUMN_NAME = 'approvalStatus'
);
SET @sql_approval_status := IF(
  @has_approval_status = 0,
  'ALTER TABLE `task` ADD COLUMN `approvalStatus` char(1) NOT NULL DEFAULT ''0'' COMMENT ''审批状态: 0无需审批 1审批中 2已通过 3已拒绝'' AFTER `workflowInstanceId`',
  'SELECT 1'
);
PREPARE stmt_approval_status FROM @sql_approval_status;
EXECUTE stmt_approval_status;
DEALLOCATE PREPARE stmt_approval_status;

SET @has_current_node := (
  SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'task' AND COLUMN_NAME = 'currentNodeName'
);
SET @sql_current_node := IF(
  @has_current_node = 0,
  'ALTER TABLE `task` ADD COLUMN `currentNodeName` varchar(100) NULL COMMENT ''当前审批节点名称'' AFTER `approvalStatus`',
  'SELECT 1'
);
PREPARE stmt_current_node FROM @sql_current_node;
EXECUTE stmt_current_node;
DEALLOCATE PREPARE stmt_current_node;
