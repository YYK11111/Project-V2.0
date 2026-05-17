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

  it('提供重建向量操作入口', () => {
    const source = readArticleManageView()

    expect(source).toContain('rebuildArticleEmbeddings')
    expect(source).toContain('function rebuildEmbeddings')
    expect(source).toContain('向量重建成功')
    expect(source).toContain('重建向量')
  })

  it('分类和标签治理操作应按权限显示', () => {
    const source = readArticleManageView()

    expect(source).toContain("checkPermi(['business/articleCatalogs/add'])")
    expect(source).toContain("checkPermi(['business/articleCatalogs/update'])")
    expect(source).toContain("checkPermi(['business/articleCatalogs/delete'])")
    expect(source).toContain("checkPermi(['business/articleTags/add'])")
    expect(source).toContain("checkPermi(['business/articleTags/update'])")
    expect(source).toContain("checkPermi(['business/articleTags/delete'])")
    expect(source).toContain('v-if="canCatalogAdd"')
    expect(source).toContain('v-if="canCatalogUpdate"')
    expect(source).toContain('v-if="canCatalogDelete"')
    expect(source).toContain('v-if="canArticleTagAdd"')
    expect(source).toContain('v-if="canArticleTagUpdate"')
    expect(source).toContain('v-if="canArticleTagDelete"')
  })
})
