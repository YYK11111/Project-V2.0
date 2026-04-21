import { IsNotEmpty, MaxLength } from "class-validator";
import { BaseEntity, BaseColumn, MyEntity } from "src/common/entity/BaseEntity";
import { JoinColumn, ManyToOne } from "typeorm";
import { Project } from "../projects/entity";

export enum HandoverRecordStatus {
  draft = "1",
  confirmed = "2",
}

export const handoverRecordStatusMap = {
  [HandoverRecordStatus.draft]: "草稿",
  [HandoverRecordStatus.confirmed]: "已确认",
};

@MyEntity("handover_record")
export class HandoverRecord extends BaseEntity {
  constructor(obj = {}) {
    super();
    this.assignOwn(obj);
  }

  @BaseColumn({ nullable: true, name: "project_id", comment: "所属项目ID" })
  projectId: string;

  @ManyToOne(() => Project)
  @JoinColumn({ name: "project_id" })
  project: Project;

  @BaseColumn({ length: 120, comment: "交接单标题" })
  @IsNotEmpty({ message: "交接单标题不能为空" })
  @MaxLength(120)
  title: string;

  @BaseColumn({
    length: 100,
    nullable: true,
    name: "handover_to",
    comment: "接维对象",
  })
  handoverTo: string;

  @BaseColumn({
    type: "datetime",
    transformer: {
      from: (date) => date && new Date(date).toISOString().split("T")[0],
      to: (value: string) => value,
    },
    nullable: true,
    name: "handover_date",
    comment: "交接日期",
  })
  handoverDate: string;

  @BaseColumn({
    type: "text",
    nullable: true,
    name: "service_window",
    comment: "服务窗口说明",
  })
  serviceWindow: string;

  @BaseColumn({ type: "text", nullable: true, comment: "联系人与渠道" })
  contacts: string;

  @BaseColumn({
    type: "text",
    nullable: true,
    name: "known_issues",
    comment: "已知问题",
  })
  knownIssues: string;

  @BaseColumn({
    type: "char",
    length: 1,
    default: "0",
    name: "knowledge_ready",
    comment: "知识准备完成",
  })
  knowledgeReady: string;

  @BaseColumn({
    type: "char",
    length: 1,
    default: HandoverRecordStatus.draft,
    comment: "交接状态",
  })
  status: HandoverRecordStatus;
}
