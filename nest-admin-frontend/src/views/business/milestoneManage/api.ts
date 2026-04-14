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
  return request.get('/business/milestones/list', params).then(normalizePageData)
}

export function getOne(id) {
  return request.get(`/business/milestones/getOne/${id}`)
}

export function save(data) {
  return request.post('/business/milestones/save', data)
}

export function update(data) {
  return request.put('/business/milestones/update', data)
}

export function del(ids) {
  return request.delete(`/business/milestones/del/${ids}`)
}

export function getStatus() {
  return request.get('/business/milestones/getStatus')
}

export function updateStatus(id, status) {
  return request.post(`/business/milestones/status/${id}`, { status })
}
