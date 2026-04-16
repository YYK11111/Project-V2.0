import { Reflector } from '@nestjs/core'
import { JwtService } from '@nestjs/jwt'
import { AuthGuard } from './auth.guard'

describe('AuthGuard public routes', () => {
  it('放行验证码与系统配置公开接口', async () => {
    const guard = new AuthGuard(
      {} as JwtService,
      { getAllAndOverride: jest.fn() } as unknown as Reflector,
      {} as any,
    )

    const createContext = (path: string) => ({
      getHandler: jest.fn(),
      getClass: jest.fn(),
      switchToHttp: () => ({
        getRequest: () => ({
          path,
          method: 'GET',
          headers: {},
        }),
      }),
    }) as any

    await expect(guard.canActivate(createContext('/api/system/common/getCaptchaImage'))).resolves.toBe(true)
    await expect(guard.canActivate(createContext('/api/system/configs/list'))).resolves.toBe(true)
  })
})
