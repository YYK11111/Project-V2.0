import { INestApplication } from '@nestjs/common'
import { Test, TestingModule } from '@nestjs/testing'
import request from 'supertest'
import { AuthController } from './auth.controller'
import { AuthService } from './auth.service'
import { UsersService } from '../users/users.service'
import { CaptchaService } from '../common/captcha.service'
import { AuthGuard } from './auth.guard'

describe('Auth HTTP 集成', () => {
  let app: INestApplication

  const authService = {
    login: jest.fn(async (_req, res) => {
      res.cookie('admin_session', 'header.payload.signature', {
        httpOnly: true,
        sameSite: 'lax',
        secure: false,
        path: '/',
      })
      return { success: true }
    }),
    logout: jest.fn(async (_req, _isQuit, res) => {
      res.clearCookie('admin_session', {
        httpOnly: true,
        sameSite: 'lax',
        secure: false,
        path: '/',
      })
      return { success: true }
    }),
    ensureAdmin: jest.fn(),
    getOnlineUsers: jest.fn(),
  }

  const usersService = {
    getOne: jest.fn(),
    add: jest.fn(),
  }

  const captchaService = {
    validateCaptcha: jest.fn().mockReturnValue('true'),
  }

  const authGuard = {
    canActivate: jest.fn((context) => {
      const req = context.switchToHttp().getRequest()
      if (req.path === '/auth/login') {
        return true
      }
      req.user = {
        id: '1',
        session: 'header.payload.signature'.split('.').at(-1),
        permissions: ['*'],
      }
      return true
    }),
  }

  beforeAll(async () => {
    const moduleRef: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        { provide: AuthService, useValue: authService },
        { provide: UsersService, useValue: usersService },
        { provide: CaptchaService, useValue: captchaService },
      ],
    })
      .overrideGuard(AuthGuard)
      .useValue(authGuard)
      .compile()

    app = moduleRef.createNestApplication()
    await app.init()
  })

  afterAll(async () => {
    await app.close()
  })

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('登录接口返回 Set-Cookie', async () => {
    const response = await request(app.getHttpServer()).post('/auth/login').send({
      account: 'NestAdmin',
      password: 'NestAdmin#2026!Reset',
      uuid: 'uuid-1',
      code: '1234',
    })

    expect(response.status).toBe(200)
    expect(response.headers['set-cookie']).toEqual(
      expect.arrayContaining([expect.stringContaining('admin_session=header.payload.signature')]),
    )
    expect(authService.login).toHaveBeenCalled()
  })

  it('登出接口返回清 Cookie 响应头', async () => {
    const response = await request(app.getHttpServer())
      .post('/auth/logout')
      .set('Cookie', ['admin_session=header.payload.signature'])
      .send()

    expect(response.status).toBe(201)
    expect(response.headers['set-cookie']).toEqual(
      expect.arrayContaining([expect.stringContaining('admin_session=;')]),
    )
    expect(authService.logout).toHaveBeenCalled()
  })
})
