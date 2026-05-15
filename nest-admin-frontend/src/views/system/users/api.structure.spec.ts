import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

function readSource() {
  return readFileSync(resolve(__dirname, 'api.ts'), 'utf-8')
}

describe('system users api structure', () => {
  it('应区分管理员重置密码和个人中心修改密码接口', () => {
    const source = readSource()

    expect(source).toContain('export const resetPassword = (data) => put(`${serve}/resetPassword`, data)')
    expect(source).toContain('export const updatePassword = (data) => put(`${serve}/updatePassword`, data)')
  })

  it('提供外部账号映射查询和保存接口', () => {
    const source = readSource()

    expect(source).toContain("const externalAccountServe = window.sysConfig.serves.system + '/external-accounts'")
    expect(source).toContain('export const getExternalAccount = (userId, platform = \'feishu\') =>')
    expect(source).toContain('export const saveExternalAccount = (data) => post(`${externalAccountServe}/save`, data)')
  })
})
