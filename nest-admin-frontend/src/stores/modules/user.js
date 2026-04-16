import { getOne } from '@/views/system/users/api'

const user = {
	state: {
		name: '',
		avatar: new URL('@/assets/image/profile.jpg', import.meta.url).href,
		roles: [],
		permissions: [],
		configParamInfo: {},
	},

	actions: {
		// 获取用户信息
		getInfo() {
			return new Promise((resolve, reject) => {
				getOne().then((res) => {
					try {
						const user = res.data
						const avatar = user.avatar
						// : window.sysConfig.BASE_API + user.avatar
						if (res.roles && res.roles.length > 0) {
							// 验证返回的roles是否是一个非空数组
							//   'SET_ROLES',
							//   // res.user.roles.map((data) => {
							//   //   return data.roleKey
							//   // })
							//   res.roles,
							// )
							this.user.roles = res.roles
							this.user.permissions = res.permissions
						} else {
							this.user.roles = ['ROLE_DEFAULT']
						}
						this.user.name = user.userName
						// 修复：只有当 avatar 存在且不为 null 时才赋值
						avatar && avatar !== 'null' && (this.user.avatar = window.sysConfig.BASE_API + '/static/' + avatar)
						this.user.configParamInfo = res.configParamInfo

						this.user.companyName = user.companyName
						resolve(res)
					} catch (error) {
						reject(error)
					}
				})
			})
		},

		// 退出系统
		LogOut() {
			return new Promise((resolve, reject) => {
				this.user.roles = []
				this.user.permissions = []

				resolve()
				location.href = window.sysConfig.BASE_URL
			})
		},
	},
}

export default user
