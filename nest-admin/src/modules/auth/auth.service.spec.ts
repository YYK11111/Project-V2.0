import { ForbiddenException } from '@nestjs/common'
import { AuthService } from './auth.service'
import { BoolNum } from 'src/common/type/base'
import * as passwordUtils from 'src/common/utils/password'
import * as commonUtils from 'src/common/utils/common'

describe('AuthService', () => {
  const usersService = {
    getOne: jest.fn(),
  }

  const rolesService = {
    getUserMenus: jest.fn(),
  }

  const jwtService = {
    signAsync: jest.fn(),
  }

  const loginLogsService = {
    createLog: jest.fn(),
  }

  const redisService = {
    setRedisOnlineUser: jest.fn(),
    delRedisOnlineUser: jest.fn(),
    getRedisOnlineUser: jest.fn(),
  }

  const captchaService = {
    validateCaptcha: jest.fn(),
  }

  const createService = () => {
    return new AuthService(
      usersService as any,
      rolesService as any,
      jwtService as any,
      loginLogsService as any,
      redisService as any,
      captchaService as any,
    )
  }

  beforeEach(() => {
    jest.clearAllMocks()
    jest.spyOn(commonUtils, 'getIpAddress').mockResolvedValue('本地')
    captchaService.validateCaptcha.mockReturnValue('true')
    loginLogsService.createLog.mockResolvedValue({ session: 'signature' })
    redisService.setRedisOnlineUser.mockResolvedValue(undefined)
    redisService.delRedisOnlineUser.mockResolvedValue(undefined)
    jwtService.signAsync.mockResolvedValue('header.payload.signature')
    rolesService.getUserMenus.mockResolvedValue([])
  })

  it('登录成功时写入 HttpOnly Cookie 并记录在线会话', async () => {
    const service = createService()
    const verifyPasswordSpy = jest.spyOn(passwordUtils, 'verifyPassword').mockResolvedValue(true)
    const req = {
      body: {
        account: 'tester',
        password: 'Password@123',
        uuid: 'uuid-1',
        code: '1234',
      },
      headers: {},
      connection: { remoteAddress: '127.0.0.1' },
    }
    const res = {
      cookie: jest.fn(),
    }

    usersService.getOne.mockResolvedValue({
      id: 'user_1',
      name: 'tester',
      password: 'scrypt$hash',
      roles: [],
    })

    const result = await service.login(req as any, res as any)

    expect(result).toEqual({ success: true })
    expect(verifyPasswordSpy).toHaveBeenCalledWith('Password@123', 'scrypt$hash')
    expect(res.cookie).toHaveBeenCalledWith(
      'admin_session',
      'header.payload.signature',
      expect.objectContaining({
        httpOnly: true,
        sameSite: 'lax',
        secure: false,
        path: '/',
      }),
    )
    expect(redisService.setRedisOnlineUser).toHaveBeenCalled()
  })

  it('退出登录时清理 Cookie 并删除在线会话', async () => {
    const service = createService()
    const req = {
      user: {
        session: 'signature',
        id: 'user_1',
      },
      headers: {},
      connection: { remoteAddress: '127.0.0.1' },
    }
    const res = {
      clearCookie: jest.fn(),
    }

    const result = await service.logout(req as any, false, res as any)

    expect(result).toEqual({ success: true })
    expect(redisService.delRedisOnlineUser).toHaveBeenCalledWith('signature')
    expect(res.clearCookie).toHaveBeenCalledWith(
      'admin_session',
      expect.objectContaining({
        httpOnly: true,
        sameSite: 'lax',
        secure: false,
        path: '/',
      }),
    )
  })

  it('非管理员强退会话时拒绝执行', async () => {
    const service = createService()
    const req = {
      user: {
        permissions: ['system/users/list'],
      },
      body: {
        session: 'target-session',
      },
    }

    await expect(service.logout(req as any, true)).rejects.toBeInstanceOf(ForbiddenException)
    expect(redisService.delRedisOnlineUser).not.toHaveBeenCalled()
  })

  it('登录失败时记录失败日志', async () => {
    const service = createService()
    const verifyPasswordSpy = jest.spyOn(passwordUtils, 'verifyPassword').mockResolvedValue(false)
    const req = {
      body: {
        account: 'tester',
        password: 'wrong-password',
        uuid: 'uuid-1',
        code: '1234',
      },
      headers: {},
      connection: { remoteAddress: '127.0.0.1' },
    }
    const res = {
      cookie: jest.fn(),
    }

    usersService.getOne.mockResolvedValue({
      id: 'user_1',
      name: 'tester',
      password: 'scrypt$hash',
      roles: [],
    })

    await expect(service.login(req as any, res as any)).rejects.toThrow('密码错误')
    expect(verifyPasswordSpy).toHaveBeenCalled()
    expect(loginLogsService.createLog).toHaveBeenCalledWith(
      req,
      expect.objectContaining({
        isSuccess: BoolNum.No,
        msg: '密码错误',
      }),
    )
  })
})
