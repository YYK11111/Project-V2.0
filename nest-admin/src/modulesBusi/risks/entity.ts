import { IsNotEmpty, MaxLength, IsOptional } from 'class-validator'
import { BaseEntity, BaseColumn, MyEntity } from 'src/common/entity/BaseEntity'
import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm'
import { Project } from '../projects/entity'
import { User } from 'src/modules/users/entities/user.entity'

export enum RiskStatus {
  identified = '1',
  assessing = '2',
  mitigating = '3',
  resolved = '4',
  closed = '5',
}

export const riskStatusMap = {
  [RiskStatus.identified]: '已识别',
  [RiskStatus.assessing]: '评估中',
  [RiskStatus.mitigating]: '处理中',
  [RiskStatus.resolved]: '已解决',
  [RiskStatus.closed]: '已关闭',
}

export enum RiskLevel {
  low = '1',
  medium = '2',
  high = '3',
  critical = '4',
}

export const riskLevelMap = {
  [RiskLevel.low]: '低',
  [RiskLevel.medium]: '中',
  [RiskLevel.high]: '高',
  [RiskLevel.critical]: '严重',
}

export enum RiskCategory {
  schedule = '1',
  budget = '2',
  resource = '3',
  technical = '4',
  requirement = '5',
  quality = '6',
  external = '7',
  other = '8',
}

export const riskCategoryMap = {
  [RiskCategory.schedule]: '进度风险',
  [RiskCategory.budget]: '预算风险',
  [RiskCategory.resource]: '资源风险',
  [RiskCategory.technical]: '技术风险',
  [RiskCategory.requirement]: '需求风险',
  [RiskCategory.quality]: '质量风险',
  [RiskCategory.external]: '外部风险',
  [RiskCategory.other]: '其他',
}

@MyEntity('risk')
export class Risk extends BaseEntity {
  constructor(obj = {}) {
    super()
    this.assignOwn(obj)
  }

  @BaseColumn({ length: 200 })
  @IsNotEmpty({ message: '风险名称不能为空' })
  @MaxLength(200)
  name: string

  @BaseColumn({ nullable: true, name: 'project_id', comment: '所属项目ID' })
  projectId: string

  @ManyToOne(() => Project)
  @JoinColumn({ name: 'project_id' })
  project: Project

  @BaseColumn({ type: 'char', length: 1, default: RiskCategory.other, name: 'category', comment: '风险分类' })
  category: RiskCategory

  @BaseColumn({ type: 'char', length: 1, default: RiskLevel.medium, name: 'level', comment: '风险等级' })
  level: RiskLevel

  @BaseColumn({ type: 'char', length: 1, default: RiskStatus.identified, name: 'status', comment: '风险状态' })
  status: RiskStatus

  @BaseColumn({ type: 'text', nullable: true, comment: '风险描述' })
  description: string

  @BaseColumn({ type: 'text', nullable: true, comment: '风险应对措施' })
  mitigation: string

  @BaseColumn({ type: 'decimal', precision: 5, scale: 2, default: 0, name: 'impact_estimate', comment: '影响程度(%)' })
  impactEstimate: number

  @Column({ type: 'varchar', nullable: true, name: 'risk_owner_id', comment: '责任人ID' })
  riskOwnerId: string

  @ManyToOne(() => User)
  @JoinColumn({ name: 'risk_owner_id' })
  riskOwner: User

  @BaseColumn({
    type: 'datetime',
    transformer: {
      from: (date) => date && new Date(date).toISOString().split('T')[0],
      to: (value: string) => value,
    },
    nullable: true,
    name: 'identified_date',
    comment: '识别日期',
  })
  identifiedDate: string

  @BaseColumn({
    type: 'datetime',
    transformer: {
      from: (date) => date && new Date(date).toISOString().split('T')[0],
      to: (value: string) => value,
    },
    nullable: true,
    name: 'due_date',
    comment: '计划解决日期',
  })
  dueDate: string

  @BaseColumn({
    type: 'datetime',
    transformer: {
      from: (date) => date && new Date(date).toISOString().split('T')[0],
      to: (value: string) => value,
    },
    nullable: true,
    name: 'resolved_date',
    comment: '实际解决日期',
  })
  resolvedDate: string

  @BaseColumn({ type: 'int', default: 0, comment: '排序' })
  sort: number
}