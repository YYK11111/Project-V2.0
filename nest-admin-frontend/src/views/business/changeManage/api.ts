import request from '@/utils/request'

function normalizePageData(res) {
  const page = res?.data?.data || res?.data || {}
  const list = page.list || []
  const total = Number(page.total || 0)
  return {
    ...res,
    list,
    data: list,
    rows: list,
    total,
  }
}

export function getList(params) {
  return request.get('/business/changes/list', params).then(normalizePageData)
}

export function getOne(id) {
  return request.get(`/business/changes/getOne/${id}`)
}

export function save(data) {
  return request.post('/business/changes/save', data)
}

export function update(data) {
  return request.put('/business/changes/update', data)
}

export function del(ids) {
  return request.delete(`/business/changes/del/${ids}`)
}

export function getStatus() {
  return request.get('/business/changes/getStatus')
}

export function getType() {
  return request.get('/business/changes/getType')
}

export function getImpact() {
  return request.get('/business/changes/getImpact')
}

export function approve(id, data) {
  return request.post(`/business/changes/approve/${id}`, data)
}

export function reject(id, data) {
  return request.post(`/business/changes/reject/${id}`, data)
}
