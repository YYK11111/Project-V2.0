import { useAppStore } from '../stores/app'
import { useUserStore } from '../stores/user'
import { ElMessage as Message } from 'element-plus'
import NProgress from 'nprogress'
import 'nprogress/nprogress.css'
import { getToken } from '@/utils/auth'
import { getUserRoutes } from './routes'

NProgress.configure({ showSpinner: true })

const whiteList = ['/bind', '/test', '/404', '/401'] // 不管有没有token都可直接进入的页面路径
const noLoginList = ['/authRedirect', '/login', '/register'] // 没有token才能进入的页面

export default function permission(router) {
  router.beforeEach(async (to, from) => {
    NProgress.start()
    await useAppStore().getConfig()
    if (!(whiteList.includes(to.path) || to.meta.isOpen)) {
      if (getToken()) {
        if (noLoginList.includes(to.path)) {
          return { path: window.sysConfig.BASE_URL }
        } else {
          if (useUserStore().name) {
            return
          } else {
            try {
              await useUserStore().getUserInfo()
              await getUserRoutes(router)
              return { ...to, replace: true }
            } catch (e) {
              console.error(e)
              return false
              // useUserStore().logout()
            }
          }
        }
      } else if (!noLoginList.includes(to.path)) {
        return `/login?redirect=${encodeURIComponent(to.fullPath)}` // 否则全部重定向到登录页
      }
    }
  })

  router.afterEach(() => {
    NProgress.done()
    document.getElementById('loading').className = 'loaded'
  })
}
