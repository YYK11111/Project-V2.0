SET NAMES utf8mb4;

UPDATE sys_menu SET permissionKey = 'system'
WHERE id = 5 AND is_delete IS NULL AND (permissionKey IS NULL OR permissionKey = '');
UPDATE sys_menu SET permissionKey = 'system/users/index'
WHERE id = 6 AND is_delete IS NULL AND (permissionKey IS NULL OR permissionKey = '');
UPDATE sys_menu SET permissionKey = 'system/roles/index'
WHERE id = 7 AND is_delete IS NULL AND (permissionKey IS NULL OR permissionKey = '');
UPDATE sys_menu SET permissionKey = 'system/menus/index'
WHERE id = 8 AND is_delete IS NULL AND (permissionKey IS NULL OR permissionKey = '');
UPDATE sys_menu SET permissionKey = 'system/notices/index'
WHERE id = 10 AND is_delete IS NULL AND (permissionKey IS NULL OR permissionKey = '');
UPDATE sys_menu SET permissionKey = 'system/configs/index'
WHERE id = 17 AND is_delete IS NULL AND (permissionKey IS NULL OR permissionKey = '');

UPDATE sys_menu SET permissionKey = 'systemMonitor'
WHERE id = 11 AND is_delete IS NULL AND (permissionKey IS NULL OR permissionKey = '');
UPDATE sys_menu SET permissionKey = 'systemMonitor/loginLog/index'
WHERE id = 12 AND is_delete IS NULL AND (permissionKey IS NULL OR permissionKey = '');
UPDATE sys_menu SET permissionKey = 'systemMonitor/onlineUser/index'
WHERE id = 14 AND is_delete IS NULL AND (permissionKey IS NULL OR permissionKey = '');
UPDATE sys_menu SET permissionKey = 'systemMonitor/osInfo/index'
WHERE id = 15 AND is_delete IS NULL AND (permissionKey IS NULL OR permissionKey = '');

UPDATE sys_menu SET permissionKey = 'content'
WHERE id = 16 AND is_delete IS NULL AND (permissionKey IS NULL OR permissionKey = '');
UPDATE sys_menu SET permissionKey = 'content/articleManage/home'
WHERE id = 206 AND is_delete IS NULL AND (permissionKey IS NULL OR permissionKey = '');
UPDATE sys_menu SET permissionKey = 'content/articleManage/search'
WHERE id = 207 AND is_delete IS NULL AND (permissionKey IS NULL OR permissionKey = '');
UPDATE sys_menu SET permissionKey = 'content/articleManage/manage'
WHERE id = 208 AND is_delete IS NULL AND (permissionKey IS NULL OR permissionKey = '');
UPDATE sys_menu SET permissionKey = 'content/articleManage/myBorrows'
WHERE id = 209 AND is_delete IS NULL AND (permissionKey IS NULL OR permissionKey = '');
UPDATE sys_menu SET permissionKey = 'content/articleManage/aiRetrieveDebug'
WHERE id = 211 AND is_delete IS NULL AND (permissionKey IS NULL OR permissionKey = '');
UPDATE sys_menu SET permissionKey = 'content/ai-operate'
WHERE id = 212 AND is_delete IS NULL AND (permissionKey IS NULL OR permissionKey = '');

UPDATE sys_menu SET permissionKey = 'index/index'
WHERE id = 19 AND is_delete IS NULL AND (permissionKey IS NULL OR permissionKey = '');
UPDATE sys_menu SET permissionKey = 'system/messageCenter/index'
WHERE id = 200 AND is_delete IS NULL AND (permissionKey IS NULL OR permissionKey = '');

UPDATE sys_menu SET permissionKey = 'workflow'
WHERE id = 25 AND is_delete IS NULL AND (permissionKey IS NULL OR permissionKey = '');
UPDATE sys_menu SET permissionKey = 'business/workflow/index'
WHERE id = 26 AND is_delete IS NULL AND (permissionKey IS NULL OR permissionKey = '');
UPDATE sys_menu SET permissionKey = 'business/workflow/designer'
WHERE id = 27 AND is_delete IS NULL AND (permissionKey IS NULL OR permissionKey = '');
UPDATE sys_menu SET permissionKey = 'business/workflow/businessConfig'
WHERE id = 28 AND is_delete IS NULL AND (permissionKey IS NULL OR permissionKey = '');
UPDATE sys_menu SET permissionKey = 'business/workflow/tasks'
WHERE id = 29 AND is_delete IS NULL AND (permissionKey IS NULL OR permissionKey = '');
UPDATE sys_menu SET permissionKey = 'business/workflow/instances'
WHERE id = 30 AND is_delete IS NULL AND (permissionKey IS NULL OR permissionKey = '');

UPDATE sys_menu SET permissionKey = 'business/projectManage'
WHERE id = 31 AND is_delete IS NULL AND (permissionKey IS NULL OR permissionKey = '');
UPDATE sys_menu SET permissionKey = 'business/sprintManage/index'
WHERE id = 35 AND is_delete IS NULL AND (permissionKey IS NULL OR permissionKey = '');
UPDATE sys_menu SET permissionKey = 'business/milestoneManage/index'
WHERE id = 36 AND is_delete IS NULL AND (permissionKey IS NULL OR permissionKey = '');
UPDATE sys_menu SET permissionKey = 'business/changeManage/index'
WHERE id = 38 AND is_delete IS NULL AND (permissionKey IS NULL OR permissionKey = '');
UPDATE sys_menu SET permissionKey = 'business/projectMemberManage/index'
WHERE id = 39 AND is_delete IS NULL AND (permissionKey IS NULL OR permissionKey = '');
UPDATE sys_menu SET permissionKey = 'business/userStoryManage/index'
WHERE id = 41 AND is_delete IS NULL AND (permissionKey IS NULL OR permissionKey = '');
UPDATE sys_menu SET permissionKey = 'business/projectManage/form'
WHERE id = 47 AND is_delete IS NULL AND (permissionKey IS NULL OR permissionKey = '');
UPDATE sys_menu SET permissionKey = 'business/projectManage/detail'
WHERE id = 48 AND is_delete IS NULL AND (permissionKey IS NULL OR permissionKey = '');
UPDATE sys_menu SET permissionKey = 'business/projectManage/index'
WHERE id = 62 AND is_delete IS NULL AND (permissionKey IS NULL OR permissionKey = '');
UPDATE sys_menu SET permissionKey = 'business/projects/dashboard'
WHERE id = 204 AND is_delete IS NULL AND (permissionKey IS NULL OR permissionKey = '');

UPDATE sys_menu SET permissionKey = 'business/taskManage'
WHERE id = 32 AND is_delete IS NULL AND (permissionKey IS NULL OR permissionKey = '');
UPDATE sys_menu SET permissionKey = 'business/taskCommentManage/index'
WHERE id = 40 AND is_delete IS NULL AND (permissionKey IS NULL OR permissionKey = '');
UPDATE sys_menu SET permissionKey = 'business/taskManage/form'
WHERE id = 49 AND is_delete IS NULL AND (permissionKey IS NULL OR permissionKey = '');
UPDATE sys_menu SET permissionKey = 'business/taskManage/index'
WHERE id = 63 AND is_delete IS NULL AND (permissionKey IS NULL OR permissionKey = '');
UPDATE sys_menu SET permissionKey = 'business/taskReportManage/index'
WHERE id = 198 AND is_delete IS NULL AND (permissionKey IS NULL OR permissionKey = '');

UPDATE sys_menu SET permissionKey = 'business/ticketManage'
WHERE id = 33 AND is_delete IS NULL AND (permissionKey IS NULL OR permissionKey = '');
UPDATE sys_menu SET permissionKey = 'business/ticketManage/form'
WHERE id = 50 AND is_delete IS NULL AND (permissionKey IS NULL OR permissionKey = '');
UPDATE sys_menu SET permissionKey = 'business/ticketManage/index'
WHERE id = 64 AND is_delete IS NULL AND (permissionKey IS NULL OR permissionKey = '');

UPDATE sys_menu SET permissionKey = 'business/sprintManage/form'
WHERE id = 52 AND is_delete IS NULL AND (permissionKey IS NULL OR permissionKey = '');
UPDATE sys_menu SET permissionKey = 'business/sprintManage/detail'
WHERE id = 53 AND is_delete IS NULL AND (permissionKey IS NULL OR permissionKey = '');
UPDATE sys_menu SET permissionKey = 'business/milestoneManage/form'
WHERE id = 54 AND is_delete IS NULL AND (permissionKey IS NULL OR permissionKey = '');
UPDATE sys_menu SET permissionKey = 'business/riskManage/form'
WHERE id = 55 AND is_delete IS NULL AND (permissionKey IS NULL OR permissionKey = '');
UPDATE sys_menu SET permissionKey = 'business/changeManage/form'
WHERE id = 56 AND is_delete IS NULL AND (permissionKey IS NULL OR permissionKey = '');
UPDATE sys_menu SET permissionKey = 'business/userStoryManage/form'
WHERE id = 57 AND is_delete IS NULL AND (permissionKey IS NULL OR permissionKey = '');
UPDATE sys_menu SET permissionKey = 'business/documentManage/index'
WHERE id = 34 AND is_delete IS NULL AND (permissionKey IS NULL OR permissionKey = '');

UPDATE sys_menu SET permissionKey = 'business/crm'
WHERE id = 42 AND is_delete IS NULL AND (permissionKey IS NULL OR permissionKey = '');
UPDATE sys_menu SET permissionKey = 'business/crm/customerManage/index'
WHERE id = 43 AND is_delete IS NULL AND (permissionKey IS NULL OR permissionKey = '');
UPDATE sys_menu SET permissionKey = 'business/crm/interactionManage/index'
WHERE id = 44 AND is_delete IS NULL AND (permissionKey IS NULL OR permissionKey = '');
UPDATE sys_menu SET permissionKey = 'business/crm/opportunityManage/index'
WHERE id = 45 AND is_delete IS NULL AND (permissionKey IS NULL OR permissionKey = '');
UPDATE sys_menu SET permissionKey = 'business/crm/contractManage/index'
WHERE id = 46 AND is_delete IS NULL AND (permissionKey IS NULL OR permissionKey = '');
UPDATE sys_menu SET permissionKey = 'business/crm/customerManage/form'
WHERE id = 58 AND is_delete IS NULL AND (permissionKey IS NULL OR permissionKey = '');
UPDATE sys_menu SET permissionKey = 'business/crm/interactionManage/form'
WHERE id = 59 AND is_delete IS NULL AND (permissionKey IS NULL OR permissionKey = '');
UPDATE sys_menu SET permissionKey = 'business/crm/opportunityManage/form'
WHERE id = 60 AND is_delete IS NULL AND (permissionKey IS NULL OR permissionKey = '');
UPDATE sys_menu SET permissionKey = 'business/crm/contractManage/form'
WHERE id = 61 AND is_delete IS NULL AND (permissionKey IS NULL OR permissionKey = '');

SELECT id, name, path, component, type, permissionKey
FROM sys_menu
WHERE is_delete IS NULL
  AND type IN ('catalog', 'menu')
  AND (permissionKey IS NULL OR permissionKey = '')
ORDER BY parent_id, id;
