const permission = {
	state: {
		routes: [],
		addRoutes: [],
		topbarRouters: [],
		sidebarRouters: [], // 当前显示的侧边栏菜单，通过topbarRouters筛选当前激活的顶部菜单下的子菜单
	},
	actions: {},
}

export const usePermissionStore = defineStore('permission', {
	state: () => permission.state,
	actions: permission.actions,
})

// export const loadView = (view) => {
//   if (process.env.NODE_ENV === 'development') {
//     return (resolve) => require([`@/views/${view}`], resolve)
//   } else {
//     // 使用 import 实现生产环境的路由懒加载
//     return (resolve) => require([`@/views/${view}`], resolve)
//   }
// }

export default permission
