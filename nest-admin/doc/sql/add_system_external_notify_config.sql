-- 系统配置增加外部通知配置。

ALTER TABLE `sys_config`
  ADD COLUMN `external_notify_config` json DEFAULT NULL COMMENT '外部通知配置' AFTER `project_field_permission_matrix`;
