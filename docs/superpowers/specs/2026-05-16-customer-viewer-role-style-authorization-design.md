# 客户授权查看角色式管理页设计

## 背景

客户管理当前的授权查看使用 `AuthDialog.vue` 弹窗集中维护授权人。这个模型会把所有已授权人员当作同一组表单状态处理，并从第一条授权记录读取授权类型、有效期、是否可编辑和授权原因。多次授权、每次授权不同人员时，这种模型无法表达“每次授权记录”，也容易在再次提交时覆盖既有授权语义。

用户明确要求参考角色管理授权方式，不使用弹窗作为主流程，而是进入独立授权管理列表页。角色管理的现有模式是：

- 已授权用户列表：`authUser/allocatedList`
- 未授权用户选择页内弹窗：`authUser/unallocatedList`
- 新增授权：`authUser/selectAll`
- 单个取消授权：`authUser/cancel`
- 批量取消授权：`authUser/cancelAll`

客户授权查看应采用同类交互：客户列表进入授权管理页，页面内维护当前授权人员和每次授权记录。

## 目标

实现客户授权查看的列表式管理：

- 客户列表点击“授权查看”跳转到独立授权管理页。
- 页面展示当前已授权人员，支持新增授权、单个取消授权、批量取消授权。
- 新增授权时可以一次选择多个未授权用户，并填写本次授权配置。
- 页面展示每次授权和取消授权记录，能追溯每次操作的操作人、时间、人员、原因和配置。
- 当前客户可见性和可编辑判断继续基于当前授权快照，不依赖历史记录。

## 非目标

- 不重做客户详情、客户审批、客户列表可见性的大范围权限模型。
- 不把历史记录作为权限判断来源。
- 不再继续扩展旧的 `AuthDialog.vue` 表单模型。

## 前端设计

### 路由与入口

新增客户授权管理页：

```text
/crm/customerManage/auth/:customerId
```

客户列表操作列“授权查看”不再打开 `AuthDialog.vue`，改为跳转授权管理页：

```ts
router.push(`/crm/customerManage/auth/${row.id}`)
```

页面文件：

```text
nest-admin-frontend/src/views/business/crm/customerManage/auth.vue
nest-admin-frontend/src/views/business/crm/customerManage/selectAuthUser.vue
```

`AuthDialog.vue` 不再作为客户列表入口使用。可以先保留文件，等新页面稳定后删除。

### 授权管理页结构

`auth.vue` 参考 `src/views/system/roles/authUser.vue`：

- 使用 `RequestChartTable` 展示当前已授权人员。
- 顶部操作区提供“新增授权”“批量取消授权”“返回”。
- 操作列提供“取消授权”。
- 页面上方展示客户基础信息：客户名称、客户编号、联系人、状态。
- 下方增加“授权记录”区域或 Tab，展示历史记录。

当前已授权人员表格字段：

```text
选择框
用户账号
用户昵称
部门
手机
授权类型
开始时间
结束时间
是否可编辑
授权人
授权时间
状态
操作：取消授权
```

授权记录表格字段：

```text
操作时间
操作人
操作类型
授权对象
授权人数
授权类型
有效期
是否可编辑
原因
状态
```

一次授权多人时，授权记录按同一个批次展示为一行，并允许展开查看人员明细。

### 新增授权选择页

`selectAuthUser.vue` 参考 `src/views/system/roles/selectUser.vue`：

- 使用 `BaDialog` + `RequestChartTable`。
- 查询未授权用户列表。
- 支持多选用户。
- 在选择用户列表上方或下方展示本次授权配置表单。

本次授权配置：

```text
授权类型：永久 / 临时
开始时间：临时授权必填
结束时间：临时授权必填
允许编辑：是 / 否
授权原因：可选
```

确认时提交：

```ts
{
  userIds: selectedIds,
  grantType,
  startTime,
  endTime,
  canEdit: canEdit ? "1" : "0",
  grantReason
}
```

### 前端 API

在 `customerManage/api.ts` 增加：

```ts
export function getAllocatedViewerList(customerId, params) {
  return request.get(`/business/crm/customers/${customerId}/viewers/allocatedList`, params)
}

export function getUnallocatedViewerList(customerId, params) {
  return request.get(`/business/crm/customers/${customerId}/viewers/unallocatedList`, params)
}

export function grantCustomerViewers(customerId, data) {
  return request.post(`/business/crm/customers/${customerId}/viewers/selectAll`, data)
}

export function cancelCustomerViewer(customerId, data) {
  return request.put(`/business/crm/customers/${customerId}/viewers/cancel`, data)
}

export function cancelCustomerViewers(customerId, data) {
  return request.put(`/business/crm/customers/${customerId}/viewers/cancelAll`, data)
}

export function getCustomerViewerRecords(customerId, params) {
  return request.get(`/business/crm/customers/${customerId}/viewers/records`, params)
}
```

## 后端设计

### 当前授权快照

继续使用现有表：

```text
crm_customer_viewer
```

用途：

- 判断当前用户是否能查看客户。
- 判断当前用户是否能编辑客户。
- 当前已授权人员列表的数据源。

### 授权历史记录

新增实体和表：

```text
crm_customer_viewer_record
```

字段：

```text
id
customer_id
batch_no
action_type
viewer_id
user_id
grant_type
start_time
end_time
can_edit
grant_reason
revoke_reason
operator_id
operator_name
operate_time
status
create_time
update_time
is_delete
```

`action_type`：

```text
grant
revoke
revokeAll
expire
enable
disable
```

设计约束：

- 每一次新增授权生成一个 `batch_no`。
- 一次授权多人时，为每个用户写一条历史记录，`batch_no` 相同。
- 历史记录只追加，不覆盖、不删除。
- 历史记录不参与权限判断。

### 后端接口

新增接口：

```text
GET  /business/crm/customers/:id/viewers/allocatedList
GET  /business/crm/customers/:id/viewers/unallocatedList
POST /business/crm/customers/:id/viewers/selectAll
PUT  /business/crm/customers/:id/viewers/cancel
PUT  /business/crm/customers/:id/viewers/cancelAll
GET  /business/crm/customers/:id/viewers/records
```

接口职责：

- `allocatedList`：查询当前手工授权人员。
- `unallocatedList`：查询尚未处于有效手工授权状态的用户。
- `selectAll`：新增一批授权，更新当前快照并写历史。
- `cancel`：取消单个授权，禁用当前快照并写历史。
- `cancelAll`：批量取消授权，禁用当前快照并写历史。
- `records`：按批次返回授权历史。

旧接口暂时保留兼容：

```text
POST /business/crm/customers/grantViewAccess
POST /business/crm/customers/revokeViewAccess
GET  /business/crm/customers/:id/auth-users
```

新页面不再使用旧接口。

### 服务层职责

`CustomersService` 增加方法：

```ts
allocatedViewerList(customerId, query, operator)
unallocatedViewerList(customerId, query, operator)
selectCustomerViewers(customerId, dto, operator)
cancelCustomerViewer(customerId, dto, operator)
cancelCustomerViewers(customerId, dto, operator)
viewerRecords(customerId, query, operator)
```

新增授权流程：

1. 校验操作人对客户有编辑权限。
2. 去重并过滤空 `userIds`。
3. 生成 `batchNo`。
4. 对每个用户调用当前快照写入逻辑：
   - 不存在则新增 `crm_customer_viewer`。
   - 已存在则重新启用并更新本次授权配置。
5. 每个用户写一条 `crm_customer_viewer_record`，记录同一个 `batchNo`。
6. 返回本批次授权结果。

取消授权流程：

1. 校验操作人对客户有编辑权限。
2. 禁用指定当前授权快照。
3. 写一条或多条 `crm_customer_viewer_record`。
4. 返回取消数量。

历史查询流程：

1. 校验操作人对客户有查看权限。
2. 查询 `crm_customer_viewer_record`。
3. 按 `batch_no` 聚合。
4. 返回批次列表，每个批次包含 `items` 明细。

## 权限设计

守卫映射：

```text
GET  viewers/allocatedList   -> business/crm/customers/getOne
GET  viewers/unallocatedList -> business/crm/customers/update
POST viewers/selectAll       -> business/crm/customers/update
PUT  viewers/cancel          -> business/crm/customers/update
PUT  viewers/cancelAll       -> business/crm/customers/update
GET  viewers/records         -> business/crm/customers/getOne
```

服务层仍做客户级二次权限校验，避免只靠菜单权限。

## 数据迁移

为现有 `crm_customer_viewer` 中 `source_type = manual` 的记录补一批历史：

- `batch_no` 使用固定前缀加记录 ID，例如 `legacy-{viewerId}`。
- `action_type = grant`。
- `operate_time` 优先使用 `create_time`。
- `operator_id` 使用 `grant_user_id`，为空则使用 `create_user`。
- 无法还原真实批次关系的旧数据按单条记录生成历史。

## 测试方案

后端单元测试：

- 多人新增授权会更新多个当前授权快照。
- 多人新增授权会写入同一个 `batchNo` 的多条历史记录。
- 重复授权同一人不会删除历史，会新增一条新的授权历史。
- 单个取消授权会禁用当前授权并写取消历史。
- 批量取消授权会写同一个批次的多条取消历史。
- 历史查询按批次返回。
- 守卫正确映射新增接口权限。

前端单元测试：

- 客户列表“授权查看”跳转授权管理页。
- 授权管理页包含新增授权、批量取消授权、返回按钮。
- 新增授权组件使用未授权用户列表。
- 确认授权会提交多选用户和本次授权配置。
- 授权记录区域展示历史记录，不再依赖 `firstAuth`。

## 实施顺序

1. 后端新增授权历史实体和服务测试。
2. 后端实现当前授权列表、未授权列表、授权、取消、历史接口。
3. 后端补守卫映射和控制器测试。
4. 前端新增授权管理页和选择用户组件。
5. 前端客户列表入口改为跳转新页面。
6. 前端移除 `AuthDialog.vue` 入口依赖。
7. 补充前后端验证。

## 风险与处理

- 旧数据没有真实批次：迁移时按单条历史处理，避免伪造批次。
- 当前授权和历史不一致：权限判断只依赖当前快照，历史只用于审计展示。
- 重复授权同一人：允许重复授权并保留历史，当前快照更新为最新配置。
- 临时授权过期：定时任务禁用快照时同步写 `expire` 历史记录。

