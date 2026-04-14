-- 为用户表添加主题颜色配置字段
ALTER TABLE `sys_user` 
ADD COLUMN `theme_hsl` VARCHAR(50) DEFAULT NULL COMMENT '主题颜色HSL值，格式：h,s,l' AFTER `nickname`;

-- 为现有用户设置默认主题（可选）
-- UPDATE `sys_user` SET `theme_hsl` = '345,82%,54%' WHERE `theme_hsl` IS NULL;
