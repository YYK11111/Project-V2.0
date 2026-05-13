// @ts-nocheck
import request from '@/utils/request'
import { normalizePageData } from '@/utils/pageData'

const baseUrl = '/business/crm/interactions'

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

export function getInteractionTypes() {
  return request({ url: `${baseUrl}/getTypes`, method: 'get' })
}
