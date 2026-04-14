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
  return request.get('/business/risks/list', params).then(normalizePageData)
}

export function getOne(id) {
  return request.get(`/business/risks/getOne/${id}`)
}

export function save(data) {
  return request.post('/business/risks/save', data)
}

export function update(data) {
  return request.put('/business/risks/update', data)
}

export function del(ids) {
  return request.delete(`/business/risks/del/${ids}`)
}

export function getStatus() {
  return request.get('/business/risks/getStatus')
}

export function getLevel() {
  return request.get('/business/risks/getLevel')
}

export function getCategory() {
  return request.get('/business/risks/getCategory')
}

export function resolve(id) {
  return request.post(`/business/risks/resolve/${id}`)
}
