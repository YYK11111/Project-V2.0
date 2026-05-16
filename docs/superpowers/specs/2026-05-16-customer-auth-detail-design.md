# 客户管理授权查看功能细化方案

## 一、目标

将客户管理的"授权查看"功能从简单的用户列表扩展为包含时间限制、授权状态、授权原因的细粒度权限管理，支持临时授权、自动到期提醒和审计追溯。

## 二、现状 vs 目标

| 要素 | 现状 | 目标 |
|------|------|------|
| 授权类型 | 仅永久 | 永久 + 临时 |
| 授权时间 | 无 | 开始/结束时间 |
| 授权原因 | 无 | 可填写 |
| 授权状态 | 无 | 启用/禁用 |
| 撤销记录 | 无 | 记录撤销人、时间、原因 |
| 到期提醒 | 无 | 站内消息提醒 |
| 到期处理 | 无 | 自动禁用 |

## 三、实体设计

### 3.1 实体字段（customer-viewer.entity.ts）

```typescript
// 新增字段
grantType: string;     // 'permanent' | 'temporary'
startTime: Date;       // 临时授权开始时间
endTime: Date;         // 临时授权结束时间
status: string;        // '0' 禁用 | '1' 启用
grantReason: string;   // 授权原因
grantUserId: string;   // 授权操作人ID
revokeUserId: string;  // 撤销人ID
revokeTime: Date;      // 撤销时间
revokeReason: string;  // 撤销原因
```

### 3.2 索引

```typescript
@Index("idx_crm_customer_viewer_customer_user_source", ["customerId", "userId", "sourceType"])
@Index("idx_crm_customer_viewer_status_endtime", ["status", "endTime"])  // 新增，定时任务扫描用
```

## 四、API 设计

| 接口 | 方法 | 说明 |
|------|------|------|
| `/business/crm/customers/:id/auth` | POST | 新增/批量授权（含时间、原因） |
| `/business/crm/customers/:id/auth/:viewerId` | PUT | 更新授权（修改权限范围或时间） |
| `/business/crm/customers/:id/auth/:viewerId` | DELETE | 撤销授权（带原因） |
| `/business/crm/customers/:id/auth-users` | GET | 获取授权用户列表（含状态和时间） |
| `/business/crm/customers/:id/auth/:viewerId` | GET | 获取授权详情 |
| `/business/crm/customers/:id/auth/status` | PUT | 批量启用/禁用 |
| `/internal/customer-viewers/expiring` | GET | 定时任务获取即将到期的授权 |
| `/internal/customer-viewers/expire` | POST | 定时任务执行到期处理 |

## 五、可见性判断逻辑

```typescript
// 判断用户是否能查看客户
async isViewerActive(viewer: CustomerViewer): boolean {
  if (viewer.status !== '1') return false;
  if (viewer.grantType === 'permanent') return true;
  const now = new Date();
  if (viewer.startTime && viewer.startTime > now) return false;
  if (viewer.endTime && viewer.endTime < now) return false;
  return true;
}
```

## 六、定时任务设计

### 6.1 扫描频率
每小时执行一次

### 6.2 过期处理逻辑
```
扫描条件: status='1' AND grantType='temporary' AND endTime < now
处理动作:
  1. status → '0'
  2. 记录 expireTime
  3. 发送站内消息提醒授权人
```

### 6.3 提醒触发时机
| 时机 | 提前量 |
|------|--------|
| 即将到期提醒 | 7天 |
| 即将到期提醒 | 1天 |
| 当天到期提醒 | 到期当天 |
| 已到期处理 | endTime < now |

## 七、前端交互

### 7.1 授权弹窗布局
- 客户名称展示
- 授权类型切换（永久/临时）
- 临时授权时间选择器
- 权限范围切换（仅查看/可编辑）
- 授权原因输入框
- 已授权用户列表（支持启用/禁用/编辑/撤销）
- 新增用户选择器

### 7.2 授权列表表格字段
| 列 | 说明 |
|----|------|
| 用户 | 姓名 + 部门 |
| 授权类型 | Tag（permanent=蓝，temporary=橙） |
| 权限范围 | Tag |
| 有效期 | 开始~结束 / 永久 |
| 状态 | Tag（1=success，0=warning） |
| 授权原因 | 超长截断 |
| 授权时间 | 创建时间 |
| 操作 | 启用/禁用/编辑/撤销 |

## 八、站内消息接入

### 8.1 消息模板
```
标题: 客户授权即将到期
内容: 您授权给 {用户} 查看客户 {客户名} 的权限将于 {日期} 到期，如需继续使用请重新授权。
```

### 8.2 消息发送时机
- 临时授权到期前 7 天
- 临时授权到期当天
- 临时授权到期后（系统自动处理）

## 九、实施顺序

| 阶段 | 内容 |
|------|------|
| Phase 1 | 后端实体扩展 + 数据库 Migration |
| Phase 2 | 后端可见性逻辑更新 + API 接口 |
| Phase 3 | 前端授权弹窗重构 |
| Phase 4 | 定时任务 + 站内消息接入 |
| Phase 5 | 联调测试 |

## 十、关键文件

### 后端
- `nest-admin/src/modulesBusi/crm/customers/entities/customer-viewer.entity.ts`
- `nest-admin/src/modulesBusi/crm/customers/service.ts`
- `nest-admin/src/modulesBusi/crm/customers/controller.ts`
- `nest-admin/src/common/decorators/customer-viewer-timeout.service.ts` (定时任务)

### 前端
- `nest-admin-frontend/src/views/business/crm/customerManage/index.vue`
- `nest-admin-frontend/src/views/business/crm/customerManage/api.ts`