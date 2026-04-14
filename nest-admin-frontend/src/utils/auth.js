// import { getToken } from '@/utils/auth'

import Cookies from 'js-cookie'
const TokenKeyDefault = 'Admin-Token'

export function getToken(TokenKey = TokenKeyDefault) {
  return Cookies.get(TokenKey)
}

export function setToken(token, TokenKey = TokenKeyDefault) {
  return Cookies.set(TokenKey, token)
}

export function removeToken(TokenKey = TokenKeyDefault) {
  return Cookies.remove(TokenKey)
}

// import { getQueryValue } from './index'
// export async function authRedirect() {
//   let auth_code = getQueryValue('auth_code')
//   if (!auth_code) {
//     return false
//   }
//   try {
//     let { wxQrLogin } = await import('@/api/login')
//     let { data } = await wxQrLogin(auth_code)
//     setToken(data.access_token)
//     history.pushState({}, 'page 2', window.sysConfig.BASE_URL)
//     this.$router.replace(window.sysConfig.BASE_URL)
//   } catch (error) {
//     console.log(error)
//   }
// }
