-- CRM客户管理模块初始化SQL脚本
-- 包含：客户表、互动记录表、销售机会表、合同表

-- 客户表
CREATE TABLE `crm_customer` (
  `id` bigint NOT NULL AUTO_INCREMENT COMMENT '主键ID',
  `create_time` datetime DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `create_user` varchar(50) DEFAULT NULL COMMENT '创建人',
  `update_time` datetime DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  `update_user` varchar(50) DEFAULT NULL COMMENT '更新人',
  `is_delete` char(1) DEFAULT NULL COMMENT '是否删除: NULL未删除，1删除',
  `name` varchar(100) NOT NULL COMMENT '客户名称',
  `short_name` varchar(50) DEFAULT NULL COMMENT '客户简称',
  `code` varchar(50) DEFAULT NULL COMMENT '客户编号',
  `type` char(1) DEFAULT '1' COMMENT '客户类型:1企业客户 2个人客户',
  `unified_social_credit_code` varchar(18) DEFAULT NULL COMMENT '统一社会信用代码',
  `industry` varchar(100) DEFAULT NULL COMMENT '所属行业',
  `scale` varchar(50) DEFAULT NULL COMMENT '企业规模',
  `address` varchar(200) DEFAULT NULL COMMENT '企业地址',
  `contact_person` varchar(20) DEFAULT NULL COMMENT '联系人',
  `contact_phone` varchar(20) DEFAULT NULL COMMENT '联系电话',
  `contact_email` varchar(100) DEFAULT NULL COMMENT '联系邮箱',
  `level` char(1) DEFAULT '2' COMMENT '客户等级:1 VIP 2重要 3普通',
  `status` char(1) DEFAULT '1' COMMENT '客户状态:1潜在 2意向 3成交 4流失',
  `sales_id` bigint DEFAULT NULL COMMENT '销售负责人ID',
  `dept_id` bigint DEFAULT NULL COMMENT '所属部门ID',
  `description` text COMMENT '客户描述',
  `extra_info` json DEFAULT NULL COMMENT '扩展信息',
  `customer_value` decimal(14,2) DEFAULT NULL COMMENT '客户价值(万元)',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_name` (`name`),
  KEY `idx_code` (`code`),
  KEY `idx_level` (`level`),
  KEY `idx_status` (`status`),
  KEY `idx_sales_id` (`sales_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='客户表';

-- 客户互动记录表
CREATE TABLE `crm_interaction` (
  `id` bigint NOT NULL AUTO_INCREMENT COMMENT '主键ID',
  `create_time` datetime DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `create_user` varchar(50) DEFAULT NULL COMMENT '创建人',
  `update_time` datetime DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  `update_user` varchar(50) DEFAULT NULL COMMENT '更新人',
  `is_delete` char(1) DEFAULT NULL COMMENT '是否删除: NULL未删除，1删除',
  `customer_id` bigint NOT NULL COMMENT '客户ID',
  `interaction_type` char(1) DEFAULT '1' COMMENT '互动类型:1电话 2邮件 3拜访 4会议 5其他',
  `content` text COMMENT '互动内容',
  `interaction_time` datetime DEFAULT NULL COMMENT '互动时间',
  `operator_id` varchar(36) DEFAULT NULL COMMENT '互动人ID',
  `operator_name` varchar(100) DEFAULT NULL COMMENT '互动人名称',
  `next_follow_time` datetime DEFAULT NULL COMMENT '下次跟进时间',
  `attachments` json DEFAULT NULL COMMENT '附件列表',
  PRIMARY KEY (`id`),
  KEY `idx_customer_id` (`customer_id`),
  KEY `idx_interaction_time` (`interaction_time`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='客户互动记录表';

-- 销售机会表
CREATE TABLE `crm_opportunity` (
  `id` bigint NOT NULL AUTO_INCREMENT COMMENT '主键ID',
  `create_time` datetime DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `create_user` varchar(50) DEFAULT NULL COMMENT '创建人',
  `update_time` datetime DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  `update_user` varchar(50) DEFAULT NULL COMMENT '更新人',
  `is_delete` char(1) DEFAULT NULL COMMENT '是否删除: NULL未删除，1删除',
  `name` varchar(100) NOT NULL COMMENT '机会名称',
  `code` varchar(50) DEFAULT NULL COMMENT '机会编号',
  `customer_id` bigint NOT NULL COMMENT '客户ID',
  `expected_amount` decimal(14,2) DEFAULT NULL COMMENT '预期金额(元)',
  `stage` char(1) DEFAULT '1' COMMENT '销售阶段:1初步接触 2需求分析 3方案制定 4商务谈判 5合同签订',
  `success_rate` int DEFAULT 0 COMMENT '成功概率(%)',
  `expected_close_date` datetime DEFAULT NULL COMMENT '预计成交时间',
  `actual_close_date` datetime DEFAULT NULL COMMENT '实际成交时间',
  `sales_id` bigint NOT NULL COMMENT '销售负责人ID',
  `description` text COMMENT '机会描述',
  `loss_reason` text COMMENT '失败原因',
  `project_id` bigint DEFAULT NULL COMMENT '关联项目ID',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_name` (`name`),
  KEY `idx_customer_id` (`customer_id`),
  KEY `idx_stage` (`stage`),
  KEY `idx_sales_id` (`sales_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='销售机会表';

-- 合同表
CREATE TABLE `crm_contract` (
  `id` bigint NOT NULL AUTO_INCREMENT COMMENT '主键ID',
  `create_time` datetime DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `create_user` varchar(50) DEFAULT NULL COMMENT '创建人',
  `update_time` datetime DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  `update_user` varchar(50) DEFAULT NULL COMMENT '更新人',
  `is_delete` char(1) DEFAULT NULL COMMENT '是否删除: NULL未删除，1删除',
  `name` varchar(100) NOT NULL COMMENT '合同名称',
  `code` varchar(50) DEFAULT NULL COMMENT '合同编号',
  `customer_id` bigint NOT NULL COMMENT '客户ID',
  `opportunity_id` bigint DEFAULT NULL COMMENT '关联机会ID',
  `project_id` bigint DEFAULT NULL COMMENT '关联项目ID',
  `amount` decimal(14,2) DEFAULT NULL COMMENT '合同金额(元)',
  `received_amount` decimal(14,2) DEFAULT NULL COMMENT '已收款金额(元)',
  `signing_date` datetime DEFAULT NULL COMMENT '签订时间',
  `start_date` datetime DEFAULT NULL COMMENT '开始时间',
  `end_date` datetime DEFAULT NULL COMMENT '结束时间',
  `status` char(1) DEFAULT '1' COMMENT '合同状态:1执行中 2已到期 3已终止 4已归档',
  `owner_id` bigint NOT NULL COMMENT '合同负责人ID',
  `contract_file` varchar(255) DEFAULT NULL COMMENT '合同文件路径',
  `remark` text COMMENT '备注',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_name` (`name`),
  KEY `idx_customer_id` (`customer_id`),
  KEY `idx_status` (`status`),
  KEY `idx_owner_id` (`owner_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='合同表';

