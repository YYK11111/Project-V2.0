// @ts-nocheck
import request from '@/utils/request'
import { baseApi } from '@/api/common'

const { get, post, put } = request

// 部门 接口
const serve = window.sysConfig.serves.system + '/dept'
export const { getList, getOne, del, save, add, update } = baseApi(serve)

// 获取部门树
export const getTrees = (data) => get(`${serve}/getTrees`, data)
