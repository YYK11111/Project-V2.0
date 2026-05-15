// @ts-nocheck
import request from '@/utils/request'

const { get, post } = request
const serve = window.sysConfig.serves.system + '/external-accounts'
const notifyServe = window.sysConfig.serves.system + '/external-notify'

export const getList = (data) => get(`${serve}/list`, data)

export const save = (data) => post(`${serve}/save`, data)

export const syncFeishuAccount = (userId) => post(`${notifyServe}/feishu/sync-user/${userId}`)

export const syncFeishuAccounts = (data = {}) => post(`${notifyServe}/feishu/sync-users`, data)
