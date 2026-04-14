import request from '@/utils/request'
import { useUserStore } from '@/stores/user'

// 获取当前用户ID的辅助函数
const getUserId = (): string => {
  return useUserStore().id || ''
}

const normalizeTableData = (res: any) => {
  const payload = res?.data?.data || res?.data || {}
  const list = Array.isArray(payload) ? payload : payload.list || payload.rows || []
  const total = Number((Array.isArray(payload) ? res?.total : payload.total || res?.total) || 0)
  return {
    ...res,
    list,
    data: list,
    rows: list,
    total,
  }
}

// 工作流定义 API
export function getWorkflowDefinitions() {
  return request({
    url: '/workflow/definitions',
    method: 'get',
  }).then(normalizeTableData)
}

export function getWorkflowDefinition(id: string) {
  return request({
    url: `/workflow/definitions/${id}`,
    method: 'get',
  })
}

export function createWorkflowDefinition(data: any) {
  return request({
    url: '/workflow/definitions/save',
    method: 'post',
    data,
  })
}

export function updateWorkflowDefinition(id: string, data: any) {
  return request({
    url: '/workflow/definitions/save',
    method: 'post',
    data: { ...data, id },
  })
}

export function publishWorkflowDefinition(id: string) {
  return request({
    url: `/workflow/definitions/${id}/publish`,
    method: 'post',
  })
}

export function unpublishWorkflowDefinition(id: string) {
  return request({
    url: `/workflow/definitions/${id}/unpublish`,
    method: 'post',
  })
}

export function deleteWorkflowDefinition(id: string) {
  return request({
    url: `/workflow/definitions/${id}`,
    method: 'delete',
  })
}

// 工作流实例 API
export function startWorkflow(data: any) {
  const userId = getUserId()
  return request({
    url: '/workflow/instances/start',
    method: 'post',
    params: { userId },
    data,
  })
}

export function getWorkflowInstance(id: string) {
  return request({
    url: `/workflow/instances/${id}`,
    method: 'get',
  })
}

export function getWorkflowInstances(params: any = {}) {
  return request({
    url: '/workflow/instances',
    method: 'get',
    params,
  }).then(normalizeTableData)
}

// 工作流任务 API
export function getMyTasks(params: any = {}) {
  const userId = getUserId()
  return request({
    url: '/workflow/tasks/my',
    method: 'get',
    params: { userId, ...params },
  }).then(normalizeTableData)
}

export function completeTask(id: string, data: any) {
  const userId = getUserId()
  return request({
    url: `/workflow/tasks/${id}/complete`,
    method: 'post',
    params: { userId },
    data,
  })
}

export function transferTask(id: string, data: any) {
  const userId = getUserId()
  return request({
    url: `/workflow/tasks/${id}/transfer`,
    method: 'post',
    params: { userId },
    data,
  })
}

export function addSignTask(id: string, data: any) {
  const userId = getUserId()
  return request({
    url: `/workflow/tasks/${id}/add-sign`,
    method: 'post',
    params: { userId },
    data,
  })
}

export function withdrawWorkflow(instanceId: string, data?: any) {
  const userId = getUserId()
  return request({
    url: `/workflow/instances/${instanceId}/withdraw`,
    method: 'post',
    params: { userId },
    data,
  })
}

export function cancelWorkflowInstance(instanceId: string, data?: any) {
  const userId = getUserId()
  return request({
    url: `/workflow/instances/${instanceId}/cancel`,
    method: 'post',
    params: { userId },
    data,
  })
}

export function getWorkflowHistory(instanceId: string) {
  return request({
    url: `/workflow/instances/${instanceId}/history`,
    method: 'get',
  })
}

export function getWorkflowInstanceTasks(instanceId: string) {
  return request({
    url: `/workflow/instances/${instanceId}/tasks`,
    method: 'get',
  })
}

export function copyWorkflowDefinition(id: string) {
  return request({
    url: `/workflow/definitions/${id}/copy`,
    method: 'post',
  })
}

// 业务对象配置 API
export function getBusinessConfigs(businessType?: string) {
  return request({
    url: '/workflow/business-configs',
    method: 'get',
    params: { businessType },
  }).then(normalizeTableData)
}

export function getBusinessConfig(businessType: string) {
  return request({
    url: `/workflow/business-configs/${businessType}`,
    method: 'get',
  })
}

export function saveBusinessConfig(data: any) {
  return request({
    url: '/workflow/business-configs/save',
    method: 'post',
    data,
  })
}

export function updateBusinessConfig(id: string, data: any) {
  return request({
    url: `/workflow/business-configs/${id}`,
    method: 'put',
    data,
  })
}

export function deleteBusinessConfig(id: string) {
  return request({
    url: `/workflow/business-configs/${id}`,
    method: 'delete',
  })
}

export function getBusinessFields(businessType: string, params: any = {}) {
  return request({
    url: `/workflow/business-fields/${businessType}`,
    method: 'get',
    params,
  })
}

export function getAllFieldMappings() {
  return request({
    url: '/workflow/business-fields',
    method: 'get',
  })
}

export function generateFieldMappings(businessTypes?: string[]) {
  return request({
    url: '/workflow/business-fields/generate',
    method: 'post',
    data: { businessTypes },
  })
}

export function updateFieldMapping(id: string, data: any) {
  return request({
    url: `/workflow/business-fields/${id}`,
    method: 'put',
    data,
  })
}
