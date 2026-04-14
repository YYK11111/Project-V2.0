import { Injectable } from '@nestjs/common'
import { WorkflowDataLoaderService } from '../../modulesBusi/workflow/workflow-data-loader.service'

type BusinessFieldOption = {
  id: string
  businessType: string
  fieldName: string
  fieldLabel: string
  description: string
  enabled: boolean
  type: string
  group: string
  order: number
}

type FieldSource = {
  name: string
  label: string
  type: string
  relationEntity?: string
  enumValues?: { label: string; value: any }[]
}

@Injectable()
export class BusinessFieldService {
  constructor(private readonly dataLoaderService: WorkflowDataLoaderService) {}

  async getFieldMappingsForBusinessType(businessType: string): Promise<BusinessFieldOption[]> {
    return this.getFieldOptions(businessType)
  }

  async getAllFieldOptionsForBusinessType(businessType: string): Promise<BusinessFieldOption[]> {
    return this.getFieldOptions(businessType, { includeAll: true })
  }

  async getAllFieldMappings(): Promise<BusinessFieldOption[]> {
    const businessTypes = this.dataLoaderService.getRegisteredTypes()
    const result: BusinessFieldOption[] = []
    for (const businessType of businessTypes) {
      result.push(...(await this.getFieldOptions(businessType)))
    }
    return result
  }

  async generateAndSaveFieldMappings(businessType: string): Promise<number> {
    const fields = this.dataLoaderService.getFieldDefinitions(businessType) || []
    return fields.length
  }

  async updateFieldMapping(_id: number, _data: Record<string, any>): Promise<void> {
    return
  }

  async deleteFieldMapping(_id: number): Promise<void> {
    return
  }

  async toggleEnabled(_id: number, _enabled: boolean): Promise<void> {
    return
  }

  private async getFieldOptions(businessType: string, options: { includeAll?: boolean } = {}): Promise<BusinessFieldOption[]> {
    const fields = this.dataLoaderService.getFieldDefinitions(businessType) || []
    return fields
      .filter((field) => options.includeAll ? true : this.isAssigneeField(field))
      .map((field, index) => ({
        id: `${businessType}:${field.name}:${index}`,
        businessType,
        fieldName: field.name,
        fieldLabel: this.normalizeFieldLabel(field, options.includeAll),
        description: this.buildFieldDescription(field, options.includeAll),
        enabled: true,
        type: this.normalizeFieldType(field),
        group: this.getFieldGroup(field, options.includeAll),
        order: this.getFieldOrder(field, index),
      }))
      .sort((a, b) => a.order - b.order || a.fieldLabel.localeCompare(b.fieldLabel, 'zh-CN'))
  }

  private buildFieldDescription(field: FieldSource, includeAll = false) {
    if (includeAll && field.enumValues?.length) {
      return `枚举字段，可选 ${field.enumValues.length} 项`
    }
    if (field.type === 'array') {
      return includeAll ? '多值字段，可用于包含判断' : '多值人员字段，可用于多人审批'
    }
    if (field.type === 'string') {
      return includeAll ? '单值字段，可用于等值或包含判断' : '单值人员字段，可用于单人审批'
    }
    if (includeAll && ['number', 'date', 'boolean', 'enum'].includes(field.type)) {
      return `${field.type} 类型字段`
    }
    return ''
  }

  private isAssigneeField(field: { name: string; label: string; type: string }) {
    if (field.type === 'array') return true
    if (field.type !== 'string') return false

    const label = field.label || ''
    if (label.includes('部门')) return false
    if (label.includes('ID') || label.includes('Id')) {
      return /(负责人|申请人|审批人|提交人|处理人|经办人)/.test(label)
    }

    return field.name.endsWith('.id') || field.name.endsWith('Id')
  }

  private normalizeFieldLabel(field: FieldSource, includeAll = false) {
    if (includeAll) {
      return field.label || field.name
    }
    if (field.type === 'array') {
      return field.label
    }
    if (field.name === 'leader.id') {
      return '项目负责人'
    }
    if (field.name === 'submitterId') {
      return '工单提交人'
    }
    if (field.name === 'handlerId') {
      return '工单处理人'
    }
    if (field.name === 'requesterId') {
      return '变更申请人'
    }
    if (field.name === 'approverId') {
      return '变更审批人'
    }
    if (field.name === 'salesId') {
      return '销售负责人'
    }
    if (field.name === 'project.leaderId') {
      return '关联项目负责人'
    }
    return field.label.replace(/ID$/, '').replace(/Id$/, '')
  }

  private getFieldGroup(field: FieldSource, includeAll = false) {
    if (includeAll) {
      if (field.type === 'enum') return '枚举字段'
      if (field.type === 'number') return '数值字段'
      if (field.type === 'date') return '时间字段'
      if (field.type === 'boolean') return '布尔字段'
      if (this.normalizeFieldType(field) === 'department') return '部门字段'
      if (this.normalizeFieldType(field) === 'departmentArray') return '部门集合字段'
      if (this.normalizeFieldType(field) === 'user') return '人员字段'
      if (this.normalizeFieldType(field) === 'userArray') return '人员集合字段'
      if (field.name.includes('.')) return '关联字段'
      return '基础字段'
    }
    if (field.name === 'leader.id' || field.name === 'project.leaderId') {
      return '负责人'
    }
    if (field.name.includes('memberGroups.')) {
      return '项目成员角色'
    }
    if (field.name === 'executorIds') {
      return '执行人员'
    }
    if (field.name === 'submitterId' || field.name === 'handlerId') {
      return '工单相关人员'
    }
    if (field.name === 'requesterId' || field.name === 'approverId') {
      return '变更相关人员'
    }
    if (field.name === 'salesId') {
      return '客户相关人员'
    }
    return '业务人员字段'
  }

  private getFieldOrder(field: { name: string }, fallbackOrder: number) {
    const orderMap: Record<string, number> = {
      'leader.id': 10,
      'memberGroups.1': 20,
      'memberGroups.2': 21,
      'memberGroups.3': 22,
      'memberGroups.4': 23,
      'memberGroups.5': 24,
      'memberGroups.6': 25,
      'memberGroups.7': 26,
      'memberGroups.8': 27,
      'memberGroups.9': 28,
      'memberGroups.A': 29,
      'memberGroups.B': 30,
      'memberGroups.C': 31,
      'memberGroups.D': 32,
      'memberGroups.E': 33,
      'memberGroups.F': 34,
      'submitterId': 40,
      'handlerId': 41,
      'requesterId': 50,
      'approverId': 51,
      'project.leaderId': 52,
      'salesId': 60,
      'executorIds': 70,
    }
    return orderMap[field.name] ?? (1000 + fallbackOrder)
  }

  private normalizeFieldType(field: FieldSource) {
    if (field.type === 'array') {
      if (field.label?.includes('部门') || /dept|department/i.test(field.name)) return 'departmentArray'
      return 'userArray'
    }
    if (field.type === 'string') {
      if (field.label?.includes('部门') || /dept|department/i.test(field.name)) return 'department'
      if (field.label?.includes('负责人') || field.label?.includes('申请人') || field.label?.includes('审批人') || field.label?.includes('提交人') || field.label?.includes('处理人') || field.label?.includes('经办人')) {
        return 'user'
      }
    }
    return field.type
  }
}
