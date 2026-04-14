const { get, post, put, del: dele } = $sdk.request

// 部门 接口
const serve = window.sysConfig.serves.system + '/dept'
export const { getList, getOne, del, save } = $sdk.baseApi(serve)

export function getTrees(data) {
  return get(`${serve}/getTrees`, data)
}
