-- 清理 workflow 历史兼容结构（开发阶段，无需兼容旧数据）
-- 注意：当前 MySQL 版本不支持在 JSON_REMOVE 路径中使用 ** 递归匹配。
-- 这份脚本保留为说明用途，实际建议通过“重新保存流程定义”让设计器按新结构回写。

-- 1. 抄送节点仅保留 ccConfig，删除 ccType/ccValue/ccExpr/ccRoleId
UPDATE wf_definition
SET nodes = JSON_REMOVE(
  JSON_REMOVE(
    JSON_REMOVE(
      JSON_REMOVE(nodes, '$**.properties.ccType'),
      '$**.properties.ccValue'
    ),
    '$**.properties.ccExpr'
  ),
  '$**.properties.ccRoleId'
)
WHERE is_delete IS NULL;

-- 2. flow 缺少 flowType 时，统一补 normal；缺少 conditionId 时补空字符串
-- 这里不再兼容 isDefault/condition 旧模型，要求现有数据已重新保存或已是新结构

-- 2.1 删除旧 flow 字段 isDefault / condition
UPDATE wf_definition
SET flows = JSON_REMOVE(
  JSON_REMOVE(flows, '$**.isDefault'),
  '$**.condition'
)
WHERE is_delete IS NULL;

-- 2.2 删除旧条件节点字段 defaultFlow
UPDATE wf_definition
SET nodes = JSON_REMOVE(nodes, '$**.properties.defaultFlow')
WHERE is_delete IS NULL;
