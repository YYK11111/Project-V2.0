import { useAppStore } from '../stores/app'
import { useUserStore } from '../stores/user'
import stores from '@/stores'
import { ElMessage as Message } from 'element-plus'
import NProgress from 'nprogress'
import 'nprogress/nprogress.css'
import { ensureDynamicRoutes } from './routes'

NProgress.configure({ showSpinner: true })

const whiteList = ['/bind', '/test', '/404', '/401'] // 不管有没有token都可直接进入的页面路径
const noLoginList = ['/authRedirect', '/login', '/register'] // 没有token才能进入的页面

function buildRestoreTarget(fullPath) {
  const browserUrl = new URL(fullPath, window.location.origin)
  return {
    path: browserUrl.pathname,
    query: Object.fromEntries(browserUrl.searchParams.entries()),
    hash: browserUrl.hash,
    replace: true,
  }
}

function getInitialBrowserPath() {
  return globalThis.__INITIAL_APP_URL__ || `${window.location.pathname}${window.location.search}${window.location.hash}`
}

function clearInitialBrowserPath() {
  globalThis.__INITIAL_APP_URL__ = ''
}

function canRestoreInitialPath(router, fullPath) {
  if (!fullPath || fullPath === '/' || fullPath === '/404') return false
  const resolved = router.resolve(fullPath)
  return resolved.matched.length > 0 && resolved.path !== '/404'
}

async function tryRestoreInitialPath(router, reason) {
  const initialFullPath = getInitialBrowserPath()
  const canRestore = canRestoreInitialPath(router, initialFullPath)
  if (!canRestore) return null
  const target = buildRestoreTarget(initialFullPath)
  clearInitialBrowserPath()
  return target
}

export default function permission(router) {
  router.beforeEach(async (to, from) => {
    NProgress.start()
    const browserFullPath = getInitialBrowserPath()
    const browserUrl = new URL(browserFullPath, window.location.origin)
    const shouldAttemptRestore =
      !noLoginList.includes(browserUrl.pathname) &&
      browserFullPath !== '/' &&
      browserFullPath !== to.fullPath &&
      ['/404', '/', '/login'].includes(to.path)
    if (!noLoginList.includes(to.path)) {
      await useAppStore().getConfig()
    }
    const isWhitelistedRoute = whiteList.includes(to.path) || to.meta.isOpen
    if (!isWhitelistedRoute || shouldAttemptRestore) {
      const userStore = useUserStore()
      if (userStore.name) {
        const appStore = stores()
        const firstVisibleRoute = appStore.permission.sidebarRouters.find((route) => !route.isHidden)
        const hasSidebarRoutes = Array.isArray(appStore.permission.sidebarRouters) && appStore.permission.sidebarRouters.length > 0
        const hasMatchedRoute = router.resolve(to.fullPath).matched.length > 0
        if (!hasSidebarRoutes || !hasMatchedRoute) {
          await ensureDynamicRoutes(router)
          if (shouldAttemptRestore) {
            const restored = await tryRestoreInitialPath(router, 'existing-user')
            if (restored) return restored
          }
          if (to.path === '/') {
            const firstRoute = appStore.permission.sidebarRouters.find((route) => !route.isHidden)
            if (firstRoute?.path) {
              clearInitialBrowserPath()
              return { path: firstRoute.path, replace: true }
            }
          }
          clearInitialBrowserPath()
          return {
            path: to.path,
            query: to.query,
            hash: to.hash,
            replace: true,
          }
        }
        if (noLoginList.includes(to.path) && !shouldAttemptRestore) {
          clearInitialBrowserPath()
          if (firstVisibleRoute?.path) {
            return { path: firstVisibleRoute.path, replace: true }
          }
          return { path: '/', replace: true }
        }
        if (to.path === '/' && firstVisibleRoute?.path) {
          clearInitialBrowserPath()
          return { path: firstVisibleRoute.path, replace: true }
        }
        return
      } else {
        try {
          await userStore.getUserInfo()
          await ensureDynamicRoutes(router)
          const appStore = stores()
          const firstVisibleRoute = appStore.permission.sidebarRouters.find((route) => !route.isHidden)
          if (noLoginList.includes(to.path) && !shouldAttemptRestore) {
            clearInitialBrowserPath()
            if (firstVisibleRoute?.path) {
              return { path: firstVisibleRoute.path, replace: true }
            }
            return { path: '/', replace: true }
          }
          if (shouldAttemptRestore) {
            const restored = await tryRestoreInitialPath(router, 'recovered-user')
            if (restored) return restored
          }
          if (to.path === '/') {
            if (firstVisibleRoute?.path) {
              clearInitialBrowserPath()
              return { path: firstVisibleRoute.path, replace: true }
            }
          }
          clearInitialBrowserPath()
          return {
            path: to.path,
            query: to.query,
            hash: to.hash,
            replace: true,
          }
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
