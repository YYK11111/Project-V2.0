import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

function readAcceptanceForm() {
  return readFileSync(resolve(__dirname, 'form.vue'), 'utf-8')
}

describe('验收单表单路由守卫', () => {
  it('验收单表单仅在自身路由下响应 id 变化', () => {
    const source = readAcceptanceForm()

    expect(source).toContain('useCurrentRouteGuard')
    expect(source).toContain("'/acceptanceManage/form'")
  })
})
