# Nest Admin 菜单管理功能详解

## 📋 概述

Nest Admin 的菜单管理系统是一个基于树形结构的权限控制模块，支持三级菜单类型（目录、菜单、按钮），通过闭包表（Closure Table）实现高效的树形查询。

## 🏗️ 系统架构

### 后端结构

```
nest-admin/src/modules/menus/
├── menu.entity.ts          # 菜单实体定义
├── menus.controller.ts     # 控制器（API接口）
├── menus.service.ts        # 服务层（业务逻辑）
├── menus.module.ts         # 模块配置
└── dto/
    ├── create-menu.dto.ts  # 创建菜单DTO
    └── update-menu.dto.ts  # 更新菜单DTO
```

### 前端结构

```
nest-admin-frontend/src/views/system/menus/
├── index.vue              # 菜单管理页面
└── api.js                 # API接口调用
```

## 📊 数据库设计

### 表名：`sys_menu`

| 字段 | 类型 | 说明 | 默认值 |
|------|------|------|--------|
| id | bigint | 主键ID | 自增 |
| name | varchar(255) | 菜单名称 | - |
| desc | varchar(100) | 菜单描述 | NULL |
| parent_id | bigint | 父级ID | NULL |
| type | enum | 菜单类型 | 'catalog' |
| path | varchar(100) | 路由地址 | NULL |
| component | varchar(100) | 组件路径 | NULL |
| icon | varchar(100) | 菜单图标 | NULL |
| order | varchar(8) | 排序 | '1' |
| permissionKey | varchar(255) | 权限标识 | NULL |
| is_hidden | char(1) | 是否隐藏 | '0' |
| is_active | char(1) | 是否激活 | '1' |
| is_delete | char(1) | 软删除标记 | NULL |
| create_time | datetime | 创建时间 | CURRENT_TIMESTAMP |
| update_time | datetime | 更新时间 | NULL |
| create_user | varchar(255) | 创建人 | NULL |
| update_user | varchar(255) | 更新人 | NULL |

### 菜单类型枚举

```typescript
export enum MenuType {
  catalog = 'catalog',  // 目录：作为路由容器
  menu = 'menu',        // 菜单：实际页面
  button = 'button',    // 按钮：权限控制
}
```

## 🔧 核心功能

### 1. 树形结构存储

使用 **TypeORM Closure Table** 模式存储树形结构：

```typescript
@Tree('closure-table')
@MyEntity('sys_menu')
export class Menu extends BaseEntity {
  @TreeParent({})
  @JoinColumn({ name: 'parent_id' })
  parent: Menu
  
  @TreeChildren()
  children: Menu[]
}
```

**优势**：
- 高效查询子树和祖先节点
- 支持复杂的树形操作
- 自动维护层级关系

### 2. API接口

#### 基础CRUD接口（继承自BaseController）

```typescript
@Controller('system/menus')
export class MenusController extends BaseController<Menu, MenusService> {
  // GET  /api/system/menus/list      - 获取菜单列表
  // GET  /api/system/menus/getOne/:id - 获取单个菜单
  // POST /api/system/menus/save       - 保存菜单（新增/更新）
  // DELETE /api/system/menus/del/:ids - 删除菜单
}
```

#### 自定义接口

```typescript
// 获取菜单树
@Get('getTrees')
getTrees(@Query() query): Promise<Menu[]> {
  return this.service.list(query)  // 返回树形结构
}

// 获取菜单类型字典
@Get('getTypes')
getTypes() {
  return menuTypes  // { catalog: '目录', menu: '菜单', button: '按钮' }
}
```

### 3. 服务层逻辑

#### 保存菜单

```typescript
async save(createDto: CreateMenuDto) {
  let data = new Menu(createDto)
  
  // 处理父子关系
  if (data.parentId && data.parentId != '0') {
    data.parent = Object.assign(new Menu(), { id: data.parentId })
  } else {
    delete data.parentId  // 根节点
  }
  
  return await super.save(data)
}
```

#### 获取菜单列表（树形）

```typescript
async list(query: QueryListDto = {}, isTree = true) {
  let { isActive, name, type } = query
  
  let queryOrm: FindManyOptions = {
    where: { 
      isActive, 
      type, 
      name: this.sqlLike(name)  // 模糊查询
    },
  }

  let data = await this.repository.find(queryOrm)
  
  // 转换为树形结构
  return isTree ? arrayToTree(data) : data
}
```

## 🎨 前端实现

### 菜单管理页面功能

1. **树形表格展示**
   - 使用 `el-table` 的树形数据展示
   - 支持展开/折叠子节点
   - 显示菜单层级关系

2. **搜索过滤**
   - 按菜单名称模糊搜索
   - 按菜单类型筛选
   - 按启用状态筛选

3. **增删改操作**
   - 新增：可选择上级菜单
   - 编辑：修改菜单属性
   - 删除：支持批量删除（保护admin权限）

4. **表单字段**
   ```vue
   - 上级菜单（树形选择器）
   - 菜单名称（必填）
   - 菜单描述
   - 菜单类型（目录/菜单/按钮）
   - 菜单图标
   - 路由地址
   - 组件路径
   - 权限标识（必填）
   - 排序
   - 是否隐藏
   - 是否启用
   ```

### API调用示例

```javascript
import { getTrees, getTypes, save, del } from './api'

// 获取菜单树
getTrees().then(({ data }) => {
  trees.value = data
})

// 获取菜单类型
getTypes().then(({ data }) => {
  menuTypes.value = data
})

// 保存菜单
save(formData).then(() => {
  $sdk.msgSuccess('保存成功')
})
```

## 🔐 权限控制

### 1. 角色-菜单关联

通过中间表 `sys_role_menu` 实现多对多关系：

```typescript
@ManyToMany((type) => Menu, { cascade: true })
@JoinTable({
  name: 'sys_role_menu',
  joinColumn: { name: 'roleId', referencedColumnName: 'id' },
  inverseJoinColumn: { name: 'menuId', referencedColumnName: 'id' },
})
menus: Menu[]
```

### 2. 按钮权限

按钮类型的菜单用于细粒度权限控制：

```typescript
// 获取所有按钮权限
let menus = await this.menusService.list(
  { isActive: BoolNum.Yes, type: MenuType.button }, 
  false
)
let permissions = menus.flatMap((e) => e.permissionKey || [])
```

### 3. 前端路由生成

根据用户角色的菜单权限动态生成路由：

```javascript
// routes.js
export function getUserRoutes(router) {
  return getLoginUserMenus().then(({ data }) => {
    const userRoutes = transRouter(data)
    userRoutes.forEach((e) => router.addRoute(e))
  })
}
```

## 📝 菜单类型详解

### 1. 目录（catalog）

**用途**：作为路由容器，不直接显示页面

**特点**：
- 通常作为一级或二级菜单
- component 可以为空
- 会自动渲染 `<RouterView>` 显示子路由
- 用于组织菜单结构

**示例**：
```sql
INSERT INTO sys_menu (name, type, path, component, parent_id) 
VALUES ('系统管理', 'catalog', '/system', '', NULL);
```

### 2. 菜单（menu）

**用途**：实际的页面路由

**特点**：
- 必须指定 component 路径
- 可以直接访问
- 可以包含子路由（表单页等）

**示例**：
```sql
INSERT INTO sys_menu (name, type, path, component, parent_id) 
VALUES ('用户管理', 'menu', 'users', 'system/users/index', 5);
```

### 3. 按钮（button）

**用途**：细粒度权限控制

**特点**：
- 不对应路由
- 用于控制页面内的按钮显示/隐藏
- 通过 permissionKey 进行权限判断

**示例**：
```sql
INSERT INTO sys_menu (name, type, permissionKey, parent_id) 
VALUES ('用户新增', 'button', 'system:users:add', 26);
```

## 🔄 菜单与路由的关系

### 前端路由生成规则

```javascript
function transRouter(routesData, parentPath) {
  route.name = route.component?.replace(/\//g, '-')
  
  if (route.type === 'catalog') {
    // 一级目录使用 Layout
    if (level == 1) {
      route.component = Layout
    } else {
      // 二级目录：有component则加载，否则使用RouterView
      route.component = route.component ? loadView(route) : routerView
    }
  } else {
    // menu类型直接加载组件
    route.component = loadView(route)
  }
  
  // 递归处理子路由
  if (route.children?.length) {
    route.children = transRouter(route.children, route.path)
  }
}
```

### 路径拼接规则

- **绝对路径**：以 `/` 开头的路径直接使用
- **相对路径**：拼接父路径 + '/' + 子路径

**示例**：
```
父路由：/crm
子路由：customer
结果：/crm/customer
```

## 💡 最佳实践

### 1. 菜单结构设计

**推荐的2层结构**（参照项目管理）：
```
一级（catalog）: 模块名 (/module)
  ├─ 列表页 (menu, submodule, component: index.vue)
  └─ 表单页 (menu, hidden, submodule/form, component: form.vue)
```

**避免的3层结构**：
```
❌ 一级（catalog）→ 二级（catalog）→ 三级（menu）
   会导致路由名称冲突和渲染问题
```

### 2. 权限标识命名规范

采用 `模块:功能:操作` 的格式：
```
system:users:add      # 系统管理-用户-新增
system:users:edit     # 系统管理-用户-编辑
system:users:delete   # 系统管理-用户-删除
business:projects:view # 业务管理-项目-查看
```

### 3. 组件路径规范

```
views/
├── system/           # 系统管理模块
│   ├── users/
│   │   └── index.vue
│   └── roles/
│       └── index.vue
└── business/         # 业务管理模块
    ├── projects/
    │   ├── index.vue
    │   └── form.vue
    └── tasks/
        ├── index.vue
        └── form.vue
```

组件路径填写：`system/users/index` 或 `business/projects/form`

### 4. 图标使用

使用 SVG 图标，图标名为文件名（不含扩展名）：
```
src/assets/icons/svg/
├── user.svg
├── role.svg
├── menu.svg
└── ...
```

填写图标名：`user`、`role`、`menu` 等

## 🔍 常见问题

### Q1: 为什么菜单修改后前端不生效？

**A**: 需要重新登录或刷新浏览器缓存，因为路由是在登录时动态生成的。

### Q2: 如何添加新的顶级菜单？

**A**: 
1. 在菜单管理页面点击"新增"
2. 上级菜单选择"主类目"（parentId = 0）
3. 类型选择"目录"
4. 填写路由地址（如 `/mymodule`）

### Q3: 按钮权限如何使用？

**A**:
```vue
<template>
  <el-button v-if="hasPermission('system:users:add')">新增</el-button>
</template>

<script setup>
import { hasPermission } from '@/utils/permission'
</script>
```

### Q4: 如何隐藏菜单但保留权限？

**A**: 设置 `is_hidden = 1`，菜单不会显示在侧边栏，但仍然可以访问和用于权限控制。

### Q5: 菜单排序如何工作？

**A**: `order` 字段为字符串类型，按字典序排序。建议使用数字字符串：'1', '2', '10' 等。

## 📚 相关文档

- [CRM表单404最终修复说明.md](./CRM表单404最终修复说明.md)
- [部门管理模块实现说明.md](./部门管理模块实现说明.md)
- [基于Nest-Admin开发项目管理系统 完整设计方案.md](./基于Nest-Admin开发项目管理系统 完整设计方案.md)

## 🎯 总结

Nest Admin 的菜单管理系统提供了：
- ✅ 灵活的树形结构管理
- ✅ 三种菜单类型支持
- ✅ 完善的权限控制机制
- ✅ 动态路由生成
- ✅ 直观的可视化界面

通过合理设计菜单结构，可以实现复杂的多级菜单和精细的权限控制。
