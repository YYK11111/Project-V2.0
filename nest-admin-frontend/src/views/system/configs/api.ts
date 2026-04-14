// @ts-nocheck
import { baseApi } from '@/api/common'

// 用户角色 接口
const serve = window.sysConfig.serves.system + '/configs'
const { getList: rawGetList, save } = baseApi(serve)

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
