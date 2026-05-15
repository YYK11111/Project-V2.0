-- 审批参与人索引查询优化
-- 用于项目/客户/任务等查看权限优先消费 business_approval_participant。

ALTER TABLE `business_approval_participant`
  ADD INDEX `idx_bap_user_business` (`user_id`, `business_type`, `business_id`),
  ADD INDEX `idx_bap_workflow_role` (`workflow_instance_id`, `role_type`);
