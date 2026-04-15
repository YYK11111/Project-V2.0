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

// 获取任务评论列表
export function getList(params) {
  return request({
    url: '/business/task-comments',
    method: 'get',
    params,
  }).then(normalizePageData)
}

// 添加任务评论
export function addComment(data) {
  return request({
    url: '/business/task-comments',
    method: 'post',
    data,
  })
}

// 更新评论
export function updateComment(id, data) {
  return request({
    url: `/business/task-comments/${id}`,
    method: 'put',
    data,
  })
}

// 删除评论
export function deleteComment(id) {
  return request({
    url: `/business/task-comments/${id}`,
    method: 'delete',
  })
}

// 获取任务的评论列表
export function getTaskComments(taskId) {
  return request({
    url: `/business/task-comments/task/${taskId}`,
    method: 'get',
  })
}

// 获取用户的评论列表
export function getUserComments(userId) {
  return request({
    url: `/business/task-comments/user/${userId}`,
    method: 'get',
  })
}
