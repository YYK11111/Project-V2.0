import { BaseColumn, BaseEntity, MyEntity } from "src/common/entity/BaseEntity";
import { Index } from "typeorm";

export enum CustomerViewerSourceType {
  creator = "creator",
  approval = "approval",
  manual = "manual",
}

@MyEntity("crm_customer_viewer")
@Index("idx_crm_customer_viewer_customer_user_source", [
  "customerId",
  "userId",
  "sourceType",
])
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
}
