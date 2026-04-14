import request from '@/utils/request'

function normalizePageData(res) {
  const page = res?.data?.data || res?.data || {}
  const list = Array.isArray(page) ? page : page.list || page.rows || page.data || []
  const total = Number((Array.isArray(page) ? res?.total : page.total) || res?.total || 0)
  return {
    ...res,
    list,
    data: list,
    rows: list,
    total,
  }
}

// 获取项目成员列表
export function getList(params) {
  return request({
    url: '/business/project-members',
    method: 'get',
    params
  }).then(normalizePageData)
}

// 获取角色选项
export function getRoles() {
  return request({
    url: '/business/project-members/getRoles',
    method: 'get'
  })
}

// 添加项目成员
export function addMember(data) {
  return request({
    url: '/business/project-members',
    method: 'post',
    data
  })
}

// 更新成员角色
export function updateMember(id, data) {
  return request({
    url: `/business/project-members/${id}`,
    method: 'put',
    data
  })
}

// 移除项目成员
export function removeMember(id) {
  return request({
    url: `/business/project-members/${id}`,
    method: 'delete'
  })
}

// 获取项目成员列表（不包含分页）
export function getProjectMembers(projectId) {
  return request({
    url: `/business/project-members/project/${projectId}`,
    method: 'get'
  }).then((res) => ({
    ...res,
    list: res?.data || [],
  }))
}

// 检查用户是否为项目成员
export function checkMembership(projectId, userId) {
  return request({
    url: `/business/project-members/check/${projectId}/${userId}`,
    method: 'get'
  })
}

// 检查用户是否为项目经理
export function checkManagerRole(projectId, userId) {
  return request({
    url: `/business/project-members/check-manager/${projectId}/${userId}`,
    method: 'get'
  })
}
