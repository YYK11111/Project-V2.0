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
  return request.get('/business/sprints/list', params).then(normalizePageData)
}

export function getOne(id) {
  return request.get(`/business/sprints/getOne/${id}`)
}

export function save(data) {
  return request.post('/business/sprints/save', data)
}

export function update(data) {
  return request.put('/business/sprints/update', data)
}

export function del(ids) {
  return request.delete(`/business/sprints/del/${ids}`)
}

export function getStatus() {
  return request.get('/business/sprints/getStatus')
}

export function getBurndown(id) {
  return request.get(`/business/sprints/${id}/burndown`)
}

export function getVelocity(id) {
  return request.get(`/business/sprints/${id}/velocity`)
}

export function startSprint(id) {
  return request.post(`/business/sprints/${id}/start`)
}

export function completeSprint(id) {
  return request.post(`/business/sprints/${id}/complete`)
}
