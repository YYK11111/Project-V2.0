import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

function readSource() {
  return readFileSync(resolve(__dirname, 'api.ts'), 'utf-8')
}

describe('user story api contract', () => {
  it('列表适配必须兼容标准 ResponseListDto 的 data 数组', () => {
    const source = readSource()

    expect(source).toContain("import { normalizePageData } from '@/utils/pageData'")
    expect(source).toContain('.then(normalizePageData)')
  })
})
