import { BaseEntity, BaseColumn, MyEntity } from '../../../common/entity/BaseEntity';

/**
 * 工作流历史记录实体
 */
@MyEntity('wf_history')
export class WorkflowHistory extends BaseEntity {
  constructor(obj = {}) {
    super();
    this.assignOwn(obj);
  }

  /** 流程实例ID */
  @BaseColumn({ length: 36, name: 'instance_id', comment: '流程实例ID' })
  instanceId: string;

  /** 关联任务ID */
  @BaseColumn({ length: 36, nullable: true, name: 'task_id', comment: '关联任务ID' })
  taskId: string;

  /** 节点ID */
  @BaseColumn({ length: 50, nullable: true, name: 'node_id', comment: '节点ID' })
  nodeId: string;

  /** 节点名称 */
  @BaseColumn({ length: 100, nullable: true, name: 'node_name', comment: '节点名称' })
  nodeName: string;

  /** 操作人ID */
  @BaseColumn({ length: 36, nullable: true, name: 'operator_id', comment: '操作人ID' })
  operatorId: string;

  /** 操作人名称 */
  @BaseColumn({ length: 100, nullable: true, name: 'operator_name', comment: '操作人名称' })
  operatorName: string;

  /** 操作类型 */
  @BaseColumn({ length: 20, nullable: true, name: 'action', comment: '操作类型' })
  action: string;

  /** 操作意见 */
  @BaseColumn({ type: 'text', nullable: true, name: 'comment', comment: '操作意见' })
  comment: string;

  /** 当时变量状态JSON */
  @BaseColumn({ type: 'json', nullable: true, name: 'variables', comment: '当时变量状态' })
  variables: any;
}
