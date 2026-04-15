SET NAMES utf8mb4;

UPDATE sys_menu SET icon = 'el:Share' WHERE path = 'workflow' AND is_delete IS NULL;
UPDATE sys_menu SET icon = 'el:Setting' WHERE component = 'business/workflow/index' AND is_delete IS NULL;
UPDATE sys_menu SET icon = 'el:Edit' WHERE component = 'business/workflow/designer' AND is_delete IS NULL;
UPDATE sys_menu SET icon = 'el:Tools' WHERE component = 'business/workflow/businessConfig' AND is_delete IS NULL;
UPDATE sys_menu SET icon = 'el:Bell' WHERE component = 'business/workflow/tasks' AND is_delete IS NULL;
UPDATE sys_menu SET icon = 'el:Files' WHERE component = 'business/workflow/instances' AND is_delete IS NULL;

UPDATE sys_menu SET icon = 'el:FolderOpened' WHERE path = 'projectManage' AND is_delete IS NULL;
UPDATE sys_menu SET icon = 'el:List' WHERE path = 'projectInfo' AND is_delete IS NULL;
UPDATE sys_menu SET icon = 'el:Clock' WHERE path = 'sprintManage' AND is_delete IS NULL;
UPDATE sys_menu SET icon = 'el:Flag' WHERE path = 'milestoneManage' AND is_delete IS NULL;
UPDATE sys_menu SET icon = 'el:WarningFilled' WHERE path = 'riskManage' AND is_delete IS NULL;
UPDATE sys_menu SET icon = 'el:Switch' WHERE path = 'changeManage' AND is_delete IS NULL;
UPDATE sys_menu SET icon = 'el:UserFilled' WHERE path = 'projectMemberManage' AND is_delete IS NULL;
UPDATE sys_menu SET icon = 'el:ChatDotRound' WHERE path = 'taskCommentManage' AND is_delete IS NULL;
UPDATE sys_menu SET icon = 'el:Reading' WHERE path = 'userStoryManage' AND is_delete IS NULL;

UPDATE sys_menu SET icon = 'el:Tickets' WHERE path = 'taskManage' AND is_delete IS NULL;
UPDATE sys_menu SET icon = 'el:List' WHERE path = 'taskInfo' AND is_delete IS NULL;
UPDATE sys_menu SET icon = 'el:Bell' WHERE path = 'ticketManage' AND is_delete IS NULL;
UPDATE sys_menu SET icon = 'el:List' WHERE path = 'ticketInfo' AND is_delete IS NULL;
UPDATE sys_menu SET icon = 'el:Document' WHERE path = 'documentManage' AND is_delete IS NULL;
UPDATE sys_menu SET icon = 'el:List' WHERE path = 'documentInfo' AND is_delete IS NULL;

UPDATE sys_menu SET icon = 'el:UserFilled' WHERE path = 'crm' AND is_delete IS NULL;
UPDATE sys_menu SET icon = 'el:User' WHERE path = 'customerManage' AND is_delete IS NULL;
UPDATE sys_menu SET icon = 'el:Phone' WHERE path = 'interactionManage' AND is_delete IS NULL;
UPDATE sys_menu SET icon = 'el:TrendCharts' WHERE path = 'opportunityManage' AND is_delete IS NULL;
UPDATE sys_menu SET icon = 'el:Document' WHERE path = 'contractManage' AND is_delete IS NULL;
