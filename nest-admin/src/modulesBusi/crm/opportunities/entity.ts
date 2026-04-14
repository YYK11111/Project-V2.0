import { IsNotEmpty, MaxLength, IsOptional } from 'class-validator'
import { BaseEntity, BaseColumn, MyEntity, DbUnique } from 'src/common/entity/BaseEntity'
import { JoinColumn, ManyToOne } from 'typeorm'
import { Customer } from '../customers/entity'
import { User } from 'src/modules/users/entities/user.entity'

// 销售阶段字典
export const opportunityStageMap = {
  '1': '初步接触',
  '2': '需求分析',
  '3': '方案制定',
  '4': '商务谈判',
  '5': '合同签订',
}

@MyEntity('crm_opportunity')
export class SalesOpportunity extends BaseEntity {
  constructor(obj = {}) {
    super()
    this.assignOwn(obj)
  }

  // 基本信息
  @DbUnique
  @BaseColumn({ length: 100, comment: '机会名称' })
  @IsNotEmpty({ message: '机会名称不能为空' })
  @MaxLength(100)
  name: string

  @BaseColumn({ length: 50, comment: '机会编号' })
  code: string

  // 关联客户
  @BaseColumn({ length: 36, comment: '客户ID' })
  @IsNotEmpty({ message: '客户ID不能为空' })
  customerId: string

  @ManyToOne(() => Customer)
  @JoinColumn({ name: 'customer_id' })
  customer: Customer

  // 销售信息
  @BaseColumn({ type: 'decimal', precision: 14, scale: 2, comment: '预期金额(元)' })
  expectedAmount: string

  @BaseColumn({ type: 'char', length: 1, default: '1', comment: '销售阶段:1初步接触 2需求分析 3方案制定 4商务谈判 5合同签订' })
  @IsOptional()
  stage: string

  @BaseColumn({ type: 'int', default: 0, comment: '成功概率(%)' })
  successRate: number

  // 时间信息
  @BaseColumn({
    type: 'datetime',
    nullable: true,
    comment: '预计成交时间',
  })
  expectedCloseDate: string

  @BaseColumn({
    type: 'datetime',
    nullable: true,
    comment: '实际成交时间',
  })
  actualCloseDate: string

  // 负责人
  @BaseColumn({ length: 36, comment: '销售负责人ID' })
  @IsNotEmpty({ message: '销售负责人ID不能为空' })
  salesId: string

  @ManyToOne(() => User)
  @JoinColumn({ name: 'sales_id' })
  sales: User

  // 机会描述
  @BaseColumn({ type: 'text', nullable: true, comment: '机会描述' })
  description: string

  // 失败原因
  @BaseColumn({ type: 'text', nullable: true, comment: '失败原因' })
  lossReason: string

  // 关联项目
  @BaseColumn({ length: 36, nullable: true, comment: '关联项目ID' })
  projectId: string
}
