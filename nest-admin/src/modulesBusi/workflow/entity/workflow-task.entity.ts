import { BaseEntity, BaseColumn, MyEntity } from '../../../common/entity/BaseEntity';

/**
 * 工作流任务实体
 */
@MyEntity('wf_task')
export class WorkflowTask extends BaseEntity {
  constructor(obj = {}) {
    super();
    this.assignOwn(obj);
  }

  /** 流程实例ID */
  @BaseColumn({ length: 36, name: 'instance_id', comment: '流程实例ID' })
  instanceId: string;

  /** 节点ID */
  @BaseColumn({ length: 50, name: 'node_id', comment: '节点ID' })
  nodeId: string;

  /** 节点名称 */
  @BaseColumn({ length: 100, name: 'node_name', comment: '节点名称' })
  nodeName: string;

  /** 节点类型 */
  @BaseColumn({ length: 20, name: 'node_type', comment: '节点类型' })
  nodeType: string;

  /** 审批人ID */
  @BaseColumn({ length: 36, nullable: true, name: 'assignee_id', comment: '审批人ID' })
  assigneeId: string;

  /** 审批人名称 */
  @BaseColumn({ length: 100, nullable: true, name: 'assignee_name', comment: '审批人名称' })
  assigneeName: string;

  /** 候选审批人ID列表JSON */
  @BaseColumn({ type: 'json', nullable: true, name: 'candidate_ids', comment: '候选审批人ID列表JSON' })
  candidateIds: any;

  /** 状态: 1待处理 2处理中 3已完成 4已取消 */
  @BaseColumn({ type: 'char', length: 1, default: '1', name: 'status', comment: '状态: 1待处理 2处理中 3已完成 4已取消' })
  status: string;

  /** 审批动作: 1同意 2驳回 3撤回 4转交 */
  @BaseColumn({ type: 'char', length: 1, nullable: true, name: 'action', comment: '审批动作: 1同意 2驳回 3撤回 4转交' })
  action: string;

  /** 审批意见 */
  @BaseColumn({ type: 'text', nullable: true, name: 'comment', comment: '审批意见' })
  comment: string;

  /** 输入数据JSON */
  @BaseColumn({ type: 'json', nullable: true, name: 'input_data', comment: '输入数据JSON' })
  inputData: any;

  /** 输出数据JSON */
  @BaseColumn({ type: 'json', nullable: true, name: 'output_data', comment: '输出数据JSON' })
  outputData: any;

  /** 任务开始时间 */
  @BaseColumn({ type: 'datetime', nullable: true, name: 'start_time', comment: '任务开始时间' })
  startTime: string;

  /** 完成时间 */
  @BaseColumn({ type: 'datetime', nullable: true, name: 'complete_time', comment: '完成时间' })
  completeTime: string;

  /** 处理耗时(毫秒) */
  @BaseColumn({ type: 'bigint', nullable: true, name: 'duration', comment: '处理耗时(毫秒)' })
  duration: string;

  /** 到期时间 */
  @BaseColumn({ type: 'datetime', nullable: true, name: 'due_time', comment: '到期时间' })
  dueTime: string;
}
