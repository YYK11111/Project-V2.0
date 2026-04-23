import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

function readChangeManageView() {
  return readFileSync(resolve(__dirname, 'index.vue'), 'utf-8')
}

describe('changeManage 列表局部治理守卫', () => {
  it('变更列表筛选区使用带标签的原生查询项，并保留 4 列布局', () => {
    const source = readChangeManageView()

    expect(source).toContain('class="native-query-grid"')
    expect(source).toContain('class="native-query-item"')
    expect(source).toContain('class="native-query-label"')
    expect(source).toMatch(/\.native-query-label\s*\{[\s\S]*width:\s*80px/)
    expect(source).toContain('变更类型')
    expect(source).toContain('知识回流')
    expect(source).toMatch(/grid-template-columns:\s*repeat\(4, minmax\(0, 1fr\)\)/)
  })
})
