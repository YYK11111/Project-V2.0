export type MenuTreeNode = {
  name?: string
  desc?: string
  path?: string
  component?: string
  type?: string
  permissionKey?: string
}

const menuTypeLabelMap: Record<string, string> = {
  catalog: '目录',
  menu: '菜单',
  button: '按钮',
}

const menuTypeTagTypeMap: Record<string, 'info' | 'success' | 'warning'> = {
  catalog: 'info',
  menu: 'success',
  button: 'warning',
}

const menuNodeTypeLabelMap: Record<string, string> = {
  catalog: '目录',
  menu: '菜单',
  button: '按钮',
  list: '列表',
  form: '表单',
  detail: '详情',
  page: '页面',
}

const menuNodeTypeTagTypeMap: Record<string, 'info' | 'success' | 'warning'> = {
  catalog: 'info',
  menu: 'success',
  button: 'warning',
  list: 'success',
  form: 'warning',
  detail: 'info',
  page: 'success',
}

const permissionActionMap: Record<string, string> = {
  'business/projects/list': '查看项目列表',
  'business/projects/getOne': '查看项目详情',
  'business/projects/add': '新增项目',
  'business/projects/update': '修改项目',
  'business/projects/delete': '删除项目',
  'business/projects/archive': '归档项目',
  'business/projects/statistics': '查看项目统计',
  'business/projects/submitApproval': '提交项目审批',
  'business/projects/submitClose': '提交项目结项',
  'system/messages/recent': '查看最近消息',
  'system/messages/list': '查看消息列表',
  'system/messages/unread-count': '查看未读消息数量',
  'system/messages/markRead': '标记消息已读',
  'system/messages/markAllRead': '全部标记为已读',
  'system/messages/delete': '删除消息',
  'system/users/getProjectReminderPreference': '查看项目提醒偏好',
  'system/dept/getTrees': '查看部门树',
  'system/dept/list': '查看部门列表',
  'system/users/list': '查看用户列表',
  'business/projectMembers/stats': '查看项目成员统计',
  'business/project-members/stats': '查看项目成员统计',
  'system/loginLogs/getUserLoginProvinceList': '查看登录省份分布',
  'system/loginLogs/getVisitedNumChart': '查看访问趋势图',
}

export function getMenuTypeLabel(type?: string) {
  return menuTypeLabelMap[type || ''] || type || '未知'
}

export function getMenuTypeTagType(type?: string) {
  return menuTypeTagTypeMap[type || ''] || 'info'
}

export function getPermissionAction(permissionKey?: string) {
  if (!permissionKey) return ''
  return permissionActionMap[permissionKey] || ''
}

function inferMenuNodeType(data: MenuTreeNode) {
  const path = String(data?.path || '').trim().toLowerCase()
  const component = String(data?.component || '').trim().toLowerCase()
  const permissionKey = String(data?.permissionKey || '').trim().toLowerCase()

  if (data?.type === 'catalog') {
    return 'catalog'
  }

  if (path === 'form' || component.endsWith('/form') || permissionKey.endsWith('/form')) {
    return 'form'
  }

  if (path === 'detail' || component.endsWith('/detail') || permissionKey.endsWith('/detail')) {
    return 'detail'
  }

  if (component.endsWith('/page') || permissionKey.endsWith('/page')) {
    return 'page'
  }

  if (path === 'index' || component.endsWith('/index') || permissionKey.endsWith('/index')) {
    return 'menu'
  }

  if (permissionKey.endsWith('/list')) {
    return 'list'
  }

  if (data?.type === 'button') {
    return 'button'
  }

  return data?.type || 'menu'
}

export function getMenuNodeTypeLabel(data: MenuTreeNode) {
  const type = inferMenuNodeType(data)
  return menuNodeTypeLabelMap[type] || getMenuTypeLabel(type)
}

export function getMenuNodeTagType(data: MenuTreeNode) {
  const type = inferMenuNodeType(data)
  return menuNodeTypeTagTypeMap[type] || getMenuTypeTagType(type)
}

export function getMenuNodeTooltipLines(data: MenuTreeNode) {
  const typeLabel = getMenuNodeTypeLabel(data)
  const lines = [
    `类型：${typeLabel}`,
    `权限字符：${data?.permissionKey || '无'}`,
  ]

  if (data?.path) {
    lines.push(`路径：${data.path}`)
  }

  if (data?.desc) {
    lines.push(`说明：${data.desc}`)
  }

  const actionText = getPermissionAction(data?.permissionKey)
  const nodeType = inferMenuNodeType(data)
  if (nodeType === 'catalog') {
    lines.push('作用：作为目录容器，用于组织下级菜单。')
  } else if (nodeType === 'form') {
    lines.push('作用：拥有后可以进入对应表单页。')
  } else if (nodeType === 'detail') {
    lines.push('作用：拥有后可以进入对应详情页。')
  } else if (nodeType === 'menu') {
    lines.push('作用：拥有后可以进入对应页面。')
  } else if (nodeType === 'list') {
    lines.push(`作用：拥有后可以${actionText || '查看对应列表'}。`)
  } else if (nodeType === 'page') {
    lines.push('作用：拥有后可以进入对应页面。')
  } else if (nodeType === 'button') {
    lines.push(`作用：拥有后可以${actionText || '执行对应按钮操作'}。`)
  } else {
    lines.push('作用：用于控制菜单访问或按钮操作。')
  }

  return lines
}

export function getMenuNodeTooltip(data: MenuTreeNode) {
  return getMenuNodeTooltipLines(data).join('\n')
}
