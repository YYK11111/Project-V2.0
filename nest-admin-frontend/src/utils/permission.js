import { useUserStore } from '@/stores/user'

function normalizePermissionKey(permissionKey) {
  return String(permissionKey || '').trim().replace(/\/listAll$/i, '/manageAll')
}

function normalizePermissionKeys(permissions = []) {
  return [...new Set(permissions.map((permissionKey) => normalizePermissionKey(permissionKey)).filter(Boolean))]
}

function getPermissionModuleKey(permissionKey) {
  const normalizedKey = normalizePermissionKey(permissionKey)
  const segments = normalizedKey.split('/').filter(Boolean)
  if (segments.length < 2) return ''
  return segments.slice(0, -1).join('/')
}

const businessReadActions = new Set([
  'list',
  'getOne',
  'statistics',
  'dashboard',
  'kanban',
  'backlog',
  'children',
  'history',
  'tasks',
  'home',
  'hot-keywords',
  'retrieveForAi',
])

const businessAccessModuleAliases = {
  'business/tasks/dependency': ['business/tasks'],
  'business/projects': ['business/workflow/tasks'],
}

const businessAccessActionMap = {
  'business/projects': new Set(['getOne', 'fieldPermissions']),
  'business/workflow/definitions': new Set(['list', 'getOne']),
  'business/workflow/instances': new Set(['list', 'getOne', 'history', 'tasks']),
  'business/workflow/tasks': new Set(['list', 'complete', 'transfer', 'addSign']),
}

function isBusinessReadPermission(permissionKey) {
  const normalizedKey = normalizePermissionKey(permissionKey)
  if (!normalizedKey.startsWith('business/')) return false
  const segments = normalizedKey.split('/').filter(Boolean)
  const action = segments.at(-1) || ''
  return businessReadActions.has(action)
}

function isBusinessModuleAccessPermission(permissionKey) {
  const normalizedKey = normalizePermissionKey(permissionKey)
  if (!normalizedKey.startsWith('business/')) return false
  if (isBusinessReadPermission(normalizedKey)) return true
  const moduleKey = getPermissionModuleKey(normalizedKey)
  const segments = normalizedKey.split('/').filter(Boolean)
  const action = segments.at(-1) || ''
  return businessAccessActionMap[moduleKey]?.has(action) || false
}

function hasModuleFullAccess(permissions = [], permissionKey) {
  const normalizedKey = normalizePermissionKey(permissionKey)
  if (!normalizedKey) return false
  const normalizedPermissions = normalizePermissionKeys(permissions)
  if (normalizedPermissions.includes('*')) return true
  const moduleKey = getPermissionModuleKey(normalizedKey)
  if (!moduleKey) return false
  return normalizedPermissions.includes(`${moduleKey}/manageAll`)
}

function hasModuleAccess(permissions = [], permissionKey) {
  const normalizedKey = normalizePermissionKey(permissionKey)
  if (!isBusinessModuleAccessPermission(normalizedKey)) return false
  const normalizedPermissions = normalizePermissionKeys(permissions)
  if (normalizedPermissions.includes('*')) return true
  const moduleKey = getPermissionModuleKey(normalizedKey)
  if (!moduleKey) return false
  const moduleKeys = [moduleKey, ...(businessAccessModuleAliases[moduleKey] || [])]
  return moduleKeys.some((key) => normalizedPermissions.includes(`${key}/access`))
}

/**
 * 字符权限校验
 * @param {Array} value 校验值
 * @returns {Boolean}
 */
export function checkPermi(value) {
  if (value && value instanceof Array && value.length > 0) {
    const permissions = normalizePermissionKeys(useUserStore().permissions || [])
    if (permissions.includes('*')) return true
    const permissionDatas = normalizePermissionKeys(value)

    const hasPermission = permissions.some((permission) => {
      return permissionDatas.includes(permission) || permissionDatas.some((permissionKey) => {
        return hasModuleFullAccess([permission], permissionKey) || hasModuleAccess([permission], permissionKey)
      })
    })

    if (!hasPermission) {
      return false
    }
    return true
  } else {
    console.error(`need roles! Like checkPermi="['system:user:add','system:user:edit']"`)
    return false
  }
}

/**
 * 角色权限校验
 * @param {Array} value 校验值
 * @returns {Boolean}
 */
export function checkRole(value) {
  if (value && value instanceof Array && value.length > 0) {
    const roles = useUserStore().roles || []
    const permissionRoles = value

    const hasRole = roles.some((role) => {
      return permissionRoles.includes(role)
    })

    if (!hasRole) {
      return false
    }
    return true
  } else {
    console.error(`need roles! Like checkRole="['admin','editor']"`)
    return false
  }
}
