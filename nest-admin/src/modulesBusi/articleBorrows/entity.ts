import { BaseEntity, BaseColumn, MyEntity } from "src/common/entity/BaseEntity";
import { Article } from "../articles/entity";
import { User } from "src/modules/users/entities/user.entity";
import { JoinColumn, ManyToOne } from "typeorm";

export enum KnowledgeBorrowStatus {
  pending = "pending",
  waitingStart = "waitingStart",
  active = "active",
  approved = "approved",
  rejected = "rejected",
  expired = "expired",
  revoked = "revoked",
}

export const knowledgeBorrowStatusMap = {
  [KnowledgeBorrowStatus.pending]: "待审批",
  [KnowledgeBorrowStatus.waitingStart]: "等待开始",
  [KnowledgeBorrowStatus.active]: "借阅中",
  [KnowledgeBorrowStatus.approved]: "已通过",
  [KnowledgeBorrowStatus.rejected]: "已拒绝",
  [KnowledgeBorrowStatus.expired]: "已到期",
  [KnowledgeBorrowStatus.revoked]: "已撤销",
};

@MyEntity("busiArticleBorrow")
export class ArticleBorrow extends BaseEntity {
  constructor(obj = {}) {
    super();
    this.assignOwn(obj);
  }

  @BaseColumn({ name: "articleId", comment: "文章ID" })
  articleId: string;

  @ManyToOne(() => Article, { nullable: false })
  @JoinColumn({ name: "articleId" })
  article: Article;

  @BaseColumn({ name: "catalogId", comment: "分类ID" })
  catalogId: string;

  @BaseColumn({ name: "userId", comment: "申请用户ID" })
  userId: string;

  @ManyToOne(() => User, { nullable: false })
  @JoinColumn({ name: "userId" })
  applicant: User;

  @BaseColumn({ comment: "借阅理由" })
  applyReason: string;

  @BaseColumn({ type: "int", default: 1, comment: "申请借阅天数" })
  requestedDays: number;

  @BaseColumn({
    type: "enum",
    enum: KnowledgeBorrowStatus,
    default: KnowledgeBorrowStatus.pending,
    comment: "借阅状态",
  })
  status: KnowledgeBorrowStatus;

  @BaseColumn({ nullable: true, name: "approvedBy", comment: "审批人ID" })
  approvedBy: string;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: "approvedBy" })
  approver: User;

  @BaseColumn({ nullable: true, comment: "审批时间" })
  approvedAt: string;

  @BaseColumn({ nullable: true, comment: "拒绝原因" })
  rejectReason: string;

  @BaseColumn({ nullable: true, comment: "借阅开始时间" })
  borrowStartTime: string;

  @BaseColumn({ nullable: true, comment: "借阅结束时间" })
  borrowEndTime: string;

  @BaseColumn({ nullable: true, comment: "申请开始借阅时间" })
  requestedStartTime: string;

  @BaseColumn({ default: "manualApply", comment: "来源类型" })
  sourceType: string;

  @BaseColumn({
    nullable: true,
    name: "workflowInstanceId",
    comment: "流程实例ID",
  })
  workflowInstanceId: string;

  @BaseColumn({ default: "0", name: "approvalStatus", comment: "审批状态" })
  approvalStatus: string;

  @BaseColumn({
    nullable: true,
    name: "currentNodeName",
    comment: "当前流程节点",
  })
  currentNodeName: string;
}
