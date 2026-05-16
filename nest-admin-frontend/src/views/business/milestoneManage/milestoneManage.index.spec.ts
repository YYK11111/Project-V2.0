import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

function readMilestoneManageView() {
  return readFileSync(resolve(__dirname, 'index.vue'), 'utf-8')
}

describe('milestoneManage 列表局部治理守卫', () => {
  it('里程碑列表筛选区使用带标签的原生查询项', () => {
    const source = readMilestoneManageView()

    expect(source).toContain('class="query-sections"')
    expect(source).toContain('class="query-section query-section--primary"')
    expect(source).toContain('class="query-section query-section--advanced"')
    expect(source).toContain('class="advanced-filter-toggle"')
    expect(source).toContain('class="native-query-grid"')
    expect(source).toContain('class="native-query-item"')
    expect(source).toContain('class="native-query-label"')
    expect(source).toMatch(/\.native-query-label\s*\{[\s\S]*width:\s*80px/)
    expect(source).toContain('所属项目')
    expect(source).toContain('责任人')
    expect(source).toContain('里程碑阶段')
    expect(source).toContain('变更影响')
    expect(source).toContain('风险影响')
    expect(source).toContain('状态')
  })

})
