// @ts-nocheck
import request from '@/utils/request'
import { baseApi } from '@/api/common'

const { get } = request

// 登录日志 接口
const serve = window.sysConfig.serves.system + '/loginLogs'
export const { getList, getOne, del, save } = baseApi(serve)

// 获取用户访问量折线图
export const getVisitedNumChart = (data) => get(`${serve}/getVisitedNumChart`, data)

// 获取用户地区分布
export const getUserAreaList = (data) => get(`${serve}/getUserAreaList`, data)
