import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

function readSource(file) {
  return readFileSync(resolve(__dirname, file), 'utf-8')
}

describe('customer share entry', () => {
  it('客户列表提供授权查看入口并调用授权接口', () => {
    const indexSource = readSource('index.vue')
    const apiSource = readSource('api.ts')

    expect(apiSource).toContain('grantCustomerViewAccess')
    expect(apiSource).toContain('getCustomerAuthUsers')
    expect(indexSource).toContain('授权查看')
    expect(indexSource).toContain('<UserSelect')
    expect(indexSource).toContain('handleGrantViewAccess')
  })
})
