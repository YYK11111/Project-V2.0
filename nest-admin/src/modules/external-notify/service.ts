import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import {
  ExternalAccountPlatform,
  UserExternalAccount,
} from "../external-accounts/entity";
import { UserExternalAccountsService } from "../external-accounts/service";
import { SystenConfigsService } from "../configs/service";
import {
  ExternalMessageLog,
  ExternalMessageSendStatus,
} from "./entity/external-message-log.entity";
import {
  ExternalNotifyConfig,
  ExternalNotifyProvider,
  NotifyMessage,
} from "./provider.interface";
import { FeishuNotifyProvider } from "./providers/feishu.provider";
import { DingTalkNotifyProvider } from "./providers/dingtalk.provider";

@Injectable()
export class ExternalNotifyService {
  private readonly providers: ExternalNotifyProvider[];

  constructor(
    private readonly externalAccountsService: UserExternalAccountsService,
    private readonly systemConfigsService: SystenConfigsService,
    @InjectRepository(ExternalMessageLog)
    private readonly logRepository: Repository<ExternalMessageLog>,
    feishuProvider: FeishuNotifyProvider,
    dingtalkProvider: DingTalkNotifyProvider,
  ) {
    this.providers = [feishuProvider, dingtalkProvider];
  }

  async sendToUser(userId: string, message: NotifyMessage) {
    if (!userId) return;
    const config = await this.systemConfigsService.getExternalNotifyRuntimeConfig();
    await Promise.all(
      this.providers
        .filter((provider) => provider.isEnabled(config as ExternalNotifyConfig))
        .map((provider) =>
          this.sendByProvider(provider, userId, message, config),
        ),
    );
  }

  private async sendByProvider(
    provider: ExternalNotifyProvider,
    userId: string,
    message: NotifyMessage,
    config: ExternalNotifyConfig,
  ) {
    const account = await this.externalAccountsService.getActiveAccount(
      userId,
      provider.platform as ExternalAccountPlatform,
    );
    if (!account?.externalUserId) {
      await this.saveLog(provider.platform, null, message, {
        sendStatus: ExternalMessageSendStatus.skipped,
        errorMessage: "用户未绑定外部平台账号",
      });
      return;
    }
    try {
      const response = await provider.sendText(account, message, config);
      await this.saveLog(provider.platform, account, message, {
        sendStatus: ExternalMessageSendStatus.succeeded,
        responsePayload: response,
      });
    } catch (error) {
      await this.saveLog(provider.platform, account, message, {
        sendStatus: ExternalMessageSendStatus.failed,
        errorMessage: error?.message || "外部通知发送失败",
      });
    }
  }

  private async saveLog(
    platform: string,
    account: UserExternalAccount | null,
    message: NotifyMessage,
    result: Partial<ExternalMessageLog>,
  ) {
    await this.logRepository.save({
      platform,
      messageId: message.messageId || "",
      receiverId: message.receiverId,
      externalUserId: account?.externalUserId || "",
      templateKey: message.templateKey || "",
      requestPayload: {
        title: message.title,
        sourceType: message.sourceType,
        sourceId: message.sourceId,
      },
      ...result,
    } as any);
  }
}
