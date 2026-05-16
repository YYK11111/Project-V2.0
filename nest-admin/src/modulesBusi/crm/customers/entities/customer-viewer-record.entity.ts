import { BaseColumn, BaseEntity, MyEntity } from "src/common/entity/BaseEntity";

export enum CustomerViewerRecordActionType {
  grant = "grant",
  revoke = "revoke",
  revokeAll = "revokeAll",
  expire = "expire",
  enable = "enable",
  disable = "disable",
}

@MyEntity("crm_customer_viewer_record")
export class CustomerViewerRecord extends BaseEntity {
  constructor(obj = {}) {
    super();
    this.assignOwn(obj);
  }

  @BaseColumn({ type: "bigint", name: "customer_id", comment: "客户ID" })
  customerId: string;

  @BaseColumn({ length: 64, name: "batch_no", comment: "授权批次号" })
  batchNo: string;

  @BaseColumn({ length: 20, name: "action_type", comment: "操作类型" })
  actionType: CustomerViewerRecordActionType;

  @BaseColumn({
    type: "bigint",
    name: "viewer_id",
    comment: "当前授权快照ID",
    nullable: true,
  })
  viewerId: string;

  @BaseColumn({ length: 255, name: "user_id", comment: "被授权用户ID" })
  userId: string;

  @BaseColumn({
    length: 20,
    name: "grant_type",
    comment: "授权类型",
    nullable: true,
  })
  grantType: string;

  @BaseColumn({
    type: "datetime",
    name: "start_time",
    comment: "授权开始时间",
    nullable: true,
  })
  startTime: Date;

  @BaseColumn({
    type: "datetime",
    name: "end_time",
    comment: "授权结束时间",
    nullable: true,
  })
  endTime: Date;

  @BaseColumn({
    type: "char",
    length: 1,
    name: "can_edit",
    comment: "是否可编辑",
    nullable: true,
  })
  canEdit: string;

  @BaseColumn({
    length: 500,
    name: "grant_reason",
    comment: "授权原因",
    nullable: true,
  })
  grantReason: string;

  @BaseColumn({
    length: 500,
    name: "revoke_reason",
    comment: "取消原因",
    nullable: true,
  })
  revokeReason: string;

  @BaseColumn({
    type: "bigint",
    name: "operator_id",
    comment: "操作人ID",
    nullable: true,
  })
  operatorId: string;

  @BaseColumn({
    length: 100,
    name: "operator_name",
    comment: "操作人名称",
    nullable: true,
  })
  operatorName: string;

  @BaseColumn({
    type: "datetime",
    name: "operate_time",
    comment: "操作时间",
  })
  operateTime: Date;

  @BaseColumn({
    type: "char",
    length: 1,
    name: "status",
    comment: "授权快照状态",
    nullable: true,
  })
  status: string;
}
