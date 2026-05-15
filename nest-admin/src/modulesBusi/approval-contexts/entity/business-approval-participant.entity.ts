import { BaseColumn, BaseEntity, MyEntity } from "src/common/entity/BaseEntity";
import { Index } from "typeorm";

export type BusinessApprovalParticipantRole =
  | "starter"
  | "assignee"
  | "history"
  | "cc";

@MyEntity("business_approval_participant")
@Index("idx_bap_user_role", ["userId", "roleType", "createTime"])
@Index("idx_bap_user_root", ["userId", "rootBusinessType", "rootBusinessId"])
@Index("idx_bap_context", ["approvalContextId"])
@Index("idx_bap_workflow_instance", ["workflowInstanceId"])
export class BusinessApprovalParticipant extends BaseEntity {
  constructor(obj = {}) {
    super();
    this.assignOwn(obj);
  }

  @BaseColumn({
    length: 36,
    name: "approval_context_id",
    comment: "审批上下文ID",
  })
  approvalContextId: string;

  @BaseColumn({
    length: 36,
    name: "workflow_instance_id",
    comment: "流程实例ID",
  })
  workflowInstanceId: string;

  @BaseColumn({ length: 36, name: "user_id", comment: "用户ID" })
  userId: string;

  @BaseColumn({ length: 20, name: "role_type", comment: "参与角色" })
  roleType: BusinessApprovalParticipantRole;

  @BaseColumn({ length: 50, name: "business_type", comment: "业务类型" })
  businessType: string;

  @BaseColumn({ length: 36, name: "business_id", comment: "业务对象ID" })
  businessId: string;

  @BaseColumn({
    length: 50,
    nullable: true,
    name: "root_business_type",
    comment: "聚合根业务类型",
  })
  rootBusinessType: string;

  @BaseColumn({
    length: 36,
    nullable: true,
    name: "root_business_id",
    comment: "聚合根业务ID",
  })
  rootBusinessId: string;
}
