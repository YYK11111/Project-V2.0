// @ts-nocheck
import request from '@/utils/request'
import { addComment, updateComment, deleteComment, getTaskComments } from '../taskCommentManage/api'

const baseUrl = '/business/tasks'

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

export function updateProgress(id, progress) {
  return request({ url: `${baseUrl}/progress/${id}`, method: 'post', data: { progress } })
}

export function getStatus() {
  return request({ url: `${baseUrl}/getStatus`, method: 'get' })
}

export function getPriority() {
  return request({ url: `${baseUrl}/getPriority`, method: 'get' })
}

export function getKanbanData(projectId) {
  return request({ url: `${baseUrl}/kanban/${projectId}`, method: 'get' })
}

// 获取项目列表（用于表单选择）
export function getProjectList() {
  return request({ url: '/business/projects/list', method: 'get', params: { pageNum: 1, pageSize: 100 } }).then(normalizePageData)
}

// 获取任务依赖列表
export function getDependencies(taskId) {
  return request({ url: `${baseUrl}/${taskId}/dependencies`, method: 'get' })
}

// 获取后置任务列表
export function getDependents(taskId) {
  return request({ url: `${baseUrl}/${taskId}/dependents`, method: 'get' })
}

// 添加任务依赖
export function addDependency(taskId, dependencyId) {
  return request({ url: `${baseUrl}/${taskId}/dependencies`, method: 'post', data: { dependencyId } })
}

// 移除任务依赖
export function removeDependency(taskId, dependencyId) {
  return request({ url: `${baseUrl}/${taskId}/dependencies/${dependencyId}`, method: 'delete' })
}

// 检测循环依赖
export function checkCircularDependency(taskId, dependencyId) {
  return request({ url: `${baseUrl}/${taskId}/check-circular`, method: 'post', data: { dependencyId } })
}

export function submitApproval(id) {
  return request({ url: `${baseUrl}/${id}/submit-approval`, method: 'post' })
}

export { addComment, updateComment, deleteComment, getTaskComments }

export function getTimeLogs(taskId) {
  return request({ url: `${baseUrl}/${taskId}/timelogs`, method: 'get' })
}

export function addTimeLog(taskId, data) {
  return request({ url: `${baseUrl}/${taskId}/timelogs`, method: 'post', data })
}

export function updateTimeLog(id, data) {
  return request({ url: `${baseUrl}/timelogs/${id}`, method: 'put', data })
}

export function deleteTimeLog(id) {
  return request({ url: `${baseUrl}/timelogs/${id}`, method: 'delete' })
}
