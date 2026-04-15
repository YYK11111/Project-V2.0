SET NAMES utf8mb4;

SET @project_member_menu_id = (SELECT id FROM sys_menu WHERE path = 'projectMemberManage' AND is_delete IS NULL ORDER BY id LIMIT 1);
SET @task_comment_menu_id = (SELECT id FROM sys_menu WHERE path = 'taskCommentManage' AND is_delete IS NULL ORDER BY id LIMIT 1);
SET @admin_role_id = (SELECT id FROM sys_role WHERE permissionKey = 'admin' ORDER BY id LIMIT 1);

INSERT INTO sys_menu (name, `desc`, parent_id, `order`, path, component, type, icon, is_hidden, is_active, create_user, update_user, permissionKey)
SELECT '项目成员列表', '项目成员列表权限', @project_member_menu_id, '501', 'project-members-list', '', 'button', '', '1', '1', 'system', 'system', 'business/projectMembers/list'
WHERE @project_member_menu_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM sys_menu WHERE permissionKey = 'business/projectMembers/list' AND is_delete IS NULL);

INSERT INTO sys_menu (name, `desc`, parent_id, `order`, path, component, type, icon, is_hidden, is_active, create_user, update_user, permissionKey)
SELECT '新增项目成员', '新增项目成员权限', @project_member_menu_id, '502', 'project-members-add', '', 'button', '', '1', '1', 'system', 'system', 'business/projectMembers/add'
WHERE @project_member_menu_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM sys_menu WHERE permissionKey = 'business/projectMembers/add' AND is_delete IS NULL);

INSERT INTO sys_menu (name, `desc`, parent_id, `order`, path, component, type, icon, is_hidden, is_active, create_user, update_user, permissionKey)
SELECT '修改项目成员', '修改项目成员权限', @project_member_menu_id, '503', 'project-members-update', '', 'button', '', '1', '1', 'system', 'system', 'business/projectMembers/update'
WHERE @project_member_menu_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM sys_menu WHERE permissionKey = 'business/projectMembers/update' AND is_delete IS NULL);

INSERT INTO sys_menu (name, `desc`, parent_id, `order`, path, component, type, icon, is_hidden, is_active, create_user, update_user, permissionKey)
SELECT '删除项目成员', '删除项目成员权限', @project_member_menu_id, '504', 'project-members-delete', '', 'button', '', '1', '1', 'system', 'system', 'business/projectMembers/delete'
WHERE @project_member_menu_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM sys_menu WHERE permissionKey = 'business/projectMembers/delete' AND is_delete IS NULL);

INSERT INTO sys_menu (name, `desc`, parent_id, `order`, path, component, type, icon, is_hidden, is_active, create_user, update_user, permissionKey)
SELECT '任务评论列表', '任务评论列表权限', @task_comment_menu_id, '521', 'task-comments-list', '', 'button', '', '1', '1', 'system', 'system', 'business/taskComments/list'
WHERE @task_comment_menu_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM sys_menu WHERE permissionKey = 'business/taskComments/list' AND is_delete IS NULL);

INSERT INTO sys_menu (name, `desc`, parent_id, `order`, path, component, type, icon, is_hidden, is_active, create_user, update_user, permissionKey)
SELECT '新增任务评论', '新增任务评论权限', @task_comment_menu_id, '522', 'task-comments-add', '', 'button', '', '1', '1', 'system', 'system', 'business/taskComments/add'
WHERE @task_comment_menu_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM sys_menu WHERE permissionKey = 'business/taskComments/add' AND is_delete IS NULL);

INSERT INTO sys_menu (name, `desc`, parent_id, `order`, path, component, type, icon, is_hidden, is_active, create_user, update_user, permissionKey)
SELECT '修改任务评论', '修改任务评论权限', @task_comment_menu_id, '523', 'task-comments-update', '', 'button', '', '1', '1', 'system', 'system', 'business/taskComments/update'
WHERE @task_comment_menu_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM sys_menu WHERE permissionKey = 'business/taskComments/update' AND is_delete IS NULL);

INSERT INTO sys_menu (name, `desc`, parent_id, `order`, path, component, type, icon, is_hidden, is_active, create_user, update_user, permissionKey)
SELECT '删除任务评论', '删除任务评论权限', @task_comment_menu_id, '524', 'task-comments-delete', '', 'button', '', '1', '1', 'system', 'system', 'business/taskComments/delete'
WHERE @task_comment_menu_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM sys_menu WHERE permissionKey = 'business/taskComments/delete' AND is_delete IS NULL);

INSERT IGNORE INTO sys_role_menu (role_id, menu_id)
SELECT @admin_role_id, id
FROM sys_menu
WHERE @admin_role_id IS NOT NULL
  AND is_delete IS NULL
  AND permissionKey IN (
    'business/projectMembers/list',
    'business/projectMembers/add',
    'business/projectMembers/update',
    'business/projectMembers/delete',
    'business/taskComments/list',
    'business/taskComments/add',
    'business/taskComments/update',
    'business/taskComments/delete'
  );
