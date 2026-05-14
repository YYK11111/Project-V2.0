import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

function readApiSource() {
  return readFileSync(resolve(__dirname, 'api.ts'), 'utf-8')
}

describe('login api structure', () => {
  it('只保留当前页面和用户态实际在用的接口', () => {
    const source = readApiSource()

    expect(source).toContain('export function login')
    expect(source).toContain('export function getCaptchaImage')
    expect(source).toContain('export function register')
    expect(source).toContain('export function getUserInfo')
    expect(source).toContain('export function logout')

    expect(source).not.toContain('getCodeInSyetem')
    expect(source).not.toContain('getCodeImg')
    expect(source).not.toContain('getRegisterQrCode')
    expect(source).not.toContain('wxQrLogin')
    expect(source).not.toContain('findWxQrLoginInfo')
    expect(source).not.toContain('getExtensionRegisterUrl')
    expect(source).not.toContain('getInstallThirdAppUrl')
    expect(source).not.toContain('getCustomerServiceQrUrl')
    expect(source).not.toContain('noviceGuideInfo')
    expect(source).not.toContain('probationLogin')
    expect(source).not.toContain('getImageCode')
    expect(source).not.toContain('getCodeInPhone')
    expect(source).not.toContain('applyFn')
    expect(source).not.toContain('resetPwd')
  })
})
