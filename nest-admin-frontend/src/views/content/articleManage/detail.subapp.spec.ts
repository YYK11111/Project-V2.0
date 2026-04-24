import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

function readDetail() {
  return readFileSync(resolve(__dirname, 'detail.vue'), 'utf-8')
}

describe('knowledge detail subapp replacement', () => {
  it('detail 页面使用 KnowledgeViewerHost', () => {
    const source = readDetail()

    expect(source).toContain('KnowledgeViewerHost')
    expect(source).not.toContain('useEditor(')
    expect(source).not.toContain('EditorContent')
  })

  it('detail 仅在知识详情路由下响应 id 变化', () => {
    const source = readDetail()

    expect(source).toContain('useCurrentRouteGuard')
    expect(source).toContain("'/content/articleManage/detail'")
  })
})
