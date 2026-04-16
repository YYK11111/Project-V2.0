import { beforeEach, describe, expect, it, vi } from 'vitest'

const mockHandleSessionExpired = vi.fn()

vi.mock('../stores/user', () => ({
  useUserStore: () => ({
    handleSessionExpired: mockHandleSessionExpired,
  }),
}))

describe('request 401 处理', () => {
  beforeEach(() => {
    vi.resetModules()
    mockHandleSessionExpired.mockReset()
    ;(window as any).ElMessageBox.confirm.mockClear()
    Object.defineProperty(window, 'location', {
      value: {
        href: 'http://localhost/dashboard',
        pathname: '/dashboard',
        search: '?tab=1',
      },
      writable: true,
    })
  })

  it('401 时只执行本地过期处理，不调用后端登出', async () => {
    const { default: request } = await import('./request')
    const responseInterceptor = request.interceptors.response.handlers[0].fulfilled

    await expect(
      responseInterceptor({
        data: { code: 401 },
        config: { url: '/auth/getLoginUser' },
      }),
    ).rejects.toThrow('认证失败，无法访问系统资源')

    await Promise.resolve()

    expect((window as any).ElMessageBox.confirm).toHaveBeenCalledTimes(1)
    expect(mockHandleSessionExpired).toHaveBeenCalledWith('/dashboard?tab=1')
  })

  it('登录页公开请求返回 401 时不弹登录过期弹窗', async () => {
    Object.defineProperty(window, 'location', {
      value: {
        href: 'http://localhost/login',
        pathname: '/login',
        search: '',
      },
      writable: true,
    })

    const { default: request } = await import('./request')
    const responseInterceptor = request.interceptors.response.handlers[0].fulfilled

    await expect(
      responseInterceptor({
        data: { code: 401 },
        config: { url: '/system/common/getCaptchaImage' },
      }),
    ).rejects.toThrow('认证失败，无法访问系统资源')

    expect((window as any).ElMessageBox.confirm).not.toHaveBeenCalled()
    expect(mockHandleSessionExpired).not.toHaveBeenCalled()
  })
})
