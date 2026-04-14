# IT 类项目交付管理 — 字段改造方案

> 起草时间：2026-04-09
> 太子·重新整理

---

## 一、现状问题诊断

### 1.1 现有三张表字段统计

| 表名 | 字段数 | 核心缺陷 |
|------|--------|---------|
| `project` | **10个** | 无合同、无客户、无迭代、无里程碑、无预算、无工时汇总 |
| `task` | **13个** | 无迭代/版本、无工时追踪、无前置依赖、无评审、无验收标准 |
| `ticket` | **13个** | 混合了缺陷/需求/反馈三种职责，无优先级细分、无影响范围 |

### 1.2 核心理念错位

**现状**：Task = 通用任务，Ticket = Bug/需求/反馈混合体

**IT 交付项目需要的实际链路**：

```
客户合同
    ↓
需求（Requirement）— 由客户需求转化，经评审后进入开发
    ↓
任务（Task）— 开发任务，工时估计，分配执行
    ↓
缺陷（Bug）— 测试发现的缺陷，挂在需求/任务之下
    ↓
工单（Ticket）— 上线后运维问题，单独处理
```

---

## 二、整体数据模型改造

### 2.1 改造后实体关系图

```
Contract（合同）
    │
    ├── Project（项目） — 一个合同对应一个交付项目
    │       ├── Iteration（迭代/里程碑）— 项目下的迭代计划
    │       │       └── Task（任务）— 迭代下的开发任务
    │       │               ├── WorkLog（工时记录）
    │       │               └── TaskComment（任务评论）
    │       │
    │       └── Requirement（需求）— 客户需求，可分解为任务
    │               ├── RequirementDetail（需求明细/验收标准）
    │               └── ChangeRequest（需求变更）
    │
    ├── Bug（缺陷）— 挂在需求或任务之下
    │
    └── Ticket（工单）— 上线后运维/服务请求，独立流转
```

### 2.2 实体职责重新划分

| 实体 | 职责定位 | 与其他实体关系 |
|------|---------|--------------|
| **Project** | 交付项目容器，对应一个合同 | 属于 Contract，包含多个 Iteration |
| **Iteration** | 迭代/里程碑，对应交付节点 | 属于 Project，包含多个 Task |
| **Requirement** | 客户原始需求，经评审后实施 | 属于 Project，可分解为 Task，可挂 Bug |
| **Task** | 开发任务工单 | 属于 Iteration，可能对应 Requirement，可能有 WorkLog |
| **Bug** | 测试/客户发现的缺陷 | 挂在 Requirement 或 Task 之下 |
| **Ticket** | 上线后的服务请求/运维问题 | 独立于项目之外 |
| **WorkLog** | 任务工时明细 | 属于 Task |

---

## 三、Project（项目）完整改造

### 3.1 改造后字段清单

**保留原有字段**：name, code, description, attachments, isArchived, status, priority, startDate, endDate, leaderId

**新增字段**（按 IT 交付管理逻辑分组）：

```typescript
// ========== 合同与客户关联 ==========
/** 关联合同ID */
@BaseColumn({ nullable: true, name: 'contract_id', comment: '关联合同ID' })
contractId: string

/** 客户ID */
@BaseColumn({ nullable: true, name: 'customer_id', comment: '客户ID' })
customerId: string

/** 项目类型 */
@BaseColumn({ type: 'enum', enum: ['implementation', 'development', 'operation', 'consulting', 'other'],
  default: 'implementation', name: 'project_type', comment: '项目类型：im=实施 de=开发 op=运维 co=咨询' })
projectType: string

// ========== 时间计划 ==========
/** 计划开始时间（基准） */
@BaseColumn({ type: 'datetime', nullable: true, name: 'plan_start_date', comment: '计划开始时间' })
planStartDate: string

/** 计划结束时间（基准） */
@BaseColumn({ type: 'datetime', nullable: true, name: 'plan_end_date', comment: '计划结束时间' })
planEndDate: string

// ========== 预算与工时 ==========
/** 合同金额（元） */
@BaseColumn({ type: 'decimal', precision: 14, scale: 2, nullable: true, name: 'contract_amount', comment: '合同金额' })
contractAmount: number

/** 币种 */
@BaseColumn({ length: 10, default: 'CNY', name: 'currency', comment: '币种' })
currency: string

/** 已确认收入 */
@BaseColumn({ type: 'decimal', precision: 14, scale: 2, default: 0, name: 'confirmed_revenue', comment: '已确认收入' })
confirmedRevenue: number

/** 已发生成本 */
@BaseColumn({ type: 'decimal', precision: 14, scale: 2, default: 0, name: 'total_cost', comment: '已发生成本' })
totalCost: number

/** 总预估工时（小时） */
@BaseColumn({ type: 'decimal', precision: 8, scale: 2, default: 0, name: 'total_estimated_hours', comment: '总预估工时' })
totalEstimatedHours: number

/** 总实际工时（小时） */
@BaseColumn({ type: 'decimal', precision: 8, scale: 2, default: 0, name: 'total_actual_hours', comment: '总实际工时' })
totalActualHours: number

// ========== 交付物与里程碑 ==========
/** 交付物清单（JSON） */
@BaseColumn({ type: 'json', nullable: true, name: 'deliverables', comment: '交付物清单' })
/*
  格式：[{
    id: string,
    name: string,         // 交付物名称
    planDate: string,     // 计划交付日期
    actualDate: string,   // 实际交付日期
    status: string,       // pending/submitted/approved/rejected
    remark: string
  }]
*/
deliverables: DeliverableItem[]

// ========== 质量与风险 ==========
/** 项目阶段：planning/setup/dev/UAT/launch/closing */
@BaseColumn({ type: 'enum', enum: ['planning','setup','dev','uat','launch','closing','completed'],
  default: 'planning', name: 'phase', comment: '项目阶段' })
phase: string

/** 风险等级：1=低 2=中 3=高 */
@BaseColumn({ type: 'char', length: 1, default: '1', name: 'risk_level', comment: '风险等级' })
riskLevel: string

/** 项目完成度（自动计算/手动调整） */
@BaseColumn({ type: 'int', default: 0, name: 'overall_progress', comment: '项目整体完成度0-100' })
overallProgress: number

/** 项目评级 */
@BaseColumn({ length: 10, nullable: true, name: 'rating', comment: '项目评级' })
rating: string

// ========== 组织关联 ==========
/** 所属部门 */
@BaseColumn({ nullable: true, name: 'department_id', comment: '所属部门ID' })
departmentId: string

/** 发起人/创建者 */
@BaseColumn({ nullable: true, name: 'creator_id', comment: '项目发起人ID' })
creatorId: string

/** 销售负责人 */
@BaseColumn({ nullable: true, name: 'sales_id', comment: '销售负责人ID' })
salesId: string

// ========== 客户满意度 ==========
/** 客户满意度：1-5 */
@BaseColumn({ type: 'char', length: 1, nullable: true, name: 'satisfaction', comment: '客户满意度' })
satisfaction: string
```

### 3.2 新增枚举

```typescript
// 项目阶段
export enum ProjectPhase {
  PLANNING = 'planning',   // 规划阶段
  SETUP = 'setup',         // 搭建阶段
  DEV = 'dev',             // 开发阶段
  UAT = 'uat',             // UAT测试
  LAUNCH = 'launch',       // 上线部署
  CLOSING = 'closing',     // 验收结项
  COMPLETED = 'completed', // 已完成
}

// 项目类型
export enum ProjectType {
  IMPLEMENTATION = 'implementation', // 项目实施
  DEVELOPMENT = 'development',       // 产品开发
  OPERATION = 'operation',           // 运维项目
  CONSULTING = 'consulting',          // 咨询项目
  OTHER = 'other',                    // 其他
}

// 交付物状态
export enum DeliverableStatus {
  PENDING = 'pending',       // 待交付
  SUBMITTED = 'submitted',    // 已提交
  APPROVED = 'approved',      // 已确认
  REJECTED = 'rejected',      // 已驳回
}
```

---

## 四、Iteration（迭代/里程碑）— 新建实体

现有 project 只有 startDate/endDate，无法管理多迭代交付。需要新建 Iteration 表。

```typescript
@MyEntity('project_iteration')
export class ProjectIteration extends BaseEntity {
  constructor(obj = {}) { super(); this.assignOwn(obj); }

  /** 所属项目ID */
  @BaseColumn({ nullable: true, name: 'project_id', comment: '所属项目ID' })
  projectId: string

  @ManyToOne(() => Project)
  @JoinColumn({ name: 'project_id' })
  project: Project

  /** 迭代名称 */
  @BaseColumn({ length: 100 })
  @IsNotEmpty({ message: '迭代名称不能为空' })
  name: string

  /** 迭代编号 */
  @BaseColumn({ length: 50, nullable: true, comment: '迭代编号' })
  code: string

  /** 迭代目标 */
  @BaseColumn({ type: 'text', nullable: true, comment: '迭代目标与范围' })
  goal: string

  /** 计划开始 */
  @BaseColumn({ type: 'datetime', nullable: true, name: 'plan_start_date', comment: '计划开始时间' })
  planStartDate: string

  /** 计划结束 */
  @BaseColumn({ type: 'datetime', nullable: true, name: 'plan_end_date', comment: '计划结束时间' })
  planEndDate: string

  /** 实际开始 */
  @BaseColumn({ type: 'datetime', nullable: true, name: 'actual_start_date', comment: '实际开始时间' })
  actualStartDate: string

  /** 实际结束 */
  @BaseColumn({ type: 'datetime', nullable: true, name: 'actual_end_date', comment: '实际结束时间' })
  actualEndDate: string

  /** 迭代状态 */
  @BaseColumn({ type: 'char', length: 1, default: '1', name: 'status', comment: '状态：1=未开始 2=进行中 3=已完成' })
  status: string

  /** 完成度0-100 */
  @BaseColumn({ type: 'int', default: 0, name: 'progress', comment: '完成度' })
  progress: number

  /** 迭代负责人 */
  @BaseColumn({ nullable: true, name: 'owner_id', comment: '迭代负责人ID' })
  ownerId: string

  /** 排序号 */
  @BaseColumn({ type: 'int', default: 0, name: 'sort_order', comment: '排序' })
  sortOrder: number
}
```

---

## 五、Requirement（需求）— 新建实体

Ticket 承担了需求职责，但需求和缺陷是两回事。需要独立的 Requirement 实体。

```typescript
// 需求状态
export enum RequirementStatus {
  DRAFT = 'draft',           // 草稿
  SUBMITTED = 'submitted',   // 已提交
  REVIEWING = 'reviewing',   // 评审中
  APPROVED = 'approved',     // 已通过
  REJECTED = 'rejected',     // 已驳回
  DEVELOPING = 'developing', // 开发中
  TESTING = 'testing',       // 测试中
  COMPLETED = 'completed',   // 已完成
  CLOSED = 'closed',        // 已关闭
}

// 需求来源
export enum RequirementSource {
  CUSTOMER = 'customer',     // 客户提出
  SALES = 'sales',           // 销售反馈
  PRODUCT = 'product',       // 产品规划
  OPERATION = 'operation',   // 运维反馈
  INTERNAL = 'internal',     // 内部改进
}

// 需求优先级（P0-P3）
export enum RequirementPriority {
  P0_CRITICAL = 'p0', // 紧急重要
  P1_HIGH = 'p1',     // 重要
  P2_MEDIUM = 'p2',   // 一般
  P3_LOW = 'p3',      // 低
}

@MyEntity('project_requirement')
export class Requirement extends BaseEntity {
  constructor(obj = {}) { super(); this.assignOwn(obj); }

  /** 所属项目ID */
  @BaseColumn({ nullable: true, name: 'project_id', comment: '所属项目ID' })
  projectId: string

  @ManyToOne(() => Project)
  @JoinColumn({ name: 'project_id' })
  project: Project

  /** 需求标题 */
  @BaseColumn({ length: 200 })
  @IsNotEmpty({ message: '需求标题不能为空' })
  title: string

  /** 需求编号 */
  @BaseColumn({ length: 50, nullable: true, comment: '需求编号' })
  code: string

  /** 需求来源 */
  @BaseColumn({ type: 'enum', enum: RequirementSource, default: RequirementSource.CUSTOMER, name: 'source', comment: '需求来源' })
  source: RequirementSource

  /** 需求状态 */
  @BaseColumn({ type: 'enum', enum: RequirementStatus, default: RequirementStatus.DRAFT, name: 'status', comment: '需求状态' })
  status: RequirementStatus

  /** 需求描述 */
  @BaseColumn({ type: 'text', nullable: true, comment: '需求描述' })
  description: string

  /** 需求提出人 */
  @BaseColumn({ nullable: true, name: 'requester_id', comment: '提出人ID' })
  requesterId: string

  /** 提出人名称 */
  @BaseColumn({ length: 100, nullable: true, name: 'requester_name', comment: '提出人名称' })
  requesterName: string

  /** 优先级 */
  @BaseColumn({ type: 'enum', enum: RequirementPriority, default: RequirementPriority.P2_MEDIUM, name: 'priority', comment: '优先级' })
  priority: RequirementPriority

  /** 关联迭代ID */
  @BaseColumn({ nullable: true, name: 'iteration_id', comment: '计划迭代ID' })
  iterationId: string

  /** 预估人天 */
  @BaseColumn({ type: 'decimal', precision: 6, scale: 2, nullable: true, name: 'estimated_days', comment: '预估人天' })
  estimatedDays: number

  /** 实际人天 */
  @BaseColumn({ type: 'decimal', precision: 6, scale: 2, nullable: true, name: 'actual_days', comment: '实际人天' })
  actualDays: number

  /** 验收标准（JSON数组） */
  @BaseColumn({ type: 'json', nullable: true, name: 'acceptance_criteria', comment: '验收标准' })
  acceptanceCriteria: AcceptanceCriteria[]

  /** 评审人 */
  @BaseColumn({ nullable: true, name: 'reviewer_id', comment: '评审人ID' })
  reviewerId: string

  /** 评审意见 */
  @BaseColumn({ type: 'text', nullable: true, name: 'review_comment', comment: '评审意见' })
  reviewComment: string

  /** 评审时间 */
  @BaseColumn({ type: 'datetime', nullable: true, name: 'review_time', comment: '评审时间' })
  reviewTime: string

  /** 完成时间 */
  @BaseColumn({ type: 'datetime', nullable: true, name: 'completed_time', comment: '完成时间' })
  completedTime: string

  /** 标签（JSON） */
  @BaseColumn({ type: 'json', nullable: true, name: 'tags', comment: '标签' })
  tags: string[]

  /** 关联附件 */
  @BaseColumn({ type: 'json', nullable: true, comment: '附件' })
  attachments: string[]
}

// 验收标准结构
interface AcceptanceCriteria {
  id: string
  criterion: string       // 标准描述
  status: 'pending' | 'pass' | 'fail'  // 是否通过
  remark?: string
}
```

---

## 六、Task（任务）扩展

### 6.1 保留字段
name, code, description, attachments, startDate, endDate, status, priority, progress, parentId, leaderId, executorIds

### 6.2 新增字段

```typescript
// ========== 归属 ==========
/** 关联需求ID */
@BaseColumn({ nullable: true, name: 'requirement_id', comment: '关联需求ID' })
requirementId: string

/** 所属迭代ID */
@BaseColumn({ nullable: true, name: 'iteration_id', comment: '所属迭代ID' })
iterationId: string

/** 任务类型 */
@BaseColumn({ type: 'enum', enum: ['development', 'testing', 'deployment', 'documentation', 'meeting', 'other'],
  default: 'development', name: 'task_type', comment: '任务类型' })
taskType: string

// ========== 工时 ==========
/** 预估工时（小时） */
@BaseColumn({ type: 'decimal', precision: 6, scale: 2, nullable: true, name: 'estimated_hours', comment: '预估工时（小时）' })
estimatedHours: number

/** 实际工时（小时） */
@BaseColumn({ type: 'decimal', precision: 6, scale: 2, nullable: true, name: 'actual_hours', comment: '实际工时（小时）' })
actualHours: number

// ========== 依赖 ==========
/** 前置任务ID列表（JSON）- 本任务等待这些任务完成 */
@BaseColumn({ type: 'json', nullable: true, name: 'blocked_by', comment: '前置依赖任务ID列表' })
blockedBy: string[]

/** 本任务阻塞的任务ID列表（JSON） */
@BaseColumn({ type: 'json', nullable: true, name: 'blocks', comment: '本任务阻塞的任务ID列表' })
blocks: string[]

// ========== 评审 ==========
/** 是否需要评审 */
@BaseColumn({ type: 'char', length: 1, default: '0', name: 'need_review', comment: '是否需要评审' })
needReview: string

/** 评审人ID */
@BaseColumn({ nullable: true, name: 'reviewer_id', comment: '评审人ID' })
reviewerId: string

/** 评审状态 */
@BaseColumn({ type: 'char', length: 1, nullable: true, name: 'review_status', comment: '评审状态：0=未评审 1=通过 2=驳回' })
reviewStatus: string

// ========== 完成信息 ==========
/** 实际开始时间 */
@BaseColumn({ type: 'datetime', nullable: true, name: 'actual_start_date', comment: '实际开始时间' })
actualStartDate: string

/** 实际完成时间 */
@BaseColumn({ type: 'datetime', nullable: true, name: 'actual_end_date', comment: '实际完成时间' })
actualEndDate: string

/** 完成备注 */
@BaseColumn({ type: 'text', nullable: true, name: 'completion_note', comment: '完成备注' })
completionNote: string

// ========== 细分优先级 ==========
/** 紧急程度：1=一般 2=紧急 3=非常紧急 */
@BaseColumn({ type: 'char', length: 1, default: '1', name: 'urgency', comment: '紧急程度' })
urgency: string

/** 开发人员工号 */
@BaseColumn({ length: 50, nullable: true, name: 'developer_code', comment: '开发人员工号' })
developerCode: string
```

---

## 七、Bug（缺陷）— 新建实体

Ticket 的 bug 职责分离出来，成为独立 Bug 实体。

```typescript
// Bug严重等级
export enum BugSeverity {
  BLOCKER = 'blocker',   // 阻塞：系统不可用
  CRITICAL = 'critical', // 严重：核心功能不可用
  MAJOR = 'major',       // 主要：非核心功能失效
  MINOR = 'minor',       // 次要：界面/体验问题
  TRIVIAL = 'trivial',   // 轻微：建议类问题
}

// Bug优先级
export enum BugPriority {
  P0 = 'p0', // 必须立即修复
  P1 = 'p1', // 高优先级
  P2 = 'p2', // 中优先级
  P3 = 'p3', // 低优先级
}

// Bug状态
export enum BugStatus {
  NEW = 'new',           // 新建
  CONFIRMED = 'confirmed', // 已确认
  ASSIGNED = 'assigned', // 已指派
  IN_PROGRESS = 'in_progress', // 修复中
  RESOLVED = 'resolved', // 已修复
  CLOSED = 'closed',     // 已关闭
  REOPENED = 'reopened', // 重新打开
  REJECTED = 'rejected', // 拒绝
}

@MyEntity('project_bug')
export class Bug extends BaseEntity {
  constructor(obj = {}) { super(); this.assignOwn(obj); }

  /** 所属项目ID */
  @BaseColumn({ nullable: true, name: 'project_id', comment: '所属项目ID' })
  projectId: string

  /** 关联任务ID */
  @BaseColumn({ nullable: true, name: 'task_id', comment: '关联任务ID' })
  taskId: string

  /** 关联需求ID */
  @BaseColumn({ nullable: true, name: 'requirement_id', comment: '关联需求ID' })
  requirementId: string

  /** Bug标题 */
  @BaseColumn({ length: 200 })
  @IsNotEmpty({ message: 'Bug标题不能为空' })
  title: string

  /** Bug编号 */
  @BaseColumn({ length: 50, nullable: true, comment: 'Bug编号' })
  code: string

  /** 严重等级 */
  @BaseColumn({ type: 'enum', enum: BugSeverity, default: BugSeverity.MAJOR, name: 'severity', comment: '严重等级' })
  severity: BugSeverity

  /** 优先级 */
  @BaseColumn({ type: 'enum', enum: BugPriority, default: BugPriority.P2, name: 'priority', comment: '优先级' })
  priority: BugPriority

  /** Bug状态 */
  @BaseColumn({ type: 'enum', enum: BugStatus, default: BugStatus.NEW, name: 'status', comment: 'Bug状态' })
  status: BugStatus

  /** Bug描述 */
  @BaseColumn({ type: 'text', nullable: true, comment: 'Bug描述' })
  description: string

  /** 重现步骤 */
  @BaseColumn({ type: 'text', nullable: true, name: 'reproduce_steps', comment: '重现步骤' })
  reproduceSteps: string

  /** 发现版本 */
  @BaseColumn({ length: 50, nullable: true, name: 'found_version', comment: '发现版本' })
  foundVersion: string

  /** 修复版本 */
  @BaseColumn({ length: 50, nullable: true, name: 'fixed_version', comment: '修复版本' })
  fixedVersion: string

  /** 所属模块 */
  @BaseColumn({ length: 100, nullable: true, name: 'module', comment: '所属模块' })
  module: string

  /** 发现人 */
  @BaseColumn({ nullable: true, name: 'reporter_id', comment: '发现人ID' })
  reporterId: string

  /** 指派给 */
  @BaseColumn({ nullable: true, name: 'assignee_id', comment: '指派给' })
  assigneeId: string

  /** 解决方案 */
  @BaseColumn({ type: 'text', nullable: true, name: 'solution', comment: '解决方案' })
  solution: string

  /** 修复时间 */
  @BaseColumn({ type: 'datetime', nullable: true, name: 'fixed_time', comment: '修复时间' })
  fixedTime: string

  /** 关闭时间 */
  @BaseColumn({ type: 'datetime', nullable: true, name: 'closed_time', comment: '关闭时间' })
  closedTime: string

  /** 附件 */
  @BaseColumn({ type: 'json', nullable: true, comment: '附件' })
  attachments: string[]
}
```

---

## 八、Ticket（工单）扩展

Ticket 定位为**运维服务请求/售后问题**，与 Bug/需求分离。

### 8.1 替换类型枚举

```typescript
// 工单类型：support=技术支持 change=变更请求 incident=故障报修 other=其他
export enum TicketType {
  SUPPORT = 'support',     // 技术支持
  CHANGE = 'change',       // 变更请求
  INCIDENT = 'incident',   // 故障报修
  CONSULTATION = 'consultation', // 业务咨询
  OTHER = 'other',         // 其他
}

// 工单状态
export enum TicketStatus {
  PENDING = 'pending',           // 待处理
  ASSIGNED = 'assigned',         // 已指派
  IN_PROGRESS = 'in_progress',   // 处理中
  RESOLVED = 'resolved',         // 已解决
  CLOSED = 'closed',             // 已关闭
  REOPENED = 'reopened',         // 重新打开
}

// 工单优先级
export enum TicketPriority {
  P0_CRITICAL = 'p0', // 紧急：服务中断
  P1_HIGH = 'p1',      // 高：影响业务
  P2_NORMAL = 'p2',    // 中：部分影响
  P3_LOW = 'p3',        // 低：一般咨询
}
```

### 8.2 新增字段

```typescript
// ========== 保留原有字段 ==========
// title, type（新枚举）, status（新枚举）, content, attachments, solution
// projectId, taskId, submitterId, handlerId

// ========== 新增字段 ==========
/** 工单编号 */
@BaseColumn({ length: 50, nullable: true, comment: '工单编号' })
code: string

/** 优先级 */
@BaseColumn({ type: 'enum', enum: TicketPriority, default: TicketPriority.P2_NORMAL, name: 'priority', comment: '优先级' })
priority: TicketPriority

/** 影响范围：1=个人 2=部门 3=全公司 4=客户 */
@BaseColumn({ type: 'char', length: 1, default: '1', name: 'impact_scope', comment: '影响范围' })
impactScope: string

/** 服务时段：workday=工作时间 emergency=紧急响应 anytime=随时 */
@BaseColumn({ type: 'enum', enum: ['workday','emergency','anytime'], default: 'workday', name: 'service_window', comment: '服务时段' })
serviceWindow: string

/** 解决时限（小时） */
@BaseColumn({ type: 'int', nullable: true, name: 'sla_hours', comment: '解决时限（小时）' })
slaHours: number

/** 实际解决时长（小时） */
@BaseColumn({ type: 'decimal', precision: 6, scale: 2, nullable: true, name: 'resolution_hours', comment: '实际解决时长' })
resolutionHours: number

/** 是否为变更 */
@BaseColumn({ type: 'char', length: 1, default: '0', name: 'is_change', comment: '是否关联变更' })
isChange: string

/** 关联变更单号 */
@BaseColumn({ length: 50, nullable: true, name: 'change_code', comment: '关联变更单号' })
changeCode: string

/** 满意度评价：1-5 */
@BaseColumn({ type: 'char', length: 1, nullable: true, name: 'satisfaction', comment: '满意度评价' })
satisfaction: string

/** 评价备注 */
@BaseColumn({ type: 'text', nullable: true, name: 'feedback', comment: '评价备注' })
feedback: string

/** 关闭时间 */
@BaseColumn({ type: 'datetime', nullable: true, name: 'closed_time', comment: '关闭时间' })
closedTime: string
```

---

## 九、WorkLog（工时记录）— 新建实体

任务需要工时明细记录，而非只有一个估算值。

```typescript
@MyEntity('project_worklog')
export class ProjectWorklog extends BaseEntity {
  constructor(obj = {}) { super(); this.assignOwn(obj); }

  /** 关联任务ID */
  @BaseColumn({ nullable: true, name: 'task_id', comment: '关联任务ID' })
  taskId: string

  @ManyToOne(() => Task)
  @JoinColumn({ name: 'task_id' })
  task: Task

  /** 所属项目ID（冗余查询优化） */
  @BaseColumn({ nullable: true, name: 'project_id', comment: '所属项目ID' })
  projectId: string

  /** 记录人ID */
  @BaseColumn({ nullable: true, name: 'user_id', comment: '记录人ID' })
  userId: string

  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User

  /** 工作日期 */
  @BaseColumn({ type: 'date', nullable: true, name: 'work_date', comment: '工作日期' })
  workDate: string

  /** 工时数（小时） */
  @BaseColumn({ type: 'decimal', precision: 5, scale: 2, nullable: true, name: 'hours', comment: '工时数' })
  hours: number

  /** 工作内容 */
  @BaseColumn({ type: 'text', nullable: true, comment: '工作内容' })
  content: string

  /** 工作类型：development/testing/meeting/admin/other */
  @BaseColumn({ type: 'enum', enum: ['development','testing','meeting','admin','other'],
    default: 'development', name: 'work_type', comment: '工作类型' })
  workType: string
}
```

---

## 十、Ticket Comment（工单评论）— 新建

现有 task-comment 不适用于工单，需要独立的工单评论。

```typescript
@MyEntity('ticket_comment')
export class TicketComment extends BaseEntity {
  constructor(obj = {}) { super(); this.assignOwn(obj); }

  @BaseColumn({ nullable: true, name: 'ticket_id', comment: '工单ID' })
  ticketId: string

  @ManyToOne(() => Ticket)
  @JoinColumn({ name: 'ticket_id' })
  ticket: Ticket

  @BaseColumn({ nullable: true, name: 'user_id', comment: '评论人ID' })
  userId: string

  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User

  @BaseColumn({ type: 'text', comment: '评论内容' })
  content: string

  @BaseColumn({ type: 'json', nullable: true, comment: '附件' })
  attachments: string[]
}
```

---

## 十一、数据库迁移 SQL

### 11.1 新建表

```sql
-- 迭代/里程碑表
CREATE TABLE `project_iteration` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `create_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `update_time` datetime DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
  `is_delete` char(1) DEFAULT NULL,
  `project_id` bigint DEFAULT NULL COMMENT '所属项目ID',
  `name` varchar(100) NOT NULL COMMENT '迭代名称',
  `code` varchar(50) DEFAULT NULL COMMENT '迭代编号',
  `goal` text COMMENT '迭代目标',
  `plan_start_date` datetime DEFAULT NULL COMMENT '计划开始',
  `plan_end_date` datetime DEFAULT NULL COMMENT '计划结束',
  `actual_start_date` datetime DEFAULT NULL COMMENT '实际开始',
  `actual_end_date` datetime DEFAULT NULL COMMENT '实际结束',
  `status` char(1) NOT NULL DEFAULT '1' COMMENT '1=未开始 2=进行中 3=已完成',
  `progress` int NOT NULL DEFAULT 0 COMMENT '完成度0-100',
  `owner_id` bigint DEFAULT NULL COMMENT '负责人ID',
  `sort_order` int NOT NULL DEFAULT 0 COMMENT '排序',
  PRIMARY KEY (`id`),
  KEY `idx_project_id` (`project_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='项目迭代表';

-- 需求表
CREATE TABLE `project_requirement` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `create_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `update_time` datetime DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
  `is_delete` char(1) DEFAULT NULL,
  `project_id` bigint DEFAULT NULL COMMENT '所属项目ID',
  `title` varchar(200) NOT NULL COMMENT '需求标题',
  `code` varchar(50) DEFAULT NULL COMMENT '需求编号',
  `source` enum('customer','sales','product','operation','internal') NOT NULL DEFAULT 'customer' COMMENT '需求来源',
  `status` enum('draft','submitted','reviewing','approved','rejected','developing','testing','completed','closed') NOT NULL DEFAULT 'draft' COMMENT '需求状态',
  `description` text COMMENT '需求描述',
  `requester_id` bigint DEFAULT NULL COMMENT '提出人ID',
  `requester_name` varchar(100) DEFAULT NULL COMMENT '提出人名称',
  `priority` enum('p0','p1','p2  `estimated_days` decimal(6,2) DEFAULT NULL COMMENT '预估人天',
  `actual_days` decimal(6,2) DEFAULT NULL COMMENT '实际人天',
  `acceptance_criteria` json DEFAULT NULL COMMENT '验收标准JSON',
  `iteration_id` bigint DEFAULT NULL COMMENT '计划迭代ID',
  `reviewer_id` bigint DEFAULT NULL COMMENT '评审人ID',
  `review_comment` text COMMENT '评审意见',
  `review_time` datetime DEFAULT NULL COMMENT '评审时间',
  `completed_time` datetime DEFAULT NULL COMMENT '完成时间',
  `tags` json DEFAULT NULL COMMENT '标签',
  `attachments` json DEFAULT NULL COMMENT '附件',
  PRIMARY KEY (`id`),
  KEY `idx_project_id` (`project_id`),
  KEY `idx_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='项目需求表';

-- 缺陷表
CREATE TABLE `project_bug` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `create_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `update_time` datetime DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
  `is_delete` char(1) DEFAULT NULL,
  `project_id` bigint DEFAULT NULL COMMENT '所属项目ID',
  `task_id` bigint DEFAULT NULL COMMENT '关联任务ID',
  `requirement_id` bigint DEFAULT NULL COMMENT '关联需求ID',
  `title` varchar(200) NOT NULL COMMENT 'Bug标题',
  `code` varchar(50) DEFAULT NULL COMMENT 'Bug编号',
  `severity` enum('blocker','critical','major','minor','trivial') NOT NULL DEFAULT 'major' COMMENT '严重等级',
  `priority` enum('p0','p1','p2','p3') NOT NULL DEFAULT 'p2' COMMENT '优先级',
  `status` enum('new','confirmed','assigned','in_progress','resolved','closed','reopened','rejected') NOT NULL DEFAULT 'new' COMMENT 'Bug状态',
  `description` text COMMENT 'Bug描述',
  `reproduce_steps` text COMMENT '重现步骤',
  `found_version` varchar(50) DEFAULT NULL COMMENT '发现版本',
  `fixed_version` varchar(50) DEFAULT NULL COMMENT '修复版本',
  `module` varchar(100) DEFAULT NULL COMMENT '所属模块',
  `reporter_id` bigint DEFAULT NULL COMMENT '发现人ID',
  `assignee_id` bigint DEFAULT NULL COMMENT '指派给',
  `solution` text COMMENT '解决方案',
  `fixed_time` datetime DEFAULT NULL COMMENT '修复时间',
  `closed_time` datetime DEFAULT NULL COMMENT '关闭时间',
  `attachments` json DEFAULT NULL COMMENT '附件',
  PRIMARY KEY (`id`),
  KEY `idx_project_id` (`project_id`),
  KEY `idx_task_id` (`task_id`),
  KEY `idx_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='缺陷表';

-- 工时记录表
CREATE TABLE `project_worklog` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `create_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `update_time` datetime DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
  `is_delete` char(1) DEFAULT NULL,
  `task_id` bigint DEFAULT NULL COMMENT '关联任务ID',
  `project_id` bigint DEFAULT NULL COMMENT '所属项目ID',
  `user_id` bigint DEFAULT NULL COMMENT '记录人ID',
  `work_date` date DEFAULT NULL COMMENT '工作日期',
  `hours` decimal(5,2) DEFAULT NULL COMMENT '工时数（小时）',
  `content` text COMMENT '工作内容',
  `work_type` enum('development','testing','meeting','admin','other') NOT NULL DEFAULT 'development' COMMENT '工作类型',
  PRIMARY KEY (`id`),
  KEY `idx_task_id` (`task_id`),
  KEY `idx_project_id` (`project_id`),
  KEY `idx_user_id` (`user_id`),
  KEY `idx_work_date` (`work_date`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='工时记录表';

-- 工单评论表
CREATE TABLE `ticket_comment` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `create_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `update_time` datetime DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
  `is_delete` char(1) DEFAULT NULL,
  `ticket_id` bigint DEFAULT NULL COMMENT '工单ID',
  `user_id` bigint DEFAULT NULL COMMENT '评论人ID',
  `content` text NOT NULL COMMENT '评论内容',
  `attachments` json DEFAULT NULL COMMENT '附件',
  PRIMARY KEY (`id`),
  KEY `idx_ticket_id` (`ticket_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='工单评论表';

-- ===================== ALTER TABLE =====================

-- project 表新增字段
ALTER TABLE `project`
  ADD COLUMN `contract_id` bigint DEFAULT NULL COMMENT '关联合同ID' AFTER `description`,
  ADD COLUMN `customer_id` bigint DEFAULT NULL COMMENT '客户ID' AFTER `contract_id`,
  ADD COLUMN `project_type` enum('implementation','development','operation','consulting','other') NOT NULL DEFAULT 'implementation' COMMENT '项目类型' AFTER `customer_id`,
  ADD COLUMN `plan_start_date` datetime DEFAULT NULL COMMENT '计划开始时间' AFTER `project_type`,
  ADD COLUMN `plan_end_date` datetime DEFAULT NULL COMMENT '计划结束时间' AFTER `plan_start_date`,
  ADD COLUMN `contract_amount` decimal(14,2) DEFAULT NULL COMMENT '合同金额' AFTER `plan_end_date`,
  ADD COLUMN `currency` varchar(10) NOT NULL DEFAULT 'CNY' COMMENT '币种' AFTER `contract_amount`,
  ADD COLUMN `confirmed_revenue` decimal(14,2) NOT NULL DEFAULT 0.00 COMMENT '已确认收入' AFTER `currency`,
  ADD COLUMN `total_cost` decimal(14,2) NOT NULL DEFAULT 0.00 COMMENT '已发生成本' AFTER `confirmed_revenue`,
  ADD COLUMN `total_estimated_hours` decimal(8,2) NOT NULL DEFAULT 0.00 COMMENT '总预估工时' AFTER `total_cost`,
  ADD COLUMN `total_actual_hours` decimal(8,2) NOT NULL DEFAULT 0.00 COMMENT '总实际工时' AFTER `total_estimated_hours`,
  ADD COLUMN `deliverables` json DEFAULT NULL COMMENT '交付物清单' AFTER `total_actual_hours`,
  ADD COLUMN `phase` enum('planning','setup','dev','uat','launch','closing','completed') NOT NULL DEFAULT 'planning' COMMENT '项目阶段' AFTER `deliverables`,
  ADD COLUMN `risk_level` char(1) NOT NULL DEFAULT '1' COMMENT '风险等级' AFTER `phase`,
  ADD COLUMN `overall_progress` int NOT NULL DEFAULT 0 COMMENT '项目完成度' AFTER `risk_level`,
  ADD COLUMN `rating` varchar(10) DEFAULT NULL COMMENT '项目评级' AFTER `overall_progress`,
  ADD COLUMN `department_id` bigint DEFAULT NULL COMMENT '所属部门ID' AFTER `rating`,
  ADD COLUMN `creator_id` bigint DEFAULT NULL COMMENT '项目发起人ID' AFTER `department_id`,
  ADD COLUMN `sales_id` bigint DEFAULT NULL COMMENT '销售负责人ID' AFTER `creator_id`,
  ADD COLUMN `satisfaction` char(1) DEFAULT NULL COMMENT '客户满意度' AFTER `sales_id`;

-- task 表新增字段
ALTER TABLE `task`
  ADD COLUMN `requirement_id` bigint DEFAULT NULL COMMENT '关联需求ID' AFTER `project_id`,
  ADD COLUMN `iteration_id` bigint DEFAULT NULL COMMENT '所属迭代ID' AFTER `requirement_id`,
  ADD COLUMN `task_type` enum('development','testing','deployment','documentation','meeting','other') NOT NULL DEFAULT 'development' COMMENT '任务类型' AFTER `iteration_id`,
  ADD COLUMN `estimated_hours` decimal(6,2) DEFAULT NULL COMMENT '预估工时（小时）' AFTER `task_type`,
  ADD COLUMN `actual_hours` decimal(6,2) DEFAULT NULL COMMENT '实际工时（小时）' AFTER `estimated_hours`,
  ADD COLUMN `blocked_by` json DEFAULT NULL COMMENT '前置依赖任务ID列表' AFTER `actual_hours`,
  ADD COLUMN `blocks` json DEFAULT NULL COMMENT '被本任务阻塞的任务ID列表' AFTER `blocked_by`,
  ADD COLUMN `need_review` char(1) NOT NULL DEFAULT '0' COMMENT '是否需要评审' AFTER `blocks`,
  ADD COLUMN `reviewer_id` bigint DEFAULT NULL COMMENT '评审人ID' AFTER `need_review`,
  ADD COLUMN `review_status` char(1) DEFAULT NULL COMMENT '评审状态：0=未评审 1=通过 2=驳回' AFTER `reviewer_id`,
  ADD COLUMN `actual_start_date` datetime DEFAULT NULL COMMENT '实际开始时间' AFTER `review_status`,
  ADD COLUMN `actual_end_date` datetime DEFAULT NULL COMMENT '实际完成时间' AFTER `actual_start_date`,
  ADD COLUMN `completion_note` text DEFAULT NULL COMMENT '完成备注' AFTER `actual_end_date`,
  ADD COLUMN `urgency` char(1) NOT NULL DEFAULT '1' COMMENT '紧急程度' AFTER `completion_note`,
  ADD COLUMN `developer_code` varchar(50) DEFAULT NULL COMMENT '开发人员工号' AFTER `urgency`;

-- ticket 表修改字段（替换类型枚举，扩展字段）
ALTER TABLE `ticket`
  ADD COLUMN `code` varchar(50) DEFAULT NULL COMMENT '工单编号' AFTER `title`,
  MODIFY COLUMN `type` enum('support','change','incident','consultation','other') NOT NULL DEFAULT 'support' COMMENT '工单类型',
  MODIFY COLUMN `status` enum('pending','assigned','in_progress','resolved','closed','reopened') NOT NULL DEFAULT 'pending' COMMENT '工单状态',
  ADD COLUMN `priority` enum('p0','p1','p2','p3') NOT NULL DEFAULT 'p2' COMMENT '优先级' AFTER `status`,
  ADD COLUMN `impact_scope` char(1) NOT NULL DEFAULT '1' COMMENT '影响范围：1=个人 2=部门 3=全公司 4=客户' AFTER `priority`,
  ADD COLUMN `service_window` enum('workday','emergency','anytime') NOT NULL DEFAULT 'workday' COMMENT '服务时段' AFTER `impact_scope`,
  ADD COLUMN `sla_hours` int DEFAULT NULL COMMENT '解决时限（小时）' AFTER `service_window`,
  ADD COLUMN `resolution_hours` decimal(6,2) DEFAULT NULL COMMENT '实际解决时长' AFTER `sla_hours`,
  ADD COLUMN `is_change` char(1) NOT NULL DEFAULT '0' COMMENT '是否关联变更' AFTER `resolution_hours`,
  ADD COLUMN `change_code` varchar(50) DEFAULT NULL COMMENT '关联变更单号' AFTER `is_change`,
  ADD COLUMN `satisfaction` char(1) DEFAULT NULL COMMENT '满意度评价' AFTER `change_code`,
  ADD COLUMN `feedback` text DEFAULT NULL COMMENT '评价备注' AFTER `satisfaction`,
  ADD COLUMN `closed_time` datetime DEFAULT NULL COMMENT '关闭时间' AFTER `feedback`;

---

## 十二、涉及修改的文件清单

### 新建实体文件

| 文件路径 | 说明 |
|---------|------|
| `src/modulesBusi/project-iteration/entity.ts` | 迭代/里程碑实体 |
| `src/modulesBusi/project-requirement/entity.ts` | 需求实体 |
| `src/modulesBusi/project-bug/entity.ts` | 缺陷实体 |
| `src/modulesBusi/project-worklog/entity.ts` | 工时记录实体 |
| `src/modulesBusi/ticket-comment/entity.ts` | 工单评论实体 |

### 新建 Service / Controller / Module / DTO

每个新实体对应：
- `xxx.service.ts`
- `xxx.controller.ts`
- `xxx.module.ts`
- `xxx.dto.ts`

### 修改的实体文件

| 文件路径 | 修改内容 |
|---------|---------|
| `src/modulesBusi/projects/entity.ts` | 新增14个字段 |
| `src/modulesBusi/tasks/entity.ts` | 新增12个字段 |
| `src/modulesBusi/tickets/entity.ts` | 替换枚举 + 新增9个字段 |

### 修改的 Service 文件

| 文件 | 改动 |
|------|------|
| `projects/service.ts` | `getStatistics()` 扩展统计项（工时/缺陷/需求/交付物） |
| `tasks/service.ts` | `getKanbanData()` 支持按迭代分组，工时汇总 |
| `tickets/service.ts` | 新枚举类型 + 工时字段处理 |

### 迁移 SQL

| 文件 | 说明 |
|------|------|
| `doc/sql/project_iteration.sql` | 迭代表建表 |
| `doc/sql/project_requirement.sql` | 需求表建表 |
| `doc/sql/project_bug.sql` | 缺陷表建表 |
| `doc/sql/project_worklog.sql` | 工时记录表建表 |
| `doc/sql/ticket_comment.sql` | 工单评论表建表 |
| `doc/sql/project_field_extension.sql` | project/task/ticket 三表的 ALTER 语句 |

---

## 十三、优先级建议

### 第一批次（立即可上线）
1. **新建 Requirement 实体**（需求管理是IT交付核心）
2. **新建 Iteration 实体**（支持多迭代管理）
3. **Project 新增**：contractId, customerId, projectType, phase, deliverables, totalActualHours
4. **Task 新增**：requirementId, iterationId, estimatedHours, actualHours, blockedBy, blocks
5. **Task DTO / Service** 按新字段更新

### 第二批次（完善工时与质量）
6. **新建 WorkLog 实体**（工时明细记录）
7. **Task 扩展**：needReview, reviewerId, reviewStatus
8. **Project 新增**：totalEstimatedHours, totalActualHours, riskLevel, overallProgress
9. **Project Service** 自动汇总工时

### 第三批次（运维支撑）
10. **Bug 实体独立**（从 Ticket 拆出）
11. **Ticket 改造**：替换枚举为 support/change/incident/consultation，新增 SLA、满意度
12. **新建 TicketComment 实体**

---

## 十四、与其他模块的关联说明

| 模块 | 关联方式 |
|------|---------|
| **工作流引擎** | Requirement 评审 → 工作流审批节点；Bug 关闭 → 工作流 |
| **客户管理（CRM）** | Project 关联 Customer；Requirement.requesterId → Customer |
| **合同管理** | Project.contractId → Contract |
| **文档管理** | Requirement / Task / Bug 的 attachments → 文档表 |
| **通知模块** | 工单创建/分配/关闭 → 通知相关人；Bug 指派 → 通知 assignee |
| **权限管理** | ProjectMember 扩展角色：项目经理/开发/测试/运维/客户 |
