// import { useUserStore } from '@/stores/user'
// let userStore = useUserStore()
import { getUserInfo, logout } from '@/views/system/login/api'

export const useUserStore = defineStore('user', {
  state: () => ({
    id: '',
    name: '',
    avatar: new URL('@/assets/image/profile.jpg', import.meta.url).href,
    roles: [],
    permissions: [],
    configParamInfo: {},
  }),
  actions: {
    clearUserState() {
      this.id = ''
      this.name = ''
      this.avatar = new URL('@/assets/image/profile.jpg', import.meta.url).href
      this.roles = []
      this.permissions = []
      this.configParamInfo = {}
    },

    redirectToLogin(redirectPath) {
      const baseUrl = window.sysConfig.BASE_URL
      const loginUrl = redirectPath ? `${baseUrl}login?redirect=${encodeURIComponent(redirectPath)}` : `${baseUrl}login`
      location.href = loginUrl
    },

    handleSessionExpired(redirectPath) {
      this.clearUserState()
      this.redirectToLogin(redirectPath)
    },

    // 获取用户信息
    async getUserInfo() {
      try {
        const { data: user = {} } = await getUserInfo()
        this.id = user.id
        this.name = user.name
        // 修复：只有当 avatar 存在且不为 null 时才拼接路径
        if (user.avatar && user.avatar !== 'null') {
          this.avatar = window.sysConfig.BASE_API + '/static/' + user.avatar
        }
        this.roles = user.roles || []
        this.permissions = user.permissions || []
        this.configParamInfo = user.configParamInfo
        
        // 获取用户主题配置并应用
        try {
          // 动态导入，打破循环依赖
          const { getTheme } = await import('@/views/system/users/api')
          const themeRes = await getTheme()
          const themeHsl = themeRes.data?.themeHsl
          if (themeHsl) {
            const [h, s, l] = themeHsl.split(',').map((e) => e.trim())
            const style = document.documentElement.style
            style.setProperty('--H', h)
            style.setProperty('--S', s)
            style.setProperty('--L', l)
            // 同步到 localStorage
            localStorage.hsl = themeHsl
          }
        } catch (error) {
          console.error('获取主题配置失败:', error)
        }
        
        return user
      } catch (error) {
        throw error
      }
    },

    // 退出系统
    logout() {
      this.clearUserState()

      return logout()
        .then(() => {
          location.href = window.sysConfig.BASE_URL
        })
        .catch((error) => {
          console.error('Logout failed:', error)
          // 即使 API 失败也清除本地状态
          location.href = window.sysConfig.BASE_URL
        })
    },
  },
})
