import { BaseColumn, BaseEntity, MyEntity } from "src/common/entity/BaseEntity";
import { Index } from "typeorm";

export enum ExternalMessageSendStatus {
  failed = "0",
  succeeded = "1",
  skipped = "2",
  pending = "3",
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

  @BaseColumn({ length: 50, nullable: true, name: "notification_id" })
  notificationId: string;

  @BaseColumn({ length: 50, nullable: true, name: "operation_type" })
  operationType: string;

  @BaseColumn({ length: 50, nullable: true, name: "message_id" })
  messageId: string;

  @BaseColumn({ length: 100, nullable: true, name: "external_message_id" })
  externalMessageId: string;

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
    comment: "0失败，1成功，2跳过，3待处理",
  })
  sendStatus: ExternalMessageSendStatus;

  @BaseColumn({
    type: "int",
    default: 0,
    name: "retry_count",
    comment: "重试次数",
  })
  retryCount: number;

  @BaseColumn({
    type: "datetime",
    nullable: true,
    name: "next_retry_time",
  })
  nextRetryTime: string;

  @BaseColumn({
    type: "datetime",
    nullable: true,
    name: "last_retry_time",
  })
  lastRetryTime: string;

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
