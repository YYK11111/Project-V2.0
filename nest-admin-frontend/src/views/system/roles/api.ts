// @ts-nocheck
import {
  addRole,
  allocatedUserList as allocatedUserListApi,
  authUserCancel,
  authUserCancelAll,
  authUserSelectAll,
  delRole,
  getLoginUserMenus,
  getRole as getRoleApi,
  listRole as listRoleApi,
  menuTreeselect as menuTreeselectApi,
  roleMenuTreeselect as roleMenuTreeselectApi,
  unallocatedUserList as unallocatedUserListApi,
  updateRole,
} from '@/api/system/role'

const normalizeRole = (role = {}) => ({
  ...role,
  id: role.id,
  name: role.name,
  permissionKey: role.permissionKey,
})

function getNestedData(res: any) {
  return res?.data?.data ?? res?.data
}

export const getList = async (data) => {
  const res = await listRoleApi(data)
  return {
    ...res,
    total: Number(res.total || 0),
    data: (res.data || []).map(normalizeRole),
  }
}

export const getOne = async (id) => {
  const res = await getRoleApi(id)
  return normalizeRole(res.data || {})
}

export const getMenuTree = async () => {
  const res = await menuTreeselectApi()
  return getNestedData(res) || []
}

export const getRoleMenuTree = async (roleId) => {
  const res = await roleMenuTreeselectApi(roleId)
  const data = getNestedData(res) || {}
  return {
    menus: data.menus || [],
    checkedKeys: data.checkedKeys || [],
  }
}

export const getAllocatedUserList = async (data) => {
  const res = await allocatedUserListApi(data)
  const page = getNestedData(res) || {}
  return {
    total: Number(page.total || 0),
    data: page.list || [],
  }
}

export const getUnallocatedUserList = async (data) => {
  const res = await unallocatedUserListApi(data)
  const page = getNestedData(res) || {}
  return {
    total: Number(page.total || 0),
    data: page.list || [],
  }
}

export const save = (data) => {
  return data?.id ? updateRole(data) : addRole(data)
}

export { delRole, delRole as del, getLoginUserMenus, authUserCancel, authUserCancelAll, authUserSelectAll }
