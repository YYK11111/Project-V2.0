import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

function readAiRetrieveDebugView() {
  return readFileSync(resolve(__dirname, 'aiRetrieveDebug.vue'), 'utf-8')
}

describe('AI 检索调试页评分明细守卫', () => {
  it('展示检索评分构成和命中信息', () => {
    const source = readAiRetrieveDebugView()

    expect(source).toContain('scoreBreakdown')
    expect(source).toContain('keywordScore')
    expect(source).toContain('aiPreferredBonus')
    expect(source).toContain('authorityBonus')
    expect(source).toContain('retrievalWeightBonus')
    expect(source).toContain('matchedTerms')
    expect(source).toContain('matchedFields')
    expect(source).toContain('关键词分')
    expect(source).toContain('AI优先')
    expect(source).toContain('权威加权')
    expect(source).toContain('命中字段')
  })

  it('展示结构化切片的标题路径和长度估算', () => {
    const source = readAiRetrieveDebugView()

    expect(source).toContain('headingPath')
    expect(source).toContain('tokenEstimate')
    expect(source).toContain('标题路径')
    expect(source).toContain('长度估算')
    expect(source).toContain("item.headingPath?.join(' / ')")
  })
})
