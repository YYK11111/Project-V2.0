// @ts-nocheck
import request from '@/utils/request'
import { baseApi } from '@/api/common'

const { get } = request

// 用户角色 接口
const serve = window.sysConfig.serves.business + '/articles'
export const { getList, getOne, del, save } = baseApi(serve)
export const getStatus = () => get(`${serve}/getStatus`)
