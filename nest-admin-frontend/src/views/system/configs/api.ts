// @ts-nocheck
import { baseApi } from '@/api/common'
import request from '@/utils/request'

// 用户角色 接口
const serve = window.sysConfig.serves.system + '/configs'
const externalNotifyServe = window.sysConfig.serves.system + '/external-notify'
const { getList: rawGetList, save } = baseApi(serve)
const { post } = request

function normalizeConfigList(res) {
  const payload = res?.data?.data ?? res?.data ?? res?.list ?? []
  const list = Array.isArray(payload) ? payload : payload?.list || []
  const total = Array.isArray(payload) ? list.length : Number(payload?.total || res?.total || 0)
  return {
    ...res,
    list,
    total,
  }
}

export const getList = async (params) => {
  const res = await rawGetList(params)
  return normalizeConfigList(res)
}

export { save }

export const testFeishuNotify = (data = {}) => post(`${externalNotifyServe}/feishu/test`, data)
export const diagnoseFeishuNotify = (data = {}) => post(`${externalNotifyServe}/feishu/diagnose`, data)
