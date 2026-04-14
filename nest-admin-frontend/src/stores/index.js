import { createPinia, defineStore } from 'pinia'
import app from './modules/app'
import user from './modules/user'
import permission from './modules/permission'
import getters from './getters'

export const store = createPinia()

export default defineStore('app1', {
  state: () => ({
    loading: false, // 页面loading
    AIDrawer: false, // AI抽屉
    app: { ...app.state },
    user: { ...user.state },
    permission: { ...permission.state },
  }),
  actions: {
    ...app.actions,
    ...user.actions,
    ...permission.actions,
  },
  getters,
})
