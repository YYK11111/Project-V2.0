-- 工作流业务对象配置表
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

-- 插入业务对象配置数据
-- 项目配置
INSERT INTO `wf_business_config` (`business_type`, `name`, `table_name`, `id_field`, `trigger_config`, `is_active`)
VALUES ('project', '项目', 'projects', 'id', 
  '{"on_create": {"triggerEvent": "on_create", "name": "项目立项审批"}, "on_status_change": {"triggerEvent": "on_status_change", "name": "项目状态变更审批", "statusTriggerValues": ["3"]}}',
  '1')
ON DUPLICATE KEY UPDATE `name` = VALUES(`name`), `trigger_config` = VALUES(`trigger_config`);

-- 客户配置
INSERT INTO `wf_business_config` (`business_type`, `name`, `table_name`, `id_field`, `trigger_config`, `is_active`)
VALUES ('customer', '客户', 'customers', 'id',
  '{"on_create": {"triggerEvent": "on_create", "name": "新增客户审批"}}',
  '1')
ON DUPLICATE KEY UPDATE `name` = VALUES(`name`), `trigger_config` = VALUES(`trigger_config`);

-- 工单配置
INSERT INTO `wf_business_config` (`business_type`, `name`, `table_name`, `id_field`, `trigger_config`, `is_active`)
VALUES ('ticket', '工单', 'tickets', 'id',
  '{"on_create": {"triggerEvent": "on_create", "name": "工单创建审批"}, "on_status_change": {"triggerEvent": "on_status_change", "name": "缺陷关闭审批", "statusTriggerValues": ["3", "4"]}}',
  '1')
ON DUPLICATE KEY UPDATE `name` = VALUES(`name`), `trigger_config` = VALUES(`trigger_config`);

-- 变更请求配置
INSERT INTO `wf_business_config` (`business_type`, `name`, `table_name`, `id_field`, `trigger_config`, `is_active`)
VALUES ('change', '变更请求', 'changes', 'id',
  '{"on_create": {"triggerEvent": "on_create", "name": "变更申请审批"}}',
  '1')
ON DUPLICATE KEY UPDATE `name` = VALUES(`name`), `trigger_config` = VALUES(`trigger_config`);
