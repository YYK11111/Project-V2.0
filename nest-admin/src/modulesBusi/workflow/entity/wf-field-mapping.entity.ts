import { BaseEntity, BaseColumn } from 'src/common/entity/BaseEntity'
import { Entity, Column } from 'typeorm'

@Entity('wf_field_mapping')
export class WfFieldMapping extends BaseEntity {
  @BaseColumn({ length: 50, name: 'business_type', comment: '业务类型' })
  businessType: string

  @BaseColumn({ length: 100, name: 'field_name', comment: '字段名称' })
  fieldName: string

  @BaseColumn({ length: 200, name: 'field_label', comment: '字段显示名称' })
  fieldLabel: string

  @BaseColumn({ length: 100, name: 'resolve_field', comment: '解析字段(数据库列名)' })
  resolveField: string

  @BaseColumn({ length: 50, name: 'resolve_type', comment: '解析类型: userId, userIds, deptId' })
  resolveType: string

  @BaseColumn({ length: 200, nullable: true, name: 'relation_path', comment: '关联路径(可选)' })
  relationPath: string

  @BaseColumn({ type: 'text', nullable: true, comment: '描述' })
  description: string

  @BaseColumn({ type: 'boolean', default: true, name: 'enabled', comment: '是否启用' })
  enabled: boolean
}