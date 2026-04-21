import { BaseColumn, BaseEntity, MyEntity } from "src/common/entity/BaseEntity";

@MyEntity("change_impact_confirm_history")
export class ChangeImpactConfirmHistory extends BaseEntity {
  constructor(obj = {}) {
    super();
    this.assignOwn(obj);
  }

  @BaseColumn({ name: "change_id", comment: "变更ID" })
  changeId: string;

  @BaseColumn({
    length: 20,
    comment: "确认范围: overall/milestone/sprint/task",
  })
  scope: string;

  @BaseColumn({
    nullable: true,
    name: "target_id",
    comment: "受影响对象ID",
  })
  targetId: string;

  @BaseColumn({
    nullable: true,
    name: "target_name",
    comment: "受影响对象名称",
  })
  targetName: string;

  @BaseColumn({
    length: 20,
    comment: "操作类型: confirm",
  })
  action: string;

  @BaseColumn({ nullable: true, name: "operator_id", comment: "操作人ID" })
  operatorId: string;

  @BaseColumn({
    nullable: true,
    name: "operator_name",
    comment: "操作人名称",
  })
  operatorName: string;

  @BaseColumn({
    type: "text",
    nullable: true,
    comment: "处理备注",
  })
  remark: string;

  @BaseColumn({
    type: "datetime",
    transformer: {
      from: (date) => date && new Date(date).toISOString().split("T")[0],
      to: (value: string) => value,
    },
    nullable: true,
    name: "confirmed_at",
    comment: "确认时间",
  })
  confirmedAt: string;
}
