import { BaseColumn, BaseEntity, MyEntity } from "src/common/entity/BaseEntity";

@MyEntity("ticketActionLog")
export class TicketActionLog extends BaseEntity {
  constructor(obj = {}) {
    super();
    this.assignOwn(obj);
  }

  @BaseColumn({ name: "ticket_id", comment: "工单ID" })
  ticketId: string;

  @BaseColumn({ length: 32, name: "action_type", comment: "动作类型" })
  actionType: string;

  @BaseColumn({ length: 32, name: "action_name", comment: "动作名称" })
  actionName: string;

  @BaseColumn({
    length: 1,
    nullable: true,
    name: "from_status",
    comment: "流转前状态",
  })
  fromStatus: string;

  @BaseColumn({
    length: 1,
    nullable: true,
    name: "to_status",
    comment: "流转后状态",
  })
  toStatus: string;

  @BaseColumn({
    length: 64,
    nullable: true,
    name: "operator_id",
    comment: "操作人ID",
  })
  operatorId: string;

  @BaseColumn({
    length: 100,
    nullable: true,
    name: "operator_name",
    comment: "操作人名称",
  })
  operatorName: string;

  @BaseColumn({ type: "text", nullable: true, comment: "备注" })
  remark: string;

  @BaseColumn({ type: "json", nullable: true, comment: "动作详情" })
  detail: Record<string, any>;
}
