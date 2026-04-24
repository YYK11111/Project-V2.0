import { describe, expect, it } from 'vitest'
import { useCurrentRouteGuard } from './useCurrentRouteGuard'

describe('useCurrentRouteGuard', () => {
  it('支持单一路径命中判断', () => {
    const route = { path: '/taskManage/form' }
    const isCurrentRoute = useCurrentRouteGuard(route, '/taskManage/form')

    expect(isCurrentRoute()).toBe(true)
  })

  it('支持多路径命中判断', () => {
    const route = { path: '/content/aev' }
    const isCurrentRoute = useCurrentRouteGuard(route, ['/content/aev', '/content/articleManage/aev'])

    expect(isCurrentRoute()).toBe(true)
  })

  it('未命中时返回 false', () => {
    const route = { path: '/projectManage/detail' }
    const isCurrentRoute = useCurrentRouteGuard(route, '/taskManage/form')

    expect(isCurrentRoute()).toBe(false)
  })
})
