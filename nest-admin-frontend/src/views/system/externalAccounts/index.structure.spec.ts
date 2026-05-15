import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

function readSource() {
  return readFileSync(resolve(__dirname, 'index.vue'), 'utf-8')
}

describe('external accounts page structure', () => {
  it('展示外部账号映射列表并支持同步飞书', () => {
    const source = readSource()

    expect(source).toContain("checkPermi(['system/externalAccounts/list'])")
    expect(source).toContain('business-list-page')
    expect(source).toContain('business-list-panel')
    expect(source).toContain('TableOperation')
    expect(source).toContain('批量同步飞书')
    expect(source).toContain('同步飞书')
    expect(source).toContain('UserID')
    expect(source).toContain('OpenID')
    expect(source).toContain('UnionID')
    expect(source).toContain('绑定状态')
    expect(source).toContain('外部用户姓名')
  })

  it('外部账号映射提供查看操作并复用映射弹窗只读展示', () => {
    const source = readSource()

    expect(source).toContain("const dialogMode = ref<'edit' | 'view'>('edit')")
    expect(source).toContain("const isViewMode = computed(() => dialogMode.value === 'view')")
    expect(source).toContain("label: '查看'")
    expect(source).toContain('onClick: () => openView(row)')
    expect(source).toContain('function openView(row: any)')
    expect(source).toContain(':title="dialogTitle"')
    expect(source).toContain(':show-footer="!isViewMode"')
    expect(source).toContain(':disabled="isViewMode"')
    expect(source).toContain('查看外部账号映射')
  })
})
