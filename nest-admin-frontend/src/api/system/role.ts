import request from '@/utils/request'

export const listRole = (data) => request.get('/system/roles/list', data)

export const getRole = (id) => request.get('/system/roles/getOne/' + id)

export const addRole = (data) => request.post('/system/roles/add', data)

export const updateRole = (data) => request.put('/system/roles/update', data)

export const delRole = (id) => request.delete('/system/roles/del/' + id)

export const roleMenuTreeselect = (roleId) => request.get('/system/roles/roleMenuTreeselect/' + roleId)

export const menuTreeselect = () => request.get('/system/roles/menuTreeselect')

export const getLoginUserMenus = () => request.get('/system/roles/getLoginUserMenus')

export const authUserCancel = (data) => request.put('/system/roles/authUser/cancel', data)

export const authUserCancelAll = (data) => request.put('/system/roles/authUser/cancelAll', data)

export const authUserSelectAll = (data) => request.put('/system/roles/authUser/selectAll', data)

export const allocatedUserList = (data) => request.get('/system/roles/authUser/allocatedList', data)

export const unallocatedUserList = (data) => request.get('/system/roles/authUser/unallocatedList', data)
