import { IsNotEmpty, MaxLength, IsOptional } from 'class-validator'
import { BaseEntity, BaseColumn, MyEntity, DbUnique } from 'src/common/entity/BaseEntity'
import { Entity, JoinColumn, ManyToOne } from 'typeorm'
import { User } from 'src/modules/users/entities/user.entity'

// 客户类型字典
export const customerTypeMap = {
  '1': '企业客户',
  '2': '个人客户',
}

// 客户等级字典
export const customerLevelMap = {
  '1': 'VIP',
  '2': '重要',
  '3': '普通',
}

// 客户状态字典
export const customerStatusMap = {
  '1': '潜在',
  '2': '意向',
  '3': '成交',
  '4': '流失',
}

@MyEntity('crm_customer')
export class Customer extends BaseEntity {
  constructor(obj = {}) {
    super()
    this.assignOwn(obj)
  }

  // 客户基本信息
  @DbUnique
  @BaseColumn({ length: 100, comment: '客户名称' })
  @IsNotEmpty({ message: '客户名称不能为空' })
  @MaxLength(100)
  name: string

  @BaseColumn({ length: 50, nullable: true, comment: '客户简称' })
  shortName: string

  @BaseColumn({ length: 50, nullable: true, comment: '客户编号' })
  code: string

  // 客户类型
  @BaseColumn({ type: 'char', length: 1, default: '1', comment: '客户类型:1企业客户 2个人客户' })
  @IsOptional()
  type: string

  // 基本信息
  @BaseColumn({ length: 18, nullable: true, comment: '统一社会信用代码' })
  unifiedSocialCreditCode: string

  @BaseColumn({ length: 100, nullable: true, comment: '所属行业' })
  industry: string

  @BaseColumn({ length: 50, nullable: true, comment: '企业规模' })
  scale: string

  @BaseColumn({ length: 200, nullable: true, comment: '企业地址' })
  address: string

  // 联系信息
  @BaseColumn({ length: 20, nullable: true, comment: '联系人' })
  contactPerson: string

  @BaseColumn({ length: 20, nullable: true, comment: '联系电话' })
  contactPhone: string

  @BaseColumn({ length: 100, nullable: true, comment: '联系邮箱' })
  contactEmail: string

  // 客户等级
  @BaseColumn({ type: 'char', length: 1, default: '2', comment: '客户等级:1 VIP 2重要 3普通' })
  @IsOptional()
  level: string

  // 客户状态
  @BaseColumn({ type: 'char', length: 1, default: '1', comment: '客户状态:1潜在 2意向 3成交 4流失' })
  @IsOptional()
  status: string

  // 归属信息
  @BaseColumn({ type: 'bigint', nullable: true, name: 'sales_id', comment: '销售负责人ID' })
  salesId: string

  @ManyToOne(() => User)
  @JoinColumn({ name: 'sales_id' })
  sales: User

  @BaseColumn({ length: 36, nullable: true, comment: '所属部门ID' })
  deptId: string

  // 其他信息
  @BaseColumn({ type: 'text', nullable: true, comment: '客户描述' })
  description: string

  @BaseColumn({ type: 'json', nullable: true, comment: '扩展信息' })
  extraInfo: any

  @BaseColumn({ type: 'decimal', precision: 14, scale: 2, nullable: true, comment: '客户价值(万元)' })
  customerValue: string

  @BaseColumn({ type: 'varchar', length: 100, nullable: true, comment: '工作流实例ID' })
  workflowInstanceId: string

  @BaseColumn({ type: 'char', length: 1, default: '0', comment: '审批状态: 0无需审批 1审批中 2已通过 3已驳回' })
  approvalStatus: string

  @BaseColumn({ type: 'varchar', length: 100, nullable: true, comment: '当前审批节点名称' })
  currentNodeName: string
}
