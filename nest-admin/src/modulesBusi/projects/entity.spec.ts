import { describe, expect, it } from '@jest/globals'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

function readSource() {
  return readFileSync(resolve(__dirname, 'entity.ts'), 'utf-8')
}

describe('Project entity mapping', () => {
  it('关联客户字段应映射到 customer_id 外键列', () => {
    const source = readSource()

    expect(source).toMatch(/@BaseColumn\([\s\S]*name:\s*"customer_id"[\s\S]*\)\s*customerId: number;/)
  })
})
