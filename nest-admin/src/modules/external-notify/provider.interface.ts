import { UserExternalAccount } from "../external-accounts/entity";

export interface FeishuNotifyConfig {
  enabled?: boolean;
  appId?: string;
  appSecret?: string;
  baseUrl?: string;
}

export interface DingTalkNotifyConfig {
  enabled?: boolean;
  appKey?: string;
  appSecret?: string;
  baseUrl?: string;
}

export interface ExternalNotifyConfig {
  enabled?: boolean;
  feishu?: FeishuNotifyConfig;
  dingtalk?: DingTalkNotifyConfig;
}

export interface NotifyMessage {
  messageId?: string;
  receiverId: string;
  templateKey?: string;
  title: string;
  content: string;
  linkUrl?: string;
  linkParams?: Record<string, any>;
  sourceType?: string;
  sourceId?: string;
  messageType?: string;
}

export interface ExternalNotifyProvider {
  readonly platform: string;
  isEnabled(config: ExternalNotifyConfig): boolean;
  sendText(
    account: UserExternalAccount,
    message: NotifyMessage,
    config: ExternalNotifyConfig,
  ): Promise<any>;
}
