// @ts-nocheck
// import { requestOpen } from '@/utils/request'
import type { pageQuery } from 'env'

// 全局缓存 request 实例
let requestCache: any = null
// 标记是否正在初始化
let isInitializing = false
// 初始化完成的 Promise
let initPromise: Promise<any> | null = null

// 初始化 request 实例（确保只初始化一次）
function initRequest() {
  if (requestCache) {
    return Promise.resolve(requestCache)
  }
  
  if (initPromise) {
    return initPromise
  }
  
  isInitializing = true
  initPromise = import('@/utils/request').then(module => {
    requestCache = module.default
    isInitializing = false
    return requestCache
  }).catch(error => {
    isInitializing = false
    initPromise = null
    throw error
  })
  
  return initPromise
}

// 获取 request 实例（同步返回，如果未初始化则返回 Proxy）
function getRequestSync() {
  if (requestCache) {
    return requestCache
  }
  
  // 返回一个智能代理，会自动等待初始化完成
  return new Proxy({}, {
    get: (target, prop) => {
      return async (...args: any[]) => {
        // 如果还未初始化，先等待初始化
        if (!requestCache) {
          console.warn('Request instance not ready, initializing...')
          await initRequest()
        }
        // 确保 requestCache 已就绪
        if (!requestCache) {
          throw new Error('Failed to initialize request instance')
        }
        return requestCache[prop](...args)
      }
    }
  })
}

// 导出初始化函数，供应用启动时调用
export { initRequest }

export function baseApi(serve: string) {
  const request = getRequestSync()
  const { get, post, put, del: dele } = request
  
  // 列表
  const getList = (data: pageQuery) => get(`${serve}/list`, data)

  // 详情
  const getOne = (id: string) => get(`${serve}/getOne/${id}`)

  // 删除
  const del = (id: string) => dele(`${serve}/del/${id}`)

  // 新增 / 修改
  const save = (data: object) => post(`${serve}/save`, data)

  const add = (data: object) => post(`${serve}/add`, data)

  const update = (data: object) => put(`${serve}/update`, data)

  return { getList, getOne, del, save, add, update }
}

const serve = window.sysConfig.serves.system + '/common'

import { decrypt, decryptObj } from '@/utils/encrypt'
export const upload = (data: { new (): FormData }) => {
  const request = getRequestSync()
  return request.post(`${serve}/upload`, data)
}

// 获取视频第一帧
export const getVideoPic = (params) => {
  const request = getRequestSync()
  return request({
    url: '/file/getVideoFirstImg/',
    params,
  })
}

/**
 * 下载网络连接文件
 * @param {*} params
{
  url=文件路径&
  name=文件名称，带后缀
}
 */
export function download(url, name) {
  return window.sysConfig.BASE_API + `/common/download/url?url=${url}&name=${name}`
}

// 删除上传的文件
export const deleteFile = (filename: string) => {
  const request = getRequestSync()
  return request.delete(`${serve}/upload/${filename}`)
}

// 附件预览（预留后期集成）
export const previewFile = (params: { url: string; name?: string }) => {
  const request = getRequestSync()
  return request.get(`${serve}/preview`, params)
}

// 附件下载（预留后期集成）
export const downloadFile = (params: { url: string; name?: string }) => {
  const request = getRequestSync()
  return request.get(`${serve}/download/url`, params)
}

/**
 * 上传文件
 * @param {*} data
{
  "dataURL": 本地文件(base64)
}
 */

// 省市区 级联数据
export const getProCityList = (data) => {
  const request = getRequestSync()
  return request({
    url: '/system/area/list',
    params: data,
  })
}

/**
 * 获取微信授权链接
 * @param {*} redirectUrl 回调跳转地址
 * @returns
 */
export const getWxRedirect = (redirectUrl = location.href) => {
  const request = getRequestSync()
  return request({
    url: '/auth/wxRedirect',
    method: 'get',
    params: {
      redirectUrl,
    },
  })
}

/**
 * 微信获取token接口
 * @param {*} code 是 code码 必填
 * @param {*} openId 否 微信用户ID 非必填
 * @returns
 */
export const wxLogin = (code, openId) => {
  const request = getRequestSync()
  return request({
    url: '/auth/wxLogin',
    method: 'get',
    params: {
      code,
      openId,
    },
  })
}

/**
 * 获取微信授权用户信息
 * @param {*} openId
 */
export const getWechatUserInfo = () => {
  const request = getRequestSync()
  return request({
    url: `/system/user/getWxInfo`,
  })
}

/**
 * 获取配置
 */
export const getConfig = () => {
  const request = getRequestSync()
  return request({
    url: `/system/config/getData `,
  }).then(({ data }) => {
    return { data: decryptObj(data, decrypt) }
  })
}
