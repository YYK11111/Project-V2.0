import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

function readProjectMemberView() {
  return readFileSync(resolve(__dirname, 'index.vue'), 'utf-8')
}

describe('projectMemberManage 列表治理守卫', () => {
  it('项目成员列表使用模式感知 query-grid，并保留 member 视角勾选能力', () => {
    const source = readProjectMemberView()

    expect(source).toContain(':is-selection="viewMode === \'member\'"')
    expect(source).toContain('v-if="viewMode === \'member\'"')
    expect(source).toContain('<el-table-column type="index" label="序号" width="70" />')
    expect(source).toMatch(/class="query-grid"/)
    expect(source).toMatch(/grid-template-columns:\s*repeat\(4, minmax\(0, 1fr\)\)/)
    expect(source).toMatch(/@media \(max-width:\s*1200px\)[\s\S]*grid-template-columns:\s*repeat\(2, minmax\(0, 1fr\)\)/)
    expect(source).toMatch(/@media \(max-width:\s*768px\)[\s\S]*grid-template-columns:\s*1fr/)
  })
})
