# IT 系统工作流配置化改造方案

## 一、背景与目标

### 1.1 现状问题

当前系统的工作流集成存在以下问题：

| 问题 | 描述 | 影响 |
|-----|------|-----|
| **伪实现** | `WorkflowIntegrationService.startProjectApproval()` 只生成了假 ID，没有调用工作流引擎 | 审批流程形同虚设 |
| **分散实现** | 变更请求完全绕过工作流引擎，直接 approve/reject | 无法统一管理 |
| **无回调机制** | 工作流完成后 `handleWorkflowCallback` 从未被调用 | 业务状态无法自动更新 |
| **字段不可选** | 设计器中审批人/条件只能手写表达式 `${variables.xxx}` | 用户无法直观配置 |
| **不支持触发时机** | 只能在代码中硬编码触发时机 | 无法灵活配置 |

### 1.2 改造目标

```
┌─────────────────────────────────────────────────────────────┐
│                    工作流设计器（前端）                        │
├─────────────────────────────────────────────────────────────┤
│  用户操作：                                                   │
│  1. 选择业务对象类型（项目/客户/工单/变更请求）                 │
│  2. 选择触发时机（创建时/更新时/状态变更时/手动触发）           │
│  3. 配置条件分支（选择业务对象字段）                            │
│  4. 配置审批节点（选择组织架构人员）                            │
│  5. 配置通知节点（使用业务对象字段渲染消息）                      │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│                  统一工作流业务集成平台                        │
├─────────────────────────────────────────────────────────────┤
│  - 业务数据自动加载（关联对象、嵌套属性）                        │
│  - 触发时机自动监听                                            │
│  - 审批人动态解析（组织架构）                                   │
│  - 回调自动通知业务系统更新状态                                  │
└─────────────────────────────────────────────────────────────┘
```

---

## 二、整体架构设计

### 2.1 架构图

```
┌──────────────────────────────────────────────────────────────────────────┐
│                              用户层                                        │
│  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐      │
│  │   工作流设计器    │  │    审批任务页     │  │   业务详情页      │      │
│  │  (可视化配置)     │  │   (待办审批)      │  │  (查看/触发)      │      │
│  └────────┬─────────┘  └────────┬─────────┘  └────────┬─────────┘      │
└───────────┼─────────────────────┼─────────────────────┼────────────────┘
            │                     │                     │
            ▼                     ▼                     ▼
┌──────────────────────────────────────────────────────────────────────────┐
│                              API 层                                       │
│  ┌──────────────────────────────────────────────────────────────────┐   │
│  │                     WorkflowController                             │   │
│  │  - POST /workflow/start          - 启动工作流                     │   │
│  │  - POST /workflow/tasks/:id/complete  - 完成任务                   │   │
│  │  - GET  /workflow/business-fields - 获取业务对象字段定义           │   │
│  │  - POST /workflow/config          - 配置业务对象                    │   │
│  └──────────────────────────────────────────────────────────────────┘   │
└──────────────────────────────────────────────────────────────────────────┘
            │
            ▼
┌──────────────────────────────────────────────────────────────────────────┐
│                           服务层                                          │
│  ┌───────────────────────┐  ┌───────────────────────┐                   │
│  │  WorkflowService       │  │  WorkflowDataLoader    │                   │
│  │  - startWorkflow()    │  │  - loadData()          │                   │
│  │  - executeNode()      │  │  - resolveField()      │                   │
│  │  - evaluateCondition()  │  │  - getFieldDefs()      │                   │
│  │  - completeTask()      │  │                        │                   │
│  └───────────────────────┘  └───────────────────────┘                   │
│                                    │                                      │
│            ┌───────────────────────┼───────────────────────┐              │
│            ▼                       ▼                       ▼              │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐           │
│  │ ProjectLoader    │  │ CustomerLoader  │  │ TicketLoader    │           │
│  │ ChangeLoader     │  │ ...             │  │                 │           │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘           │
└──────────────────────────────────────────────────────────────────────────┘
            │
            ▼
┌──────────────────────────────────────────────────────────────────────────┐
││                          数据层                                          │
│  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐       │
│  │  wf_definition    │  │  wf_instance     │  │  wf_business_config│      │
│  │  (流程定义)       │  │  (流程实例)       │  │  (业务对象配置)    │      │
│  └──────────────────┘  └──────────────────┘  └──────────────────┘       │
│                                                                             │
│  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐       │
│  │  Project         │  │  Customer        │  │  Ticket          │       │
│  │  (项目)          │  │  (客户)          │  │  (工单)          │       │
│  └──────────────────┘  └──────────────────┘  └──────────────────┘       │
└──────────────────────────────────────────────────────────────────────────┘
```

### 2.2 核心组件职责

| 组件 | 职责 |
|-----|------|
| **WorkflowService** | 工作流引擎核心，执行节点、处理条件、推进流程 |
| **WorkflowDataLoaderService** | 统一的数据加载服务，根据 businessType 加载业务数据 |
| **BusinessDataLoader** | 各业务实体的数据加载器接口 |
| **WorkflowEventListener** | 事件监听器，监听业务对象变化触发工作流 |
| **WorkflowCallbackService** | 回调服务，流程完成后通知业务系统 |

---

## 三、业务对象支持范围

### 3.1 首批支持的业务对象

| 业务对象 | 触发时机 | 审批场景 | 关键字段 |
|---------|---------|---------|---------|
| **Project（项目）** | 手动触发 | 立项审批、结项审批 | budget, leader, status |
| **Customer（客户）** | 创建时自动 | 新增客户审批 | type, level, salesId |
| **Ticket（工单）** | 创建时/状态变更 | 严重缺陷关闭审批、需求处理审批 | severity, type, status |
| **Change（变更请求）** | 手动触发 | 变更审批 | impact, type, costImpact |

### 3.2 业务对象字段定义

#### Project（项目）

| 字段名 | 标签 | 类型 | 说明 |
|--------|------|------|------|
| id | 项目ID | string | |
| name | 项目名称 | string | |
| code | 项目编号 | string | |
| budget | 预算 | number | |
| actualCost | 实际成本 | number | |
| status | 状态 | enum | |
| priority | 优先级 | enum | |
| leader.id | 负责人ID | string | |
| leader.nickname | 负责人姓名 | relation→User | |
| leader.deptId | 负责人部门ID | string | |
| department.id | 部门ID | string | |
| department.name | 部门名称 | relation→Dept | |
| department.leaderId | 部门负责人ID | string | |
| customer.id | 客户ID | string | |
| customer.name | 客户名称 | relation→Customer | |

#### Customer（客户）

| 字段名 | 标签 | 类型 | 说明 |
|--------|------|------|------|
| id | 客户ID | string | |
| name | 客户名称 | string | |
| shortName | 客户简称 | string | |
| code | 客户编号 | string | |
| type | 客户类型 | enum | 1=企业客户, 2=个人客户 |
| level | 客户等级 | enum | 1=VIP, 2=重要, 3=普通 |
| status | 客户状态 | enum | 1=潜在, 2=意向, 3=成交, 4=流失 |
| industry | 所属行业 | string | |
| scale | 企业规模 | string | |
| salesId | 销售负责人ID | string | |
| sales.nickname | 销售负责人 | relation→User | |
| deptId | 所属部门ID | string | |
| customerValue | 客户价值(万元) | number | |

#### Ticket（工单）

| 字段名 | 标签 | 类型 | 说明 |
|--------|------|------|------|
| id | 工单ID | string | |
| title | 工单标题 | string | |
| type | 类型 | enum | 1=缺陷, 2=需求, 3=反馈 |
| severity | 严重程度 | enum | 1=致命, 2=高, 3=中, 4=低 |
| status | 状态 | enum | 1=待处理, 2=处理中, 3=已解决, 4=已关闭 |
| projectId | 项目ID | string | |
| project.name | 项目名称 | relation→Project | |
| taskId | 任务ID | string | |
| submitterId | 提交人ID | string | |
| submitter.nickname | 提交人 | relation→User | |
| handlerId | 处理人ID | string | |
| handler.nickname | 处理人 | relation→User | |

#### Change（变更请求）

| 字段名 | 标签 | 类型 | 说明 |
|--------|------|------|------|
| id | 变更ID | string | |
| title | 变更标题 | string | |
| type | 变更类型 | enum | 范围/进度/预算/资源/需求/其他 |
| impact | 影响程度 | enum | 低/中/高 |
| status | 状态 | enum | 草稿/待审批/已批准/已驳回/已实施 |
| costImpact | 成本影响 | number | |
| scheduleImpact | 进度影响(天) | number | |
| project.id | 项目ID | string | |
| project.name | 项目名称 | relation→Project | |
| project.leaderId | 项目负责人ID | string | |
| requesterId | 申请人ID | string | |
| requester.nickname | 申请人 | relation→User | |

---

## 四、数据库设计

### 4.1 新增表

#### 业务对象配置表

```sql
CREATE TABLE `wf_business_config` (
  `business_type` VARCHAR(50) NOT NULL COMMENT '业务对象类型',
  `name` VARCHAR(100) NOT NULL COMMENT '业务对象名称',
  `table_name` VARCHAR(50) NOT NULL COMMENT '对应的数据库表名',
  `id_field` VARCHAR(50) DEFAULT 'id' COMMENT 'ID字段名',
  `field_definitions` TEXT COMMENT '字段定义JSON',
  `data_loader_class` VARCHAR(200) COMMENT '数据加载器类名',
  `trigger_config` JSON COMMENT '触发时机配置',
  `is_active` CHAR(1) DEFAULT '1' COMMENT '是否启用',
  PRIMARY KEY (`business_type`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='工作流业务对象配置表';
```

### 4.2 业务实体新增字段

所有需要审批的业务实体新增通用字段：

```sql
ALTER TABLE `projects`
  ADD COLUMN `workflow_instance_id` VARCHAR(100) COMMENT '工作流实例ID',
  ADD COLUMN `approval_status` CHAR(1) DEFAULT '0' COMMENT '审批状态: 0无需审批 1审批中 2已通过 3已拒绝',
  ADD COLUMN `current_node_name` VARCHAR(100) COMMENT '当前审批节点名称';

ALTER TABLE `customers`
  ADD COLUMN `workflow_instance_id` VARCHAR(100) COMMENT '工作流实例ID',
  ADD COLUMN `approval_status` CHAR(1) DEFAULT '0' COMMENT '审批状态',
  ADD COLUMN `current_node_name` VARCHAR(100) COMMENT '当前审批节点名称';

ALTER TABLE `tickets`
  ADD COLUMN `workflow_instance_id` VARCHAR(100) COMMENT '工作流实例ID',
  ADD COLUMN `approval_status` CHAR(1) DEFAULT '0' COMMENT '审批状态',
  ADD COLUMN `current_node_name` VARCHAR(100) COMMENT '当前审批节点名称';

ALTER TABLE `changes`
  ADD COLUMN `workflow_instance_id` VARCHAR(100) COMMENT '工作流实例ID',
  ADD COLUMN `approval_status` CHAR(1) DEFAULT '0' COMMENT '审批状态',
  ADD COLUMN `current_node_name` VARCHAR(100) COMMENT '当前审批节点名称';
```

### 4.3 流程定义扩展

```sql
ALTER TABLE `wf_definition`
  ADD COLUMN `business_type` VARCHAR(50) COMMENT '关联业务对象类型',
  ADD COLUMN `trigger_event` VARCHAR(50) COMMENT '触发事件: manual/on_create/on_update/on_status_change',
  ADD COLUMN `status_trigger_values` JSON COMMENT '状态触发值，当 trigger_event=on_status_change 时使用';
```

### 4.4 部门实体扩展

```sql
ALTER TABLE `sys_dept` ADD COLUMN `leader_id` VARCHAR(36) COMMENT '部门负责人ID';
```

---

## 五、触发时机设计

### 5.1 触发事件类型

| 触发事件 | 值 | 说明 | 实现方式 |
|---------|---|------|---------|
| **手动触发** | `manual` | 用户点击按钮触发 | 调用 `startWorkflow` API |
| **创建时** | `on_create` | 业务对象创建后自动触发 | Entity Subscriber 监听 |
| **更新时** | `on_update` | 业务对象更新后自动触发 | Entity Subscriber 监听 |
| **状态变更时** | `on_status_change` | 指定状态变化时触发 | Entity Subscriber + 条件判断 |

### 5.2 触发配置示例

```json
// 项目立项审批触发配置
{
  "businessType": "project",
  "triggerEvent": "manual",
  "name": "项目立项审批"
}

// 新增客户审批触发配置
{
  "businessType": "customer",
  "triggerEvent": "on_create",
  "name": "新增客户审批"
}

// 严重缺陷关闭审批触发配置
{
  "businessType": "ticket",
  "triggerEvent": "on_status_change",
  "statusTriggerValues": ["4"],
  "condition": "${ticket.severity} in ['1', '2']"
}
```

### 5.3 事件监听实现

**新文件**: `nest-admin/src/common/listeners/workflow-trigger.listener.ts`

```typescript
@EventSubscriber()
export class WorkflowTriggerListener implements EntitySubscriberInterface {

  constructor(
    private dataLoader: WorkflowDataLoaderService,
    private eventBus: EventBus,
  ) {}

  afterInsert(event: InsertEvent<any>): void {
    const entity = event.entity;
    const config = this.dataLoader.getTriggerConfig(entity.constructor.name, 'on_create');
    if (config) {
      this.eventBus.publish(new WorkflowTriggerEvent({
        businessType: config.businessType,
        businessKey: `${config.businessType}_${entity.id}`,
        triggerEvent: 'on_create',
        entity,
      }));
    }
  }

  afterUpdate(event: UpdateEvent<any>): void {
    const entity = event.entity;
    const oldEntity = event.databaseEntity;

    const statusChanged = this.isStatusChanged(entity, oldEntity);
    if (statusChanged) {
      const config = this.dataLoader.getTriggerConfig(entity.constructor.name, 'on_status_change');
      if (config && this.matchStatusTrigger(entity, config)) {
        this.eventBus.publish(new WorkflowTriggerEvent({
          businessType: config.businessType,
          businessKey: `${config.businessType}_${entity.id}`,
          triggerEvent: 'on_status_change',
          entity,
          oldEntity,
        }));
      }
    }
  }

  private isStatusChanged(entity: any, oldEntity: any): boolean {
    return entity.status !== oldEntity?.status;
  }

  private matchStatusTrigger(entity: any, config: any): boolean {
    if (!config.statusTriggerValues) return false;
    return config.statusTriggerValues.includes(entity.status);
  }
}
```

---

## 六、组织架构审批人设计

### 6.1 审批人来源类型

| 来源类型 | 值 | 说明 | 示例 |
|---------|---|------|------|
| **指定用户** | `user` | 固定选择某个用户 | 选择「张经理」 |
| **指定角色** | `role` | 选择拥有特定角色的用户 | 选择「项目经理」角色 |
| **部门负责人** | `dept_leader` | 选择部门负责人 | 当前处理人的部门负责人 |
| **部门成员** | `dept_member` | 选择部门成员 | 提交人所在部门的任意成员 |
| **业务字段** | `field` | 从业务数据字段获取 | `${project.leader.id}` |
| **表达式** | `expression` | 自定义表达式 | `${submitter.dept.leader.id}` |

### 6.2 审批人解析服务

**新文件**: `nest-admin/src/common/services/workflow-assignee-resolver.service.ts`

```typescript
@Injectable()
export class WorkflowAssigneeResolverService {

  constructor(
    @InjectRepository(User)
    private userRepo: Repository<User>,
    @InjectRepository(Dept)
    private deptRepo: Repository<Dept>,
  ) {}

  async resolve(assigneeConfig: AssigneeConfig, businessData: BusinessData): Promise<string[]> {
    switch (assigneeConfig.type) {
      case 'user':
        return [assigneeConfig.userId];

      case 'role':
        return this.findUsersByRole(assigneeConfig.roleId);

      case 'dept_leader':
        return this.findDeptLeader(businessData, assigneeConfig.deptPath);

      case 'dept_member':
        return this.findDeptMembers(businessData, assigneeConfig.deptPath);

      case 'field':
        return this.resolveFromField(businessData, assigneeConfig.fieldPath);

      case 'expression':
        return this.resolveExpression(assigneeConfig.expression, businessData);

      default:
        return [];
    }
  }

  private async findDeptLeader(businessData: BusinessData, deptPath: string): Promise<string[]> {
    const deptId = this.resolvePath(businessData.data, deptPath);
    if (!deptId) return [];

    const dept = await this.deptRepo.findOne({
      where: { id: deptId },
      relations: ['leader'],
    });

    return dept?.leader ? [dept.leader.id] : [];
  }

  private async findDeptMembers(businessData: BusinessData, deptPath: string): Promise<string[]> {
    const deptId = this.resolvePath(businessData.data, deptPath);
    if (!deptId) return [];

    const users = await this.userRepo.find({
      where: { deptId },
      select: ['id'],
    });

    return users.map(u => u.id);
  }

  private async resolveFromField(businessData: BusinessData, fieldPath: string): Promise<string[]> {
    const value = this.resolvePath(businessData.data, fieldPath);
    if (!value) return [];
    return Array.isArray(value) ? value : [value];
  }

  private async resolveExpression(expression: string, businessData: BusinessData): Promise<string[]> {
    const match = expression.match(/\$\{([^}]+)\}/);
    if (!match) return [];

    const fieldPath = match[1];
    const value = this.resolvePath(businessData.data, fieldPath);

    return value ? [value] : [];
  }

  private resolvePath(data: any, path: string): any {
    return path.split('.').reduce((obj, key) => obj?.[key], data);
  }

  private async findUsersByRole(roleId: string): Promise<string[]> {
    const users = await this.userRepo
      .createQueryBuilder('user')
      .leftJoin('user.roles', 'role')
      .where('role.id = :roleId', { roleId })
      .select(['user.id'])
      .getMany();

    return users.map(u => u.id);
  }
}
```

### 6.3 部门实体扩展

**文件**: `nest-admin/src/modules/depts/entities/dept.entity.ts`

```typescript
@Column({ name: 'leader_id', nullable: true })
leaderId: string;

@ManyToOne(() => User)
@JoinColumn({ name: 'leader_id' })
leader: User;
```

---

## 七、后端核心实现

### 7.1 数据加载服务

**新文件**: `nest-admin/src/common/services/workflow-data-loader.service.ts`

```typescript
@Injectable()
export class WorkflowDataLoaderService {

  private loaders: Map<string, BusinessDataLoader> = new Map();
  private configs: Map<string, WorkflowBusinessConfig> = new Map();

  constructor(
    @InjectRepository(WorkflowBusinessConfig)
    private configRepo: Repository<WorkflowBusinessConfig>,
  ) {
    this.registerLoader('project', new ProjectLoader());
    this.registerLoader('customer', new CustomerLoader());
    this.registerLoader('ticket', new TicketLoader());
    this.registerLoader('change', new ChangeLoader());
  }

  async loadData(businessType: string, businessKey: string): Promise<BusinessData> {
    const loader = this.loaders.get(businessType);
    if (!loader) {
      throw new Error(`未注册的业务类型: ${businessType}`);
    }
    return loader.load(businessKey);
  }

  getFieldDefinitions(businessType: string): FieldDefinition[] {
    const loader = this.loaders.get(businessType);
    return loader?.getFields() || [];
  }

  resolveFieldValue(data: any, fieldPath: string): any {
    const parts = fieldPath.split('.');
    let value = data;
    for (const part of parts) {
      value = value?.[part];
    }
    return value;
  }

  getTriggerConfig(businessType: string, triggerEvent: string): TriggerConfig | null {
    const config = this.configs.get(businessType);
    if (!config) return null;
    return config.triggers?.[triggerEvent] || null;
  }

  private registerLoader(type: string, loader: BusinessDataLoader): void {
    this.loaders.set(type, loader);
  }
}
```

### 7.2 数据加载器接口

```typescript
interface BusinessDataLoader {
  load(businessKey: string): Promise<BusinessData>;
  getFields(): FieldDefinition[];
}

interface BusinessData {
  id: string;
  type: string;
  data: Record<string, any>;
}

interface FieldDefinition {
  name: string;
  label: string;
  type: 'string' | 'number' | 'date' | 'boolean' | 'enum' | 'relation';
  relationEntity?: string;
  enumValues?: { label: string; value: any }[];
}
```

### 7.3 项目数据加载器

**新文件**: `nest-admin/src/modulesBusi/workflow/loaders/project.loader.ts`

```typescript
@Injectable()
export class ProjectLoader implements BusinessDataLoader {

  constructor(
    @InjectRepository(Project)
    private projectRepo: Repository<Project>,
  ) {}

  async load(businessKey: string): Promise<BusinessData> {
    const id = businessKey.replace('project_', '');

    const project = await this.projectRepo.findOne({
      where: { id },
      relations: ['leader', 'department', 'customer'],
    });

    return {
      id: project.id,
      type: 'project',
      data: {
        id: project.id,
        name: project.name,
        code: project.code,
        budget: project.budget,
        actualCost: project.actualCost,
        status: project.status,
        priority: project.priority,
        leader: project.leader ? {
          id: project.leader.id,
          nickname: project.leader.nickname,
          deptId: project.leader.deptId,
        } : null,
        department: project.department ? {
          id: project.department.id,
          name: project.department.name,
          leaderId: project.department.leaderId,
        } : null,
        customer: project.customer ? {
          id: project.customer.id,
          name: project.customer.name,
        } : null,
      },
    };
  }

  getFields(): FieldDefinition[] {
    return [
      { name: 'id', label: '项目ID', type: 'string' },
      { name: 'name', label: '项目名称', type: 'string' },
      { name: 'code', label: '项目编号', type: 'string' },
      { name: 'budget', label: '预算', type: 'number' },
      { name: 'actualCost', label: '实际成本', type: 'number' },
      { name: 'status', label: '状态', type: 'enum' },
      { name: 'priority', label: '优先级', type: 'enum' },
      { name: 'leader.id', label: '负责人ID', type: 'string' },
      { name: 'leader.nickname', label: '负责人姓名', type: 'relation' },
      { name: 'leader.deptId', label: '负责人部门ID', type: 'string' },
      { name: 'department.id', label: '部门ID', type: 'string' },
      { name: 'department.name', label: '部门名称', type: 'relation' },
      { name: 'department.leaderId', label: '部门负责人ID', type: 'string' },
      { name: 'customer.id', label: '客户ID', type: 'string' },
      { name: 'customer.name', label: '客户名称', type: 'relation' },
    ];
  }
}
```

### 7.4 其他数据加载器

| 文件 | 说明 |
|-----|------|
| `loaders/customer.loader.ts` | 客户数据加载器 |
| `loaders/ticket.loader.ts` | 工单数据加载器 |
| `loaders/change.loader.ts` | 变更数据加载器 |

### 7.5 修改 WorkflowService

**文件**: `nest-admin/src/modulesBusi/workflow/service.ts`

```typescript
// 新增依赖注入
constructor(
  // ... 现有依赖
  private readonly dataLoader: WorkflowDataLoaderService,
  private readonly assigneeResolver: WorkflowAssigneeResolverService,
) {}

// 修改 startWorkflow 方法
async startWorkflow(dto: StartWorkflowDto, starterId: string): Promise<WorkflowInstance> {
  const definition = await this.getDefinitionByCode(dto.code);

  let variables = dto.variables || {};
  if (definition.businessType) {
    const businessData = await this.dataLoader.loadData(
      definition.businessType,
      dto.businessKey
    );
    variables = {
      ...variables,
      [definition.businessType]: businessData.data,
    };
  }

  const instance = this.instanceRepo.create({
    definitionId: definition.id,
    definitionCode: definition.code,
    businessKey: dto.businessKey,
    starterId,
    variables,
    status: InstanceStatus.RUNNING,
    startTime: new Date().toISOString(),
  });

  const savedInstance = await this.instanceRepo.save(instance);
  await this.executeNode(savedInstance, definition, 0);

  return savedInstance;
}

// 修改 getFieldValue，支持嵌套访问
private getFieldValue(field: string, variables: Record<string, any>): any {
  if (field.startsWith('${') && field.endsWith('}')) {
    const path = field.slice(2, -1).replace('variables.', '');
    const parts = path.split('.');
    let value = variables;
    for (const part of parts) {
      value = value?.[part];
    }
    return value;
  }
  return variables[field];
}
```

### 7.6 修改审批节点处理器

**文件**: `nest-admin/src/modulesBusi/workflow/handler/impl/approval-node.handler.ts`

```typescript
private async createApprovalTask(instance: WorkflowInstance, node: NodeConfig, context: NodeExecutionContext): Promise<void> {
  const props = node.properties as ApprovalNodeProperties;
  let assigneeIds: string[] = [];

  switch (props.assigneeType) {
    case 'user':
      assigneeIds = [props.assigneeValue];
      break;

    case 'role':
      assigneeIds = await this.assigneeResolver.resolve(
        { type: 'role', roleId: props.roleId },
        context.variables._businessData
      );
      break;

    case 'dept_leader':
      assigneeIds = await this.assigneeResolver.resolve(
        { type: 'dept_leader', deptPath: props.deptPath || 'submitter.deptId' },
        context.variables._businessData
      );
      break;

    case 'dept_member':
      assigneeIds = await this.assigneeResolver.resolve(
        { type: 'dept_member', deptPath: props.deptPath || 'submitter.deptId' },
        context.variables._businessData
      );
      break;

    case 'field':
      assigneeIds = await this.assigneeResolver.resolve(
        { type: 'field', fieldPath: props.assigneeExpr },
        context.variables._businessData
      );
      break;

    case 'dynamic':
      assigneeIds = await this.assigneeResolver.resolve(
        { type: 'expression', expression: props.assigneeExpr },
        context.variables._businessData
      );
      break;
  }

  // ... 创建任务逻辑
}
```

---

## 八、前端设计器改造

### 8.1 流程属性配置

**文件**: `nest-admin-frontend/src/views/business/workflow/designer.vue`

**新增配置项**：

```vue
<el-form-item label="业务对象">
  <el-select v-model="form.businessType" placeholder="选择业务对象">
    <el-option label="项目" value="project" />
    <el-option label="客户" value="customer" />
    <el-option label="工单" value="ticket" />
    <el-option label="变更请求" value="change" />
  </el-select>
</el-form-item>

<el-form-item label="触发方式">
  <el-select v-model="form.triggerEvent" @change="onTriggerEventChange">
    <el-option label="手动触发" value="manual" />
    <el-option label="创建时自动" value="on_create" />
    <el-option label="状态变更时" value="on_status_change" />
  </el-select>
</el-form-item>

<el-form-item v-if="form.triggerEvent === 'on_status_change'" label="触发条件">
  <el-select v-model="form.triggerStatus" placeholder="选择触发状态">
    <el-option
      v-for="status in availableStatuses"
      :key="status.value"
      :label="status.label"
      :value="status.value"
    />
  </el-select>
</el-form-item>
```

### 8.2 审批人选择器组件

**新文件**: `nest-admin-frontend/src/components/workflow/ApproverSelector.vue`

```vue
<template>
  <div class="approver-selector">
    <el-select v-model="sourceType" @change="onSourceTypeChange">
      <el-option label="指定用户" value="user" />
      <el-option label="指定角色" value="role" />
      <el-option label="部门负责人" value="dept_leader" />
      <el-option label="部门成员" value="dept_member" />
      <el-option label="业务字段" value="field" />
      <el-option label="表达式" value="expression" />
    </el-select>

    <!-- 指定用户 -->
    <UserSelect v-if="sourceType === 'user'" v-model="config.userId" @change="emitUpdate" />

    <!-- 指定角色 -->
    <el-select v-if="sourceType === 'role'" v-model="config.roleId" placeholder="选择角色" @change="emitUpdate">
      <el-option v-for="role in roles" :key="role.id" :label="role.name" :value="role.id" />
    </el-select>

    <!-- 部门负责人/成员 -->
    <div v-if="sourceType === 'dept_leader' || sourceType === 'dept_member'" class="dept-selector">
      <el-select v-model="config.deptPath" placeholder="选择部门字段" @change="emitUpdate">
        <el-option-group label="可用字段">
          <el-option v-for="field in deptFields" :key="field.name" :label="field.label" :value="field.name" />
        </el-option-group>
      </el-select>
    </div>

    <!-- 业务字段 -->
    <div v-if="sourceType === 'field'" class="field-selector">
      <el-cascader
        v-model="config.fieldPath"
        :options="fieldOptions"
        :props="{ label: 'label', value: 'name' }"
        placeholder="选择字段"
        @change="emitUpdate"
      />
    </div>

    <!-- 表达式 -->
    <div v-if="sourceType === 'expression'" class="expression-input">
      <el-input v-model="config.expression" placeholder="${project.leader.id}" @input="emitUpdate" />
    </div>
  </div>
</template>

<script setup>
const props = defineProps({
  modelValue: Object,
  businessType: String,
});

const emit = defineEmits(['update:modelValue']);

const sourceType = ref('field');
const config = ref({});
const roles = ref([]);

const fieldOptions = computed(() => {
  return fieldDefinitions[props.businessType] || [];
});

const deptFields = computed(() => {
  return fieldOptions.value.filter(f =>
    f.name.includes('deptId') ||
    f.name.includes('department') ||
    f.type === 'relation' && f.relationEntity === 'Dept'
  );
});

const onSourceTypeChange = () => {
  config.value = { type: sourceType.value };
  emitUpdate();
};

const emitUpdate = () => {
  emit('update:modelValue', config.value);
};
</script>
```

### 8.3 条件构建器组件

**新文件**: `nest-admin-frontend/src/components/workflow/ConditionBuilder.vue`

```vue
<template>
  <div class="condition-builder">
    <div class="condition-row">
      <el-select v-model="condition.fieldSource" @change="onFieldSourceChange">
        <el-option label="业务字段" value="field" />
        <el-option label="表达式" value="expression" />
      </el-select>

      <!-- 字段选择 -->
      <template v-if="condition.fieldSource === 'field'">
        <el-cascader
          v-model="condition.field"
          :options="fieldOptions"
          :props="{ label: 'label', value: 'name' }"
          placeholder="选择字段"
          @change="emitUpdate"
        />
      </template>
      <el-input v-else v-model="condition.field" placeholder="${project.budget}" @input="emitUpdate" />

      <!-- 操作符 -->
      <el-select v-model="condition.operator" @change="emitUpdate">
        <el-option label="等于" value="eq" />
        <el-option label="不等于" value="neq" />
        <el-option label="大于" value="gt" />
        <el-option label="大于等于" value="gte" />
        <el-option label="小于" value="lt" />
        <el-option label="小于等于" value="lte" />
        <el-option label="包含" value="contains" />
        <el-option label="为空" value="isNull" />
      </el-select>

      <!-- 值输入 -->
      <template v-if="!['isNull', 'isNotNull'].includes(condition.operator)">
        <el-select v-if="selectedFieldDef?.type === 'enum'" v-model="condition.value" placeholder="选择值" @change="emitUpdate">
          <el-option v-for="opt in selectedFieldDef.enumValues" :key="opt.value" :label="opt.label" :value="opt.value" />
        </el-select>
        <el-input v-else-if="selectedFieldDef?.type === 'number'" v-model="condition.value" type="number" placeholder="输入数字" @input="emitUpdate" />
        <el-input v-else v-model="condition.value" placeholder="输入值" @input="emitUpdate" />
      </template>

      <el-button type="danger" @click="$emit('remove')">删除</el-button>
    </div>

    <div class="condition-expr-preview">
      表达式预览: <code>{{ expressionPreview }}</code>
    </div>
  </div>
</template>

<script setup>
const props = defineProps({
  modelValue: Object,
  businessType: String,
});

const emit = defineEmits(['update:modelValue', 'remove']);

const condition = ref({
  fieldSource: 'field',
  field: [],
  operator: 'eq',
  value: '',
});

const fieldOptions = computed(() => {
  return fieldDefinitions[props.businessType] || [];
});

const selectedFieldDef = computed(() => {
  if (!condition.value.field?.length) return null;
  const fieldName = condition.value.field.join('.');
  return fieldOptions.value.find(f => f.name === fieldName);
});

const expressionPreview = computed(() => {
  if (condition.value.fieldSource === 'field' && condition.value.field?.length) {
    return `\${${condition.value.field.join('.')}} ${condition.value.operator} ${condition.value.value || '...'}`;
  }
  return condition.value.field || '...';
});

const onFieldSourceChange = () => {
  condition.value.field = [];
  condition.value.value = '';
  emitUpdate();
};

const emitUpdate = () => {
  emit('update:modelValue', { ...condition.value });
};
</script>
```

---

## 九、实施步骤

### Phase 1：基础设施（Day 1-2）

| 步骤 | 文件 | 说明 |
|-----|------|------|
| 1.1 | `wf_business_config` 实体 | 新建业务对象配置表 |
| 1.2 | `WorkflowDataLoaderService` | 数据加载服务框架 |
| 1.3 | 业务对象配置接口 | 定义加载器接口 |

### Phase 2：数据加载器（Day 3-5）

| 步骤 | 文件 | 说明 |
|-----|------|------|
| 2.1 | `ProjectLoader` | 项目数据加载器 |
| 2.2 | `CustomerLoader` | 客户数据加载器 |
| 2.3 | `TicketLoader` | 工单数据加载器 |
| 2.4 | `ChangeLoader` | 变更数据加载器 |

### Phase 3：组织架构支持（Day 6-7）

| 步骤 | 文件 | 说明 |
|-----|------|------|
| 3.1 | `Dept` 实体扩展 | 增加 leaderId 字段 |
| 3.2 | `WorkflowAssigneeResolverService` | 审批人解析服务 |

### Phase 4：工作流引擎改造（Day 8-10）

| 步骤 | 文件 | 说明 |
|-----|------|------|
| 4.1 | `WorkflowService.startWorkflow()` | 自动加载业务数据 |
| 4.2 | `WorkflowService.getFieldValue()` | 支持嵌套属性 |
| 4.3 | `approval-node.handler.ts` | 支持新审批人类型 |
| 4.4 | `condition-node.handler.ts` | 支持嵌套属性条件 |

### Phase 5：触发机制（Day 11-12）

| 步骤 | 文件 | 说明 |
|-----|------|------|
| 5.1 | `WorkflowTriggerListener` | 事件监听器 |
| 5.2 | 触发配置管理 | 触发时机配置逻辑 |

### Phase 6：前端设计器（Day 13-16）

| 步骤 | 文件 | 说明 |
|-----|------|------|
| 6.1 | `ApproverSelector.vue` | 审批人选择器组件 |
| 6.2 | `ConditionBuilder.vue` | 条件构建器组件 |
| 6.3 | `designer.vue` | 设计器集成新组件 |

### Phase 7：业务集成（Day 17-18）

| 步骤 | 文件 | 说明 |
|-----|------|------|
| 7.1 | 各业务实体新增工作流字段 | workflowInstanceId, approvalStatus, currentNodeName |

### Phase 8：测试验证（Day 19-20）

| 步骤 | 内容 |
|-----|------|
| 8.1 | 单元测试 |
| 8.2 | 集成测试 |
| 8.3 | 端到端测试 |

---

## 十、数据库迁移脚本

```sql
-- 1. 创建业务对象配置表
CREATE TABLE `wf_business_config` (
  `business_type` VARCHAR(50) NOT NULL COMMENT '业务对象类型',
  `name` VARCHAR(100) NOT NULL COMMENT '业务对象名称',
  `table_name` VARCHAR(50) NOT NULL COMMENT '对应的数据库表名',
  `id_field` VARCHAR(50) DEFAULT 'id' COMMENT 'ID字段名',
  `field_definitions` TEXT COMMENT '字段定义JSON',
  `data_loader_class` VARCHAR(200) COMMENT '数据加载器类名',
  `trigger_config` JSON COMMENT '触发时机配置',
  `is_active` CHAR(1) DEFAULT '1' COMMENT '是否启用',
  PRIMARY KEY (`business_type`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='工作流业务对象配置表';

-- 2. 给 Dept 实体增加 leaderId 字段
ALTER TABLE `sys_dept` ADD COLUMN `leader_id` VARCHAR(36) COMMENT '部门负责人ID';

-- 3. 给各业务表增加工作流字段
ALTER TABLE `projects`
  ADD COLUMN `workflow_instance_id` VARCHAR(100) COMMENT '工作流实例ID',
  ADD COLUMN `approval_status` CHAR(1) DEFAULT '0' COMMENT '审批状态',
  ADD COLUMN `current_node_name` VARCHAR(100) COMMENT '当前审批节点名称';

ALTER TABLE `customers`
  ADD COLUMN `workflow_instance_id` VARCHAR(100) COMMENT '工作流实例ID',
  ADD COLUMN `approval_status` CHAR(1) DEFAULT '0' COMMENT '审批状态',
  ADD COLUMN `current_node_name` VARCHAR(100) COMMENT '当前审批节点名称';

ALTER TABLE `tickets`
  ADD COLUMN `workflow_instance_id` VARCHAR(100) COMMENT '工作流实例ID',
  ADD COLUMN `approval_status` CHAR(1) DEFAULT '0' COMMENT '审批状态',
  ADD COLUMN `current_node_name` VARCHAR(100) COMMENT '当前审批节点名称';

ALTER TABLE `changes`
  ADD COLUMN `workflow_instance_id` VARCHAR(100) COMMENT '工作流实例ID',
  ADD COLUMN `approval_status` CHAR(1) DEFAULT '0' COMMENT '审批状态',
  ADD COLUMN `current_node_name` VARCHAR(100) COMMENT '当前审批节点名称';

-- 4. 给流程定义表增加业务关联字段
ALTER TABLE `wf_definition`
  ADD COLUMN `business_type` VARCHAR(50) COMMENT '关联业务对象类型',
  ADD COLUMN `trigger_event` VARCHAR(50) COMMENT '触发事件',
  ADD COLUMN `status_trigger_values` JSON COMMENT '状态触发值';
```

---

## 十一、风险与注意事项

| 风险 | 影响 | 缓解措施 |
|-----|------|---------|
| 循环依赖 | 条件配置可能形成循环 | 设计时校验 |
| 审批人找不到 | 部门无负责人 | 配置默认审批人 |
| 数据加载失败 | 业务数据无法加载 | 降级处理，记录日志 |
| 触发死循环 | 状态变更触发又改变状态 | 记录已触发实例，防止重复 |

---

## 十二、总结

本方案实现：

1. **业务对象统一管理**：项目、客户、工单、变更请求四种业务对象支持
2. **触发时机灵活配置**：手动、创建时、状态变更时多种触发方式
3. **组织架构审批人**：支持部门负责人、部门成员等组织架构审批人类型
4. **可视化配置**：前端设计器支持字段选择、条件构建器等可视化配置
5. **自动数据加载**：工作流引擎自动加载业务数据，支持嵌套属性解析
6. **回调自动通知**：工作流完成后自动通知业务系统更新状态
