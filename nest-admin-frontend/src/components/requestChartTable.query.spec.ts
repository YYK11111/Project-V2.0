import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

function readComponent(name: string) {
  return readFileSync(resolve(__dirname, `${name}.vue`), 'utf-8')
}

describe('RequestChartTable 查询结构守卫', () => {
  it('query 区域与查询重置按钮合并在同一个 queryForm 中', () => {
    const source = readComponent('RequestChartTable')

    expect(source).toContain('ref="queryForm"')
    expect(source).toContain('<slot name="query" v-bind="{ query }"></slot>')
    expect(source).toContain('<slot name="extraButtons" v-bind="{ query }"></slot>')
    expect(source).toContain('<SearchResetButton @search="getList(1)" @reset="reset(\'queryForm\')"></SearchResetButton>')
    expect(source).not.toMatch(/<div v-if="\$slots.query" class="query-outer">\s*<slot name="query"/)
  })
})
