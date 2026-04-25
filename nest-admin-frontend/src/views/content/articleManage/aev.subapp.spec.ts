import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

function readAev() {
  return readFileSync(resolve(__dirname, 'aev.vue'), 'utf-8')
}

describe('aev subapp replacement', () => {
  it('aev 正文区使用 IsleArticleEditor', () => {
    const source = readAev()

    expect(source).toContain('IsleArticleEditor')
    expect(source).not.toContain('KnowledgeEditorHost')
    expect(source).not.toContain('DocumentEditorV2')
    expect(source).not.toContain('NotionDocumentEditor')
  })

  it('aev 不替换 view 和 detail 链路', () => {
    const source = readAev()

    expect(source).toContain('route.query.id')
    expect(source).toContain('getOne(getSingleQueryValue(route.query.id))')
  })

  it('aev 仅在文章编辑路由下响应 id 变化', () => {
    const source = readAev()

    expect(source).toContain('useCurrentRouteGuard')
    expect(source).toContain("['/content/aev', '/content/articleManage/aev']")
  })
})
