import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

function readSource() {
  return readFileSync(resolve(__dirname, 'index.vue'), 'utf-8')
}

describe('system roles structure', () => {
  it('角色管理提供查看操作并复用角色弹窗只读展示', () => {
    const source = readSource()

    expect(source).toContain("const dialogMode = ref<'add' | 'edit' | 'view'>('add')")
    expect(source).toContain("const isViewMode = computed(() => dialogMode.value === 'view')")
    expect(source).toContain("label: '查看'")
    expect(source).toContain('onClick: () => handleView(row)')
    expect(source).toContain('function handleView(row: any)')
    expect(source).toContain(":title=\"dialogTitle\"")
    expect(source).toContain(':show-footer="!isViewMode"')
    expect(source).toContain(':disabled="isViewMode"')
    expect(source).toContain(':props="menuTreeProps"')
    expect(source).toContain('disabled: () => isViewMode.value')
    expect(source).toContain('查看角色')
  })
})
