// @ts-nocheck
import request from '@/utils/request'
import { baseApi } from '@/api/common'

const { get, post, put } = request

// 用户 接口
const serve = window.sysConfig.serves.system + '/users'
const auth = '/auth'
export const { getList, getOne, del, save, add, update } = baseApi(serve)

// 修改
// export const update = (data: object) => post(`${serve}/update`, data)

// 注册
export const register = (data) => post(`${auth}/register`, data)

// 重置密码
export const resetPassword = (data) => put(`${serve}/resetPassword`, data)

// 获取路由
export const getRouters = () => get(`${serve}/getRouters`)

export const uploadAvatar = (data) => post(`${serve}/uploadAvatar`, data)

// 获取用户主题配置
export const getTheme = () => get(`${serve}/getTheme`)

// 更新用户主题配置
export const updateTheme = (data) => put(`${serve}/updateTheme`, data)
