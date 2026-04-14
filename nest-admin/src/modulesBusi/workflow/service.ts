import { Injectable, BadRequestException, ForbiddenException, Inject } from '@nestjs/common';
import { forwardRef } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import dayjs from 'dayjs';
import { WorkflowDefinition } from './entity/workflow-definition.entity';
import { WorkflowInstance } from './entity/workflow-instance.entity';
import { WorkflowTask } from './entity/workflow-task.entity';
import { WorkflowHistory } from './entity/workflow-history.entity';
import { WorkflowBusinessConfig } from './entity/workflow-business-config.entity';
import { NodeHandlerFactory } from './handler/node-handler.factory';
import { NodeExecutionContext, NodeResult, NodeConfig, FlowConfig, Condition } from './interface/node.interface';
import { NodeType, ConditionOperator, InstanceStatus, TaskStatus, TaskAction, AssigneeType, MultiInstanceType, CompleteType, AssigneeEmptyAction } from './interface/node-type.enum';
import { CreateWorkflowDefinitionDto, UpdateWorkflowDefinitionDto, StartWorkflowDto, CompleteTaskDto, TransferTaskDto, AddSignTaskDto, WithdrawWorkflowDto, CancelWorkflowDto } from './dto';
import { NoticesService } from '../../modules/notices/service';
import { BoolNum } from '../../common/type/base';
import { UsersService } from '../../modules/users/users.service';
import { WorkflowDataLoaderService } from './workflow-data-loader.service';
import { WorkflowAssigneeResolverService } from '../../common/services/workflow-assignee-resolver.service';
import { WorkflowIntegrationService } from '../../common/services/workflow-integration.service';

@Injectable()
export class WorkflowService {
  constructor(
    @InjectRepository(WorkflowDefinition)
    private definitionRepo: Repository<WorkflowDefinition>,
    @InjectRepository(WorkflowInstance)
    private instanceRepo: Repository<WorkflowInstance>,
    @InjectRepository(WorkflowTask)
    private taskRepo: Repository<WorkflowTask>,
    @InjectRepository(WorkflowHistory)
    private historyRepo: Repository<WorkflowHistory>,
    @InjectRepository(WorkflowBusinessConfig)
    private configRepo: Repository<WorkflowBusinessConfig>,
    private nodeHandlerFactory: NodeHandlerFactory,
    @Inject(forwardRef(() => NoticesService))
    private noticesService: NoticesService,
    @Inject(forwardRef(() => UsersService))
    private usersService: UsersService,
    private dataLoader: WorkflowDataLoaderService,
    private assigneeResolver: WorkflowAssigneeResolverService,
    @Inject(forwardRef(() => WorkflowIntegrationService))
    private workflowIntegrationService: WorkflowIntegrationService,
  ) {}

  // ==================== 流程定义管理 ====================

  /**
   * 获取所有流程定义列表
   */
  async listDefinitions(): Promise<WorkflowDefinition[]> {
    return this.definitionRepo.find({ order: { createTime: 'DESC' } });
  }

  /**
   * 创建工作流定义
   */
  async createDefinition(dto: CreateWorkflowDefinitionDto): Promise<WorkflowDefinition> {
    // 自动生成编码（如果未提供）
    if (!dto.code) {
      dto.code = await this.generateWorkflowCode(dto.businessType);
    }

    // 检查编码是否已存在
    const existing = await this.definitionRepo.findOne({
      where: { code: dto?.code },
      order: { version: 'DESC' },
    });

    const version = existing ? (existing.version || 1) + 1 : 1;

    const definition = this.definitionRepo.create({
      ...dto,
      version,
      isActive: '1',
    });

    return this.definitionRepo.save(definition);
  }

  /**
   * 生成流程编码
   * 格式: WF_{businessType}_年月流水号 (如 WF_project_2026040004)
   */
  private async generateWorkflowCode(businessType?: string): Promise<string> {
    const bt = businessType || 'default';
    const ym = dayjs().format('YYYYMM');
    const prefix = `WF_${bt}_${ym}`;

    // 查询当月该前缀的最新流水号
    const latest = await this.definitionRepo
      .createQueryBuilder('definition')
      .where('definition.code LIKE :prefix', { prefix: prefix + '%' })
      .orderBy('definition.code', 'DESC')
      .getOne();

    let seq = 1;
    if (latest && latest.code) {
      const lastSeq = parseInt(latest.code.replace(prefix, ''), 10);
      if (!isNaN(lastSeq)) {
        seq = lastSeq + 1;
      }
    }

    return `${prefix}${String(seq).padStart(4, '0')}`;
  }

  /**
   * 保存工作流定义（框架标准save接口）
   */
  async saveDefinition(dto: any): Promise<any> {
    await this.ensureUniquePublishedScene(dto)

    if (dto.id) {
      // 更新
      const definition = await this.definitionRepo.findOne({ where: { id: dto.id } });
      if (!definition) {
        throw new BadRequestException('工作流定义不存在');
      }
      Object.assign(definition, dto);
      return this.definitionRepo.save(definition);
    } else {
      // 新增
      return this.createDefinition(dto);
    }
  }

  /**
   * 更新工作流定义
   */
  async updateDefinition(id: string, dto: UpdateWorkflowDefinitionDto): Promise<WorkflowDefinition> {
    const definition = await this.definitionRepo.findOne({ where: { id } });
    if (!definition) {
      throw new BadRequestException('工作流定义不存在');
    }

    Object.assign(definition, dto);
    return this.definitionRepo.save(definition);
  }

  /**
   * 获取工作流定义详情
   */
  async getDefinition(id: string): Promise<WorkflowDefinition> {
    const definition = await this.definitionRepo.findOne({ where: { id } });
    if (!definition) {
      throw new BadRequestException('工作流定义不存在');
    }
    return definition;
  }

  /**
   * 获取最新版本的工作流定义
   */
  async getDefinitionByCode(code: string): Promise<WorkflowDefinition> {
    const definition = await this.definitionRepo.findOne({
      where: { code, isActive: '1' },
      order: { version: 'DESC' },
    });
    if (!definition) {
      throw new BadRequestException(`工作流定义不存在: ${code}`);
    }
    return definition;
  }

  async getDefinitionByScene(businessType: string, businessScene: string): Promise<WorkflowDefinition> {
    const definitions = await this.definitionRepo.find({
      where: { businessType, businessScene, isActive: '1' },
      order: { version: 'DESC' },
    })

    if (!definitions.length) {
      throw new BadRequestException(`未找到已发布流程：${businessType} / ${businessScene}`)
    }

    if (definitions.length > 1) {
      throw new BadRequestException(`业务对象 ${businessType} 场景 ${businessScene} 存在多条已发布流程，请先清理重复配置`)
    }

    return definitions[0]
  }

  /**
   * 发布工作流(激活)
   */
  async publishDefinition(id: string): Promise<WorkflowDefinition> {
    const definition = await this.definitionRepo.findOne({ where: { id } });
    if (!definition) {
      throw new BadRequestException('工作流定义不存在');
    }

    await this.ensureUniquePublishedScene({ ...definition, isActive: '1' }, id)
    definition.isActive = '1';
    return this.definitionRepo.save(definition);
  }

  /**
   * 停用工作流
   */
  async unpublishDefinition(id: string): Promise<WorkflowDefinition> {
    const definition = await this.definitionRepo.findOne({ where: { id } });
    if (!definition) {
      throw new BadRequestException('工作流定义不存在');
    }

    definition.isActive = '0';
    return this.definitionRepo.save(definition);
  }

  /**
   * 删除工作流定义（软删除）
   */
  async deleteDefinition(id: string): Promise<void> {
    const definition = await this.definitionRepo.findOne({ where: { id } });
    if (!definition) {
      throw new BadRequestException('工作流定义不存在');
    }

    // 检查是否有运行中的实例
    const runningInstance = await this.instanceRepo.findOne({
      where: { definitionId: id, status: InstanceStatus.RUNNING },
    });
    if (runningInstance) {
      throw new BadRequestException('存在运行中的流程实例，不允许删除');
    }

    // 软删除
    definition.isDelete = BoolNum.Yes;
    await this.definitionRepo.save(definition);
  }

  /**
   * 复制工作流定义
   */
  async copyDefinition(id: string): Promise<WorkflowDefinition> {
    const original = await this.definitionRepo.findOne({ where: { id } });
    if (!original) {
      throw new BadRequestException('工作流定义不存在');
    }

    // 获取最新版本号
    const latest = await this.definitionRepo.findOne({
      where: { code: original.code },
      order: { version: 'DESC' },
    });
    const newVersion = latest ? (latest.version || 1) + 1 : 1;

    const copy = this.definitionRepo.create({
      name: `${original.name}（副本）`,
      code: original.code,
      version: newVersion,
      category: original.category,
      description: original.description,
      nodes: original.nodes,
      flows: original.flows,
      globalConfig: original.globalConfig,
      businessType: original.businessType,
      businessScene: original.businessScene,
      triggerEvent: original.triggerEvent,
      isActive: '0',
    });

    return this.definitionRepo.save(copy);
  }

  // ==================== 流程实例管理 ====================

  /**
   * 启动工作流
   */
  async startWorkflow(dto: StartWorkflowDto, starterId: string): Promise<WorkflowInstance> {
    const definition = dto.code
      ? await this.getDefinitionByCode(dto.code)
      : await this.getDefinitionByScene(dto.businessType, dto.businessScene)

    // 自动加载业务数据
    let variables = dto.variables || {};
    if (definition.businessType) {
      try {
        const businessData = await this.dataLoader.loadData(
          definition.businessType,
          dto.businessKey
        );
        // 将业务数据注入 variables，使用业务类型作为前缀
        variables = {
          ...variables,
          [definition.businessType]: businessData.data,
          _businessData: businessData,
        };
        console.log(`[Workflow] Loaded business data for ${definition.businessType}: ${dto.businessKey}`);
      } catch (error) {
        console.error(`[Workflow] Failed to load business data: ${error.message}`);
        // 不阻止流程继续，但记录错误
      }
    }

    // 创建流程实例
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

    // 执行第一个节点
    await this.executeNode(savedInstance, definition, 0);

    return savedInstance;
  }

  async startBusinessWorkflow(
    dto: { businessType: string; businessScene: string; businessKey: string; variables?: any },
    starterId: string,
  ): Promise<WorkflowInstance> {
    return this.startWorkflow(
      {
        businessType: dto.businessType,
        businessScene: dto.businessScene,
        businessKey: dto.businessKey,
        variables: dto.variables,
      } as StartWorkflowDto,
      starterId,
    )
  }

  private async ensureUniquePublishedScene(dto: any, currentId?: string): Promise<void> {
    if (!dto.businessType || !dto.businessScene || dto.isActive !== '1') {
      return
    }

    const existing = await this.definitionRepo.findOne({
      where: {
        businessType: dto.businessType,
        businessScene: dto.businessScene,
        isActive: '1',
      },
    })

    if (existing && existing.id !== (currentId || dto.id)) {
      throw new BadRequestException(`该业务对象 + 业务场景已存在已发布流程（${existing.name}），请先停用后再发布`)
    }
  }

  /**
   * 执行节点
   */
  private async executeNode(instance: WorkflowInstance, definition: WorkflowDefinition, nodeIndex: number): Promise<void> {
    if (nodeIndex >= definition.nodes.length) {
      // 流程结束
      await this.completeInstance(instance);
      return;
    }

    const node = definition.nodes[nodeIndex];
    const handler = this.nodeHandlerFactory.getHandler(node.type);

    const context: NodeExecutionContext = {
      instanceId: instance.id,
      nodeId: node.id,
      variables: instance.variables || {},
      startTime: new Date(),
    };

    try {
      // 1. 进入节点
      await handler.onEnter?.(context);

      // 2. 执行节点
      const result = await handler.execute(context);

      // 3. 记录历史
      await this.recordHistory(instance, node, context, 'execute');

      // 4. 处理节点特殊逻辑
      if (node.type === NodeType.APPROVAL) {
        // 审批节点需要创建任务
        await this.createApprovalTask(instance, node, context);
      }

      // 5. 根据结果推进流程
      if (result.success) {
        const nextNodeIds = this.findNextNodes(definition, node, instance, result.nextNodeIds);
        if (nextNodeIds.length > 0) {
          for (const nextNodeId of nextNodeIds) {
            const nextNodeIndex = definition.nodes.findIndex(n => n.id === nextNodeId);
            if (nextNodeIndex >= 0) {
              await this.executeNode(instance, definition, nextNodeIndex);
            }
          }
        } else {
          // 没有下一个节点，流程结束
          await this.completeInstance(instance);
        }
      }

      // 6. 退出节点
      await handler.onExit?.(context);

    } catch (error) {
      console.error(`[Workflow Error] Node ${node.id}: ${error.message}`);
      await this.failInstance(instance);
      throw error;
    }
  }

  /**
   * 查找下一个节点
   */
  private findNextNodes(
    definition: WorkflowDefinition,
    currentNode: NodeConfig,
    instance: WorkflowInstance,
    handlerNextNodes: string[] = []
  ): string[] {
    // 如果处理器返回了明确的下一个节点，使用处理器返回的结果
    if (handlerNextNodes.length > 0) {
      return handlerNextNodes;
    }

    // 否则根据连接线配置查找
    const outgoingFlows = definition.flows.filter(f => f.sourceNodeId === currentNode.id);
    if (outgoingFlows.length === 0) {
      return [];
    }

    // 如果只有一个输出，直接返回
    if (outgoingFlows.length === 1) {
      return [outgoingFlows[0].targetNodeId];
    }

    // 多个输出时，检查是否有条件
    for (const flow of outgoingFlows) {
      if (flow.condition) {
        if (this.evaluateCondition(flow.condition, instance.variables || {})) {
          return [flow.targetNodeId];
        }
      }
    }

    // 返回第一个输出（默认）
    return [outgoingFlows[0].targetNodeId];
  }

  /**
   * 评估条件
   */
  private evaluateCondition(condition: Condition, variables: Record<string, any>): boolean {
    const fieldValue = this.getFieldValue(condition.field, variables);
    const { operator, value } = condition;

    switch (operator) {
      case ConditionOperator.EQ:
        return fieldValue === value;
      case ConditionOperator.NEQ:
        return fieldValue !== value;
      case ConditionOperator.GT:
        return Number(fieldValue) > Number(value);
      case ConditionOperator.GTE:
        return Number(fieldValue) >= Number(value);
      case ConditionOperator.LT:
        return Number(fieldValue) < Number(value);
      case ConditionOperator.LTE:
        return Number(fieldValue) <= Number(value);
      case ConditionOperator.IN:
        return Array.isArray(value) && value.includes(fieldValue);
      case ConditionOperator.CONTAINS:
        return String(fieldValue).includes(String(value));
      default:
        return false;
    }
  }

  /**
   * 获取字段值，支持嵌套属性访问
   * 例如: ${project.leader.id} 或 ${variables.project.leader.id}
   */
  private getFieldValue(field: string, variables: Record<string, any>): any {
    if (field.startsWith('${') && field.endsWith('}')) {
      let path = field.slice(2, -1);
      
      // 去掉 variables. 前缀
      if (path.startsWith('variables.')) {
        path = path.slice(10);
      }
      
      // 处理 initiator 特殊变量
      if (path === 'initiator') {
        return variables['starterId'];
      }
      
      // 支持嵌套属性访问，如 project.leader.id
      const parts = path.split('.');
      let value = variables;
      for (const part of parts) {
        if (value == null) return null;
        value = value[part];
      }
      return value;
    }
    // 非表达式格式，也支持嵌套访问
    const parts = field.split('.');
    let value = variables;
    for (const part of parts) {
      if (value == null) return null;
      value = value[part];
    }
    return value;
  }

  /**
   * 创建审批任务
   */
  private async createApprovalTask(instance: WorkflowInstance, node: NodeConfig, context: NodeExecutionContext): Promise<void> {
    const props = node.properties as any;
    const businessData = context.variables._businessData;
    
    // 构建审批人配置
    const assigneeConfig = {
      type: props.assigneeType,
      userId: props.assigneeValue,
      roleId: props.roleId,
      deptPath: props.deptPath,
      fieldPath: props.fieldPath,
      expression: props.expression,
      businessType: props.businessType,
    };

    // 使用审批人解析服务获取审批人
    let assigneeIds: string[] = [];
    
    try {
      assigneeIds = await this.assigneeResolver.resolve(assigneeConfig, businessData);
      console.log(`[Workflow] Resolved ${assigneeIds.length} assignees for node ${node.id}`);
    } catch (error) {
      console.error(`[Workflow] Failed to resolve assignees: ${error.message}`);
    }

    // 处理人为空的逻辑
    if (assigneeIds.length === 0) {
      const emptyAction = props.assigneeEmptyAction || AssigneeEmptyAction.ERROR;
      
      switch (emptyAction) {
        case AssigneeEmptyAction.ERROR:
          throw new Error(`审批人不能为空，节点: ${node.name}`);
        case AssigneeEmptyAction.SKIP:
          console.warn(`[Workflow] No assignee found for node ${node.id}, skipping...`);
          return;
        case AssigneeEmptyAction.ASSIGN_TO:
          const fallbackFieldPath = props.assigneeEmptyFallbackFieldPath;
          if (fallbackFieldPath) {
            assigneeIds = await this.assigneeResolver.resolve(
              {
                type: 'business_field',
                fieldPath: fallbackFieldPath,
                businessType: props.businessType,
              },
              businessData,
            );
          }

          const fallbackUserId = props.assigneeEmptyFallbackUserId;
          if (assigneeIds.length === 0 && fallbackUserId) {
            assigneeIds = [fallbackUserId];
          }

          if (assigneeIds.length === 0) {
            throw new Error(`未指定备用审批人，节点: ${node.name}`);
          }
          console.log(`[Workflow] Using fallback assignee for node ${node.id}: ${assigneeIds.join(',')}`);
          break;
      }
    }

    // 根据会签类型创建任务
    const multiInstanceType = props.multiInstanceType || 'sequential';

    if (multiInstanceType === 'sequential') {
      // 串行会签：只创建第一个人的任务
      await this.createSingleTask(instance, node, assigneeIds[0], assigneeIds);
    } else if (multiInstanceType === 'all') {
      // 会审（全部处理）：为所有人创建任务，全部完成才算通过
      for (const userId of assigneeIds) {
        await this.createSingleTask(instance, node, userId, assigneeIds, true);
      }
    } else {
      // 并行会签（默认）：为所有人创建任务，任一人处理即可
      for (const userId of assigneeIds) {
        await this.createSingleTask(instance, node, userId, assigneeIds);
      }
    }
  }

  /**
   * 创建单个任务
   * @param requireAllComplete 是否需要所有人完成才通过（会审模式）
   */
  private async createSingleTask(
    instance: WorkflowInstance,
    node: NodeConfig,
    assigneeId: string,
    candidateIds?: string[],
    requireAllComplete?: boolean
  ): Promise<void> {
    const props = node.properties as any;
    
    const task = this.taskRepo.create({
      instanceId: instance.id,
      nodeId: node.id,
      nodeName: node.name,
      nodeType: node.type,
      assigneeId,
      candidateIds: candidateIds || null,
      status: TaskStatus.PENDING,
      startTime: new Date().toISOString(),
    });

    await this.taskRepo.save(task);

    // 发送通知给审批人
    if (assigneeId) {
      await this.sendApprovalNotification(task, instance, node);
    }

    console.log(`[Workflow] Created approval task for user ${assigneeId}, requireAllComplete: ${requireAllComplete}`);
  }

  /**
   * 发送审批通知
   */
  private async sendApprovalNotification(task: WorkflowTask, instance: WorkflowInstance, node: any): Promise<void> {
    try {
      const noticeDto: any = {
        title: `待办审批：${node.name}`,
        content: `您有一个新的审批任务待处理。

流程：${instance.definitionCode}
节点：${node.name}
发起人：${instance.starterId}
时间：${new Date().toISOString()}

请及时处理。`,
        isActive: BoolNum.Yes,
        remark: `workflow_task:${task.id}`,
        receiverIds: [task.assigneeId],
      };

      await this.noticesService.add(noticeDto);

      console.log(`[Workflow] Sent notification for task ${task.id} to user ${task.assigneeId}`);
    } catch (error) {
      console.error(`[Workflow] Failed to send notification: ${error.message}`);
    }
  }

  /**
   * 完成任务
   */
  async completeTask(taskId: string, userId: string, dto: CompleteTaskDto): Promise<WorkflowInstance> {
    const task = await this.taskRepo.findOne({ where: { id: taskId } });

    if (!task) {
      throw new BadRequestException('任务不存在');
    }

    if (task.status !== TaskStatus.PENDING) {
      throw new BadRequestException('任务已处理');
    }

    if (task.assigneeId !== userId) {
      throw new ForbiddenException('您不是该任务的审批人');
    }

    const instance = await this.instanceRepo.findOne({ where: { id: task.instanceId } });

    if (!instance) {
      throw new BadRequestException('流程实例不存在');
    }

    const definition = await this.definitionRepo.findOne({ where: { id: instance.definitionId } });

    task.status = dto.action === 'approve' ? TaskStatus.COMPLETED : TaskStatus.CANCELLED;
    task.action = dto.action === 'approve' ? TaskAction.APPROVE : TaskAction.REJECT;
    task.comment = dto.comment;
    task.completeTime = new Date().toISOString();
    await this.taskRepo.save(task);

    await this.recordHistory(instance, null, {
      ...task,
      nodeId: task.nodeId,
      nodeName: task.nodeName,
    }, dto.action === 'approve' ? TaskAction.APPROVE : TaskAction.REJECT);

    if (dto.variables) {
      instance.variables = { ...instance.variables, ...dto.variables };
      await this.instanceRepo.save(instance);
    }

    if (dto.action === 'approve') {
      const currentNode = definition.nodes.find(n => n.id === task.nodeId);
      if (currentNode) {
        const nextNodeIds = this.findNextNodes(definition, currentNode, instance);
        if (nextNodeIds.length > 0) {
          for (const nextNodeId of nextNodeIds) {
            const nextNodeIndex = definition.nodes.findIndex(n => n.id === nextNodeId);
            if (nextNodeIndex >= 0) {
              await this.executeNode(instance, definition, nextNodeIndex);
            }
          }
        } else {
          await this.completeInstance(instance);
        }
      } else {
        await this.completeInstance(instance);
      }
    } else if (dto.targetNodeId) {
      // 驳回到指定节点
      const targetNodeIndex = definition.nodes.findIndex(n => n.id === dto.targetNodeId);
      if (targetNodeIndex >= 0) {
        // 取消该节点之前的所有任务，重新执行该节点
        await this.taskRepo.update(
          { instanceId: instance.id, status: TaskStatus.PENDING },
          { status: TaskStatus.CANCELLED }
        );
        await this.executeNode(instance, definition, targetNodeIndex);
      } else {
        await this.failInstance(instance);
      }
    } else {
      await this.failInstance(instance);
    }

    return this.instanceRepo.findOne({ where: { id: instance.id } });
  }

  /**
   * 转交任务
   */
  async transferTask(taskId: string, userId: string, dto: TransferTaskDto): Promise<WorkflowTask> {
    const task = await this.taskRepo.findOne({ where: { id: taskId } });

    if (!task) {
      throw new BadRequestException('任务不存在');
    }

    if (task.status !== TaskStatus.PENDING) {
      throw new BadRequestException('任务已处理');
    }

    if (task.assigneeId !== userId) {
      throw new ForbiddenException('您不是该任务的审批人');
    }

    task.assigneeId = dto.targetUserId;
    return this.taskRepo.save(task);
  }

  /**
   * 获取用户待办任务
   */
  async getPendingTasks(userId: string): Promise<WorkflowTask[]> {
    return this.taskRepo.find({
      where: { assigneeId: userId, status: '1' },
      order: { createTime: 'DESC' },
    });
  }

  /**
   * 获取流程实例详情
   */
  async getInstance(id: string): Promise<WorkflowInstance> {
    return this.instanceRepo.findOne({ where: { id } });
  }

  /**
   * 获取流程实例列表（支持筛选）
   */
  async listInstances(userId?: string, status?: string): Promise<WorkflowInstance[]> {
    const where: any = {};
    
    if (userId) {
      // 查询该用户发起的或参与的实例
      where.starterId = userId;
    }
    
    if (status) {
      where.status = status;
    }
    
    return this.instanceRepo.find({ 
      where,
      order: { startTime: 'DESC' },
      take: 100 // 限制返回数量
    });
  }

  /**
   * 完成流程实例
   */
  private async completeInstance(instance: WorkflowInstance): Promise<void> {
    instance.status = InstanceStatus.COMPLETED;
    instance.endTime = new Date().toISOString();
    const startTime = new Date(instance.startTime).getTime();
    const endTime = new Date(instance.endTime).getTime();
    instance.duration = String(endTime - startTime);
    await this.instanceRepo.save(instance);
    await this.workflowIntegrationService.handleWorkflowCallback(instance.id, 'completed', {
      businessKey: instance.businessKey,
      ...(instance.variables || {}),
    });
  }

  /**
   * 失败流程实例
   */
  private async failInstance(instance: WorkflowInstance): Promise<void> {
    instance.status = InstanceStatus.CANCELLED;
    instance.endTime = new Date().toISOString();
    await this.instanceRepo.save(instance);
    await this.workflowIntegrationService.handleWorkflowCallback(instance.id, 'cancelled', {
      businessKey: instance.businessKey,
      ...(instance.variables || {}),
    });
  }

  /**
   * 记录历史
   */
  private async recordHistory(instance: WorkflowInstance, node: NodeConfig | null, context: any, action: string): Promise<void> {
    const history = this.historyRepo.create({
      instanceId: instance.id,
      taskId: context.id,
      nodeId: node?.id || context.nodeId,
      nodeName: node?.name || context.nodeName,
      operatorId: context.operatorId,
      action,
      comment: context.comment,
      variables: instance.variables,
    });
    await this.historyRepo.save(history);
  }

  /**
   * 加签任务（追加审批人）
   */
  async addSignTask(taskId: string, userId: string, dto: AddSignTaskDto): Promise<WorkflowTask> {
    const task = await this.taskRepo.findOne({ where: { id: taskId } });

    if (!task) {
      throw new BadRequestException('任务不存在');
    }

    if (task.status !== TaskStatus.PENDING) {
      throw new BadRequestException('任务已处理');
    }

    if (task.assigneeId !== userId) {
      throw new ForbiddenException('您不是该任务的审批人');
    }

    const instance = await this.instanceRepo.findOne({ where: { id: task.instanceId } });
    if (!instance) {
      throw new BadRequestException('流程实例不存在');
    }

    const signTask = this.taskRepo.create({
      instanceId: instance.id,
      nodeId: task.nodeId,
      nodeName: task.nodeName,
      nodeType: task.nodeType,
      assigneeId: dto.signUserId,
      candidateIds: task.candidateIds,
      status: TaskStatus.PENDING,
      startTime: new Date().toISOString(),
      comment: `加签：${dto.comment || ''}`,
      action: TaskAction.SIGN,
    });

    const savedTask = await this.taskRepo.save(signTask);

    await this.sendApprovalNotification(signTask, instance, { name: task.nodeName });

    return savedTask;
  }

  /**
   * 撤回工作流（发起人撤回）
   */
  async withdrawWorkflow(instanceId: string, userId: string, dto?: WithdrawWorkflowDto): Promise<WorkflowInstance> {
    const instance = await this.instanceRepo.findOne({ where: { id: instanceId } });

    if (!instance) {
      throw new BadRequestException('流程实例不存在');
    }

    if (instance.starterId !== userId) {
      throw new ForbiddenException('您不是该流程的发起人');
    }

    if (instance.status !== InstanceStatus.RUNNING) {
      throw new BadRequestException('只有运行中的流程才能撤回');
    }

    // 取消所有待办任务
    await this.taskRepo.update(
      { instanceId, status: TaskStatus.PENDING },
      { status: TaskStatus.CANCELLED, comment: dto?.comment || '发起人撤回' }
    );

    // 记录撤回历史
    await this.recordHistory(instance, null, {
      nodeId: '',
      nodeName: '撤回',
      operatorId: userId,
      comment: dto?.comment || '发起人撤回流程',
    }, TaskAction.WITHDRAW);

    // 终止流程
    instance.status = InstanceStatus.CANCELLED;
    instance.endTime = new Date().toISOString();
    await this.instanceRepo.save(instance);

    return instance;
  }

  /**
   * 终止工作流（管理员）
   */
  async cancelInstance(instanceId: string, userId: string, dto?: CancelWorkflowDto): Promise<WorkflowInstance> {
    const instance = await this.instanceRepo.findOne({ where: { id: instanceId } });

    if (!instance) {
      throw new BadRequestException('流程实例不存在');
    }

    if (instance.status !== InstanceStatus.RUNNING) {
      throw new BadRequestException('只有运行中的流程才能终止');
    }

    // 取消所有待办任务
    await this.taskRepo.update(
      { instanceId, status: TaskStatus.PENDING },
      { status: TaskStatus.CANCELLED, comment: dto?.reason || '管理员终止' }
    );

    // 记录终止历史
    await this.recordHistory(instance, null, {
      nodeId: '',
      nodeName: '终止',
      operatorId: userId,
      comment: dto?.reason || '管理员终止流程',
    }, TaskAction.CANCEL);

    // 终止流程
    instance.status = InstanceStatus.CANCELLED;
    instance.endTime = new Date().toISOString();
    await this.instanceRepo.save(instance);

    return instance;
  }

  /**
   * 获取流程实例历史记录
   */
  async getInstanceHistory(instanceId: string): Promise<WorkflowHistory[]> {
    return this.historyRepo.find({
      where: { instanceId },
      order: { createTime: 'ASC' },
    });
  }

  /**
   * 获取流程实例的所有任务
   */
  async getInstanceTasks(instanceId: string): Promise<WorkflowTask[]> {
    return this.taskRepo.find({
      where: { instanceId },
      order: { createTime: 'DESC' },
    });
  }

  // ==================== 业务对象配置管理 ====================

  /**
   * 获取业务对象配置列表
   */
  async listBusinessConfigs(businessType?: string): Promise<WorkflowBusinessConfig[]> {
    const where: any = {};
    if (businessType) {
      where.businessType = businessType;
    }
    return this.configRepo.find({ where });
  }

  /**
   * 获取业务对象配置详情
   */
  async getBusinessConfig(businessType: string): Promise<WorkflowBusinessConfig | null> {
    return this.configRepo.findOne({ where: { businessType } });
  }

  /**
   * 创建业务对象配置
   */
  async createBusinessConfig(dto: any): Promise<WorkflowBusinessConfig> {
    const config = this.configRepo.create(dto) as any;
    return await this.configRepo.save(config) as any as WorkflowBusinessConfig;
  }

  /**
   * 保存业务对象配置（框架标准save接口）
   */
  async saveBusinessConfig(dto: any): Promise<any> {
    if (dto.businessType) {
      // 更新
      const config = await this.configRepo.findOne({ where: { businessType: dto.businessType } });
      if (!config) {
        throw new BadRequestException('业务配置不存在');
      }
      Object.assign(config, dto);
      return this.configRepo.save(config);
    } else {
      // 新增
      return this.createBusinessConfig(dto);
    }
  }

  /**
   * 更新业务对象配置
   */
  async updateBusinessConfig(businessType: string, dto: any): Promise<WorkflowBusinessConfig> {
    const config = await this.configRepo.findOne({ where: { businessType } });
    if (!config) {
      throw new BadRequestException('业务配置不存在');
    }
    Object.assign(config, dto);
    return this.configRepo.save(config);
  }

  /**
   * 删除业务对象配置
   */
  async deleteBusinessConfig(businessType: string): Promise<void> {
    const config = await this.configRepo.findOne({ where: { businessType } });
    if (!config) {
      throw new BadRequestException('业务配置不存在');
    }
    await this.configRepo.remove(config);
  }
}
