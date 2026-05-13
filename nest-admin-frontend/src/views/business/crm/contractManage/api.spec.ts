import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

function readSource() {
  return readFileSync(resolve(__dirname, 'api.ts'), 'utf-8')
}

describe('contract api contract', () => {
  it('列表适配必须兼容标准 ResponseListDto 的 data 数组', () => {
    const source = readSource()

    expect(source).toContain('const list = Array.isArray(page) ? page : page.list || page.rows || page.data || []')
    expect(source).toContain('const total = Number((Array.isArray(page) ? res?.total : page.total) || res?.total || 0)')
  })
})
