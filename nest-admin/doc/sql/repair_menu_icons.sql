-- Align menu icons with frontend available SVG icon names.

UPDATE sys_menu SET icon = 'nested' WHERE path = 'projectManage';
UPDATE sys_menu SET icon = 'tool' WHERE path = 'taskManage';
UPDATE sys_menu SET icon = 'bug' WHERE path = 'ticketManage';
UPDATE sys_menu SET icon = 'article' WHERE path = 'documentManage';
UPDATE sys_menu SET icon = 'component' WHERE path = 'workflow';
UPDATE sys_menu SET icon = 'date' WHERE path = 'milestoneManage';
UPDATE sys_menu SET icon = 'problem' WHERE path = 'riskManage';
UPDATE sys_menu SET icon = 'time' WHERE path = 'sprintManage';
UPDATE sys_menu SET icon = 'form' WHERE path = 'changeManage';

SELECT id, name, path, icon
FROM sys_menu
WHERE path IN (
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
