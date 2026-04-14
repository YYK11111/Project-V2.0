import { IsNotEmpty, MaxLength, IsOptional, IsInt, Min, Max } from 'class-validator'
import { BaseEntity, BaseColumn, MyEntity, DbUnique } from 'src/common/entity/BaseEntity'
import { Column, Entity, JoinColumn, ManyToOne, OneToMany } from 'typeorm'
import { User } from 'src/modules/users/entities/user.entity'
import { Customer } from '../crm/customers/entity'

// 项目状态枚举
export enum ProjectStatus {
  draft = '1',
  approvalPending = '2',
  executing = '3',
  paused = '4',
  closeApprovalPending = '5',
  completed = '6',
  cancelled = '7',
}

export const projectStatusMap = {
  [ProjectStatus.draft]: '草稿',
  [ProjectStatus.approvalPending]: '立项审批中',
  [ProjectStatus.executing]: '执行中',
  [ProjectStatus.paused]: '暂停中',
  [ProjectStatus.closeApprovalPending]: '结项审批中',
  [ProjectStatus.completed]: '已结项',
  [ProjectStatus.cancelled]: '已取消',
}

export enum ProjectType {
  implementation = '1',
  customDevelopment = '2',
  operations = '3',
}

export const projectTypeMap = {
  [ProjectType.implementation]: '实施类项目',
  [ProjectType.customDevelopment]: '定制开发类项目',
  [ProjectType.operations]: '运维类项目',
}

// 优先级枚举
export enum Priority {
  low = '1',
  medium = '2',
  high = '3',
}

export const priorityMap = {
  [Priority.low]: '低',
  [Priority.medium]: '中',
  [Priority.high]: '高',
}

@MyEntity('project')
export class Project extends BaseEntity {
  constructor(obj = {}) {
    super()
    this.assignOwn(obj)
  }

  @DbUnique
  @BaseColumn({ length: 100 })
  @IsNotEmpty({ message: '项目名称不能为空' })
  @MaxLength(100)
  name: string

  @DbUnique
  @BaseColumn({ length: 50, nullable: true, comment: '项目编号' })
  code: string

  @BaseColumn({ nullable: true, name: 'leader_id', comment: '项目负责人ID' })
  leaderId: string

  @ManyToOne(() => User)
  @JoinColumn({ name: 'leader_id' })
  leader: User

  @BaseColumn({
    type: 'datetime',
    transformer: {
      from: (date) => date && new Date(date).toISOString().split('T')[0],
      to: (value: string) => value,
    },
    nullable: true,
    name: 'start_date',
    comment: '开始时间',
  })
  startDate: string

  @BaseColumn({
    type: 'datetime',
    transformer: {
      from: (date) => date && new Date(date).toISOString().split('T')[0],
      to: (value: string) => value,
    },
    nullable: true,
    name: 'end_date',
    comment: '结束时间',
  })
  endDate: string

  @BaseColumn({ type: 'char', length: 1, default: ProjectStatus.draft, name: 'status', comment: '项目状态' })
  status: ProjectStatus

  @BaseColumn({ type: 'char', length: 1, default: ProjectType.implementation, name: 'project_type', comment: '项目类型' })
  projectType: ProjectType

  @BaseColumn({ type: 'char', length: 1, default: Priority.medium, name: 'priority', comment: '优先级' })
  priority: Priority

  @BaseColumn({ type: 'text', nullable: true, comment: '项目描述' })
  description: string

  @BaseColumn({ type: 'json', nullable: true, comment: '项目附件' })
  attachments: string[]

  @BaseColumn({ type: 'char', length: 1, default: '0', name: 'is_archived', comment: '是否归档' })
  isArchived: string

  // ==================== P0 扩展字段 ====================

  @BaseColumn({ type: 'decimal', precision: 15, scale: 2, default: 0, comment: '项目预算（元）' })
  budget: number

  @BaseColumn({ type: 'decimal', precision: 15, scale: 2, default: 0, comment: '实际成本（元）' })
  actualCost: number

  @BaseColumn({ type: 'int', nullable: true, comment: '关联客户ID' })
  customerId: number

  @ManyToOne(() => Customer, { nullable: true })
  @JoinColumn({ name: 'customer_id' })
  customer: Customer

  @BaseColumn({ type: 'int', default: 0, comment: '整体进度百分比（0-100）' })
  progress: number

  @BaseColumn({ type: 'varchar', length: 500, nullable: true, comment: '工作流实例ID' })
  workflowInstanceId: string

  @BaseColumn({ type: 'char', length: 1, default: '0', comment: '审批状态: 0无需审批 1审批中 2已通过 3已拒绝' })
  approvalStatus: string

  @BaseColumn({ type: 'varchar', length: 100, nullable: true, comment: '当前审批节点名称' })
  currentNodeName: string
}
