import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

function readBusinessView(relativePath: string) {
  return readFileSync(resolve(__dirname, relativePath), 'utf-8')
}

describe('业务表单路由守卫补充', () => {
  it('剩余高风险表单页仅在自身路由下响应 id 变化', () => {
    const routeGuards = [
      { file: 'taskManage/form.vue', routePath: '/taskManage/form' },
      { file: 'handoverManage/form.vue', routePath: '/handoverManage/form' },
      { file: 'goLiveManage/form.vue', routePath: '/goLiveManage/form' },
    ]

    routeGuards.forEach(({ file, routePath }) => {
      const source = readBusinessView(file)
      expect(source).toContain('useCurrentRouteGuard')
      expect(source).toContain(`'${routePath}'`)
    })
  })
})
