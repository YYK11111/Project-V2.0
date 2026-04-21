import { IsNotEmpty, MaxLength } from "class-validator";
import { BaseEntity, BaseColumn, MyEntity } from "src/common/entity/BaseEntity";
import { JoinColumn, ManyToOne } from "typeorm";
import { Project } from "../projects/entity";

export enum AcceptanceRecordResult {
  pending = "1",
  passed = "2",
  rejected = "3",
  rectifying = "4",
}

export const acceptanceRecordResultMap = {
  [AcceptanceRecordResult.pending]: "待验收",
  [AcceptanceRecordResult.passed]: "已通过",
  [AcceptanceRecordResult.rejected]: "未通过",
  [AcceptanceRecordResult.rectifying]: "整改中",
};

@MyEntity("acceptance_record")
export class AcceptanceRecord extends BaseEntity {
  constructor(obj = {}) {
    super();
    this.assignOwn(obj);
  }

  @BaseColumn({ nullable: true, name: "project_id", comment: "所属项目ID" })
  projectId: string;

  @ManyToOne(() => Project)
  @JoinColumn({ name: "project_id" })
  project: Project;

  @BaseColumn({ length: 120, comment: "验收单标题" })
  @IsNotEmpty({ message: "验收单标题不能为空" })
  @MaxLength(120)
  title: string;

  @BaseColumn({
    type: "text",
    nullable: true,
    name: "acceptance_scope",
    comment: "验收范围",
  })
  acceptanceScope: string;

  @BaseColumn({
    type: "datetime",
    transformer: {
      from: (date) => date && new Date(date).toISOString().split("T")[0],
      to: (value: string) => value,
    },
    nullable: true,
    name: "acceptance_date",
    comment: "验收日期",
  })
  acceptanceDate: string;

  @BaseColumn({
    length: 100,
    nullable: true,
    name: "customer_approver",
    comment: "客户验收人",
  })
  customerApprover: string;

  @BaseColumn({
    type: "char",
    length: 1,
    default: AcceptanceRecordResult.pending,
    comment: "验收结果",
  })
  result: AcceptanceRecordResult;

  @BaseColumn({
    type: "text",
    nullable: true,
    name: "attachment_summary",
    comment: "附件摘要",
  })
  attachmentSummary: string;

  @BaseColumn({ type: "text", nullable: true, comment: "备注" })
  comment: string;
}
