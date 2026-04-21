import { IsNotEmpty, MaxLength, IsOptional, IsInt } from "class-validator";
import { BaseEntity, BaseColumn, MyEntity } from "src/common/entity/BaseEntity";
import { Column, Entity, JoinColumn, ManyToOne } from "typeorm";
import { User } from "src/modules/users/entities/user.entity";
import { Project } from "../projects/entity";

// 项目成员角色枚举
export enum ProjectMemberRole {
  manager = "1",
  deliveryManager = "2",
  techLead = "3",
  implementationLead = "4",
  testLead = "5",
  customerContact = "6",
  businessContact = "7",
  developer = "8",
  implementationConsultant = "9",
  tester = "A",
  operationsEngineer = "B",
  trainer = "C",
  dataMigrationEngineer = "D",
  onsiteSupport = "E",
  member = "F",
  visitor = "G",
}

export const projectMemberRoleMap = {
  [ProjectMemberRole.manager]: "项目经理",
  [ProjectMemberRole.deliveryManager]: "交付经理",
  [ProjectMemberRole.techLead]: "技术负责人",
  [ProjectMemberRole.implementationLead]: "实施负责人",
  [ProjectMemberRole.testLead]: "测试负责人",
  [ProjectMemberRole.customerContact]: "客户联系人",
  [ProjectMemberRole.businessContact]: "商务接口人",
  [ProjectMemberRole.developer]: "开发工程师",
  [ProjectMemberRole.implementationConsultant]: "实施顾问",
  [ProjectMemberRole.tester]: "测试工程师",
  [ProjectMemberRole.operationsEngineer]: "运维工程师",
  [ProjectMemberRole.trainer]: "培训顾问",
  [ProjectMemberRole.dataMigrationEngineer]: "数据迁移工程师",
  [ProjectMemberRole.onsiteSupport]: "驻场支持",
  [ProjectMemberRole.member]: "普通成员",
  [ProjectMemberRole.visitor]: "访客",
};

@MyEntity("project_member")
export class ProjectMember extends BaseEntity {
  constructor(obj = {}) {
    super();
    this.assignOwn(obj);
  }

  @BaseColumn({ nullable: true, name: "project_id", comment: "项目ID" })
  projectId: string;

  @ManyToOne(() => Project)
  @JoinColumn({ name: "project_id" })
  project: Project;

  @BaseColumn({ nullable: true, name: "user_id", comment: "用户ID" })
  userId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: "user_id" })
  user: User;

  @BaseColumn({
    type: "char",
    length: 1,
    default: ProjectMemberRole.member,
    name: "role",
    comment: "成员角色",
  })
  role: ProjectMemberRole;

  @BaseColumn({
    type: "char",
    length: 1,
    default: "0",
    name: "is_active",
    comment: "是否激活",
  })
  isActive: string;

  @BaseColumn({
    type: "char",
    length: 1,
    default: "0",
    name: "is_core",
    comment: "是否核心成员",
  })
  isCore: string;

  @BaseColumn({
    type: "varchar",
    length: 255,
    nullable: true,
    name: "remark",
    comment: "成员备注",
  })
  remark: string;

  @BaseColumn({ type: "int", default: 0, name: "sort", comment: "排序" })
  sort: number;

  @BaseColumn({
    type: "datetime",
    transformer: {
      from: (date) => date && new Date(date).toISOString().split("T")[0],
      to: (value: string) => value,
    },
    nullable: true,
    name: "join_date",
    comment: "加入项目时间",
  })
  joinDate: string;

  @BaseColumn({
    type: "char",
    length: 1,
    default: "1",
    name: "notification_enabled",
    comment: "是否接收项目提醒",
  })
  notificationEnabled: string;

  @BaseColumn({
    type: "json",
    nullable: true,
    name: "responsibility_scope",
    comment: "成员作用域",
  })
  responsibilityScope: string[];

  @BaseColumn({
    type: "varchar",
    length: 100,
    nullable: true,
    name: "position_title",
    comment: "岗位/职责补充名称",
  })
  positionTitle: string;

  @BaseColumn({
    type: "datetime",
    transformer: {
      from: (date) => date && new Date(date).toISOString().split("T")[0],
      to: (value: string) => value,
    },
    nullable: true,
    name: "leave_date",
    comment: "退出项目时间",
  })
  leaveDate: string;

  @BaseColumn({
    type: "varchar",
    length: 50,
    nullable: true,
    name: "field_permission_group",
    comment: "字段权限组",
  })
  fieldPermissionGroup: string;
}
