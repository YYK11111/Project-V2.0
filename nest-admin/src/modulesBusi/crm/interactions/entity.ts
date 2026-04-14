import { IsNotEmpty, IsOptional } from 'class-validator'
import { BaseEntity, BaseColumn, MyEntity } from 'src/common/entity/BaseEntity'
import { JoinColumn, ManyToOne } from 'typeorm'
import { Customer } from '../customers/entity'

// 互动类型字典
export const interactionTypeMap = {
  '1': '电话',
  '2': '邮件',
  '3': '拜访',
  '4': '会议',
  '5': '其他',
}

@MyEntity('crm_interaction')
export class CustomerInteraction extends BaseEntity {
  constructor(obj = {}) {
    super()
    this.assignOwn(obj)
  }

  @BaseColumn({ length: 36, comment: '客户ID' })
  @IsNotEmpty({ message: '客户ID不能为空' })
  customerId: string

  @ManyToOne(() => Customer)
  @JoinColumn({ name: 'customer_id' })
  customer: Customer

  // 互动类型
  @BaseColumn({ type: 'char', length: 1, default: '1', comment: '互动类型:1电话 2邮件 3拜访 4会议 5其他' })
  @IsOptional()
  interactionType: string

  // 互动内容
  @BaseColumn({ type: 'text', nullable: true, comment: '互动内容' })
  content: string

  // 互动时间
  @BaseColumn({
    type: 'datetime',
    nullable: true,
    comment: '互动时间',
  })
  interactionTime: string

  // 互动人
  @BaseColumn({ length: 36, nullable: true, comment: '互动人ID' })
  operatorId: string

  @BaseColumn({ length: 100, nullable: true, comment: '互动人名称' })
  operatorName: string

  // 下次跟进时间
  @BaseColumn({
    type: 'datetime',
    nullable: true,
    comment: '下次跟进时间',
  })
  nextFollowTime: string

  // 附件
  @BaseColumn({ type: 'json', nullable: true, comment: '附件列表' })
  attachments: any[]
}
