-- 修复客户销售负责人列映射和历史数据

UPDATE crm_customer
SET sales_id = salesId
WHERE sales_id IS NULL
  AND salesId IS NOT NULL
  AND salesId <> '';

UPDATE crm_customer
SET code = CONCAT('CUS-', DATE_FORMAT(create_time, '%Y%m%d'), '-', LPAD(id, 4, '0'))
WHERE (code IS NULL OR code = '');
