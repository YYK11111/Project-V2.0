import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

function readChangeFormSource() {
  return readFileSync(resolve(__dirname, 'form.vue'), 'utf-8')
}

describe('changeManage 表单治理守卫', () => {
  it('新增变更应支持从路由预填项目和变更类型', () => {
    const source = readChangeFormSource()

    expect(source).toContain("projectId: String(route.query.projectId || '')")
    expect(source).toContain("type: String(route.query.type || '6')")
  })
})
