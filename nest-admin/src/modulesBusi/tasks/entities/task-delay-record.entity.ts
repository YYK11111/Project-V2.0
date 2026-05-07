import { BaseEntity, BaseColumn } from "src/common/entity/BaseEntity";
import { Entity } from "typeorm";

@Entity("task_delay_record")
export class TaskDelayRecord extends BaseEntity {
  constructor(obj = {}) {
    super();
    this.assignOwn(obj);
  }

  @BaseColumn({ name: "task_id", comment: "任务ID" })
  taskId: string;

  @BaseColumn({
    type: "datetime",
    nullable: true,
    name: "before_end_date",
    comment: "延期前截止日期",
  })
  beforeEndDate: string;

  @BaseColumn({
    type: "datetime",
    nullable: true,
    name: "after_end_date",
    comment: "延期后截止日期",
  })
  afterEndDate: string;

  @BaseColumn({ type: "text", nullable: true, comment: "延期原因" })
  reason: string;

  @BaseColumn({ nullable: true, name: "operator_id", comment: "操作人ID" })
  operatorId: string;

  @BaseColumn({
    nullable: true,
    name: "operator_name",
    comment: "操作人名称",
  })
  operatorName: string;
}
