import { constantRoutes } from '@/router/routes'
import Layout from '@/layout/index'
import { h } from 'vue'
import { RouterView } from 'vue-router'

const permission = {
	state: {
		routes: [],
		addRoutes: [],
		topbarRouters: [],
		sidebarRouters: [], // 当前显示的侧边栏菜单，通过topbarRouters筛选当前激活的顶部菜单下的子菜单
	},
	actions: {
		// 生成路由
		GenerateRoutes() {
			return new Promise((resolve, reject) => {
				// 向后端请求路由数据
				getTrees()
					.then(({ data }) => {
						if (!data || !data.length) {
							ElMessageBox.confirm('您的角色菜单权限不足，请联系管理员', '系统提示', {
								confirmButtonText: '重新登录',
								cancelButtonText: '取消',
								type: 'warning',
							}).then(() => {
								this.LogOut()
							})
							return reject()
						}
						const rewriteRoutes = transRouter(data)

						this.permission.addRoutes = rewriteRoutes
						this.permission.routes = constantRoutes.concat(rewriteRoutes)
						this.permission.topbarRouters = this.permission.routes.filter((e) => !e.hidden)
						// console.log(rewriteRoutes)

						resolve(rewriteRoutes)
					})
					.catch((error) => {
						console.log(error)
						reject()
					})
			})
		},
	},
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
