import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

function readProjectManageView(name: string) {
  return readFileSync(resolve(__dirname, `${name}.vue`), 'utf-8')
}

describe('projectManage 列表治理守卫', () => {
  it('项目列表筛选区使用 4 列网格并保留选中列与序号列', () => {
    const source = readProjectManageView('index')

    expect(source).toContain(':is-selection="true"')
    expect(source).toContain('<el-table-column type="index" label="序号" width="70" />')
    expect(source).toMatch(/\.query-select-label\s*\{[\s\S]*width:\s*80px/)
    expect(source).toMatch(/grid-template-columns:\s*repeat\(4, minmax\(0, 1fr\)\)/)
    expect(source).toMatch(/@media \(max-width:\s*1200px\)[\s\S]*grid-template-columns:\s*repeat\(2, minmax\(0, 1fr\)\)/)
    expect(source).toMatch(/@media \(max-width:\s*768px\)[\s\S]*grid-template-columns:\s*1fr/)
  })

  it('项目列表筛选区区分核心筛选和高级筛选分组', () => {
    const source = readProjectManageView('index')

    expect(source).toContain('class="query-section query-section--primary"')
    expect(source).toContain('class="query-section query-section--advanced"')
    expect(source).toContain('高级筛选')
    expect(source).toContain('按组织、质量、归档和业务属性进一步缩小范围')
    expect(source).toContain("showAdvanced ? '收起高级筛选' : '展开高级筛选'")
  })

  it('项目列表仅允许草稿项目进入编辑', () => {
    const source = readProjectManageView('index')

    expect(source).toContain("String(row.status || '') === '1'")
    expect(source).not.toContain("String(row.status || '') !== '3'")
  })
})
