// @ts-nocheck
import request from '@/utils/request'

const { get } = request

// 日志 接口
const serve = window.sysConfig.serves.system + '/systemLog'

export const getOne = (data) => get(`${serve}`, data)
export const del = (id: string) => request({ url: serve, method: 'delete' })
