import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

function readUserStoryView() {
  return readFileSync(resolve(__dirname, 'index.vue'), 'utf-8')
}

describe('userStoryManage 列表治理守卫', () => {
  it('用户故事列表使用 4 列 query-grid 并保留树表选择能力', () => {
    const source = readUserStoryView()

    expect(source).toContain(':is-selection="true"')
    expect(source).toContain('<el-table-column type="index" label="序号" width="70" />')
    expect(source).toContain(':table-attrs="tableAttrs"')
    expect(source).toMatch(/class="query-grid"/)
    expect(source).toMatch(/grid-template-columns:\s*repeat\(4, minmax\(0, 1fr\)\)/)
    expect(source).toMatch(/@media \(max-width:\s*1200px\)[\s\S]*grid-template-columns:\s*repeat\(2, minmax\(0, 1fr\)\)/)
    expect(source).toMatch(/@media \(max-width:\s*768px\)[\s\S]*grid-template-columns:\s*1fr/)
  })

  it('用户故事列表保留树表属性，并使用统一表头层级样式', () => {
    const source = readUserStoryView()

    expect(source).toContain(':table-attrs="tableAttrs"')
    expect(source).toContain(':table-events="tableEvents"')
    expect(source).toMatch(/font-weight:\s*600/)
  })
})
