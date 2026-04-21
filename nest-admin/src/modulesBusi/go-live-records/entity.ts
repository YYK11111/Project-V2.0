import { IsNotEmpty, MaxLength } from "class-validator";
import { BaseEntity, BaseColumn, MyEntity } from "src/common/entity/BaseEntity";
import { JoinColumn, ManyToOne } from "typeorm";
import { Project } from "../projects/entity";
import { User } from "src/modules/users/entities/user.entity";

export enum GoLiveRecordStatus {
  draft = "1",
  pendingApproval = "2",
  approved = "3",
  executing = "4",
  succeeded = "5",
  rolledBack = "6",
  cancelled = "7",
}

export const goLiveRecordStatusMap = {
  [GoLiveRecordStatus.draft]: "草稿",
  [GoLiveRecordStatus.pendingApproval]: "待审批",
  [GoLiveRecordStatus.approved]: "已批准",
  [GoLiveRecordStatus.executing]: "执行中",
  [GoLiveRecordStatus.succeeded]: "已成功",
  [GoLiveRecordStatus.rolledBack]: "已回退",
  [GoLiveRecordStatus.cancelled]: "已取消",
};

@MyEntity("go_live_record")
export class GoLiveRecord extends BaseEntity {
  constructor(obj = {}) {
    super();
    this.assignOwn(obj);
  }

  @BaseColumn({ nullable: true, name: "project_id", comment: "所属项目ID" })
  projectId: string;

  @ManyToOne(() => Project)
  @JoinColumn({ name: "project_id" })
  project: Project;

  @BaseColumn({ length: 120, comment: "上线单标题" })
  @IsNotEmpty({ message: "上线单标题不能为空" })
  @MaxLength(120)
  title: string;

  @BaseColumn({
    type: "datetime",
    transformer: {
      from: (date) => date && new Date(date).toISOString().split("T")[0],
      to: (value: string) => value,
    },
    nullable: true,
    name: "planned_go_live_time",
    comment: "计划上线日期",
  })
  plannedGoLiveTime: string;

  @BaseColumn({
    type: "datetime",
    transformer: {
      from: (date) => date && new Date(date).toISOString().split("T")[0],
      to: (value: string) => value,
    },
    nullable: true,
    name: "actual_go_live_time",
    comment: "实际上线日期",
  })
  actualGoLiveTime: string;

  @BaseColumn({ type: "text", nullable: true, name: "rollback_plan", comment: "回退预案" })
  rollbackPlan: string;

  @BaseColumn({ type: "text", nullable: true, name: "checklist_summary", comment: "检查项摘要" })
  checklistSummary: string;

  @BaseColumn({ type: "json", nullable: true, name: "duty_members", comment: "值守成员" })
  dutyMembers: string[];

  @BaseColumn({
    type: "char",
    length: 1,
    default: GoLiveRecordStatus.draft,
    comment: "上线单状态",
  })
  status: GoLiveRecordStatus;

  @BaseColumn({ nullable: true, name: "owner_id", comment: "负责人ID" })
  ownerId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: "owner_id" })
  owner: User;
}
