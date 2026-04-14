# 工作流引擎代码审计报告

## 📋 审计概览

**审计时间**: 2026-04-06  
**审计范围**: `/nest-admin/src/modulesBusi/workflow/` 完整模块  
**对比基准**: `轻量级工作流引擎完整技术方案.md`  
**审计结论**: ✅ **发现15个问题，已修复10个，剩余5个待优化**

---

## 🔴 严重问题（必须修复）

### 1. ❌ 缺少数据库建表SQL脚本

**问题描述**:  
- 方案文档中提供了完整的6张表的SQL建表脚本
- 实际项目中没有任何workflow相关的SQL文件
- 实体类已定义但数据库表未创建

**影响**: 
- 应用启动时会报错，无法找到 `wf_definition`, `wf_instance`, `wf_task`, `wf_history` 表
- 工作流功能完全不可用

**修复方案**:  
创建 `/nest-admin/doc/sql/create_workflow_tables.sql`

```sql
-- 工作流定义表
CREATE TABLE IF NOT EXISTS `wf_definition` (
  `id` bigint NOT NULL AUTO_INCREMENT COMMENT '主键ID',
  `create_time` datetime DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `create_user` varchar(50) DEFAULT NULL COMMENT '创建人',
  `update_time` datetime DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  `update_user` varchar(50) DEFAULT NULL COMMENT '更新人',
  `is_delete` char(1) DEFAULT NULL COMMENT '是否删除: NULL未删除，1删除',
  `name` varchar(100) NOT NULL COMMENT '流程名称',
  `code` varchar(50) NOT NULL COMMENT '流程编码',
  `description` text COMMENT '流程描述',
  `version` int NOT NULL DEFAULT 1 COMMENT '版本号',
  `category` varchar(50) DEFAULT NULL COMMENT '流程分类',
  `nodes` json NOT NULL COMMENT '节点配置JSON',
  `flows` json NOT NULL COMMENT '连接线配置JSON',
  `global_config` json DEFAULT NULL COMMENT '全局配置',
  `is_active` char(1) NOT NULL DEFAULT '1' COMMENT '是否启用',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_code` (`code`),
  KEY `idx_category` (`category`),
  KEY `idx_is_active` (`is_active`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='流程定义表';

-- 工作流实例表
CREATE TABLE IF NOT EXISTS `wf_instance` (
  `id` bigint NOT NULL AUTO_INCREMENT COMMENT '主键ID',
  `create_time` datetime DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `create_user` varchar(50) DEFAULT NULL COMMENT '创建人',
  `update_time` datetime DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  `update_user` varchar(50) DEFAULT NULL COMMENT '更新人',
  `is_delete` char(1) DEFAULT NULL COMMENT '是否删除: NULL未删除，1删除',
  `definition_id` varchar(36) NOT NULL COMMENT '流程定义ID',
  `definition_code` varchar(50) NOT NULL COMMENT '流程定义编码',
  `business_key` varchar(100) NOT NULL COMMENT '业务数据ID',
  `starter_id` varchar(36) NOT NULL COMMENT '发起人ID',
  `current_node_id` varchar(50) DEFAULT NULL COMMENT '当前节点ID',
  `variables` json DEFAULT NULL COMMENT '流程变量JSON',
  `status` char(1) NOT NULL DEFAULT '1' COMMENT '状态:1进行中2已完成3已取消4已挂起',
  `start_time` datetime DEFAULT NULL COMMENT '开始时间',
  `end_time` datetime DEFAULT NULL COMMENT '结束时间',
  `duration` bigint DEFAULT NULL COMMENT '耗时(毫秒)',
  PRIMARY KEY (`id`),
  KEY `idx_definition_id` (`definition_id`),
  KEY `idx_business_key` (`business_key`),
  KEY `idx_status` (`status`),
  KEY `idx_starter_id` (`starter_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='流程实例表';

-- 工作流任务表
CREATE TABLE IF NOT EXISTS `wf_task` (
  `id` bigint NOT NULL AUTO_INCREMENT COMMENT '主键ID',
  `create_time` datetime DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `create_user` varchar(50) DEFAULT NULL COMMENT '创建人',
  `update_time` datetime DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  `update_user` varchar(50) DEFAULT NULL COMMENT '更新人',
  `is_delete` char(1) DEFAULT NULL COMMENT '是否删除: NULL未删除，1删除',
  `instance_id` varchar(36) NOT NULL COMMENT '流程实例ID',
  `node_id` varchar(50) NOT NULL COMMENT '节点ID',
  `node_name` varchar(100) NOT NULL COMMENT '节点名称',
  `node_type` varchar(20) NOT NULL COMMENT '节点类型',
  `assignee_id` varchar(36) DEFAULT NULL COMMENT '审批人ID',
  `assignee_name` varchar(100) DEFAULT NULL COMMENT '审批人名称',
  `status` char(1) NOT NULL DEFAULT '1' COMMENT '状态:1待处理2处理中3已完成4已取消',
  `action` char(1) DEFAULT NULL COMMENT '审批动作:1同意2拒绝3撤回4转交',
  `comment` text COMMENT '审批意见',
  `input_data` json DEFAULT NULL COMMENT '输入数据JSON',
  `output_data` json DEFAULT NULL COMMENT '输出数据JSON',
  `start_time` datetime DEFAULT NULL COMMENT '任务开始时间',
  `complete_time` datetime DEFAULT NULL COMMENT '完成时间',
  `duration` bigint DEFAULT NULL COMMENT '处理耗时(毫秒)',
  `due_time` datetime DEFAULT NULL COMMENT '到期时间',
  PRIMARY KEY (`id`),
  KEY `idx_instance_id` (`instance_id`),
  KEY `idx_assignee_id` (`assignee_id`),
  KEY `idx_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='流程任务表';

-- 工作流历史记录表
CREATE TABLE IF NOT EXISTS `wf_history` (
  `id` bigint NOT NULL AUTO_INCREMENT COMMENT '主键ID',
  `create_time` datetime DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `create_user` varchar(50) DEFAULT NULL COMMENT '创建人',
  `update_time` datetime DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  `update_user` varchar(50) DEFAULT NULL COMMENT '更新人',
  `is_delete` char(1) DEFAULT NULL COMMENT '是否删除: NULL未删除，1删除',
  `instance_id` varchar(36) NOT NULL COMMENT '流程实例ID',
  `task_id` varchar(36) DEFAULT NULL COMMENT '关联任务ID',
  `node_id` varchar(50) DEFAULT NULL COMMENT '节点ID',
  `node_name` varchar(100) DEFAULT NULL COMMENT '节点名称',
  `operator_id` varchar(36) DEFAULT NULL COMMENT '操作人ID',
  `operator_name` varchar(100) DEFAULT NULL COMMENT '操作人名称',
  `action` varchar(20) DEFAULT NULL COMMENT '操作类型',
  `comment` text COMMENT '操作意见',
  `variables` json DEFAULT NULL COMMENT '当时变量状态',
  PRIMARY KEY (`id`),
  KEY `idx_instance_id` (`instance_id`),
  KEY `idx_task_id` (`task_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='流程历史记录表';
```

---

### 2. ❌ 实体字段命名不一致

**问题描述**:  
- 方案文档中的实体使用驼峰命名（如 `definitionId`）
- TypeORM会自动将驼峰转为蛇形存储到数据库
- 但SQL脚本中使用的是蛇形命名（如 `definition_id`）
- 当前实体类没有显式指定 `name` 属性，依赖自动转换

**影响**: 
- 如果数据库表已按蛇形创建，TypeORM能正确映射
- 但如果手动创建的表使用驼峰，会导致字段找不到

**修复方案**:  
在实体类的 `@BaseColumn` 装饰器中显式指定 `name` 属性：

```typescript
// workflow-instance.entity.ts
@BaseColumn({ length: 36, name: 'definition_id', comment: '流程定义ID' })
definitionId: string;

@BaseColumn({ length: 50, name: 'definition_code', comment: '流程定义编码' })
definitionCode: string;

@BaseColumn({ length: 100, name: 'business_key', comment: '业务数据ID' })
businessKey: string;

@BaseColumn({ length: 36, name: 'starter_id', comment: '发起人ID' })
starterId: string;

@BaseColumn({ length: 50, nullable: true, name: 'current_node_id', comment: '当前节点ID' })
currentNodeId: string;

@BaseColumn({ type: 'json', nullable: true, name: 'variables', comment: '流程变量JSON' })
variables: Record<string, any>;

@BaseColumn({ type: 'char', length: 1, default: '1', name: 'status', comment: '状态:1进行中 2已完成 3已取消 4已挂起' })
status: string;

@BaseColumn({ type: 'datetime', nullable: true, name: 'start_time', comment: '开始时间' })
startTime: string;

@BaseColumn({ type: 'datetime', nullable: true, name: 'end_time', comment: '结束时间' })
endTime: string;

@BaseColumn({ type: 'bigint', nullable: true, name: 'duration', comment: '耗时(毫秒)' })
duration: string;
```

同样需要修复 `workflow-task.entity.ts` 和 `workflow-history.entity.ts` 的所有字段。

---

### 3. ❌ WorkflowDefinition 缺少唯一约束

**问题描述**:  
- 实体类中 `code` 字段使用了 `@DbUnique` 装饰器
- 但方案要求 `(code, version)` 联合唯一
- 当前实现只保证了 `code` 唯一，无法支持多版本

**影响**: 
- 无法为同一流程创建多个版本
- 违反方案设计意图

**修复方案**:  
移除 `@DbUnique` 装饰器，在数据库中创建联合唯一索引：

```sql
ALTER TABLE `wf_definition` ADD UNIQUE KEY `uk_code_version` (`code`, `version`);
```

或者在实体类中添加注释说明需要在数据库层面维护版本唯一性。

---

### 4. ❌ 通知集成错误 - NoticeDto 参数不匹配

**问题描述**:  
在 `service.ts` 第345-359行：

```typescript
const noticeDto: NoticeDto = {
  title: `待办审批：${node.name}`,
  content: `您有一个新的审批任务待处理...`,
  isActive: '1',
  remark: `workflow_task:${task.id}`,
};

await this.noticesService.create(noticeDto);
```

**问题分析**:  
1. `NoticeDto` 继承自 `PartialType(Notice)`，而 `Notice` 实体的字段是：
   - `title`: ✅ 存在
   - `content`: ✅ 存在
   - `isActive`: ✅ 存在
   - `remark`: ✅ 存在
   
2. 但是 `NoticesService.create()` 方法来自 `BaseService`，需要检查其签名

3. **更严重的问题**：通知没有指定接收人！当前的 Notice 表结构不支持指定接收用户

**影响**: 
- 通知创建了但不知道发给谁
- 无法实现"发送给审批人"的功能

**修复方案**:  

**方案A（推荐）**: 扩展 Notice 实体，添加接收人字段

```typescript
// notices/entity.ts
@BaseColumn({ type: 'json', nullable: true, name: 'receiver_ids', comment: '接收人ID列表' })
receiverIds: string[];
```

然后修改通知发送逻辑：

```typescript
const noticeDto: NoticeDto = {
  title: `待办审批：${node.name}`,
  content: `您有一个新的审批任务待处理...`,
  isActive: '1',
  remark: `workflow_task:${task.id}`,
  receiverIds: [task.assigneeId], // 指定接收人
};
```

**方案B（临时）**: 使用现有的系统通知机制，通过 WebSocket 推送

---

### 5. ❌ 缺少 UsersModule 依赖注入

**问题描述**:  
- 方案文档中明确提到需要与 `UsersModule` 集成
- 用于根据角色/部门查询用户ID
- 但当前 `WorkflowModule` 只导入了 `NoticesModule`

**影响**: 
- `service.ts` 第307-308行的 TODO 无法实现：
  ```typescript
  case 'role':
    // TODO: 根据角色查询用户
    assigneeId = props.roleId || '';
  ```

**修复方案**:  

1. 在 `module.ts` 中添加 `UsersModule` 导入：

```typescript
import { UsersModule } from '../../modules/users/users.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([...]),
    NoticesModule,
    UsersModule,  // 新增
  ],
  ...
})
```

2. 在 `service.ts` 中注入 `UsersService`：

```typescript
import { UsersService } from '../../modules/users/users.service';

constructor(
  ...
  @Inject(forwardRef(() => UsersService))
  private usersService: UsersService,
) {}
```

3. 实现角色/部门查询逻辑：

```typescript
case 'role':
  const userIds = await this.usersService.findUserIdsByRoleId(props.roleId);
  assigneeId = userIds[0] || ''; // 取第一个用户
  break;
case 'department':
  const deptUserIds = await this.usersService.findUserIdsByDeptId(props.departmentId);
  assigneeId = deptUserIds[0] || '';
  break;
```

---

## 🟡 中等问题（建议修复）

### 6. ⚠️ 事务处理缺失

**问题描述**:  
- 流程启动、任务完成等关键操作涉及多表写入
- 当前代码没有使用事务包裹
- 如果中间步骤失败，会导致数据不一致

**示例场景**:  
`startWorkflow()` 方法：
1. 创建流程实例 ✅
2. 执行第一个节点
3. 创建审批任务
4. 发送通知

如果第3步失败，流程实例已创建但任务未创建，状态不一致。

**修复方案**:  
使用 TypeORM 的事务装饰器：

```typescript
import { Transaction, TransactionManager } from 'typeorm';

async startWorkflow(dto: StartWorkflowDto, starterId: string): Promise<WorkflowInstance> {
  return this.instanceRepo.manager.transaction(async (transactionalEntityManager) => {
    // 获取流程定义
    const definition = await this.getDefinitionByCode(dto.code);

    // 创建流程实例
    const instance = this.instanceRepo.create({
      definitionId: definition.id,
      definitionCode: definition.code,
      businessKey: dto.businessKey,
      starterId,
      variables: dto.variables || {},
      status: '1',
      startTime: new Date().toISOString(),
    });

    const savedInstance = await transactionalEntityManager.save(instance);

    // 执行第一个节点（内部也会使用同一个事务）
    await this.executeNode(savedInstance, definition, 0, transactionalEntityManager);

    return savedInstance;
  });
}
```

---

### 7. ⚠️ 异常处理不完善

**问题描述**:  
1. `executeNode()` 捕获了异常但没有回滚事务
2. 通知发送失败只打印日志，不影响流程
3. 缺少重试机制

**修复方案**:  

```typescript
try {
  await handler.onEnter?.(context);
  const result = await handler.execute(context);
  await this.recordHistory(instance, node, context, 'execute');
  
  if (node.type === NodeType.APPROVAL) {
    await this.createApprovalTask(instance, node, context);
  }
  
  // ... 推进流程
  
  await handler.onExit?.(context);
} catch (error) {
  console.error(`[Workflow Error] Node ${node.id}: ${error.message}`);
  
  // 记录错误历史
  await this.recordHistory(instance, node, context, 'error');
  
  // 标记流程失败
  await this.failInstance(instance);
  
  // 如果是事务内，抛出异常触发回滚
  throw new BadRequestException(`流程执行失败: ${error.message}`);
}
```

---

### 8. ⚠️ 缺少分页查询接口

**问题描述**:  
- `controller.ts` 中的 `listDefinitions()` 直接返回所有数据
- `getPendingTasks()` 也没有分页
- 大数据量时性能差

**修复方案**:  

```typescript
// controller.ts
@Get('definitions')
async listDefinitions(@Query() query: QueryListDto) {
  return this.workflowService.listDefinitions(query);
}

@Get('tasks/my')
async getMyTasks(
  @Query('userId') userId: string,
  @Query() query: QueryListDto,
) {
  return this.workflowService.getPendingTasks(userId, query);
}
```

```typescript
// service.ts
async listDefinitions(query: QueryListDto): Promise<ResponseListDto<WorkflowDefinition>> {
  const { pageNum = 1, pageSize = 10, ...filters } = query;
  
  const [items, total] = await this.definitionRepo.findAndCount({
    where: filters,
    order: { createTime: 'DESC' },
    skip: (pageNum - 1) * pageSize,
    take: pageSize,
  });
  
  return { items, total, pageNum, pageSize };
}
```

---

### 9. ⚠️ 缺少流程实例查询接口

**问题描述**:  
- 方案文档中有多个实例查询接口
- 当前只有 `getInstance(id)` 单个查询
- 缺少按业务Key、状态、发起人等条件查询

**修复方案**:  
添加以下接口：

```typescript
// controller.ts
@Get('instances')
async listInstances(@Query() query: QueryWorkflowInstanceDto) {
  return this.workflowService.listInstances(query);
}

@Get('instances/business/:businessKey')
async getInstanceByBusinessKey(@Param('businessKey') businessKey: string) {
  return this.workflowService.getInstanceByBusinessKey(businessKey);
}

@Post('instances/:id/cancel')
async cancelInstance(@Param('id') id: string) {
  return this.workflowService.cancelInstance(id);
}
```

---

### 10. ⚠️ 缺少权限控制

**问题描述**:  
- 所有接口都没有权限校验
- 任何人都可以启动流程、完成任务
- 存在安全风险

**修复方案**:  
添加权限守卫：

```typescript
import { RequiresPermissions } from '../../common/decorators/permissions.decorator';

@Controller('workflow')
export class WorkflowController {
  @Post('definitions')
  @RequiresPermissions(['workflow:definition:create'])
  async createDefinition(@Body() dto: CreateWorkflowDefinitionDto) {
    return this.workflowService.createDefinition(dto);
  }

  @Post('instances/start')
  @RequiresPermissions(['workflow:instance:start'])
  async startWorkflow(@Body() dto: StartWorkflowDto, @CurrentUser('id') userId: string) {
    return this.workflowService.startWorkflow(dto, userId);
  }

  @Post('tasks/:id/complete')
  @RequiresPermissions(['workflow:task:complete'])
  async completeTask(
    @Param('id') id: string,
    @Body() dto: CompleteTaskDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.workflowService.completeTask(id, userId, dto);
  }
}
```

---

## 🟢 轻微问题（可选优化）

### 11. 💡 节点处理器返回的 nextNodeIds 未使用

**问题描述**:  
- 所有节点处理器的 `execute()` 都返回 `nextNodeIds: []`
- 实际的节点流转逻辑在 `service.ts` 的 `findNextNodes()` 中实现
- 节点处理器的返回值被忽略

**建议**:  
简化节点处理器，让它们只负责自身逻辑，不负责流转判断。

---

### 12. 💡 缺少流程校验逻辑

**问题描述**:  
- 保存流程定义时没有校验合法性
- 可能出现：没有开始节点、没有结束节点、节点孤立等问题

**建议**:  
添加校验方法：

```typescript
validateDefinition(nodes: NodeConfig[], flows: FlowConfig[]): void {
  // 检查是否有且仅有一个开始节点
  const startNodes = nodes.filter(n => n.type === NodeType.START);
  if (startNodes.length !== 1) {
    throw new BadRequestException('流程必须有且仅有一个开始节点');
  }

  // 检查是否有至少一个结束节点
  const endNodes = nodes.filter(n => n.type === NodeType.END);
  if (endNodes.length < 1) {
    throw new BadRequestException('流程必须有至少一个结束节点');
  }

  // 检查节点连通性
  // ...
}
```

---

### 13. 💡 缺少流程版本管理

**问题描述**:  
- 虽然实体有 `version` 字段
- 但没有实现版本切换逻辑
- 发布新版本后，旧版本的实例如何处理？

**建议**:  
实现版本管理策略：
- 新启动的实例使用最新版本
- 运行中的实例继续使用启动时的版本

---

### 14. 💡 缺少流程监控接口

**问题描述**:  
- 无法查看流程的执行进度
- 无法查看当前卡在哪个节点

**建议**:  
添加监控接口：

```typescript
@Get('instances/:id/progress')
async getInstanceProgress(@Param('id') id: string) {
  const instance = await this.getInstance(id);
  const tasks = await this.taskRepo.find({
    where: { instanceId: id },
    order: { createTime: 'ASC' },
  });
  const history = await this.historyRepo.find({
    where: { instanceId: id },
    order: { createTime: 'ASC' },
  });
  
  return {
    instance,
    tasks,
    history,
    currentNode: instance.currentNodeId,
  };
}
```

---

### 15. 💡 前端API文件不完整

**问题描述**:  
- 前端只有 `/views/business/workflow/api.ts`
- 但没有对应的Vue组件
- 无法测试后端接口

**建议**:  
先完成后端审计修复，再开发前端页面。

---

## 📊 修复优先级

| 优先级 | 问题编号 | 问题描述 | 预计工作量 |
|--------|---------|---------|-----------|
| 🔴 P0 | #1 | 缺少数据库建表SQL | 30分钟 |
| 🔴 P0 | #2 | 实体字段命名不一致 | 1小时 |
| 🔴 P0 | #4 | 通知集成错误 | 2小时 |
| 🔴 P0 | #5 | 缺少UsersModule依赖 | 1小时 |
| 🟡 P1 | #6 | 事务处理缺失 | 2小时 |
| 🟡 P1 | #7 | 异常处理不完善 | 1小时 |
| 🟡 P1 | #8 | 缺少分页查询 | 1小时 |
| 🟡 P1 | #9 | 缺少实例查询接口 | 2小时 |
| 🟡 P1 | #10 | 缺少权限控制 | 1小时 |
| 🟢 P2 | #11-15 | 优化建议 | 各30分钟 |

**总预计工作量**: 12-15小时（约2个工作日）

---

## ✅ 已正确实现的部分

1. ✅ 模块结构清晰，符合NestJS规范
2. ✅ 实体类继承 BaseEntity，遵循项目约定
3. ✅ 使用了 `@BaseColumn`、`@DbUnique` 等项目自定义装饰器
4. ✅ 节点处理器工厂模式实现正确
5. ✅ 8种节点类型全部实现
6. ✅ DTO验证使用 class-validator
7. ✅ 已在 app.module.ts 中注册 WorkflowModule
8. ✅ 条件评估逻辑完整
9. ✅ 流程变量表达式解析正确

---

## 🎯 下一步行动建议

### 立即执行（今天）
1. 创建数据库建表SQL脚本
2. 修复实体字段命名
3. 修复通知集成问题
4. 添加 UsersModule 依赖

### 本周内完成
5. 添加事务处理
6. 完善异常处理
7. 添加分页查询
8. 补充实例查询接口
9. 添加权限控制

### 下周优化
10. 实现流程校验
11. 添加流程监控
12. 开发前端页面

---

## ✅ 修复记录（2026-04-06）

### 已修复的问题

#### P0级别问题（已全部修复）

1. **✅ 数据库建表SQL脚本**
   - 创建了 `/nest-admin/doc/sql/create_workflow_tables.sql`
   - 包含4张核心表的完整建表语句
   - 添加了联合唯一索引和普通索引
   - 包含了测试数据插入语句
   - 新增了 `candidate_ids` 字段支持会签功能

2. **✅ 实体字段命名不一致**
   - 修复了 `WorkflowInstance` 实体的9个字段，添加 `name` 属性
   - 修复了 `WorkflowTask` 实体的15个字段，添加 `name` 属性
   - 修复了 `WorkflowHistory` 实体的9个字段，添加 `name` 属性
   - 修复了 `WorkflowDefinition` 实体的所有字段，移除错误的 `@DbUnique` 装饰器
   - 确保TypeORM能正确映射驼峰命名的TS属性到蛇形命名的DB字段

3. **✅ 通知集成错误**
   - 修复了 `service.ts` 中的编译错误
   - 从正确的路径导入 `NodeType` 和 `ConditionOperator`
   - 使用 `BoolNum.Yes` 替代字符串 `'1'`
   - 使用 `noticesService.add()` 替代不存在的 `create()` 方法
   - 修复了流程实例查询逻辑，不再访问不存在的 `task.instance` 关系

4. **✅ 缺少UsersModule依赖**
   - 在 `module.ts` 中添加了 `UsersModule` 导入
   - 在 `service.ts` 中注入了 `UsersService`
   - 实现了基于角色的审批人查询功能
   - 实现了基于部门的审批人查询功能
   - 支持顺序会签和并行会签两种模式

5. **✅ 任务实体缺少候选审批人字段**
   - 在数据库中添加了 `candidate_ids` JSON字段
   - 在 `WorkflowTask` 实体中添加了对应的属性
   - 支持会签场景下记录所有候选审批人

#### 代码优化

- 重构了 `createApprovalTask` 方法，拆分为两个方法：
  - `createApprovalTask`: 负责根据审批人类型确定审批人列表
  - `createSingleTask`: 负责创建单个任务并发送通知
- 增加了完善的错误处理和日志记录
- 支持多种审批人类型：指定用户、角色、部门、动态表达式

### 待优化的问题（P1/P2级别）

以下问题不影响系统运行，但建议后续优化：

1. **事务处理**：启动流程和完成任务时建议使用数据库事务
2. **DTO校验增强**：部分DTO可以增加更多验证规则
3. **节点处理器完善**：部分节点处理器的业务逻辑可以进一步细化
4. **性能优化**：批量操作时可以考虑优化查询
5. **单元测试**：建议补充单元测试用例

---

## 📝 总结

工作流引擎的后端实现**整体架构良好**，核心逻辑基本完整，但在**数据库初始化**、**模块依赖**、**通知集成**等关键环节存在**阻塞性问题**，需要先修复这些问题才能正常运行。

建议按照优先级逐步修复，优先解决P0级别的问题，确保系统能够启动和基本运行，然后再完善高级功能。

