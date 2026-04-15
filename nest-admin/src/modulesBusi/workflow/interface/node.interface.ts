import { NodeType, ConditionOperator, AssigneeType, MultiInstanceType, CompleteType, AssigneeMode, AssigneeEmptyAction } from './node-type.enum';

// 重新导出枚举类型，方便其他模块使用
export { NodeType, ConditionOperator, AssigneeType, MultiInstanceType, CompleteType, AssigneeMode, AssigneeEmptyAction };

/**
 * 条件配置
 */
export interface Condition {
  /** 条件ID */
  id: string;
  /** 条件名称 */
  name?: string;
  /** 字段表达式，如 ${variables.amount} 或 ${initiator} */
  field: string;
  /** 操作符 */
  operator: ConditionOperator;
  /** 比较值 */
  value: any;
  /** 优先级，数字越小优先级越高 */
  priority?: number;
}

/**
 * 连接线配置
 */
export interface FlowConfig {
  /** 连接线ID */
  id: string;
  /** 源节点ID */
  sourceNodeId: string;
  /** 目标节点ID */
  targetNodeId: string;
  /** 连线类型 */
  flowType?: 'normal' | 'condition' | 'default';
  /** 绑定条件ID */
  conditionId?: string;
  /** 连接线标签 */
  label?: string;
}

/**
 * 节点属性 - 基础属性
 */
export interface BaseNodeProperties {
  /** 超时时间(毫秒) */
  timeout?: number;
  /** 超时动作 */
  timeoutAction?: 'autoApprove' | 'autoReject' | 'notify';
}

/**
 * 审批节点属性
 */
export interface ApprovalNodeProperties extends BaseNodeProperties {
  /** 审批人类型 */
  assigneeType?: AssigneeType;
  /** 审批人ID(当type为user时) */
  assigneeValue?: string;
  /** 审批部门ID(当type为department时) */
  departmentId?: string;
  /** 固定部门取人模式 */
  departmentMode?: 'leader' | 'members';
  /** 业务字段映射的字段名(当type为business_field时) */
  fieldPath?: string;
  /** 业务对象类型(当type为business_field时)，如 project */
  businessType?: string;
  /** 是否会签 */
  multiInstance?: boolean;
  /** 会签方式 */
  multiInstanceType?: MultiInstanceType;
  /** 完成条件 */
  completeType?: CompleteType;
  /** 完成比例(0-100)，当completeType为ratio时有效 */
  completeRatio?: number;
  /** 允许驳回 */
  allowRollback?: boolean;
  /** 审批方式：单人、串行、并行、会签 */
  assigneeMode?: AssigneeMode;
  /** 审批人字段为空时的处理方式 */
  assigneeEmptyAction?: AssigneeEmptyAction;
  /** 审批人字段为空时的备用审批人ID */
  assigneeEmptyFallbackUserId?: string;
  /** 审批人字段为空时的备用审批字段 */
  assigneeEmptyFallbackFieldPath?: string;
}

/**
 * 条件节点属性
 */
export interface ConditionNodeProperties extends BaseNodeProperties {
  /** 条件列表 */
  conditions?: Condition[];
}

/**
 * 通知节点属性
 */
export interface NotificationNodeProperties extends ApprovalNodeProperties {
  /** 通知类型 */
  notificationType?: 'email' | 'sms' | 'system' | 'wechat';
  /** 通知模板（标题） */
  notificationTemplate?: string;
  /** 通知内容 */
  notificationContent?: string;
  /** 通知接收人 */
  notificationReceivers?: string;
  /** 动态接收人表达式 */
  notificationReceiverExpr?: string;
}

/**
 * 抄送节点属性
 */
export interface CcNodeProperties extends ApprovalNodeProperties {}

/**
 * 延时节点属性
 */
export interface DelayNodeProperties extends BaseNodeProperties {
  /** 延时类型 */
  delayType?: 'fixed' | 'variable';
  /** 延时值(毫秒) */
  delayValue?: number;
  /** 延时变量名 */
  delayVariable?: string;
}

/**
 * 表单节点属性
 */
export interface FormNodeProperties extends BaseNodeProperties {
  /** 表单ID */
  formId?: string;
  /** 表单字段配置 */
  formFields?: FormField[];
  /** 表单数据存储变量名 */
  formDataVariable?: string;
}

/**
 * 表单字段
 */
export interface FormField {
  /** 字段ID */
  id: string;
  /** 字段名称 */
  name: string;
  /** 字段类型 */
  type: 'text' | 'number' | 'date' | 'select' | 'textarea';
  /** 是否必填 */
  required?: boolean;
  /** 默认值 */
  defaultValue?: any;
  /** 选项(当type为select时) */
  options?: { label: string; value: any }[];
}

/**
 * 节点配置
 */
export interface NodeConfig {
  /** 节点ID */
  id: string;
  /** 节点名称 */
  name: string;
  /** 节点类型 */
  type: NodeType;
  /** 设计器中的X坐标 */
  x?: number;
  /** 设计器中的Y坐标 */
  y?: number;
  /** 节点属性 */
  properties: ApprovalNodeProperties | ConditionNodeProperties | NotificationNodeProperties | CcNodeProperties | DelayNodeProperties | FormNodeProperties | BaseNodeProperties;
}

/**
 * 流程定义配置
 */
export interface WorkflowDefinitionConfig {
  /** 流程名称 */
  name: string;
  /** 流程编码 */
  code: string;
  /** 版本号 */
  version?: number;
  /** 流程描述 */
  description?: string;
  /** 流程分类 */
  category?: string;
  /** 业务对象类型 */
  businessType?: string;
  /** 触发事件 */
  triggerEvent?: string;
  /** 状态触发值 */
  statusTriggerValues?: string[];
  /** 节点列表 */
  nodes: NodeConfig[];
  /** 连接线列表 */
  flows: FlowConfig[];
  /** 全局配置 */
  globalConfig?: any;
}

/**
 * 节点执行上下文
 */
export interface NodeExecutionContext {
  /** 流程实例ID */
  instanceId: string;
  /** 当前节点ID */
  nodeId: string;
  /** 流程变量 */
  variables: Record<string, any>;
  /** 操作人ID */
  operatorId?: string;
  /** 输入数据 */
  inputData?: any;
  /** 开始时间 */
  startTime: Date;
}

/**
 * 节点执行结果
 */
export interface NodeResult {
  /** 是否成功 */
  success: boolean;
  /** 输出数据 */
  outputData?: any;
  /** 下一个节点ID列表 */
  nextNodeIds?: string[];
  /** 错误信息 */
  error?: string;
}
