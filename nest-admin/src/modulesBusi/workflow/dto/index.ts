import { IsNotEmpty, IsOptional, MaxLength } from 'class-validator';
import { NodeConfig, FlowConfig, WorkflowDefinitionConfig } from '../interface/node.interface';

/**
 * 创建工作流定义DTO
 */
export class CreateWorkflowDefinitionDto implements WorkflowDefinitionConfig {
  @IsNotEmpty({ message: '流程名称不能为空' })
  @MaxLength(100)
  name: string;

  @IsNotEmpty({ message: '流程编码不能为空' })
  @MaxLength(50)
  code: string;

  @IsOptional()
  @MaxLength(200)
  description?: string;

  @IsOptional()
  version?: number;

  @IsOptional()
  @MaxLength(50)
  category?: string;

  @IsOptional()
  @MaxLength(50)
  businessType?: string;

  @IsOptional()
  @MaxLength(50)
  businessScene?: string;

  @IsOptional()
  @MaxLength(50)
  triggerEvent?: string;

  @IsOptional()
  statusTriggerValues?: string[];

  @IsNotEmpty({ message: '节点配置不能为空' })
  nodes: NodeConfig[];

  @IsNotEmpty({ message: '连接线配置不能为空' })
  flows: FlowConfig[];

  @IsOptional()
  globalConfig?: any;
}

/**
 * 更新工作流定义DTO
 */
export class UpdateWorkflowDefinitionDto {
  @IsOptional()
  @MaxLength(100)
  name?: string;

  @IsOptional()
  @MaxLength(200)
  description?: string;

  @IsOptional()
  category?: string;

  @IsOptional()
  @MaxLength(50)
  businessType?: string;

  @IsOptional()
  @MaxLength(50)
  businessScene?: string;

  @IsOptional()
  @MaxLength(50)
  triggerEvent?: string;

  @IsOptional()
  statusTriggerValues?: string[];

  @IsOptional()
  nodes?: NodeConfig[];

  @IsOptional()
  flows?: FlowConfig[];

  @IsOptional()
  globalConfig?: any;

  @IsOptional()
  isActive?: string;
}

/**
 * 启动工作流DTO
 */
export class StartWorkflowDto {
  @IsOptional()
  code: string;

  @IsOptional()
  businessType?: string;

  @IsOptional()
  businessScene?: string;

  @IsNotEmpty({ message: '业务数据ID不能为空' })
  businessKey: string;

  @IsOptional()
  variables?: Record<string, any>;
}

/**
 * 完成任务DTO
 */
export class CompleteTaskDto {
  @IsNotEmpty({ message: '审批动作不能为空' })
  action: 'approve' | 'reject';

  @IsOptional()
  comment?: string;

  @IsOptional()
  variables?: Record<string, any>;

  @IsOptional()
  targetNodeId?: string;
}

/**
 * 加签任务DTO
 */
export class AddSignTaskDto {
  @IsNotEmpty({ message: '加签用户ID不能为空' })
  signUserId: string;

  @IsOptional()
  comment?: string;
}

/**
 * 撤回工作流DTO
 */
export class WithdrawWorkflowDto {
  @IsOptional()
  comment?: string;
}

/**
 * 终止工作流DTO
 */
export class CancelWorkflowDto {
  @IsOptional()
  reason?: string;
}

/**
 * 发起人结束退回实例DTO
 */
export class CloseReturnedWorkflowDto {
  @IsOptional()
  reason?: string;
}

/**
 * 重新提交退回实例DTO
 */
export class ResubmitReturnedWorkflowDto {
  @IsOptional()
  comment?: string;
}

/**
 * 转交任务DTO
 */
export class TransferTaskDto {
  @IsNotEmpty({ message: '目标用户ID不能为空' })
  targetUserId: string;

  @IsOptional()
  comment?: string;
}

/**
 * 查询工作流实例DTO
 */
export class QueryWorkflowInstanceDto {
  @IsOptional()
  definitionCode?: string;

  @IsOptional()
  businessKey?: string;

  @IsOptional()
  status?: string;

  @IsOptional()
  starterId?: string;

  @IsOptional()
  startDate?: string;

  @IsOptional()
  endDate?: string;
}
