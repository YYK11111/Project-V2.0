-- 修复互动记录客户外键列映射和历史数据

UPDATE crm_interaction
SET customer_id = CAST(customerId AS UNSIGNED)
WHERE customer_id IS NULL
  AND customerId IS NOT NULL
  AND customerId <> '';
