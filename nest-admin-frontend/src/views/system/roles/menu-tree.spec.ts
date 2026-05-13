import { describe, expect, it } from 'vitest'
import {
  getMenuNodeTooltip,
  getMenuNodeTagType,
  getMenuNodeTypeLabel,
  getMenuTypeLabel,
  getMenuTypeTagType,
  getPermissionAction,
} from './menu-tree'

describe('role menu tree helpers', () => {
  it('为菜单类型提供稳定标签', () => {
    expect(getMenuTypeLabel('catalog')).toBe('目录')
    expect(getMenuTypeLabel('menu')).toBe('菜单')
    expect(getMenuTypeLabel('button')).toBe('按钮')
    expect(getMenuTypeTagType('catalog')).toBe('info')
    expect(getMenuTypeTagType('menu')).toBe('success')
    expect(getMenuTypeTagType('button')).toBe('warning')
  })

  it('能为项目按钮生成可读说明', () => {
    const tooltip = getMenuNodeTooltip({
      type: 'button',
      permissionKey: 'business/projects/add',
      desc: '新增项目权限',
      path: 'project-add',
    })

    expect(getPermissionAction('business/projects/add')).toBe('新增项目')
    expect(tooltip).toContain('类型：按钮')
    expect(tooltip).toContain('权限字符：business/projects/add')
    expect(tooltip).toContain('路径：project-add')
    expect(tooltip).toContain('说明：新增项目权限')
    expect(tooltip).toContain('作用：拥有后可以新增项目。')
  })

  it('能识别表单、详情、菜单、页面和列表节点', () => {
    const formNode = {
      type: 'menu',
      permissionKey: 'business/projectManage/form',
      component: 'business/projectManage/form',
      path: 'form',
      desc: '项目表单',
    }
    const detailNode = {
      type: 'menu',
      permissionKey: 'business/projectManage/detail',
      component: 'business/projectManage/detail',
      path: 'detail',
      desc: '项目详情',
    }
    const menuNode = {
      type: 'menu',
      permissionKey: 'business/projectManage/index',
      component: 'business/projectManage/index',
      path: 'projectInfo',
      desc: '项目列表入口',
    }
    const pageNode = {
      type: 'menu',
      permissionKey: 'business/goLiveRecords/page',
      component: 'business/goLiveRecords/page',
      path: 'goLiveRecords',
      desc: '上线单页面',
    }
    const listNode = {
      type: 'button',
      permissionKey: 'business/projects/list',
      path: 'project-list',
      desc: '项目列表查询权限',
    }

    expect(getMenuNodeTypeLabel(formNode)).toBe('表单')
    expect(getMenuNodeTagType(formNode)).toBe('warning')
    expect(getMenuNodeTooltip(formNode)).toContain('作用：拥有后可以进入对应表单页。')

    expect(getMenuNodeTypeLabel(detailNode)).toBe('详情')
    expect(getMenuNodeTagType(detailNode)).toBe('info')
    expect(getMenuNodeTooltip(detailNode)).toContain('作用：拥有后可以进入对应详情页。')

    expect(getMenuNodeTypeLabel(menuNode)).toBe('菜单')
    expect(getMenuNodeTagType(menuNode)).toBe('success')
    expect(getMenuNodeTooltip(menuNode)).toContain('作用：拥有后可以进入对应页面。')

    expect(getMenuNodeTypeLabel(pageNode)).toBe('页面')
    expect(getMenuNodeTagType(pageNode)).toBe('success')
    expect(getMenuNodeTooltip(pageNode)).toContain('作用：拥有后可以进入对应页面。')

    expect(getMenuNodeTypeLabel(listNode)).toBe('列表')
    expect(getMenuNodeTagType(listNode)).toBe('success')
    expect(getMenuNodeTooltip(listNode)).toContain('作用：拥有后可以查看项目列表。')
  })

  it('能为目录节点生成组织说明', () => {
    const tooltip = getMenuNodeTooltip({
      type: 'catalog',
      permissionKey: 'business/projectManage',
      desc: '项目管理',
    })

    expect(tooltip).toContain('类型：目录')
    expect(tooltip).toContain('作用：作为目录容器，用于组织下级菜单。')
  })
})
