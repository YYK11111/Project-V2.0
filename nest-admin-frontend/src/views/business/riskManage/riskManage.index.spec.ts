import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

function readRiskManageView() {
  return readFileSync(resolve(__dirname, 'index.vue'), 'utf-8')
}

describe('riskManage 列表局部治理守卫', () => {
  it('风险列表筛选区使用带标签查询项，并把风险矩阵作为查询区同层操作按钮', () => {
    const source = readRiskManageView()

    expect(source).toContain('class="native-query-grid"')
    expect(source).toContain('class="native-query-item"')
    expect(source).toContain('class="native-query-label"')
    expect(source).toContain('<template #extraButtons>')
    expect(source).toContain('风险矩阵')
    expect(source).toContain('所属项目')
    expect(source).toContain('风险等级')
    expect(source).toContain('知识回流')
  })
})
