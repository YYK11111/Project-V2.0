import { BaseColumn, BaseEntity, MyEntity } from "src/common/entity/BaseEntity";
import { Index } from "typeorm";

@MyEntity("business_approval_context")
@Index("idx_bac_business", [
  "businessType",
  "businessId",
  "isActive",
  "startedAt",
])
@Index("idx_bac_root_business", [
  "rootBusinessType",
  "rootBusinessId",
  "isActive",
  "startedAt",
])
@Index("idx_bac_workflow_instance", ["workflowInstanceId"])
@Index("idx_bac_scene_current", [
  "businessType",
  "businessId",
  "businessScene",
  "isCurrent",
])
@Index("idx_bac_project_scene_status", [
  "projectId",
  "businessScene",
  "status",
  "startedAt",
])
export class BusinessApprovalContext extends BaseEntity {
  constructor(obj = {}) {
    super();
    this.assignOwn(obj);
  }

  @BaseColumn({ length: 50, name: "business_type", comment: "业务类型" })
  businessType: string;

  @BaseColumn({ length: 36, name: "business_id", comment: "业务对象ID" })
  businessId: string;

  @BaseColumn({ length: 50, name: "business_scene", comment: "业务审批场景" })
  businessScene: string;

  @BaseColumn({ length: 100, name: "scene_title", comment: "审批场景名称" })
  sceneTitle: string;

  @BaseColumn({
    length: 36,
    name: "workflow_instance_id",
    comment: "流程实例ID",
  })
  workflowInstanceId: string;

  @BaseColumn({
    length: 36,
    nullable: true,
    name: "workflow_definition_id",
    comment: "流程定义ID",
  })
  workflowDefinitionId: string;

  @BaseColumn({
    length: 50,
    nullable: true,
    name: "workflow_definition_code",
    comment: "流程定义编码",
  })
  workflowDefinitionCode: string;

  @BaseColumn({ length: 20, name: "status", comment: "审批状态" })
  status: string;

  @BaseColumn({
    length: 50,
    nullable: true,
    name: "current_node_id",
    comment: "当前节点ID",
  })
  currentNodeId: string;

  @BaseColumn({
    length: 100,
    nullable: true,
    name: "current_node_name",
    comment: "当前节点名称",
  })
  currentNodeName: string;

  @BaseColumn({ length: 36, name: "starter_id", comment: "发起人ID" })
  starterId: string;

  @BaseColumn({
    length: 100,
    nullable: true,
    name: "starter_name",
    comment: "发起人名称",
  })
  starterName: string;

  @BaseColumn({
    type: "datetime",
    nullable: true,
    name: "started_at",
    comment: "发起时间",
  })
  startedAt: string;

  @BaseColumn({
    type: "datetime",
    nullable: true,
    name: "ended_at",
    comment: "结束时间",
  })
  endedAt: string;

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

  @BaseColumn({
    length: 36,
    nullable: true,
    name: "project_id",
    comment: "项目ID快捷索引",
  })
  projectId: string;

  @BaseColumn({
    type: "char",
    length: 1,
    default: "1",
    name: "is_current",
    comment: "是否当前场景最新记录",
  })
  isCurrent: string;

  @BaseColumn({
    type: "char",
    length: 1,
    default: "1",
    name: "is_active",
    comment: "是否有效",
  })
  isActive: string;
}
