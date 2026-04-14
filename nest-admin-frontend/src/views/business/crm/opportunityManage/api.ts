// @ts-nocheck
import request from '@/utils/request'

const baseUrl = '/business/crm/opportunities'

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
  return request({ url: `${baseUrl}/list`, method: 'get', params }).then(normalizePageData)
}

export function getOne(id) {
  return request({ url: `${baseUrl}/getOne/${id}`, method: 'get' })
}

export function save(data) {
  return request({ url: `${baseUrl}/save`, method: 'post', data })
}

export function update(data) {
  return request({ url: `${baseUrl}/update`, method: 'put', data })
}

export function del(ids) {
  return request({ url: `${baseUrl}/del/${ids}`, method: 'delete' })
}

export function getStages() {
  return request({ url: `${baseUrl}/getStages`, method: 'get' })
}
