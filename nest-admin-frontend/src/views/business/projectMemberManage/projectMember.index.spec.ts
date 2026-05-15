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
    expect(source).toMatch(/\.query-select-label\s*\{[\s\S]*width:\s*80px/)
    expect(source).toMatch(/grid-template-columns:\s*repeat\(4, minmax\(0, 1fr\)\)/)
    expect(source).toMatch(/@media \(max-width:\s*1200px\)[\s\S]*grid-template-columns:\s*repeat\(2, minmax\(0, 1fr\)\)/)
    expect(source).toMatch(/@media \(max-width:\s*768px\)[\s\S]*grid-template-columns:\s*1fr/)
    expect(source).toContain('class="query-sections"')
    expect(source).toContain('class="query-section query-section--primary"')
    expect(source).toContain('class="query-section query-section--advanced"')
    expect(source).toContain("showAdvanced ? '收起高级筛选' : '展开高级筛选'")
  })

  it('项目成员操作按钮叠加项目内成员维护权限', () => {
    const source = readProjectMemberView()

    expect(source).toContain('function canManageProjectMember(row: any)')
    expect(source).toContain('row.permissionContext?.canManageMembers === true')
    expect(source).toContain('canProjectMemberUpdate.value && canManageProjectMember(row)')
    expect(source).toContain('canProjectMemberDelete.value && canManageProjectMember(row)')
  })
})
