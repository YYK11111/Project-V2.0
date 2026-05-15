import { Injectable } from "@nestjs/common";
import { firstValueFrom } from "rxjs";
import { HttpService } from "src/common/http/service";
import { UserExternalAccount } from "src/modules/external-accounts/entity";
import {
  ExternalNotifyConfig,
  ExternalNotifyProvider,
  NotifyMessage,
  WorkflowTodoCardStatusOptions,
} from "../provider.interface";

type FeishuTenantTokenCache = {
  token: string;
  expiresAt: number;
  cacheKey: string;
};

type FeishuAppTokenCache = {
  token: string;
  expiresAt: number;
  cacheKey: string;
};

@Injectable()
export class FeishuNotifyProvider implements ExternalNotifyProvider {
  readonly platform = "feishu";
  private tokenCache: FeishuTenantTokenCache | null = null;
  private appTokenCache: FeishuAppTokenCache | null = null;

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
    return (
      config?.feishu || {
        enabled: process.env.FEISHU_ENABLED === "true",
        appId: process.env.FEISHU_APP_ID || "",
        appSecret: process.env.FEISHU_APP_SECRET || "",
        baseUrl: process.env.FEISHU_BASE_URL || "https://open.feishu.cn",
      }
    );
  }

  private getBaseUrl(config?: ExternalNotifyConfig) {
    return this.resolveFeishuConfig(config).baseUrl || "https://open.feishu.cn";
  }

  private getCacheKey(config?: ExternalNotifyConfig) {
    const feishuConfig = this.resolveFeishuConfig(config);
    return [feishuConfig.appId, feishuConfig.baseUrl].join("|");
  }

  private formatFeishuError(error: any, fallback: string) {
    const data = error?.response?.data || {};
    const message =
      data.msg ||
      data.message ||
      data.error?.message ||
      error?.message ||
      fallback;
    const details = [
      data.code !== undefined ? `code: ${data.code}` : "",
      error?.response?.status ? `status: ${error.response.status}` : "",
    ].filter(Boolean);
    if (!details.length) {
      return `${fallback}：${message}`;
    }
    return `${fallback}：${message}（${details.join("，")}）`;
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
    let response;
    try {
      response = await firstValueFrom(
        await this.httpService.post(
          `${this.getBaseUrl(config)}/open-apis/auth/v3/tenant_access_token/internal`,
          {
            app_id: feishuConfig.appId,
            app_secret: feishuConfig.appSecret,
          },
        ),
      );
    } catch (error) {
      throw new Error(
        this.formatFeishuError(error, "获取飞书 tenant_access_token 失败"),
      );
    }
    const data = response?.data || {};
    if (data.code !== 0 || !data.tenant_access_token) {
      throw new Error(
        this.formatFeishuError(
          { response: { data } },
          "获取飞书 tenant_access_token 失败",
        ),
      );
    }
    this.tokenCache = {
      token: data.tenant_access_token,
      expiresAt: now + Number(data.expire || 7200) * 1000,
      cacheKey,
    };
    return this.tokenCache.token;
  }

  async getAppAccessToken(config?: ExternalNotifyConfig) {
    const feishuConfig = this.resolveFeishuConfig(config);
    const cacheKey = this.getCacheKey(config);
    const now = Date.now();
    if (
      this.appTokenCache &&
      this.appTokenCache.cacheKey === cacheKey &&
      this.appTokenCache.expiresAt > now + 60_000
    ) {
      return this.appTokenCache.token;
    }
    let response;
    try {
      response = await firstValueFrom(
        await this.httpService.post(
          `${this.getBaseUrl(config)}/open-apis/auth/v3/app_access_token/internal`,
          {
            app_id: feishuConfig.appId,
            app_secret: feishuConfig.appSecret,
          },
        ),
      );
    } catch (error) {
      throw new Error(
        this.formatFeishuError(error, "获取飞书 app_access_token 失败"),
      );
    }
    const data = response?.data || {};
    if (data.code !== 0 || !data.app_access_token) {
      throw new Error(
        this.formatFeishuError(
          { response: { data } },
          "获取飞书 app_access_token 失败",
        ),
      );
    }
    this.appTokenCache = {
      token: data.app_access_token,
      expiresAt: now + Number(data.expire || 7200) * 1000,
      cacheKey,
    };
    return this.appTokenCache.token;
  }

  buildOAuthAuthorizeUrl(
    options: { redirectUri: string; state: string },
    config?: ExternalNotifyConfig,
  ) {
    const feishuConfig = this.resolveFeishuConfig(config);
    const url = new URL(`${this.getBaseUrl(config)}/open-apis/authen/v1/index`);
    url.searchParams.set("app_id", feishuConfig.appId || "");
    url.searchParams.set("redirect_uri", options.redirectUri);
    url.searchParams.set("state", options.state);
    return url.toString();
  }

  async getOAuthUser(code: string, config?: ExternalNotifyConfig) {
    if (!code) {
      throw new Error("飞书授权码为空");
    }
    const appToken = await this.getAppAccessToken(config);
    let tokenResponse;
    try {
      tokenResponse = await firstValueFrom(
        await this.httpService.post(
          `${this.getBaseUrl(config)}/open-apis/authen/v1/access_token`,
          {
            grant_type: "authorization_code",
            code,
          },
          {
            headers: { Authorization: `Bearer ${appToken}` },
          },
        ),
      );
    } catch (error) {
      throw new Error(this.formatFeishuError(error, "获取飞书用户授权失败"));
    }
    const tokenData = tokenResponse?.data || {};
    if (tokenData.code !== 0 || !tokenData.data?.access_token) {
      throw new Error(
        this.formatFeishuError(
          { response: { data: tokenData } },
          "获取飞书用户授权失败",
        ),
      );
    }

    const userAccessToken = tokenData.data.access_token;
    let userInfo = {};
    try {
      const userResponse = await firstValueFrom(
        await this.httpService.get(
          `${this.getBaseUrl(config)}/open-apis/authen/v1/user_info`,
          {},
          {
            headers: { Authorization: `Bearer ${userAccessToken}` },
          },
        ),
      );
      const data = userResponse?.data || {};
      if (data.code !== 0) {
        throw { response: { data } };
      }
      userInfo = data.data || {};
    } catch (error) {
      const fallbackUser = tokenData.data || {};
      if (!fallbackUser.user_id && !fallbackUser.open_id) {
        throw new Error(
          this.formatFeishuError(error, "获取飞书登录用户信息失败"),
        );
      }
    }

    const mergedUser = {
      ...(tokenData.data || {}),
      ...(userInfo || {}),
    } as Record<string, any>;
    return {
      externalUserId: mergedUser.user_id || "",
      openId: mergedUser.open_id || "",
      unionId: mergedUser.union_id || "",
      name: mergedUser.name || mergedUser.en_name || "",
      email: mergedUser.email || "",
      mobile: mergedUser.mobile || "",
      raw: mergedUser,
    };
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
    const payload = this.buildMessagePayload(account.externalUserId, message);
    let response;
    try {
      response = await firstValueFrom(
        await this.httpService.post(
          `${this.getBaseUrl(config)}/open-apis/im/v1/messages`,
          payload,
          {
            params: { receive_id_type: "user_id" },
            headers: { Authorization: `Bearer ${token}` },
          },
        ),
      );
    } catch (error) {
      throw new Error(this.formatFeishuError(error, "发送飞书消息失败"));
    }
    const data = response?.data || {};
    if (data.code !== 0) {
      throw new Error(
        this.formatFeishuError({ response: { data } }, "发送飞书消息失败"),
      );
    }
    return data;
  }

  private buildMessagePayload(receiveId: string, message: NotifyMessage) {
    if (message.templateKey === "workflowTodo" && message.linkUrl) {
      return {
        receive_id: receiveId,
        msg_type: "interactive",
        content: JSON.stringify(this.buildWorkflowTodoCard(message)),
      };
    }

    const text = [message.title, message.content, message.linkUrl || ""]
      .filter(Boolean)
      .join("\n");
    return {
      receive_id: receiveId,
      msg_type: "text",
      content: JSON.stringify({ text }),
    };
  }

  private buildWorkflowTodoCard(
    message: NotifyMessage,
    status?: WorkflowTodoCardStatusOptions,
  ) {
    const extraData = message.extraData || {};
    const fields = [
      ["业务对象", extraData.businessLabel],
      ["流程节点", extraData.nodeName],
      ["发起人", extraData.starterName],
      ["任务说明", message.content],
    ].filter(([, value]) => Boolean(value));
    const statusMeta = this.resolveWorkflowTodoStatus(status);
    const hasStatus = Boolean(statusMeta);

    return {
      config: { wide_screen_mode: true, update_multi: true },
      header: {
        template: statusMeta?.template || "blue",
        title: {
          tag: "plain_text",
          content: message.title || "审批待办",
        },
      },
      elements: [
        ...fields.map(([label, value]) => ({
          tag: "div",
          text: {
            tag: "lark_md",
            content: `**${label}：**${value}`,
          },
        })),
        ...(statusMeta
          ? [
              {
                tag: "div",
                text: {
                  tag: "lark_md",
                  content: `**审批状态：**${statusMeta.text}`,
                },
              },
            ]
          : []),
        {
          tag: "action",
          actions: [
            {
              tag: "button",
              text: {
                tag: "plain_text",
                content: hasStatus ? "查看详情" : "去审批",
              },
              type: hasStatus ? "default" : "primary",
              url: message.linkUrl,
            },
          ],
        },
      ],
    };
  }

  private resolveWorkflowTodoStatus(status?: WorkflowTodoCardStatusOptions) {
    if (!status?.status) return null;
    const textMap = {
      approved: status.statusText || "已同意",
      rejected: status.statusText || "已驳回",
      cancelled: status.statusText || "已失效",
    };
    const templateMap = {
      approved: "green",
      rejected: "red",
      cancelled: "grey",
    };
    return {
      text: textMap[status.status],
      template: templateMap[status.status],
    };
  }

  async updateWorkflowTodoCard(
    feishuMessageId: string,
    message: NotifyMessage,
    status: WorkflowTodoCardStatusOptions,
    config?: ExternalNotifyConfig,
  ) {
    return this.updateMessageCard(
      feishuMessageId,
      this.buildWorkflowTodoCard(message, status),
      config,
    );
  }

  async updateMessageCard(
    feishuMessageId: string,
    card: Record<string, any>,
    config?: ExternalNotifyConfig,
  ) {
    const token = await this.getTenantAccessToken(config);
    let response;
    try {
      response = await firstValueFrom(
        await this.httpService.patch(
          `${this.getBaseUrl(config)}/open-apis/im/v1/messages/${encodeURIComponent(
            feishuMessageId,
          )}`,
          {
            content: JSON.stringify(card),
          },
          {
            headers: { Authorization: `Bearer ${token}` },
          },
        ),
      );
    } catch (error) {
      throw new Error(this.formatFeishuError(error, "更新飞书消息失败"));
    }
    const data = response?.data || {};
    if (data.code !== 0) {
      throw new Error(
        this.formatFeishuError({ response: { data } }, "更新飞书消息失败"),
      );
    }
    return data;
  }

  async batchGetUserId(
    query: { emails?: string[]; mobiles?: string[] },
    config?: ExternalNotifyConfig,
  ) {
    const token = await this.getTenantAccessToken(config);
    let response;
    try {
      response = await firstValueFrom(
        await this.httpService.post(
          `${this.getBaseUrl(config)}/open-apis/contact/v3/users/batch_get_id`,
          {
            emails: query.emails?.filter(Boolean) || [],
            mobiles: query.mobiles?.filter(Boolean) || [],
          },
          {
            params: { user_id_type: "user_id" },
            headers: { Authorization: `Bearer ${token}` },
          },
        ),
      );
    } catch (error) {
      throw new Error(this.formatFeishuError(error, "获取飞书用户ID失败"));
    }
    const data = response?.data || {};
    if (data.code !== 0) {
      throw new Error(
        this.formatFeishuError({ response: { data } }, "获取飞书用户ID失败"),
      );
    }
    return data?.data?.user_list || data?.data?.users || [];
  }

  async getUserDetail(userId: string, config?: ExternalNotifyConfig) {
    if (!userId) return null;
    const token = await this.getTenantAccessToken(config);
    let response;
    try {
      response = await firstValueFrom(
        await this.httpService.get(
          `${this.getBaseUrl(config)}/open-apis/contact/v3/users/${encodeURIComponent(
            userId,
          )}`,
          { user_id_type: "user_id" },
          {
            headers: { Authorization: `Bearer ${token}` },
          },
        ),
      );
    } catch (error) {
      throw new Error(this.formatFeishuError(error, "获取飞书用户详情失败"));
    }
    const data = response?.data || {};
    if (data.code !== 0) {
      throw new Error(
        this.formatFeishuError({ response: { data } }, "获取飞书用户详情失败"),
      );
    }
    return data?.data?.user || data?.data || null;
  }
}
