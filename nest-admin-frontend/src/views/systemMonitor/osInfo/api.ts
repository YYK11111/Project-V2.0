// @ts-nocheck
import request from '@/utils/request'

const { get } = request

// 接口
const serve = window.sysConfig.serves.system + '/common'

export const getOsInfo = (data) => get(`${serve}/getOsInfo`, data)
