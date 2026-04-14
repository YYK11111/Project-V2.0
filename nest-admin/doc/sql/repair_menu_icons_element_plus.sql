-- Switch visible system/business menu icons to Element Plus icon names.
-- Uses the frontend `el:<IconName>` convention supported by SvgIcon.vue.

UPDATE sys_menu SET icon = 'el:Setting' WHERE path = 'system';
UPDATE sys_menu SET icon = 'el:House' WHERE path = 'index' AND parent_id IS NULL;
UPDATE sys_menu SET icon = 'el:Files' WHERE path = 'content';
UPDATE sys_menu SET icon = 'el:Monitor' WHERE path = 'systemMonitor';
UPDATE sys_menu SET icon = 'el:Share' WHERE path = 'workflow';
UPDATE sys_menu SET icon = 'el:FolderOpened' WHERE path = 'projectManage';
UPDATE sys_menu SET icon = 'el:List' WHERE path = 'taskManage';
UPDATE sys_menu SET icon = 'el:Document' WHERE path = 'ticketManage';
UPDATE sys_menu SET icon = 'el:Reading' WHERE path = 'documentManage';
UPDATE sys_menu SET icon = 'el:UserFilled' WHERE path = 'crm';

UPDATE sys_menu SET icon = 'el:User' WHERE path = 'users';
UPDATE sys_menu SET icon = 'el:CollectionTag' WHERE path = 'roles';
UPDATE sys_menu SET icon = 'el:Menu' WHERE path = 'menus';
UPDATE sys_menu SET icon = 'el:Bell' WHERE path = 'notices';
UPDATE sys_menu SET icon = 'el:Operation' WHERE path = 'configs';
UPDATE sys_menu SET icon = 'el:Reading' WHERE path = 'articleManage';
UPDATE sys_menu SET icon = 'el:DataAnalysis' WHERE path = 'loginLog';
UPDATE sys_menu SET icon = 'el:UserFilled' WHERE path = 'onlineUser';
UPDATE sys_menu SET icon = 'el:Monitor' WHERE path = 'osInfo';
UPDATE sys_menu SET icon = 'el:House' WHERE path = 'home';

UPDATE sys_menu SET icon = 'el:InfoFilled' WHERE path = 'index' AND parent_id = 26;
UPDATE sys_menu SET icon = 'el:Clock' WHERE path = 'sprintManage';
UPDATE sys_menu SET icon = 'el:Flag' WHERE path = 'milestoneManage';
UPDATE sys_menu SET icon = 'el:WarningFilled' WHERE path = 'riskManage';
UPDATE sys_menu SET icon = 'el:Switch' WHERE path = 'changeManage';

UPDATE sys_menu SET icon = 'el:User' WHERE path = 'customer';
UPDATE sys_menu SET icon = 'el:Phone' WHERE path = 'interaction';
UPDATE sys_menu SET icon = 'el:TrendCharts' WHERE path = 'opportunity';
UPDATE sys_menu SET icon = 'el:Tickets' WHERE path = 'contract';

UPDATE sys_menu SET icon = 'el:Share' WHERE path = 'index' AND parent_id = 238;
UPDATE sys_menu SET icon = 'el:Finished' WHERE path = 'tasks' AND parent_id = 238;
UPDATE sys_menu SET icon = 'el:Files' WHERE path = 'instances' AND parent_id = 238;
UPDATE sys_menu SET icon = 'el:Tools' WHERE path = 'businessConfig' AND parent_id = 238;

SELECT id, name, path, parent_id, icon
FROM sys_menu
WHERE is_delete IS NULL AND is_active = '1' AND type IN ('catalog', 'menu') AND is_hidden = '0'
ORDER BY parent_id, CAST(`order` AS UNSIGNED), id;
