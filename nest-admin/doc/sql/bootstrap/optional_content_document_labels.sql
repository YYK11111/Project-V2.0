SET NAMES utf8mb4;

UPDATE sys_menu
SET name = '知识中心'
WHERE path = 'content'
  AND is_delete IS NULL;

UPDATE sys_menu
SET name = '知识中心',
    path = 'content',
    component = 'content/articleManage/index',
    type = 'menu',
    parent_id = NULL,
    permissionKey = NULL,
    icon = 'clipboard',
    is_delete = NULL
WHERE path = 'articleManage'
  AND is_delete IS NULL;

UPDATE sys_menu
SET is_delete = '1'
WHERE path = 'content'
  AND component = ''
  AND type = 'catalog'
  AND is_delete IS NULL;

UPDATE sys_menu
SET name = '文章列表'
WHERE component = 'content/articleManage/index'
  AND path = 'index'
  AND is_delete IS NULL;

UPDATE sys_menu
SET is_delete = '1'
WHERE component = 'content/articleManage/index'
  AND path = 'index'
  AND is_delete IS NULL;

UPDATE sys_menu
SET name = '项目文档',
    path = 'documentManage',
    component = 'business/documentManage/index',
    type = 'menu',
    parent_id = NULL,
    permissionKey = 'business:document',
    icon = 'el:Document',
    is_delete = NULL
WHERE path = 'documentManage'
  AND is_delete IS NULL;

UPDATE sys_menu
SET name = '文档列表'
WHERE component = 'business/documentManage/index'
  AND path = 'documentInfo'
  AND is_delete IS NULL;

UPDATE sys_menu
SET is_delete = '1'
WHERE component = 'business/documentManage/index'
  AND path = 'documentInfo'
  AND is_delete IS NULL;
