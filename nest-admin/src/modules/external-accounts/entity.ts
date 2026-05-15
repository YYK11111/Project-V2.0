import { BaseColumn, BaseEntity, MyEntity } from "src/common/entity/BaseEntity";
import { Index } from "typeorm";

export enum ExternalAccountPlatform {
  feishu = "feishu",
  dingtalk = "dingtalk",
  wecom = "wecom",
}

export enum ExternalAccountBindStatus {
  bound = "1",
  unbound = "0",
  conflict = "2",
  inactive = "3",
}

@MyEntity("sys_user_external_account")
@Index("idx_external_account_user_platform", ["userId", "platform"])
@Index("idx_external_account_platform_user", ["platform", "externalUserId"])
@Index("idx_external_account_open_id", ["platform", "openId"])
@Index("idx_external_account_union_id", ["platform", "unionId"])
export class UserExternalAccount extends BaseEntity {
  constructor(obj = {}) {
    super();
    this.assignOwn(obj);
  }

  @BaseColumn({ length: 50, name: "user_id", comment: "系统用户ID" })
  userId: string;

  @BaseColumn({ length: 30, comment: "外部平台：feishu/dingtalk/wecom" })
  platform: ExternalAccountPlatform;

  @BaseColumn({
    length: 100,
    nullable: true,
    name: "external_user_id",
    comment: "外部平台用户ID",
  })
  externalUserId: string;

  @BaseColumn({
    length: 100,
    nullable: true,
    name: "open_id",
    comment: "OpenID",
  })
  openId: string;

  @BaseColumn({
    length: 100,
    nullable: true,
    name: "union_id",
    comment: "UnionID",
  })
  unionId: string;

  @BaseColumn({ length: 100, nullable: true, comment: "外部平台用户名" })
  name: string;

  @BaseColumn({ length: 100, nullable: true, comment: "外部平台邮箱" })
  email: string;

  @BaseColumn({ length: 50, nullable: true, comment: "外部平台手机号" })
  mobile: string;

  @BaseColumn({
    length: 1,
    default: ExternalAccountBindStatus.bound,
    name: "bind_status",
    comment: "绑定状态：1已绑定，0已解绑，2冲突，3失效",
  })
  bindStatus: ExternalAccountBindStatus;

  @BaseColumn({
    length: 30,
    nullable: true,
    name: "bind_source",
    comment: "绑定来源：manual/sync/oauth",
  })
  bindSource: string;

  @BaseColumn({
    type: "datetime",
    nullable: true,
    name: "last_sync_time",
    comment: "最后同步时间",
  })
  lastSyncTime: string;

  @BaseColumn({
    type: "json",
    nullable: true,
    name: "extra_data",
    comment: "扩展信息",
  })
  extraData: Record<string, any>;
}
