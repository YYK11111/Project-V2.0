import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

function readBusinessView(relativePath: string) {
  return readFileSync(resolve(__dirname, relativePath), 'utf-8')
}

describe('业务富文本编辑器回归', () => {
  it('项目/任务/工单/任务汇报继续使用通用 Editor 入口', () => {
    const files = [
      'projectManage/form.vue',
      'taskManage/form.vue',
      'ticketManage/form.vue',
      'taskReportManage/index.vue',
    ]

    files.forEach((file) => {
      const source = readBusinessView(file)
      expect(source).toContain("@/components/Editor/index.vue")
      expect(source).toMatch(/<Editor[\s\S]*v-model=/)
    })
  })
})
