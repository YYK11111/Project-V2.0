import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

function readAev() {
  return readFileSync(resolve(__dirname, 'aev.vue'), 'utf-8')
}

describe('知识编辑页结构治理守卫', () => {
  it('aev 页面删除 Hero 并保留主工作区', () => {
    const source = readAev()

    expect(source).not.toMatch(/knowledge-editor-hero/)
    expect(source).toMatch(/knowledge-form-section/)
    expect(source).toMatch(/OperateBar/)
    expect(source).toMatch(/Upload/)
  })

  it('基础信息和治理信息在同一行，知识内容独占下一行', () => {
    const source = readAev()

    const gridStart = source.indexOf('<div class="knowledge-form-grid">')
    const contentSection = source.indexOf('knowledge-form-section knowledge-form-section--full knowledge-form-section--content-main')
    const governanceSection = source.indexOf('<div class="section-title">治理信息</div>')

    expect(gridStart).toBeGreaterThan(-1)
    expect(governanceSection).toBeGreaterThan(gridStart)
    expect(contentSection).toBeGreaterThan(governanceSection)
  })
})
