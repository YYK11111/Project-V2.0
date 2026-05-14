import request from '@/utils/request'

// 登录方法
export function login(data) {
  return request({
    url: '/auth/login',
    method: 'post',
    data,
  })
}

// 图形验证码
export function getCaptchaImage() {
  return request({
    url: '/system/common/getCaptchaImage',
  })
}

// 注册
// export const register = (data: object) => post(`${'auth'}/register`, data)
export function register(data) {
  return request({
    url: '/auth/register',
    method: 'post',
    data,
  })
}

// 获取用户详细信息
export function getUserInfo() {
  return request({
    url: '/auth/getLoginUser',
    method: 'get',
  })
}

// 退出方法
export function logout() {
  return request({
    url: '/auth/logout',
    method: 'post',
  })
}
