-- 为上线单、验收单、运维交接单初始化 workflow 业务配置

INSERT INTO wf_business_config (
  create_time, update_time, name, business_type, table_name, id_field,
  trigger_config, is_active, is_delete, create_user, update_user
)
SELECT NOW(), NOW(), '上线单', 'goLive', 'go_live_record', 'id', '{}', '1', NULL, 'system', 'system'
WHERE NOT EXISTS (
  SELECT 1 FROM wf_business_config WHERE is_delete IS NULL AND business_type = 'goLive'
);

INSERT INTO wf_business_config (
  create_time, update_time, name, business_type, table_name, id_field,
  trigger_config, is_active, is_delete, create_user, update_user
)
SELECT NOW(), NOW(), '验收单', 'acceptance', 'acceptance_record', 'id', '{}', '1', NULL, 'system', 'system'
WHERE NOT EXISTS (
  SELECT 1 FROM wf_business_config WHERE is_delete IS NULL AND business_type = 'acceptance'
);

INSERT INTO wf_business_config (
  create_time, update_time, name, business_type, table_name, id_field,
  trigger_config, is_active, is_delete, create_user, update_user
)
SELECT NOW(), NOW(), '运维交接单', 'handover', 'handover_record', 'id', '{}', '1', NULL, 'system', 'system'
WHERE NOT EXISTS (
  SELECT 1 FROM wf_business_config WHERE is_delete IS NULL AND business_type = 'handover'
);
