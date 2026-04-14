-- Replace remaining visible list icons with Element Plus icons.

UPDATE sys_menu SET icon = 'el:List' WHERE id IN (235, 236, 237);

SELECT id, name, path, parent_id, icon
FROM sys_menu
WHERE id IN (235, 236, 237)
ORDER BY id;
