// @ts-nocheck
import request from '@/utils/request'

const baseUrl = '/business/documents'

function normalizePageData(res) {
  const page = res?.data?.data || res?.data || {}
  const list = page.list || page.rows || []
  const total = Number(page.total || res?.total || 0)
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

export function upgradeVersion(id) {
  return request({ url: `${baseUrl}/version/${id}`, method: 'post' })
}

export function getType() {
  return request({ url: `${baseUrl}/getType`, method: 'get' })
}

// 获取项目列表（用于表单选择）
export function getProjectList() {
  return request({ url: '/business/projects/list', method: 'get', params: { pageNum: 1, pageSize: 100 } }).then((res) => {
    const page = res?.data?.data || res?.data || {}
    const list = page.list || page.rows || []
    return {
      ...res,
      list,
      data: list,
      rows: list,
      total: Number(page.total || res?.total || 0),
    }
  })
}
