import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

function readBusinessView(relativePath: string) {
  return readFileSync(resolve(__dirname, '..', relativePath), 'utf-8')
}

describe('项目链路表单结构整改守卫', () => {
  it('目标表单页不再保留 Hero 结构', () => {
    const files = [
      'projectManage/form.vue',
      'taskManage/form.vue',
      'userStoryManage/form.vue',
      'ticketManage/form.vue',
      'riskManage/form.vue',
      'changeManage/form.vue',
      'sprintManage/form.vue',
      'milestoneManage/form.vue',
    ]

    files.forEach((file) => {
      const source = readBusinessView(file)
      expect(source).not.toMatch(/km-hero/)
      expect(source).not.toMatch(/form-hero__/)
    })
  })

  it('需要补附件的表单页应显式接入 Upload 与 ViewFileList', () => {
    const files = [
      'userStoryManage/form.vue',
      'riskManage/form.vue',
      'changeManage/form.vue',
      'sprintManage/form.vue',
      'milestoneManage/form.vue',
    ]

    files.forEach((file) => {
      const source = readBusinessView(file)
      expect(source).toMatch(/Upload/)
      expect(source).toMatch(/ViewFileList/)
      expect(source).toMatch(/attachments/)
    })
  })

  it('高风险项目链路表单页仅在自身路由下响应 id 变化', () => {
    const routeGuards = [
      { file: 'projectManage/form.vue', routePath: '/projectManage/form' },
      { file: 'ticketManage/form.vue', routePath: '/ticketManage/form' },
      { file: 'changeManage/form.vue', routePath: '/changeManage/form' },
      { file: 'riskManage/form.vue', routePath: '/riskManage/form' },
      { file: 'milestoneManage/form.vue', routePath: '/milestoneManage/form' },
      { file: 'sprintManage/form.vue', routePath: '/sprintManage/form' },
      { file: 'userStoryManage/form.vue', routePath: '/userStoryManage/form' },
    ]

    routeGuards.forEach(({ file, routePath }) => {
      const source = readBusinessView(file)
      expect(source).toContain('useCurrentRouteGuard')
      expect(source).toContain(`'${routePath}'`)
    })
  })
})
