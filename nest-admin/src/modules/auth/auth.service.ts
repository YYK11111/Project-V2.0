import { ForbiddenException, Injectable, SetMetadata, UnauthorizedException } from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import { Response } from 'express'

import { UsersService } from '../users/users.service'
import { RolesService } from '../roles/service'
import { LoginLogsService } from '../loginLogs/service'
import { BoolNum } from 'src/common/type/base'
import { RedisService } from '../global/redis.service'
import dayjs from 'dayjs'
import { CaptchaService } from '../common/captcha.service'
import { getIpAddress } from '../../common/utils/common'
import { verifyPassword } from 'src/common/utils/password'

import { config } from 'config'
export const Public = () => SetMetadata(config.isPublicKey, true)

const sessionCookieName = 'admin_session'

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private rolesService: RolesService,
    private jwtService: JwtService,
    private loginLogsService: LoginLogsService,
    private redisService: RedisService,
    private captchaService: CaptchaService,
  ) {}
  async login(req, res: Response): Promise<{ success: boolean }> {
    let user: any = {}
    let body: any = req.body || {}

    try {
      if (!body.account) {
        throw new Error('账号不能为空')
      }
      if (!body.password) {
        throw new Error('密码不能为空')
      }

      let result = this.captchaService.validateCaptcha(body.uuid, body.code)
      if (result !== 'true') {
        throw new Error(result)
      }

      user = await this.usersService.getOne({ name: body.account })
      if (user.roles?.some?.(role => role.permissionKey === config.adminKey)) {
        user.permissions = ['*']
      } else {
        const menus = await this.rolesService.getUserMenus(user)
        user.permissions = [...new Set(menus.flatMap((menu) => menu.permissionKey || []).filter(Boolean))]
      }

      if (!(await verifyPassword(body.password, user?.password))) {
        throw new Error('密码错误')
      }
    } catch (error) {
      let log = {
        isSuccess: BoolNum.No,
        msg: error.message,
        ...body,
      }
      await this.loginLogsService.createLog(req, log)
      throw error
    }
    let { password: _, ...result } = user

    let address = await getIpAddress(req.headers['x-forwarded-for'] || req.connection.remoteAddress)

    const payload = {
      sub: user.id,
      account: user.name,
      address,
      loginTime: dayjs().format('YYYY-MM-DD HH:mm:ss'),
      ...result,
    }
    let accessToken = await this.jwtService.signAsync(payload, {
      secret: config.jwtSecret,
      expiresIn: config.jwtExpires,
    })

    let log = await this.loginLogsService.createLog(req, {
      session: accessToken.split('.').at(-1),
      loginTime: payload.loginTime,
      address,
      ...body,
    })

    await this.redisService.setRedisOnlineUser(log)
    this.setSessionCookie(res, accessToken)

    return {
      success: true,
    }
  }

  async logout(req: Record<string, any>, isQuit = false, res?: Response) {
    let params = {}
    let session = ''
    if (isQuit) {
      this.ensureAdmin(req.user)
      session = req.body.session
      params = { ...req.body, msg: '被强退' }
    } else {
      session = req.user.session
      params = { ...req.user, msg: '退出登录' }
    }
    await this.loginLogsService.createLog(req, params)

    await this.redisService.delRedisOnlineUser(session)
    if (!isQuit && res) {
      this.clearSessionCookie(res)
    }
    return { success: true }
  }

  async getOnlineUsers(query): Promise<any> {
    let [data, total] = await this.redisService.getRedisOnlineUser(query)
    return { total, data, _flag: true }
  }

  ensureAdmin(user: Record<string, any>) {
    const permissions = user?.permissions || []
    if (!permissions.includes('*')) {
      throw new ForbiddenException('接口无权限')
    }
  }

  getSessionCookieName() {
    return sessionCookieName
  }

  private setSessionCookie(res: Response, token: string) {
    res.cookie(sessionCookieName, token, {
      httpOnly: true,
      sameSite: 'lax',
      secure: false,
      path: '/',
      maxAge: dayjs().endOf('day').diff(dayjs(), 'millisecond'),
    })
  }

  private clearSessionCookie(res: Response) {
    res.clearCookie(sessionCookieName, {
      httpOnly: true,
      sameSite: 'lax',
      secure: false,
      path: '/',
    })
  }
}
