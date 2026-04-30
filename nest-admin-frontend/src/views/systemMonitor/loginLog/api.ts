import request from '@/utils/request'
import { baseApi } from '@/api/common'

const { get } = request

export interface LoginLogChartQuery {
  beginTime?: string
  endTime?: string
  [key: string]: string | number | undefined
}

export interface LoginLogChartItem {
  name?: string
  date?: string
  days?: string
  label?: string
  value?: number | string
  num?: number | string
  count?: number | string
  [key: string]: string | number | undefined
}

export interface LoginLogChartResponse {
  data?: LoginLogChartItem[]
}

export interface LoginProvinceChartItem extends LoginLogChartItem {
  name?: string
  value?: number | string
}

// 登录日志 接口
const serve = window.sysConfig.serves.system + '/loginLogs'
export const { getList, getOne, del, save } = baseApi(serve)

// 获取用户访问量折线图
export const getVisitedNumChart = (data: LoginLogChartQuery): Promise<LoginLogChartResponse> =>
  get(`${serve}/getVisitedNumChart`, data)

// 获取用户地区分布
export const getUserAreaList = (data: LoginLogChartQuery): Promise<LoginLogChartResponse> =>
  get(`${serve}/getUserAreaList`, data)

// 获取最近成功登录用户省份分布
export const getUserLoginProvinceList = (): Promise<LoginProvinceChartItem[]> => get(`${serve}/getUserLoginProvinceList`)
