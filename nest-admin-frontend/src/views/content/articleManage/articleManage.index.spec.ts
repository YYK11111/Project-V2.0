import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

function readArticleManageView() {
  return readFileSync(resolve(__dirname, 'index.vue'), 'utf-8')
}

describe('articleManage 后台管理列表治理守卫', () => {
  it('知识列表页签使用 4 列 query-grid 并保留操作区按钮组', () => {
    const source = readArticleManageView()

    expect(source).toContain('class="query-grid"')
    expect(source).toContain('class="knowledge-manage-actions"')
    expect(source).toContain('知识列表')
    expect(source).toContain('AI检索调试')
    expect(source).toMatch(/grid-template-columns:\s*repeat\(4, minmax\(0, 1fr\)\)/)
  })
})
