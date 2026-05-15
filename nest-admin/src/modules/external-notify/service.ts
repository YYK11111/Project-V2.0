import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { User } from "../users/entities/user.entity";
import {
  ExternalAccountBindStatus,
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
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly feishuProvider: FeishuNotifyProvider,
    dingtalkProvider: DingTalkNotifyProvider,
  ) {
    this.providers = [feishuProvider, dingtalkProvider];
  }

  async sendToUser(userId: string, message: NotifyMessage) {
    if (!userId) return;
    const config =
      await this.systemConfigsService.getExternalNotifyRuntimeConfig();
    await Promise.all(
      this.providers
        .filter((provider) =>
          provider.isEnabled(config as ExternalNotifyConfig),
        )
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
    let account = await this.externalAccountsService.getActiveAccount(
      userId,
      provider.platform as ExternalAccountPlatform,
    );
    if (!account?.externalUserId && provider.platform === "feishu") {
      account = await this.syncFeishuAccount(userId, config);
    }
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

  async sendFeishuTestMessage(userId: string) {
    const config =
      await this.systemConfigsService.getExternalNotifyRuntimeConfig();
    if (!this.feishuProvider.isEnabled(config)) {
      throw new Error("飞书通知未启用或配置不完整");
    }
    const message = {
      receiverId: userId,
      templateKey: "feishuTest",
      title: "飞书通知测试",
      content: "如果你收到这条消息，说明系统飞书通知配置可用。",
      sourceType: "system_config",
      sourceId: "feishu_test",
      messageType: "test",
    };
    const account =
      (await this.externalAccountsService.getActiveAccount(
        userId,
        ExternalAccountPlatform.feishu,
      )) || (await this.syncFeishuAccount(userId, config));
    if (!account?.externalUserId) {
      throw new Error("当前用户未绑定或未匹配到飞书账号");
    }
    try {
      const response = await this.feishuProvider.sendText(
        account,
        message,
        config,
      );
      await this.saveLog("feishu", account, message, {
        sendStatus: ExternalMessageSendStatus.succeeded,
        responsePayload: response,
      });
      return { success: true, externalUserId: account.externalUserId };
    } catch (error) {
      await this.saveLog("feishu", account, message, {
        sendStatus: ExternalMessageSendStatus.failed,
        errorMessage: error?.message || "飞书测试消息发送失败",
      });
      throw error;
    }
  }

  async syncFeishuAccount(
    userId: string,
    config?: ExternalNotifyConfig,
  ): Promise<UserExternalAccount | null> {
    const runtimeConfig =
      config ||
      (await this.systemConfigsService.getExternalNotifyRuntimeConfig());
    if (!this.feishuProvider.isEnabled(runtimeConfig)) return null;
    const user = await this.userRepository.findOne({
      where: { id: String(userId), isDelete: null as any } as any,
    });
    if (!user) return null;
    const email = String(user.email || "").trim();
    const mobile = String(user.phone || "").trim();
    if (!email && !mobile) return null;

    const matchedUsers = await this.feishuProvider.batchGetUserId(
      {
        emails: email ? [email] : [],
        mobiles: mobile ? [mobile] : [],
      },
      runtimeConfig,
    );
    const matchedUser = this.pickMatchedFeishuUser(matchedUsers, {
      email,
      mobile,
    });
    if (!matchedUser?.user_id) return null;

    return this.externalAccountsService.upsertManualAccount({
      userId: user.id,
      platform: ExternalAccountPlatform.feishu,
      externalUserId: matchedUser.user_id,
      openId: matchedUser.open_id || "",
      unionId: matchedUser.union_id || "",
      name: matchedUser.name || matchedUser.en_name || "",
      email: matchedUser.email || email,
      mobile: matchedUser.mobile || mobile,
      bindStatus: ExternalAccountBindStatus.bound,
      bindSource: "sync",
      lastSyncTime: new Date().toISOString(),
      extraData: matchedUser,
    });
  }

  async syncFeishuAccounts(options: { limit?: number } = {}) {
    const limit = Math.min(Number(options.limit || 200), 1000);
    const users = await this.userRepository.find({
      where: { isDelete: null as any } as any,
      select: ["id", "email", "phone"] as any,
      take: limit,
      order: { createTime: "DESC" as any },
    });
    const result = {
      total: users.length,
      synced: 0,
      skipped: 0,
      failed: 0,
      failures: [] as Array<{ userId: string; message: string }>,
    };
    const config =
      await this.systemConfigsService.getExternalNotifyRuntimeConfig();
    for (const user of users) {
      try {
        const account = await this.syncFeishuAccount(user.id, config);
        if (account?.externalUserId) {
          result.synced += 1;
        } else {
          result.skipped += 1;
        }
      } catch (error) {
        result.failed += 1;
        result.failures.push({
          userId: user.id,
          message: error?.message || "同步失败",
        });
      }
    }
    return result;
  }

  async listLogs(query: {
    pageNum?: number;
    pageSize?: number;
    platform?: string;
    sendStatus?: string;
    receiverId?: string;
    templateKey?: string;
  }) {
    const pageNum = Number(query.pageNum || 1);
    const pageSize = Number(query.pageSize || 10);
    const qb = this.logRepository
      .createQueryBuilder("log")
      .where("log.isDelete IS NULL");

    if (query.platform) {
      qb.andWhere("log.platform = :platform", {
        platform: String(query.platform),
      });
    }
    if (query.sendStatus) {
      qb.andWhere("log.sendStatus = :sendStatus", {
        sendStatus: String(query.sendStatus),
      });
    }
    if (query.receiverId) {
      qb.andWhere("log.receiverId = :receiverId", {
        receiverId: String(query.receiverId),
      });
    }
    if (query.templateKey) {
      qb.andWhere("log.templateKey = :templateKey", {
        templateKey: String(query.templateKey),
      });
    }

    qb.orderBy("log.createTime", "DESC");
    qb.skip((pageNum - 1) * pageSize).take(pageSize);
    const [data, total] = await qb.getManyAndCount();
    return { data, total, _flag: true };
  }

  private pickMatchedFeishuUser(
    users: any[],
    query: { email?: string; mobile?: string },
  ) {
    const normalizedEmail = String(query.email || "").toLowerCase();
    const normalizedMobile = String(query.mobile || "");
    return (
      users.find(
        (user) =>
          normalizedEmail &&
          String(user.email || "").toLowerCase() === normalizedEmail,
      ) ||
      users.find(
        (user) =>
          normalizedMobile && String(user.mobile || "") === normalizedMobile,
      ) ||
      users[0]
    );
  }
}
