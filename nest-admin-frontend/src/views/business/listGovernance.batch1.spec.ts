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

  it('筛选项超过 4 个的目标页面提供高级筛选区与展开收起入口', () => {
    const source = readBusinessView('taskManage/index.vue')

    expect(source).toMatch(/const showAdvanced = ref\(false\)/)
    expect(source).toMatch(/class=\"query-section query-section--advanced\"/)
    expect(source).toContain('展开高级筛选')
    expect(source).toContain('收起高级筛选')
  })

  it('项目管理列表页使用 4 列 query-grid 并保留原生控件', () => {
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
      expect(source).toMatch(/class=\"query-sections\"/)
      expect(source).toMatch(/class=\"query-section query-section--primary\"/)
      expect(source).toMatch(/class=\"query-grid\"/)
      expect(source).toMatch(/grid-template-columns:\s*repeat\(4, minmax\(0, 1fr\)\)/)
      expect(source).toMatch(/@media \(max-width:\s*1200px\)[\s\S]*grid-template-columns:\s*repeat\(2, minmax\(0, 1fr\)\)/)
      expect(source).toMatch(/@media \(max-width:\s*768px\)[\s\S]*grid-template-columns:\s*1fr/)
      expect(source).toMatch(/el-select|el-input/)
    })
  })

  it('项目筛选统一使用项目选择器', () => {
    const files = [
      'riskManage/index.vue',
      'changeManage/index.vue',
      'sprintManage/index.vue',
      'milestoneManage/index.vue',
    ]

    files.forEach((file) => {
      const source = readBusinessView(file)
      expect(source).toContain("import ProjectSelect from '@/components/ProjectSelect.vue'")
      expect(source).toContain('<ProjectSelect v-model="query.projectId" placeholder="请选择所属项目" />')
    })
  })
})
