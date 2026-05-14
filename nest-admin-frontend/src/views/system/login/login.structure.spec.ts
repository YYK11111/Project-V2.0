import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

function readLoginSource() {
  return readFileSync(resolve(__dirname, 'index.vue'), 'utf-8')
}

function readRegisterSource() {
  return readFileSync(resolve(__dirname, 'register.vue'), 'utf-8')
}

describe('login branding structure', () => {
  it('登录页不再渲染原项目说明文案', () => {
    const source = readLoginSource()

    expect(source).toContain("account: ''")
    expect(source).toContain("password: ''")
    expect(source).not.toContain('NestAdmin')
    expect(source).not.toContain('SYSTEM_SLOGAN')
    expect(source).not.toContain('loginSlogan')
    expect(source).not.toContain('基于 Nestjs')
  })

  it('注册页不再渲染原项目说明文案', () => {
    const source = readRegisterSource()

    expect(source).not.toContain('SYSTEM_SLOGAN')
    expect(source).not.toContain('loginSlogan')
    expect(source).not.toContain('基于 Nestjs')
  })
})
