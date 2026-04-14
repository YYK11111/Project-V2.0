import './config.js'
import 'normalize.css/normalize.css'

// 主题颜色初始化已移至 user store 中管理

import { useDark } from '@vueuse/core'
useDark()

import { createApp, defineAsyncComponent } from 'vue'
import App from './App.vue'
const app = createApp(App)

import 'element-plus/theme-chalk/dark/css-vars.css'

import '@/styles/index.scss'

import 'tailwindcss/index.css'

// 全局方法挂载
import { SDK, $sdk } from './utils/sdk'
declare module 'vue' {
  interface ComponentCustomProperties {
    $sdk: SDK
  }
}
Object.assign(app.config.globalProperties, { $sdk }, { sysConfig: window.sysConfig })

// svg图标
import 'virtual:svg-icons-register'
import SvgIcon from '@/components/SvgIcon.vue'
app.component('SvgIcon', SvgIcon)

import * as ElementPlusIconsVue from '@element-plus/icons-vue'
for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
  app.component('ElIcon' + key, component)
}

// 全局异步组件挂载，
const components = import.meta.glob('./components/**/*.vue')
for (const c in components) {
  const match = c.match(/\/([^\/]+)\.vue$/)
  if (!match) continue
  app.component('G' + match[1], defineAsyncComponent(components[c]))
}

// 预初始化 request 实例，避免后续 API 调用时的竞态条件
import { initRequest } from '@/api/common'
initRequest().catch(err => {
  console.error('Failed to initialize request instance:', err)
})

import router from './router'
import stores, { store } from '@/stores'
app.use(store)
app.use(router)
app.config.globalProperties.$store = stores()

app.mount('#app')

console.log(`
  _______                   __       _____       .___      .__
  \\      \\   ____   _______/  |_    /  _  \\    __| _/_____ |__| ____
  /   |   \\_/ __ \\ /  ___/\\   __\\  /  /_\\  \\  / __ |/     \\|  |/    \\
 /    |    \\  ___/ \\___ \\  |  |   /    |    \\/ /_/ |  Y Y  \\  |   |  \\
 \\____|__  /\\___  >____  > |__|   \\____|__  /\\____ |__|_|  /__|___|  /
         \\/     \\/     \\/                 \\/      \\/     \\/        \\/
 `)
