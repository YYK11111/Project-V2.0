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
    expect(source).toMatch(/grid-template-columns:\s*repeat\(4, minmax\(0, 1fr\)\)/)
    expect(source).toMatch(/@media \(max-width:\s*1200px\)[\s\S]*grid-template-columns:\s*repeat\(2, minmax\(0, 1fr\)\)/)
    expect(source).toMatch(/@media \(max-width:\s*768px\)[\s\S]*grid-template-columns:\s*1fr/)
  })
})
