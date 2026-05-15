import { Injectable } from "@nestjs/common";
import { firstValueFrom } from "rxjs";
import { HttpService } from "src/common/http/service";
import { UserExternalAccount } from "src/modules/external-accounts/entity";
import { ExternalNotifyProvider, NotifyMessage } from "../provider.interface";

type FeishuTenantTokenCache = {
  token: string;
  expiresAt: number;
};

@Injectable()
export class FeishuNotifyProvider implements ExternalNotifyProvider {
  readonly platform = "feishu";
  private tokenCache: FeishuTenantTokenCache | null = null;

  constructor(private readonly httpService: HttpService) {}

  isEnabled() {
    return (
      process.env.FEISHU_ENABLED === "true" &&
      Boolean(process.env.FEISHU_APP_ID) &&
      Boolean(process.env.FEISHU_APP_SECRET)
    );
  }

  private getBaseUrl() {
    return process.env.FEISHU_BASE_URL || "https://open.feishu.cn";
  }

  async getTenantAccessToken() {
    const now = Date.now();
    if (this.tokenCache && this.tokenCache.expiresAt > now + 60_000) {
      return this.tokenCache.token;
    }
    const response = await firstValueFrom(
      await this.httpService.post(
        `${this.getBaseUrl()}/open-apis/auth/v3/tenant_access_token/internal`,
        {
          app_id: process.env.FEISHU_APP_ID,
          app_secret: process.env.FEISHU_APP_SECRET,
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
    };
    return this.tokenCache.token;
  }

  async sendText(account: UserExternalAccount, message: NotifyMessage) {
    if (!account.externalUserId) {
      throw new Error("飞书用户ID为空");
    }
    const token = await this.getTenantAccessToken();
    const text = [message.title, message.content, message.linkUrl || ""]
      .filter(Boolean)
      .join("\n");
    const response = await firstValueFrom(
      await this.httpService.post(
        `${this.getBaseUrl()}/open-apis/im/v1/messages`,
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
}
