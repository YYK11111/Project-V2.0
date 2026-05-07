import { BaseColumn, BaseEntity, MyEntity } from "src/common/entity/BaseEntity";

@MyEntity("system_job_config")
export class SystemScheduledJobConfig extends BaseEntity {
  constructor(obj = {}) {
    super();
    this.assignOwn(obj);
  }

  @BaseColumn({ name: "job_key", comment: "任务编码" })
  jobKey: string;

  @BaseColumn({ default: "1", comment: "是否启用：1启用 0停用" })
  enabled: string;

  @BaseColumn({ nullable: true, comment: "备注" })
  remarks: string;

  @BaseColumn({
    nullable: true,
    name: "last_operator_id",
    comment: "最近操作人ID",
  })
  lastOperatorId: string;

  @BaseColumn({
    nullable: true,
    name: "last_operator_name",
    comment: "最近操作人名称",
  })
  lastOperatorName: string;
}
