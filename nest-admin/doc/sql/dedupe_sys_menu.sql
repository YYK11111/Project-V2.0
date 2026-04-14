-- Deduplicate obviously duplicated sys_menu rows introduced by repeated menu import scripts.
-- Strategy: keep the newest canonical record, migrate role mappings, then delete stale duplicates.

SET FOREIGN_KEY_CHECKS = 0;

-- CRM customer duplicates: keep 188-191, drop 110-113
INSERT IGNORE INTO sys_role_menu (role_id, menu_id)
SELECT role_id, 188 FROM sys_role_menu WHERE menu_id = 110;
INSERT IGNORE INTO sys_role_menu (role_id, menu_id)
SELECT role_id, 189 FROM sys_role_menu WHERE menu_id = 111;
INSERT IGNORE INTO sys_role_menu (role_id, menu_id)
SELECT role_id, 190 FROM sys_role_menu WHERE menu_id = 112;
INSERT IGNORE INTO sys_role_menu (role_id, menu_id)
SELECT role_id, 191 FROM sys_role_menu WHERE menu_id = 113;

DELETE FROM sys_role_menu WHERE menu_id IN (110,111,112,113);
DELETE FROM sys_menu WHERE id IN (110,111,112,113);

-- CRM interaction duplicates: keep 195-198, drop 115-118
INSERT IGNORE INTO sys_role_menu (role_id, menu_id)
SELECT role_id, 195 FROM sys_role_menu WHERE menu_id = 115;
INSERT IGNORE INTO sys_role_menu (role_id, menu_id)
SELECT role_id, 196 FROM sys_role_menu WHERE menu_id = 116;
INSERT IGNORE INTO sys_role_menu (role_id, menu_id)
SELECT role_id, 197 FROM sys_role_menu WHERE menu_id = 117;
INSERT IGNORE INTO sys_role_menu (role_id, menu_id)
SELECT role_id, 198 FROM sys_role_menu WHERE menu_id = 118;

DELETE FROM sys_role_menu WHERE menu_id IN (115,116,117,118);
DELETE FROM sys_menu WHERE id IN (115,116,117,118);

-- CRM opportunity duplicates: keep 199-202, drop 120-123
INSERT IGNORE INTO sys_role_menu (role_id, menu_id)
SELECT role_id, 199 FROM sys_role_menu WHERE menu_id = 120;
INSERT IGNORE INTO sys_role_menu (role_id, menu_id)
SELECT role_id, 200 FROM sys_role_menu WHERE menu_id = 121;
INSERT IGNORE INTO sys_role_menu (role_id, menu_id)
SELECT role_id, 201 FROM sys_role_menu WHERE menu_id = 122;
INSERT IGNORE INTO sys_role_menu (role_id, menu_id)
SELECT role_id, 202 FROM sys_role_menu WHERE menu_id = 123;

DELETE FROM sys_role_menu WHERE menu_id IN (120,121,122,123);
DELETE FROM sys_menu WHERE id IN (120,121,122,123);

-- CRM contract duplicates: keep 203-206, drop 125-128
INSERT IGNORE INTO sys_role_menu (role_id, menu_id)
SELECT role_id, 203 FROM sys_role_menu WHERE menu_id = 125;
INSERT IGNORE INTO sys_role_menu (role_id, menu_id)
SELECT role_id, 204 FROM sys_role_menu WHERE menu_id = 126;
INSERT IGNORE INTO sys_role_menu (role_id, menu_id)
SELECT role_id, 205 FROM sys_role_menu WHERE menu_id = 127;
INSERT IGNORE INTO sys_role_menu (role_id, menu_id)
SELECT role_id, 206 FROM sys_role_menu WHERE menu_id = 128;

DELETE FROM sys_role_menu WHERE menu_id IN (125,126,127,128);
DELETE FROM sys_menu WHERE id IN (125,126,127,128);

-- Project button duplicates under form: keep 231-233, drop 208-210 and 212-214
INSERT IGNORE INTO sys_role_menu (role_id, menu_id)
SELECT role_id, 231 FROM sys_role_menu WHERE menu_id IN (208,212);
INSERT IGNORE INTO sys_role_menu (role_id, menu_id)
SELECT role_id, 232 FROM sys_role_menu WHERE menu_id IN (209,213);
INSERT IGNORE INTO sys_role_menu (role_id, menu_id)
SELECT role_id, 233 FROM sys_role_menu WHERE menu_id IN (210,214);

DELETE FROM sys_role_menu WHERE menu_id IN (208,209,210,212,213,214);
DELETE FROM sys_menu WHERE id IN (208,209,210,212,213,214);

SET FOREIGN_KEY_CHECKS = 1;

-- Verification snapshot
SELECT name, parent_id, path, component, type, permissionKey, COUNT(*) AS cnt, GROUP_CONCAT(id ORDER BY id) AS ids
FROM sys_menu
WHERE is_delete IS NULL
GROUP BY name, parent_id, path, component, type, permissionKey
HAVING COUNT(*) > 1
ORDER BY cnt DESC, parent_id, name;
