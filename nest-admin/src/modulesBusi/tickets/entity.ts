import { IsNotEmpty, MaxLength, IsOptional } from 'class-validator'
import { BaseEntity, BaseColumn, MyEntity } from 'src/common/entity/BaseEntity'
import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm'
import { User } from 'src/modules/users/entities/user.entity'
import { Project } from '../projects/entity'
import { Task } from '../tasks/entity'

// 工单类型枚举
export enum TicketType {
  bug = '1',
  requirement = '2',
  feedback = '3',
}

export const ticketTypeMap = {
  [TicketType.bug]: '缺陷',
  [TicketType.requirement]: '需求',
  [TicketType.feedback]: '反馈',
}

// 工单状态枚举
export enum TicketStatus {
  pending = '1',
  inProgress = '2',
  resolved = '3',
  closed = '4',
}

export const ticketStatusMap = {
  [TicketStatus.pending]: '待处理',
  [TicketStatus.inProgress]: '处理中',
  [TicketStatus.resolved]: '已解决',
  [TicketStatus.closed]: '已关闭',
}

// 严重程度枚举
export enum TicketSeverity {
  critical = '1', // 致命
  high = '2',     // 高
  medium = '3',  // 中
  low = '4',      // 低
}

export const ticketSeverityMap = {
  [TicketSeverity.critical]: '致命',
  [TicketSeverity.high]: '高',
  [TicketSeverity.medium]: '中',
  [TicketSeverity.low]: '低',
}

// 根因分类枚举
export enum RootCauseCategory {
  code_defect = '1',       // 代码缺陷
  design_issue = '2',      // 设计问题
  requirement_gap = '3',   // 需求遗漏
  test_gap = '4',          // 测试不足
  environment = '5',       // 环境问题
  other = '6',             // 其他
}

export const rootCauseCategoryMap = {
  [RootCauseCategory.code_defect]: '代码缺陷',
  [RootCauseCategory.design_issue]: '设计问题',
  [RootCauseCategory.requirement_gap]: '需求遗漏',
  [RootCauseCategory.test_gap]: '测试不足',
  [RootCauseCategory.environment]: '环境问题',
  [RootCauseCategory.other]: '其他',
}

@MyEntity('ticket')
export class Ticket extends BaseEntity {
  constructor(obj = {}) {
    super()
    this.assignOwn(obj)
  }

  @BaseColumn({ nullable: true, name: 'project_id', comment: '所属项目ID' })
  projectId: string

  @ManyToOne(() => Project)
  @JoinColumn({ name: 'project_id' })
  project: Project

  @BaseColumn({ nullable: true, name: 'task_id', comment: '所属任务ID' })
  taskId: string

  @ManyToOne(() => Task)
  @JoinColumn({ name: 'task_id' })
  task: Task

  @BaseColumn({ length: 100 })
  @IsNotEmpty({ message: '工单标题不能为空' })
  @MaxLength(100)
  title: string

  @BaseColumn({ type: 'char', length: 1, default: TicketType.bug, name: 'type', comment: '工单类型' })
  type: TicketType

  @BaseColumn({ nullable: true, name: 'submitter_id', comment: '提交人ID' })
  submitterId: string

  @ManyToOne(() => User)
  @JoinColumn({ name: 'submitter_id' })
  submitter: User

  @BaseColumn({ nullable: true, name: 'handler_id', comment: '处理人ID' })
  handlerId: string

  @ManyToOne(() => User)
  @JoinColumn({ name: 'handler_id' })
  handler: User

  @BaseColumn({ type: 'char', length: 1, default: TicketStatus.pending, name: 'status', comment: '工单状态' })
  status: TicketStatus

  @BaseColumn({ type: 'text', comment: '工单内容' })
  content: string

  @BaseColumn({ type: 'json', nullable: true, comment: '工单附件' })
  attachments: string[]

  @BaseColumn({ type: 'text', nullable: true, comment: '解决方案' })
  solution: string

  // ==================== P0 扩展字段 ====================

  @BaseColumn({ type: 'char', length: 1, default: TicketSeverity.medium, comment: '严重程度' })
  severity: TicketSeverity

  @BaseColumn({ type: 'text', nullable: true, comment: '重现步骤' })
  stepsToReproduce: string

  @BaseColumn({ type: 'text', nullable: true, comment: '期望结果' })
  expectedResult: string

  @BaseColumn({ type: 'text', nullable: true, comment: '实际结果' })
  actualResult: string

  @BaseColumn({ type: 'varchar', length: 200, nullable: true, comment: '环境信息' })
  environment: string

  @BaseColumn({ type: 'text', nullable: true, comment: '根因分析' })
  rootCause: string

  @BaseColumn({ type: 'char', length: 1, nullable: true, comment: '根因分类' })
  rootCauseCategory: RootCauseCategory

  @BaseColumn({ type: 'text', nullable: true, comment: '解决方案详细描述' })
  resolution: string

  @BaseColumn({ type: 'varchar', length: 50, nullable: true, comment: '发现版本' })
  foundInVersion: string

  @BaseColumn({ type: 'varchar', length: 50, nullable: true, comment: '修复版本' })
  fixedInVersion: string

  @BaseColumn({ type: 'int', default: 0, comment: '重新打开次数' })
  reopenedCount: number

  @BaseColumn({ type: 'varchar', length: 100, nullable: true, comment: '工作流实例ID' })
  workflowInstanceId: string

  @BaseColumn({ type: 'char', length: 1, default: '0', comment: '审批状态: 0无需审批 1审批中 2已通过 3已拒绝' })
  approvalStatus: string

  @BaseColumn({ type: 'varchar', length: 100, nullable: true, comment: '当前审批节点名称' })
  currentNodeName: string
}
