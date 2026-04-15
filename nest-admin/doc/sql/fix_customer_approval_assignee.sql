-- 将客户审批流程的审批人字段从 salesId 调整为 sales.id

UPDATE wf_definition
SET nodes = JSON_REPLACE(nodes, '$[1].properties.approverConfig.fieldPath', 'sales.id')
WHERE code = 'CUSTOMER_APPROVAL'
  AND is_delete IS NULL;
