SET NAMES utf8mb4;

-- 系统初始化统一入口
-- 执行示例：mysql -u root -p12345678 -D psd2 < init_system.sql

SOURCE 01_schema.sql;
SOURCE 02_base_data.sql;
SOURCE 03_menu_and_permissions.sql;
SOURCE 04_optional_modules.sql;
