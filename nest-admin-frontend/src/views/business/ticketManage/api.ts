// @ts-nocheck
import request from '@/utils/request'
import { normalizePageData } from '@/utils/pageData'

const baseUrl = '/business/tickets'

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

export function getType() {
  return request({ url: `${baseUrl}/getType`, method: 'get' })
}

export function getStatus() {
  return request({ url: `${baseUrl}/getStatus`, method: 'get' })
}

export function getPriority() {
  return request({ url: `${baseUrl}/getPriority`, method: 'get' })
}

export function getSeverity() {
  return request({ url: `${baseUrl}/getSeverity`, method: 'get' })
}

export function getRootCauseCategory() {
  return request({ url: `${baseUrl}/getRootCauseCategory`, method: 'get' })
}

// 获取项目列表（用于表单选择）
export function getProjectList() {
  return request({ url: '/business/projects/list', method: 'get', params: { pageNum: 1, pageSize: 100 } }).then(normalizePageData)
}

// 获取任务列表（用于表单选择）
export function getTaskList(projectId) {
  const params = projectId ? { projectId, pageNum: 1, pageSize: 100 } : { pageNum: 1, pageSize: 100 }
  return request({ url: '/business/tasks/list', method: 'get', params }).then(normalizePageData)
}

export function submitApproval(id) {
  return request({ url: `${baseUrl}/${id}/submit-approval`, method: 'post' })
}

export function publishKnowledge(id) {
  return request({ url: `${baseUrl}/${id}/publish-knowledge`, method: 'post' })
}

export function convertToTask(id) {
  return request({ url: `${baseUrl}/${id}/convert-to-task`, method: 'post' })
}

export function dispatchTicket(id, data) {
  return request({ url: `${baseUrl}/${id}/dispatch`, method: 'post', data })
}

export function batchDispatchTickets(ids, data) {
  return request({ url: `${baseUrl}/batch-dispatch`, method: 'post', data: { ids, ...data } })
}

export function transferTicket(id, data) {
  return request({ url: `${baseUrl}/${id}/transfer`, method: 'post', data })
}

export function finishTicket(id, data) {
  return request({ url: `${baseUrl}/${id}/finish`, method: 'post', data })
}

export function verifyPass(id, data) {
  return request({ url: `${baseUrl}/${id}/verify-pass`, method: 'post', data })
}

export function verifyReject(id, data) {
  return request({ url: `${baseUrl}/${id}/verify-reject`, method: 'post', data })
}

export function reopenTicket(id, data) {
  return request({ url: `${baseUrl}/${id}/reopen`, method: 'post', data })
}

export function getActionLogs(id) {
  return request({ url: `${baseUrl}/${id}/action-logs`, method: 'get' })
}

export function getDispatchHistory(id) {
  return request({ url: `${baseUrl}/${id}/dispatch-history`, method: 'get' })
}
