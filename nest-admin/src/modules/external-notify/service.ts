import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { In, LessThan, Repository } from "typeorm";
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
  WorkflowTodoCardStatusOptions,
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
    const notifyMessage = {
      ...message,
      notificationId: message.notificationId || this.generateNotificationId(),
    };
    const config =
      await this.systemConfigsService.getExternalNotifyRuntimeConfig();
    await Promise.all(
      this.providers
        .filter((provider) =>
          provider.isEnabled(config as ExternalNotifyConfig),
        )
        .map((provider) =>
          this.sendByProvider(provider, userId, notifyMessage, config),
        ),
    );
  }

  async updateWorkflowTodoCardStatus(options: {
    messages: Array<NotifyMessage & { id?: string }>;
    status: WorkflowTodoCardStatusOptions["status"];
    statusText?: string;
  }) {
    const messages = (options.messages || []).filter(Boolean);
    const messageIds = messages
      .map((message) => String(message.messageId || message.id || ""))
      .filter(Boolean);
    if (!messageIds.length) return;

    const config =
      await this.systemConfigsService.getExternalNotifyRuntimeConfig();
    if (!this.feishuProvider.isEnabled(config)) return;

    const logs = await this.logRepository.find({
      where: {
        platform: "feishu",
        templateKey: "workflowTodo",
        sendStatus: ExternalMessageSendStatus.succeeded,
        messageId: In(messageIds) as any,
        isDelete: null as any,
      } as any,
      order: { createTime: "DESC" as any },
    });
    const feishuMessageIdMap = new Map<string, string>();
    logs.forEach((log) => {
      const messageId = String(log.messageId || "");
      if (!messageId || feishuMessageIdMap.has(messageId)) return;
      const feishuMessageId = this.getFeishuMessageId(log.responsePayload);
      if (feishuMessageId) {
        feishuMessageIdMap.set(messageId, feishuMessageId);
      }
    });
    await Promise.all(
      messages.map(async (message) => {
        const messageId = String(message.messageId || message.id || "");
        const feishuMessageId = feishuMessageIdMap.get(messageId);
        if (!feishuMessageId) {
          await this.savePendingWorkflowTodoStatusLog(message, options);
          return;
        }
        const notifyMessage = this.normalizeMessageForProvider(
          {
            ...message,
            messageId,
            receiverId: message.receiverId,
            templateKey: "workflowTodo",
          },
          config,
          "feishu",
        );
        try {
          await this.feishuProvider.updateWorkflowTodoCard?.(
            feishuMessageId,
            notifyMessage,
            {
              status: options.status,
              statusText: options.statusText,
            },
            config,
          );
          await this.saveWorkflowTodoStatusLog({
            message,
            messageId,
            feishuMessageId,
            status: options.status,
            statusText: options.statusText,
            sendStatus: ExternalMessageSendStatus.succeeded,
            responsePayload: { externalMessageId: feishuMessageId },
          });
        } catch (error) {
          await this.saveWorkflowTodoStatusLog({
            message,
            messageId,
            feishuMessageId,
            status: options.status,
            statusText: options.statusText,
            sendStatus: ExternalMessageSendStatus.failed,
            errorMessage: error?.message || "更新飞书卡片状态失败",
          });
        }
      }),
    );
  }

  private async saveWorkflowTodoStatusLog(options: {
    message: NotifyMessage & { id?: string };
    messageId: string;
    feishuMessageId?: string;
    status: WorkflowTodoCardStatusOptions["status"];
    statusText?: string;
    sendStatus: ExternalMessageSendStatus;
    responsePayload?: Record<string, any>;
    errorMessage?: string;
  }) {
    const message = options.message;
    await this.logRepository.save({
      platform: "feishu",
      notificationId: message.notificationId || this.generateNotificationId(),
      operationType: "update_card_status",
      messageId: options.messageId,
      externalMessageId: options.feishuMessageId || "",
      receiverId: message.receiverId,
      templateKey: "workflowTodoStatus",
      requestPayload: {
        sourceType: message.sourceType,
        sourceId: message.sourceId,
        status: options.status,
        statusText: options.statusText,
      },
      responsePayload: options.responsePayload,
      sendStatus: options.sendStatus,
      errorMessage: options.errorMessage,
    } as any);
  }

  private async savePendingWorkflowTodoStatusLog(
    message: NotifyMessage & { id?: string },
    options: {
      status: WorkflowTodoCardStatusOptions["status"];
      statusText?: string;
    },
  ) {
    const messageId = String(message.messageId || message.id || "");
    await this.logRepository.save({
      platform: "feishu",
      notificationId: message.notificationId || this.generateNotificationId(),
      operationType: "update_card_status",
      messageId,
      receiverId: message.receiverId,
      templateKey: "workflowTodoStatus",
      requestPayload: {
        title: message.title,
        content: message.content,
        linkUrl: message.linkUrl,
        linkParams: message.linkParams,
        extraData: message.extraData || {},
        sourceType: message.sourceType,
        sourceId: message.sourceId,
        status: options.status,
        statusText: options.statusText,
      },
      sendStatus: ExternalMessageSendStatus.pending,
      retryCount: 0,
      nextRetryTime: new Date().toISOString(),
    } as any);
  }

  async retryPendingWorkflowTodoCardStatuses(options: { limit?: number } = {}) {
    const limit = Math.min(Math.max(Number(options.limit || 50), 1), 200);
    const now = new Date().toISOString();
    const pendingLogs = await this.logRepository.find({
      where: {
        platform: "feishu",
        operationType: "update_card_status",
        templateKey: "workflowTodoStatus",
        sendStatus: ExternalMessageSendStatus.pending,
        nextRetryTime: LessThan(now),
        isDelete: null as any,
      } as any,
      order: { createTime: "ASC" as any },
      take: limit,
    });
    const result = {
      processedCount: pendingLogs.length,
      successCount: 0,
      failedCount: 0,
      skippedCount: 0,
    };
    if (!pendingLogs.length) return result;

    const config =
      await this.systemConfigsService.getExternalNotifyRuntimeConfig();
    if (!this.feishuProvider.isEnabled(config)) return result;

    const messageIds = pendingLogs
      .map((log) => String(log.messageId || ""))
      .filter(Boolean);
    const sendLogs = await this.logRepository.find({
      where: {
        platform: "feishu",
        operationType: "send_card",
        templateKey: "workflowTodo",
        messageId: In(messageIds) as any,
        sendStatus: ExternalMessageSendStatus.succeeded,
        isDelete: null as any,
      } as any,
      order: { createTime: "DESC" as any },
    });
    const sendLogMap = new Map<string, ExternalMessageLog>();
    sendLogs.forEach((log) => {
      const key = String(log.messageId || "");
      if (key && !sendLogMap.has(key)) sendLogMap.set(key, log);
    });

    for (const pendingLog of pendingLogs) {
      const sendLog = sendLogMap.get(String(pendingLog.messageId || ""));
      const feishuMessageId =
        pendingLog.externalMessageId ||
        sendLog?.externalMessageId ||
        this.getFeishuMessageId(sendLog?.responsePayload);
      if (!feishuMessageId) {
        await this.deferPendingLog(pendingLog);
        result.skippedCount += 1;
        continue;
      }
      try {
        const payload = pendingLog.requestPayload || {};
        await this.feishuProvider.updateWorkflowTodoCard?.(
          feishuMessageId,
          this.normalizeMessageForProvider(
            {
              notificationId: pendingLog.notificationId,
              messageId: pendingLog.messageId,
              receiverId: pendingLog.receiverId,
              templateKey: "workflowTodo",
              title: payload.title || "审批待办",
              content: payload.content || "",
              linkUrl: payload.linkUrl || "",
              linkParams: payload.linkParams || {},
              extraData: payload.extraData || {},
            },
            config,
            "feishu",
          ),
          {
            status: payload.status || "cancelled",
            statusText: payload.statusText || "已失效",
          },
          config,
        );
        await this.logRepository.update(pendingLog.id, {
          sendStatus: ExternalMessageSendStatus.succeeded,
          externalMessageId: feishuMessageId,
          lastRetryTime: now,
          responsePayload: { externalMessageId: feishuMessageId },
        } as any);
        result.successCount += 1;
      } catch (error) {
        await this.markPendingLogFailedOrDeferred(pendingLog, error);
        result.failedCount += 1;
      }
    }
    return result;
  }

  private async deferPendingLog(log: ExternalMessageLog) {
    const retryCount = Number(log.retryCount || 0) + 1;
    await this.logRepository.update(log.id, {
      retryCount,
      lastRetryTime: new Date().toISOString(),
      nextRetryTime: new Date(Date.now() + 60_000).toISOString(),
    } as any);
  }

  private async markPendingLogFailedOrDeferred(
    log: ExternalMessageLog,
    error: any,
  ) {
    const retryCount = Number(log.retryCount || 0) + 1;
    const reachedLimit = retryCount >= 10;
    await this.logRepository.update(log.id, {
      retryCount,
      lastRetryTime: new Date().toISOString(),
      nextRetryTime: reachedLimit
        ? null
        : new Date(Date.now() + 60_000).toISOString(),
      sendStatus: reachedLimit
        ? ExternalMessageSendStatus.failed
        : ExternalMessageSendStatus.pending,
      errorMessage: error?.message || "更新飞书卡片状态失败",
    } as any);
  }

  async cleanupDeliveryLogs(
    options: { succeededDays?: number; failedDays?: number } = {},
  ) {
    const succeededDays = Math.max(Number(options.succeededDays || 90), 1);
    const failedDays = Math.max(Number(options.failedDays || 180), 1);
    const succeededBefore = new Date(
      Date.now() - succeededDays * 24 * 60 * 60 * 1000,
    ).toISOString();
    const failedBefore = new Date(
      Date.now() - failedDays * 24 * 60 * 60 * 1000,
    ).toISOString();
    const result = await this.logRepository.update(
      [
        {
          sendStatus: ExternalMessageSendStatus.succeeded,
          createTime: LessThan(succeededBefore),
          isDelete: null,
        } as any,
        {
          sendStatus: ExternalMessageSendStatus.skipped,
          createTime: LessThan(succeededBefore),
          isDelete: null,
        } as any,
        {
          sendStatus: ExternalMessageSendStatus.failed,
          createTime: LessThan(failedBefore),
          isDelete: null,
        } as any,
      ],
      { isDelete: "1" } as any,
    );
    return {
      processedCount: Number(result?.affected || 0),
      successCount: Number(result?.affected || 0),
      failedCount: 0,
    };
  }

  private getFeishuMessageId(responsePayload?: Record<string, any>) {
    return String(
      responsePayload?.data?.message_id ||
        responsePayload?.data?.messageId ||
        responsePayload?.message_id ||
        "",
    );
  }

  private generateNotificationId() {
    return `ntf_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
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
      const response = await provider.sendText(
        account,
        this.normalizeMessageForProvider(message, config, provider.platform),
        config,
      );
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

  private buildAbsoluteLink(
    linkUrl?: string,
    linkParams?: Record<string, any>,
    config?: ExternalNotifyConfig,
  ) {
    if (!linkUrl) return "";
    if (/^https?:\/\//i.test(linkUrl)) return linkUrl;
    const siteUrl = String((config as any)?.siteUrl || "").trim();
    if (!siteUrl) return linkUrl;
    const normalizedBase = siteUrl.replace(/\/+$/, "");
    const normalizedPath = linkUrl.startsWith("/") ? linkUrl : `/${linkUrl}`;
    const query = new URLSearchParams();
    Object.entries(linkParams || {}).forEach(([key, value]) => {
      if (value === undefined || value === null || value === "") return;
      query.set(key, String(value));
    });
    const queryString = query.toString();
    return `${normalizedBase}${normalizedPath}${queryString ? `?${queryString}` : ""}`;
  }

  private normalizeMessageForProvider(
    message: NotifyMessage,
    config: ExternalNotifyConfig,
    platform?: string,
  ) {
    const linkUrl = this.buildAbsoluteLink(
      message.linkUrl,
      message.linkParams,
      config,
    );
    return {
      ...message,
      linkUrl:
        platform === "feishu" && message.templateKey === "workflowTodo"
          ? this.buildFeishuLoginLink(linkUrl, config)
          : linkUrl,
    };
  }

  private buildFeishuLoginLink(
    targetUrl: string,
    config?: ExternalNotifyConfig,
  ) {
    if (!targetUrl) return "";
    const siteUrl = String((config as any)?.siteUrl || "").trim();
    if (!siteUrl) return targetUrl;
    const normalizedBase = siteUrl.replace(/\/+$/, "");
    return `${normalizedBase}/api/auth/feishu/login?redirect=${encodeURIComponent(
      targetUrl,
    )}`;
  }

  private async saveLog(
    platform: string,
    account: UserExternalAccount | null,
    message: NotifyMessage,
    result: Partial<ExternalMessageLog>,
  ) {
    await this.logRepository.save({
      platform,
      notificationId: message.notificationId || this.generateNotificationId(),
      operationType: this.getOperationType(platform, message),
      messageId: message.messageId || "",
      externalMessageId: this.getExternalMessageId(platform, result),
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

  async saveSystemMessageLog(message: NotifyMessage & { id?: string }) {
    await this.logRepository.save({
      platform: "system",
      notificationId: message.notificationId || this.generateNotificationId(),
      operationType: "create_message",
      messageId: message.messageId || message.id || "",
      receiverId: message.receiverId,
      templateKey: message.templateKey || message.messageType || "",
      requestPayload: {
        title: message.title,
        content: message.content,
        sourceType: message.sourceType,
        sourceId: message.sourceId,
        linkUrl: message.linkUrl,
        linkParams: message.linkParams,
      },
      responsePayload: { messageId: message.messageId || message.id || "" },
      sendStatus: ExternalMessageSendStatus.succeeded,
    } as any);
  }

  private getOperationType(platform: string, message: NotifyMessage) {
    if (platform === "system") return "create_message";
    if (message.templateKey === "workflowTodo") return "send_card";
    return "send_text";
  }

  private getExternalMessageId(
    platform: string,
    result: Partial<ExternalMessageLog>,
  ) {
    if (platform !== "feishu") return "";
    return this.getFeishuMessageId(result.responsePayload);
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
      (await this.syncFeishuAccount(userId, config)) ||
      (await this.externalAccountsService.getActiveAccount(
        userId,
        ExternalAccountPlatform.feishu,
      ));
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

  async diagnoseFeishuConfig(userId: string) {
    const steps: Array<{
      key: string;
      label: string;
      success: boolean;
      message: string;
      data?: Record<string, any>;
    }> = [];
    const addStep = (
      key: string,
      label: string,
      success: boolean,
      message: string,
      data?: Record<string, any>,
    ) => {
      steps.push({ key, label, success, message, data });
    };

    const config =
      await this.systemConfigsService.getExternalNotifyRuntimeConfig();
    const feishuConfig = config?.feishu || {};
    const configOk = Boolean(
      config?.enabled &&
        feishuConfig.enabled &&
        feishuConfig.appId &&
        feishuConfig.appSecret,
    );
    addStep(
      "config",
      "配置完整性",
      configOk,
      configOk
        ? "飞书配置已启用且 AppId/AppSecret 完整"
        : "飞书通知未启用或配置不完整",
      {
        enabled: Boolean(config?.enabled),
        feishuEnabled: Boolean(feishuConfig.enabled),
        hasAppId: Boolean(feishuConfig.appId),
        hasAppSecret: Boolean(feishuConfig.appSecret),
        baseUrl: feishuConfig.baseUrl || "",
      },
    );
    if (!configOk) {
      return { success: false, steps };
    }

    try {
      await this.feishuProvider.getTenantAccessToken(config);
      addStep("tenantToken", "应用凭证", true, "tenant_access_token 获取成功");
    } catch (error) {
      addStep(
        "tenantToken",
        "应用凭证",
        false,
        error?.message || "tenant_access_token 获取失败",
      );
      return { success: false, steps };
    }

    const user = await this.userRepository.findOne({
      where: { id: String(userId), isDelete: null as any } as any,
    });
    if (!user) {
      addStep("userMatch", "用户匹配", false, "系统用户不存在");
      addStep("cardSend", "卡片发送", false, "系统用户不存在，跳过发送检查");
      return { success: false, steps };
    }
    const email = String(user.email || "").trim();
    const mobile = String(user.phone || "").trim();
    if (!email && !mobile) {
      addStep("userMatch", "用户匹配", false, "系统用户缺少邮箱和手机号");
      addStep("cardSend", "卡片发送", false, "缺少用户匹配条件，跳过发送检查");
      return { success: false, steps };
    }

    let matchedUser: any = null;
    try {
      const matchedUsers = await this.feishuProvider.batchGetUserId(
        {
          emails: email ? [email] : [],
          mobiles: mobile ? [mobile] : [],
        },
        config,
      );
      matchedUser = this.pickMatchedFeishuUser(matchedUsers, { email, mobile });
      if (matchedUser?.user_id) {
        addStep("userMatch", "用户匹配", true, "已匹配到飞书 UserID", {
          userId: matchedUser.user_id,
          email: matchedUser.email || email,
          mobile: matchedUser.mobile || mobile,
        });
      } else {
        addStep("userMatch", "用户匹配", false, "未匹配到飞书用户", {
          email,
          mobile,
        });
        addStep(
          "cardSend",
          "卡片发送",
          false,
          "未匹配到飞书用户，跳过发送检查",
        );
        return { success: false, steps };
      }
    } catch (error) {
      addStep(
        "userMatch",
        "用户匹配",
        false,
        error?.message || "获取飞书 UserID 失败",
      );
      addStep("cardSend", "卡片发送", false, "用户匹配失败，跳过发送检查");
      return { success: false, steps };
    }

    let userDetail: any = {};
    try {
      userDetail =
        (await this.feishuProvider.getUserDetail(
          matchedUser.user_id,
          config,
        )) || {};
      addStep("userDetail", "用户详情", true, "飞书用户详情获取成功", {
        userId: userDetail.user_id || matchedUser.user_id,
        openId: userDetail.open_id || "",
        unionId: userDetail.union_id || "",
        name: userDetail.name || userDetail.en_name || "",
      });
    } catch (error) {
      addStep(
        "userDetail",
        "用户详情",
        false,
        error?.message || "飞书用户详情获取失败",
      );
    }

    try {
      await this.feishuProvider.sendText(
        {
          externalUserId: matchedUser.user_id,
        } as any,
        {
          receiverId: String(userId),
          templateKey: "workflowTodo",
          title: "飞书配置自检",
          content: "这是一条飞书配置自检卡片，用于验证机器人消息能力。",
          linkUrl:
            this.buildAbsoluteLink("/", {}, config) || "https://open.feishu.cn",
          extraData: {
            businessLabel: "系统配置",
            nodeName: "飞书配置自检",
            starterName: "系统",
          },
        },
        config,
      );
      addStep("cardSend", "卡片发送", true, "飞书卡片发送成功");
    } catch (error) {
      addStep(
        "cardSend",
        "卡片发送",
        false,
        error?.message || "飞书卡片发送失败",
      );
    }

    return {
      success: steps.every((step) => step.success),
      steps,
    };
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
    const userDetail =
      (await this.feishuProvider.getUserDetail(
        matchedUser.user_id,
        runtimeConfig,
      )) || {};
    const feishuUser = {
      ...matchedUser,
      ...userDetail,
    };

    return this.externalAccountsService.upsertManualAccount({
      userId: user.id,
      platform: ExternalAccountPlatform.feishu,
      externalUserId: feishuUser.user_id,
      openId: feishuUser.open_id || "",
      unionId: feishuUser.union_id || "",
      name: feishuUser.name || feishuUser.en_name || "",
      email: feishuUser.email || email,
      mobile: feishuUser.mobile || mobile,
      bindStatus: ExternalAccountBindStatus.bound,
      bindSource: "sync",
      lastSyncTime: new Date().toISOString(),
      extraData: feishuUser,
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
    notificationId?: string;
    operationType?: string;
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
    if (query.notificationId) {
      qb.andWhere("log.notificationId = :notificationId", {
        notificationId: String(query.notificationId),
      });
    }
    if (query.operationType) {
      qb.andWhere("log.operationType = :operationType", {
        operationType: String(query.operationType),
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
