SET NAMES utf8mb4;

INSERT INTO sys_role (create_time, update_time, name, permissionKey, dataPermissionType, is_active, remark, create_user, update_user)
SELECT NOW(), NOW(), '知识维护', 'knowledgeEditor', 'self', '1', '知识内容维护角色', 'system', 'system'
FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM sys_role WHERE permissionKey = 'knowledgeEditor' AND is_delete IS NULL);

INSERT INTO sys_role (create_time, update_time, name, permissionKey, dataPermissionType, is_active, remark, create_user, update_user)
SELECT NOW(), NOW(), '分类管理员', 'knowledgeCatalogAdmin', 'self', '1', '知识分类与借阅审批角色', 'system', 'system'
FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM sys_role WHERE permissionKey = 'knowledgeCatalogAdmin' AND is_delete IS NULL);

INSERT INTO sys_role (create_time, update_time, name, permissionKey, dataPermissionType, is_active, remark, create_user, update_user)
SELECT NOW(), NOW(), 'AI运营', 'knowledgeAiOperator', 'self', '1', 'AI检索调试与知识运营角色', 'system', 'system'
FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM sys_role WHERE permissionKey = 'knowledgeAiOperator' AND is_delete IS NULL);

INSERT INTO sys_menu (create_time, update_time, name, path, component, type, icon, is_hidden, is_active, permissionKey, create_user, update_user)
SELECT NOW(), NOW(), 'AI检索调试', '/content/articleManage/aiRetrieveDebug', 'content/articleManage/aiRetrieveDebug', 'menu', 'Promotion', '0', '1', 'content/articles/aiDebug', 'system', 'system'
FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM sys_menu WHERE permissionKey = 'content/articles/aiDebug' AND is_delete IS NULL);

INSERT INTO sys_menu (create_time, update_time, name, path, component, type, icon, is_hidden, is_active, permissionKey, create_user, update_user)
SELECT NOW(), NOW(), 'AI运营', 'ai-operate', '', 'button', '', '1', '1', 'content/articles/aiOperate', 'system', 'system'
FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM sys_menu WHERE permissionKey = 'content/articles/aiOperate' AND is_delete IS NULL);

INSERT IGNORE INTO sys_role_menu (role_id, menu_id)
SELECT r.id, m.id
FROM sys_role r
JOIN sys_menu m ON m.is_delete IS NULL
WHERE r.permissionKey = 'knowledgeEditor'
  AND (
    m.path IN ('/content/articleManage/home', '/content/articleManage/search', '/content/articleManage/manage', '/content/articleManage/myBorrows')
    OR m.permissionKey IN (
      'content/articles/home',
      'content/articles/search',
      'content/articles/manage',
      'business/articles/getOne',
      'business/articles/add',
      'business/articles/update',
      'business/articleTags/list',
      'business/articleTags/add',
      'business/articleTags/update',
      'business/articleBorrows/apply',
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
      'content/articles/home',
      'content/articles/search',
      'content/articles/manage',
      'business/articles/getOne',
      'business/articles/add',
      'business/articles/update',
      'business/articleTags/list',
      'business/articleTags/add',
      'business/articleTags/update',
      'business/articleBorrows/apply',
      'business/articleBorrows/my',
      'business/articleBorrows/pending',
      'business/articleBorrows/approve',
      'business/articleBorrows/reject',
      'business/articleBorrows/revoke',
      'business/articleCatalogs/update'
    )
  );

INSERT IGNORE INTO sys_role_menu (role_id, menu_id)
SELECT r.id, m.id
FROM sys_role r
JOIN sys_menu m ON m.is_delete IS NULL
WHERE r.permissionKey = 'knowledgeAiOperator'
  AND (
    m.path IN ('/content/articleManage/home', '/content/articleManage/search', '/content/articleManage/manage', '/content/articleManage/myBorrows', '/content/articleManage/aiRetrieveDebug')
    OR m.permissionKey IN (
      'content/articles/home',
      'content/articles/search',
      'content/articles/manage',
      'business/articles/getOne',
      'business/articleBorrows/my',
      'content/articles/viewAll',
      'content/articles/aiDebug',
      'content/articles/aiOperate'
    )
  );
