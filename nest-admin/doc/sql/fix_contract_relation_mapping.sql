-- 修复合同客户/合同负责人外键列映射和历史数据

UPDATE crm_contract
SET customer_id = CAST(customerId AS UNSIGNED)
WHERE customer_id IS NULL
  AND customerId IS NOT NULL
  AND customerId <> '';

UPDATE crm_contract
SET owner_id = CAST(ownerId AS UNSIGNED)
WHERE owner_id IS NULL
  AND ownerId IS NOT NULL
  AND ownerId <> '';
