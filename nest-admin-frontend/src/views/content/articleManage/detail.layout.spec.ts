import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

function readSource() {
  return readFileSync(resolve(process.cwd(), 'src/views/content/articleManage/detail.vue'), 'utf-8')
}

describe('knowledge detail layout', () => {
  it('使用 hero、目录正文双栏、AI 独立第三行布局', () => {
    const source = readSource()

    expect(source).toContain('class="knowledge-detail-content-shell"')
    expect(source).toContain('knowledge-detail-content-shell__header')
    expect(source).toContain('.knowledge-detail-content-shell {\n  display: flex;\n  flex-direction: column;')
    expect(source).toContain('class="knowledge-detail-hero__meta-grid"')
    expect(source).toContain('knowledge-detail-sidebar Gcard')
    expect(source).toContain('padding: 24px;')
    expect(source).toContain('grid-template-columns: repeat(4, minmax(0, 1fr));')
    expect(source).toContain('v-model="tocDrawerVisible"')
    expect(source).toContain('overflow-y: auto;')
    expect(source).toContain('knowledge-detail-sidebar__header')
    expect(source).not.toContain("'has-ai': canViewAiPreview")
    expect(source).not.toContain('knowledge-detail-hero__side')
    expect(source).not.toContain('class="knowledge-detail-meta-panel Gcard"')
  })

  it('正文在阅读区内左对齐展示，不再强制居中窄列', () => {
    const source = readSource()

    expect(source).not.toContain('.knowledge-detail-reading__body {\n  max-width: 72ch;')
    expect(source).not.toContain('.knowledge-detail-reading__body {\n  margin: 0 auto;')
  })

  it('目录联动应绑定正文滚动区本身', () => {
    const source = readSource()

    expect(source).toContain('const container = contentRef.value')
    expect(source).not.toContain('contentRef.value?.parentElement')
  })
})
