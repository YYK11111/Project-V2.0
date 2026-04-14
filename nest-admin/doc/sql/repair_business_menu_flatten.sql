-- Flatten business menus to top-level sidebar entries.
-- Keep the legacy `business` catalog record for compatibility, but detach its children.

UPDATE sys_menu
SET parent_id = NULL
WHERE parent_id = (
  SELECT id FROM (
    SELECT id FROM sys_menu WHERE path = 'business' AND type = 'catalog' ORDER BY id LIMIT 1
  ) AS business_root
)
AND path IN (
  'projectManage',
  'taskManage',
  'ticketManage',
  'documentManage',
  'workflow',
  'milestoneManage',
  'riskManage',
  'sprintManage',
  'changeManage'
);

-- Verification
SELECT id, name, parent_id, path, type, is_hidden
FROM sys_menu
WHERE path = 'business'
   OR path IN (
     'projectManage',
     'taskManage',
     'ticketManage',
     'documentManage',
     'workflow',
     'milestoneManage',
     'riskManage',
     'sprintManage',
     'changeManage'
   )
ORDER BY id;
