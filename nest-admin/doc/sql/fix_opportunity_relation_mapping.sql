-- 修复销售机会客户/销售负责人外键列映射和历史数据

UPDATE crm_opportunity
SET customer_id = CAST(customerId AS UNSIGNED)
WHERE customer_id IS NULL
  AND customerId IS NOT NULL
  AND customerId <> '';

UPDATE crm_opportunity
SET sales_id = CAST(salesId AS UNSIGNED)
WHERE sales_id IS NULL
  AND salesId IS NOT NULL
  AND salesId <> '';
