import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

function readSource() {
  return readFileSync(resolve(__dirname, 'BaDialog.vue'), 'utf-8')
}

describe('BaDialog structure', () => {
  it('支持隐藏底部操作区', () => {
    const source = readSource()

    expect(source).toContain('showFooter: { type: Boolean, default: true }')
    expect(source).toContain('<template v-if="showFooter" #footer>')
  })

  it('默认使用更宽表单标签列，兼容超过四个字的字段标题', () => {
    const source = readSource()

    expect(source).toContain('label-width="104px"')
    expect(source).not.toContain('label-width="80px"')
  })
})
