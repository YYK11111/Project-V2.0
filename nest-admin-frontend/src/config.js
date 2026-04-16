import { config } from '../sys.config'
const BASE_URL = import.meta.env.BASE_URL

globalThis.sysConfig = {
  ...config,
  ...(globalThis.sysConfig || {}),

  BASE_URL,
  RUN_ENV: config.RUN_ENV,

  serves: {
    common: '/common',
    system: '/system',
    business: '/business',
  },
  // 以下仅用于系统信息展示，不作为项目变量使用，请勿在代码中使用
  // _version: 'v2.0.0-20260109', // 当前版本信息
  _packDateTime: __PACK_DATETIME__, // 打包时间
  _mode: import.meta.env.MODE, // 前端打包模式
}

function resolveAssetUrl(url) {
  if (!url) return ''
  return url.includes('http') ? url : `${window.sysConfig.BASE_API}/static/${url}`
}

export function applyBrowserBranding({ browserTitle, browserIcon, systemName, systemLogo } = {}) {
  const title = browserTitle || systemName || window.sysConfig.SYSTEM_NAME_ALL || window.sysConfig.SYSTEM_NAME
  if (title) {
    document.title = title
  }

  const iconUrl = resolveAssetUrl(browserIcon || systemLogo || window.sysConfig.BROWSER_ICON || window.sysConfig.LOGO)
  if (!iconUrl) return

  let favicon = document.querySelector('link[rel="icon"]')
  if (!favicon) {
    favicon = document.createElement('link')
    favicon.setAttribute('rel', 'icon')
    document.head.appendChild(favicon)
  }
  favicon.setAttribute('href', iconUrl)
}

// 主题回显
const [h, s, l] = localStorage.hsl?.split(',')?.map((e) => e.trim()) || []
if (h) {
  const style = document.documentElement.style
  style.setProperty('--H', h)
  style.setProperty('--S', s)
  style.setProperty('--L', l)
}

applyBrowserBranding()

// 灰色主题
// if (window.sysConfig.ENV === 'production') document.documentElement.style.filter = 'grayscale(100%)'

// 阻止表单默认提交行为
document.addEventListener('submit', (event) => {
  event.preventDefault()
})

// 统一为img的src不是绝对地址的拼接接口地址
document.addEventListener(
  'error',
  function (e) {
    let target = e.target
    let src = target.attributes.getNamedItem('src').value
    if (target.tagName.toUpperCase() === 'IMG' && src && !src.includes('http')) {
      target.src = window.sysConfig.BASE_API + '/static/' + src
      e.stopPropagation()
    }
  },
  true,
)
