-- 为 task/ticket/change/customer 补最小可用审批流程定义

INSERT INTO wf_definition (name, code, description, version, category, nodes, flows, global_config, is_active, business_type, business_scene, trigger_event, create_user, update_user, is_delete)
SELECT '任务审批流程', 'TASK_APPROVAL', '任务审批流程', 1, 'task',
       '[{"id":"start_1","name":"开始","type":"start","properties":{}},{"id":"approval_1","name":"任务负责人审批","type":"approval","properties":{"assigneeType":"business_field","fieldPath":"leader.id","businessType":"task","assigneeEmptyAction":"error"}},{"id":"end_1","name":"结束","type":"end","properties":{}}]',
       '[{"id":"flow_start_approval","sourceNodeId":"start_1","targetNodeId":"approval_1","sourceAnchor":"right","targetAnchor":"left","flowType":"normal","conditionId":""},{"id":"flow_approval_end","sourceNodeId":"approval_1","targetNodeId":"end_1","sourceAnchor":"right","targetAnchor":"left","flowType":"normal","conditionId":""}]',
       '{}', '1', 'task', 'approval', 'manual', 'system', 'system', NULL
WHERE NOT EXISTS (SELECT 1 FROM wf_definition WHERE business_type='task' AND business_scene='approval' AND is_delete IS NULL);

INSERT INTO wf_definition (name, code, description, version, category, nodes, flows, global_config, is_active, business_type, business_scene, trigger_event, create_user, update_user, is_delete)
SELECT '工单审批流程', 'TICKET_APPROVAL', '工单审批流程', 1, 'ticket',
       '[{"id":"start_1","name":"开始","type":"start","properties":{}},{"id":"approval_1","name":"工单处理人审批","type":"approval","properties":{"assigneeType":"business_field","fieldPath":"handlerId","businessType":"ticket","assigneeEmptyAction":"assign_to","assigneeEmptyFallbackFieldPath":"submitterId"}},{"id":"end_1","name":"结束","type":"end","properties":{}}]',
       '[{"id":"flow_start_approval","sourceNodeId":"start_1","targetNodeId":"approval_1","sourceAnchor":"right","targetAnchor":"left","flowType":"normal","conditionId":""},{"id":"flow_approval_end","sourceNodeId":"approval_1","targetNodeId":"end_1","sourceAnchor":"right","targetAnchor":"left","flowType":"normal","conditionId":""}]',
       '{}', '1', 'ticket', 'approval', 'manual', 'system', 'system', NULL
WHERE NOT EXISTS (SELECT 1 FROM wf_definition WHERE business_type='ticket' AND business_scene='approval' AND is_delete IS NULL);

INSERT INTO wf_definition (name, code, description, version, category, nodes, flows, global_config, is_active, business_type, business_scene, trigger_event, create_user, update_user, is_delete)
SELECT '变更审批流程', 'CHANGE_APPROVAL', '变更审批流程', 1, 'change',
       '[{"id":"start_1","name":"开始","type":"start","properties":{}},{"id":"approval_1","name":"变更审批人审批","type":"approval","properties":{"assigneeType":"business_field","fieldPath":"approverId","businessType":"change","assigneeEmptyAction":"assign_to","assigneeEmptyFallbackFieldPath":"project.leaderId"}},{"id":"end_1","name":"结束","type":"end","properties":{}}]',
       '[{"id":"flow_start_approval","sourceNodeId":"start_1","targetNodeId":"approval_1","sourceAnchor":"right","targetAnchor":"left","flowType":"normal","conditionId":""},{"id":"flow_approval_end","sourceNodeId":"approval_1","targetNodeId":"end_1","sourceAnchor":"right","targetAnchor":"left","flowType":"normal","conditionId":""}]',
       '{}', '1', 'change', 'approval', 'manual', 'system', 'system', NULL
WHERE NOT EXISTS (SELECT 1 FROM wf_definition WHERE business_type='change' AND business_scene='approval' AND is_delete IS NULL);

INSERT INTO wf_definition (name, code, description, version, category, nodes, flows, global_config, is_active, business_type, business_scene, trigger_event, create_user, update_user, is_delete)
SELECT '客户审批流程', 'CUSTOMER_APPROVAL', '客户审批流程', 1, 'customer',
       '[{"id":"start_1","name":"开始","type":"start","properties":{}},{"id":"approval_1","name":"销售负责人审批","type":"approval","properties":{"assigneeType":"business_field","fieldPath":"salesId","businessType":"customer","assigneeEmptyAction":"error"}},{"id":"end_1","name":"结束","type":"end","properties":{}}]',
       '[{"id":"flow_start_approval","sourceNodeId":"start_1","targetNodeId":"approval_1","sourceAnchor":"right","targetAnchor":"left","flowType":"normal","conditionId":""},{"id":"flow_approval_end","sourceNodeId":"approval_1","targetNodeId":"end_1","sourceAnchor":"right","targetAnchor":"left","flowType":"normal","conditionId":""}]',
       '{}', '1', 'customer', 'approval', 'manual', 'system', 'system', NULL
WHERE NOT EXISTS (SELECT 1 FROM wf_definition WHERE business_type='customer' AND business_scene='approval' AND is_delete IS NULL);
