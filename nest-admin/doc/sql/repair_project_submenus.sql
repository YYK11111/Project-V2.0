-- Move project-related business menus under Project Management while keeping direct list pages.

UPDATE sys_menu
SET parent_id = (
      SELECT id FROM (
        SELECT id FROM sys_menu WHERE path = 'projectManage' ORDER BY id LIMIT 1
      ) AS project_root
    ),
    component = 'business/sprintManage/index'
WHERE path = 'sprintManage';

UPDATE sys_menu
SET parent_id = (
      SELECT id FROM (
        SELECT id FROM sys_menu WHERE path = 'projectManage' ORDER BY id LIMIT 1
      ) AS project_root
    ),
    component = 'business/milestoneManage/index'
WHERE path = 'milestoneManage';

UPDATE sys_menu
SET parent_id = (
      SELECT id FROM (
        SELECT id FROM sys_menu WHERE path = 'projectManage' ORDER BY id LIMIT 1
      ) AS project_root
    ),
    component = 'business/riskManage/index'
WHERE path = 'riskManage';

UPDATE sys_menu
SET parent_id = (
      SELECT id FROM (
        SELECT id FROM sys_menu WHERE path = 'projectManage' ORDER BY id LIMIT 1
      ) AS project_root
    ),
    component = 'business/changeManage/index'
WHERE path = 'changeManage';

-- Hide the nested list menu entries so second-level project submenus open their own list pages directly.
UPDATE sys_menu
SET is_hidden = '1'
WHERE parent_id = (SELECT id FROM (SELECT id FROM sys_menu WHERE path = 'sprintManage' ORDER BY id LIMIT 1) AS sprint_root)
  AND path = 'index';

UPDATE sys_menu
SET is_hidden = '1'
WHERE parent_id = (SELECT id FROM (SELECT id FROM sys_menu WHERE path = 'milestoneManage' ORDER BY id LIMIT 1) AS milestone_root)
  AND path = 'index';

UPDATE sys_menu
SET is_hidden = '1'
WHERE parent_id = (SELECT id FROM (SELECT id FROM sys_menu WHERE path = 'riskManage' ORDER BY id LIMIT 1) AS risk_root)
  AND path = 'index';

UPDATE sys_menu
SET is_hidden = '1'
WHERE parent_id = (SELECT id FROM (SELECT id FROM sys_menu WHERE path = 'changeManage' ORDER BY id LIMIT 1) AS change_root)
  AND path = 'index';

-- Verification
SELECT id, name, parent_id, path, component, type, is_hidden
FROM sys_menu
WHERE path IN ('projectManage', 'sprintManage', 'milestoneManage', 'riskManage', 'changeManage', 'index')
   OR parent_id IN (
     SELECT id FROM sys_menu WHERE path IN ('sprintManage', 'milestoneManage', 'riskManage', 'changeManage')
   )
ORDER BY parent_id, id;
