import { BaseEntity, BaseColumn, MyEntity } from '../../../common/entity/BaseEntity';

/**
 * 工作流实例实体
 */
@MyEntity('wf_instance')
export class WorkflowInstance extends BaseEntity {
  constructor(obj = {}) {
    super();
    this.assignOwn(obj);
  }

  /** 流程定义ID */
  @BaseColumn({ length: 36, name: 'definition_id', comment: '流程定义ID' })
  definitionId: string;

  /** 流程定义编码 */
  @BaseColumn({ length: 50, name: 'definition_code', comment: '流程定义编码' })
  definitionCode: string;

  /** 业务数据ID(关联外部业务表) */
  @BaseColumn({ length: 100, name: 'business_key', comment: '业务数据ID' })
  businessKey: string;

  /** 发起人ID */
  @BaseColumn({ length: 36, name: 'starter_id', comment: '发起人ID' })
  starterId: string;

  /** 当前节点ID */
  @BaseColumn({ length: 50, nullable: true, name: 'current_node_id', comment: '当前节点ID' })
  currentNodeId: string;

  /** 流程变量JSON */
  @BaseColumn({ type: 'json', nullable: true, name: 'variables', comment: '流程变量JSON' })
  variables: Record<string, any>;

  /** 状态: 1进行中 2已完成 3已取消 4已挂起 */
  @BaseColumn({ type: 'char', length: 1, default: '1', name: 'status', comment: '状态:1进行中 2已完成 3已取消 4已挂起' })
  status: string;

  /** 开始时间 */
  @BaseColumn({ type: 'datetime', nullable: true, name: 'start_time', comment: '开始时间' })
  startTime: string;

  /** 结束时间 */
  @BaseColumn({ type: 'datetime', nullable: true, name: 'end_time', comment: '结束时间' })
  endTime: string;

  /** 耗时(毫秒) */
  @BaseColumn({ type: 'bigint', nullable: true, name: 'duration', comment: '耗时(毫秒)' })
  duration: string;
}
