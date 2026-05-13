-- 修复历史模板里程碑缺失负责人/创建人

UPDATE milestone m
JOIN project p ON p.id = m.project_id
SET m.owner_id = p.leader_id
WHERE m.owner_id IS NULL
  AND p.leader_id IS NOT NULL;

UPDATE milestone m
JOIN project p ON p.id = m.project_id
SET m.creator_id = p.leader_id
WHERE m.creator_id IS NULL
  AND p.leader_id IS NOT NULL;
