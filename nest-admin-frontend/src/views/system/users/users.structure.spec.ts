import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

function readSource() {
  return readFileSync(resolve(__dirname, 'index.vue'), 'utf-8')
}

describe('system users structure', () => {
  it('用户管理区分登录名和姓名，并展示基础联系方式与性别', () => {
    const source = readSource()

    expect(source).toContain('v-model="query.name" label="登录名" prop="name"')
    expect(source).toContain('v-model="query.nickname" label="姓名" prop="nickname"')
    expect(source).toContain('v-model="query.email" label="邮箱" prop="email"')
    expect(source).toContain('label="登录名" prop="name"')
    expect(source).toContain('label="姓名" prop="nickname"')
    expect(source).toContain('label="邮箱" prop="email"')
    expect(source).toContain('label="性别" prop="gender"')
    expect(source).toContain('v-model="form.name" prop="name" label="登录名"')
    expect(source).toContain('v-model="form.nickname" prop="nickname" label="姓名"')
    expect(source).toContain('v-model="form.email" prop="email" label="邮箱"')
    expect(source).toContain('v-model="form.gender" prop="gender" label="性别"')
  })

  it('新增用户支持设置密码且编辑用户不直接修改密码', () => {
    const source = readSource()

    expect(source).toContain('v-if="!form.id"')
    expect(source).toContain('v-model="form.password" prop="password" label="密码"')
    expect(source).toContain('show-password')
  })

  it('用户管理重置密码不要求填写旧密码', () => {
    const source = readSource()

    expect(source).not.toContain('v-model="form.passwordOld"')
    expect(source).not.toContain('label="旧密码"')
    expect(source).toContain('v-model="form.passwordNew" prop="password" label="新密码"')
    expect(source).toContain('v-model="form.passwordNewConfirm"')
  })

  it('用户管理在编辑弹窗展示飞书用户ID并在提交后同步外部账号映射', () => {
    const source = readSource()

    expect(source).toContain('外部账号')
    expect(source).toContain('label="飞书用户ID"')
    expect(source).toContain("platform: 'feishu'")
    expect(source).toContain('saveExternalAccount')
    expect(source).toContain('getExternalAccount')
    expect(source).toContain('同步飞书')
    expect(source).toContain('syncCurrentFeishuAccount')
  })
})
