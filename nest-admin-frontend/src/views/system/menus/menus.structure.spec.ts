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

  it('树形维护和上级菜单选择默认不展开整棵树', () => {
    const source = readSource()

    expect(source).toContain("const treeExpanded = ref(false)")
    expect(source).toContain('const defaultExpandedMenuKeys = computed')
    expect(source).toContain('if (!normalizedKeyword) return []')
    expect(source).toContain('const menuDialogExpandedKeys = ref([])')
    expect(source).toContain('menuDialogExpandedKeys.value = []')
    expect(source).toContain(':default-expanded-keys="defaultExpandedMenuKeys"')
    expect(source).toContain(':default-expanded-keys="menuDialogExpandedKeys"')
    expect(source).toContain('applyDefaultTreeExpanded')
    expect(source).not.toContain('const topLevelKeys')
    expect(source).not.toContain('const currentPathKeys')
    expect(source).not.toContain(':default-expand-all="true"')
  })
})
