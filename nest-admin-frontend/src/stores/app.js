import { getList } from '@/views/system/configs/api'
import Cookies from 'js-cookie'

export const useAppStore = defineStore('app', {
  state: () => ({
    loading: false, // 页面loading
    AIDrawer: false, // AI抽屉
    sidebar: {
      opened: Cookies.get('sidebarStatus') ? !!+Cookies.get('sidebarStatus') : true,
      withoutAnimation: false,
    },
    busininessDesc: undefined,
    sysConfig: null,
    showMenuIndex: 0,
    currentMenuIndex: 0,
  }),
  actions: {
    toggleSideBar() {
      this.sidebar.opened = !this.sidebar.opened
      this.sidebar.withoutAnimation = false
      if (this.sidebar.opened) {
        Cookies.set('sidebarStatus', 1)
      } else {
        Cookies.set('sidebarStatus', 0)
      }
    },
    closeSideBar({ withoutAnimation }) {
      Cookies.set('sidebarStatus', 0)
      this.sidebar.opened = false
      this.sidebar.withoutAnimation = withoutAnimation
    },
    setBusininessDesc(busininessDesc) {
      this.busininessDesc = busininessDesc
    },
    getConfig() {
      return (
        this.sysConfig ||
        getList().then(({ list = [] }) => {
          const data = list[0] || {}
          this.sysConfig = data
          data.systemName && (window.sysConfig.SYSTEM_NAME = data.systemName)
          data.systemLogo && (window.sysConfig.LOGO = data.systemLogo)
        })
      )
    },
  },
})
