import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

function readRoutesSource() {
  return readFileSync(resolve(__dirname, '..', '..', 'router', 'routes.js'), 'utf-8')
}

function getConstantRoutesBlock() {
  const source = readRoutesSource()
  const match = source.match(/export const constantRoutes = \[(.*?)\n\]/s)

  expect(match?.[1]).toBeTruthy()
  return match![1]
}

function getRouteBlock(routePath: string) {
  const constantRoutesBlock = getConstantRoutesBlock()
  const escapedPath = routePath.replace('/', '\\/')
  const match = constantRoutesBlock.match(new RegExp(`\\{\\s*path: '${escapedPath}'[\\s\\S]*?\\n\\s*\\},`, 's'))

  expect(match?.[0]).toBeTruthy()
  return match![0]
}

describe('home routes', () => {
  it('在 constantRoutes 中声明了用户首页常量路由入口', () => {
    const routeBlock = getRouteBlock('/index')

    expect(routeBlock).toContain('component: Layout')
    expect(routeBlock).toContain("component: () => import('@/views/index/index.vue')")
    expect(routeBlock).toContain("name: 'UserHome'")
    expect(routeBlock).toContain("title: '首页'")
  })

  it('在 constantRoutes 中声明了系统首页常量路由入口', () => {
    const routeBlock = getRouteBlock('/adminindex')

    expect(routeBlock).toContain('component: Layout')
    expect(routeBlock).toContain("component: () => import('@/views/index/adminindex.vue')")
    expect(routeBlock).toContain("name: 'AdminHome'")
    expect(routeBlock).toContain("title: '系统首页'")
  })

  it('系统首页菜单使用独立权限字符控制', () => {
    const routeBlock = getRouteBlock('/adminindex')

    expect(routeBlock).toContain("permissionKey: 'dashboard/adminIndex'")
  })

  it('系统首页测试明确使用 dashboard/adminIndex 权限字符', () => {
    const source = readRoutesSource()

    expect(source).toContain("path: '/adminindex'")
    expect(source).toContain('dashboard/adminIndex')
  })
})
