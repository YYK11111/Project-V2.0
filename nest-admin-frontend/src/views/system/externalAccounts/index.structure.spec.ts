import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

function readSource() {
  return readFileSync(resolve(__dirname, 'index.vue'), 'utf-8')
}

describe('external accounts page structure', () => {
  it('展示外部账号映射列表并支持同步飞书', () => {
    const source = readSource()

    expect(source).toContain("checkPermi(['system/externalAccounts/list'])")
    expect(source).toContain('business-list-page')
    expect(source).toContain('business-list-panel')
    expect(source).toContain('TableOperation')
    expect(source).toContain('批量同步飞书')
    expect(source).toContain('同步飞书')
    expect(source).toContain('外部用户ID')
    expect(source).toContain('绑定状态')
  })
})
