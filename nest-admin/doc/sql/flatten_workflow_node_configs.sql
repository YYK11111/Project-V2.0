-- 将工作流节点的旧版嵌套配置扁平化为单层 properties
-- 目标：彻底移除 approverConfig / notificationConfig / ccConfig

UPDATE wf_definition
SET nodes = JSON_SET(
  JSON_REMOVE(nodes, '$[1].properties.approverConfig'),
  '$[1].properties.assigneeType', JSON_UNQUOTE(JSON_EXTRACT(nodes, '$[1].properties.approverConfig.assigneeType')),
  '$[1].properties.assigneeValue', JSON_EXTRACT(nodes, '$[1].properties.approverConfig.assigneeValue'),
  '$[1].properties.departmentId', JSON_UNQUOTE(JSON_EXTRACT(nodes, '$[1].properties.approverConfig.departmentId')),
  '$[1].properties.departmentMode', JSON_UNQUOTE(JSON_EXTRACT(nodes, '$[1].properties.approverConfig.departmentMode')),
  '$[1].properties.fieldPath', JSON_UNQUOTE(JSON_EXTRACT(nodes, '$[1].properties.approverConfig.fieldPath')),
  '$[1].properties.businessType', JSON_UNQUOTE(JSON_EXTRACT(nodes, '$[1].properties.approverConfig.businessType')),
  '$[1].properties.assigneeEmptyAction', JSON_UNQUOTE(JSON_EXTRACT(nodes, '$[1].properties.approverConfig.assigneeEmptyAction')),
  '$[1].properties.assigneeEmptyFallbackUserId', JSON_UNQUOTE(JSON_EXTRACT(nodes, '$[1].properties.approverConfig.assigneeEmptyFallbackUserId')),
  '$[1].properties.assigneeEmptyFallbackFieldPath', JSON_UNQUOTE(JSON_EXTRACT(nodes, '$[1].properties.approverConfig.assigneeEmptyFallbackFieldPath')),
  '$[1].properties.multiInstanceType', JSON_UNQUOTE(JSON_EXTRACT(nodes, '$[1].properties.approverConfig.multiInstanceType'))
)
WHERE is_delete IS NULL
  AND JSON_CONTAINS_PATH(nodes, 'one', '$[1].properties.approverConfig');

UPDATE wf_definition
SET nodes = JSON_SET(
  JSON_REMOVE(nodes, '$[1].properties.notificationConfig'),
  '$[1].properties.assigneeType', JSON_UNQUOTE(JSON_EXTRACT(nodes, '$[1].properties.notificationConfig.assigneeType')),
  '$[1].properties.assigneeValue', JSON_EXTRACT(nodes, '$[1].properties.notificationConfig.assigneeValue'),
  '$[1].properties.departmentId', JSON_UNQUOTE(JSON_EXTRACT(nodes, '$[1].properties.notificationConfig.departmentId')),
  '$[1].properties.departmentMode', JSON_UNQUOTE(JSON_EXTRACT(nodes, '$[1].properties.notificationConfig.departmentMode')),
  '$[1].properties.fieldPath', JSON_UNQUOTE(JSON_EXTRACT(nodes, '$[1].properties.notificationConfig.fieldPath')),
  '$[1].properties.businessType', JSON_UNQUOTE(JSON_EXTRACT(nodes, '$[1].properties.notificationConfig.businessType')),
  '$[1].properties.assigneeEmptyAction', JSON_UNQUOTE(JSON_EXTRACT(nodes, '$[1].properties.notificationConfig.assigneeEmptyAction')),
  '$[1].properties.assigneeEmptyFallbackUserId', JSON_UNQUOTE(JSON_EXTRACT(nodes, '$[1].properties.notificationConfig.assigneeEmptyFallbackUserId')),
  '$[1].properties.assigneeEmptyFallbackFieldPath', JSON_UNQUOTE(JSON_EXTRACT(nodes, '$[1].properties.notificationConfig.assigneeEmptyFallbackFieldPath'))
)
WHERE is_delete IS NULL
  AND JSON_CONTAINS_PATH(nodes, 'one', '$[1].properties.notificationConfig');

UPDATE wf_definition
SET nodes = JSON_SET(
  JSON_REMOVE(nodes, '$[1].properties.ccConfig'),
  '$[1].properties.assigneeType', JSON_UNQUOTE(JSON_EXTRACT(nodes, '$[1].properties.ccConfig.assigneeType')),
  '$[1].properties.assigneeValue', JSON_EXTRACT(nodes, '$[1].properties.ccConfig.assigneeValue'),
  '$[1].properties.departmentId', JSON_UNQUOTE(JSON_EXTRACT(nodes, '$[1].properties.ccConfig.departmentId')),
  '$[1].properties.departmentMode', JSON_UNQUOTE(JSON_EXTRACT(nodes, '$[1].properties.ccConfig.departmentMode')),
  '$[1].properties.fieldPath', JSON_UNQUOTE(JSON_EXTRACT(nodes, '$[1].properties.ccConfig.fieldPath')),
  '$[1].properties.businessType', JSON_UNQUOTE(JSON_EXTRACT(nodes, '$[1].properties.ccConfig.businessType')),
  '$[1].properties.assigneeEmptyAction', JSON_UNQUOTE(JSON_EXTRACT(nodes, '$[1].properties.ccConfig.assigneeEmptyAction')),
  '$[1].properties.assigneeEmptyFallbackUserId', JSON_UNQUOTE(JSON_EXTRACT(nodes, '$[1].properties.ccConfig.assigneeEmptyFallbackUserId')),
  '$[1].properties.assigneeEmptyFallbackFieldPath', JSON_UNQUOTE(JSON_EXTRACT(nodes, '$[1].properties.ccConfig.assigneeEmptyFallbackFieldPath')),
  '$[1].properties.multiInstanceType', JSON_UNQUOTE(JSON_EXTRACT(nodes, '$[1].properties.ccConfig.multiInstanceType'))
)
WHERE is_delete IS NULL
  AND JSON_CONTAINS_PATH(nodes, 'one', '$[1].properties.ccConfig');
