import axios from 'axios'
import qs from 'qs'
import { useUserStore } from '../stores/user'
import { getToken, setToken } from '@/utils/auth'
import { errorCode } from '@/utils/dictionary'

// 创建axios实例
function requestFactory(getway = '') {
  const service = axios.create({
    // axios中请求配置有baseURL选项，表示请求URL公共部分
    baseURL: (process.env.NODE_ENV === 'development' ? '/api' : window.sysConfig.BASE_API) + getway,
    // 超时
    // timeout: process.env.NODE_ENV === 'development' ? 0 : 8000,
    paramsSerializer: (params) => qs.stringify(params, { arrayFormat: 'brackets' }),
  })

  // request拦截器
  service.interceptors.request.use(
    (config) => {
      // 是否需要设置 token
      const isToken = (config.headers || {}).isToken === false
      if (getToken() && !isToken) {
        Object.assign(config.headers, window.sysConfig.headers) // 让每个请求携带自定义token 请根据实际情况自行修改
      }
      return config
    },
    (error) => {
      console.log(error)
      Promise.reject(error)
    },
  )

  // 响应拦截器
  service.interceptors.response.use(
    (res) => {
      let { data } = res
      // 未设置状态码则默认成功状态
      const code = data.code ?? 200
      // 获取错误信息
      const msg = errorCode[code] || data.msg || errorCode['default']
      if ([200].includes(code)) {
        return data
      } else if (code == 401) {
        ElMessageBox.confirm('登录状态已过期，您可以继续留在该页面，或者重新登录', '系统提示', {
          confirmButtonText: '重新登录',
          cancelButtonText: '取消',
          type: 'warning',
        }).then(() => {
          useUserStore().logout()
        })
      } else {
        if (process.env.NODE_ENV === 'development') {
          ElMessage({
            message: `服务：${res.config.url}，${code}错误：${msg}`,
            type: 'error',
          })
        } else {
          ElMessage.error({
            message: msg,
          })
        }
        return Promise.reject()
      }
    },
    (error) => {
      console.log('err: ' + error)
      let { message: msg, response, config } = error
      if (msg == 'Network Error') {
        msg = '后端接口连接异常'
      } else if (msg.includes('timeout')) {
        msg = '系统接口请求超时'
      } else if (response) {
        let status = response.status
        msg = '系统接口:' + status + '异常'
      }
      ElMessage({
        message: `${msg}:${config?.url}`,
        type: 'error',
        duration: 5 * 1000,
      })
      return Promise.reject()
    },
  )

  // 重写方法，统一传参格式
  service.get = (url, params, config = {}) => {
    return service({ url, params, ...config })
  }

  let post = service.post
  service.post = (url, data, config = {}) => {
    return post(url, data, config)
  }

  let put = service.put
  service.put = (url, data, config = {}) => {
    return put(url, data, config)
  }

  let del = service.delete
  service.del = (url, params, config = {}) => {
    return del(url, { params, ...config })
  }

  return service
}

// 创建常用网关接口请求
export default requestFactory()
