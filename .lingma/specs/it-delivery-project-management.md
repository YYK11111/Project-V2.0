# IT 系统交付项目管理系统改造方案

## Context（背景）

当前项目管理系统仅具备基础的 CRUD 功能，无法满足 IT 系统交付的专业需求。用户的核心痛点包括：
- **需求管理问题**：缺乏变更控制机制，需求蔓延无法追踪
- **缺陷管理问题**：缺少完整的 Bug 生命周期、严重程度分级和根因分析
- **任务管理问题**：没有任务依赖关系管理，无法合理规划执行顺序

用户采用**敏捷迭代交付**模式，需要 Sprint 管理和 Backlog 管理能力，同时要求与现有 CRM 模块深度集成，并利用工作流引擎实现完整审批流程。

## 设计方案

### 1. 数据模型扩展

#### 核心实体新增字段

**Project 实体** (`nest-admin/src/modulesBusi/projects/entity.ts`)
- `budget`: 项目预算（decimal）
- `actualCost`: 实际成本（decimal）
- `customerId`: 关联客户 ID
- `progress`: 整体进度百分比（0-100）
- `status`: 枚举值改为 planning/in_progress/on_hold/completed/cancelled
- 关联关系：`@ManyToOne(() => Customer)`, `@OneToMany(() => Contract)`

**Task 实体** (`nest-admin/src/modulesBusi/tasks/entity.ts`)
- `estimatedHours`: 预估工时
- `actualHours`: 实际工时
- `remainingHours`: 剩余工时
- `acceptanceCriteria`: 验收标准
- `storyPoints`: 故事点
- `userStoryId`: 关联用户故事
- `sprintId`: 关联 Sprint
- 多对多关系：`dependencies`（前置任务）、`dependents`（后置任务）

**Ticket 实体** (`nest-admin/src/modulesBusi/tickets/entity.ts`)
- `severity`: 严重程度（critical/high/medium/low）
- `stepsToReproduce`: 重现步骤
- `expectedResult`: 期望结果
- `actualResult`: 实际结果
- `environment`: 环境信息
- `rootCause`: 根因分析
- `rootCauseCategory`: 根因分类（code_defect/design_issue/requirement_gap 等）
- `resolution`: 解决方案
- `foundInVersion`: 发现版本
- `fixedInVersion`: 修复版本
- `reopenedCount`: 重新打开次数

**Document 实体** (`nest-admin/src/modulesBusi/documents/entity.ts`)
- `category`: 文档分类（requirement/design/technical/user_manual/test_plan 等）
- `reviewStatus`: 审核状态（draft/under_review/approved/rejected/archived）
- `versionNumber`: 版本号数字（用于排序）
- `parentId`: 父文档 ID（版本链）
- `workflowInstanceId`: 工作流实例 ID
- `reviewerId`: 审核人 ID

#### 新增实体

**ProjectMilestone** (`nest-admin/src/modulesBusi/projects/entities/project-milestone.entity.ts`)
- 里程碑管理：名称、计划日期、实际日期、状态、进度

**ProjectRisk** (`nest-admin/src/modulesBusi/projects/entities/project-risk.entity.ts`)
- 风险管理：标题、类别、概率、影响程度、缓解措施、应急计划、负责人

**ChangeRequest** (`nest-admin/src/modulesBusi/projects/entities/change-request.entity.ts`)
- 变更请求：标题、类型、状态、影响分析、成本影响、工期影响、工作流实例 ID

**ProjectSprint** (`nest-admin/src/modulesBusi/projects/entities/project-sprint.entity.ts`)
- 敏捷迭代：名称、目标、日期范围、状态、容量、承诺/完成故事点、回顾总结

**UserStory** (`nest-admin/src/modulesBusi/projects/entities/user-story.entity.ts`)
- 用户故事：标题、描述、类型（epic/story/task）、状态、故事点、验收标准、优先级、所属 Sprint、父子关系

**TaskDependency** (`nest-admin/src/modulesBusi/tasks/entities/task-dependency.entity.ts`)
- 任务依赖：taskId、dependencyId、依赖类型（FS/SS/FF/SF）、延迟天数

**TaskTimeLog** (`nest-admin/src/modulesBusi/tasks/entities/task-time-log.entity.ts`)
- 工时记录：工时、工作内容、工作日期、用户

### 2. 业务流程设计

#### 项目立项审批流程
1. 创建项目草稿 → 填写预算/客户/里程碑
2. 提交立项申请 → 调用工作流引擎启动流程（businessKey = `project_{id}`）
3. 工作流执行：项目经理审批 → 部门总监审批（根据预算金额条件分支）→ 财务审批
4. 审批通过 → 更新 `Project.status = 'in_progress'` → 发送通知给团队成员

#### Sprint 管理流程
1. Sprint 规划会议 → 从 Backlog 选择用户故事 → 估算故事点
2. 创建 Sprint → 设置 startDate/endDate → 启动 Sprint（status = active）
3. 每日站会 → 更新任务状态 → 记录工时
4. Sprint 结束 → 回顾会议 → 记录 retrospective → 生成燃尽图/速度图

#### 需求变更流程
1. 提出变更请求 → 填写影响分析/成本评估
2. 提交审批 → 创建工作流实例（businessKey = `change_request_{id}`）
3. 根据影响大小路由：小变更 → 项目经理审批；大变更 → 变更控制委员会审批
4. 批准 → 更新相关任务/故事 → 通知团队 → 实施变更

#### 缺陷处理流程
1. 发现缺陷 → 创建 Ticket（type=bug）→ 填写重现步骤/环境/严重程度
2. 分配给开发人员 → 分析并修复 → 提交测试
3. 测试验证 → 填写根因分析 → 关闭缺陷
4. 如验证失败 → 重新打开（reopenedCount++）

### 3. API 接口清单

#### 项目管理
- `POST /api/projects/save` - 创建或更新项目（含预算、客户关联）
- `GET /api/projects/list` - 分页查询（支持按客户、状态筛选）
- `GET /api/projects/:id` - 获取详情（含里程碑、风险、Sprint 等）
- `POST /api/projects/:id/submit-approval` - 提交立项审批

#### 里程碑管理
- `POST /api/projects/:projectId/milestones` - 创建里程碑
- `PUT /api/projects/milestones/:id` - 更新里程碑
- `GET /api/projects/:projectId/milestones` - 获取列表
- `PUT /api/projects/milestones/:id/complete` - 标记完成

#### 风险管理
- `POST /api/projects/:projectId/risks` - 创建风险
- `PUT /api/projects/risks/:id` - 更新风险
- `GET /api/projects/:projectId/risks` - 获取列表
- `PUT /api/projects/risks/:id/mitigate` - 更新缓解措施

#### Sprint 管理
- `POST /api/projects/:projectId/sprints` - 创建 Sprint
- `POST /api/projects/sprints/:id/start` - 启动 Sprint
- `POST /api/projects/sprints/:id/complete` - 完成 Sprint
- `GET /api/projects/sprints/:id/burndown` - 获取燃尽图数据
- `GET /api/projects/:projectId/velocity-chart` - 获取速度图数据

#### 用户故事管理
- `POST /api/projects/:projectId/stories` - 创建用户故事
- `GET /api/projects/:projectId/backlog` - 获取产品待办列表
- `POST /api/projects/stories/:id/assign-to-sprint` - 分配到 Sprint
- `POST /api/projects/stories/:id/estimate` - 估算故事点

#### 任务依赖管理
- `POST /api/tasks/:taskId/dependencies` - 添加依赖
- `DELETE /api/tasks/:taskId/dependencies/:dependencyId` - 移除依赖
- `GET /api/tasks/:taskId/dependencies` - 获取依赖列表
- `POST /api/tasks/:taskId/check-circular` - 检测循环依赖

#### 缺陷管理增强
- `PUT /api/tickets/:id/resolve` - 标记已解决
- `PUT /api/tickets/:id/verify` - 验证修复
- `PUT /api/tickets/:id/reopen` - 重新打开
- `GET /api/tickets/stats/by-severity` - 按严重程度统计
- `GET /api/tickets/stats/by-root-cause` - 按根因分类统计

#### 变更管理
- `POST /api/projects/:projectId/change-requests` - 创建变更请求
- `POST /api/change-requests/:id/submit-approval` - 提交审批
- `GET /api/projects/:projectId/change-requests` - 获取列表

### 4. 前端页面规划

#### 项目详情页改造 (`nest-admin-frontend/src/views/projects/detail.vue`)
Tab 结构：
- **概览**：基本信息、预算执行情况、关键指标、最近活动
- **里程碑**：时间轴视图，显示计划/实际日期、状态
- **风险**：风险矩阵视图（概率 vs 影响），列表展示
- **变更**：变更请求列表，点击查看审批历史
- **Sprint**：Sprint 列表，点击进入详情页
- **团队**：成员列表及工作负载分布

#### Sprint 管理页 (`nest-admin-frontend/src/views/projects/sprint-detail.vue`)
- 顶部：Sprint 信息卡片
- 左侧：燃尽图（ECharts 折线图）
- 右侧：看板视图（Todo / In Progress / Done 三列，支持拖拽）
- 底部：Sprint 回顾输入框

#### Backlog 管理页 (`nest-admin-frontend/src/views/projects/backlog.vue`)
- 左侧：未分配的用户故事列表（按优先级排序，支持拖拽）
- 右侧：未来 Sprint 列表（可折叠，显示已分配的故事点和容量）

#### 任务详情页改造 (`nest-admin-frontend/src/views/tasks/detail.vue`)
- 新增**依赖关系区**：前置任务列表、后置任务列表、可视化依赖图（D3.js 或 ECharts）
- 新增**工时记录区**：时间线视图展示工时日志

#### 缺陷详情页改造 (`nest-admin-frontend/src/views/tickets/detail.vue`)
- 严重程度用颜色标签区分（critical=红色，high=橙色等）
- 新增**根因分析区**：根因分类下拉框、根因描述文本框
- 状态流转按钮根据当前状态动态显示

### 5. 集成方案

#### 工作流引擎集成

**集成场景**：
| 业务场景 | businessKey | 工作流模板 | 审批通过后动作 |
|---------|-------------|-----------|--------------|
| 项目立项 | `project_{id}` | project_approval | 更新 status = 'in_progress' |
| 变更请求 | `change_request_{id}` | change_approval | 更新 ChangeRequest.status = 'approved' |
| 项目结项 | `project_close_{id}` | project_close_approval | 更新 status = 'completed' |
| 文档审核 | `document_{id}` | document_review | 更新 Document.reviewStatus = 'approved' |

**技术实现**：
- 创建 `WorkflowIntegrationService` 封装工作流调用
- 启动流程时传入 `businessKey` 和变量（如预算金额用于条件分支）
- 监听工作流回调或轮询状态，审批通过后执行业务逻辑
- 利用工作流的通知节点发送站内消息和邮件

#### CRM 集成

**数据关联**：
- `Project.customerId` → `Customer.id`（双向关联）
- `Contract.projectId` → `Project.id`（已有字段，确保配置反向关联）

**预算同步**：
- 当合同签订时，自动累加合同金额到 `Project.budget`
- 在项目详情页展示关联的客户信息和合同列表

### 6. 关键技术决策

#### 任务循环依赖检测
使用拓扑排序算法（DFS）检测循环依赖。在添加依赖前调用检测函数，如果检测到循环则拒绝添加并返回错误提示。

#### 燃尽图数据计算
- 理想线：从总故事点线性下降到 0
- 实际线：每天统计已完成故事的故事点总和，用总故事点减去即得剩余故事点
- 前端使用 ECharts 绘制双折线图

#### 文档版本控制
采用**新建记录**策略而非覆盖：
- 每次更新创建新记录，`parentId` 指向版本链根节点
- `versionNumber` 递增，便于排序
- 原文档标记为 `reviewStatus = 'archived'`
- 优点：保留完整历史，可回溯任意版本

#### 并发冲突处理
使用 TypeORM 内置的乐观锁（`@VersionColumn()`）：
- 每次更新自动检查版本号
- 版本不匹配时抛出异常，前端提示用户刷新后重试
- 仅在高频冲突场景考虑悲观锁

### 7. 实施优先级

#### P0 - 核心功能（第 1-4 周）
**必须实现，解决核心痛点**：
1. 扩展 Project 实体（预算、客户关联、进度字段）
2. 扩展 Task 实体（工时、依赖关系、验收标准）
3. 扩展 Ticket 实体（严重程度、重现步骤、根因分析）
4. 创建 TaskDependency 实体和循环依赖检测算法
5. 创建工作流集成服务，配置项目立项审批流程
6. 前端改造：项目列表页、项目详情页（里程碑/风险 Tab）、任务详情页（依赖关系）、缺陷详情页（根因分析）

**验收标准**：
- 可以创建项目并关联客户、设置预算
- 可以提交项目立项审批并通过工作流引擎审批
- 可以创建任务依赖并检测循环依赖
- 可以记录缺陷详细信息和根因分析

#### P1 - 重要功能（第 5-8 周）
**短期实现，完善敏捷能力**：
1. 创建 ProjectSprint 和 UserStory 实体
2. 实现 Sprint CRUD API 和用户故事管理 API
3. 实现燃尽图数据计算逻辑
4. 创建 ChangeRequest 实体和变更审批流程
5. 创建 ProjectRisk 实体和风险管理 API
6. 前端：Sprint 管理页（看板 + 燃尽图）、Backlog 管理页、变更请求页、风险管理页

**验收标准**：
- 可以创建 Sprint 并分配用户故事
- 可以查看燃尽图和速度图
- 可以提交变更请求并通过审批流程
- 可以记录和管理项目风险

#### P2 - 增强功能（第 9-12 周）
**中期实现，提升用户体验**：
1. 实现高级统计分析 API（累积流图、缺陷统计、团队速度趋势）
2. 扩展 Document 实体（分类、审核状态、版本控制）
3. 配置文档审核工作流模板
4. 前端：统计分析页面、文档管理页（版本历史）
5. 性能优化：添加数据库索引、查询优化
6. 编写单元测试和集成测试

**验收标准**：
- 可以查看多种敏捷度量图表
- 可以上传文档并提交审核，查看版本历史
- 系统响应时间在可接受范围内（列表页 < 2s，图表计算 < 500ms）

### 8. 验证方案

#### 功能测试
- 项目立项审批全流程测试（创建 → 提交 → 审批 → 状态更新）
- Sprint 管理测试（创建 → 分配故事 → 启动 → 更新任务 → 完成 → 查看燃尽图）
- 任务依赖测试（添加依赖 → 检测循环依赖 → 查看依赖图）
- 缺陷管理测试（创建 → 分配 → 解决 → 验证 → 关闭 → 重新打开）
- 变更管理测试（创建 → 提交审批 → 批准 → 实施）
- CRM 集成测试（创建合同 → 验证预算同步 → 查看关联信息）

#### 性能测试
- 项目列表页加载 1000 条数据：< 2s
- 燃尽图数据计算（100 个任务的 Sprint）：< 500ms
- 循环依赖检测（1000 个任务的依赖图）：< 1s

#### 安全测试
- 权限控制：非项目成员无法访问项目详情
- SQL 注入防护：所有查询使用参数化
- XSS 防护：富文本内容转义

#### 用户验收测试（UAT）
参与角色：项目经理、开发人员、测试人员、产品经理、客户代表
验收标准：所有 P0 功能通过测试，关键业务流程无阻塞性 Bug

### 9. 数据库迁移策略

**开发环境**：保持 `synchronize: true`，TypeORM 自动同步 schema

**生产环境**：
1. 关闭 `synchronize: false`
2. 编写 TypeORM 迁移脚本（migrations 目录）
3. 执行 `npm run migration:run` 应用迁移
4. 迁移脚本包含 `up` 和 `down` 方法，支持回滚

**注意事项**：
- 新增字段设置为 `nullable: true`，避免破坏现有数据
- 外键约束谨慎添加，先确保关联数据存在
- 枚举类型修改需要考虑数据兼容性
- 备份数据库后再执行生产环境迁移

### 10. 关键文件清单

#### 后端核心文件
- `nest-admin/src/modulesBusi/projects/entity.ts` - Project 实体扩展
- `nest-admin/src/modulesBusi/tasks/entity.ts` - Task 实体扩展
- `nest-admin/src/modulesBusi/tickets/entity.ts` - Ticket 实体扩展
- `nest-admin/src/modulesBusi/documents/entity.ts` - Document 实体扩展
- `nest-admin/src/modulesBusi/projects/entities/project-milestone.entity.ts` - 新增里程碑实体
- `nest-admin/src/modulesBusi/projects/entities/project-risk.entity.ts` - 新增风险实体
- `nest-admin/src/modulesBusi/projects/entities/change-request.entity.ts` - 新增变更请求实体
- `nest-admin/src/modulesBusi/projects/entities/project-sprint.entity.ts` - 新增 Sprint 实体
- `nest-admin/src/modulesBusi/projects/entities/user-story.entity.ts` - 新增用户故事实体
- `nest-admin/src/modulesBusi/tasks/entities/task-dependency.entity.ts` - 新增任务依赖实体
- `nest-admin/src/modulesBusi/tasks/entities/task-time-log.entity.ts` - 新增工时记录实体
- `nest-admin/src/common/services/workflow-integration.service.ts` - 新增工作流集成服务
- `nest-admin/src/modulesBusi/crm/entities/customer.entity.ts` - Customer 实体添加反向关联
- `nest-admin/src/modulesBusi/crm/entities/contract.entity.ts` - Contract 实体添加反向关联

#### 前端核心文件
- `nest-admin-frontend/src/views/projects/detail.vue` - 项目详情页改造（Tab 结构）
- `nest-admin-frontend/src/views/projects/sprint-detail.vue` - 新增 Sprint 详情页
- `nest-admin-frontend/src/views/projects/backlog.vue` - 新增 Backlog 管理页
- `nest-admin-frontend/src/views/tasks/detail.vue` - 任务详情页改造（依赖关系）
- `nest-admin-frontend/src/views/tickets/detail.vue` - 缺陷详情页改造（根因分析）
- `nest-admin-frontend/src/components/KanbanBoard.vue` - 新增看板组件
- `nest-admin-frontend/src/components/BurndownChart.vue` - 新增燃尽图组件
- `nest-admin-frontend/src/components/DependencyGraph.vue` - 新增依赖关系图组件
