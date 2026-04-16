SET NAMES utf8mb4;

-- 当前真实数据库结构基线
-- 说明：此脚本直接恢复当前运行库导出的最终表结构，包含 workflow、file、message、task_time_log 最新字段等内容。

SOURCE generated/schema_seed_raw.sql;
