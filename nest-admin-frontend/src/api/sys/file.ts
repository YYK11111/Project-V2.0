import request from '@/utils/request'

const serve = '/system/file'

export function createFile(data) {
  return request.post(serve, data)
}

export function deleteFile(id) {
  return request.delete(`${serve}/${id}`)
}

export function restoreFile(id) {
  return request.post(`${serve}/restore/${id}`)
}

export function associateFiles(data) {
  return request.put(`${serve}/associate`, data)
}

export function cleanupFiles(hours) {
  return request.post(`${serve}/cleanup`, { hours })
}

export function getStatus() {
  return request.get(`${serve}/getStatus`)
}

export function getBusinessType() {
  return request.get(`${serve}/getBusinessType`)
}

export function getFileList(params) {
  return request.get(serve, params)
}
