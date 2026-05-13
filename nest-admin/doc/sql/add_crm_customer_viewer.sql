-- CRM 客户查看授权表与菜单权限
-- 作用：让客户只对创建人、审批参与人、被授权查看人可见。

CREATE TABLE IF NOT EXISTS `crm_customer_viewer` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `create_time` datetime NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `create_user` varchar(255) NULL DEFAULT NULL COMMENT '创建人',
  `update_time` datetime NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  `update_user` varchar(255) NULL DEFAULT NULL COMMENT '更新人',
  `is_delete` char(1) NULL DEFAULT NULL COMMENT '是否删除: NULL未删除，1删除',
  `customer_id` bigint NULL DEFAULT NULL COMMENT '客户ID',
  `user_id` varchar(255) NULL DEFAULT NULL COMMENT '可查看用户ID或用户名',
  `source_type` varchar(20) NULL DEFAULT NULL COMMENT '来源: creator创建人 approval审批参与 manual手工授权',
  `can_edit` char(1) NULL DEFAULT '0' COMMENT '是否可编辑: 1是 0否',
  PRIMARY KEY (`id`),
  KEY `idx_crm_customer_viewer_customer_user_source` (`customer_id`, `user_id`, `source_type`),
  KEY `idx_crm_customer_viewer_user_customer` (`user_id`, `customer_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='CRM客户可见人';

-- 初始化历史客户创建人可见关系。create_user 当前存的是用户名，不是用户ID。
INSERT INTO `crm_customer_viewer` (
  `customer_id`,
  `user_id`,
  `source_type`,
  `can_edit`,
  `create_user`,
  `update_user`
)
SELECT
  c.`id`,
  c.`create_user`,
  'creator',
  '0',
  'system',
  'system'
FROM `crm_customer` c
WHERE c.`is_delete` IS NULL
  AND c.`create_user` IS NOT NULL
  AND c.`create_user` <> ''
  AND NOT EXISTS (
    SELECT 1
    FROM `crm_customer_viewer` v
    WHERE v.`customer_id` = c.`id`
      AND v.`user_id` = c.`create_user`
      AND v.`source_type` = 'creator'
      AND v.`is_delete` IS NULL
  );

-- 客户授权查看按钮权限，挂到客户管理菜单下。
SET @customerMenuId := (
  SELECT `id`
  FROM `sys_menu`
  WHERE `component` = 'business/crm/customerManage/index'
    AND `is_delete` IS NULL
  ORDER BY `id`
  LIMIT 1
);

INSERT INTO `sys_menu` (
  `create_time`,
  `create_user`,
  `update_user`,
  `parent_id`,
  `order`,
  `path`,
  `component`,
  `type`,
  `icon`,
  `is_hidden`,
  `is_active`,
  `name`,
  `permissionKey`
)
SELECT
  NOW(),
  'system',
  'system',
  @customerMenuId,
  '90',
  'customer-auth',
  '',
  'button',
  '',
  '1',
  '1',
  '客户授权查看',
  'business/crm/customers/update'
WHERE @customerMenuId IS NOT NULL
  AND NOT EXISTS (
    SELECT 1
    FROM `sys_menu`
    WHERE `permissionKey` = 'business/crm/customers/update'
      AND `name` = '客户授权查看'
      AND `is_delete` IS NULL
  );
