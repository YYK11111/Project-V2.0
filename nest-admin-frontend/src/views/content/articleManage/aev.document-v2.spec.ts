import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

function readAevSource(): string {
  return readFileSync(resolve(__dirname, 'aev.vue'), 'utf-8')
}

describe('知识编辑页 V2 编辑器接入', () => {
  it('aev 页面直接使用 DocumentEditorV2 并移除旧编辑器入口', () => {
    const source = readAevSource()

    expect(source).toContain('DocumentEditorV2')
    expect(source).not.toContain('NotionDocumentEditor')
    expect(source).not.toContain('useDocumentEditorV2')
    expect(source).not.toContain('DOCUMENT_EDITOR_V2_POC_QUERY_KEY')
  })
})
