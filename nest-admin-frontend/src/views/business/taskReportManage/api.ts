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

export function getList(params) {
  return request({
    url: '/business/tasks/timelogs',
    method: 'get',
    params,
  }).then(normalizePageData)
}

export function addReport(taskId, data) {
  return request({
    url: `/business/tasks/${taskId}/timelogs`,
    method: 'post',
    data,
  })
}

export function updateReport(id, data) {
  return request({
    url: `/business/tasks/timelogs/${id}`,
    method: 'put',
    data,
  })
}

export function deleteReport(id) {
  return request({
    url: `/business/tasks/timelogs/${id}`,
    method: 'delete',
  })
}
