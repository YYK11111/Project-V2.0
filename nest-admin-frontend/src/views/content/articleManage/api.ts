// @ts-nocheck
import request from '@/utils/request'
import { baseApi } from '@/api/common'

const { get } = request

function normalizePageData(res) {
  const page = res?.data?.data || res?.data || res || {}
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

// 用户角色 接口
const serve = window.sysConfig.serves.business + '/articles'
const base = baseApi(serve)
export const getList = (params) => base.getList(params).then(normalizePageData)
export const getOne = base.getOne
export const del = base.del
export const save = base.save
export const getStatus = () => get(`${serve}/getStatus`)
export const getKnowledgeTypes = () => get(`${serve}/getKnowledgeTypes`)
export const getVisibilityTypes = () => get(`${serve}/getVisibilityTypes`)
export const retrieveForAi = (params) => get(`${serve}/retrieveForAi`, params)
export const rebuildArticleChunks = (id) => request.post(`${serve}/rebuildChunks/${id}`)

const tagServe = window.sysConfig.serves.business + '/article-tags'
const tagBase = baseApi(tagServe)
export const articleTagApi = {
  ...tagBase,
  getList: (params) => tagBase.getList(params).then(normalizePageData),
}

const borrowServe = window.sysConfig.serves.business + '/article-borrows'
export const applyArticleBorrow = (data) => request.post(`${borrowServe}/apply`, data)
export const getMyArticleBorrows = (params) => request.get(`${borrowServe}/my`, params).then(normalizePageData)
export const getPendingArticleBorrows = (params) => request.get(`${borrowServe}/pending`, params).then(normalizePageData)
export const approveArticleBorrow = (id, data) => request.post(`${borrowServe}/${id}/approve`, data)
export const rejectArticleBorrow = (id, data) => request.post(`${borrowServe}/${id}/reject`, data)
export const revokeArticleBorrow = (id) => request.post(`${borrowServe}/${id}/revoke`)
