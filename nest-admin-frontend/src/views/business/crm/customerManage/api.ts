// @ts-nocheck
import request from '@/utils/request'
import { normalizePageData } from '@/utils/pageData'

const baseUrl = '/business/crm/customers'

function getNestedData(res: any) {
  return res?.data?.data ?? res?.data ?? res
}

function normalizeListResult(res: any) {
  const page = getNestedData(res) || {}
  return {
    total: Number(page.total || 0),
    data: page.list || [],
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

export function getCustomerTypes() {
  return request({ url: `${baseUrl}/getTypes`, method: 'get' })
}

export function getCustomerLevels() {
  return request({ url: `${baseUrl}/getLevels`, method: 'get' })
}

export function getCustomerStatuses() {
  return request({ url: `${baseUrl}/getStatuses`, method: 'get' })
}

export function submitApproval(id) {
  return request({ url: `${baseUrl}/${id}/submit-approval`, method: 'post' })
}

export function grantCustomerViewAccess(data: {
  customerId: string;
  userIds: string[];
  permissions?: string[];
  grantType?: 'permanent' | 'temporary';
  startTime?: string;
  endTime?: string;
  canEdit?: string;
  grantReason?: string;
}) {
  return request.post('/business/crm/customers/grantViewAccess', data)
}

export function getAllocatedViewerList(customerId: string, params) {
  return request.get(`${baseUrl}/${customerId}/viewers/allocatedList`, params).then(normalizeListResult)
}

export function getUnallocatedViewerList(customerId: string, params) {
  return request.get(`${baseUrl}/${customerId}/viewers/unallocatedList`, params).then(normalizeListResult)
}

export function grantCustomerViewers(customerId: string, data: {
  userIds: string[];
  grantType?: 'permanent' | 'temporary';
  startTime?: string;
  endTime?: string;
  canEdit?: string;
  grantReason?: string;
}) {
  return request.post(`${baseUrl}/${customerId}/viewers/selectAll`, data)
}

export function cancelCustomerViewer(customerId: string, data: {
  userId: string;
  reason?: string;
}) {
  return request.put(`${baseUrl}/${customerId}/viewers/cancel`, data)
}

export function cancelCustomerViewers(customerId: string, data: {
  userIds: string[] | string;
  reason?: string;
}) {
  return request.put(`${baseUrl}/${customerId}/viewers/cancelAll`, data)
}

export function getCustomerViewerRecords(customerId: string, params) {
  return request.get(`${baseUrl}/${customerId}/viewers/records`, params).then(normalizeListResult)
}

export function revokeCustomerViewAccess(data: {
  customerId: string;
  userId: string;
  reason?: string;
}) {
  return request.post('/business/crm/customers/revokeViewAccess', data)
}

export function getCustomerAuthUsers(id) {
  return request({ url: `${baseUrl}/${id}/auth-users`, method: 'get' })
}

export const updateViewerStatus = (data: {
  customerId: string;
  viewerIds: string[];
  status: 'enabled' | 'disabled';
}) => {
  return request.post('/business/crm/customers/updateViewerStatus', data)
}
