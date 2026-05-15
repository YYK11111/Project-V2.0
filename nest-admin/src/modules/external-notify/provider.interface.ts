import { UserExternalAccount } from "../external-accounts/entity";

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
  isEnabled(): boolean;
  sendText(account: UserExternalAccount, message: NotifyMessage): Promise<any>;
}
