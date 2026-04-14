# CRM 模块菜单结构说明

## 菜单层级结构

CRM 模块采用**扁平化菜单结构**，所有功能模块都是 CRM Catalog 的直接子菜单，而不是嵌套的多级菜单。

```
CRM客户管理 (catalog, id=150)
├─ 客户管理 (menu, id=151/109)
│   ├─ 列表页: /crm/customer
│   └─ 表单页: /crm/customer/form (隐藏)
│
├─ 互动记录/跟进记录 (menu, id=156/114)  ← 这就是"跟进记录"
│   ├─ 列表页: /crm/interaction
│   └─ 表单页: /crm/interaction/form (隐藏)
│
├─ 销售机会 (menu, id=161/119)
│   ├─ 列表页: /crm/opportunity
│   └─ 表单页: /crm/opportunity/form (隐藏)
│
└─ 合同管理 (menu, id=166/124)
    ├─ 列表页: /crm/contract
    └─ 表单页: /crm/contract/form (隐藏)
```

## 菜单说明

### 1. 客户管理
- **路径**: `/crm/customer`
- **功能**: 管理客户基本信息、联系方式、客户等级等
- **子功能**:
  - 客户列表（可见）
  - 新增/编辑客户表单（隐藏）

### 2. 互动记录（跟进记录）
- **路径**: `/crm/interaction`
- **功能**: 记录与客户的每次互动，如电话沟通、会议、邮件等
- **别名**: 跟进记录、联系记录
- **子功能**:
  - 互动记录列表（可见）
  - 新增/编辑互动表单（隐藏）

### 3. 销售机会
- **路径**: `/crm/opportunity`
- **功能**: 管理潜在的销售机会，跟踪销售 pipeline
- **子功能**:
  - 销售机会列表（可见）
  - 新增/编辑机会表单（隐藏）

### 4. 合同管理
- **路径**: `/crm/contract`
- **功能**: 管理与客户签订的合同
- **子功能**:
  - 合同列表（可见）
  - 新增/编辑合同表单（隐藏）

## 为什么采用扁平结构？

### 优点
1. **导航清晰**: 所有一级功能都在侧边栏直接可见，无需展开多级菜单
2. **访问快捷**: 用户可以直接点击任意功能模块，减少点击次数
3. **符合业务逻辑**: 客户、互动、机会、合同是平级的业务实体，不是从属关系

### 对比嵌套结构
```
❌ 嵌套结构（不推荐）:
CRM客户管理
└─ 客户管理
    ├─ 客户列表
    ├─ 跟进记录
    ├─ 销售机会
    └─ 合同管理

✅ 扁平结构（当前采用）:
CRM客户管理
├─ 客户管理
├─ 跟进记录
├─ 销售机会
└─ 合同管理
```

## 路由跳转规范

所有模块的新增/编辑按钮都使用**绝对路径**进行跳转：

```javascript
// ✅ 正确：使用绝对路径
$refs.rctRef.goRoute(null, '/crm/customer/form')
$refs.rctRef.goRoute(row.id, '/crm/interaction/form')

// ❌ 错误：使用相对路径会导致路径拼接错误
$refs.rctRef.goRoute(null, 'form')  // 会跳转到 /crm/customer/form/form
```

## 数据库配置

菜单在 `sys_menu` 表中的配置示例：

```sql
-- CRM Catalog（一级目录）
INSERT INTO sys_menu (name, path, type, parent_id, ...) 
VALUES ('CRM客户管理', 'crm', 'catalog', NULL, ...);

-- 客户管理（二级菜单）
INSERT INTO sys_menu (name, path, component, type, parent_id, is_hidden, ...) 
VALUES ('客户管理', 'customer', 'business/crm/customerManage/index', 'menu', 150, 0, ...);

-- 客户表单（隐藏菜单）
INSERT INTO sys_menu (name, path, component, type, parent_id, is_hidden, ...) 
VALUES ('客户表单', 'customer/form', 'business/crm/customerManage/form', 'menu', 150, 1, ...);
```

**关键点**:
- 表单页的 `path` 必须包含完整路径前缀（如 `customer/form`）
- 表单页的 `parent_id` 指向 Catalog 的 ID（150），不是列表页的 ID
- 表单页的 `is_hidden = 1`（隐藏在侧边栏中）

## 常见问题

### Q1: 为什么找不到"跟进记录"菜单？
**A**: "跟进记录"就是"互动记录"（interaction），它们在数据库中是同一个功能模块。

### Q2: 点击"新增"按钮跳转到 404？
**A**: 确保使用了绝对路径跳转，如 `/crm/customer/form`，而不是相对路径 `form`。

### Q3: 能否将互动记录作为客户管理的子菜单？
**A**: 可以，但需要重构菜单结构：
1. 创建"客户详情"Catalog
2. 将客户列表、互动记录等作为其子菜单
3. 修改前端路由配置和跳转逻辑

但目前的扁平结构更符合 CRM 系统的最佳实践。

## 参考文件

- 前端路由配置: `nest-admin-frontend/src/router/routes.js`
- 客户管理列表: `nest-admin-frontend/src/views/business/crm/customerManage/index.vue`
- 互动记录列表: `nest-admin-frontend/src/views/business/crm/interactionManage/index.vue`
- 菜单修复SQL: `nest-admin/doc/sql/fix_business_form_paths.sql`
