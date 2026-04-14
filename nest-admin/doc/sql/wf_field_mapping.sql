-- 创建工作流字段映射表
CREATE TABLE IF NOT EXISTS `wf_field_mapping` (
  `id` BIGINT NOT NULL AUTO_INCREMENT COMMENT '主键ID',
  `create_time` DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `create_user` VARCHAR(36) COMMENT '创建人',
  `update_time` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  `update_user` VARCHAR(36) COMMENT '更新人',
  `is_delete` CHAR(1) DEFAULT NULL COMMENT '是否删除: NULL未删除，1删除',
  `business_type` VARCHAR(50) NOT NULL COMMENT '业务类型: project, ticket, customer, change',
  `field_name` VARCHAR(100) NOT NULL COMMENT '字段名称: leader, creator, submitter',
  `field_label` VARCHAR(200) NOT NULL COMMENT '字段显示名称: 项目负责人, 创建人',
  `resolve_field` VARCHAR(100) NOT NULL COMMENT '解析字段(数据库列名): leader_id, create_user',
  `resolve_type` VARCHAR(50) NOT NULL COMMENT '解析类型: userId, userIds, deptId',
  `relation_path` VARCHAR(200) COMMENT '关联路径(可选): leader.dept.id',
  `description` TEXT COMMENT '描述',
  `enabled` TINYINT(1) DEFAULT TRUE COMMENT '是否启用',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_business_field` (`business_type`, `field_name`),
  KEY `idx_business_type` (`business_type`),
  KEY `idx_enabled` (`enabled`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='工作流字段映射配置表';
