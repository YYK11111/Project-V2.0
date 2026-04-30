import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

function readWorkflowView() {
  return readFileSync(resolve(__dirname, 'index.vue'), 'utf-8')
}

describe('workflow 列表治理守卫', () => {
  it('流程定义列表使用 4 列 query-grid 并保留选中列与序号列', () => {
    const source = readWorkflowView()

    expect(source).toContain(':is-selection="true"')
    expect(source).toContain('<el-table-column type="index" label="序号" width="70" />')
    expect(source).toMatch(/class="query-grid"/)
    expect(source).toMatch(/grid-template-columns:\s*repeat\(4, minmax\(0, 1fr\)\)/)
    expect(source).toMatch(/@media \(max-width:\s*1200px\)[\s\S]*grid-template-columns:\s*repeat\(2, minmax\(0, 1fr\)\)/)
    expect(source).toMatch(/@media \(max-width:\s*768px\)[\s\S]*grid-template-columns:\s*1fr/)
    expect(source).toContain('class="query-sections"')
    expect(source).toContain('class="query-section query-section--primary"')
  })
})
