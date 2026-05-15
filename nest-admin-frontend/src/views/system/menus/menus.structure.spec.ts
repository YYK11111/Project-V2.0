import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

function readSource() {
  return readFileSync(resolve(__dirname, 'index.vue'), 'utf-8')
}

describe('system menus structure', () => {
  it('菜单列表审计提供查看操作并复用菜单弹窗只读展示', () => {
    const source = readSource()

    expect(source).toContain("const menuDialogMode = ref('add')")
    expect(source).toContain("const isMenuDialogView = computed(() => menuDialogMode.value === 'view')")
    expect(source).toContain('function openMenuDialog')
    expect(source).toContain("openMenuDialog('view', row)")
    expect(source).toContain('查看</el-button>')
    expect(source).toContain(':title="menuDialogTitle"')
    expect(source).toContain(':show-footer="!isMenuDialogView"')
    expect(source).toContain(':disabled="isMenuDialogView"')
    expect(source).toContain('查看菜单')
  })
})
