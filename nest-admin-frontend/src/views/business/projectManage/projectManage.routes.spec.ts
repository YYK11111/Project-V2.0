import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

function readProjectManageView(name: string) {
  return readFileSync(resolve(__dirname, `${name}.vue`), 'utf-8')
}

function readBusinessView(relativePath: string) {
  return readFileSync(resolve(__dirname, '..', relativePath), 'utf-8')
}

function readRoutesSource() {
  return readFileSync(resolve(__dirname, '..', '..', '..', 'router', 'routes.js'), 'utf-8')
}

function extractRoutePaths(source: string) {
  return Array.from(source.matchAll(/path:\s*['"]([^'"]+)['"]/g)).map((match) => match[1])
}

function extractPushedPaths(source: string) {
  return Array.from(source.matchAll(/router\.push\(\{\s*path:\s*['"]([^'"]+)['"]/g)).map((match) => match[1])
}

describe('projectManage 链路路由一致性', () => {
  it('项目管理页面引用的隐藏表单路由都已在 routes.js 注册', () => {
    const routesSource = readRoutesSource()
    const routePaths = new Set(extractRoutePaths(routesSource))
    const projectIndexSource = readProjectManageView('index')
    const projectDetailSource = readProjectManageView('detail')
    const taskFormSource = readBusinessView('taskManage/form.vue')

    const referencedPaths = [
      ...Array.from(projectIndexSource.matchAll(/goRoute\([^,]+,\s*['"]([^'"]+)['"]\)/g)).map((match) => match[1]),
      ...extractPushedPaths(projectDetailSource),
      ...extractPushedPaths(taskFormSource),
    ].filter((path) => path.includes('projectManage') || path === '/cockpit' || path === '/riskManage/form')

    expect(referencedPaths).toContain('/projectManage/form')
    expect(referencedPaths).toContain('/projectManage/detail')
    expect(routePaths.has('/projectManage/form')).toBe(true)
    expect(routePaths.has('/projectManage/detail')).toBe(true)
    expect(referencedPaths).not.toContain('/cockpit')
    expect(referencedPaths).toContain('/projectManage/cockpit')
    expect(routePaths.has('/cockpit')).toBe(false)
    expect(routePaths.has('/projectManage/cockpit')).toBe(true)
    expect(routePaths.has('/projectManage/riskManage/form')).toBe(true)
    expect(routePaths.has('/riskManage/form')).toBe(false)
  })

  it('从 Sprint 详情进入用户故事时应显式进入查看态', () => {
    const sprintDetailSource = readBusinessView('sprintManage/detail.vue')

    expect(sprintDetailSource).toContain("path: '/projectManage/userStoryManage/form'")
    expect(sprintDetailSource).toContain("query: { id: story.id, action: 'view' }")
  })

  it('项目详情页新增 Sprint 使用的表单路由必须有常量隐藏路由兜底', () => {
    const routesSource = readRoutesSource()
    const routePaths = new Set(extractRoutePaths(routesSource))
    const projectDetailSource = readProjectManageView('detail')

    expect(projectDetailSource).toContain("createProjectScopedRecord('/sprintManage/form')")
    expect(routePaths.has('/sprintManage/form')).toBe(true)
  })

  it('项目详情页新增变更使用的表单路由必须有常量隐藏路由兜底', () => {
    const routesSource = readRoutesSource()
    const routePaths = new Set(extractRoutePaths(routesSource))
    const projectDetailSource = readProjectManageView('detail')

    expect(projectDetailSource).toContain("path: '/changeManage/form'")
    expect(routePaths.has('/changeManage/form')).toBe(true)
  })
})
