# IT 类项目交付管理系统 — 整体改造建议

> 太子·全面阅读现有代码后·起草
> 时间：2026-04-10

---

## 一、现有代码全面诊断

### 1.1 现有模块与文件

| 模块 | 实体数 | Service 复杂度 | 核心问题 |
|------|--------|--------------|---------|
| projects | 1个 entity | 统计聚合（弱） | 无合同/客户关联，无多迭代 |
| tasks | 1个 entity | 看板（基础） | 无需求归属，无工时明细 |
| tickets | 1个 entity | 仅 CRUD | bug/需求/反馈混为一谈 |
| project-members | 1个 entity | 成员管理（较完整） | 角色过少，无部门/职位 |
| task-comments | 1个 entity | 评论管理（完整） | OK |
| documents | 1个 entity | 版本升级（基础） | OK，但未与交付物挂钩 |
| workflow | 4个 entity | 引擎核心（完整） | **未与项目/任务打通** |
| crm | ? 个 entity | 权限不足无法读 | **未与项目打通** |

**总计**：8个业务模块，但项目/需求/缺陷各自闭环，CRM和Workflow与项目完全隔离。

---

### 1.2 当前最关键的架构问题

#### 问题A：DTO 层形同虚设

所有 DTO 都是 `PartialType(Entity)` —— 意味着：
- **无创建/更新区分**：用一个 DTO 既做创建又做更新，ID 可为空也可不为空
- **无校验规则**：没有任何 `@IsNotEmpty`/`@IsEnum` 等校验
- **直接暴露实体**：前端可修改任何字段（包括 isDelete 等系统字段）

```typescript
// 现有 DTO - 毫无管控
export class ProjectDto extends PartialType(Project) {}  // 全部字段可写
export class TaskDto extends PartialType(Task) {}        // 全部字段可写
export class TicketDto extends PartialType(Ticket) {}   // 全部字段可写
```

**正确的做法**：必须有 `CreateProjectDto`（必填校验）/ `UpdateProjectDto`（可选）/ `QueryProjectDto`（查询过滤）三者分开。

#### 问题B：Service 层无业务逻辑

所有 Service 都是 `BaseService` 的 CRUD + 少量拓展方法：

- `ProjectsService`：只有 `getStatistics()` 一个聚合方法
- `TasksService`：只有 `updateProgress()` + `getKanbanData()`
- `TicketsService`：**只有一个 list() 方法**，完全空壳
- `BaseService`：承担了大部分工作（save/add/update/del 都写了，但实体字段校验几乎为零）

这导致：
1. **没有项目 → 需求 → 任务 → 工时的链路**
2. **任务完成时不会自动更新需求的完成状态**
3. **工时无法自动汇总到项目层**
4. **Bug 关闭时不影响关联的任务状态**

#### 问题C：模块之间完全隔离

- **Project 不关联 Customer**：项目属于哪个客户？合同金额多少？无从得知
- **Task 不归属 Requirement**：任务颗粒度没有上一层管控
- **Task 不关联 Iteration**：无法按迭代查看任务进度
- **Workflow 引擎完全独立**：任务要不要审批？走哪个流程？完全没有挂接
- **WorkLog 不存在**：工时只能填在 Task 上，无法记录每天的工作明细

#### 问题D：Ticket 承担了 3 种职责

Ticket.type = bug / requirement / feedback，这三者的生命周期完全不同：

| 类型 | 提出人 | 处理流程 | 闭环标准 |
|------|--------|---------|---------|
| Bug（缺陷） | 测试/客户 | 发现→指派→修复→验证→关闭 | 测试验证通过 |
| Requirement（需求） | 客户/产品 | 需求评审→估时→开发→UAT→关闭 | 客户验收通过 |
| Feedback（反馈） | 客户 | 记录→回复→关闭 | 客服回复即闭环 |

用同一个 Ticket 表和三套枚举值处理这三种完全不同的实体，是设计失误。

---

## 二、整体业务流设计建议

### 2.1 IT 交付项目标准生命周期

```
【启动阶段】
  客户签约
    ↓
  创建项目（关联合同 + 客户）
    ↓
【规划阶段】
  制定里程碑/迭代计划
    ↓
  需求调研 → 需求录入 → 需求评审 → 需求确认
    ↓
【执行阶段】
  迭代一开发
    ↓ 需求拆解 → 任务创建 → 执行任务（填工时）→ 任务完成
    ↓
  测试 → Bug创建 → Bug修复 → Bug关闭
    ↓
  迭代二开发 ...
【UAT阶段】
  客户验收测试 → 问题记录 → 修复 → 重新验收
【上线阶段】
  上线部署 → 交付物确认 → 项目关闭
【运维阶段】
  客户报障 → 工单创建 → 处理 → 关闭 → 满意度评价
```

### 2.2 核心数据流

```
Contract（合同）
    │
    ├── customerId → Customer（客户）
    │
    └── Project（交付项目）
            │
            ├── Iteration × N（迭代/里程碑）
            │       │
            │       └── Task × N（开发任务）
            │               │
            │               ├── WorkLog × N（工时明细）
            │               └── TaskComment × N
            │
            ├── Requirement × N（客户需求）
            │       │
            │       ├── Task × N（需求拆解的任务）
            │       │
            │       └── Bug × N（需求相关缺陷）
            │
            ├── Bug × N（测试/客户发现的缺陷，独立于需求）
            │
            ├── Document × N（交付物文档）
            │
            └── ProjectMember × N（项目成员）
                    │
                    └── 可挂 role：项目经理/开发/测试/产品/运维/客户

Ticket × N（运维工单，独立于项目生命周期）
    │
    ├── TicketComment × N
    └── 与 Project 可关联，但属于运维层
```

### 2.3 与现有模块的关系

| 改造后实体 | 来源 | 与现有模块关系 |
|-----------|------|-------------|
| Requirement | **新建** | Ticket.reqirement 类型踢出后新建 |
| Iteration | **新建** | Project.startDate/endDate 拆分为多迭代 |
| Bug | **新建** | Ticket.bug 类型踢出后新建 |
| WorkLog | **新建** | 无对应模块 |
| Project.extension | **改造** | 新增合同/客户/阶段/预算/交付物 |
| Task.extension | **改造** | 新增需求归属/迭代归属/工时/依赖/评审 |
| Ticket.extension | **改造** | 类型重定义为运维工单（support/change/incident/consultation）|

---

## 三、字段级改造建议

### 3.1 Project（项目）— 保留基础，新增 15 个

**现有 10 字段**：name, code, leaderId, startDate, endDate, status, priority, description, attachments, isArchived

**新增字段（按 IT 交付逻辑分组）**：

```
【合同与客户】
  contractId        关联合同ID
  customerId         客户ID（→ CRM Customer）
  salesId            销售负责人（对接客户的人）
  contractAmount     合同金额
  currency           币种（默认CNY）

【时间计划】
  planStartDate      计划开始（基准，用于对比实际）
  planEndDate        计划结束（基准）
  phase              项目阶段（planning/setup/dev/uat/launch/closing/completed）

【交付与质量】
  deliverables       交付物清单（JSON，含状态：pending/submitted/approved/rejected）
  overallProgress    项目整体完成度（自动汇总任务进度）
  riskLevel          风险等级（1低/2中/3高）
  rating             项目评级（A/B/C/D）

【工时成本】
  totalEstimatedHours   总预估工时
  totalActualHours     总实际工时（自动汇总 WorkLog）
  totalCost            已发生成本

【组织】
  departmentId        所属部门
  creatorId           发起人/项目经理
  satisfaction        客户满意度（1-5星）
```

### 3.2 Iteration（迭代/里程碑）— 新建实体，核心表

现有 Project 只有一对 startDate/endDate，无法管理多迭代。

```
ProjectIteration（迭代）
  projectId          所属项目（FK）
  name               迭代名称（如"需求分析"、"Sprint 1"、"UAT"）
  code               迭代编号
  goal               迭代目标与范围
  planStartDate      计划开始
  planEndDate        计划结束
  actualStartDate    实际开始
  actualEndDate      实际结束
  status             状态（notStarted/inProgress/completed）
  progress           完成度（0-100）
  ownerId            负责人
  sortOrder          排序号
```

### 3.3 Requirement（需求）— 新建实体，核心表

Ticket 混合了需求/缺陷/反馈，需求必须独立。

```
Requirement（需求）
  projectId          所属项目（FK）
  iterationId        计划迭代（FK，可空）
  title              需求标题
  code               需求编号
  source             来源（customer/sales/product/operation/internal）
  status             状态（draft/submitted/reviewing/approved/rejected/developing/testing/completed/closed）
  description        需求描述
  requesterId        提出人ID
  requesterName      提出人名称
  priority           优先级（P0/P1/P2/P3）
  estimatedDays       预估人天
  actualDays         实际人天
  acceptanceCriteria 验收标准（JSON数组，含是否通过）
  reviewerId         评审人ID
  reviewComment      评审意见
  reviewTime        评审时间
  completedTime      完成时间
  tags               标签（JSON）
  attachments        附件（JSON）
```

### 3.4 Task（任务）— 扩展，核心表

在现有基础上新增：

```
【归属扩展】
  requirementId      关联需求（FK，可空 — 独立任务不需要需求）
  iterationId        所属迭代（FK）

【任务分类】
  taskType           任务类型（development/testing/deployment/documentation/meeting/other）

【工时】
  estimatedHours     预估工时（小时）
  actualHours        实际工时（小时） ← 汇总自 WorkLog

【依赖】
  blockedBy          前置任务ID列表（JSON）— 本任务等待这些完成
  blocks             被本任务阻塞的任务ID列表（JSON）

【评审】
  needReview         是否需要评审（0/1）
  reviewerId         评审人ID
  reviewStatus       评审状态（pending/approved/rejected）

【完成信息】
  actualStartDate    实际开始时间
  actualEndDate      实际完成时间
  completionNote     完成备注

【细分优先级】
  urgency            紧急程度（1一般/2紧急/3非常紧急）
```

### 3.5 Bug（缺陷）— 新建实体

从 Ticket 拆出，独立生命周期。

```
Bug（缺陷）
  projectId          所属项目（FK）
  taskId             关联任务（FK，可空）
  requirementId      关联需求（FK，可空）
  title              Bug标题
  code               Bug编号
  severity           严重等级（blocker/critical/major/minor/trivial）
  priority           优先级（P0/P1/P2/P3）
  status             状态（new/confirmed/assigned/inProgress/resolved/closed/reopened/rejected）
  description        Bug描述
  reproduceSteps     重现步骤
  foundVersion       发现版本
  fixedVersion       修复版本
  module             所属模块
  reporterId         发现人ID
  assigneeId         指派给（FK）
  solution           解决方案
  fixedTime          修复时间
  closedTime         关闭时间
  attachments        附件（JSON）
```

### 3.6 WorkLog（工时记录）— 新建实体

工时必须记在每天的工作记录上，而不是只填一个估算值。

```
ProjectWorklog（工时记录）
  taskId             关联任务（FK）
  projectId          所属项目（FK，冗余便于查询）
  userId             记录人（FK）
  workDate           工作日期
  hours              工时数（小时）
  content            工作内容描述
  workType           工作类型（development/testing/meeting/admin/other）
```

### 3.7 Ticket（工单）— 彻底改造为运维工单

**彻底替换类型枚举**，不再是 bug/requirement/feedback。

```
Ticket（工单/服务请求）
  保留: projectId, taskId, title, content, attachments, solution
  替换/新增:
    code               工单编号
    type               类型（support技术支持/change变更请求/incident故障报修/consultation业务咨询/other）
    status             状态（pending/assigned/inProgress/resolved/closed/reopened）
    priority           优先级（P0紧急/P1高/P2中/P3低）
    impactScope        影响范围（1个人/2部门/3全公司/4客户）
    serviceWindow      服务时段（workday工作日/emergency紧急响应/anytime随时）
    slaHours           SLA时限（小时）
    resolutionHours    实际解决时长
    isChange           是否关联变更（0/1）
    changeCode         关联变更单号
    satisfaction       满意度（1-5）
    feedback           评价备注
    closedTime         关闭时间
```

### 3.8 ProjectMember（项目成员）— 扩展

```
保留: projectId, userId, role, isActive
新增:
  joinedTime          加入时间
  departmentId        所属部门
  jobTitle            工作角色（如"前端开发"、"产品经理"）
  notifyEnabled       是否接收通知（0/1）
```

---

## 四、Service 层业务逻辑建议

### 4.1 改造原则

**所有 Service 不再只是 BaseService 的 CRUD**，每个核心实体需要专属业务方法。

### 4.2 ProjectsService 新增方法

```typescript
// 工时自动汇总
async calculateTotalHours(projectId: string): Promise<void>

// 项目完成度自动计算（基于任务进度）
async calculateOverallProgress(projectId: string): Promise<void>

// 需求完成状态推进（当关联任务全部完成时）
async advanceRequirementStatus(requirementId: string): Promise<void>

// 获取项目全貌（项目+迭代+需求+任务+Bug+工时汇总）
async getProjectFullView(projectId: string): Promise<ProjectFullView>

// 项目健康度检查（延期任务数/未关闭Bug数/超SLA工单数）
async getProjectHealth(projectId: string): Promise<HealthReport>
```

### 4.3 RequirementsService 新增方法

```typescript
// 需求评审通过后创建对应任务（自动拆分）
async createTasksFromRequirement(requirementId: string): Promise<Task[]>

// 需求评审
async review(id: string, reviewerId: string, approved: boolean, comment: string): Promise<void>

// 需求状态流转（draft→submitted→reviewing→approved/rejected→developing→testing→completed）
async advanceStatus(id: string, nextStatus: RequirementStatus): Promise<void>

// 获取需求下的任务进度
async getRequirementProgress(requirementId: string): Promise<{total: number, completed: number, progress: number}>
```

### 4.4 TasksService 新增方法

```typescript
// 完成任务时：自动记录 actualHours，汇总到 WorkLog
async completeTask(id: string, completionNote?: string): Promise<void>

// 检查并更新阻塞状态（blockedBy 任务是否全部完成）
async checkAndUnblockTasks(taskId: string): Promise<void>

// 获取任务甘特图数据（含依赖关系）
async getGanttData(iterationId: string): Promise<GanttTask[]>

// 任务工时自动汇总（actualHours = SUM(worklog.hours)）
async syncActualHours(taskId: string): Promise<void>
```

### 4.5 BugsService 新增方法

```typescript
// Bug 创建时自动关联到需求/任务
async autoLinkToRequirement(bugId: string): Promise<void>

// Bug 修复完成，通知测试验证
async notifyForVerification(bugId: string): Promise<void>

// Bug 关闭时更新关联任务状态
async syncTaskStatus(bugId: string): Promise<void>
```

### 4.6 WorkLogsService 新增方法

```typescript
// 记录工时（自动汇总到 Task.actualHours）
async logWork(dto: CreateWorkLogDto, userId: string): Promise<ProjectWorklog>

// 删除工时（同步更新 Task.actualHours）
async removeLog(id: string): Promise<void>

// 获取某任务的工时列表
async getTaskWorklogs(taskId: string): Promise<ProjectWorklog[]>

// 获取某人的工时统计（按日/周/月）
async getUserWorkReport(userId: string, startDate: string, endDate: string): Promise<WorkReport>
```

### 4.7 IterationsService 新增方法

```typescript
// 获取迭代任务看板
async getIterationKanban(iterationId: string): Promise<KanbanData>

// 迭代启动
async startIteration(id: string): Promise<void>

// 迭代完成（含验收确认）
async completeIteration(id: string): Promise<void>

// 迭代进度（汇总任务完成度）
async getIterationProgress(iterationId: string): Promise<number>
```

---

## 五、DTO 层重建建议

### 5.1 原则

**严禁用 `PartialType(Entity)` 代替 DTO**。

每个实体至少拆分为：
- `CreateXxxDto` — 创建时必填字段 + 校验
- `UpdateXxxDto` — 更新时可选字段 + 校验
- `QueryXxxDto` — 查询参数 + 分页

### 5.2 示例：Task DTO 改造

```typescript
// CreateTaskDto — 创建时必填
export class CreateTaskDto {
  @IsNotEmpty({ message: '任务名称不能为空' })
  @MaxLength(100)
  name: string

  @IsNotEmpty({ message: '所属项目不能为空' })
  projectId: string

  @IsOptional()
  requirementId?: string

  @IsOptional()
  iterationId?: string

  @IsOptional()
  @IsEnum(TaskType)
  taskType?: TaskType

  @IsOptional()
  @IsEnum(Priority)
  priority?: Priority

  @IsOptional()
  startDate?: string

  @IsOptional()
  endDate?: string

  @IsOptional()
  estimatedHours?: number

  @IsOptional()
  blockedBy?: string[]
}

// UpdateTaskDto — 更新时全部可选
export class UpdateTaskDto {
  @IsOptional()
  @MaxLength(100)
  name?: string

  @IsOptional()
  leaderId?: string

  @IsOptional()
  status?: TaskStatus

  @IsOptional()
  priority?: Priority

  @IsOptional()
  progress?: number

  @IsOptional()
  actualHours?: number

  // ...其他可选字段
}

// QueryTaskDto — 查询过滤
export class QueryTaskDto extends QueryListDto {
  @IsOptional()
  projectId?: string

  @IsOptional()
  requirementId?: string

  @IsOptional()
  iterationId?: string

  @IsOptional()
  status?: TaskStatus

  @IsOptional()
  leaderId?: string

  @IsOptional()
  @IsEnum(TaskType)
  taskType?: TaskType
}
```

---

## 六、权限与层级建议

### 6.1 ProjectMember 角色扩展

现有只有：manager / member / visitor

建议扩展为：

```
1 项目经理（PM）       可管理项目配置/成员/迭代
2 产品经理（PO）       可管理需求/排期
3 开发负责人           可拆解任务/指派
4 开发人员             执行任务
5 测试负责人           管理测试用例/Bug
6 测试人员             提交/验证Bug
7 运维人员             处理工单/变更
8 客户（外部）          提交需求/反馈，查看项目进展，验收
9 访客                只读
```

### 6.2 权限控制点

| 操作 | 权限要求 |
|------|---------|
| 创建项目 | 管理员 / 销售负责人 |
| 创建需求 | PO / 客户 |
| 拆解任务 | 开发负责人 |
| 完成任务 | 执行人 / PM |
| 审核需求 | PM / PO |
| 创建Bug | 测试 / 客户 |
| 关闭Bug | 测试负责人 |
| 处理工单 | 运维人员 |
| 查看工时统计 | PM 以上 |
| 项目归档 | 管理员 / PM |

---

## 七、工作流引擎集成建议

### 7.1 哪些场景要走工作流

| 场景 | 是否需要工作流 |
|------|-------------|
| 需求评审（重要需求） | ✅ 需要，通过审批节点 |
| 任务评审（重要任务） | ✅ 需要，通过审批节点 |
| 需求变更（影响范围大） | ✅ 需要，变更审批流程 |
| Bug 关闭（严重等级高） | ⚠️ 可选，根据严重等级 |
| 工单处理 | ⚠️ 可选，根据 SLA 级别 |
| 项目关闭 | ✅ 需要，PM + 客户双签 |
| 上线部署 | ✅ 需要，变更审批流程 |

### 7.2 集成方式

**建议**：在 `Task` 上新增 `workflowInstanceId` 字段，关联 `WorkflowInstance`。

```
Task 创建
  ↓
检查 Task.needReview === '1' ?
  ↓ 是
创建 WorkflowInstance（关联 Task）
  ↓
工作流引擎驱动审批节点
  ↓ 审批通过
Task.status 自动更新为下一个状态
```

同样，Requirement 也可挂 `workflowInstanceId`，通过工作流引擎管理评审流程。

---

## 八、实施路线图建议

### 第一阶段（基础骨架，2-3天）

1. **重建 DTO 层**：所有实体拆分 Create/Update/Query DTO，加上校验
2. **新建 Requirement 实体 + Service + Controller**
3. **新建 Iteration 实体 + Service + Controller**
4. **Project 扩展字段**（先加 contractId, customerId, phase, overallProgress）

### 第二阶段（任务与工时，2-3天）

5. **新建 WorkLog 实体 + Service**
6. **Task 扩展字段**（加 requirementId, iterationId, estimatedHours, blockedBy 等）
7. **Task Service 补充业务方法**（completeTask 时写 WorkLog，sync actualHours）
8. **ProjectsService 新增 calculateTotalHours / calculateOverallProgress**

### 第三阶段（缺陷与工单，2天）

9. **新建 Bug 实体 + Service + Controller**
10. **Ticket 彻底改造**（替换枚举 + 新增字段）
11. **新建 TicketComment 实体**

### 第四阶段（完善与集成，2-3天）

12. **ProjectMember 扩展字段**
13. **RequirementsService.createTasksFromRequirement()**
14. **工作流引擎与 Task/Requirement 关联**（workflowInstanceId 字段 + 集成逻辑）
15. **ProjectsService.getProjectFullView() / getProjectHealth()**

---

## 九、优先确认事项

在动手之前，请皇上明确以下事项：

1. **合同/客户模块是否已在 CRM 中完整实现？** Project 是否需要立即对接 `contractId` / `customerId`？

2. **是否需要工时计费？** 目前设计的 WorkLog 是用于进度追踪，如果还需要按人天计费，需要再加 billableHours / billingRate 字段。

3. **工作流审批的范围？** 需求评审是否全部走审批，还是只有 P0/P1 级别才走？

4. **Bug 和 Requirement 是否允许客户（外部用户）直接提交？** 这影响权限体系的设计。

5. **上线后运维是同一个系统还是独立系统？** Ticket 如果兼做运维工单，是否需要与项目生命周期完全分离？

皇上定夺后，太子即刻开始第一阶段实施。
