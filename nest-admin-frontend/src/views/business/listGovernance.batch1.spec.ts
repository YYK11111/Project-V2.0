import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

function readBusinessView(relativePath: string) {
  return readFileSync(resolve(__dirname, relativePath), 'utf-8')
}

describe('第一批列表页治理守卫', () => {
  it('目标页面保留选中列与序号列，并使用 4 列 query-grid', () => {
    const files = [
      'ticketManage/index.vue',
      'taskManage/index.vue',
      'taskCommentManage/index.vue',
      'taskReportManage/index.vue',
      'documentManage/index.vue',
    ]

    files.forEach((file) => {
      const source = readBusinessView(file)
      expect(source).toMatch(/:is-selection=\"true\"/)
      expect(source).toContain('<el-table-column type="index" label="序号" width="70" />')
      expect(source).toMatch(/class=\"query-grid\"/)
      expect(source).toMatch(/grid-template-columns:\s*repeat\(4, minmax\(0, 1fr\)\)/)
      expect(source).toMatch(/@media \(max-width:\s*1200px\)[\s\S]*grid-template-columns:\s*repeat\(2, minmax\(0, 1fr\)\)/)
      expect(source).toMatch(/@media \(max-width:\s*768px\)[\s\S]*grid-template-columns:\s*1fr/)
    })
  })

  it('原生查询控件页使用 4 列 native-query-grid 并保留原生控件', () => {
    const files = [
      'riskManage/index.vue',
      'changeManage/index.vue',
      'sprintManage/index.vue',
      'milestoneManage/index.vue',
    ]

    files.forEach((file) => {
      const source = readBusinessView(file)
      expect(source).toMatch(/:is-selection=/)
      expect(source).toContain('<el-table-column type="index" label="序号" width="70" />')
      expect(source).toMatch(/class=\"native-query-grid\"/)
      expect(source).toMatch(/grid-template-columns:\s*repeat\(4, minmax\(0, 1fr\)\)/)
      expect(source).toMatch(/@media \(max-width:\s*1200px\)[\s\S]*grid-template-columns:\s*repeat\(2, minmax\(0, 1fr\)\)/)
      expect(source).toMatch(/@media \(max-width:\s*768px\)[\s\S]*grid-template-columns:\s*1fr/)
      expect(source).toMatch(/el-select|el-input/)
    })
  })
})
