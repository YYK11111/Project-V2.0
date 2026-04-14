import request from '@/utils/request'

export function treeselect() {
  return request.get('/system/roles/menuTreeselect').then((res) => res.data?.data || res.data || [])
}

export function roleMenuTreeselect(roleId) {
  return request.get('/system/roles/roleMenuTreeselect/' + roleId).then((res) => {
    const data = res.data?.data || res.data || {}
    return {
      menus: data.menus || [],
      checkedKeys: data.checkedKeys || [],
    }
  })
}
