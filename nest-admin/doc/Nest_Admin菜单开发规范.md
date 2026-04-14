# Nest Admin 菜单开发规范

## 核心原则

**在 Nest Admin 项目中开发新功能时，必须严格复用框架原生的菜单管理模块，禁止创建独立的菜单管理逻辑或表结构。**

## 一、原生菜单模块架构

### 1.1 后端菜单模块

**位置**: `nest-admin/src/modules/menus/`

**核心文件**:
- `menus.controller.ts` - 菜单控制器
- `menus.service.ts` - 菜单服务
- `menu.entity.ts` - 菜单实体（对应 `sys_menu` 表）
- `dto/create-menu.dto.ts` - 创建菜单 DTO
- `dto/update-menu.dto.ts` - 更新菜单 DTO

**数据库表**: `sys_menu` (定义在 `nest-admin/doc/sql/sys_menu.sql`)

### 1.2 前端菜单模块

**位置**: `nest-admin-frontend/src/views/system/menus/`

**核心文件**:
- `api.ts` - 菜单 API 接口定义
- `index.vue` - 菜单管理页面
- `components/MenuForm.vue` - 菜单表单组件

**关键 API**:
```typescript
// nest-admin-frontend/src/views/system/menus/api.ts
export const getTrees = () => get(`${serve}/getTrees`)  // 获取菜单树
export const getOne = (id) => get(`${serve}/getOne/${id}`)  // 获取单个菜单
export const save = (data) => post(`${serve}/save`, data)  // 保存菜单
export const update = (data) => put(`${serve}/update`, data)  // 更新菜单
export const del = (id) => del(`${serve}/del/${id}`)  // 删除菜单
```

### 1.3 权限体系

**RBAC 权限模型**:
```
用户 (sys_user) 
  ↓ (多对多)
角色 (sys_role) 
  ↓ (多对多 via sys_role_menu)
菜单/权限 (sys_menu)
```

**关联表**:
- `sys_user` - 用户表
- `sys_role` - 角色表
- `sys_user_role` - 用户角色关联表
- `sys_menu` - 菜单表
- `sys_role_menu` - 角色菜单关联表

## 二、菜单类型说明

### 2.1 三种菜单类型

定义在 `nest-admin/src/modules/menus/menu.entity.ts`:

```typescript
export enum MenuType {
  catalog = 'catalog',  // 目录：路由容器，无实际组件
  menu = 'menu',        // 菜单：实际页面组件
  button = 'button',    // 按钮：权限标识，不显示在菜单中
}
```

### 2.2 各类型用途

| 类型 | 用途 | component | path | is_hidden | 示例 |
|------|------|-----------|------|-----------|------|
| **catalog** | 路由容器/分组 | 空字符串 | 有 | 0 | "客户管理"、"项目管理" |
| **menu** | 实际页面 | Vue 组件路径 | 有 | 0/1 | "客户列表"(0)、"客户表单"(1) |
| **button** | 按钮权限 | 空字符串 | 空 | 1 | "客户新增"、"客户编辑" |

### 2.3 典型菜单层级结构

```
一级菜单 (catalog, component=Layout)
└── 二级菜单 (catalog, component=routerView)  ← 路由容器
    ├── 列表页 (menu, path=index, is_hidden=0)
    ├── 表单页 (menu, path=form, is_hidden=1)  ← 隐藏路由
    └── 按钮权限 (button, is_hidden=1)
        ├── 新增权限
        ├── 编辑权限
        └── 删除权限
```

**示例：CRM 客户管理**
```sql
-- 一级：CRM客户管理 (catalog)
INSERT INTO sys_menu (name, parent_id, type, path, component, icon, order) 
VALUES ('CRM客户管理', '0', 'catalog', 'crm', '', 'crm', 1);

-- 二级：客户管理 (catalog) - 路由容器
INSERT INTO sys_menu (name, parent_id, type, path, component, icon, order) 
VALUES ('客户管理', @crm_id, 'catalog', 'customer', '', 'peoples', 1);

-- 三级：客户列表 (menu) - 实际页面
INSERT INTO sys_menu (name, parent_id, type, path, component, icon, order, is_hidden) 
VALUES ('客户列表', @customer_catalog_id, 'menu', 'index', 'business/crm/customerManage/index', '', 1, 0);

-- 三级：客户表单 (menu) - 隐藏路由
INSERT INTO sys_menu (name, parent_id, type, path, component, icon, order, is_hidden) 
VALUES ('客户表单', @customer_catalog_id, 'menu', 'form', 'business/crm/customerManage/form', '', 2, 1);

-- 三级：按钮权限 (button)
INSERT INTO sys_menu (name, parent_id, type, permission_key, order, is_hidden) 
VALUES ('客户新增', @customer_catalog_id, 'button', 'crm:customer:add', 3, 1);
```

## 三、开发新功能的标准流程

### 3.1 步骤一：设计菜单结构

在开发新业务模块前，先规划菜单层级：

```
业务模块名称 (一级 catalog)
├── 子模块1 (二级 catalog)
│   ├── 列表页 (menu)
│   ├── 表单页 (menu, hidden)
│   └── 按钮权限 (button)
└── 子模块2 (二级 catalog)
    ├── 列表页 (menu)
    ├── 表单页 (menu, hidden)
    └── 按钮权限 (button)
```

### 3.2 步骤二：创建 SQL 初始化脚本

在 `nest-admin/doc/sql/` 目录下创建菜单初始化脚本：

**文件命名**: `{module}_menu_init.sql`

**示例**: `project_menu_init.sql`

```sql
-- ============================================
-- 项目管理模块菜单初始化
-- ============================================

-- 1. 查找或创建一级菜单：项目管理
SET @parent_id = (SELECT id FROM sys_menu WHERE name = '业务管理' LIMIT 1);

-- 如果不存在"业务管理"，则创建
IF @parent_id IS NULL THEN
  INSERT INTO sys_menu (name, parent_id, type, path, component, icon, `order`, is_hidden, permission_key, create_time) 
  VALUES ('业务管理', '0', 'catalog', 'business', '', 'business', 10, 0, 'business', NOW());
  SET @parent_id = LAST_INSERT_ID();
END IF;

-- 2. 创建一级菜单：项目管理 (catalog)
INSERT INTO sys_menu (name, parent_id, type, path, component, icon, `order`, is_hidden, permission_key, create_time) 
VALUES ('项目管理', @parent_id, 'catalog', 'project', '', 'project', 1, 0, 'business:project', NOW());

SET @project_catalog_id = LAST_INSERT_ID();

-- 3. 创建二级菜单：项目列表 (catalog) - 路由容器
INSERT INTO sys_menu (name, parent_id, type, path, component, icon, `order`, is_hidden, permission_key, create_time) 
VALUES ('项目列表', @project_catalog_id, 'catalog', 'list', '', 'list', 1, 0, 'business:project:list', NOW());

SET @project_list_catalog_id = LAST_INSERT_ID();

-- 4. 创建三级菜单：项目列表页 (menu)
INSERT INTO sys_menu (name, parent_id, type, path, component, icon, `order`, is_hidden, permission_key, create_time) 
VALUES ('查看项目', @project_list_catalog_id, 'menu', 'index', 'business/projectManage/index', '', 1, 0, 'business:project:view', NOW());

SET @project_view_id = LAST_INSERT_ID();

-- 5. 创建三级菜单：项目表单页 (menu, hidden)
INSERT INTO sys_menu (name, parent_id, type, path, component, icon, `order`, is_hidden, permission_key, create_time) 
VALUES ('编辑项目', @project_list_catalog_id, 'menu', 'form', 'business/projectManage/form', '', 2, 1, 'business:project:edit', NOW());

-- 6. 创建按钮权限 (button)
INSERT INTO sys_menu (name, parent_id, type, permission_key, `order`, is_hidden, create_time) 
VALUES 
  ('项目新增', @project_list_catalog_id, 'button', 'business:project:add', 3, 1, NOW()),
  ('项目编辑', @project_list_catalog_id, 'button', 'business:project:update', 4, 1, NOW()),
  ('项目删除', @project_list_catalog_id, 'button', 'business:project:delete', 5, 1, NOW());

-- 7. 为超级管理员分配权限 (roleId=1)
INSERT INTO sys_role_menu (roleId, menuId) 
SELECT 1, id FROM sys_menu 
WHERE permission_key LIKE 'business:project%'
ON DUPLICATE KEY UPDATE roleId = roleId;

-- 8. 验证结果
SELECT 
  m1.name as '一级菜单',
  m2.name as '二级菜单',
  m3.name as '三级菜单',
  m3.type as '类型',
  m3.path as '路径',
  m3.component as '组件',
  m3.is_hidden as '隐藏',
  m3.permission_key as '权限标识'
FROM sys_menu m1
LEFT JOIN sys_menu m2 ON m2.parent_id = m1.id
LEFT JOIN sys_menu m3 ON m3.parent_id = m2.id
WHERE m1.name = '项目管理' OR m2.name = '项目管理'
ORDER BY m1.id, m2.`order`, m3.`order`;
```

### 3.3 步骤三：执行 SQL 脚本

```bash
# 连接到数据库
mysql -u root -p your_database_name

# 执行初始化脚本
source /path/to/project_menu_init.sql
```

### 3.4 步骤四：前端开发

#### 3.4.1 创建业务组件

按照标准目录结构创建组件：

```
nest-admin-frontend/src/views/business/{module}/
├── index.vue      # 列表页
├── form.vue       # 表单页
└── api.ts         # API 接口
```

#### 3.4.2 使用原生菜单 API

**禁止**创建独立的菜单管理逻辑，**必须**使用原生 API：

```typescript
// ✅ 正确：使用原生菜单 API
import { getTrees } from '@/views/system/menus/api'

// 获取菜单树
const menus = await getTrees()

// ❌ 错误：创建独立的菜单查询
import request from '@/utils/request'
const customMenus = await request.get('/custom/menus')  // 禁止！
```

#### 3.4.3 路由跳转规范

使用 `RequestChartTable` 组件的 `goRoute` 方法或 `vue-router`：

```vue
<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import RequestChartTable from '@/components/RequestChartTable.vue'

const router = useRouter()
const rctRef = ref()

// 方法1：使用 RequestChartTable 的 goRoute
const handleAdd = () => {
  rctRef.value.goRoute(null, 'form')  // 跳转到 form 子路由
}

const handleEdit = (id) => {
  rctRef.value.goRoute(id, 'form')  // 跳转到 form?id=xxx
}

// 方法2：直接使用 vue-router
const handleDesign = (row) => {
  router.push({
    path: '/workflow/designer',
    query: { id: row.id }
  })
}
</script>

<template>
  <RequestChartTable ref="rctRef" :request="getList">
    <template #operation>
      <el-button type="primary" @click="handleAdd">新增</el-button>
    </template>
    
    <template #tableOperation="{ row }">
      <el-button link type="primary" @click="handleEdit(row.id)">编辑</el-button>
    </template>
  </RequestChartTable>
</template>
```

### 3.5 步骤五：权限控制

在组件中使用权限标识：

```vue
<script setup>
import { useUserStore } from '@/stores/user'

const userStore = useUserStore()

// 检查是否有某个权限
const hasPermission = (permissionKey) => {
  return userStore.permissions.includes(permissionKey)
}
</script>

<template>
  <!-- 根据权限显示按钮 -->
  <el-button v-if="hasPermission('business:project:add')" @click="handleAdd">
    新增
  </el-button>
  
  <el-button v-if="hasPermission('business:project:update')" @click="handleEdit">
    编辑
  </el-button>
  
  <el-button v-if="hasPermission('business:project:delete')" @click="handleDelete">
    删除
  </el-button>
</template>
```

## 四、常见错误及避免方法

### ❌ 错误1：创建独立的菜单表

```sql
-- ❌ 错误：创建自定义菜单表
CREATE TABLE my_module_menus (
  id INT PRIMARY KEY,
  name VARCHAR(100),
  ...
);

-- ✅ 正确：使用原生 sys_menu 表
INSERT INTO sys_menu (name, parent_id, type, ...) VALUES (...);
```

### ❌ 错误2：硬编码前端路由

```javascript
// ❌ 错误：在 routes.js 中硬编码业务路由
{
  path: '/my-module',
  component: Layout,
  children: [...]
}

// ✅ 正确：通过后端动态获取菜单，由 transRouter 自动转换
// 只需在数据库中配置菜单，前端会自动生成路由
```

### ❌ 错误3：catalog 类型配置错误

```sql
-- ❌ 错误：catalog 类型设置了 component
INSERT INTO sys_menu (name, type, path, component) 
VALUES ('客户管理', 'catalog', 'customer', 'business/crm/customerManage/index');

-- ✅ 正确：catalog 类型的 component 应为空字符串
INSERT INTO sys_menu (name, type, path, component) 
VALUES ('客户管理', 'catalog', 'customer', '');
```

### ❌ 错误4：表单页未设置为隐藏

```sql
-- ❌ 错误：表单页 is_hidden=0，会在侧边栏显示
INSERT INTO sys_menu (name, type, path, is_hidden) 
VALUES ('客户表单', 'menu', 'form', 0);

-- ✅ 正确：表单页应设置 is_hidden=1
INSERT INTO sys_menu (name, type, path, is_hidden) 
VALUES ('客户表单', 'menu', 'form', 1);
```

### ❌ 错误5：忘记分配角色权限

```sql
-- ❌ 错误：只创建了菜单，没有分配给角色
INSERT INTO sys_menu (...) VALUES (...);

-- ✅ 正确：创建菜单后，为角色分配权限
INSERT INTO sys_role_menu (roleId, menuId) 
SELECT 1, id FROM sys_menu WHERE permission_key LIKE 'your:module:%';
```

## 五、菜单配置最佳实践

### 5.1 权限标识命名规范

格式：`{module}:{submodule}:{action}`

示例：
- `crm:customer:add` - CRM 客户新增
- `crm:customer:update` - CRM 客户编辑
- `crm:customer:delete` - CRM 客户删除
- `project:task:view` - 项目任务查看
- `workflow:definition:publish` - 工作流定义发布

### 5.2 图标选择

使用系统内置图标（参考 `nest-admin-frontend/src/icons/svg/`）：

常用图标：
- `peoples` - 客户/人员
- `list` - 列表
- `form` - 表单
- `edit` - 编辑
- `delete` - 删除
- `document` - 文档/合同
- `phone` - 电话/互动
- `opportunity` - 机会
- `project` - 项目
- `workflow` - 工作流

### 5.3 排序规则

- 一级菜单：10, 20, 30...（预留中间值便于插入）
- 二级菜单：1, 2, 3, 4...
- 三级菜单：1 (列表), 2 (表单), 3+ (按钮权限)

### 5.4 隐藏路由说明

以下路由应设置 `is_hidden=1`：
1. 表单页（`form`）
2. 详情页（`detail`）
3. 按钮权限（`type=button`）
4. 其他非导航页面

## 六、调试与验证

### 6.1 检查菜单是否正确加载

```javascript
// 在浏览器控制台执行
console.log('当前用户菜单:', useMenusStore().routes)
console.log('侧边栏路由:', useMenusStore().sidebarRouters)
```

### 6.2 检查路由生成日志

前端 `routes.js` 中有详细日志：

```javascript
console.log('=== Generated Routes ===', JSON.stringify(userRoutes, null, 2))
```

### 6.3 验证菜单树结构

```sql
-- 查询完整菜单树
SELECT 
  m1.id as 'L1_ID',
  m1.name as 'L1_名称',
  m1.type as 'L1_类型',
  m2.id as 'L2_ID',
  m2.name as 'L2_名称',
  m2.type as 'L2_类型',
  m2.path as 'L2_路径',
  m3.id as 'L3_ID',
  m3.name as 'L3_名称',
  m3.type as 'L3_类型',
  m3.path as 'L3_路径',
  m3.component as '组件',
  m3.is_hidden as '隐藏',
  m3.permission_key as '权限'
FROM sys_menu m1
LEFT JOIN sys_menu m2 ON m2.parent_id = m1.id
LEFT JOIN sys_menu m3 ON m3.parent_id = m2.id
WHERE m1.name = '你的模块名'
ORDER BY m1.id, m2.`order`, m3.`order`;
```

### 6.4 检查角色权限

```sql
-- 检查超级管理员是否有某模块的权限
SELECT 
  m.name as '菜单名称',
  m.type as '类型',
  m.permission_key as '权限标识',
  rm.roleId as '角色ID'
FROM sys_menu m
LEFT JOIN sys_role_menu rm ON rm.menuId = m.id
WHERE m.permission_key LIKE 'your:module:%'
  AND rm.roleId = 1;
```

## 七、常见问题解答

### Q1: 为什么我的菜单在侧边栏不显示？

**可能原因**:
1. 菜单的 `is_hidden=1`
2. 当前用户角色没有该菜单权限
3. 菜单的 `isActive=0`（未激活）

**解决方法**:
```sql
-- 检查菜单状态
SELECT name, type, is_hidden, isActive FROM sys_menu WHERE name = '你的菜单';

-- 检查角色权限
SELECT * FROM sys_role_menu WHERE menuId IN (
  SELECT id FROM sys_menu WHERE name = '你的菜单'
);
```

### Q2: 点击菜单后出现 404 错误？

**可能原因**:
1. catalog 类型的菜单错误地配置了 component
2. 子路由的 path 拼接错误
3. 前端组件路径不正确

**解决方法**:
1. 确保 catalog 的 `component=''`
2. 检查 `transRouter` 生成的路由路径
3. 验证组件文件是否存在于 `src/views/` 目录

### Q3: 如何为已有模块添加新的子菜单？

**步骤**:
```sql
-- 1. 找到父菜单 ID
SET @parent_id = (SELECT id FROM sys_menu WHERE name = '父菜单名称');

-- 2. 插入新菜单
INSERT INTO sys_menu (name, parent_id, type, path, component, icon, `order`, is_hidden, permission_key, create_time) 
VALUES ('新菜单', @parent_id, 'menu', 'new-path', 'path/to/component', 'icon', 99, 0, 'module:new:perm', NOW());

-- 3. 为角色分配权限
INSERT INTO sys_role_menu (roleId, menuId) 
SELECT DISTINCT roleId, LAST_INSERT_ID() FROM sys_role_menu 
WHERE menuId = @parent_id;
```

### Q4: 如何修改菜单的显示顺序？

```sql
-- 修改菜单排序
UPDATE sys_menu SET `order` = 新顺序 WHERE id = 菜单ID;

-- 注意：修改后需要重新登录或刷新权限缓存
```

### Q5: catalog 和 menu 类型的区别是什么？

| 特性 | catalog | menu |
|------|---------|------|
| 用途 | 路由容器/分组 | 实际页面 |
| component | 空字符串（前端自动设为 routerView） | Vue 组件路径 |
| 侧边栏显示 | 可展开的父菜单 | 可点击的叶子节点 |
| 子路由 | 可以有 | 通常没有 |
| 重定向 | 自动重定向到第一个可见子路由 | 无 |

## 八、总结

### 核心要点

1. **唯一数据源**: 所有菜单配置必须在 `sys_menu` 表中
2. **唯一管理入口**: 使用 `nest-admin/src/modules/menus` 模块管理菜单
3. **唯一 API**: 使用 `nest-admin-frontend/src/views/system/menus/api.ts` 中的接口
4. **类型正确**: catalog 作为路由容器，menu 作为实际页面，button 作为权限标识
5. **权限同步**: 创建菜单后务必为角色分配权限

### 开发检查清单

- [ ] 菜单 SQL 脚本已创建并执行
- [ ] 菜单类型（catalog/menu/button）配置正确
- [ ] catalog 的 component 为空字符串
- [ ] 表单页的 is_hidden=1
- [ ] 权限标识符合命名规范
- [ ] 已为角色分配菜单权限
- [ ] 前端组件路径与数据库配置一致
- [ ] 在浏览器控制台验证菜单和路由生成正确
- [ ] 测试菜单点击、路由跳转、权限控制功能正常

---

**最后更新**: 2026-04-09  
**维护者**: 开发团队  
**参考文档**: 
- `nest-admin/doc/sql/sys_menu.sql`
- `nest-admin/doc/sql/crm_catalog_fix.sql`
- `nest-admin-frontend/src/router/routes.js`
