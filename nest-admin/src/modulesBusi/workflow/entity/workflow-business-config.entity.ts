import { BaseColumn, MyEntity } from '../../../common/entity/BaseEntity';
import { Column, Entity, PrimaryColumn } from 'typeorm';

export interface FieldDefinition {
  name: string;
  label: string;
  type: 'string' | 'number' | 'date' | 'boolean' | 'enum' | 'relation' | 'array';
  relationEntity?: string;
  enumValues?: { label: string; value: any }[];
}

export interface TriggerConfig {
  triggerEvent: string;
  name?: string;
  workflowCode?: string;
  statusTriggerValues?: string[];
  condition?: string;
}

export interface BusinessConfigData {
  fieldDefinitions: FieldDefinition[];
  triggers: Record<string, TriggerConfig>;
}

@Entity('wf_business_config')
export class WorkflowBusinessConfig {
  @PrimaryColumn({ length: 50, name: 'business_type', comment: '业务对象类型' })
  businessType: string;

  @Column({ length: 100, name: 'name', comment: '业务对象名称' })
  name: string;

  @Column({ length: 50, name: 'table_name', comment: '对应的数据库表名' })
  tableName: string;

  @Column({ length: 50, default: 'id', name: 'id_field', comment: 'ID字段名' })
  idField: string;

  @Column({ type: 'text', nullable: true, name: 'field_definitions', comment: '字段定义JSON' })
  fieldDefinitions: string;

  @Column({ length: 200, nullable: true, name: 'data_loader_class', comment: '数据加载器类名' })
  dataLoaderClass: string;

  @Column({ type: 'json', nullable: true, name: 'trigger_config', comment: '触发时机配置' })
  triggerConfig: string;

  @Column({ type: 'char', length: 1, default: '1', name: 'is_active', comment: '是否启用' })
  isActive: string;

  getConfig(): BusinessConfigData | null {
    try {
      return {
        fieldDefinitions: this.fieldDefinitions ? JSON.parse(this.fieldDefinitions) : [],
        triggers: this.triggerConfig ? JSON.parse(this.triggerConfig) : {},
      };
    } catch {
      return null;
    }
  }
}
