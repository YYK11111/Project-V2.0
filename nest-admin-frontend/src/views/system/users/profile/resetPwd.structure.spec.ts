import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

function readSource() {
  return readFileSync(resolve(__dirname, 'resetPwd.vue'), 'utf-8')
}

describe('profile reset password structure', () => {
  it('个人中心修改密码应保留旧密码并调用个人修改密码接口', () => {
    const source = readSource()

    expect(source).toContain('label="旧密码"')
    expect(source).toContain('v-model="user.passwordOld"')
    expect(source).toContain("import { updatePassword } from '../api'")
    expect(source).toContain('updatePassword(this.user)')
    expect(source).not.toContain('resetPassword(this.user)')
  })
})
