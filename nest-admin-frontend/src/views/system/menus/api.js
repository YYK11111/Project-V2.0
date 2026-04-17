const { get, post, put, del: dele } = $sdk.request

// 接口
const serve = window.sysConfig.serves.system + '/menus'

export const { getList, getOne, del, save } = $sdk.baseApi(serve)

export const getTrees = (data) => get(`${serve}/getTrees`, data)
export const getTypes = (data) => get(`${serve}/getTypes`, data)
export const getDiagnostics = (data) => get(`${serve}/diagnostics`, data)
