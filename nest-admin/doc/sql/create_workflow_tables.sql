-- ============================================
-- 工作流引擎数据库表结构
-- 创建时间: 2026-04-06
-- 说明: 根据轻量级工作流引擎技术方案创建
-- ============================================

-- 1. 流程定义表
CREATE TABLE IF NOT EXISTS `wf_definition` (
  `id` bigint NOT NULL AUTO_INCREMENT COMMENT '主键ID',
  `create_time` datetime DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `create_user` varchar(50) DEFAULT NULL COMMENT '创建人',
  `update_time` datetime DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  `update_user` varchar(50) DEFAULT NULL COMMENT '更新人',
  `is_delete` char(1) DEFAULT NULL COMMENT '是否删除: NULL未删除，1删除',
  `name` varchar(100) NOT NULL COMMENT '流程名称',
  `code` varchar(50) NOT NULL COMMENT '流程编码',
  `description` text COMMENT '流程描述',
  `version` int NOT NULL DEFAULT 1 COMMENT '版本号',
  `category` varchar(50) DEFAULT NULL COMMENT '流程分类',
  `business_type` varchar(50) DEFAULT NULL COMMENT '关联业务对象类型',
  `trigger_event` varchar(50) DEFAULT NULL COMMENT '触发事件: manual/on_create/on_update/on_status_change',
  `status_trigger_values` json DEFAULT NULL COMMENT '状态触发值',
  `nodes` json NOT NULL COMMENT '节点配置JSON',
  `flows` json NOT NULL COMMENT '连接线配置JSON',
  `global_config` json DEFAULT NULL COMMENT '全局配置',
  `is_active` char(1) NOT NULL DEFAULT '1' COMMENT '是否启用: 1启用 0停用',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_code_version` (`code`, `version`),
  KEY `idx_category` (`category`),
  KEY `idx_is_active` (`is_active`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='流程定义表';

-- 1.1 业务对象配置表
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

-- 2. 流程实例表
CREATE TABLE IF NOT EXISTS `wf_instance` (
  `id` bigint NOT NULL AUTO_INCREMENT COMMENT '主键ID',
  `create_time` datetime DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `create_user` varchar(50) DEFAULT NULL COMMENT '创建人',
  `update_time` datetime DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  `update_user` varchar(50) DEFAULT NULL COMMENT '更新人',
  `is_delete` char(1) DEFAULT NULL COMMENT '是否删除: NULL未删除，1删除',
  `definition_id` varchar(36) NOT NULL COMMENT '流程定义ID',
  `definition_code` varchar(50) NOT NULL COMMENT '流程定义编码',
  `business_key` varchar(100) NOT NULL COMMENT '业务数据ID',
  `starter_id` varchar(36) NOT NULL COMMENT '发起人ID',
  `current_node_id` varchar(50) DEFAULT NULL COMMENT '当前节点ID',
  `variables` json DEFAULT NULL COMMENT '流程变量JSON',
  `status` char(1) NOT NULL DEFAULT '1' COMMENT '状态: 1进行中 2已完成 3已取消 4已挂起',
  `start_time` datetime DEFAULT NULL COMMENT '开始时间',
  `end_time` datetime DEFAULT NULL COMMENT '结束时间',
  `duration` bigint DEFAULT NULL COMMENT '耗时(毫秒)',
  PRIMARY KEY (`id`),
  KEY `idx_definition_id` (`definition_id`),
  KEY `idx_business_key` (`business_key`),
  KEY `idx_status` (`status`),
  KEY `idx_starter_id` (`starter_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='流程实例表';

-- 3. 流程任务表
CREATE TABLE IF NOT EXISTS `wf_task` (
  `id` bigint NOT NULL AUTO_INCREMENT COMMENT '主键ID',
  `create_time` datetime DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `create_user` varchar(50) DEFAULT NULL COMMENT '创建人',
  `update_time` datetime DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  `update_user` varchar(50) DEFAULT NULL COMMENT '更新人',
  `is_delete` char(1) DEFAULT NULL COMMENT '是否删除: NULL未删除，1删除',
  `instance_id` varchar(36) NOT NULL COMMENT '流程实例ID',
  `node_id` varchar(50) NOT NULL COMMENT '节点ID',
  `node_name` varchar(100) NOT NULL COMMENT '节点名称',
  `node_type` varchar(20) NOT NULL COMMENT '节点类型',
  `assignee_id` varchar(36) DEFAULT NULL COMMENT '审批人ID',
  `assignee_name` varchar(100) DEFAULT NULL COMMENT '审批人名称',
  `candidate_ids` json DEFAULT NULL COMMENT '候选审批人ID列表JSON',
  `status` char(1) NOT NULL DEFAULT '1' COMMENT '状态: 1待处理 2处理中 3已完成 4已取消',
  `action` char(1) DEFAULT NULL COMMENT '审批动作: 1同意 2拒绝 3撤回 4转交',
  `comment` text COMMENT '审批意见',
  `input_data` json DEFAULT NULL COMMENT '输入数据JSON',
  `output_data` json DEFAULT NULL COMMENT '输出数据JSON',
  `start_time` datetime DEFAULT NULL COMMENT '任务开始时间',
  `complete_time` datetime DEFAULT NULL COMMENT '完成时间',
  `duration` bigint DEFAULT NULL COMMENT '处理耗时(毫秒)',
  `due_time` datetime DEFAULT NULL COMMENT '到期时间',
  PRIMARY KEY (`id`),
  KEY `idx_instance_id` (`instance_id`),
  KEY `idx_assignee_id` (`assignee_id`),
  KEY `idx_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='流程任务表';

-- 4. 流程历史记录表
CREATE TABLE IF NOT EXISTS `wf_history` (
  `id` bigint NOT NULL AUTO_INCREMENT COMMENT '主键ID',
  `create_time` datetime DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `create_user` varchar(50) DEFAULT NULL COMMENT '创建人',
  `update_time` datetime DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  `update_user` varchar(50) DEFAULT NULL COMMENT '更新人',
  `is_delete` char(1) DEFAULT NULL COMMENT '是否删除: NULL未删除，1删除',
  `instance_id` varchar(36) NOT NULL COMMENT '流程实例ID',
  `task_id` varchar(36) DEFAULT NULL COMMENT '关联任务ID',
  `node_id` varchar(50) DEFAULT NULL COMMENT '节点ID',
  `node_name` varchar(100) DEFAULT NULL COMMENT '节点名称',
  `operator_id` varchar(36) DEFAULT NULL COMMENT '操作人ID',
  `operator_name` varchar(100) DEFAULT NULL COMMENT '操作人名称',
  `action` varchar(20) DEFAULT NULL COMMENT '操作类型',
  `comment` text COMMENT '操作意见',
  `variables` json DEFAULT NULL COMMENT '当时变量状态',
  PRIMARY KEY (`id`),
  KEY `idx_instance_id` (`instance_id`),
  KEY `idx_task_id` (`task_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='流程历史记录表';

-- ============================================
-- 插入测试数据（可选）
-- ============================================

-- 示例：创建一个简单的请假审批流程
INSERT INTO `wf_definition` (`name`, `code`, `description`, `version`, `category`, `nodes`, `flows`, `global_config`, `is_active`, `create_user`) 
VALUES (
  '请假审批流程',
  'leave-approval',
  '员工请假审批流程，包含部门经理和HR两级审批',
  1,
  'hr',
  '[
    {"id":"start_1","name":"开始","type":"start","x":100,"y":200,"properties":{}},
    {"id":"approval_1","name":"部门经理审批","type":"approval","x":300,"y":200,"properties":{"assigneeType":"role","roleId":"dept-manager"}},
    {"id":"approval_2","name":"HR审批","type":"approval","x":500,"y":200,"properties":{"assigneeType":"role","roleId":"hr"}},
    {"id":"notification_1","name":"通知申请人","type":"notification","x":700,"y":200,"properties":{"notificationType":"system","notificationReceiverExpr":"${initiator}"}},
    {"id":"end_1","name":"结束","type":"end","x":900,"y":200,"properties":{}}
  ]',
  '[
    {"id":"flow_1","sourceNodeId":"start_1","targetNodeId":"approval_1"},
    {"id":"flow_2","sourceNodeId":"approval_1","targetNodeId":"approval_2"},
    {"id":"flow_3","sourceNodeId":"approval_2","targetNodeId":"notification_1"},
    {"id":"flow_4","sourceNodeId":"notification_1","targetNodeId":"end_1"}
  ]',
  NULL,
  '1',
  'system'
);

-- ============================================
-- 业务对象配置数据
-- ============================================

INSERT INTO `wf_business_config` (`business_type`, `name`, `table_name`, `id_field`, `trigger_config`, `is_active`)
VALUES 
  ('project', '项目', 'projects', 'id', '{"on_create": {"triggerEvent": "on_create", "name": "项目立项审批"}, "on_status_change": {"triggerEvent": "on_status_change", "name": "项目状态变更审批", "statusTriggerValues": ["3"]}}', '1'),
  ('customer', '客户', 'customers', 'id', '{"on_create": {"triggerEvent": "on_create", "name": "新增客户审批"}}', '1'),
  ('ticket', '工单', 'tickets', 'id', '{"on_create": {"triggerEvent": "on_create", "name": "工单创建审批"}, "on_status_change": {"triggerEvent": "on_status_change", "name": "缺陷关闭审批", "statusTriggerValues": ["3", "4"]}}', '1'),
  ('change', '变更请求', 'changes', 'id', '{"on_create": {"triggerEvent": "on_create", "name": "变更申请审批"}}', '1')
ON DUPLICATE KEY UPDATE `name` = VALUES(`name`), `trigger_config` = VALUES(`trigger_config`);

