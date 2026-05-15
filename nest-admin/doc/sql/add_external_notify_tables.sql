-- 外部账号映射与外部通知日志表
-- 飞书先落地，钉钉/企微后续复用 platform 字段扩展。

CREATE TABLE IF NOT EXISTS `sys_user_external_account` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `create_time` datetime DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `create_user` varchar(255) DEFAULT NULL COMMENT '创建人',
  `update_time` datetime DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  `update_user` varchar(255) DEFAULT NULL COMMENT '更新人',
  `is_delete` char(1) DEFAULT NULL COMMENT '是否删除: NULL未删除，1删除',
  `user_id` varchar(50) NOT NULL COMMENT '系统用户ID',
  `platform` varchar(30) NOT NULL COMMENT '外部平台：feishu/dingtalk/wecom',
  `external_user_id` varchar(100) DEFAULT NULL COMMENT '外部平台用户ID',
  `open_id` varchar(100) DEFAULT NULL COMMENT 'OpenID',
  `union_id` varchar(100) DEFAULT NULL COMMENT 'UnionID',
  `name` varchar(100) DEFAULT NULL COMMENT '外部平台用户名',
  `email` varchar(100) DEFAULT NULL COMMENT '外部平台邮箱',
  `mobile` varchar(50) DEFAULT NULL COMMENT '外部平台手机号',
  `bind_status` char(1) DEFAULT '1' COMMENT '绑定状态：1已绑定，0已解绑，2冲突，3失效',
  `bind_source` varchar(30) DEFAULT NULL COMMENT '绑定来源：manual/sync/oauth',
  `last_sync_time` datetime DEFAULT NULL COMMENT '最后同步时间',
  `extra_data` json DEFAULT NULL COMMENT '扩展信息',
  PRIMARY KEY (`id`),
  KEY `idx_external_account_user_platform` (`user_id`, `platform`),
  KEY `idx_external_account_platform_user` (`platform`, `external_user_id`),
  KEY `idx_external_account_open_id` (`platform`, `open_id`),
  KEY `idx_external_account_union_id` (`platform`, `union_id`)
) COMMENT='用户外部账号映射表';

CREATE TABLE IF NOT EXISTS `sys_external_message_log` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `create_time` datetime DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `create_user` varchar(255) DEFAULT NULL COMMENT '创建人',
  `update_time` datetime DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  `update_user` varchar(255) DEFAULT NULL COMMENT '更新人',
  `is_delete` char(1) DEFAULT NULL COMMENT '是否删除: NULL未删除，1删除',
  `platform` varchar(30) NOT NULL COMMENT '外部平台',
  `message_id` varchar(50) DEFAULT NULL COMMENT '站内消息ID',
  `receiver_id` varchar(50) DEFAULT NULL COMMENT '系统接收人ID',
  `external_user_id` varchar(100) DEFAULT NULL COMMENT '外部平台用户ID',
  `template_key` varchar(50) DEFAULT NULL COMMENT '模板',
  `send_status` char(1) DEFAULT '0' COMMENT '0失败，1成功，2跳过',
  `error_message` text COMMENT '失败原因',
  `request_payload` json DEFAULT NULL COMMENT '请求摘要',
  `response_payload` json DEFAULT NULL COMMENT '响应摘要',
  PRIMARY KEY (`id`),
  KEY `idx_external_message_platform_status` (`platform`, `send_status`),
  KEY `idx_external_message_message` (`message_id`)
) COMMENT='外部平台消息发送日志';
