# CRM 菜单 404 问题修复执行指南

## 问题描述

在 CRM 模块中，点击"新增客户"、"新增互动记录"、"新增销售机会"或"新增合同"按钮时，跳转到表单页面出现 **404 错误**。

## 根本原因

二级菜单（客户管理、互动记录、销售机会、合同管理）被错误地配置为 `menu` 类型，但它们实际上包含子路由（列表页和表单页）。当前端路由生成逻辑遇到 `menu` 类型的菜单时，会尝试直接加载其组件，而不会将其作为路由容器处理子路由，导致子路由（如 `form`）无法被正确识别和渲染。

## 解决方案

将 CRM 下的二级菜单从 `menu` 类型改为 `catalog` 类型，使其作为路由容器，列表页和表单页作为其子菜单存在。

### 菜单层级结构

```
CRM客户管理 (一级菜单, type=catalog)
├── 客户管理 (二级菜单, type=catalog) ← 路由容器
│   ├── 客户列表 (三级菜单, type=menu, path=index, component=business/crm/customerManage/index)
│   ├── 客户表单 (三级菜单, type=menu, path=form, component=business/crm/customerManage/form, is_hidden=1)
│   └── 按钮权限 (type=button, is_hidden=1)
├── 互动记录 (二级菜单, type=catalog) ← 路由容器
│   ├── 互动列表 (三级菜单, type=menu, path=index, component=business/crm/interactionManage/index)
│   ├── 互动表单 (三级菜单, type=menu, path=form, component=business/crm/interactionManage/form, is_hidden=1)
│   └── 按钮权限 (type=button, is_hidden=1)
├── 销售机会 (二级菜单, type=catalog) ← 路由容器
│   ├── 机会列表 (三级菜单, type=menu, path=index, component=business/crm/opportunityManage/index)
│   ├── 机会表单 (三级菜单, type=menu, path=form, component=business/crm/opportunityManage/form, is_hidden=1)
│   └── 按钮权限 (type=button, is_hidden=1)
└── 合同管理 (二级菜单, type=catalog) ← 路由容器
    ├── 合同列表 (三级菜单, type=menu, path=index, component=business/crm/contractManage/index)
    ├── 合同表单 (三级菜单, type=menu, path=form, component=business/crm/contractManage/form, is_hidden=1)
    └── 按钮权限 (type=button, is_hidden=1)
```

## 执行步骤

### 方法一：使用现有修复脚本（推荐）

1. **连接到 MySQL 数据库**
   ```bash
   mysql -u root -p your_database_name
   ```

2. **执行修复脚本**
   ```sql
   source /Users/yyk/工作/代码开发/Project-V2.0/nest-admin/doc/sql/crm_catalog_fix.sql
   ```

   或者复制粘贴整个脚本内容到 MySQL 客户端执行。

3. **验证结果**
   脚本执行完成后，会输出修复后的菜单结构。检查输出确保：
   - 二级菜单的 `二级类型` 列显示为 `catalog`
   - 三级菜单的 `三级类型` 列显示为 `menu` 或 `button`
   - 表单页的 `是否隐藏` 列为 `1`

### 方法二：手动执行 SQL（如需自定义）

如果方法一遇到问题，可以分步手动执行：

#### 步骤 1: 备份当前数据（可选但推荐）

```sql
-- 备份 CRM 相关菜单
CREATE TABLE sys_menu_backup AS SELECT * FROM sys_menu;
CREATE TABLE sys_role_menu_backup AS SELECT * FROM sys_role_menu;
```

#### 步骤 2: 删除现有 CRM 二级和三级菜单

```sql
SET FOREIGN_KEY_CHECKS = 0;

-- 删除三级菜单及其关联
DELETE m3 FROM sys_menu m3
INNER JOIN sys_menu m2 ON m3.parent_id = m2.id
INNER JOIN sys_menu m1 ON m2.parent_id = m1.id
WHERE m1.name = 'CRM客户管理';

-- 删除二级菜单
DELETE m2 FROM sys_menu m2
INNER JOIN sys_menu m1 ON m2.parent_id = m1.id
WHERE m1.name = 'CRM客户管理';

-- 删除权限关联
DELETE rm FROM sys_role_menu rm
INNER JOIN sys_menu m ON rm.menuId = m.id
WHERE m.parent_id IN (
    SELECT tmp.id FROM (
        SELECT id FROM sys_menu WHERE name = 'CRM客户管理'
    ) AS tmp
);

SET FOREIGN_KEY_CHECKS = 1;
```

#### 步骤 3: 重新创建菜单结构

执行完整的 `crm_catalog_fix.sql` 脚本中的插入语句部分。

### 方法三：通过后端 API 修改（如果已实现）

如果系统提供了菜单管理界面，可以：
1. 登录系统，进入"系统管理" → "菜单管理"
2. 找到 CRM 下的四个二级菜单
3. 编辑每个菜单，将"菜单类型"从"菜单"改为"目录"
4. 保存后清除缓存并重新登录

## 前端路由处理逻辑说明

前端 `nest-admin-frontend/src/router/routes.js` 中的 `transRouter` 函数已经正确处理了 `catalog` 类型：

```javascript
if (route.type === 'catalog') {
  // 设置目录路由重定向到首个非隐藏子路由（通常是列表页）
  if (route.children?.length) {
    const visibleChild = route.children.find(c => !c.isHidden)
    if (visibleChild) {
      route.redirect = visibleChild.path
    }
  }
  // 一级目录使用 Layout，二级目录使用 routerView（路由容器）
  if (level == 1) {
    route.component = Layout
  } else {
    route.component = routerView  // ← 关键：二级 catalog 作为路由容器
  }
} else {
  route.component = loadView(route)  // ← menu 类型直接加载组件
}
```

**关键点**：
- `catalog` 类型的二级菜单会被渲染为 `<router-view>`，作为子路由的容器
- 子路由（`index` 和 `form`）会被正确注册为嵌套路由
- 访问 `/crm/customer/form` 时，路由匹配路径为：`/crm` → `/customer` (catalog) → `/form` (menu)

## 验证测试

### 1. 清除浏览器缓存并重新登录

```bash
# 在前端项目中
npm run dev
```

打开浏览器，清除缓存（Ctrl+Shift+Delete），然后重新登录系统。

### 2. 检查控制台输出

打开浏览器开发者工具（F12），查看 Console 面板，应该能看到类似以下的日志：

```
=== Generated Routes ===
[
  {
    "path": "/crm",
    "children": [
      {
        "path": "/crm/customer",
        "type": "catalog",
        "redirect": "/crm/customer/index",
        "children": [
          {
            "path": "/crm/customer/index",
            "type": "menu",
            "component": "business-crm-customerManage-index"
          },
          {
            "path": "/crm/customer/form",
            "type": "menu",
            "isHidden": true,
            "component": "business-crm-customerManage-form"
          }
        ]
      }
      // ... 其他二级菜单
    ]
  }
]
```

### 3. 测试导航

1. **侧边栏导航**：
   - 展开"CRM客户管理"
   - 点击"客户管理"，应自动跳转到客户列表页
   - 点击"互动记录"、"销售机会"、"合同管理"同理

2. **新增按钮跳转**：
   - 在客户列表页点击"新增"按钮
   - 应成功跳转到 `/crm/customer/form` 页面，不再出现 404
   - 测试其他模块的新增按钮

3. **编辑按钮跳转**：
   - 在列表页点击某条记录的"编辑"按钮
   - 应跳转到 `/crm/customer/form?id=xxx`，显示表单并填充数据

4. **浏览器地址栏直接访问**：
   - 直接在地址栏输入 `http://localhost:1995/crm/customer/form`
   - 应能正常显示表单页面

### 4. 检查 Network 面板

在开发者工具的 Network 面板中，确认没有 404 错误的请求。

## 常见问题排查

### Q1: 执行 SQL 后仍然 404

**可能原因**：
1. 浏览器缓存未清除
2. 前端服务未重启
3. 用户角色权限未更新

**解决方法**：
```bash
# 1. 清除浏览器缓存并硬刷新（Ctrl+Shift+R）
# 2. 重启前端开发服务器
npm run dev

# 3. 退出登录，重新登录以获取最新菜单权限
```

### Q2: SQL 执行报错外键约束

**解决方法**：
确保脚本开头有 `SET FOREIGN_KEY_CHECKS = 0;`，结尾有 `SET FOREIGN_KEY_CHECKS = 1;`

### Q3: 侧边栏不显示 CRM 菜单

**可能原因**：当前用户角色没有 CRM 菜单权限

**解决方法**：
```sql
-- 为超级管理员（roleId=1）分配所有 CRM 菜单权限
INSERT INTO sys_role_menu (roleId, menuId) 
SELECT 1, id FROM sys_menu 
WHERE parent_id IN (SELECT id FROM sys_menu WHERE name = 'CRM客户管理')
OR parent_id IN (
    SELECT id FROM sys_menu 
    WHERE parent_id IN (SELECT id FROM sys_menu WHERE name = 'CRM客户管理')
)
ON DUPLICATE KEY UPDATE roleId = roleId;
```

### Q4: 表单页面显示"待开发"

**可能原因**：组件路径不匹配

**解决方法**：
检查数据库中 `component` 字段的值是否与前端实际路径一致：
```sql
-- 查询当前配置
SELECT name, path, component, type 
FROM sys_menu 
WHERE parent_id IN (
    SELECT id FROM sys_menu WHERE name IN ('客户管理', '互动记录', '销售机会', '合同管理')
);

-- 应该看到：
-- component = 'business/crm/customerManage/index'
-- component = 'business/crm/customerManage/form'
-- 等等
```

## 回滚方案

如果修复后出现问题，可以通过以下方式回滚：

```sql
-- 方法 1: 从备份恢复（如果执行了备份）
DROP TABLE sys_menu;
RENAME TABLE sys_menu_backup TO sys_menu;

DROP TABLE sys_role_menu;
RENAME TABLE sys_role_menu_backup TO sys_role_menu;

-- 方法 2: 重新运行原始初始化脚本
source /path/to/original_menu_init.sql
```

## 技术细节

### 为什么 catalog 类型能解决 404？

1. **路由匹配机制**：
   - `menu` 类型：前端会尝试直接加载组件，路径为完整路径
   - `catalog` 类型：前端将其视为路由容器，使用 `<router-view>` 渲染子路由

2. **嵌套路由结构**：
   ```
   /crm (Layout)
   └── /customer (router-view, catalog)
       ├── /index (CustomerList.vue, menu)
       └── /form (CustomerForm.vue, menu, hidden)
   ```

3. **URL 解析**：
   - 访问 `/crm/customer/form` 时
   - Vue Router 逐级匹配：`/crm` → `/customer` → `/form`
   - 如果 `/customer` 是 `menu` 类型，它会有自己的组件，不会再匹配子路由
   - 如果 `/customer` 是 `catalog` 类型，它是 `router-view`，会继续匹配 `/form`

### 前端 loadView 函数

```javascript
const modules = import.meta.glob('../views/**/*.vue')
export const loadView = (route) => {
  for (const path in modules) {
    const dir = path.split('views/')[1].split('.vue')[0]
    if (dir === route.component) {
      return modules[path]  // 返回动态导入函数
    }
  }
  return { render: () => '待开发' }  // 组件不存在时的降级处理
}
```

该函数会将数据库中的 `component` 字段（如 `business/crm/customerManage/form`）映射到实际的 Vue 组件文件。

## 总结

本次修复的核心是将 CRM 二级菜单的类型从 `menu` 改为 `catalog`，使其作为路由容器而非独立页面。这样，列表页和表单页就能作为子路由被正确注册和渲染，解决了 404 问题。

修复后，CRM 模块的路由结构符合 Nest-Admin 的标准实践，与其他业务模块保持一致。
