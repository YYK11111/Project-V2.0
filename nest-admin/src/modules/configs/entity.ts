import { IsNotEmpty, MaxLength } from "class-validator";
import {
  BaseEntity,
  BaseColumn,
  MyEntity,
  boolNumColumn,
} from "src/common/entity/BaseEntity";
import { Column, Entity, JoinTable, ManyToMany } from "typeorm";
import { BoolNum } from "src/common/type/base";

// 系统配置
@MyEntity("sys_config")
export class SystenConfig extends BaseEntity {
  constructor(obj = {}) {
    super();
    this.assignOwn(obj);
  }

  @BaseColumn({ name: "systemName" })
  @MaxLength(30)
  systemName: string;

  @BaseColumn({ name: "systemLogo" })
  systemLogo: string;

  @BaseColumn({ name: "browser_title", nullable: true })
  @MaxLength(100)
  browserTitle: string;

  @BaseColumn({ name: "browser_icon", nullable: true })
  browserIcon: string;

  @BaseColumn({ name: "session_expire_minutes", nullable: true })
  sessionExpireMinutes: string;

  @BaseColumn({
    type: "json",
    nullable: true,
    name: "project_reminder_strategy",
    comment: "项目提醒策略配置",
  })
  projectReminderStrategy: Record<string, any>;

  @BaseColumn({
    type: "json",
    nullable: true,
    name: "project_field_permission_matrix",
    comment: "项目字段组权限矩阵配置",
  })
  projectFieldPermissionMatrix: Record<string, any>;
}
