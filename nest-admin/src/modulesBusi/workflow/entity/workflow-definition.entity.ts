import { IsNotEmpty, MaxLength } from 'class-validator';
import { BaseEntity, BaseColumn, MyEntity, DbUnique } from '../../../common/entity/BaseEntity';
import { NodeConfig, FlowConfig } from '../interface/node.interface';

/**
 * 工作流定义实体
 */
@MyEntity('wf_definition')
export class WorkflowDefinition extends BaseEntity {
  constructor(obj = {}) {
    super();
    this.assignOwn(obj);
  }

  /** 流程名称 */
  @BaseColumn({ length: 100, name: 'name', comment: '流程名称' })
  @IsNotEmpty({ message: '流程名称不能为空' })
  @MaxLength(100)
  name: string;

  /** 流程编码(唯一) */
  @BaseColumn({ length: 50, name: 'code', comment: '流程编码' })
  @IsNotEmpty({ message: '流程编码不能为空' })
  code: string;

  /** 流程描述 */
  @BaseColumn({ type: 'text', nullable: true, name: 'description', comment: '流程描述' })
  description: string;

  /** 版本号 */
  @BaseColumn({ type: 'int', default: 1, name: 'version', comment: '版本号' })
  version: number;

  /** 流程分类 */
  @BaseColumn({ length: 50, nullable: true, name: 'category', comment: '流程分类' })
  category: string;

  /** 节点配置JSON */
  @BaseColumn({ type: 'json', name: 'nodes', comment: '节点配置JSON' })
  nodes: NodeConfig[];

  /** 连接线配置JSON */
  @BaseColumn({ type: 'json', name: 'flows', comment: '连接线配置JSON' })
  flows: FlowConfig[];

  /** 全局配置 */
  @BaseColumn({ type: 'json', nullable: true, name: 'global_config', comment: '全局配置' })
  globalConfig: any;

  /** 是否启用: 1启用 0停用 */
  @BaseColumn({ type: 'char', length: 1, default: '1', name: 'is_active', comment: '是否启用' })
  isActive: string;

  /** 关联业务对象类型 */
  @BaseColumn({ length: 50, nullable: true, name: 'business_type', comment: '关联业务对象类型' })
  businessType: string;

  /** 业务场景，如 initiation / closure / approval */
  @BaseColumn({ length: 50, nullable: true, name: 'business_scene', comment: '业务场景' })
  businessScene: string;

  /** 触发事件: manual/onCreate/onUpdate/onStatusChange */
  @BaseColumn({ length: 50, nullable: true, name: 'trigger_event', comment: '触发事件' })
  triggerEvent: string;

  /** 状态触发值，当 triggerEvent=onStatusChange 时使用 */
  @BaseColumn({ type: 'json', nullable: true, name: 'status_trigger_values', comment: '状态触发值' })
  statusTriggerValues: string[];
}
