import { Injectable } from "@nestjs/common";
import { firstValueFrom } from "rxjs";
import { HttpService } from "src/common/http/service";
import { UserExternalAccount } from "src/modules/external-accounts/entity";
import {
  ExternalNotifyConfig,
  ExternalNotifyProvider,
  NotifyMessage,
} from "../provider.interface";

type FeishuTenantTokenCache = {
  token: string;
  expiresAt: number;
  cacheKey: string;
};

@Injectable()
export class FeishuNotifyProvider implements ExternalNotifyProvider {
  readonly platform = "feishu";
  private tokenCache: FeishuTenantTokenCache | null = null;

  constructor(private readonly httpService: HttpService) {}

  isEnabled(config?: ExternalNotifyConfig) {
    const feishuConfig = this.resolveFeishuConfig(config);
    return (
      Boolean(config?.enabled ?? process.env.FEISHU_ENABLED === "true") &&
      feishuConfig.enabled &&
      Boolean(feishuConfig.appId) &&
      Boolean(feishuConfig.appSecret)
    );
  }

  private resolveFeishuConfig(config?: ExternalNotifyConfig) {
    return config?.feishu || {
      enabled: process.env.FEISHU_ENABLED === "true",
      appId: process.env.FEISHU_APP_ID || "",
      appSecret: process.env.FEISHU_APP_SECRET || "",
      baseUrl: process.env.FEISHU_BASE_URL || "https://open.feishu.cn",
    };
  }

  private getBaseUrl(config?: ExternalNotifyConfig) {
    return this.resolveFeishuConfig(config).baseUrl || "https://open.feishu.cn";
  }

  private getCacheKey(config?: ExternalNotifyConfig) {
    const feishuConfig = this.resolveFeishuConfig(config);
    return [feishuConfig.appId, feishuConfig.baseUrl].join("|");
  }

  async getTenantAccessToken(config?: ExternalNotifyConfig) {
    const feishuConfig = this.resolveFeishuConfig(config);
    const cacheKey = this.getCacheKey(config);
    const now = Date.now();
    if (
      this.tokenCache &&
      this.tokenCache.cacheKey === cacheKey &&
      this.tokenCache.expiresAt > now + 60_000
    ) {
      return this.tokenCache.token;
    }
    const response = await firstValueFrom(
      await this.httpService.post(
        `${this.getBaseUrl(config)}/open-apis/auth/v3/tenant_access_token/internal`,
        {
          app_id: feishuConfig.appId,
          app_secret: feishuConfig.appSecret,
        },
      ),
    );
    const data = response?.data || {};
    if (data.code !== 0 || !data.tenant_access_token) {
      throw new Error(data.msg || "获取飞书 tenant_access_token 失败");
    }
    this.tokenCache = {
      token: data.tenant_access_token,
      expiresAt: now + Number(data.expire || 7200) * 1000,
      cacheKey,
    };
    return this.tokenCache.token;
  }

  async sendText(
    account: UserExternalAccount,
    message: NotifyMessage,
    config?: ExternalNotifyConfig,
  ) {
    if (!account.externalUserId) {
      throw new Error("飞书用户ID为空");
    }
    const token = await this.getTenantAccessToken(config);
    const text = [message.title, message.content, message.linkUrl || ""]
      .filter(Boolean)
      .join("\n");
    const response = await firstValueFrom(
      await this.httpService.post(
        `${this.getBaseUrl(config)}/open-apis/im/v1/messages`,
        {
          receive_id: account.externalUserId,
          msg_type: "text",
          content: JSON.stringify({ text }),
        },
        {
          params: { receive_id_type: "user_id" },
          headers: { Authorization: `Bearer ${token}` },
        },
      ),
    );
    const data = response?.data || {};
    if (data.code !== 0) {
      throw new Error(data.msg || "发送飞书消息失败");
    }
    return data;
  }

  async batchGetUserId(
    query: { emails?: string[]; mobiles?: string[] },
    config?: ExternalNotifyConfig,
  ) {
    const token = await this.getTenantAccessToken(config);
    const response = await firstValueFrom(
      await this.httpService.post(
        `${this.getBaseUrl(config)}/open-apis/contact/v3/users/batch_get_id`,
        {
          emails: query.emails?.filter(Boolean) || [],
          mobiles: query.mobiles?.filter(Boolean) || [],
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      ),
    );
    const data = response?.data || {};
    if (data.code !== 0) {
      throw new Error(data.msg || "获取飞书用户ID失败");
    }
    return data?.data?.user_list || data?.data?.users || [];
  }
}
