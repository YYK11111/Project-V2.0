import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

function readSprintManageView() {
  return readFileSync(resolve(__dirname, 'index.vue'), 'utf-8')
}

describe('sprintManage 列表局部治理守卫', () => {
  it('Sprint 列表筛选区使用带标签的原生查询项', () => {
    const source = readSprintManageView()

    expect(source).toContain('class="query-sections"')
    expect(source).toContain('class="query-section query-section--primary"')
    expect(source).toContain('class="native-query-grid"')
    expect(source).toContain('class="native-query-item"')
    expect(source).toContain('class="native-query-label"')
    expect(source).toMatch(/\.native-query-label\s*\{[\s\S]*width:\s*80px/)
    expect(source).toContain('所属项目')
    expect(source).toContain('负责人')
    expect(source).toContain('变更影响')
    expect(source).toContain('状态')
  })
})
