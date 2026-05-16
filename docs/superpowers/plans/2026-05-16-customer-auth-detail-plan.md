# 客户管理授权查看功能细化 - 实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 实现客户授权查看的细粒度管理，支持临时授权、授权时间范围、授权原因、状态控制和到期自动提醒。

**Architecture:**
- 后端：扩展 `CustomerViewer` 实体字段，更新可见性判断逻辑，新增定时任务处理授权到期
- 前端：重构授权弹窗，增加授权类型/时间/原因/状态管理界面
- 消息：复用现有 `MessagesService.sendMessage()` 接口发送站内消息提醒

**Tech Stack:** NestJS + TypeORM + Element Plus + Vue 3

---

## 文件结构

```
Backend:
- nest-admin/src/modulesBusi/crm/customers/entities/customer-viewer.entity.ts  [修改]
- nest-admin/src/modulesBusi/crm/customers/service.ts                         [修改]
- nest-admin/src/modulesBusi/crm/customers/controller.ts                      [修改]
- nest-admin/src/modulesBusi/crm/customers/customer-viewer-timeout.service.ts [新建]
- nest-admin/src/modulesBusi/crm/customers/module.ts                          [修改]

Frontend:
- nest-admin-frontend/src/views/business/crm/customerManage/api.ts            [修改]
- nest-admin-frontend/src/views/business/crm/customerManage/index.vue        [修改]
```

---

## Task 1: 后端 - 实体字段扩展

**Files:**
- Modify: `nest-admin/src/modulesBusi/crm/customers/entities/customer-viewer.entity.ts`

- [ ] **Step 1: 添加新的枚举类型和字段**

在 `CustomerViewerSourceType` 后添加:

```typescript
export enum CustomerViewerGrantType {
  permanent = "permanent",
  temporary = "temporary",
}

export enum CustomerViewerStatus {
  disabled = "0",
  enabled = "1",
}
```

在 `canEdit` 字段后添加新字段:

```typescript
@BaseColumn({
  length: 20,
  name: "grant_type",
  comment: "授权类型: permanent永久 temporary临时",
  default: "permanent",
})
grantType: CustomerViewerGrantType;

@BaseColumn({
  type: "datetime",
  name: "start_time",
  comment: "授权开始时间",
  nullable: true,
})
startTime: Date;

@BaseColumn({
  type: "datetime",
  name: "end_time",
  comment: "授权结束时间",
  nullable: true,
})
endTime: Date;

@BaseColumn({
  type: "char",
  length: 1,
  default: "1",
  name: "status",
  comment: "状态: 0禁用 1启用",
})
status: CustomerViewerStatus;

@BaseColumn({
  length: 500,
  name: "grant_reason",
  comment: "授权原因",
  nullable: true,
})
grantReason: string;

@BaseColumn({
  type: "bigint",
  name: "grant_user_id",
  comment: "授权人ID",
  nullable: true,
})
grantUserId: string;

@BaseColumn({
  type: "bigint",
  name: "revoke_user_id",
  comment: "撤销人ID",
  nullable: true,
})
revokeUserId: string;

@BaseColumn({
  type: "datetime",
  name: "revoke_time",
  comment: "撤销时间",
  nullable: true,
})
revokeTime: Date;

@BaseColumn({
  length: 500,
  name: "revoke_reason",
  comment: "撤销原因",
  nullable: true,
})
revokeReason: string;
```

- [ ] **Step 2: 添加新索引**

在现有 `@Index` 后添加:

```typescript
@Index("idx_crm_customer_viewer_status_endtime", ["status", "endTime"])
```

- [ ] **Step 3: Commit**

```bash
cd /Users/yyk/work/Code/Project-V2.0/nest-admin && git add src/modulesBusi/crm/customers/entities/customer-viewer.entity.ts && git commit -m "feat(crm): 扩展 CustomerViewer 实体字段 - 支持临时授权、授权时间、原因和状态管理"
```

---

## Task 2: 后端 - Service 层可见性逻辑更新

**Files:**
- Modify: `nest-admin/src/modulesBusi/crm/customers/service.ts`

- [ ] **Step 1: 添加导入**

在文件顶部 `CustomerViewerSourceType` 导入后添加:

```typescript
import {
  CustomerViewer,
  CustomerViewerSourceType,
  CustomerViewerGrantType,
  CustomerViewerStatus,
} from "./entities/customer-viewer.entity";
import { MessagesService } from "src/modules/messages/service";
```

- [ ] **Step 2: 构造函数注入 MessagesService**

```typescript
constructor(
  @InjectRepository(Customer) repository: Repository<Customer>,
  @InjectRepository(CustomerViewer)
  private readonly viewerRepository: Repository<CustomerViewer>,
  private readonly businessApprovalContextService?: BusinessApprovalContextService,
  @Optional()
  private readonly messagesService?: MessagesService,
) {
  super(Customer, repository);
}
```

- [ ] **Step 3: 添加 isViewerActive 辅助方法**

```typescript
private isViewerActive(viewer: CustomerViewer): boolean {
  if (viewer.status !== CustomerViewerStatus.enabled) return false;
  if (viewer.grantType === CustomerViewerGrantType.permanent) return true;
  const now = new Date();
  if (viewer.startTime && new Date(viewer.startTime) > now) return false;
  if (viewer.endTime && new Date(viewer.endTime) < now) return false;
  return true;
}
```

- [ ] **Step 4: 更新 getVisibleCustomerIds 方法**

将 `getVisibleCustomerIds` 方法中的查询条件添加 `status: CustomerViewerStatus.enabled`，并在返回前调用 `isViewerActive` 过滤:

```typescript
// 在 where 条件中添加: status: CustomerViewerStatus.enabled as any
// 并在获取 viewers 后过滤:
const activeViewers = viewers.filter(v => this.isViewerActive(v));
const visibleCustomerIds = Array.from(
  new Set([
    ...activeViewers.map((item) => String(item.customerId)),
    ...approvalVisibleCustomerIds,
  ].filter(Boolean)),
);
```

- [ ] **Step 5: 更新 assertCustomerReadable 方法**

在 `viewer` 查询条件中添加 `status: CustomerViewerStatus.enabled`，并在判断时使用 `isViewerActive`:

```typescript
const viewer = await this.viewerRepository.findOne({
  where: {
    customerId,
    userId: In(this.getOperatorKeys(operatorId, operatorName)),
    isDelete: null as any,
    status: CustomerViewerStatus.enabled as any,
  } as any,
  select: ["id", "grantType", "startTime", "endTime", "status"] as any,
});
// 在后续判断中添加:
if (viewer && !this.isViewerActive(viewer)) {
  const hasApprovalAccess = ...;
  if (hasApprovalAccess) return;
  throw new ForbiddenException("当前无查看该客户的权限");
}
```

- [ ] **Step 6: 更新 grantCustomerViewAccess 方法签名和实现**

将方法签名改为:

```typescript
async grantCustomerViewAccess(
  customerId: string,
  userIds: string[] = [],
  operatorId?: string,
  operatorName?: string,
  permissions: string[] = [],
  options?: {
    grantType?: CustomerViewerGrantType;
    startTime?: Date;
    endTime?: Date;
    canEdit?: string;
    grantReason?: string;
  },
)
```

更新 `ensureViewer` 调用，传入新参数:

```typescript
private async ensureViewer(
  customerId: string,
  userId: string,
  sourceType: CustomerViewerSourceType,
  operatorId?: string,
  options?: {
    grantType?: CustomerViewerGrantType;
    startTime?: Date;
    endTime?: Date;
    canEdit?: string;
    grantReason?: string;
  },
) {
  // ... existing code ...
  await this.viewerRepository.save(
    new CustomerViewer({
      customerId: String(customerId),
      userId: String(userId),
      sourceType,
      canEdit: options?.canEdit || "0",
      grantType: options?.grantType || CustomerViewerGrantType.permanent,
      startTime: options?.startTime || null,
      endTime: options?.endTime || null,
      status: CustomerViewerStatus.enabled,
      grantReason: options?.grantReason || null,
      grantUserId: operatorId || "system",
      createUser: operatorId || "system",
      updateUser: operatorId || "system",
    }),
  );
}
```

- [ ] **Step 7: 更新 revokeCustomerViewAccess 支持撤销原因**

```typescript
async revokeCustomerViewAccess(
  customerId: string,
  userId: string,
  operatorId?: string,
  operatorName?: string,
  permissions: string[] = [],
  options?: { reason?: string },
) {
  await this.assertCustomerWritable(...);
  await this.viewerRepository.update(
    {
      customerId,
      userId,
      sourceType: CustomerViewerSourceType.manual,
      isDelete: null as any,
    } as any,
    {
      status: CustomerViewerStatus.disabled as any,
      revokeUserId: operatorId,
      revokeTime: new Date(),
      revokeReason: options?.reason || null,
      updateUser: operatorId,
    } as any,
  );
  return { success: true };
}
```

- [ ] **Step 8: 添加 updateViewerStatus 批量启用/禁用方法**

```typescript
async updateViewerStatus(
  customerId: string,
  viewerIds: string[],
  status: CustomerViewerStatus,
  operatorId?: string,
) {
  if (!viewerIds?.length) return { success: true, count: 0 };
  const result = await this.viewerRepository.update(
    {
      id: In(viewerIds),
      customerId,
      sourceType: CustomerViewerSourceType.manual,
      isDelete: null as any,
    } as any,
    {
      status,
      updateUser: operatorId,
    } as any,
  );
  return { success: true, count: Number(result?.affected || 0) };
}
```

- [ ] **Step 9: 添加 getExpiringViewers 获取即将到期授权方法**

```typescript
async getExpiringViewers(daysAhead: number = 7) {
  const now = new Date();
  const futureDate = new Date(now.getTime() + daysAhead * 24 * 60 * 60 * 1000);
  return this.viewerRepository.find({
    where: {
      status: CustomerViewerStatus.enabled as any,
      grantType: CustomerViewerGrantType.temporary as any,
      endTime: LessThanOrEqual(futureDate) as any,
      endTime: MoreThan(now) as any,
      isDelete: null as any,
    } as any,
  });
}
```

- [ ] **Step 10: 添加 expireViewers 执行到期处理方法**

```typescript
async expireViewers(viewerIds: string[]) {
  if (!viewerIds?.length) return { success: true, count: 0 };
  const result = await this.viewerRepository.update(
    {
      id: In(viewerIds),
      status: CustomerViewerStatus.enabled as any,
      isDelete: null as any,
    } as any,
    {
      status: CustomerViewerStatus.disabled as any,
      updateUser: "system",
    } as any,
  );
  return { success: true, count: Number(result?.affected || 0) };
}
```

- [ ] **Step 11: Commit**

```bash
cd /Users/yyk/work/Code/Project-V2.0/nest-admin && git add src/modulesBusi/crm/customers/service.ts && git commit -m "feat(crm): 更新 Service 层可见性逻辑 - 支持临时授权时间判断和状态管理"
```

---

## Task 3: 后端 - Controller 层接口更新

**Files:**
- Modify: `nest-admin/src/modulesBusi/crm/customers/controller.ts`

- [ ] **Step 1: 更新 grantViewAccess 接口**

```typescript
@Post(":id/auth")
async grantViewAccess(
  @Param("id") id: string,
  @Body() body: {
    userIds?: string[];
    userId?: string;
    grantType?: string;
    startTime?: string;
    endTime?: string;
    canEdit?: string;
    grantReason?: string;
  },
  @Req() req: any,
) {
  const userIds = Array.isArray(body.userIds)
    ? body.userIds
    : [body.userId].filter(Boolean);
  return this.service.grantCustomerViewAccess(
    id,
    userIds,
    req.user?.id,
    req.user?.name,
    req.user?.permissions || [],
    {
      grantType: body.grantType as any,
      startTime: body.startTime ? new Date(body.startTime) : null,
      endTime: body.endTime ? new Date(body.endTime) : null,
      canEdit: body.canEdit,
      grantReason: body.grantReason,
    },
  );
}
```

- [ ] **Step 2: 更新 revokeViewAccess 接口支持撤销原因**

```typescript
@Delete(":id/auth/:viewerId")
async revokeViewAccess(
  @Param("id") id: string,
  @Param("viewerId") viewerId: string,
  @Body() body: { reason?: string },
  @Req() req: any,
) {
  return this.service.revokeCustomerViewAccess(
    id,
    viewerId,
    req.user?.id,
    req.user?.name,
    req.user?.permissions || [],
    { reason: body.reason },
  );
}
```

- [ ] **Step 3: 添加批量启用/禁用接口**

```typescript
@Put(":id/auth/status")
async updateViewerStatus(
  @Param("id") id: string,
  @Body() body: { viewerIds: string[]; status: string },
  @Req() req: any,
) {
  return this.service.updateViewerStatus(
    id,
    body.viewerIds,
    body.status as any,
    req.user?.id,
  );
}
```

- [ ] **Step 4: Commit**

```bash
cd /Users/yyk/work/Code/Project-V2.0/nest-admin && git add src/modulesBusi/crm/customers/controller.ts && git commit -m "feat(crm): 更新 Controller 层接口 - 支持临时授权参数和批量状态管理"
```

---

## Task 4: 后端 - 定时任务服务

**Files:**
- Create: `nest-admin/src/modulesBusi/crm/customers/customer-viewer-timeout.service.ts`
- Modify: `nest-admin/src/modulesBusi/crm/customers/module.ts`

- [ ] **Step 1: 创建定时任务服务**

```typescript
import { Injectable, Optional } from "@nestjs/common";
import { Cron } from "@nestjs/schedule";
import { SystemScheduledJobsService } from "src/modules/systemScheduledJobs/service";
import { MessagesService } from "src/modules/messages/service";
import { CustomersService } from "./service";
import { CustomerViewerGrantType, CustomerViewerStatus } from "./entities/customer-viewer.entity";
import { MessageType } from "src/modules/messages/entity";

@Injectable()
export class CustomerViewerTimeoutService {
  constructor(
    private readonly systemScheduledJobsService: SystemScheduledJobsService,
    @Optional()
    private readonly messagesService?: MessagesService,
    private readonly customersService?: CustomersService,
  ) {}

  @Cron("0 * * * *")
  async processExpiredViewers() {
    if (!this.systemScheduledJobsService?.isJobEnabled) return;
    if (
      !(await this.systemScheduledJobsService.isJobEnabled(
        "customers.expiredViewers",
      ))
    ) {
      return;
    }
    await this.systemScheduledJobsService.runJob(
      "customers.expiredViewers",
      "scheduled",
      () => this.runExpireViewers(),
    );
  }

  @Cron("0 9 * * *")
  async sendExpirationReminders() {
    if (
      !(await this.systemScheduledJobsService?.isJobEnabled(
        "customers.expirationReminder",
      ))
    ) {
      return;
    }
    await this.systemScheduledJobsService.runJob(
      "customers.expirationReminder",
      "scheduled",
      () => this.runSendReminders(),
    );
  }

  private async runExpireViewers() {
    if (!this.customersService) return { success: true, count: 0 };
    const expiring = await this.customersService.getExpiringViewers(0);
    if (!expiring?.length) return { success: true, count: 0 };
    const expiredIds = expiring
      .filter(v => v.endTime && new Date(v.endTime) < new Date())
      .map(v => v.id);
    if (!expiredIds.length) return { success: true, count: 0 };
    return this.customersService.expireViewers(expiredIds);
  }

  private async runSendReminders() {
    if (!this.customersService || !this.messagesService) return;
    const daysAhead = [7, 1, 0];
    for (const days of daysAhead) {
      const expiring = await this.customersService.getExpiringViewers(days);
      for (const viewer of expiring) {
        const now = new Date();
        const endTime = new Date(viewer.endTime);
        const isToday = endTime.toDateString() === now.toDateString();
        if (days === 0 && !isToday) continue;
        if (days === 0 && isToday) {
          await this.sendReminder(
            viewer,
            "即将到期",
            `将于今天到期`,
          );
        } else if (days === 1) {
          await this.sendReminder(
            viewer,
            "即将到期提醒",
            `将于明天到期`,
          );
        } else if (days === 7) {
          await this.sendReminder(
            viewer,
            "即将到期提醒",
            `将于 ${days} 天后到期`,
          );
        }
      }
    }
  }

  private async sendReminder(
    viewer: any,
    titleSuffix: string,
    timeDesc: string,
  ) {
    if (!this.messagesService) return;
    await this.messagesService.sendMessage({
      title: `客户授权${titleSuffix}`,
      content: `您授权给用户 ${viewer.userId} 查看客户的权限${timeDesc}，如需继续使用请重新授权。`,
      messageType: MessageType.cc,
      sourceType: "customer_viewer_expire",
      sourceId: viewer.id,
      receiverId: viewer.grantUserId,
      senderId: "system",
      linkUrl: "/crm/customerManage/index",
      linkParams: { customerId: viewer.customerId },
    });
  }
}
```

- [ ] **Step 2: 更新 module.ts 导出定时任务服务**

在 `module.ts` 中导入并导出 `CustomerViewerTimeoutService`

- [ ] **Step 3: Commit**

```bash
cd /Users/yyk/work/Code/Project-V2.0/nest-admin && git add src/modulesBusi/crm/customers/customer-viewer-timeout.service.ts src/modulesBusi/crm/customers/module.ts && git commit -m "feat(crm): 添加客户授权定时到期处理服务"
```

---

## Task 5: 前端 - API 接口扩展

**Files:**
- Modify: `nest-admin-frontend/src/views/business/crm/customerManage/api.ts`

- [ ] **Step 1: 更新现有接口和添加新接口**

```typescript
// 更新现有接口
export function grantCustomerViewAccess(id, data) {
  return request({ url: `${baseUrl}/${id}/auth`, method: 'post', data })
}

export function revokeCustomerViewAccess(id, viewerId, data) {
  return request({ url: `${baseUrl}/${id}/auth/${viewerId}`, method: 'delete', data })
}

// 新增接口
export function updateCustomerViewAccess(id, viewerId, data) {
  return request({ url: `${baseUrl}/${id}/auth/${viewerId}`, method: 'put', data })
}

export function batchUpdateViewerStatus(id, data) {
  return request({ url: `${baseUrl}/${id}/auth/status`, method: 'put', data })
}

export function getCustomerAuthDetail(id, viewerId) {
  return request({ url: `${baseUrl}/${id}/auth/${viewerId}`, method: 'get' })
}
```

- [ ] **Step 2: Commit**

```bash
cd /Users/yyk/work/Code/Project-V2.0/nest-admin-frontend && git add src/views/business/crm/customerManage/api.ts && git commit -m "feat(crm): 扩展客户授权 API 接口"
```

---

## Task 6: 前端 - 授权弹窗重构

**Files:**
- Modify: `nest-admin-frontend/src/views/business/crm/customerManage/index.vue`

- [ ] **Step 1: 添加导入和状态**

```typescript
import {
  grantCustomerViewAccess,
  revokeCustomerViewAccess,
  getCustomerAuthUsers,
  updateCustomerViewAccess,
  batchUpdateViewerStatus,
} from './api'

// 状态添加
const shareDialogVisible = ref(false)
const shareCustomer = ref(null)
const shareUserIds = ref([])
const originalShareUserIds = ref([])
const grantType = ref('permanent')
const grantStartTime = ref('')
const grantEndTime = ref('')
const grantReason = ref('')
const grantCanEdit = ref('0')
const authList = ref([])  // 已授权用户列表
```

- [ ] **Step 2: 更新 handleOpenShareDialog**

```typescript
async function handleOpenShareDialog(row) {
  if (!canCustomerUpdate.value) return $sdk.msgWarning('当前操作没有权限')
  shareCustomer.value = row
  shareUserIds.value = []
  grantType.value = 'permanent'
  grantStartTime.value = ''
  grantEndTime.value = ''
  grantReason.value = ''
  grantCanEdit.value = '0'
  shareDialogVisible.value = true
  // 加载已授权用户列表
  const res = await getCustomerAuthUsers(row.id)
  const list = res?.data?.data || res?.data || []
  authList.value = Array.isArray(list) ? list : []
  shareUserIds.value = list.map((item) => item.userId).filter(Boolean)
  originalShareUserIds.value = [...shareUserIds.value]
}
```

- [ ] **Step 3: 更新 handleGrantViewAccess**

```typescript
async function handleGrantViewAccess() {
  if (!shareCustomer.value?.id) return
  const nextUserIds = Array.from(new Set(shareUserIds.value.filter(Boolean)))
  const removedUserIds = originalShareUserIds.value.filter((userId) => !nextUserIds.includes(userId))
  
  if (nextUserIds.length) {
    await grantCustomerViewAccess(shareCustomer.value.id, {
      userIds: nextUserIds,
      grantType: grantType.value,
      startTime: grantStartTime.value || null,
      endTime: grantEndTime.value || null,
      canEdit: grantCanEdit.value,
      grantReason: grantReason.value,
    })
  }
  
  for (const userId of removedUserIds) {
    const viewer = authList.value.find(v => v.userId === userId)
    if (viewer?.id) {
      await revokeCustomerViewAccess(shareCustomer.value.id, viewer.id, { reason: '重新授权调整' })
    }
  }
  
  $sdk.msgSuccess('授权成功')
  shareDialogVisible.value = false
}
```

- [ ] **Step 4: 添加启用/禁用/撤销方法**

```typescript
async function handleUpdateViewerStatus(viewerId, status) {
  await batchUpdateViewerStatus(shareCustomer.value.id, {
    viewerIds: [viewerId],
    status,
  })
  $sdk.msgSuccess(status === '1' ? '已启用' : '已禁用')
  // 刷新列表
  const res = await getCustomerAuthUsers(shareCustomer.value.id)
  authList.value = res?.data?.data || res?.data || []
}

async function handleRevokeViewer(viewerId, reason) {
  await revokeCustomerViewAccess(shareCustomer.value.id, viewerId, { reason: reason || '手动撤销' })
  $sdk.msgSuccess('已撤销授权')
  // 刷新列表
  const res = await getCustomerAuthUsers(shareCustomer.value.id)
  authList.value = res?.data?.data || res?.data || []
}
```

- [ ] **Step 5: Commit**

```bash
cd /Users/yyk/work/Code/Project-V2.0/nest-admin-frontend && git add src/views/business/crm/customerManage/index.vue && git commit -m "feat(crm): 重构客户授权弹窗 - 支持临时授权、时间范围和状态管理"
```

---

## Task 7: 后端 - 数据库 Migration

> 根据实际项目使用的数据库迁移工具执行相应的迁移命令

- [ ] **Step 1: 生成 Migration**

```bash
cd /Users/yyk/work/Code/Project-V2.0/nest-admin && npm run migration:generate -- src/migrations/AddCustomerViewerFields
```

- [ ] **Step 2: 执行 Migration**

```bash
cd /Users/yyk/work/Code/Project-V2.0/nest-admin && npm run migration:run
```

---

## Task 8: 联调测试

- [ ] **Step 1: 验证后端接口**
- 测试 `POST /business/crm/customers/:id/auth` 新参数
- 测试 `DELETE /business/crm/customers/:id/auth/:viewerId` 带撤销原因
- 测试 `PUT /business/crm/customers/:id/auth/status` 批量启用/禁用
- 测试 `GET /business/crm/customers/:id/auth-users` 返回完整授权信息

- [ ] **Step 2: 验证前端交互**
- 测试永久授权创建
- 测试临时授权创建（带时间范围）
- 测试启用/禁用切换
- 测试撤销授权
- 测试授权列表显示

- [ ] **Step 3: 验证定时任务**
- 验证即将到期提醒发送
- 验证到期自动禁用

---

## 自检清单

- [ ] Spec 覆盖检查：每个设计需求都能在任务中找到对应实现
- [ ] 占位符检查：搜索 "TBD"、"TODO" 等，无残留
- [ ] 类型一致性检查：字段名、方法签名在整个计划中一致
- [ ] 迁移脚本已准备
- [ ] 测试场景已定义