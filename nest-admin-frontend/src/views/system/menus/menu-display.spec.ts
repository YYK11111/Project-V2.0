import { describe, expect, it } from 'vitest'
import { getMenuDisplayTypeLabel, getMenuDisplayTypeTagType } from './menu-display'

describe('system menu display helpers', () => {
  const menuTypes = {
    catalog: '目录',
    menu: '菜单',
    button: '按钮',
  }

  it('将 access 权限菜单展示为默认类型', () => {
    const accessByPermission = {
      type: 'button',
      permissionKey: 'business/projects/access',
      path: 'project-access',
    }
    const accessByPath = {
      type: 'button',
      permissionKey: '',
      path: 'task-access',
    }

    expect(getMenuDisplayTypeLabel(accessByPermission, menuTypes)).toBe('默认')
    expect(getMenuDisplayTypeTagType(accessByPermission)).toBe('info')
    expect(getMenuDisplayTypeLabel(accessByPath, menuTypes)).toBe('默认')
  })

  it('非 access 菜单保持原有类型展示', () => {
    const buttonMenu = {
      type: 'button',
      permissionKey: 'business/projects/add',
      path: 'project-add',
    }

    expect(getMenuDisplayTypeLabel(buttonMenu, menuTypes)).toBe('按钮')
    expect(getMenuDisplayTypeTagType(buttonMenu)).toBe('success')
  })
})
