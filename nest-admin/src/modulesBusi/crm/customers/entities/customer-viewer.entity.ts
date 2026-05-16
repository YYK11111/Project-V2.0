import { BaseColumn, BaseEntity, MyEntity } from "src/common/entity/BaseEntity";
import { Index } from "typeorm";

export enum CustomerViewerSourceType {
  creator = "creator",
  approval = "approval",
  manual = "manual",
}

export enum CustomerViewerGrantType {
  permanent = "permanent",
  temporary = "temporary",
}

export enum CustomerViewerStatus {
  disabled = "0",
  enabled = "1",
}

@MyEntity("crm_customer_viewer")
@Index("idx_crm_customer_viewer_customer_user_source", [
  "customerId",
  "userId",
  "sourceType",
])
@Index("idx_crm_customer_viewer_status_endtime", ["status", "endTime"])
export class CustomerViewer extends BaseEntity {
  constructor(obj = {}) {
    super();
    this.assignOwn(obj);
  }

  @BaseColumn({
    type: "bigint",
    name: "customer_id",
    comment: "客户ID",
  })
  customerId: string;

  @BaseColumn({
    length: 255,
    name: "user_id",
    comment: "可查看用户ID",
  })
  userId: string;

  @BaseColumn({
    length: 20,
    name: "source_type",
    comment: "来源: creator创建人 approval审批参与 manual手工授权",
  })
  sourceType: CustomerViewerSourceType;

  @BaseColumn({
    type: "char",
    length: 1,
    default: "0",
    name: "can_edit",
    comment: "是否可编辑: 1是 0否",
  })
  canEdit: string;

  @BaseColumn({
    length: 20,
    name: "grant_type",
    comment: "授权类型: permanent永久 temporary临时",
    default: "permanent",
  })
  grantType: CustomerViewerGrantType;

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
    default: "1",
    name: "status",
    comment: "状态: 0禁用 1启用",
  })
  status: CustomerViewerStatus;

  @BaseColumn({
    length: 500,
    name: "grant_reason",
    comment: "授权原因",
    nullable: true,
  })
  grantReason: string;

  @BaseColumn({
    type: "bigint",
    name: "grant_user_id",
    comment: "授权人ID",
    nullable: true,
  })
  grantUserId: string;

  @BaseColumn({
    type: "bigint",
    name: "revoke_user_id",
    comment: "撤销人ID",
    nullable: true,
  })
  revokeUserId: string;

  @BaseColumn({
    type: "datetime",
    name: "revoke_time",
    comment: "撤销时间",
    nullable: true,
  })
  revokeTime: Date;

  @BaseColumn({
    length: 500,
    name: "revoke_reason",
    comment: "撤销原因",
    nullable: true,
  })
  revokeReason: string;
}
