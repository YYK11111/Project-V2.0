// @ts-nocheck
import request from '@/utils/request'

const { get } = request
const serve = window.sysConfig.serves.system + '/external-notify'

export const getList = (data) => get(`${serve}/logs`, data)
