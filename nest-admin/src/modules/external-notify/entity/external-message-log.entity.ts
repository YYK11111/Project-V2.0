import { BaseColumn, BaseEntity, MyEntity } from "src/common/entity/BaseEntity";
import { Index } from "typeorm";

export enum ExternalMessageSendStatus {
  failed = "0",
  succeeded = "1",
  skipped = "2",
}

@MyEntity("sys_external_message_log")
@Index("idx_external_message_platform_status", ["platform", "sendStatus"])
@Index("idx_external_message_message", ["messageId"])
export class ExternalMessageLog extends BaseEntity {
  constructor(obj = {}) {
    super();
    this.assignOwn(obj);
  }

  @BaseColumn({ length: 30, comment: "外部平台" })
  platform: string;

  @BaseColumn({ length: 50, nullable: true, name: "message_id" })
  messageId: string;

  @BaseColumn({ length: 50, nullable: true, name: "receiver_id" })
  receiverId: string;

  @BaseColumn({
    length: 100,
    nullable: true,
    name: "external_user_id",
  })
  externalUserId: string;

  @BaseColumn({ length: 50, nullable: true, name: "template_key" })
  templateKey: string;

  @BaseColumn({
    length: 1,
    default: ExternalMessageSendStatus.failed,
    name: "send_status",
    comment: "0失败，1成功，2跳过",
  })
  sendStatus: ExternalMessageSendStatus;

  @BaseColumn({
    type: "text",
    nullable: true,
    name: "error_message",
  })
  errorMessage: string;

  @BaseColumn({
    type: "json",
    nullable: true,
    name: "request_payload",
  })
  requestPayload: Record<string, any>;

  @BaseColumn({
    type: "json",
    nullable: true,
    name: "response_payload",
  })
  responsePayload: Record<string, any>;
}
