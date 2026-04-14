import { getConfig } from '@/api/common'
import Cookies from 'js-cookie'
import { useDark, useToggle } from '@vueuse/core'

const state = {
  theme: getComputedStyle(document.documentElement).getPropertyValue('--color'),
  sidebar: {
    opened: Cookies.get('sidebarStatus') ? !!+Cookies.get('sidebarStatus') : true,
    withoutAnimation: false,
  },
  busininessDesc: undefined,
  serverState: {},
  showMenuIndex: 0,
  currentMenuIndex: 0,
  config: {},
}

const actions = {
  toggleSideBar() {
    this.app.sidebar.opened = !this.app.sidebar.opened
    this.app.sidebar.withoutAnimation = false
    if (this.app.sidebar.opened) {
      Cookies.set('sidebarStatus', 1)
    } else {
      Cookies.set('sidebarStatus', 0)
    }
  },
  closeSideBar({ withoutAnimation }) {
    Cookies.set('sidebarStatus', 0)
    this.app.sidebar.opened = false
    this.app.sidebar.withoutAnimation = withoutAnimation
  },
  setBusininessDesc(busininessDesc) {
    this.app.busininessDesc = busininessDesc
  },
}

export default {
  state,
  actions,
}
