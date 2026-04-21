import {
  IsNotEmpty,
  MaxLength,
  IsOptional,
  IsInt,
  Min,
  Max,
} from "class-validator";
import {
  BaseEntity,
  BaseColumn,
  MyEntity,
  DbUnique,
} from "src/common/entity/BaseEntity";
import { Column, Entity, JoinColumn, ManyToOne, OneToMany } from "typeorm";
import { User } from "src/modules/users/entities/user.entity";
import { Customer } from "../crm/customers/entity";

// 项目状态枚举
export enum ProjectStatus {
  draft = "1",
  approvalPending = "2",
  executing = "3",
  paused = "4",
  closeApprovalPending = "5",
  completed = "6",
  cancelled = "7",
}

export const projectStatusMap = {
  [ProjectStatus.draft]: "草稿",
  [ProjectStatus.approvalPending]: "立项审批中",
  [ProjectStatus.executing]: "执行中",
  [ProjectStatus.paused]: "暂停中",
  [ProjectStatus.closeApprovalPending]: "结项审批中",
  [ProjectStatus.completed]: "已结项",
  [ProjectStatus.cancelled]: "已取消",
};

export enum ProjectType {
  implementation = "1",
  customDevelopment = "2",
  operations = "3",
}

export const projectTypeMap = {
  [ProjectType.implementation]: "实施类项目",
  [ProjectType.customDevelopment]: "定制开发类项目",
  [ProjectType.operations]: "运维类项目",
};

// 优先级枚举
export enum Priority {
  low = "1",
  medium = "2",
  high = "3",
}

export const priorityMap = {
  [Priority.low]: "低",
  [Priority.medium]: "中",
  [Priority.high]: "高",
};

@MyEntity("project")
export class Project extends BaseEntity {
  constructor(obj = {}) {
    super();
    this.assignOwn(obj);
  }

  @DbUnique
  @BaseColumn({ length: 100 })
  @IsNotEmpty({ message: "项目名称不能为空" })
  @MaxLength(100)
  name: string;

  @DbUnique
  @BaseColumn({ length: 50, nullable: true, comment: "项目编号" })
  code: string;

  @BaseColumn({ nullable: true, name: "leader_id", comment: "项目负责人ID" })
  leaderId: string;

  @BaseColumn({
    type: "int",
    nullable: true,
    name: "department_id",
    comment: "所属部门ID",
  })
  departmentId: number;

  @BaseColumn({
    type: "varchar",
    length: 100,
    nullable: true,
    comment: "项目分类",
  })
  category: string;

  @BaseColumn({ type: "json", nullable: true, comment: "项目标签" })
  tags: string[];

  @BaseColumn({
    type: "varchar",
    length: 30,
    nullable: true,
    comment: "当前项目阶段",
  })
  phase: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: "leader_id" })
  leader: User;

  @BaseColumn({
    type: "datetime",
    transformer: {
      from: (date) => date && new Date(date).toISOString().split("T")[0],
      to: (value: string) => value,
    },
    nullable: true,
    name: "start_date",
    comment: "开始时间",
  })
  startDate: string;

  @BaseColumn({
    type: "datetime",
    transformer: {
      from: (date) => date && new Date(date).toISOString().split("T")[0],
      to: (value: string) => value,
    },
    nullable: true,
    name: "plan_start_date",
    comment: "计划开始时间",
  })
  planStartDate: string;

  @BaseColumn({
    type: "datetime",
    transformer: {
      from: (date) => date && new Date(date).toISOString().split("T")[0],
      to: (value: string) => value,
    },
    nullable: true,
    name: "end_date",
    comment: "结束时间",
  })
  endDate: string;

  @BaseColumn({
    type: "datetime",
    transformer: {
      from: (date) => date && new Date(date).toISOString().split("T")[0],
      to: (value: string) => value,
    },
    nullable: true,
    name: "plan_end_date",
    comment: "计划结束时间",
  })
  planEndDate: string;

  @BaseColumn({
    type: "datetime",
    transformer: {
      from: (date) => date && new Date(date).toISOString().split("T")[0],
      to: (value: string) => value,
    },
    nullable: true,
    name: "actual_start_date",
    comment: "实际开始时间",
  })
  actualStartDate: string;

  @BaseColumn({
    type: "datetime",
    transformer: {
      from: (date) => date && new Date(date).toISOString().split("T")[0],
      to: (value: string) => value,
    },
    nullable: true,
    name: "actual_end_date",
    comment: "实际结束时间",
  })
  actualEndDate: string;

  @BaseColumn({
    type: "datetime",
    transformer: {
      from: (date) => date && new Date(date).toISOString().split("T")[0],
      to: (value: string) => value,
    },
    nullable: true,
    name: "phase_start_date",
    comment: "阶段开始时间",
  })
  phaseStartDate: string;

  @BaseColumn({
    type: "datetime",
    transformer: {
      from: (date) => date && new Date(date).toISOString().split("T")[0],
      to: (value: string) => value,
    },
    nullable: true,
    name: "phase_end_date",
    comment: "阶段结束时间",
  })
  phaseEndDate: string;

  @BaseColumn({
    type: "char",
    length: 1,
    default: ProjectStatus.draft,
    name: "status",
    comment: "项目状态",
  })
  status: ProjectStatus;

  @BaseColumn({
    type: "char",
    length: 1,
    default: ProjectType.implementation,
    name: "project_type",
    comment: "项目类型",
  })
  projectType: ProjectType;

  @BaseColumn({
    type: "char",
    length: 1,
    default: Priority.medium,
    name: "priority",
    comment: "优先级",
  })
  priority: Priority;

  @BaseColumn({ type: "text", nullable: true, comment: "项目描述" })
  description: string;

  @BaseColumn({
    type: "text",
    nullable: true,
    name: "baseline_deliverables",
    comment: "立项基线计划-主要交付物",
  })
  baselineDeliverables: string;

  @BaseColumn({
    type: "text",
    nullable: true,
    name: "scope_boundary",
    comment: "立项基线计划-范围边界说明",
  })
  scopeBoundary: string;

  @BaseColumn({
    type: "text",
    nullable: true,
    name: "baseline_plan_note",
    comment: "立项基线计划-计划说明",
  })
  baselinePlanNote: string;

  @BaseColumn({ type: "json", nullable: true, comment: "项目附件" })
  attachments: string[];

  @BaseColumn({
    type: "text",
    nullable: true,
    name: "close_summary",
    comment: "结项资料-验收说明",
  })
  closeSummary: string;

  @BaseColumn({
    type: "text",
    nullable: true,
    name: "close_deliverables",
    comment: "结项资料-交付清单",
  })
  closeDeliverables: string;

  @BaseColumn({
    type: "text",
    nullable: true,
    name: "close_open_issues",
    comment: "结项资料-遗留问题",
  })
  closeOpenIssues: string;

  @BaseColumn({
    type: "text",
    nullable: true,
    name: "close_review",
    comment: "结项资料-项目复盘",
  })
  closeReview: string;

  @BaseColumn({
    type: "datetime",
    transformer: {
      from: (date) => date && new Date(date).toISOString().split("T")[0],
      to: (value: string) => value,
    },
    nullable: true,
    name: "acceptance_date",
    comment: "结项资料-验收日期",
  })
  acceptanceDate: string;

  @BaseColumn({
    type: "char",
    length: 1,
    default: "0",
    name: "is_archived",
    comment: "是否归档",
  })
  isArchived: string;

  // ==================== P0 扩展字段 ====================

  @BaseColumn({
    type: "decimal",
    precision: 15,
    scale: 2,
    default: 0,
    comment: "项目预算（元）",
  })
  budget: number;

  @BaseColumn({
    type: "decimal",
    precision: 15,
    scale: 2,
    default: 0,
    comment: "实际成本（元）",
  })
  actualCost: number;

  @BaseColumn({
    type: "varchar",
    length: 20,
    nullable: true,
    comment: "币种",
  })
  currency: string;

  @BaseColumn({
    type: "varchar",
    length: 20,
    nullable: true,
    name: "risk_level",
    comment: "整体风险等级",
  })
  riskLevel: string;

  @BaseColumn({
    type: "varchar",
    length: 20,
    nullable: true,
    name: "quality_level",
    comment: "整体质量等级",
  })
  qualityLevel: string;

  @BaseColumn({
    type: "varchar",
    length: 100,
    nullable: true,
    name: "business_line",
    comment: "业务线",
  })
  businessLine: string;

  @BaseColumn({
    type: "varchar",
    length: 100,
    nullable: true,
    comment: "所属行业",
  })
  industry: string;

  @BaseColumn({
    type: "varchar",
    length: 100,
    nullable: true,
    name: "project_source",
    comment: "项目来源",
  })
  projectSource: string;

  @BaseColumn({
    type: "decimal",
    precision: 12,
    scale: 2,
    default: 0,
    name: "spent_hours",
    comment: "累计消耗工时",
  })
  spentHours: number;

  @BaseColumn({
    nullable: true,
    name: "creator_id",
    comment: "项目发起人ID",
  })
  creatorId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: "creator_id" })
  creator: User;

  @BaseColumn({ type: "int", nullable: true, comment: "关联客户ID" })
  customerId: number;

  @BaseColumn({
    type: "varchar",
    length: 36,
    nullable: true,
    name: "contract_id",
    comment: "来源合同ID",
  })
  contractId: string;

  @BaseColumn({
    type: "varchar",
    length: 36,
    nullable: true,
    name: "opportunity_id",
    comment: "来源商机ID",
  })
  opportunityId: string;

  @ManyToOne(() => Customer, { nullable: true })
  @JoinColumn({ name: "customer_id" })
  customer: Customer;

  @BaseColumn({ type: "int", default: 0, comment: "整体进度百分比（0-100）" })
  progress: number;

  @BaseColumn({
    type: "varchar",
    length: 500,
    nullable: true,
    comment: "工作流实例ID",
  })
  workflowInstanceId: string;

  @BaseColumn({
    type: "varchar",
    length: 64,
    nullable: true,
    comment: "项目知识主分类ID",
  })
  knowledgeCatalogId: string;

  @BaseColumn({
    type: "char",
    length: 1,
    default: "0",
    comment: "审批状态: 0无需审批 1审批中 2已通过 3已驳回",
  })
  approvalStatus: string;

  @BaseColumn({
    type: "varchar",
    length: 100,
    nullable: true,
    comment: "当前审批节点名称",
  })
  currentNodeName: string;
}
