import { useAppStore } from '../stores/app'
import { useUserStore } from '../stores/user'
import stores from '@/stores'
import { ElMessage as Message } from 'element-plus'
import NProgress from 'nprogress'
import 'nprogress/nprogress.css'
import { getUserRoutes } from './routes'

NProgress.configure({ showSpinner: true })

const whiteList = ['/bind', '/test', '/404', '/401'] // 不管有没有token都可直接进入的页面路径
const noLoginList = ['/authRedirect', '/login', '/register'] // 没有token才能进入的页面

export default function permission(router) {
  router.beforeEach(async (to, from) => {
    NProgress.start()
    if (!noLoginList.includes(to.path)) {
      await useAppStore().getConfig()
    }
    if (!(whiteList.includes(to.path) || to.meta.isOpen)) {
      const userStore = useUserStore()
      if (userStore.name) {
        const appStore = stores()
        const hasSidebarRoutes = Array.isArray(appStore.permission.sidebarRouters) && appStore.permission.sidebarRouters.length > 0
        if (!hasSidebarRoutes) {
          await getUserRoutes(router)
          return { ...to, replace: true }
        }
        if (noLoginList.includes(to.path)) {
          return { path: window.sysConfig.BASE_URL }
        }
        return
      } else {
        try {
          await userStore.getUserInfo()
          await getUserRoutes(router)
          if (noLoginList.includes(to.path)) {
            return { path: window.sysConfig.BASE_URL }
          }
          return { ...to, replace: true }
        } catch (error) {
          if (!noLoginList.includes(to.path)) {
            return `/login?redirect=${encodeURIComponent(to.fullPath)}`
          }
        }
      }
    }
  })

  router.afterEach(() => {
    NProgress.done()
    document.getElementById('loading').className = 'loaded'
  })
}
