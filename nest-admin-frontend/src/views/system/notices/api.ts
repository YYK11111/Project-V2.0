// @ts-nocheck
import { baseApi } from '@/api/common'

// 用户角色 接口
const serve = window.sysConfig.serves.system + '/notices'
export const { getList, getOne, del, save } = baseApi(serve)
