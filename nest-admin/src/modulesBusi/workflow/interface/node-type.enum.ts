/**
 * 工作流节点类型枚举
 */
export enum NodeType {
  /** 开始节点 */
  START = 'start',
  /** 结束节点 */
  END = 'end',
  /** 审批节点 */
  APPROVAL = 'approval',
  /** 条件节点 */
  CONDITION = 'condition',
  /** 通知节点 */
  NOTIFICATION = 'notification',
  /** 抄送节点 */
  CC = 'cc',
  /** 延时节点 */
  DELAY = 'delay',
  /** 表单节点 */
  FORM = 'form',
}

/**
 * 审批人类型
 */
export enum AssigneeType {
  /** 指定用户 */
  USER = 'user',
  /** 指定部门 */
  DEPARTMENT = 'department',
  /** 业务字段 */
  BUSINESS_FIELD = 'business_field',
}

/**
 * 会签类型
 */
export enum MultiInstanceType {
  /** 顺序会签 */
  SEQUENTIAL = 'sequential',
  /** 并行会签 */
  PARALLEL = 'parallel',
}

/**
 * 审批方式
 */
export enum AssigneeMode {
  /** 单人审批 */
  SINGLE = 'single',
  /** 串行审批（依次审批） */
  SEQUENTIAL = 'sequential',
  /** 并行审批（任一人审批） */
  PARALLEL = 'parallel',
  /** 会签审批（全部通过） */
  ALL = 'all',
}

/**
 * 审批人字段为空时的处理方式
 */
export enum AssigneeEmptyAction {
  /** 报错终止 */
  ERROR = 'error',
  /** 跳过该节点 */
  SKIP = 'skip',
  /** 指定备用审批人 */
  ASSIGN_TO = 'assign_to',
}

/**
 * 会签完成条件
 */
export enum CompleteType {
  /** 全部通过 */
  ALL = 'all',
  /** 一人通过即可 */
  ONE = 'one',
  /** 按比例 */
  RATIO = 'ratio',
}

/**
 * 条件操作符
 */
export enum ConditionOperator {
  EQ = 'eq',           // 等于
  NEQ = 'neq',         // 不等于
  GT = 'gt',           // 大于
  GTE = 'gte',         // 大于等于
  LT = 'lt',           // 小于
  LTE = 'lte',         // 小于等于
  IN = 'in',           // 包含
  CONTAINS = 'contains', // 包含字符串
}

/**
 * 流程实例状态
 */
export enum InstanceStatus {
  /** 进行中 */
  RUNNING = '1',
  /** 已完成 */
  COMPLETED = '2',
  /** 已取消 */
  CANCELLED = '3',
  /** 已挂起 */
  SUSPENDED = '4',
}

/**
 * 流程任务状态
 */
export enum TaskStatus {
  /** 待处理 */
  PENDING = '1',
  /** 处理中 */
  PROCESSING = '2',
  /** 已完成 */
  COMPLETED = '3',
  /** 已取消 */
  CANCELLED = '4',
}

/**
 * 任务操作类型
 */
export enum TaskAction {
  /** 同意 */
  APPROVE = '1',
  /** 拒绝 */
  REJECT = '2',
  /** 撤回 */
  WITHDRAW = '3',
  /** 转交 */
  TRANSFER = '4',
  /** 加签 */
  SIGN = '5',
  /** 终止 */
  CANCEL = '6',
}
