import { IsNotEmpty, MaxLength, IsOptional } from 'class-validator'
import { BaseEntity, BaseColumn, MyEntity, DbUnique } from 'src/common/entity/BaseEntity'
import { JoinColumn, ManyToOne } from 'typeorm'
import { Customer } from '../customers/entity'
import { User } from 'src/modules/users/entities/user.entity'

// 合同状态字典
export const contractStatusMap = {
  '1': '执行中',
  '2': '已到期',
  '3': '已终止',
  '4': '已归档',
}

@MyEntity('crm_contract')
export class Contract extends BaseEntity {
  constructor(obj = {}) {
    super()
    this.assignOwn(obj)
  }

  // 合同基本信息
  @DbUnique
  @BaseColumn({ length: 100, comment: '合同名称' })
  @IsNotEmpty({ message: '合同名称不能为空' })
  @MaxLength(100)
  name: string

  @BaseColumn({ length: 50, comment: '合同编号' })
  code: string

  // 关联信息
  @BaseColumn({ length: 36, comment: '客户ID' })
  @IsNotEmpty({ message: '客户ID不能为空' })
  customerId: string

  @ManyToOne(() => Customer)
  @JoinColumn({ name: 'customer_id' })
  customer: Customer

  @BaseColumn({ length: 36, nullable: true, comment: '关联机会ID' })
  opportunityId: string

  @BaseColumn({ length: 36, nullable: true, comment: '关联项目ID' })
  projectId: string

  // 合同金额
  @BaseColumn({ type: 'decimal', precision: 14, scale: 2, comment: '合同金额(元)' })
  amount: string

  @BaseColumn({ type: 'decimal', precision: 14, scale: 2, nullable: true, comment: '已收款金额(元)' })
  receivedAmount: string

  // 合同时间
  @BaseColumn({
    type: 'datetime',
    nullable: true,
    comment: '签订时间',
  })
  signingDate: string

  @BaseColumn({
    type: 'datetime',
    nullable: true,
    comment: '开始时间',
  })
  startDate: string

  @BaseColumn({
    type: 'datetime',
    nullable: true,
    comment: '结束时间',
  })
  endDate: string

  // 合同状态
  @BaseColumn({ type: 'char', length: 1, default: '1', comment: '合同状态:1执行中 2已到期 3已终止 4已归档' })
  @IsOptional()
  status: string

  // 负责人
  @BaseColumn({ length: 36, comment: '合同负责人ID' })
  @IsNotEmpty({ message: '合同负责人ID不能为空' })
  ownerId: string

  @ManyToOne(() => User)
  @JoinColumn({ name: 'owner_id' })
  owner: User

  // 合同文件
  @BaseColumn({ length: 255, nullable: true, comment: '合同文件路径' })
  contractFile: string

  // 备注
  @BaseColumn({ type: 'text', nullable: true, comment: '备注' })
  remark: string
}
