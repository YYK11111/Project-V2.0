# IT 系统交付项目管理系统改造方案

## 一、背景与目标

### 1.1 现状分析

当前项目管理系统仅具备基础的 CRUD 功能，无法满足 IT 系统交付的专业需求。主要存在以下问题：

- **需求管理问题**：缺乏变更控制机制，需求蔓延无法追踪
- **缺陷管理问题**：缺少完整的 Bug 生命周期、严重程度分级和根因分析
- **任务管理问题**：没有任务依赖关系管理，无法合理规划执行顺序
- **预算管理缺失**：无法跟踪项目成本和预算执行情况
- **敏捷能力不足**：缺乏 Sprint、Backlog 等敏捷迭代管理功能

### 1.2 改造目标

将现有系统改造为专业的 **IT 系统交付管理平台**，实现以下目标：

1. **支持敏捷交付**：引入 Sprint、Backlog、用户故事等概念
2. **强化质量控制**：完善缺陷管理流程，支持严重程度分级和根因分析
3. **加强变更管控**：建立变更请求审批机制，防止需求蔓延
4. **提升计划能力**：支持里程碑管理、任务依赖、燃尽图等可视化工具
5. **打通业务闭环**：与 CRM 深度集成，实现客户-合同-项目关联
6. **规范审批流程**：利用工作流引擎实现立项、变更、结项的多级审批

---

## 二、数据模型设计

### 2.1 核心实体扩展

#### Project 实体（项目）

**文件路径**: `nest-admin/src/modulesBusi/projects/entity.ts`

| 字段名 | 类型 | 说明 |
|--------|------|------|
| budget | decimal(15,2) | 项目预算（元） |
| actualCost | decimal(15,2) | 实际成本（元） |
| customerId | int | 关联客户 ID |
| progress | int | 整体进度百分比（0-100） |
| status | enum | 状态：planning/in_progress/on_hold/completed/cancelled |

**关联关系**:
- `@ManyToOne(() => Customer)` - 关联客户
- `@OneToMany(() => Contract)` - 关联合同列表
- `@OneToMany(() => ProjectMilestone)` - 关联里程碑
- `@OneToMany(() => ProjectRisk)` - 关联风险
- `@OneToMany(() => ChangeRequest)` - 关联变更请求
- `@OneToMany(() => ProjectSprint)` - 关联 Sprint

#### Task 实体（任务）

**文件路径**: `nest-admin/src/modulesBusi/tasks/entity.ts`

| 字段名 | 类型 | 说明 |
|--------|------|------|
| estimatedHours | int | 预估工时（小时） |
| actualHours | decimal(10,2) | 实际工时（小时） |
| remainingHours | int | 剩余工时（小时） |
| acceptanceCriteria | varchar(500) | 验收标准 |
| storyPoints | int | 故事点 |
| userStoryId | int | 关联用户故事 ID |
| sprintId | int | 关联 Sprint ID |

**关联关系**:
- `@ManyToMany(() => Task)` - dependencies（前置任务依赖）
- `@ManyToMany(() => Task)` - dependents（后置任务）
- `@ManyToOne(() => UserStory)` - 关联用户故事
- `@ManyToOne(() => ProjectSprint)` - 关联 Sprint
- `@OneToMany(() => TaskTimeLog)` - 工时记录列表

#### Ticket 实体（工单/缺陷）

**文件路径**: `nest-admin/src/modulesBusi/tickets/entity.ts`

| 字段名 | 类型 | 说明 |
|--------|------|------|
| severity | enum | 严重程度：critical/high/medium/low |
| stepsToReproduce | text | 重现步骤 |
| expectedResult | text | 期望结果 |
| actualResult | text | 实际结果 |
| environment | varchar(200) | 环境信息（浏览器、OS、版本等） |
| rootCause | text | 根因分析 |
| rootCauseCategory | enum | 根因分类：code_defect/design_issue/requirement_gap/test_gap/environment/other |
| resolution | text | 解决方案 |
| foundInVersion | varchar(50) | 发现版本 |
| fixedInVersion | varchar(50) | 修复版本 |
| reopenedCount | int | 重新打开次数 |

**关联关系**:
- `@ManyToOne(() => UserStory)` - 关联用户故事
- `@ManyToOne(() => ProjectSprint)` - 关联 Sprint

#### Document 实体（文档）

**文件路径**: `nest-admin/src/modulesBusi/documents/entity.ts`

| 字段名 | 类型 | 说明 |
|--------|------|------|
| category | enum | 文档分类：requirement/design/technical/user_manual/test_plan/meeting_notes/other |
| reviewStatus | enum | 审核状态：draft/under_review/approved/rejected/archived |
| versionNumber | int | 版本号数字（用于排序） |
| parentId | int | 父文档 ID（版本链） |
| workflowInstanceId | varchar(500) | 工作流实例 ID |
| reviewerId | int | 审核人 ID |
| reviewDate | date | 审核日期 |
| reviewComments | text | 审核意见 |

### 2.2 新增实体

#### ProjectMilestone（项目里程碑）

**文件路径**: `nest-admin/src/modulesBusi/projects/entities/project-milestone.entity.ts`

| 字段名 | 类型 | 说明 |
|--------|------|------|
| name | varchar(200) | 里程碑名称 |
| description | text | 描述 |
| plannedDate | date | 计划完成日期 |
| actualDate | date | 实际完成日期 |
| status | enum | 状态：pending/in_progress/completed/delayed |
| progress | int | 进度百分比 |
| projectId | int | 关联项目 ID |

#### ProjectRisk（项目风险）

**文件路径**: `nest-admin/src/modulesBusi/projects/entities/project-risk.entity.ts`

| 字段名 | 类型 | 说明 |
|--------|------|------|
| title | varchar(200) | 风险标题 |
| description | text | 风险描述 |
| category | enum | 类别：technical/resource/schedule/budget/external |
| probability | enum | 发生概率：low/medium/high/critical |
| impact | enum | 影响程度：low/medium/high/critical |
| status | enum | 状态：identified/assessed/mitigating/closed |
| mitigationPlan | text | 缓解措施 |
| contingencyPlan | text | 应急计划 |
| ownerId | int | 风险负责人 ID |
| projectId | int | 关联项目 ID |
| identifiedDate | date | 识别日期 |
| closedDate | date | 关闭日期 |

#### ChangeRequest（变更请求）

**文件路径**: `nest-admin/src/modulesBusi/projects/entities/change-request.entity.ts`

| 字段名 | 类型 | 说明 |
|--------|------|------|
| title | varchar(200) | 变更标题 |
| description | text | 变更描述 |
| type | enum | 类型：requirement/scope/schedule/budget/technical |
| status | enum | 状态：draft/submitted/under_review/approved/rejected/implemented/closed |
| reason | text | 变更原因 |
| impactAnalysis | text | 影响分析 |
| costImpact | decimal(15,2) | 成本影响 |
| scheduleImpact | int | 工期影响（天） |
| workflowInstanceId | varchar(500) | 工作流实例 ID |
| requesterId | int | 申请人 ID |
| approverId | int | 审批人 ID |
| projectId | int | 关联项目 ID |
| submittedDate | date | 提交日期 |
| approvedDate | date | 批准日期 |
| implementedDate | date | 实施日期 |

#### ProjectSprint（敏捷迭代）

**文件路径**: `nest-admin/src/modulesBusi/projects/entities/project-sprint.entity.ts`

| 字段名 | 类型 | 说明 |
|--------|------|------|
| name | varchar(200) | Sprint 名称（如 Sprint 1） |
| goal | text | Sprint 目标 |
| status | enum | 状态：planned/active/completed/cancelled |
| startDate | date | 开始日期 |
| endDate | date | 结束日期 |
| capacity | int | 团队容量（故事点或工时） |
| committedPoints | int | 承诺的故事点 |
| completedPoints | int | 完成的故事点 |
| retrospective | text | 回顾总结 |
| projectId | int | 关联项目 ID |
| scrumMasterId | int | Scrum Master ID |
| sortOrder | int | 排序号 |

#### UserStory（用户故事/史诗）

**文件路径**: `nest-admin/src/modulesBusi/projects/entities/user-story.entity.ts`

| 字段名 | 类型 | 说明 |
|--------|------|------|
| title | varchar(200) | 故事标题 |
| description | text | 故事描述（As a... I want... So that...） |
| type | enum | 类型：epic/story/task |
| status | enum | 状态：backlog/selected/in_progress/done/accepted/rejected |
| storyPoints | int | 故事点 |
| acceptanceCriteria | varchar(500) | 验收标准 |
| priority | int | 优先级（数字越小优先级越高） |
| sprintId | int | 所属 Sprint ID |
| parentId | int | 父故事 ID（用于史诗分解） |
| assigneeId | int | 负责人 ID |
| reporterId | int | 报告人 ID |
| projectId | int | 关联项目 ID |
| estimatedDate | date | 预估完成日期 |
| completedDate | date | 实际完成日期 |

#### TaskDependency（任务依赖关系）

**文件路径**: `nest-admin/src/modulesBusi/tasks/entities/task-dependency.entity.ts`

| 字段名 | 类型 | 说明 |
|--------|------|------|
| taskId | int | 当前任务 ID |
| dependencyId | int | 依赖的任务 ID |
| dependencyType | enum | 依赖类型：finish_to_start/start_to_start/finish_to_finish/start_to_finish |
| lagDays | int | 延迟天数（正数表示延迟，负数表示提前） |

#### TaskTimeLog（工时记录）

**文件路径**: `nest-admin/src/modulesBusi/tasks/entities/task-time-log.entity.ts`

| 字段名 | 类型 | 说明 |
|--------|------|------|
| hours | decimal(10,2) | 工时（小时） |
| description | text | 工作内容描述 |
| workDate | date | 工作日期 |
| taskId | int | 关联任务 ID |
| userId | int | 用户 ID |

---

## 三、业务流程设计

### 3.1 项目立项审批流程

```
创建项目草稿 → 填写预算/客户/里程碑 → 提交立项申请 → 启动工作流
→ 项目经理审批 → 部门总监审批（根据预算条件分支） → 财务审批
→ 审批通过 → 更新项目状态为 in_progress → 发送通知给团队成员
```

**关键集成点**:
- 调用工作流引擎 API：`POST /workflow/start`，传入 `businessKey: project_{id}`
- 工作流配置中定义审批节点和条件分支（根据预算金额路由）
- 监听工作流回调，审批通过后更新 `Project.status = 'in_progress'`

### 3.2 Sprint 管理流程

```
Sprint 规划会议 → 从 Backlog 选择用户故事 → 估算故事点
→ 创建 Sprint（设置 startDate/endDate） → 启动 Sprint（status=active）
→ 每日站会 → 更新任务状态 → 记录工时
→ Sprint 结束 → 回顾会议 → 记录 retrospective → 生成燃尽图/速度图
```

### 3.3 需求变更流程

```
提出变更请求 → 填写 ChangeRequest（影响分析/成本评估）
→ 提交审批 → 创建工作流实例（businessKey=change_request_{id}）
→ 项目经理初审 → 根据影响大小路由：
   - 小变更：项目经理直接审批
   - 大变更：变更控制委员会审批
→ 批准 → 更新相关任务/故事 → 通知团队 → 实施变更
→ 更新 ChangeRequest 状态为 implemented
```

### 3.4 缺陷处理流程

```
发现缺陷 → 创建 Ticket（type=bug）→ 填写详细信息（重现步骤/环境/严重程度）
→ 分配给开发人员 → 分析并修复 → 提交测试
→ 测试验证 → 填写根因分析 → 关闭缺陷
→ 如验证失败 → 重新打开（reopenedCount++）
```

### 3.5 项目结项流程

```
完成所有里程碑 → 发起结项申请 → 准备结项文档 → 启动工作流
→ 项目经理确认 → 客户验收 → 财务结算
→ 更新项目状态为 completed → 归档项目文档 → 释放资源
```

---

## 四、API 接口设计

### 4.1 项目管理

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | `/api/projects/save` | 创建或更新项目（含预算、客户关联） |
| GET | `/api/projects/list` | 分页查询（支持按客户、状态筛选） |
| GET | `/api/projects/:id` | 获取详情（含里程碑、风险、Sprint 等） |
| DELETE | `/api/projects/del/:ids` | 删除项目（软删除） |
| PUT | `/api/projects/:id/status` | 更新项目状态 |
| POST | `/api/projects/:id/submit-approval` | 提交立项审批 |
| GET | `/api/projects/:id/budget-summary` | 获取预算执行情况 |

### 4.2 里程碑管理

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | `/api/projects/:projectId/milestones` | 创建里程碑 |
| PUT | `/api/projects/milestones/:id` | 更新里程碑 |
| DELETE | `/api/projects/milestones/:id` | 删除里程碑 |
| GET | `/api/projects/:projectId/milestones` | 获取列表 |
| PUT | `/api/projects/milestones/:id/complete` | 标记完成 |

### 4.3 风险管理

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | `/api/projects/:projectId/risks` | 创建风险 |
| PUT | `/api/projects/risks/:id` | 更新风险 |
| DELETE | `/api/projects/risks/:id` | 删除风险 |
| GET | `/api/projects/:projectId/risks` | 获取列表 |
| PUT | `/api/projects/risks/:id/mitigate` | 更新缓解措施 |

### 4.4 Sprint 管理

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | `/api/projects/:projectId/sprints` | 创建 Sprint |
| PUT | `/api/projects/sprints/:id` | 更新 Sprint |
| DELETE | `/api/projects/sprints/:id` | 删除 Sprint |
| GET | `/api/projects/:projectId/sprints` | 获取列表 |
| POST | `/api/projects/sprints/:id/start` | 启动 Sprint |
| POST | `/api/projects/sprints/:id/complete` | 完成 Sprint |
| GET | `/api/projects/sprints/:id/burndown` | 获取燃尽图数据 |
| GET | `/api/projects/:projectId/velocity-chart` | 获取速度图数据 |

### 4.5 用户故事管理

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | `/api/projects/:projectId/stories` | 创建用户故事 |
| PUT | `/api/projects/stories/:id` | 更新用户故事 |
| DELETE | `/api/projects/stories/:id` | 删除用户故事 |
| GET | `/api/projects/:projectId/stories` | 获取列表 |
| GET | `/api/projects/:projectId/backlog` | 获取产品待办列表 |
| POST | `/api/projects/stories/:id/assign-to-sprint` | 分配到 Sprint |
| POST | `/api/projects/stories/:id/estimate` | 估算故事点 |

### 4.6 任务依赖管理

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | `/api/tasks/:taskId/dependencies` | 添加依赖 |
| DELETE | `/api/tasks/:taskId/dependencies/:dependencyId` | 移除依赖 |
| GET | `/api/tasks/:taskId/dependencies` | 获取依赖列表 |
| GET | `/api/tasks/:taskId/dependents` | 获取后置任务 |
| POST | `/api/tasks/:taskId/check-circular` | 检测循环依赖 |

### 4.7 缺陷管理增强

| 方法 | 路径 | 说明 |
|------|------|------|
| PUT | `/api/tickets/:id/resolve` | 标记已解决 |
| PUT | `/api/tickets/:id/verify` | 验证修复 |
| PUT | `/api/tickets/:id/reopen` | 重新打开 |
| PUT | `/api/tickets/:id/close` | 关闭缺陷 |
| GET | `/api/tickets` | 查询列表（支持按严重程度、状态筛选） |
| GET | `/api/tickets/stats/by-severity` | 按严重程度统计 |
| GET | `/api/tickets/stats/by-root-cause` | 按根因分类统计 |

### 4.8 变更管理

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | `/api/projects/:projectId/change-requests` | 创建变更请求 |
| PUT | `/api/change-requests/:id` | 更新变更请求 |
| DELETE | `/api/change-requests/:id` | 删除变更请求 |
| GET | `/api/projects/:projectId/change-requests` | 获取列表 |
| GET | `/api/change-requests/:id` | 获取详情 |
| POST | `/api/change-requests/:id/submit-approval` | 提交审批 |

### 4.9 统计分析

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/projects/:projectId/dashboard` | 获取项目仪表盘数据 |
| GET | `/api/projects/:projectId/burndown` | 获取项目燃尽图数据 |
| GET | `/api/projects/:projectId/velocity` | 获取团队速度数据 |
| GET | `/api/projects/:projectId/cumulative-flow` | 获取累积流图数据 |
| GET | `/api/users/:userId/workload` | 获取用户工作负载 |

---

## 五、前端页面设计

### 5.1 项目列表页

**文件路径**: `nest-admin-frontend/src/views/projects/list.vue`

**改造内容**:
- 表格列增加：客户名称、预算、实际成本、进度条、状态标签
- 筛选条件增加：按客户、状态、时间范围筛选
- 操作列增加：查看、编辑、删除、提交审批
- 顶部增加"新建项目"按钮

### 5.2 项目详情页

**文件路径**: `nest-admin-frontend/src/views/projects/detail.vue`

**Tab 结构**:

1. **概览 Tab**
   - 项目基本信息卡片
   - 预算执行情况（进度条 + 金额）
   - 关键指标：完成率、缺陷数、延期风险
   - 最近活动日志

2. **里程碑 Tab**
   - 时间轴视图展示里程碑
   - 每个里程碑显示：名称、计划日期、实际日期、状态
   - 支持添加/编辑/标记完成

3. **风险 Tab**
   - 风险矩阵视图（概率 vs 影响）
   - 风险列表：标题、类别、状态、负责人
   - 支持添加缓解措施

4. **变更 Tab**
   - 变更请求列表：标题、类型、状态、申请人
   - 点击查看详情和审批历史

5. **Sprint Tab**
   - Sprint 列表：名称、日期范围、状态、完成度
   - 点击进入 Sprint 详情页

6. **团队 Tab**
   - 成员列表及角色
   - 工作负载分布图

### 5.3 Sprint 管理页

**文件路径**: `nest-admin-frontend/src/views/projects/sprint-detail.vue`

**页面结构**:
- 顶部：Sprint 信息卡片（名称、日期、目标、Scrum Master）
- 左侧：燃尽图（ECharts 折线图，横轴日期，纵轴剩余故事点）
- 右侧：看板视图（三列：Todo / In Progress / Done）
  - 每张卡片显示：故事标题、故事点、负责人
  - 支持拖拽改变状态
- 底部：Sprint 回顾输入框

### 5.4 Backlog 管理页

**文件路径**: `nest-admin-frontend/src/views/projects/backlog.vue`

**页面结构**:
- 左侧：未分配的用户故事列表（按优先级排序）
  - 每个故事显示：标题、故事点、优先级、状态
  - 支持拖拽分配到右侧的 Sprint
- 右侧：未来 Sprint 列表（可折叠）
  - 每个 Sprint 显示已分配的故事点和容量
- 顶部：快速创建故事按钮

### 5.5 任务详情页

**文件路径**: `nest-admin-frontend/src/views/tasks/detail.vue`

**改造内容**:
- 基本信息区：标题、状态、优先级、负责人、预估/实际工时
- **依赖关系区**（新增）
  - 前置任务列表（不可开始直到这些任务完成）
  - 后置任务列表（依赖于此任务）
  - 可视化依赖图（使用 D3.js 或 ECharts）
- 验收标准区
- 工时记录区（时间线视图）
- 评论/活动日志

### 5.6 缺陷详情页

**文件路径**: `nest-admin-frontend/src/views/tickets/detail.vue`

**改造内容**:
- 基本信息区：标题、类型、严重程度（颜色标签）、状态
- 详细描述区：重现步骤、期望结果、实际结果、环境信息
- **根因分析区**（新增）：根因分类下拉框、根因描述文本框
- 解决方案区：修复方案、修复版本
- 状态流转按钮：根据当前状态显示可用操作（解决/验证/关闭/重新打开）
- 关联信息：关联的用户故事、Sprint

### 5.7 变更请求管理页

**文件路径**: 
- `nest-admin-frontend/src/views/projects/change-requests.vue`
- `nest-admin-frontend/src/views/projects/change-request-detail.vue`

**列表页**:
- 表格列：标题、类型、状态、申请人、提交日期
- 筛选：按状态、类型筛选

**详情页**:
- 变更基本信息
- 影响分析：成本影响、工期影响
- 审批历史时间轴
- 操作按钮：提交审批、撤回（草稿状态）

---

## 六、集成方案

### 6.1 工作流引擎集成

#### 集成场景

| 业务场景 | businessKey | 工作流模板 | 审批通过后动作 |
|---------|-------------|-----------|--------------|
| 项目立项 | `project_{id}` | project_approval | 更新 status = 'in_progress' |
| 变更请求 | `change_request_{id}` | change_approval | 更新 ChangeRequest.status = 'approved' |
| 项目结项 | `project_close_{id}` | project_close_approval | 更新 status = 'completed' |
| 文档审核 | `document_{id}` | document_review | 更新 Document.reviewStatus = 'approved' |

#### 技术实现

**创建工作流集成服务**:

**文件路径**: `nest-admin/src/common/services/workflow-integration.service.ts`

```typescript
@Injectable()
export class WorkflowIntegrationService {
  // 启动项目立项审批
  async startProjectApproval(projectId: number, initiatorId: number): Promise<string> {
    const workflowData = {
      businessKey: `project_${projectId}`,
      processDefinitionKey: 'project_approval',
      variables: {
        projectId,
        initiatorId,
        approvalLevel: this.determineApprovalLevel(projectId),
      },
    };

    const instance = await this.workflowService.startProcess(workflowData);
    await this.projectService.updateWorkflowInstanceId(projectId, instance.id);
    return instance.id;
  }

  // 工作流回调处理
  async handleWorkflowCallback(instanceId: string, status: string, variables: any) {
    const businessKey = variables.businessKey;
    
    if (businessKey.startsWith('project_')) {
      const projectId = parseInt(businessKey.split('_')[1]);
      if (status === 'completed') {
        await this.projectService.updateStatus(projectId, 'in_progress');
        await this.notifyTeam(projectId, '项目立项已批准');
      }
    } else if (businessKey.startsWith('change_request_')) {
      const changeId = parseInt(businessKey.split('_')[2]);
      if (status === 'completed') {
        await this.changeRequestService.approve(changeId);
      }
    }
  }
}
```

#### 通知集成

利用工作流引擎的通知节点，在以下时机发送通知：
- 审批任务到达时：通知审批人
- 审批通过/拒绝时：通知申请人
- 流程结束时：通知项目全体成员

通知方式：站内消息 + 邮件（可选）

### 6.2 CRM 集成

#### 数据关联

- `Project.customerId` → `Customer.id`（双向关联）
- `Contract.projectId` → `Project.id`（已有字段，确保配置反向关联）

#### 预算同步逻辑

**文件路径**: `nest-admin/src/modulesBusi/crm/services/contract.service.ts`

```typescript
async createContract(createDto: CreateContractDto): Promise<Contract> {
  const contract = await this.contractRepository.save(createDto);
  
  // 如果合同关联了项目，同步预算
  if (createDto.projectId) {
    const project = await this.projectRepository.findOne({ where: { id: createDto.projectId } });
    if (project) {
      project.budget = (project.budget || 0) + createDto.amount;
      await this.projectRepository.save(project);
    }
  }
  
  return contract;
}
```

#### 前端集成

在项目详情页展示：
- 客户信息卡片：名称、联系人、电话、邮箱
- 关联合同列表：合同编号、金额、签订日期、状态

---

## 七、关键技术决策

### 7.1 任务循环依赖检测

**问题**: 任务 A 依赖 B，B 依赖 C，C 又依赖 A，形成循环依赖。

**解决方案**: 使用拓扑排序算法（DFS）检测循环

**实现逻辑**:
```typescript
async checkCircularDependency(taskId: number, dependencyId: number): Promise<boolean> {
  // 构建邻接表
  const adjacencyList = await this.buildAdjacencyList();
  
  // 临时添加新依赖
  adjacencyList[taskId] = adjacencyList[taskId] || [];
  adjacencyList[taskId].push(dependencyId);
  
  // DFS 检测环
  const visited = new Set<number>();
  const recursionStack = new Set<number>();
  
  const hasCycle = (node: number): boolean => {
    if (recursionStack.has(node)) return true;
    if (visited.has(node)) return false;
    
    visited.add(node);
    recursionStack.add(node);
    
    const neighbors = adjacencyList[node] || [];
    for (const neighbor of neighbors) {
      if (hasCycle(neighbor)) return true;
    }
    
    recursionStack.delete(node);
    return false;
  };
  
  return hasCycle(taskId);
}
```

**调用时机**: 在添加任务依赖前调用，如果检测到循环依赖则拒绝添加。

### 7.2 燃尽图数据计算

**数据结构**:
```typescript
interface BurndownDataPoint {
  date: string;  // YYYY-MM-DD
  idealRemaining: number;  // 理想剩余故事点
  actualRemaining: number;  // 实际剩余故事点
}
```

**计算逻辑**:
- **理想线**: 从总故事点线性下降到 0
- **实际线**: 每天统计已完成故事的故事点总和，用总故事点减去即得剩余故事点

**前端图表**: 使用 ECharts 绘制双折线图

### 7.3 文档版本控制

**策略**: 采用**新建记录**而非覆盖

**实现逻辑**:
- 每次更新创建新记录，`parentId` 指向版本链根节点
- `versionNumber` 递增，便于排序
- 原文档标记为 `reviewStatus = 'archived'`

**优点**:
- 保留完整的版本历史
- 可以回溯到任意版本
- 便于审计和对比

### 7.4 并发冲突处理

**方案**: 使用 TypeORM 内置的乐观锁（`@VersionColumn()`）

**工作原理**:
- 每次更新自动检查版本号
- 版本不匹配时抛出 `OptimisticLockVersionMismatchError`
- 前端捕获错误后提示用户"数据已被他人修改，请刷新后重试"

---

## 八、实施计划

### P0 - 核心功能（第 1-4 周）

**必须实现，解决核心痛点**:

1. ✅ 扩展 Project 实体（预算、客户关联、进度字段）
2. ✅ 扩展 Task 实体（工时、依赖关系、验收标准）
3. ✅ 扩展 Ticket 实体（严重程度、重现步骤、根因分析）
4. ✅ 创建 TaskDependency 实体和循环依赖检测算法
5. ✅ 创建工作流集成服务，配置项目立项审批流程（已完成）
6. 前端改造：
   - ✅ 项目列表页
   - ✅ 项目详情页（里程碑/风险 Tab）
   - ✅ 任务详情页（依赖关系）- 已实现前端展示
   - ✅ 缺陷详情页（根因分析）
   - ✅ 项目详情页（立项审批、结项申请按钮）

**验收标准**:
- ✅ 可以创建项目并关联客户、设置预算
- ✅ 可以提交项目立项审批并通过工作流引擎审批
- ✅ 可以创建任务依赖并检测循环依赖
- ✅ 可以记录缺陷详细信息和根因分析

### P1 - 重要功能（第 5-8 周）

**短期实现，完善敏捷能力**（✅ 已完成）:

1. ✅ 创建 ProjectSprint 和 UserStory 实体
2. ✅ 实现 Sprint CRUD API 和用户故事管理 API
3. ✅ 实现燃尽图数据计算逻辑
4. ✅ 创建 ChangeRequest 实体和变更审批流程
5. ✅ 创建 ProjectRisk 实体和风险管理 API
6. ✅ 前端：Sprint 管理页（看板 + 燃尽图）、Backlog 管理页、变更请求页、风险管理页

**验收标准**:
- ✅ 可以创建 Sprint 并分配用户故事
- ✅ 可以查看燃尽图和速度图
- ✅ 可以提交变更请求并通过审批流程
- ✅ 可以记录和管理项目风险

### P2 - 增强功能（第 9-12 周）

**中期实现，提升用户体验**:

1. 实现高级统计分析 API（累积流图、缺陷统计、团队速度趋势）
2. 扩展 Document 实体（分类、审核状态、版本控制）
3. 配置文档审核工作流模板
4. 前端：统计分析页面、文档管理页（版本历史）
5. 性能优化：添加数据库索引、查询优化
6. 编写单元测试和集成测试

**验收标准**:
- ✅ 可以查看多种敏捷度量图表
- ✅ 可以上传文档并提交审核，查看版本历史
- ✅ 系统响应时间在可接受范围内（列表页 < 2s，图表计算 < 500ms）

---

## 九、验证方案

### 9.1 功能测试

#### 项目管理
- [ ] 创建项目并关联客户
- [ ] 设置项目预算
- [ ] 添加里程碑并标记完成
- [ ] 添加风险并更新缓解措施
- [ ] 提交项目立项审批
- [ ] 工作流审批通过后项目状态自动更新

#### Sprint 管理
- [ ] 创建 Sprint 并设置日期范围
- [ ] 从 Backlog 拖拽故事到 Sprint
- [ ] 启动 Sprint
- [ ] 更新任务状态
- [ ] 完成 Sprint 并查看燃尽图

#### 任务依赖
- [ ] 添加任务依赖（A 依赖 B）
- [ ] 尝试创建循环依赖（应被拒绝）
- [ ] 查看任务依赖关系图
- [ ] 记录工时并查看累计工时

#### 缺陷管理
- [ ] 创建缺陷并填写重现步骤
- [ ] 设置严重程度为 critical
- [ ] 分配给开发人员
- [ ] 开发人员标记已解决并填写根因分析
- [ ] 测试人员验证通过并关闭
- [ ] 重新打开缺陷（模拟修复失败）

#### 变更管理
- [ ] 创建变更请求
- [ ] 提交审批
- [ ] 工作流审批通过
- [ ] 变更状态更新为 approved

#### CRM 集成
- [ ] 创建合同并关联项目
- [ ] 验证项目预算自动更新
- [ ] 在项目详情页查看关联合同列表

### 9.2 性能测试

| 测试场景 | 目标响应时间 |
|---------|------------|
| 项目列表页加载 1000 条数据 | < 2s |
| 燃尽图数据计算（100 个任务的 Sprint） | < 500ms |
| 循环依赖检测（1000 个任务的依赖图） | < 1s |

**工具**: Apache JMeter 或 k6

### 9.3 安全测试

- [ ] 权限控制：非项目成员无法访问项目详情
- [ ] SQL 注入：所有查询使用参数化
- [ ] XSS 防护：富文本内容转义
- [ ] CSRF 保护：启用 NestJS CSRF 中间件

### 9.4 用户验收测试（UAT）

**参与角色**:
- 项目经理：验证立项审批、预算管理、里程碑跟踪
- 开发人员：验证任务管理、依赖关系、工时记录
- 测试人员：验证缺陷管理流程
- 产品经理：验证 Backlog 管理、Sprint 规划
- 客户代表：验证项目进度查看、文档访问

**验收标准**:
- 所有 P0 功能通过测试
- 关键业务流程无阻塞性 Bug
- 用户界面符合设计规范
- 性能指标达标

---

## 十、数据库迁移策略

### 10.1 开发环境

保持 `synchronize: true`，TypeORM 自动同步 schema

### 10.2 生产环境

1. 关闭 `synchronize: false`
2. 编写 TypeORM 迁移脚本（migrations 目录）
3. 执行 `npm run migration:run` 应用迁移
4. 迁移脚本包含 `up` 和 `down` 方法，支持回滚

### 10.3 注意事项

- 新增字段设置为 `nullable: true`，避免破坏现有数据
- 外键约束谨慎添加，先确保关联数据存在
- 枚举类型修改需要考虑数据兼容性
- 备份数据库后再执行生产环境迁移

### 10.4 迁移脚本示例

**文件路径**: `nest-admin/src/migrations/1234567890-add-project-budget.ts`

```typescript
import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddProjectBudget1234567890 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE projects 
      ADD COLUMN budget DECIMAL(15,2) NULL,
      ADD COLUMN actual_cost DECIMAL(15,2) DEFAULT 0,
      ADD COLUMN customer_id INT NULL,
      ADD CONSTRAINT fk_project_customer FOREIGN KEY (customer_id) REFERENCES customers(id)
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE projects 
      DROP FOREIGN KEY fk_project_customer,
      DROP COLUMN customer_id,
      DROP COLUMN actual_cost,
      DROP COLUMN budget
    `);
  }
}
```

---

## 十一、关键文件清单

### 后端核心文件

| 文件路径 | 说明 |
|---------|------|
| `nest-admin/src/modulesBusi/projects/entity.ts` | Project 实体扩展 |
| `nest-admin/src/modulesBusi/tasks/entity.ts` | Task 实体扩展 |
| `nest-admin/src/modulesBusi/tickets/entity.ts` | Ticket 实体扩展 |
| `nest-admin/src/modulesBusi/documents/entity.ts` | Document 实体扩展 |
| `nest-admin/src/modulesBusi/projects/entities/project-milestone.entity.ts` | 新增里程碑实体 |
| `nest-admin/src/modulesBusi/projects/entities/project-risk.entity.ts` | 新增风险实体 |
| `nest-admin/src/modulesBusi/projects/entities/change-request.entity.ts` | 新增变更请求实体 |
| `nest-admin/src/modulesBusi/projects/entities/project-sprint.entity.ts` | 新增 Sprint 实体 |
| `nest-admin/src/modulesBusi/projects/entities/user-story.entity.ts` | 新增用户故事实体 |
| `nest-admin/src/modulesBusi/tasks/entities/task-dependency.entity.ts` | 新增任务依赖实体 |
| `nest-admin/src/modulesBusi/tasks/entities/task-time-log.entity.ts` | 新增工时记录实体 |
| `nest-admin/src/common/services/workflow-integration.service.ts` | 新增工作流集成服务 |
| `nest-admin/src/modulesBusi/crm/entities/customer.entity.ts` | Customer 实体添加反向关联 |
| `nest-admin/src/modulesBusi/crm/entities/contract.entity.ts` | Contract 实体添加反向关联 |

### 前端核心文件

| 文件路径 | 说明 |
|---------|------|
| `nest-admin-frontend/src/views/projects/detail.vue` | 项目详情页改造（Tab 结构） |
| `nest-admin-frontend/src/views/projects/sprint-detail.vue` | 新增 Sprint 详情页 |
| `nest-admin-frontend/src/views/projects/backlog.vue` | 新增 Backlog 管理页 |
| `nest-admin-frontend/src/views/tasks/detail.vue` | 任务详情页改造（依赖关系） |
| `nest-admin-frontend/src/views/tickets/detail.vue` | 缺陷详情页改造（根因分析） |
| `nest-admin-frontend/src/components/KanbanBoard.vue` | 新增看板组件 |
| `nest-admin-frontend/src/components/BurndownChart.vue` | 新增燃尽图组件 |
| `nest-admin-frontend/src/components/DependencyGraph.vue` | 新增依赖关系图组件 |

---

## 十二、总结

本方案通过对现有项目管理系统的全面改造，实现了以下核心价值：

1. **专业化**: 针对 IT 系统交付场景，提供完整的项目管理能力
2. **敏捷化**: 支持 Sprint、Backlog、燃尽图等敏捷实践
3. **规范化**: 通过工作流引擎实现标准化的审批流程
4. **一体化**: 与 CRM 深度集成，打通客户-合同-项目业务闭环
5. **可视化**: 提供丰富的图表和视图，辅助决策和分析

按照 P0/P1/P2 三个优先级分阶段实施，预计 **12 周**完成全部改造，可显著提升 IT 项目交付的效率和质量。
