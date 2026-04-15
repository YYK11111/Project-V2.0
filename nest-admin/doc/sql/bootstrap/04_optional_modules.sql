SET NAMES utf8mb4;

-- 可选模块与扩展能力，按需启用
SOURCE ../migrate_trigger_config_to_business_scene.sql;
SOURCE ../wf_business_config.sql;

-- 业务菜单样式与图标优化类脚本不影响功能，可按需执行
-- SOURCE ../normalize_business_menu_icons.sql;
-- SOURCE ../refine_business_menu_labels.sql;
-- SOURCE ../finalize_business_menu_types.sql;
