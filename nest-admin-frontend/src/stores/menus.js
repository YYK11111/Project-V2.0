export const useMenusStore = defineStore('menus', {
	state: () => ({
		routes: [],
		addRoutes: [],
		topbarRouters: [],
		sidebarRouters: [], // 当前显示的侧边栏菜单，通过topbarRouters筛选当前激活的顶部菜单下的子菜单
	}),
})
