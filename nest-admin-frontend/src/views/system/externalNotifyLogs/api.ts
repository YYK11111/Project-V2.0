// @ts-nocheck
import request from '@/utils/request'

const { get, post } = request
const serve = window.sysConfig.serves.system + '/external-notify'

export const getList = (data) => get(`${serve}/logs`, data)
export const getTraceLogs = (messageId) => get(`${serve}/logs/trace/${messageId}`)
export const getFeishuCompensationStatus = () => get(`${serve}/feishu/compensation-status`)
export const runFeishuPendingDeliveryCompensation = () => post('/system/scheduled-jobs/run/notifications.retryPendingDelivery')
