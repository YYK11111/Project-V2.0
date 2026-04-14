# CRM 菜单扁平化导航配置指南

## 需求说明

希望"客户管理"、"互动记录"等菜单在侧边栏中显示为**单一入口**，点击后直接跳转到列表页，而不是展开一个包含子项的目录结构。

## 解决方案

### 核心思路

将二级菜单从 `catalog`（目录）类型改为 `menu`（菜单）类型，直接指向列表页组件。表单页和按钮权限作为其隐藏的子路由存在，用于权限控制和路由跳转，但不在侧边栏显示。

### 菜单层级结构对比

#### ❌ 之前的结构（有冗余层级）
```
CRM客户管理 (catalog, level=1)
└── 客户管理 (catalog, level=2) ← 需要点击展开
    ├── 客户列表 (menu, level=3) ← 实际点击这里
    ├── 客户表单 (menu, hidden)
    └── 按钮权限 (button, hidden)
```
**问题**：侧边栏显示两级可展开菜单，用户需要先点击"客户管理"展开，再点击"客户列表"。

#### ✅ 现在的结构（扁平化）
```
CRM客户管理 (catalog, level=1)
└── 客户管理 (menu, level=2) ← 直接点击，显示列表页
    ├── 客户表单 (menu, hidden) ← 隐藏子路由，用于跳转
    └── 按钮权限 (button, hidden) ← 隐藏权限标识
```
**优势**：侧边栏只显示一级菜单，点击直接到列表页，体验更简洁。

## SQL 配置详解

### 完整的 CRM 菜单配置脚本

文件位置：`nest-admin/doc/sql/crm_menus_fix.sql`

```sql
-- ============================================
-- CRM菜单扁平化配置脚本
-- ============================================

-- 步骤1: 清理现有菜单（按从子到父的顺序删除）

-- 1.1 删除角色权限关联
DELETE FROM `sys_role_menu` WHERE `menuId` IN (
    SELECT id FROM (
        SELECT id FROM `sys_menu` 
        WHERE name LIKE '%CRM%' 
           OR name LIKE '%客户管理%' 
           OR name LIKE '%互动记录%' 
           OR name LIKE '%销售机会%' 
           OR name LIKE '%合同管理%'
    ) AS tmp
);

-- 1.2 删除所有按钮权限（最底层）
DELETE FROM `sys_menu` WHERE type = 'button' AND parent_id IN (
    SELECT id FROM (
        SELECT id FROM `sys_menu` 
        WHERE path = 'index' AND name IN ('客户列表', '互动列表', '机会列表', '合同列表')
    ) AS tmp
);

-- 1.3 删除所有表单页
DELETE FROM `sys_menu` WHERE type = 'menu' AND path = 'form';

-- 1.4 删除所有列表页
DELETE FROM `sys_menu` WHERE type = 'menu' AND path = 'index' AND name IN ('客户列表', '互动列表', '机会列表', '合同列表');

-- 1.5 删除二级菜单
DELETE FROM `sys_menu` WHERE type IN ('catalog', 'menu') AND name IN ('客户管理', '互动记录', '销售机会', '合同管理');

-- 1.6 删除一级菜单
DELETE FROM `sys_menu` WHERE name = 'CRM客户管理';


-- 步骤2: 重新创建菜单（扁平化结构）

-- 2.1 创建一级菜单：CRM客户管理 (catalog - 路由容器)
INSERT INTO `sys_menu` (`name`, `parent_id`, `type`, `path`, `component`, `icon`, `order`, `is_hidden`, `create_time`) 
VALUES ('CRM客户管理', 0, 'catalog', '/crm', '', 'customer', '5', '0', NOW());

SET @crm_menu_id = LAST_INSERT_ID();


-- ============================================
-- 模块1: 客户管理
-- ============================================

-- 2.2 创建二级菜单：客户管理 (menu - 直接指向列表页)
-- ⭐ 关键：type='menu'，component 指向列表页组件
INSERT INTO `sys_menu` (`name`, `parent_id`, `type`, `path`, `component`, `icon`, `order`, `is_hidden`, `create_time`) 
VALUES ('客户管理', @crm_menu_id, 'menu', 'customer', 'business/crm/customerManage/index', 'peoples', '1', '0', NOW());

SET @customer_menu_id = LAST_INSERT_ID();

-- 2.3 创建隐藏子路由：客户表单 (用于新增/编辑跳转)
INSERT INTO `sys_menu` (`name`, `parent_id`, `type`, `path`, `component`, `icon`, `order`, `is_hidden`, `create_time`) 
VALUES ('客户表单', @customer_menu_id, 'menu', 'form', 'business/crm/customerManage/form', '', '1', '1', NOW());
-- ⭐ is_hidden=1，不在侧边栏显示

-- 2.4 创建按钮权限（全部隐藏）
INSERT INTO `sys_menu` (`name`, `parent_id`, `type`, `permission_key`, `order`, `is_hidden`, `create_time`) 
VALUES 
  ('客户新增', @customer_menu_id, 'button', 'crm:customer:add', '2', '1', NOW()),
  ('客户编辑', @customer_menu_id, 'button', 'crm:customer:update', '3', '1', NOW()),
  ('客户删除', @customer_menu_id, 'button', 'crm:customer:delete', '4', '1', NOW());


-- ============================================
-- 模块2: 互动记录
-- ============================================

INSERT INTO `sys_menu` (`name`, `parent_id`, `type`, `path`, `component`, `icon`, `order`, `is_hidden`, `create_time`) 
VALUES ('互动记录', @crm_menu_id, 'menu', 'interaction', 'business/crm/interactionManage/index', 'phone', '2', '0', NOW());

SET @interaction_menu_id = LAST_INSERT_ID();

INSERT INTO `sys_menu` (`name`, `parent_id`, `type`, `path`, `component`, `icon`, `order`, `is_hidden`, `create_time`) 
VALUES ('互动表单', @interaction_menu_id, 'menu', 'form', 'business/crm/interactionManage/form', '', '1', '1', NOW());

INSERT INTO `sys_menu` (`name`, `parent_id`, `type`, `permission_key`, `order`, `is_hidden`, `create_time`) 
VALUES 
  ('互动新增', @interaction_menu_id, 'button', 'crm:interaction:add', '2', '1', NOW()),
  ('互动编辑', @interaction_menu_id, 'button', 'crm:interaction:update', '3', '1', NOW()),
  ('互动删除', @interaction_menu_id, 'button', 'crm:interaction:delete', '4', '1', NOW());


-- ============================================
-- 模块3: 销售机会
-- ============================================

INSERT INTO `sys_menu` (`name`, `parent_id`, `type`, `path`, `component`, `icon`, `order`, `is_hidden`, `create_time`) 
VALUES ('销售机会', @crm_menu_id, 'menu', 'opportunity', 'business/crm/opportunityManage/index', 'opportunity', '3', '0', NOW());

SET @opportunity_menu_id = LAST_INSERT_ID();

INSERT INTO `sys_menu` (`name`, `parent_id`, `type`, `path`, `component`, `icon`, `order`, `is_hidden`, `create_time`) 
VALUES ('机会表单', @opportunity_menu_id, 'menu', 'form', 'business/crm/opportunityManage/form', '', '1', '1', NOW());

INSERT INTO `sys_menu` (`name`, `parent_id`, `type`, `permission_key`, `order`, `is_hidden`, `create_time`) 
VALUES 
  ('机会新增', @opportunity_menu_id, 'button', 'crm:opportunity:add', '2', '1', NOW()),
  ('机会编辑', @opportunity_menu_id, 'button', 'crm:opportunity:update', '3', '1', NOW()),
  ('机会删除', @opportunity_menu_id, 'button', 'crm:opportunity:delete', '4', '1', NOW());


-- ============================================
-- 模块4: 合同管理
-- ============================================

INSERT INTO `sys_menu` (`name`, `parent_id`, `type`, `path`, `component`, `icon`, `order`, `is_hidden`, `create_time`) 
VALUES ('合同管理', @crm_menu_id, 'menu', 'contract', 'business/crm/contractManage/index', 'document', '4', '0', NOW());

SET @contract_menu_id = LAST_INSERT_ID();

INSERT INTO `sys_menu` (`name`, `parent_id`, `type`, `path`, `component`, `icon`, `order`, `is_hidden`, `create_time`) 
VALUES ('合同表单', @contract_menu_id, 'menu', 'form', 'business/crm/contractManage/form', '', '1', '1', NOW());

INSERT INTO `sys_menu` (`name`, `parent_id`, `type`, `permission_key`, `order`, `is_hidden`, `create_time`) 
VALUES 
  ('合同新增', @contract_menu_id, 'button', 'crm:contract:add', '2', '1', NOW()),
  ('合同编辑', @contract_menu_id, 'button', 'crm:contract:update', '3', '1', NOW()),
  ('合同删除', @contract_menu_id, 'button', 'crm:contract:delete', '4', '1', NOW());


-- 步骤3: 为超级管理员分配权限
INSERT INTO `sys_role_menu` (`roleId`, `menuId`) 
SELECT 1, id FROM `sys_menu` 
WHERE name LIKE '%CRM%' 
   OR name LIKE '%客户管理%' 
   OR name LIKE '%互动记录%' 
   OR name LIKE '%销售机会%' 
   OR name LIKE '%合同管理%'
ON DUPLICATE KEY UPDATE roleId = roleId;


-- 步骤4: 验证结果
SELECT '=== CRM菜单结构（扁平化）===' as info;
SELECT 
    m1.id as 'L1_ID',
    m1.name as '一级菜单',
    m1.type as 'L1类型',
    m2.id as 'L2_ID',
    m2.name as '二级菜单',
    m2.type as 'L2类型',
    m2.path as '路径',
    m2.component as '组件',
    m2.is_hidden as '是否隐藏',
    m3.id as 'L3_ID',
    m3.name as '子路由',
    m3.type as 'L3类型',
    m3.is_hidden as '子路由隐藏'
FROM sys_menu m1
LEFT JOIN sys_menu m2 ON m2.parent_id = m1.id
LEFT JOIN sys_menu m3 ON m3.parent_id = m2.id
WHERE m1.name = 'CRM客户管理'
ORDER BY m1.id, m2.`order`, m3.`order`;
```

## 关键字段说明

### 1. type 字段的作用

| type | 用途 | component | 侧边栏显示 | 示例 |
|------|------|-----------|-----------|------|
| **catalog** | 路由容器/分组 | 空字符串 | 可展开的父菜单 | "CRM客户管理" |
| **menu** | 实际页面 | Vue 组件路径 | 可点击的叶子节点 | "客户管理" |
| **button** | 权限标识 | 空字符串 | 不显示 | "客户新增" |

### 2. is_hidden 字段的作用

- `is_hidden = 0`：在侧边栏显示
- `is_hidden = 1`：不在侧边栏显示，但路由仍然有效

**应用场景**：
- 列表页：`is_hidden = 0`（需要在侧边栏显示）
- 表单页：`is_hidden = 1`（通过按钮跳转，不需要在侧边栏显示）
- 按钮权限：`is_hidden = 1`（仅用于权限控制）

### 3. component 字段的配置

```sql
-- ✅ 正确：menu 类型指向实际组件
INSERT INTO sys_menu (name, type, component) 
VALUES ('客户管理', 'menu', 'business/crm/customerManage/index');

-- ❌ 错误：catalog 类型不应该有 component
INSERT INTO sys_menu (name, type, component) 
VALUES ('客户管理', 'catalog', 'business/crm/customerManage/index');
```

## 前端路由生成逻辑

### SidebarItem.vue 的判断逻辑

文件：`nest-admin-frontend/src/layout/components/Sidebar/SidebarItem.vue`

```javascript
// 判断是否为叶子菜单（直接显示为 el-menu-item）
isLeafMeu(item) {
  let bol = this.hasOneShowingChild(item) && (!item.alwaysShow || this.onlyOneChild.noShowingChildren)
  if (!bol) {
    this.$emit('openeds', this.resolvePath(item.path))
  }
  return bol
},

hasOneShowingChild(route) {
  // 如果没有子路由，是叶子菜单
  if (!route.children) {
    this.onlyOneChild = { ...route, path: '' }
    return true
  }

  // 过滤出非隐藏的子路由
  const showingChildren = route.children.filter((item) => {
    if (item.isHidden) {
      return false
    } else {
      this.onlyOneChild = item
      return true
    }
  })

  // 如果所有子路由都隐藏，显示父级（作为叶子菜单）
  if (showingChildren.length === 0) {
    this.onlyOneChild = { ...route, path: '', noShowingChildren: true }
    return true
  }

  // 如果有多个可见子路由，显示为可展开的父菜单
  return false
}
```

### 应用到 CRM 菜单

对于"客户管理"菜单：
```javascript
{
  name: '客户管理',
  type: 'menu',
  path: 'customer',
  component: 'business/crm/customerManage/index',
  isHidden: 0,  // 可见
  children: [
    {
      name: '客户表单',
      type: 'menu',
      path: 'form',
      component: 'business/crm/customerManage/form',
      isHidden: 1  // 隐藏
    },
    {
      name: '客户新增',
      type: 'button',
      isHidden: 1  // 隐藏
    }
  ]
}
```

**渲染结果**：
1. `hasOneShowingChild` 检查子路由
2. 所有子路由都是 `isHidden: 1`，所以 `showingChildren.length === 0`
3. 返回 `true`，表示这是一个"叶子菜单"
4. `isLeafMeu` 返回 `true`
5. 渲染为 `<el-menu-item>`，而非 `<el-sub-menu>`

**侧边栏显示**：
```
CRM客户管理 (可展开的父菜单)
  ├─ 📋 客户管理 (可点击的叶子节点) ← 只有一个可见项
  ├─ 📞 互动记录
  ├─ 💰 销售机会
  └─ 📄 合同管理
```

## 执行步骤

### 1. 备份数据库（可选但推荐）

```bash
mysqldump -u root -p your_database_name sys_menu > sys_menu_backup_$(date +%Y%m%d).sql
mysqldump -u root -p your_database_name sys_role_menu > sys_role_menu_backup_$(date +%Y%m%d).sql
```

### 2. 执行修复脚本

```bash
# 连接到 MySQL
mysql -u root -p your_database_name

# 执行脚本
source /Users/yyk/工作/代码开发/Project-V2.0/nest-admin/doc/sql/crm_menus_fix.sql
```

### 3. 清除缓存并重启

```bash
# 前端
cd nest-admin-frontend
npm run dev

# 后端（如果需要）
cd nest-admin
npm run start:dev
```

### 4. 验证结果

1. **清除浏览器缓存**：Ctrl + Shift + Delete
2. **重新登录系统**
3. **检查侧边栏**：
   - 展开"CRM客户管理"
   - 应该看到4个直接的菜单项：客户管理、互动记录、销售机会、合同管理
   - 没有额外的子菜单层级
4. **测试跳转**：
   - 点击"客户管理"，应直接跳转到客户列表页
   - 点击"新增客户"按钮，应跳转到表单页（URL: `/crm/customer/form`）
   - 表单页不应在侧边栏显示

## 常见问题排查

### Q1: 侧边栏仍然显示子菜单？

**可能原因**：
1. 浏览器缓存未清除
2. 前端服务未重启
3. 数据库中仍有旧数据

**解决方法**：
```sql
-- 检查当前菜单结构
SELECT id, name, type, path, component, is_hidden 
FROM sys_menu 
WHERE parent_id IN (
    SELECT id FROM sys_menu WHERE name = 'CRM客户管理'
)
ORDER BY `order`;

-- 应该看到：
-- 客户管理 | menu | customer | business/crm/customerManage/index | 0
-- 互动记录 | menu | interaction | business/crm/interactionManage/index | 0
-- ...
```

### Q2: 点击菜单后出现 404？

**可能原因**：
1. 组件路径不正确
2. 前端组件文件不存在

**解决方法**：
```bash
# 检查组件文件是否存在
ls -la nest-admin-frontend/src/views/business/crm/customerManage/index.vue
ls -la nest-admin-frontend/src/views/business/crm/customerManage/form.vue
```

### Q3: 表单页在侧边栏显示了？

**可能原因**：`is_hidden` 字段设置错误

**解决方法**：
```sql
-- 检查表单页的 is_hidden 值
SELECT name, path, is_hidden 
FROM sys_menu 
WHERE path = 'form';

-- 应该全部是 1
-- 如果不是，更新它们
UPDATE sys_menu SET is_hidden = 1 WHERE path = 'form';
```

### Q4: 如何为其他模块应用相同的扁平化结构？

**通用模板**：

```sql
-- 假设要创建"订单管理"模块

-- 1. 找到或创建一级菜单
SET @parent_id = (SELECT id FROM sys_menu WHERE name = '业务管理' LIMIT 1);

-- 2. 创建二级菜单（menu 类型，直接指向列表页）
INSERT INTO sys_menu (name, parent_id, type, path, component, icon, `order`, is_hidden, create_time) 
VALUES ('订单管理', @parent_id, 'menu', 'order', 'business/orderManage/index', 'shopping', 1, 0, NOW());

SET @order_menu_id = LAST_INSERT_ID();

-- 3. 创建隐藏的表单页
INSERT INTO sys_menu (name, parent_id, type, path, component, `order`, is_hidden, create_time) 
VALUES ('订单表单', @order_menu_id, 'menu', 'form', 'business/orderManage/form', 1, 1, NOW());

-- 4. 创建按钮权限
INSERT INTO sys_menu (name, parent_id, type, permission_key, `order`, is_hidden, create_time) 
VALUES 
  ('订单新增', @order_menu_id, 'button', 'business:order:add', 2, 1, NOW()),
  ('订单编辑', @order_menu_id, 'button', 'business:order:update', 3, 1, NOW()),
  ('订单删除', @order_menu_id, 'button', 'business:order:delete', 4, 1, NOW());

-- 5. 分配权限
INSERT INTO sys_role_menu (roleId, menuId) 
SELECT 1, id FROM sys_menu WHERE permission_key LIKE 'business:order:%';
```

## 总结

### 核心要点

1. **扁平化的关键**：将二级菜单从 `catalog` 改为 `menu` 类型
2. **隐藏子路由**：表单页和按钮权限设置 `is_hidden = 1`
3. **保留层级关系**：虽然侧边栏显示为扁平，但数据库中仍保持父子关系，便于权限管理
4. **前端自动处理**：`SidebarItem.vue` 的 `hasOneShowingChild` 逻辑会自动将"只有隐藏子路由的菜单"渲染为叶子节点

### 适用场景

✅ **适合扁平化的模块**：
- 功能相对简单，只有一个主要列表页
- 不需要在侧边栏展示多个子功能
- 例如：客户管理、订单管理、产品管理

❌ **不适合扁平化的模块**：
- 有多个并列的功能模块
- 需要在侧边栏展示多个子菜单
- 例如：系统管理（包含用户管理、角色管理、菜单管理等多个子功能）

### 最佳实践

1. **保持一致性**：同一级别的模块使用相同的结构
2. **权限标识规范**：遵循 `{module}:{submodule}:{action}` 格式
3. **图标选择**：为每个菜单选择合适的图标，提升用户体验
4. **排序合理**：按照业务重要性或使用频率排序

---

**参考文档**：
- [Nest_Admin菜单开发规范.md](./Nest_Admin菜单开发规范.md)
- [CRM菜单修复执行指南.md](./sql/CRM菜单修复执行指南.md)
- `nest-admin-frontend/src/router/routes.js`
- `nest-admin-frontend/src/layout/components/Sidebar/SidebarItem.vue`

**最后更新**: 2026-04-09
