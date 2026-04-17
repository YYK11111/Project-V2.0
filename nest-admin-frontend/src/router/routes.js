/* Layout */
import { useUserStore } from '../stores/user'
import stores from '@/stores'
import { RouterView } from 'vue-router'
import { h } from 'vue'
import Layout from '@/layout/index.vue'
const routerView = {
  render: () => h(RouterView),
}
/**
 * Note: 路由配置项
 *
 * isHidden: true                   // 当设置 true 的时候该路由不会再侧边栏出现 如401，login等页面，或者如一些编辑页面/edit/1
 * alwaysShow: true               // 当你一个路由下面的 children 声明的路由大于1个时，自动会变成嵌套的模式--如组件页面
 *                                // 只有一个时，会将那个子路由当做根路由显示在侧边栏--如引导页面
 *                                // 若你想不管路由下面的 children 声明的个数都显示你的根路由
 *                                // 你可以设置 alwaysShow: true，这样它就会忽略之前定义的规则，一直显示根路由
 * redirect: noRedirect           // 当设置 noRedirect 的时候该路由在面包屑导航中不可被点击
 * name:'router-name'             // 设定路由的名字，一定要填写不然使用<keep-alive>时会出现各种问题
 * meta : {
    roles: ['admin','editor']    // 设置该路由进入的权限，支持多个权限叠加
    title: 'title'               // 设置该路由在侧边栏和面包屑中展示的名字
    icon: 'svg-name'             // 设置该路由的图标，对应路径src/icons/svg
    breadcrumb: false            // 如果设置为false，则不会在breadcrumb面包屑中显示
  }
 */

// 公共路由
export const constantRoutes = [
  {
    path: '/',
    component: () => import('@/layout/visitor'),
    isHidden: true,
    children: [
      {
        path: '/login',
        component: () => import('@/views/system/login'),
      },
      {
        path: '/register',
        component: () => import('@/views/system/login/register'),
      },
      {
        path: '/forgetPassword',
        component: () => import('@/views/system/login/register'),
        meta: {
          isOpen: true,
          title: '忘记密码',
        },
      },
    ],
  },
  {
    path: '/user',
    component: Layout,
    isHidden: true,
    children: [
      {
        path: 'profile',
        component: () => import('@/views/system/users/profile/index'),
        name: 'Profile',
        meta: { title: '个人中心', icon: 'user' },
      },
      {
        path: 'messages',
        component: () => import('@/views/system/messageCenter/index.vue'),
        name: 'MessageCenter',
        meta: { title: '消息中心', icon: 'bell' },
      },
      {
        path: '/documentManage/form',
        component: () => import('@/views/business/documentManage/form.vue'),
        name: 'DocumentFormHidden',
        meta: { title: '文档表单' },
      },
      {
        path: '/projectManage/approval',
        component: () => import('@/views/business/projectManage/approval.vue'),
        name: 'ProjectApprovalHidden',
        meta: { title: '项目审批' },
      },
      {
        path: '/content/articleManage/aev',
        component: () => import('@/views/content/articleManage/aev.vue'),
        name: 'ArticleManageAevHidden',
        meta: { title: '文章编辑' },
      },
      {
        path: '/content/aev',
        component: () => import('@/views/content/articleManage/aev.vue'),
        name: 'ContentAevHidden',
        meta: { title: '文章编辑' },
      },
      {
        path: '/content/articleManage/myBorrows',
        component: () => import('@/views/content/articleManage/myBorrows.vue'),
        name: 'ArticleMyBorrowHidden',
        meta: { title: '我的借阅' },
      },
      {
        path: '/content/articleManage/home',
        component: () => import('@/views/content/articleManage/home.vue'),
        name: 'KnowledgeHomeHidden',
        meta: { title: '知识中心' },
      },
      {
        path: '/content/articleManage/index',
        component: () => import('@/views/content/articleManage/index.vue'),
        name: 'KnowledgeManageHidden',
        meta: { title: '知识后台' },
      },
      {
        path: '/content/articleManage/manage',
        component: () => import('@/views/content/articleManage/index.vue'),
        name: 'KnowledgeManagePageHidden',
        meta: { title: '后台管理' },
      },
      {
        path: '/content/articleManage/search',
        component: () => import('@/views/content/articleManage/search.vue'),
        name: 'KnowledgeSearchHidden',
        meta: { title: '知识搜索' },
      },
      {
        path: '/content/articleManage/aiRetrieveDebug',
        component: () => import('@/views/content/articleManage/aiRetrieveDebug.vue'),
        name: 'KnowledgeAiRetrieveDebugHidden',
        meta: { title: 'AI检索调试' },
      },
      {
        path: '/content/articleManage/detail',
        component: () => import('@/views/content/articleManage/detail.vue'),
        name: 'ArticleDetailHidden',
        meta: { title: '知识详情' },
      },
      {
        path: '/content/articleManage/borrowApproval',
        component: () => import('@/views/content/articleManage/borrowApproval.vue'),
        name: 'ArticleBorrowApprovalHidden',
        meta: { title: '借阅审批' },
      },
    ],
  },
  {
    path: '/system/role-auth/user/:roleId',
    component: Layout,
    isHidden: true,
    children: [
      {
        path: '',
        component: () => import('@/views/system/roles/authUser.vue'),
        name: 'RoleAuthUser',
        meta: { title: '分配用户' },
      },
    ],
  },
  {
    path: '/404',
    component: () => import('@/views/system/error/404'),
    isHidden: true,
  },
  {
    path: '/401',
    component: () => import('@/views/system/error/401'),
    isHidden: true,
  },
  // 工作流管理路由已移至数据库菜单 sys_menu
]

import { getLoginUserMenus } from '@/views/system/roles/api'

function flattenRouteTree(routes = []) {
  return routes.flatMap((route) => [route, ...flattenRouteTree(route.children || [])])
}

function getConstantHiddenPaths() {
  return new Set(
    flattenRouteTree(constantRoutes)
      .filter((route) => route.isHidden && typeof route.path === 'string' && route.path.startsWith('/'))
      .map((route) => route.path),
  )
}

function createMenuDiagnostics() {
  return {
    missingComponents: [],
    duplicatePathKeys: [],
    emptyCatalogs: [],
    emptyMenus: [],
    hiddenRouteConflicts: [],
  }
}

function reportMenuDiagnostics(routes = [], diagnostics = createMenuDiagnostics()) {
  const flattenedRoutes = flattenRouteTree(routes)
  const routeKeyMap = new Map()
  const constantHiddenPaths = getConstantHiddenPaths()

  flattenedRoutes.forEach((route) => {
    const routeKey = `${route.type || 'unknown'}::${route.path || ''}::${route.componentKey || ''}`
    const sameRouteList = routeKeyMap.get(routeKey) || []
    sameRouteList.push(route)
    routeKeyMap.set(routeKey, sameRouteList)

    const visibleChildren = (route.children || []).filter((child) => !child.isHidden)
    if (route.type === 'catalog' && !route.isHidden && visibleChildren.length === 0 && !route.componentKey) {
      diagnostics.emptyCatalogs.push({ path: route.path, title: route.meta?.title })
    }
    if (route.type === 'menu' && !route.isHidden && visibleChildren.length === 0 && !route.componentKey) {
      diagnostics.emptyMenus.push({ path: route.path, title: route.meta?.title })
    }
    if (route.isHidden && constantHiddenPaths.has(route.path)) {
      diagnostics.hiddenRouteConflicts.push({ path: route.path, title: route.meta?.title })
    }
  })

  diagnostics.duplicatePathKeys = [...routeKeyMap.entries()]
    .filter(([, sameRouteList]) => sameRouteList.length > 1)
    .map(([routeKey, sameRouteList]) => ({
      routeKey,
      paths: sameRouteList.map((route) => route.path),
      titles: sameRouteList.map((route) => route.meta?.title || route.name),
    }))

  const hasIssues = Object.values(diagnostics).some((items) => items.length > 0)
  if (!hasIssues) return

  console.groupCollapsed('[菜单体检] 检测到可疑菜单配置')
  if (diagnostics.missingComponents.length) {
    console.warn('缺失组件', diagnostics.missingComponents)
  }
  if (diagnostics.duplicatePathKeys.length) {
    console.warn('重复路由键', diagnostics.duplicatePathKeys)
  }
  if (diagnostics.emptyCatalogs.length) {
    console.warn('空目录菜单', diagnostics.emptyCatalogs)
  }
  if (diagnostics.emptyMenus.length) {
    console.warn('空页面菜单', diagnostics.emptyMenus)
  }
  if (diagnostics.hiddenRouteConflicts.length) {
    console.warn('与常量隐藏路由重复的数据库隐藏菜单', diagnostics.hiddenRouteConflicts)
  }
  console.groupEnd()
}

let currentMenuDiagnostics = createMenuDiagnostics()

function sortMenuTreeByOrder(routes = []) {
  return [...routes]
    .sort((left, right) => {
      const leftOrder = Number(left.order || 0)
      const rightOrder = Number(right.order || 0)
      if (leftOrder === rightOrder) {
        return String(left.createTime || '') < String(right.createTime || '') ? 1 : -1
      }
      return leftOrder - rightOrder
    })
    .map((route) => ({
      ...route,
      children: Array.isArray(route.children) ? sortMenuTreeByOrder(route.children) : route.children,
    }))
}

export function getUserRoutes(router) {
  // 向后端请求路由数据
  return getLoginUserMenus().then(({ data }) => {
    if (!data?.length) {
      ElMessageBox.confirm('您的角色菜单权限不足，请联系管理员', '系统提示', {
        confirmButtonText: '重新登录',
        cancelButtonText: '取消',
        type: 'warning',
      }).then(() => {
        useUserStore().logout()
      })
      return Promise.reject()
    }
    currentMenuDiagnostics = createMenuDiagnostics()
    const userRoutes = transRouter(sortMenuTreeByOrder(data))
    reportMenuDiagnostics(userRoutes, currentMenuDiagnostics)
    console.log('=== Generated Routes ===', JSON.stringify(userRoutes, null, 2))
    // 设置首页重定向 - 确保第一个路由存在
    if (userRoutes && userRoutes.length > 0) {
      const firstRoute = userRoutes[0]
      const rootRoute = router.getRoutes().find((e) => e.path == '/')
      if (rootRoute && firstRoute) {
        rootRoute.redirect = firstRoute.path
      }
    }
    userRoutes.forEach((route) => {
      if (!router.hasRoute(route.name)) {
        router.addRoute(route)
      }
    })
    if (!router.getRoutes().some((route) => route.path === '/:path(.*)*')) {
      router.addRoute({ path: '/:path(.*)*', redirect: '/404', isHidden: true })
    }
    const appStore = stores()
    appStore.permission.addRoutes = userRoutes
    appStore.permission.routes = constantRoutes.concat(userRoutes)
    appStore.permission.topbarRouters = appStore.permission.routes.filter((route) => !route.isHidden)
    appStore.permission.sidebarRouters = userRoutes.filter((route) => !route.isHidden)

    return userRoutes
  })
}

// // 遍历后台传来的路由字符串，转换为组件对象
let level = 0
function transRouter(routesData, parentPath) {
  level++
  let res = routesData.filter((route) => {
    route.meta = route.meta || {}
    route.isHidden = route.isHidden == 1
    route.meta.title = route.name
    route.meta.icon = route.icon
    route.meta.isHidden = route.isHidden

    if (parentPath) {
      let path = route.path
      // 判断 path 是否已经是绝对路径
      if (/^(\/|http)/.test(path)) {
        route.path = path
      } else if (path.includes('/')) {
        const parentPathName = parentPath.split('/').pop()
        if (path.startsWith(parentPathName + '/')) {
          route.path = '/' + path
        } else {
          route.path = parentPath + '/' + path
        }
      } else {
        route.path = parentPath + '/' + path
      }
    } else {
      // 设置，顶级菜单必须是/开头
      route.path = route.path.startsWith('/') ? route.path : '/' + route.path
    }

    route.name = route.path?.replace(/[/:]/g, '-')?.replace(/^-+/, '') || route.component?.replace(/\//g, '-')
    route.componentKey = route.component

    const visibleChildrenBeforeTransform = Array.isArray(route.children)
      ? route.children.filter((child) => !child.isHidden)
      : []
    const hasChildren = Array.isArray(route.children) && route.children.length > 0
    const hasVisibleChildren = visibleChildrenBeforeTransform.length > 0
    let routeComponent = null
    let wrapRouteWithRouterView = false

    if (route.type === 'catalog') {
      // 一级目录使用 Layout，二级目录如果有实际组件则加载组件，否则使用 routerView
      if (level == 1) {
        route.component = Layout
      } else {
        // 二级目录：如果有 component 字段且不为空，则加载实际组件
        if (route.component && route.component !== '') {
          route.component = loadView(route)
        } else {
          route.component = routerView
        }
      }
    } else if (route.type === 'menu') {
      // 一级 menu 类型：始终使用 Layout 作为容器
      // 实际页面作为子路由，这样访问 /projectManage 时仍有侧边栏
      if (level == 1) {
        // 一级菜单使用 Layout 作为容器，并为有实际页面的菜单注入默认子路由，避免点击后空白
        if (route.component && route.component !== '') {
          routeComponent = loadView(route)
          route.component = Layout
          wrapRouteWithRouterView = true
        } else {
          route.component = Layout
        }
      } else if (route.component && route.component !== '') {
        routeComponent = loadView(route)
        // 只要存在子路由（哪怕都是隐藏的表单/详情页），父级就必须退化为 routerView 容器，
        // 否则命中子路由时仍会停留在父级列表页。
        if (hasChildren) {
          route.component = routerView
          wrapRouteWithRouterView = true
        } else {
          route.component = routeComponent
        }
      } else {
        route.component = routerView
      }
    } else {
      route.component = loadView(route)
    }

    // 先处理子路由，确保子路由的 path 已更新为绝对路径
    let children = route.children
    if (children && children.length) {
      route.children = transRouter(route.children, route.path)
    }

    const visibleChildren = (route.children || []).filter((child) => !child.isHidden && child.meta?.title)
    if (
      route.type === 'catalog' &&
      visibleChildren.length === 1 &&
      visibleChildren[0].meta?.title === route.meta?.title
    ) {
      route.meta.breadcrumb = false
      route.redirect = visibleChildren[0].path
    }

    if (wrapRouteWithRouterView && routeComponent) {
      route.children = [
        {
          path: '',
          component: routeComponent,
          name: `${route.name}-index`,
          meta: { ...route.meta, breadcrumb: false },
          isHidden: true,
        },
        ...(route.children || []),
      ]
    }

    // 设置 redirect：目录型菜单有可见子菜单时重定向到第一个子菜单，避免点击后落到空容器页
    if (route.type === 'catalog' && route.children?.length > 0) {
      const visibleChild = route.children.find((child) => !child.isHidden)
      if (visibleChild) {
        route.redirect = visibleChild.path
      }
    }

    const visibleChildrenAfterTransform = (route.children || []).filter((child) => !child.isHidden)
    const hasUsableChildren = visibleChildrenAfterTransform.length > 0
    const hasUsableComponent = Boolean(route.component && route.component !== routerView)
    if (route.type === 'catalog' && !hasUsableChildren && !hasUsableComponent) {
      route.isHidden = true
      route.meta.isHidden = true
    }

    if (route.type === 'menu' && !hasUsableChildren && !routeComponent && level > 1) {
      route.isHidden = true
      route.meta.isHidden = true
    }

    return true
  })
  level--
  return res
}

const modules = import.meta.glob('../views/**/*.vue')
export const loadView = (route) => {
  let res
  const componentCandidates = [route.component, route.component?.replace(/^\//, ''), route.component?.replace(/\.vue$/, '')]
    .filter(Boolean)

  for (const path in modules) {
    const dir = path.split('views/')[1].split('.vue')[0]
    if (componentCandidates.includes(dir)) {
      res = modules[path]
      let routeNames = {
        'systemMonitor/loginLog/index': 'loginLog',
        'systemMonitor/onlineUser/index': 'onlineUser',
      }
      componentCandidates.forEach((candidate) => {
        routeNames[candidate] && (route.name = routeNames[candidate])
      })
      break
    }
  }
  if (!res) {
    currentMenuDiagnostics.missingComponents.push({
      title: route.meta?.title,
      path: route.path,
      component: route.componentKey || route.component,
    })
    console.error(`[菜单配置错误] 未找到组件: ${route.component}, path: ${route.path}`)
  }
  return (
    res || {
      render: () => '【待开发】',
    }
  )
}
