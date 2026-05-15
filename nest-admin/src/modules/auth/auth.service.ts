import {
  ForbiddenException,
  Injectable,
  Optional,
  SetMetadata,
  UnauthorizedException,
} from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { Response } from "express";

import { UsersService } from "../users/users.service";
import { RolesService } from "../roles/service";
import { LoginLogsService } from "../loginLogs/service";
import { BoolNum } from "src/common/type/base";
import { RedisService } from "../global/redis.service";
import { SystenConfigsService } from "../configs/service";
import dayjs from "dayjs";
import { CaptchaService } from "../common/captcha.service";
import { getIpAddress } from "../../common/utils/common";
import { verifyPassword } from "src/common/utils/password";
import { ExternalAccountPlatform } from "../external-accounts/entity";
import { UserExternalAccountsService } from "../external-accounts/service";
import { FeishuNotifyProvider } from "../external-notify/providers/feishu.provider";

import { config } from "config";
export const Public = () => SetMetadata(config.isPublicKey, true);

const sessionCookieName = "admin_session";

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private rolesService: RolesService,
    private jwtService: JwtService,
    private loginLogsService: LoginLogsService,
    private redisService: RedisService,
    private systemConfigsService: SystenConfigsService,
    private captchaService: CaptchaService,
    @Optional()
    private externalAccountsService?: UserExternalAccountsService,
    @Optional()
    private feishuProvider?: FeishuNotifyProvider,
  ) {}
  async login(req, res: Response): Promise<{ success: boolean }> {
    let user: any = {};
    let body: any = req.body || {};

    try {
      if (!body.account) {
        throw new Error("账号不能为空");
      }
      if (!body.password) {
        throw new Error("密码不能为空");
      }

      let result = this.captchaService.validateCaptcha(body.uuid, body.code);
      if (result !== "true") {
        throw new Error(result);
      }

      user = await this.usersService.getOne({ name: body.account });
      await this.rolesService.getUserMenus(user);

      if (!(await verifyPassword(body.password, user?.password))) {
        throw new Error("密码错误");
      }
    } catch (error) {
      let log = {
        isSuccess: BoolNum.No,
        msg: error.message,
        ...body,
      };
      await this.loginLogsService.createLog(req, log);
      throw error;
    }
    await this.createAuthenticatedSession(req, res, user, body);

    return {
      success: true,
    };
  }

  async getFeishuLoginUrl(redirect?: string) {
    const runtimeConfig =
      await this.systemConfigsService.getExternalNotifyRuntimeConfig();
    if (!this.feishuProvider?.isEnabled(runtimeConfig)) {
      throw new UnauthorizedException("飞书登录未启用或配置不完整");
    }
    const normalizedRedirect = this.normalizeRedirectUrl(
      redirect,
      runtimeConfig?.siteUrl,
    );
    const state = await this.jwtService.signAsync(
      {
        redirect: normalizedRedirect,
        source: "feishu",
      },
      {
        secret: config.jwtSecret,
        expiresIn: "10m",
      },
    );
    return this.feishuProvider.buildOAuthAuthorizeUrl(
      {
        redirectUri: this.buildSiteApiUrl(
          "/auth/feishu/callback",
          runtimeConfig?.siteUrl,
        ),
        state,
      },
      runtimeConfig,
    );
  }

  async loginWithFeishuCode(
    req: Record<string, any>,
    res: Response,
    options: { code?: string; state?: string },
  ) {
    if (!options.code || !options.state) {
      throw new UnauthorizedException("飞书授权参数不完整");
    }
    if (!this.feishuProvider || !this.externalAccountsService) {
      throw new UnauthorizedException("飞书登录服务未启用");
    }
    const runtimeConfig =
      await this.systemConfigsService.getExternalNotifyRuntimeConfig();
    if (!this.feishuProvider.isEnabled(runtimeConfig)) {
      throw new UnauthorizedException("飞书登录未启用或配置不完整");
    }
    const state = await this.jwtService.verifyAsync(options.state, {
      secret: config.jwtSecret,
    });
    const redirect = this.normalizeRedirectUrl(
      state?.redirect,
      runtimeConfig?.siteUrl,
    );
    const feishuUser = await this.feishuProvider.getOAuthUser(
      options.code,
      runtimeConfig,
    );
    const account =
      await this.externalAccountsService.findActiveAccountByExternalIdentity(
        ExternalAccountPlatform.feishu,
        {
          externalUserId: feishuUser.externalUserId,
          openId: feishuUser.openId,
          unionId: feishuUser.unionId,
        },
      );
    if (!account?.userId) {
      throw new UnauthorizedException("飞书账号未绑定系统用户");
    }
    const user = await this.usersService.getOne({ id: account.userId });
    await this.rolesService.getUserMenus(user);
    await this.createAuthenticatedSession(req, res, user, {
      account: user?.name,
      loginType: "feishu",
      externalUserId: feishuUser.externalUserId,
      openId: feishuUser.openId,
    });
    return { redirect };
  }

  private async createAuthenticatedSession(
    req: Record<string, any>,
    res: Response,
    user: Record<string, any>,
    logParams: Record<string, any> = {},
  ) {
    let { password: _, ...result } = user;
    let address = await getIpAddress(
      req.headers?.["x-forwarded-for"] || req.connection?.remoteAddress,
    );

    const { permissions: _permissions, ...resultWithoutPermissions } = result;

    const payload = {
      sub: user.id,
      account: user.name,
      address,
      loginTime: dayjs().format("YYYY-MM-DD HH:mm:ss"),
      ...resultWithoutPermissions,
    };
    const sessionExpireMinutes =
      await this.systemConfigsService.getSessionExpireMinutes();
    let accessToken = await this.jwtService.signAsync(payload, {
      secret: config.jwtSecret,
      expiresIn: `${sessionExpireMinutes}m`,
    });

    let log = await this.loginLogsService.createLog(req, {
      session: accessToken.split(".").at(-1),
      loginTime: payload.loginTime,
      address,
      ...logParams,
    });

    await this.redisService.setRedisOnlineUser(
      log,
      undefined,
      sessionExpireMinutes * 60,
    );
    this.setSessionCookie(res, accessToken, sessionExpireMinutes);
  }

  private normalizeRedirectUrl(redirect?: string, siteUrl?: string) {
    const normalizedSiteUrl = String(siteUrl || "").replace(/\/+$/, "");
    if (!redirect) return normalizedSiteUrl || "/";
    try {
      const parsedRedirect = new URL(redirect, normalizedSiteUrl || undefined);
      if (normalizedSiteUrl) {
        const site = new URL(normalizedSiteUrl);
        if (parsedRedirect.origin !== site.origin) {
          return normalizedSiteUrl;
        }
        return parsedRedirect.toString();
      }
      return `${parsedRedirect.pathname}${parsedRedirect.search}${parsedRedirect.hash}`;
    } catch {
      return normalizedSiteUrl || "/";
    }
  }

  private buildSiteApiUrl(path: string, siteUrl?: string) {
    const normalizedSiteUrl = String(siteUrl || "").replace(/\/+$/, "");
    const normalizedPath = path.startsWith("/") ? path : `/${path}`;
    const apiPath = `${config.apiBase || "/api"}${normalizedPath}`;
    return normalizedSiteUrl ? `${normalizedSiteUrl}${apiPath}` : apiPath;
  }

  async logout(req: Record<string, any>, isQuit = false, res?: Response) {
    let params = {};
    let session = "";
    if (isQuit) {
      this.ensureAdmin(req.user);
      session = req.body.session;
      params = { ...req.body, msg: "被强退" };
    } else {
      session = req.user.session;
      params = { ...req.user, msg: "退出登录" };
    }
    await this.loginLogsService.createLog(req, params);

    await this.redisService.delRedisOnlineUser(session);
    if (!isQuit && res) {
      this.clearSessionCookie(res);
    }
    return { success: true };
  }

  async getOnlineUsers(query): Promise<any> {
    let [data, total] = await this.redisService.getRedisOnlineUser(query);
    return { total, data, _flag: true };
  }

  ensureAdmin(user: Record<string, any>) {
    const hasAdminRole = user?.roles?.some(
      (role: { permissionKey?: string }) =>
        role?.permissionKey === config.adminKey,
    );
    if (!hasAdminRole) {
      throw new ForbiddenException("接口无权限");
    }
  }

  getSessionCookieName() {
    return sessionCookieName;
  }

  private setSessionCookie(
    res: Response,
    token: string,
    sessionExpireMinutes: number,
  ) {
    res.cookie(sessionCookieName, token, {
      httpOnly: true,
      sameSite: "lax",
      secure: false,
      path: "/",
      maxAge: sessionExpireMinutes * 60 * 1000,
    });
  }

  private clearSessionCookie(res: Response) {
    res.clearCookie(sessionCookieName, {
      httpOnly: true,
      sameSite: "lax",
      secure: false,
      path: "/",
    });
  }
}
