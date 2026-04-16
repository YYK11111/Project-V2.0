SET NAMES utf8mb4;

SET @content_center_id := (
  SELECT id
  FROM sys_menu
  WHERE component = 'content/articleManage/index' AND is_delete IS NULL
  ORDER BY id
  LIMIT 1
);

UPDATE sys_menu
SET permissionKey = 'business/articles/list',
    path = 'content/articleManage/home',
    is_delete = NULL
WHERE component = 'content/articleManage/index'
  AND is_delete IS NULL;

UPDATE sys_menu
SET permissionKey = 'business/articles/list',
    is_delete = '1'
WHERE path = 'content'
  AND component = ''
  AND type = 'catalog'
  AND is_delete IS NULL;

UPDATE sys_menu
SET permissionKey = 'business/articles/list'
WHERE path = 'index'
  AND component = 'content/articleManage/index'
  AND is_delete IS NULL;

UPDATE sys_menu
SET permissionKey = 'business/articles/add'
WHERE component = 'content/articleManage/aev'
  AND is_delete IS NULL;

INSERT INTO sys_menu (name, path, component, type, parent_id, `order`, icon, is_hidden, is_active, is_delete, permissionKey, create_time, create_user, update_user)
SELECT '我的借阅', 'myBorrows', 'content/articleManage/myBorrows.vue', 'menu', @content_center_id, '20', 'Tickets', '0', '1', NULL, 'business/articleBorrows/my', NOW(), 'system', 'system'
WHERE @content_center_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM sys_menu WHERE path = 'myBorrows' AND parent_id = @content_center_id AND is_delete IS NULL);

INSERT INTO sys_menu (name, path, component, type, parent_id, `order`, icon, is_hidden, is_active, is_delete, permissionKey, create_time, create_user, update_user)
SELECT '借阅审批', 'borrowApproval', 'content/articleManage/borrowApproval.vue', 'menu', @content_center_id, '21', 'Checked', '0', '1', NULL, 'business/articleBorrows/pending', NOW(), 'system', 'system'
WHERE @content_center_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM sys_menu WHERE path = 'borrowApproval' AND parent_id = @content_center_id AND is_delete IS NULL);

INSERT INTO sys_menu (name, path, component, type, parent_id, `order`, icon, is_hidden, is_active, is_delete, permissionKey, create_time, create_user, update_user)
SELECT '查看全部知识', 'view-all', '', 'button', @content_center_id, '30', '', '1', '1', NULL, 'content/articles/viewAll', NOW(), 'system', 'system'
WHERE @content_center_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM sys_menu WHERE permissionKey = 'content/articles/viewAll' AND is_delete IS NULL);

INSERT INTO sys_menu (name, path, component, type, parent_id, `order`, icon, is_hidden, is_active, is_delete, permissionKey, create_time, create_user, update_user)
SELECT '标签列表', 'tag-list', '', 'button', @content_center_id, '31', '', '1', '1', NULL, 'business/articleTags/list', NOW(), 'system', 'system'
WHERE @content_center_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM sys_menu WHERE permissionKey = 'business/articleTags/list' AND is_delete IS NULL);

INSERT INTO sys_menu (name, path, component, type, parent_id, `order`, icon, is_hidden, is_active, is_delete, permissionKey, create_time, create_user, update_user)
SELECT '新增标签', 'tag-add', '', 'button', @content_center_id, '32', '', '1', '1', NULL, 'business/articleTags/add', NOW(), 'system', 'system'
WHERE @content_center_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM sys_menu WHERE permissionKey = 'business/articleTags/add' AND is_delete IS NULL);

INSERT INTO sys_menu (name, path, component, type, parent_id, `order`, icon, is_hidden, is_active, is_delete, permissionKey, create_time, create_user, update_user)
SELECT '修改标签', 'tag-update', '', 'button', @content_center_id, '33', '', '1', '1', NULL, 'business/articleTags/update', NOW(), 'system', 'system'
WHERE @content_center_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM sys_menu WHERE permissionKey = 'business/articleTags/update' AND is_delete IS NULL);

INSERT INTO sys_menu (name, path, component, type, parent_id, `order`, icon, is_hidden, is_active, is_delete, permissionKey, create_time, create_user, update_user)
SELECT '删除标签', 'tag-delete', '', 'button', @content_center_id, '34', '', '1', '1', NULL, 'business/articleTags/delete', NOW(), 'system', 'system'
WHERE @content_center_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM sys_menu WHERE permissionKey = 'business/articleTags/delete' AND is_delete IS NULL);

INSERT INTO sys_menu (name, path, component, type, parent_id, `order`, icon, is_hidden, is_active, is_delete, permissionKey, create_time, create_user, update_user)
SELECT '申请借阅', 'borrow-apply', '', 'button', @content_center_id, '35', '', '1', '1', NULL, 'business/articleBorrows/apply', NOW(), 'system', 'system'
WHERE @content_center_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM sys_menu WHERE permissionKey = 'business/articleBorrows/apply' AND is_delete IS NULL);

INSERT INTO sys_menu (name, path, component, type, parent_id, `order`, icon, is_hidden, is_active, is_delete, permissionKey, create_time, create_user, update_user)
SELECT '借阅通过', 'borrow-approve', '', 'button', @content_center_id, '36', '', '1', '1', NULL, 'business/articleBorrows/approve', NOW(), 'system', 'system'
WHERE @content_center_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM sys_menu WHERE permissionKey = 'business/articleBorrows/approve' AND is_delete IS NULL);

INSERT INTO sys_menu (name, path, component, type, parent_id, `order`, icon, is_hidden, is_active, is_delete, permissionKey, create_time, create_user, update_user)
SELECT '借阅拒绝', 'borrow-reject', '', 'button', @content_center_id, '37', '', '1', '1', NULL, 'business/articleBorrows/reject', NOW(), 'system', 'system'
WHERE @content_center_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM sys_menu WHERE permissionKey = 'business/articleBorrows/reject' AND is_delete IS NULL);

INSERT INTO sys_menu (name, path, component, type, parent_id, `order`, icon, is_hidden, is_active, is_delete, permissionKey, create_time, create_user, update_user)
SELECT '借阅撤销', 'borrow-revoke', '', 'button', @content_center_id, '38', '', '1', '1', NULL, 'business/articleBorrows/revoke', NOW(), 'system', 'system'
WHERE @content_center_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM sys_menu WHERE permissionKey = 'business/articleBorrows/revoke' AND is_delete IS NULL);

INSERT IGNORE INTO sys_role_menu (role_id, menu_id)
SELECT role.id, menu.id
FROM sys_role role
JOIN sys_menu menu ON menu.is_delete IS NULL
WHERE role.permissionKey = 'admin'
  AND role.is_delete IS NULL
  AND (
    menu.component = 'content/articleManage/index'
    OR menu.path IN ('myBorrows', 'borrowApproval')
    OR menu.permissionKey IN (
      'business/articles/list',
      'business/articles/add',
      'business/articles/update',
      'business/articles/delete',
      'content/articles/viewAll',
      'business/articleTags/list',
      'business/articleTags/add',
      'business/articleTags/update',
      'business/articleTags/delete',
      'business/articleBorrows/apply',
      'business/articleBorrows/my',
      'business/articleBorrows/pending',
      'business/articleBorrows/approve',
      'business/articleBorrows/reject',
      'business/articleBorrows/revoke'
    )
  );

INSERT IGNORE INTO sys_role_menu (role_id, menu_id)
SELECT role.id, menu.id
FROM sys_role role
JOIN sys_menu menu ON menu.is_delete IS NULL
WHERE role.permissionKey = 'user'
  AND role.is_delete IS NULL
  AND menu.permissionKey IN (
    'business/articles/list',
    'business/articles/add',
    'business/articles/update',
    'business/articleBorrows/apply',
    'business/articleBorrows/my'
  );
