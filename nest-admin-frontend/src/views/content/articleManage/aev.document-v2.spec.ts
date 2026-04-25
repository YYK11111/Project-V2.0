import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

function readAevSource(): string {
  return readFileSync(resolve(__dirname, 'aev.vue'), 'utf-8')
}

describe('知识编辑页 V2 编辑器接入', () => {
  it('aev 页面直接使用 IsleArticleEditor 并移除旧编辑器入口', () => {
    const source = readAevSource()

    expect(source).toContain('IsleArticleEditor')
    expect(source).not.toContain('KnowledgeEditorHost')
    expect(source).not.toContain('DocumentEditorV2')
    expect(source).not.toContain('NotionDocumentEditor')
  })
})
