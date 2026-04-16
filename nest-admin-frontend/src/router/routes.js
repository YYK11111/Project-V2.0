/* Layout */
import { useUserStore } from '../stores/user'
import { useMenusStore } from '../stores/menus'
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
    const userRoutes = transRouter(sortMenuTreeByOrder(data))
    console.log('=== Generated Routes ===', JSON.stringify(userRoutes, null, 2))
    useMenusStore().addRoutes = userRoutes
    useMenusStore().routes = userRoutes.concat(constantRoutes)
    useMenusStore().topbarRouters = useMenusStore().routes.filter((e) => !e.isHidden)
    // 设置首页重定向 - 确保第一个路由存在
    if (userRoutes && userRoutes.length > 0) {
      const firstRoute = userRoutes[0]
      const rootRoute = router.getRoutes().find((e) => e.path == '/')
      if (rootRoute && firstRoute) {
        rootRoute.redirect = firstRoute.path
      }
    }
    userRoutes.forEach((e) => router.addRoute(e))
    router.addRoute({ path: '/:path(.*)*', redirect: '/404', isHidden: true })

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
        // 绝对路径，直接使用
        route.path = path
      } else if (path.includes('/')) {
        // 如果 path 中包含 '/'，说明可能是 'projectManage/form' 这种格式
        // 需要检查是否已经包含了父路径
        const parentPathName = parentPath.split('/').pop() // 获取父路径的最后一段，如 'projectManage'
        if (path.startsWith(parentPathName + '/')) {
          // 已经包含了父路径前缀，说明数据库存储的是完整路径
          // 直接使用，不需要再拼接
          route.path = '/' + path
        } else {
          // 不包含父路径前缀，正常拼接
          route.path = parentPath + '/' + path
        }
      } else {
        // 纯相对路径，正常拼接
        route.path = parentPath + '/' + path
      }
    } else {
      // 设置，顶级菜单必须是/开头
      route.path = route.path.startsWith('/') ? route.path : '/' + route.path
    }

    route.name = route.path?.replace(/[/:]/g, '-')?.replace(/^-+/, '') || route.component?.replace(/\//g, '-')

    const hasChildren = Array.isArray(route.children) && route.children.length > 0
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

    // 设置 redirect：一级目录有可见子菜单时重定向到第一个子菜单
    if (route.type === 'catalog' && level === 1 && route.children?.length > 0) {
      const visibleChild = route.children.find(c => !c.isHidden)
      if (visibleChild) {
        route.redirect = visibleChild.path
      }
    }

    return true
  })
  level--
  return res
}

const modules = import.meta.glob('../views/**/*.vue')
export const loadView = (route) => {
  let res
  for (const path in modules) {
    const dir = path.split('views/')[1].split('.vue')[0]
    if (dir === route.component) {
      res = modules[path]
      let routeNames = {
        'systemMonitor/loginLog/index': 'loginLog',
        'systemMonitor/onlineUser/index': 'onlineUser',
      }
      routeNames[route.component] && (route.name = routeNames[route.component])
      break
    }
  }
  return (
    res || {
      render: () => '【待开发】',
    }
  )
}
