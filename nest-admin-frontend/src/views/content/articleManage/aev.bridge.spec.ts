import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

function readAev() {
  return readFileSync(resolve(__dirname, 'aev.vue'), 'utf-8')
}

describe('aev 正文桥接守卫', () => {
  it('正文更新后继续写入 contentJson、contentVersion、contentStatus、contentText', () => {
    const source = readAev()

    expect(source).toContain('function handleArticleContentUpdate(')
    expect(source).toContain('form.value.contentJson = contentJson')
    expect(source).toContain('form.value.contentVersion = DOCUMENT_CONTENT_VERSION')
    expect(source).toContain("form.value.contentStatus = 'ready'")
    expect(source).toContain('form.value.contentText = getDocumentPlainText(contentJson)')
  })

  it('保存前继续桥接正文派生字段', () => {
    const source = readAev()

    expect(source).toContain('payload.contentJson = form.value.contentJson')
    expect(source).toContain('payload.contentVersion = DOCUMENT_CONTENT_VERSION')
    expect(source).toContain("payload.contentStatus = 'ready'")
    expect(source).toContain("payload.contentText = form.value.contentText || ''")
  })
})
