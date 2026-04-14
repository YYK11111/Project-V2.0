import { useDark } from '@vueuse/core'

// 环境变量
const envs = {
  development: {
    DOMAIN: 'http://localhost:3000', // 站点域名，会根据此处域名判断应用环境
    BASE_URL: '/', // 页面路由基础路径 /*/*/，eg：/a/，不支持 ’./‘形式的路径
    BASE_API: 'http://localhost:3000/api', // 接口基础路径
  },
  production: {
    DOMAIN: 'https://nestts.com',
    BASE_URL: '/',
    BASE_API: 'https://nestts.com/api',
  },
  test: {
    DOMAIN: 'https://47.98.205.145',
    BASE_URL: '/',
    BASE_API: 'https://47.98.205.145/api',
  },
}

const packMode = globalThis.MODE || import.meta.env.MODE
const runMode =
  process.env.NODE_ENV == 'development' || !globalThis.document
    ? packMode // 本地开发和vite中使用
    : Object.keys(envs).find((e) => envs[e].DOMAIN === window?.location.origin) || 'diy' // 打包后，根据访问域名动态判断环境

const BASE_URL = envs[packMode].BASE_URL
const env = envs[runMode] || {}

useDark().value
// 配置项
export let config = {
  ...env,
  SYSTEM_NAME: 'Nest Admin', // 系统简称
  SYSTEM_SLOGAN: '基于 Nestjs + Vue3 的前后端分离快速开发框架', // 系统标语
  SYSTEM_NAME_ALL: 'Nest Admin -- 基于 Nestjs + Vue3 的前后端分离快速开发框架', // 系统全称，浏览器标题
  COPYRIGHT: 'Copyright © 2024 Nest Admin All Rights Reserved.', // 版权信息
  // LOGO_DARK: BASE_URL + 'static/logo.svg', // 深色logo
  // LOGO_LIGHT: BASE_URL + 'static/logo.svg', // 淡色logo
  LOGO: `${BASE_URL}static/logo.svg`,
  BASE_URL,
  RUN_ENV: runMode,
}
