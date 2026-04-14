-- ============================================
-- 工作流业务对象配置表更新
-- 更新时间: 2026-04-11
-- 说明: 为现有工作流表添加业务关联字段和业务配置表
-- ============================================

-- 1. 给 wf_definition 表增加业务关联字段
ALTER TABLE `wf_definition` 
  ADD COLUMN `business_type` VARCHAR(50) DEFAULT NULL COMMENT '关联业务对象类型' AFTER `category`,
  ADD COLUMN `trigger_event` VARCHAR(50) DEFAULT NULL COMMENT '触发事件' AFTER `business_type`,
  ADD COLUMN `status_trigger_values` JSON DEFAULT NULL COMMENT '状态触发值' AFTER `trigger_event`;

-- 2. 创建业务对象配置表
CREATE TABLE IF NOT EXISTS `wf_business_config` (
  `business_type` VARCHAR(50) NOT NULL COMMENT '业务对象类型',
  `name` VARCHAR(100) NOT NULL COMMENT '业务对象名称',
  `table_name` VARCHAR(50) NOT NULL COMMENT '对应的数据库表名',
  `id_field` VARCHAR(50) DEFAULT 'id' COMMENT 'ID字段名',
  `field_definitions` TEXT COMMENT '字段定义JSON',
  `data_loader_class` VARCHAR(200) COMMENT '数据加载器类名',
  `trigger_config` JSON COMMENT '触发时机配置',
  `is_active` CHAR(1) DEFAULT '1' COMMENT '是否启用',
  PRIMARY KEY (`business_type`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='工作流业务对象配置表';

-- 3. 插入业务对象配置数据
INSERT INTO `wf_business_config` (`business_type`, `name`, `table_name`, `id_field`, `trigger_config`, `is_active`)
VALUES 
  ('project', '项目', 'projects', 'id', '{"on_create": {"triggerEvent": "on_create", "name": "项目立项审批"}, "on_status_change": {"triggerEvent": "on_status_change", "name": "项目状态变更审批", "statusTriggerValues": ["3"]}}', '1'),
  ('customer', '客户', 'customers', 'id', '{"on_create": {"triggerEvent": "on_create", "name": "新增客户审批"}}', '1'),
  ('ticket', '工单', 'tickets', 'id', '{"on_create": {"triggerEvent": "on_create", "name": "工单创建审批"}, "on_status_change": {"triggerEvent": "on_status_change", "name": "缺陷关闭审批", "statusTriggerValues": ["3", "4"]}}', '1'),
  ('change', '变更请求', 'changes', 'id', '{"on_create": {"triggerEvent": "on_create", "name": "变更申请审批"}}', '1')
ON DUPLICATE KEY UPDATE `name` = VALUES(`name`), `trigger_config` = VALUES(`trigger_config`);

-- 4. 给业务表增加工作流字段
ALTER TABLE `projects` 
  ADD COLUMN `workflow_instance_id` VARCHAR(100) DEFAULT NULL COMMENT '工作流实例ID',
  ADD COLUMN `approval_status` CHAR(1) DEFAULT '0' COMMENT '审批状态: 0无需审批 1审批中 2已通过 3已拒绝',
  ADD COLUMN `current_node_name` VARCHAR(100) DEFAULT NULL COMMENT '当前审批节点名称';

ALTER TABLE `customers` 
  ADD COLUMN `workflow_instance_id` VARCHAR(100) DEFAULT NULL COMMENT '工作流实例ID',
  ADD COLUMN `approval_status` CHAR(1) DEFAULT '0' COMMENT '审批状态',
  ADD COLUMN `current_node_name` VARCHAR(100) DEFAULT NULL COMMENT '当前审批节点名称';

ALTER TABLE `tickets` 
  ADD COLUMN `workflow_instance_id` VARCHAR(100) DEFAULT NULL COMMENT '工作流实例ID',
  ADD COLUMN `approval_status` CHAR(1) DEFAULT '0' COMMENT '审批状态',
  ADD COLUMN `current_node_name` VARCHAR(100) DEFAULT NULL COMMENT '当前审批节点名称';

ALTER TABLE `changes` 
  ADD COLUMN `workflow_instance_id` VARCHAR(100) DEFAULT NULL COMMENT '工作流实例ID',
  ADD COLUMN `approval_status` CHAR(1) DEFAULT '0' COMMENT '审批状态',
  ADD COLUMN `current_node_name` VARCHAR(100) DEFAULT NULL COMMENT '当前审批节点名称';

-- 5. 给部门表增加负责人字段
ALTER TABLE `sys_dept` 
  ADD COLUMN `leader_id` VARCHAR(36) DEFAULT NULL COMMENT '部门负责人ID' AFTER `parent_id`;

-- 6. 查看表结构确认
-- SELECT `business_type`, `trigger_event` FROM `wf_definition` LIMIT 5;
-- SELECT * FROM `wf_business_config`;
