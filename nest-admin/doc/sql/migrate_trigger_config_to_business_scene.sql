-- 将 wf_business_config.trigger_config 从旧 workflowCode/空场景结构迁移为 businessScene 结构

UPDATE wf_business_config
SET trigger_config = JSON_OBJECT(
  'onCreate', JSON_OBJECT(
    'triggerEvent', 'onCreate',
    'name', '项目立项审批',
    'businessScene', 'initiation',
    'enabled', true
  ),
  'onStatusChange', JSON_OBJECT(
    'triggerEvent', 'onStatusChange',
    'name', '项目结项审批',
    'businessScene', 'closure',
    'statusTriggerValues', JSON_ARRAY('6'),
    'enabled', true
  )
)
WHERE business_type = 'project';

UPDATE wf_business_config
SET trigger_config = JSON_OBJECT(
  'onCreate', JSON_OBJECT(
    'triggerEvent', 'onCreate',
    'name', '工单创建审批',
    'businessScene', 'approval',
    'enabled', true
  ),
  'onStatusChange', JSON_OBJECT(
    'triggerEvent', 'onStatusChange',
    'name', '工单状态审批',
    'businessScene', 'approval',
    'statusTriggerValues', JSON_ARRAY('3', '4'),
    'enabled', true
  )
)
WHERE business_type = 'ticket';

UPDATE wf_business_config
SET trigger_config = JSON_OBJECT(
  'onCreate', JSON_OBJECT(
    'triggerEvent', 'onCreate',
    'name', '变更创建审批',
    'businessScene', 'approval',
    'enabled', true
  )
)
WHERE business_type = 'change';

UPDATE wf_business_config
SET trigger_config = JSON_OBJECT(
  'onCreate', JSON_OBJECT(
    'triggerEvent', 'onCreate',
    'name', '客户创建审批',
    'businessScene', 'approval',
    'enabled', true
  )
)
WHERE business_type = 'customer';
