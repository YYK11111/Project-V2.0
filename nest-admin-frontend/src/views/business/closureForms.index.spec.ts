import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

function readBusinessView(relativePath: string) {
  return readFileSync(resolve(__dirname, relativePath), 'utf-8')
}

describe('上线单/验收单/交接单 列表治理守卫', () => {
  it('三个页面使用统一筛选区结构、4 列 query-grid 并保留选中列与序号列', () => {
    const files = [
      'goLiveManage/index.vue',
      'acceptanceManage/index.vue',
      'handoverManage/index.vue',
    ]

    files.forEach((file) => {
      const source = readBusinessView(file)
      expect(source).toContain('class="query-sections"')
      expect(source).toContain('class="query-section query-section--primary"')
      expect(source).toMatch(/class="query-grid"/)
      expect(source).not.toContain('展开高级筛选')
      expect(source).not.toContain('收起高级筛选')
      expect(source).toContain(':is-selection="true"')
      expect(source).toContain('label-position="left"')
      expect(source).toContain('label-width="80px"')
      expect(source).toContain('<el-table-column type="index" label="序号" width="70" />')
      expect(source).toMatch(/grid-template-columns:\s*repeat\(4, minmax\(0, 1fr\)\)/)
      expect(source).toContain('type="danger"')
      expect(source).toContain('批量删除')
    })
  })

})
