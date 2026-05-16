import { UserExternalAccount } from "../external-accounts/entity";

export interface FeishuNotifyConfig {
  enabled?: boolean;
  appId?: string;
  appSecret?: string;
  baseUrl?: string;
  enabledScenes?: string[];
}

export interface DingTalkNotifyConfig {
  enabled?: boolean;
  appKey?: string;
  appSecret?: string;
  baseUrl?: string;
}

export interface ExternalNotifyConfig {
  enabled?: boolean;
  siteUrl?: string;
  feishu?: FeishuNotifyConfig;
  dingtalk?: DingTalkNotifyConfig;
}

export type WorkflowTodoCardStatus = "approved" | "rejected" | "cancelled";

export interface WorkflowTodoCardStatusOptions {
  status: WorkflowTodoCardStatus;
  statusText?: string;
}

export interface NotifyMessage {
  notificationId?: string;
  messageId?: string;
  receiverId: string;
  templateKey?: string;
  title: string;
  content: string;
  linkUrl?: string;
  linkParams?: Record<string, any>;
  extraData?: Record<string, any>;
  sourceType?: string;
  sourceId?: string;
  messageType?: string;
  sceneKey?: string;
}

export interface ExternalNotifyProvider {
  readonly platform: string;
  isEnabled(config: ExternalNotifyConfig): boolean;
  sendText(
    account: UserExternalAccount,
    message: NotifyMessage,
    config: ExternalNotifyConfig,
  ): Promise<any>;
  updateWorkflowTodoCard?(
    feishuMessageId: string,
    message: NotifyMessage,
    status: WorkflowTodoCardStatusOptions,
    config: ExternalNotifyConfig,
  ): Promise<any>;
}
