-- 修复流程实例列表在大数据量下按时间排序触发 filesort / sort buffer 溢出的问题
-- 在目标数据库中执行，本脚本会跳过已存在的索引

DROP PROCEDURE IF EXISTS add_workflow_sort_index_if_not_exists;

DELIMITER //
CREATE PROCEDURE add_workflow_sort_index_if_not_exists(
  IN targetTable VARCHAR(64),
  IN targetIndex VARCHAR(64),
  IN targetColumns TEXT
)
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM INFORMATION_SCHEMA.STATISTICS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = targetTable
      AND INDEX_NAME = targetIndex
  ) THEN
    SET @addIndexSql = CONCAT(
      'ALTER TABLE `',
      targetTable,
      '` ADD INDEX `',
      targetIndex,
      '` ',
      targetColumns
    );
    PREPARE addIndexStatement FROM @addIndexSql;
    EXECUTE addIndexStatement;
    DEALLOCATE PREPARE addIndexStatement;
  END IF;
END//
DELIMITER ;

CALL add_workflow_sort_index_if_not_exists(
  'wf_instance',
  'idx_wf_instance_starter_delete_start_time',
  '(`starter_id`, `is_delete`, `start_time`)'
);

CALL add_workflow_sort_index_if_not_exists(
  'wf_instance',
  'idx_wf_instance_delete_start_time',
  '(`is_delete`, `start_time`)'
);

CALL add_workflow_sort_index_if_not_exists(
  'wf_instance',
  'idx_wf_instance_delete_status_start_time',
  '(`is_delete`, `status`, `start_time`)'
);

CALL add_workflow_sort_index_if_not_exists(
  'wf_task',
  'idx_wf_task_assignee_delete_create_time',
  '(`assignee_id`, `is_delete`, `create_time`)'
);

CALL add_workflow_sort_index_if_not_exists(
  'wf_history',
  'idx_wf_history_operator_delete_time',
  '(`operator_id`, `is_delete`, `create_time`)'
);

DROP PROCEDURE IF EXISTS add_workflow_sort_index_if_not_exists;
