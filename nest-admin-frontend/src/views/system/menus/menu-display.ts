export type MenuDisplayRow = {
  type?: string
  permissionKey?: string
  path?: string
}

type MenuTypeMap = Record<string, string>
type MenuTagType = 'success' | 'warning' | 'primary' | 'info'

function getMenuTypeLabel(type?: string, menuTypes?: MenuTypeMap) {
  return menuTypes?.[type || ''] || type || '-'
}

function getMenuTypeTagType(type?: string): MenuTagType {
  if (type === 'catalog') return 'warning'
  if (type === 'menu') return 'primary'
  if (type === 'button') return 'success'
  return 'info'
}

function isAccessMenu(row?: MenuDisplayRow) {
  const permissionKey = String(row?.permissionKey || '').trim().toLowerCase()
  const path = String(row?.path || '').trim().toLowerCase()

  return permissionKey.endsWith('/access') || path === 'access' || path.endsWith('-access')
}

export function getMenuDisplayTypeLabel(row?: MenuDisplayRow, menuTypes?: MenuTypeMap) {
  if (isAccessMenu(row)) return '默认'
  return getMenuTypeLabel(row?.type, menuTypes)
}

export function getMenuDisplayTypeTagType(row?: MenuDisplayRow): MenuTagType {
  if (isAccessMenu(row)) return 'info'
  return getMenuTypeTagType(row?.type)
}
