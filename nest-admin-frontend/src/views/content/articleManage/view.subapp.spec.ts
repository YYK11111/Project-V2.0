import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

function readView() {
  return readFileSync(resolve(__dirname, 'view.vue'), 'utf-8')
}

describe('knowledge view subapp replacement', () => {
  it('view 页面使用 IsleArticleViewer', () => {
    const source = readView()

    expect(source).toContain('IsleArticleViewer')
    expect(source).toContain(':content="documentState.document"')
    expect(source).not.toContain('KnowledgeViewerHost')
    expect(source).not.toContain('useEditor(')
    expect(source).not.toContain('EditorContent')
  })

  it('view 仅在知识查看路由下响应 id 变化', () => {
    const source = readView()

    expect(source).toContain('useCurrentRouteGuard')
    expect(source).toContain("'/content/articleManage/view'")
  })
})
