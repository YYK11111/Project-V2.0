// @ts-nocheck
import request from '@/utils/request'
import { normalizePageData } from '@/utils/pageData'

const baseUrl = '/business/crm/customers'

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

export function grantCustomerViewAccess(id, userIds) {
  return request({ url: `${baseUrl}/${id}/auth`, method: 'post', data: { userIds } })
}

export function revokeCustomerViewAccess(id, userId) {
  return request({ url: `${baseUrl}/${id}/auth/${userId}`, method: 'delete' })
}

export function getCustomerAuthUsers(id) {
  return request({ url: `${baseUrl}/${id}/auth-users`, method: 'get' })
}

export const grantCustomerViewAccess = (data: {
  customerId: string;
  userIds: string[];
  permissions?: string[];
  grantType?: 'permanent' | 'temporary';
  startTime?: string;
  endTime?: string;
  canEdit?: string;
  grantReason?: string;
}) => {
  return request.post('/business/crm/customers/grantViewAccess', data)
}

export const revokeCustomerViewAccess = (data: {
  customerId: string;
  userId: string;
  reason?: string;
}) => {
  return request.post('/business/crm/customers/revokeViewAccess', data)
}

export const updateViewerStatus = (data: {
  customerId: string;
  viewerIds: string[];
  status: 'enabled' | 'disabled';
}) => {
  return request.post('/business/crm/customers/updateViewerStatus', data)
}
