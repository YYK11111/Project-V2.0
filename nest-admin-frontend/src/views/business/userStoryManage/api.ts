// @ts-nocheck
import request from '@/utils/request'

const baseUrl = '/business/stories'

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

export function getStatus() {
  return request({ url: `${baseUrl}/getStatus`, method: 'get' })
}

export function getType() {
  return request({ url: `${baseUrl}/getType`, method: 'get' })
}

export function getBacklog(projectIds) {
  return request({ url: `${baseUrl}/backlog`, method: 'get', params: { projectIds: projectIds?.join(',') } }).then((res) => {
    const list = res?.data?.data || res?.data || []
    return {
      ...res,
      list,
      data: list,
      rows: list,
      total: Array.isArray(list) ? list.length : 0,
    }
  })
}

export function updateStatus(id, status) {
  return request({ url: `${baseUrl}/${id}/status`, method: 'put', data: { status } })
}

export function assignToSprint(id, sprintId) {
  return request({ url: `${baseUrl}/${id}/assign-to-sprint`, method: 'post', data: { sprintId } })
}

export function removeFromSprint(id) {
  return request({ url: `${baseUrl}/${id}/remove-from-sprint`, method: 'post' })
}

export function getChildren(id) {
  return request({ url: `${baseUrl}/${id}/children`, method: 'get' }).then((res) => {
    const list = res?.data?.data || res?.data || []
    return {
      ...res,
      list,
      data: list,
      rows: list,
      total: Array.isArray(list) ? list.length : 0,
    }
  })
}
