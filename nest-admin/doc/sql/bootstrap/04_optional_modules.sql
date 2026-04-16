SET NAMES utf8mb4;

-- 可选模块与扩展能力，按需启用
SOURCE ../migrate_trigger_config_to_business_scene.sql;
SOURCE ../wf_business_config.sql;
SOURCE optional_message_center.sql;
SOURCE optional_project_cockpit.sql;
SOURCE optional_content_document_labels.sql;
SOURCE optional_notice_labels.sql;
SOURCE optional_remove_app_tools.sql;
SOURCE optional_menu_order_int.sql;
SOURCE optional_normalize_business_catalog_keys.sql;

-- 业务菜单样式与图标优化类脚本不影响功能，可按需执行
-- SOURCE ../normalize_business_menu_icons.sql;
-- SOURCE ../refine_business_menu_labels.sql;
-- SOURCE ../finalize_business_menu_types.sql;
