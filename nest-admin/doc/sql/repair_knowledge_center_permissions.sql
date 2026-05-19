SET NAMES utf8mb4;

SET @knowledge_home_menu_id = 206;
SET @knowledge_search_menu_id = 207;
SET @knowledge_manage_menu_id = 208;
SET @knowledge_my_borrows_menu_id = 209;
SET @knowledge_borrow_approval_menu_id = 210;
SET @admin_role_id = (
  SELECT id FROM sys_role WHERE permissionKey = 'admin' ORDER BY id LIMIT 1
);

INSERT INTO sys_menu (name, `desc`, parent_id, `order`, path, component, type, icon, is_hidden, is_active, create_user, update_user, permissionKey)
SELECT '知识首页访问', '知识首页访问权限', @knowledge_home_menu_id, '701', 'knowledge-home-enter', '', 'button', '', '1', '1', 'system', 'system', 'content/articleManage/home'
WHERE NOT EXISTS (SELECT 1 FROM sys_menu WHERE parent_id = @knowledge_home_menu_id AND permissionKey = 'content/articleManage/home' AND is_delete IS NULL);

INSERT INTO sys_menu (name, `desc`, parent_id, `order`, path, component, type, icon, is_hidden, is_active, create_user, update_user, permissionKey)
SELECT '知识搜索访问', '知识搜索访问权限', @knowledge_search_menu_id, '711', 'knowledge-search-enter', '', 'button', '', '1', '1', 'system', 'system', 'content/articleManage/search'
WHERE NOT EXISTS (SELECT 1 FROM sys_menu WHERE parent_id = @knowledge_search_menu_id AND permissionKey = 'content/articleManage/search' AND is_delete IS NULL);

INSERT INTO sys_menu (name, `desc`, parent_id, `order`, path, component, type, icon, is_hidden, is_active, create_user, update_user, permissionKey)
SELECT '后台管理访问', '后台管理访问权限', @knowledge_manage_menu_id, '721', 'knowledge-manage-enter', '', 'button', '', '1', '1', 'system', 'system', 'content/articleManage/manage'
WHERE NOT EXISTS (SELECT 1 FROM sys_menu WHERE parent_id = @knowledge_manage_menu_id AND permissionKey = 'content/articleManage/manage' AND is_delete IS NULL);
INSERT INTO sys_menu (name, `desc`, parent_id, `order`, path, component, type, icon, is_hidden, is_active, create_user, update_user, permissionKey)
SELECT '文章新增', '文章新增权限', @knowledge_manage_menu_id, '722', 'knowledge-manage-add', '', 'button', '', '1', '1', 'system', 'system', 'business/articles/add'
WHERE NOT EXISTS (SELECT 1 FROM sys_menu WHERE parent_id = @knowledge_manage_menu_id AND permissionKey = 'business/articles/add' AND is_delete IS NULL);
INSERT INTO sys_menu (name, `desc`, parent_id, `order`, path, component, type, icon, is_hidden, is_active, create_user, update_user, permissionKey)
SELECT '文章修改', '文章修改权限', @knowledge_manage_menu_id, '723', 'knowledge-manage-update', '', 'button', '', '1', '1', 'system', 'system', 'business/articles/update'
WHERE NOT EXISTS (SELECT 1 FROM sys_menu WHERE parent_id = @knowledge_manage_menu_id AND permissionKey = 'business/articles/update' AND is_delete IS NULL);
INSERT INTO sys_menu (name, `desc`, parent_id, `order`, path, component, type, icon, is_hidden, is_active, create_user, update_user, permissionKey)
SELECT '文章删除', '文章删除权限', @knowledge_manage_menu_id, '724', 'knowledge-manage-delete', '', 'button', '', '1', '1', 'system', 'system', 'business/articles/delete'
WHERE NOT EXISTS (SELECT 1 FROM sys_menu WHERE parent_id = @knowledge_manage_menu_id AND permissionKey = 'business/articles/delete' AND is_delete IS NULL);
INSERT INTO sys_menu (name, `desc`, parent_id, `order`, path, component, type, icon, is_hidden, is_active, create_user, update_user, permissionKey)
SELECT '标签列表', '标签列表权限', @knowledge_manage_menu_id, '725', 'knowledge-manage-tag-list', '', 'button', '', '1', '1', 'system', 'system', 'business/articleTags/list'
WHERE NOT EXISTS (SELECT 1 FROM sys_menu WHERE parent_id = @knowledge_manage_menu_id AND permissionKey = 'business/articleTags/list' AND is_delete IS NULL);
INSERT INTO sys_menu (name, `desc`, parent_id, `order`, path, component, type, icon, is_hidden, is_active, create_user, update_user, permissionKey)
SELECT '新增标签', '新增标签权限', @knowledge_manage_menu_id, '726', 'knowledge-manage-tag-add', '', 'button', '', '1', '1', 'system', 'system', 'business/articleTags/add'
WHERE NOT EXISTS (SELECT 1 FROM sys_menu WHERE parent_id = @knowledge_manage_menu_id AND permissionKey = 'business/articleTags/add' AND is_delete IS NULL);
INSERT INTO sys_menu (name, `desc`, parent_id, `order`, path, component, type, icon, is_hidden, is_active, create_user, update_user, permissionKey)
SELECT '修改标签', '修改标签权限', @knowledge_manage_menu_id, '727', 'knowledge-manage-tag-update', '', 'button', '', '1', '1', 'system', 'system', 'business/articleTags/update'
WHERE NOT EXISTS (SELECT 1 FROM sys_menu WHERE parent_id = @knowledge_manage_menu_id AND permissionKey = 'business/articleTags/update' AND is_delete IS NULL);
INSERT INTO sys_menu (name, `desc`, parent_id, `order`, path, component, type, icon, is_hidden, is_active, create_user, update_user, permissionKey)
SELECT '删除标签', '删除标签权限', @knowledge_manage_menu_id, '728', 'knowledge-manage-tag-delete', '', 'button', '', '1', '1', 'system', 'system', 'business/articleTags/delete'
WHERE NOT EXISTS (SELECT 1 FROM sys_menu WHERE parent_id = @knowledge_manage_menu_id AND permissionKey = 'business/articleTags/delete' AND is_delete IS NULL);

INSERT INTO sys_menu (name, `desc`, parent_id, `order`, path, component, type, icon, is_hidden, is_active, create_user, update_user, permissionKey)
SELECT '我的借阅访问', '我的借阅访问权限', @knowledge_my_borrows_menu_id, '731', 'knowledge-my-borrows-enter', '', 'button', '', '1', '1', 'system', 'system', 'content/articleManage/myBorrows'
WHERE NOT EXISTS (SELECT 1 FROM sys_menu WHERE parent_id = @knowledge_my_borrows_menu_id AND permissionKey = 'content/articleManage/myBorrows' AND is_delete IS NULL);
INSERT INTO sys_menu (name, `desc`, parent_id, `order`, path, component, type, icon, is_hidden, is_active, create_user, update_user, permissionKey)
SELECT '借阅我的申请', '查看我的借阅权限', @knowledge_my_borrows_menu_id, '732', 'knowledge-my-borrows-list', '', 'button', '', '1', '1', 'system', 'system', 'business/articleBorrows/my'
WHERE NOT EXISTS (SELECT 1 FROM sys_menu WHERE parent_id = @knowledge_my_borrows_menu_id AND permissionKey = 'business/articleBorrows/my' AND is_delete IS NULL);

INSERT INTO sys_menu (name, `desc`, parent_id, `order`, path, component, type, icon, is_hidden, is_active, create_user, update_user, permissionKey)
SELECT '借阅审批访问', '借阅审批访问权限', @knowledge_borrow_approval_menu_id, '741', 'knowledge-borrow-approval-enter', '', 'button', '', '1', '1', 'system', 'system', 'content/articleManage/borrowApproval'
WHERE NOT EXISTS (SELECT 1 FROM sys_menu WHERE parent_id = @knowledge_borrow_approval_menu_id AND permissionKey = 'content/articleManage/borrowApproval' AND is_delete IS NULL);
INSERT INTO sys_menu (name, `desc`, parent_id, `order`, path, component, type, icon, is_hidden, is_active, create_user, update_user, permissionKey)
SELECT '待审批借阅列表', '待审批借阅列表权限', @knowledge_borrow_approval_menu_id, '742', 'knowledge-borrow-approval-pending', '', 'button', '', '1', '1', 'system', 'system', 'business/articleBorrows/pending'
WHERE NOT EXISTS (SELECT 1 FROM sys_menu WHERE parent_id = @knowledge_borrow_approval_menu_id AND permissionKey = 'business/articleBorrows/pending' AND is_delete IS NULL);
INSERT INTO sys_menu (name, `desc`, parent_id, `order`, path, component, type, icon, is_hidden, is_active, create_user, update_user, permissionKey)
SELECT '借阅审批通过', '借阅审批通过权限', @knowledge_borrow_approval_menu_id, '743', 'knowledge-borrow-approval-approve', '', 'button', '', '1', '1', 'system', 'system', 'business/articleBorrows/approve'
WHERE NOT EXISTS (SELECT 1 FROM sys_menu WHERE parent_id = @knowledge_borrow_approval_menu_id AND permissionKey = 'business/articleBorrows/approve' AND is_delete IS NULL);
INSERT INTO sys_menu (name, `desc`, parent_id, `order`, path, component, type, icon, is_hidden, is_active, create_user, update_user, permissionKey)
SELECT '借阅审批拒绝', '借阅审批拒绝权限', @knowledge_borrow_approval_menu_id, '744', 'knowledge-borrow-approval-reject', '', 'button', '', '1', '1', 'system', 'system', 'business/articleBorrows/reject'
WHERE NOT EXISTS (SELECT 1 FROM sys_menu WHERE parent_id = @knowledge_borrow_approval_menu_id AND permissionKey = 'business/articleBorrows/reject' AND is_delete IS NULL);
INSERT INTO sys_menu (name, `desc`, parent_id, `order`, path, component, type, icon, is_hidden, is_active, create_user, update_user, permissionKey)
SELECT '借阅撤销', '借阅撤销权限', @knowledge_borrow_approval_menu_id, '745', 'knowledge-borrow-approval-revoke', '', 'button', '', '1', '1', 'system', 'system', 'business/articleBorrows/revoke'
WHERE NOT EXISTS (SELECT 1 FROM sys_menu WHERE parent_id = @knowledge_borrow_approval_menu_id AND permissionKey = 'business/articleBorrows/revoke' AND is_delete IS NULL);

INSERT IGNORE INTO sys_role_menu (role_id, menu_id)
SELECT @admin_role_id, id
FROM sys_menu
WHERE @admin_role_id IS NOT NULL
  AND is_delete IS NULL
  AND permissionKey IN (
    'content/articleManage/home',
    'content/articleManage/search',
    'content/articleManage/manage',
    'business/articles/add',
    'business/articles/update',
    'business/articles/delete',
    'content/articleManage/myBorrows',
    'business/articleBorrows/my',
    'content/articleManage/borrowApproval',
    'business/articleBorrows/pending',
    'business/articleBorrows/approve',
    'business/articleBorrows/reject',
    'business/articleBorrows/revoke',
    'business/articleTags/list',
    'business/articleTags/add',
    'business/articleTags/update',
    'business/articleTags/delete'
  );

INSERT IGNORE INTO sys_role_menu (role_id, menu_id)
SELECT r.id, m.id
FROM sys_role r
JOIN sys_menu m ON m.is_delete IS NULL
WHERE r.permissionKey = 'knowledgeEditor'
  AND (
    m.path IN ('/content/articleManage/home', '/content/articleManage/search', '/content/articleManage/manage', '/content/articleManage/myBorrows')
    OR m.permissionKey IN (
      'content/articleManage/home',
      'content/articleManage/search',
      'content/articleManage/manage',
      'business/articles/add',
      'business/articles/update',
      'business/articleTags/list',
      'business/articleTags/add',
      'business/articleTags/update',
      'business/articleBorrows/my'
    )
  );

INSERT IGNORE INTO sys_role_menu (role_id, menu_id)
SELECT r.id, m.id
FROM sys_role r
JOIN sys_menu m ON m.is_delete IS NULL
WHERE r.permissionKey = 'knowledgeCatalogAdmin'
  AND (
    m.path IN ('/content/articleManage/home', '/content/articleManage/search', '/content/articleManage/manage', '/content/articleManage/myBorrows', '/content/articleManage/borrowApproval')
    OR m.permissionKey IN (
      'content/articleManage/home',
      'content/articleManage/search',
      'content/articleManage/manage',
      'business/articles/add',
      'business/articles/update',
      'business/articleTags/list',
      'business/articleTags/add',
      'business/articleTags/update',
      'business/articleBorrows/my',
      'business/articleBorrows/pending',
      'business/articleBorrows/approve',
      'business/articleBorrows/reject',
      'business/articleBorrows/revoke',
      'business/articleCatalogs/update'
    )
  );
