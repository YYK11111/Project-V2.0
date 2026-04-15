import { IsNotEmpty, MaxLength, IsOptional } from 'class-validator'
import { BaseEntity, BaseColumn, MyEntity } from 'src/common/entity/BaseEntity'
import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm'
import { Project } from '../projects/entity'
import { User } from 'src/modules/users/entities/user.entity'

export enum ChangeStatus {
  draft = '1',
  pending = '2',
  approved = '3',
  rejected = '4',
  implemented = '5',
}

export const changeStatusMap = {
  [ChangeStatus.draft]: '草稿',
  [ChangeStatus.pending]: '待审批',
  [ChangeStatus.approved]: '已批准',
  [ChangeStatus.rejected]: '已驳回',
  [ChangeStatus.implemented]: '已实施',
}

export enum ChangeType {
  scope = '1',
  schedule = '2',
  budget = '3',
  resource = '4',
  requirement = '5',
  other = '6',
}

export const changeTypeMap = {
  [ChangeType.scope]: '范围变更',
  [ChangeType.schedule]: '进度变更',
  [ChangeType.budget]: '预算变更',
  [ChangeType.resource]: '资源变更',
  [ChangeType.requirement]: '需求变更',
  [ChangeType.other]: '其他变更',
}

export enum ChangeImpact {
  low = '1',
  medium = '2',
  high = '3',
}

export const changeImpactMap = {
  [ChangeImpact.low]: '低',
  [ChangeImpact.medium]: '中',
  [ChangeImpact.high]: '高',
}

@MyEntity('change')
export class ProjectChange extends BaseEntity {
  constructor(obj = {}) {
    super()
    this.assignOwn(obj)
  }

  @BaseColumn({ length: 200 })
  @IsNotEmpty({ message: '变更标题不能为空' })
  @MaxLength(200)
  title: string

  @BaseColumn({ nullable: true, name: 'project_id', comment: '所属项目ID' })
  projectId: string

  @ManyToOne(() => Project)
  @JoinColumn({ name: 'project_id' })
  project: Project

  @BaseColumn({ type: 'char', length: 1, default: ChangeType.other, name: 'type', comment: '变更类型' })
  type: ChangeType

  @BaseColumn({ type: 'char', length: 1, default: ChangeImpact.medium, name: 'impact', comment: '影响程度' })
  impact: ChangeImpact

  @BaseColumn({ type: 'char', length: 1, default: ChangeStatus.draft, name: 'status', comment: '变更状态' })
  status: ChangeStatus

  @BaseColumn({ type: 'text', nullable: true, comment: '变更描述' })
  description: string

  @BaseColumn({ type: 'text', nullable: true, comment: '变更原因' })
  reason: string

  @BaseColumn({ type: 'text', nullable: true, comment: '变更影响分析' })
  impactAnalysis: string

  @BaseColumn({ type: 'json', nullable: true, comment: '相关附件' })
  attachments: string[]

  @BaseColumn({ type: 'decimal', precision: 15, scale: 2, default: 0, name: 'cost_impact', comment: '成本影响' })
  costImpact: number

  @BaseColumn({ type: 'int', default: 0, name: 'schedule_impact', comment: '进度影响（天）' })
  scheduleImpact: number

  @Column({ type: 'varchar', nullable: true, name: 'requester_id', comment: '申请人ID' })
  requesterId: string

  @ManyToOne(() => User)
  @JoinColumn({ name: 'requester_id' })
  requester: User

  @Column({ type: 'varchar', nullable: true, name: 'approver_id', comment: '审批人ID' })
  approverId: string

  @ManyToOne(() => User)
  @JoinColumn({ name: 'approver_id' })
  approver: User

  @BaseColumn({ type: 'text', nullable: true, comment: '审批意见' })
  approvalComment: string

  @BaseColumn({
    type: 'datetime',
    transformer: {
      from: (date) => date && new Date(date).toISOString().split('T')[0],
      to: (value: string) => value,
    },
    nullable: true,
    name: 'approval_date',
    comment: '审批日期',
  })
  approvalDate: string

  @BaseColumn({ type: 'int', default: 0, comment: '排序' })
  sort: number

  @BaseColumn({ type: 'varchar', length: 100, nullable: true, comment: '工作流实例ID' })
  workflowInstanceId: string

  @BaseColumn({ type: 'char', length: 1, default: '0', comment: '审批状态: 0无需审批 1审批中 2已通过 3已驳回' })
  approvalStatus: string

  @BaseColumn({ type: 'varchar', length: 100, nullable: true, comment: '当前审批节点名称' })
  currentNodeName: string
}
