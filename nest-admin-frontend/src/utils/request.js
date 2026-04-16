import axios from 'axios'
import qs from 'qs'
import { useUserStore } from '../stores/user'
import { errorCode } from '@/utils/dictionary'

let isHandlingUnauthorized = false
const publicUnauthorizedIgnoreList = ['/system/common/getCaptchaImage', '/system/configs/list']

function shouldIgnoreUnauthorized(config = {}) {
  const requestUrl = config.url || ''
  const isLoginPage = window.location.pathname === '/login'
  return isLoginPage || publicUnauthorizedIgnoreList.some((path) => requestUrl.includes(path))
}

// 创建axios实例
function requestFactory(getway = '') {
  const service = axios.create({
    // axios中请求配置有baseURL选项，表示请求URL公共部分
    baseURL: (process.env.NODE_ENV === 'development' ? '/api' : window.sysConfig.BASE_API) + getway,
    // 超时
    // timeout: process.env.NODE_ENV === 'development' ? 0 : 8000,
    paramsSerializer: (params) => qs.stringify(params, { arrayFormat: 'brackets' }),
    withCredentials: true,
  })

  // request拦截器
  service.interceptors.request.use(
    (config) => {
      return config
    },
    (error) => {
      console.log(error)
      return Promise.reject(error)
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
        if (shouldIgnoreUnauthorized(res.config)) {
          return Promise.reject(new Error(msg))
        }
        if (!isHandlingUnauthorized) {
          isHandlingUnauthorized = true
          const redirectPath = window.location.pathname + window.location.search
          ElMessageBox.confirm('登录状态已过期，您可以继续留在该页面，或者重新登录', '系统提示', {
            confirmButtonText: '重新登录',
            cancelButtonText: '取消',
            type: 'warning',
          })
            .then(() => {
              useUserStore().handleSessionExpired(redirectPath)
            })
            .finally(() => {
              isHandlingUnauthorized = false
            })
        }
        return Promise.reject(new Error(msg))
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
        return Promise.reject(new Error(msg))
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
      if (response?.status === 401 && shouldIgnoreUnauthorized(config)) {
        return Promise.reject(error)
      }
      ElMessage({
        message: `${msg}:${config?.url}`,
        type: 'error',
        duration: 5 * 1000,
      })
      return Promise.reject(error)
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
