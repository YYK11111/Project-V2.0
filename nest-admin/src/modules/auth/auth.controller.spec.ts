import { AuthController } from './auth.controller'

describe('AuthController', () => {
  const authService = {
    login: jest.fn(),
    logout: jest.fn(),
    ensureAdmin: jest.fn(),
    getOnlineUsers: jest.fn(),
  }

  const usersService = {
    add: jest.fn(),
    getOne: jest.fn(),
  }

  const captchaService = {
    validateCaptcha: jest.fn(),
  }

  beforeEach(() => {
    jest.clearAllMocks()
    captchaService.validateCaptcha.mockReturnValue('true')
  })

  it('登录时透传响应对象以设置 HttpOnly Cookie', async () => {
    const controller = new AuthController(authService as any, usersService as any, captchaService as any)
    const req = { body: { account: 'admin', password: '123456' } }
    const res = { cookie: jest.fn() }
    authService.login.mockResolvedValue({ success: true })

    await controller.login(req, res as any)

    expect(authService.login).toHaveBeenCalledWith(req, res)
  })

  it('获取在线用户前要求管理员权限', async () => {
    const controller = new AuthController(authService as any, usersService as any, captchaService as any)
    const req = { user: { permissions: ['*'] } }
    const query = { pageNum: 1, pageSize: 10 }
    authService.getOnlineUsers.mockResolvedValue({ total: 0, data: [] })

    await controller.getOnlineUsers(req as any, query as any)

    expect(authService.ensureAdmin).toHaveBeenCalledWith(req.user)
    expect(authService.getOnlineUsers).toHaveBeenCalledWith(query)
  })
})
