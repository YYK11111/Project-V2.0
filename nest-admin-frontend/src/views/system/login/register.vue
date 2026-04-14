<template>
  <div class="register centerCenter Gcard">
    <div class="alignCenter mb20">
      <img class="logo mr10" style="vertical-align: middle; height: 45px" :src="sysConfig.LOGO" />
      <span class="loginTitle ml5 --color" style="vertical-align: middle">{{ sysConfig.SYSTEM_NAME }}</span>
      <div class="floatRight" @click="dark = !dark">
        <el-icon-Moon v-if="dark" class="el-icon-Moon font18 mr5" />
        <el-icon-Sunny v-else class="el-icon-Sunny font18 mr5" />
      </div>
      <div class="loginSlogan mt20">{{ sysConfig.SYSTEM_SLOGAN }}</div>
    </div>
    <div class="font16 --Color mb20 blod">{{ isRegister ? '用户注册' : '重置密码' }}</div>

    <el-form ref="formRef" size="large" :model="form" style="gap: 20px">
      <!-- <template v-if="!isRegister">
        <BaInput v-model="form.phone" placeholder="请输入手机号" prop="phone" required></BaInput>
        <div class="flexBetween">
          <BaInput v-model="form.code" placeholder="请输入验证码" prop="code" required></BaInput>
          <el-button class="font14 ml10 --Color" style="width: 120px" :disabled="isCountingDown" @click="getCode">
            {{ countdownText }}
          </el-button>
        </div>
      </template> -->

      <BaInput v-model="form.name" placeholder="请输入账号" prop="name" required></BaInput>

      <BaInput
        v-model="form.password"
        :type="ispassword ? 'password' : 'text'"
        placeholder="请输入密码"
        prop="password"
        required>
        <template #suffix>
          <svg-icon :icon="ispassword ? 'eye' : 'eye-open'" class="input-icon cp" @click="ispassword = !ispassword" />
        </template>
      </BaInput>
      <BaInput
        v-model="form.confirmPassword"
        :type="ispassword ? 'password' : 'text'"
        placeholder="请再次输入密码"
        prop="confirmPassword"
        required>
        <template #suffix>
          <svg-icon :icon="ispassword ? 'eye' : 'eye-open'" class="input-icon cp" @click="ispassword = !ispassword" />
        </template>
      </BaInput>
      <div class="flexBetween">
        <BaInput v-model="form.code" placeholder="请输入验证码" prop="code" required></BaInput>
        <el-button class="font14 ml10 --Color" style="width: 120px" @click="getCaptchaImageFun">
          <span v-html="captchaImage" class="lineHeight0" style="font-size: 100px"></span>
        </el-button>
      </div>
      <!-- <BaInput v-model="form.email" placeholder="请输入邮箱" prop="email"></BaInput> -->
      <div class="flexBetween">
        <el-button style="width: 100%" round :loading="loading" type="primary" @click="submit">确认</el-button>
        <el-button style="width: 100%" round type="primary" @click="$router.back()">取消</el-button>
      </div>
    </el-form>
  </div>
</template>
<script setup>
import { computed, ref } from 'vue'
import { register, resetPassword } from '@/views/system/users/api'
import { getCaptchaImage } from './api'
const route = useRoute()
const router = useRouter()
const loading = ref(false)
const ispassword = ref(true)
const formRef = ref()
const form = ref({})

import { useDark, useToggle } from '@vueuse/core'
let dark = useDark()

const isRegister = computed(() => {
  return route.path === '/register'
})

const captchaImage = ref()
function getCaptchaImageFun() {
  getCaptchaImage().then(({ data }) => {
    captchaImage.value = data.data
    form.value.uuid = data.uuid
  })
}
getCaptchaImageFun()

// 手机倒计时验证码
const isCountingDown = ref(false)
const countdownText = ref('获取验证码')
let countdownTimer = null
const countdownDuration = 60 // 倒计时时间，单位秒
function getCode() {
  if (!form.value.phone) {
    $sdk.msgError('请输入手机号码')
    return
  }

  // 发送请求到后端API获取验证码
  // 这里应该是一个实际的HTTP请求，例如使用axios
  console.log('发送验证码到', form.value.phone)

  // 启动倒计时
  startCountdown()
}
function startCountdown() {
  isCountingDown.value = true
  let remainingTime = countdownDuration

  countdownTimer = setInterval(() => {
    remainingTime--
    countdownText.value = `${remainingTime}秒后重试`

    if (remainingTime <= 0) {
      clearInterval(countdownTimer)
      countdownText.value = '获取验证码'
      isCountingDown.value = false
    }
  }, 1000)
}

function submit() {
  formRef.value.validate().then(() => {
    if (form.value.password !== form.value.confirmPassword) {
      $sdk.msgError('密码和确认密码不一致，请重新输入！')
      return
    }
    loading.value = true
    ;(isRegister.value
      ? register(form.value)
          .then(() => {
            $sdk.msgSuccess('注册成功！')
            router.push('/login')
          })
          .catch(() => getCaptchaImageFun())
      : resetPassword(form.value).then(() => {
          $sdk.msgSuccess('重置成功！')
          router.back()
        })
    ).finally(() => (loading.value = false))
  })
}
</script>
<style scoped>
.register {
  width: 400px;
  margin: 0 auto;
  padding: 20px;
}
.loginTitle {
  font-size: 30px;
}
.loginSlogan {
  font-size: 15px;
  color: var(--FontBlack5);
}
</style>
