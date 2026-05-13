// @ts-nocheck
import request from '@/utils/request'
import { normalizePageData } from '@/utils/pageData'

const baseUrl = '/business/projects'

export function getList(params) {
  return request({ url: `${baseUrl}/list`, method: 'get', params }).then(normalizePageData)
}

export function getOne(id) {
  return request({ url: `${baseUrl}/getOne/${id}`, method: 'get' })
}

export function getDashboard(id) {
  return request({ url: `${baseUrl}/dashboard/${id}`, method: 'get' })
}

export function getFieldPermissions(id) {
  return request({ url: `${baseUrl}/field-permissions/${id}`, method: 'get' })
}

export function getCockpit(params) {
  return request({ url: `${baseUrl}/cockpit`, method: 'get', params })
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

export function archive(id) {
  return request({ url: `${baseUrl}/archive/${id}`, method: 'post' })
}

export function getStatus() {
  return request({ url: `${baseUrl}/getStatus`, method: 'get' })
}

export function getPriority() {
  return request({ url: `${baseUrl}/getPriority`, method: 'get' })
}

export function getProjectType() {
  return request({ url: `${baseUrl}/getProjectType`, method: 'get' })
}

export function submitApproval(id) {
  return request({ url: `${baseUrl}/${id}/submit-approval`, method: 'post' })
}

export function submitClose(id) {
  return request({ url: `${baseUrl}/${id}/submit-close`, method: 'post' })
}

export function publishCloseReview(id) {
  return request({ url: `${baseUrl}/${id}/publish-close-review`, method: 'post' })
}

export function syncProjectAlerts(id) {
  return request({ url: `${baseUrl}/${id}/sync-alerts`, method: 'post' })
}

export function recalculateProgress(projectIds) {
  return request({ url: `${baseUrl}/recalculate-progress`, method: 'post', data: { projectIds } })
}
