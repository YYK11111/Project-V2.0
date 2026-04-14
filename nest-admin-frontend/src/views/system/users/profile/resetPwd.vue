<template>
	<el-form ref="form" :model="user" :rules="rules" label-width="80px">
		<el-form-item label="旧密码" prop="passwordOld">
			<el-input v-model="user.passwordOld" placeholder="请输入旧密码" type="password" />
		</el-form-item>
		<el-form-item label="新密码" prop="passwordNew">
			<el-input v-model="user.passwordNew" placeholder="请输入新密码" type="password" />
		</el-form-item>
		<el-form-item label="确认密码" prop="passwordNewConfirm">
			<el-input v-model="user.passwordNewConfirm" placeholder="请确认密码" type="password" />
		</el-form-item>
		<el-form-item>
			<el-button type="primary" @click="submit">保存</el-button>
			<el-button type="danger" @click="close">关闭</el-button>
		</el-form-item>
	</el-form>
</template>

<script>
import { resetPassword } from '../api'

export default {
	props: {
		user: {
			type: Object,
		},
	},
	data() {
		const equalToPassword = (rule, value, callback) => {
			if (this.user.passwordNew !== value) {
				callback(new Error('两次输入的密码不一致'))
			} else {
				callback()
			}
		}
		return {
			// 表单校验
			rules: {
				passwordOld: [{ required: true, message: '旧密码不能为空', trigger: 'blur' }],
				passwordNew: [
					{ required: true, message: '新密码不能为空', trigger: 'blur' },
					{ min: 6, max: 20, message: '长度在 6 到 20 个字符', trigger: 'blur' },
				],
				passwordNewConfirm: [
					{ required: true, message: '确认密码不能为空', trigger: 'blur' },
					{ required: true, validator: equalToPassword, trigger: 'blur' },
				],
			},
		}
	},
	methods: {
		submit() {
			this.$refs['form'].validate((valid) => {
				if (valid) {
					resetPassword(this.user).then((response) => {
						$sdk.msgSuccess('修改成功')
					})
				}
			})
		},
		close() {
			this.$router.back()
		},
	},
}
</script>
