<template>
  <div class="login alignCenter centerCenter Gcard">
    <div class="mb20">
      <img class="logo mr10" style="vertical-align: middle; height: 45px" :src="sysConfig.LOGO" />
      <span class="loginTitle ml5 --color" style="vertical-align: middle">{{ sysConfig.SYSTEM_NAME }}</span>
      <div class="floatRight" @click="dark = !dark">
        <el-icon-Moon v-if="dark" class="el-icon-Moon font18 mr5" />
        <el-icon-Sunny v-else class="el-icon-Sunny font18 mr5" />
      </div>
      <div class="loginSlogan mt20">{{ sysConfig.SYSTEM_SLOGAN }}</div>
    </div>
    <div class="flexBetween mb20">
      <div class="font16 blod --Color">密码登录</div>
      <div class="">
        没有账号？
        <span class="--Color pointer" @click="$router.push('/register')">点击注册</span>
      </div>
    </div>
    <el-form
      ref="formRef"
      size="large"
      style="--FormItemContentMaxWidth: none"
      :model="form"
      :rules="loginRules"
      class="form"
      @keyup.enter="submit">
      <template v-if="loginType === 'account'">
        <BaInput v-model.trim="form.account" placeholder="账号" prop="account"></BaInput>
        <BaInput v-model="form.password" :type="ispassword ? 'password' : 'text'" placeholder="密码" prop="password">
          <template #suffix>
            <svg-icon :icon="ispassword ? 'eye' : 'eye-open'" class="font16" @click="ispassword = !ispassword" />
          </template>
        </BaInput>

        <div class="flexCenterBetween">
          <BaInput v-model="form.code" placeholder="请输入验证码" prop="code" required></BaInput>
          <el-button class="font14 ml10 flex-none" style="width: 120px" @click="getCaptchaImageFun">
            <span v-html="captchaImage" class="lineHeight0" style="font-size: 100px"></span>
          </el-button>
        </div>

        <div class="flexBetween --marginB">
          <el-checkbox class="floatRight" v-model="form.rememberMe">记住我</el-checkbox>

          <el-button text @click="$sdk.demoDisabled() && $router.push('/forgetPassword')">忘记密码？</el-button>
        </div>
        <el-button :loading="loading" type="primary" round style="width: 100%" @click.prevent="submit">登 录</el-button>
      </template>
    </el-form>

    <el-divider><span class="" style="color: var(--FontBlack7)">其他方式登录</span></el-divider>
    <div class="third pointer" @click="$sdk.demoDisabled()">
      <SvgIcon icon="wechat" style="color: #05e06d" />
      <SvgIcon icon="gitee" />
      <SvgIcon icon="phone" />
      <SvgIcon icon="github" style="color: var(--FontBlack)" />
    </div>
  </div>
</template>

<script setup>
import Cookies from 'js-cookie'
import { login, getCaptchaImage } from './api'

const route = useRoute()
const router = useRouter()
const loading = ref(false)
const ispassword = ref(true)
const loginType = ref('account')
const redirect = ref()
const formRef = ref()
const form = ref({
  account: 'NestAdmin',
  password: '123456',
  rememberMe: false,
  code: '',
  uuid: '',
})

import { useDark, useToggle } from '@vueuse/core'
let dark = useDark()

watch(
  () => route.query?.redirect,
  (d) => (redirect.value = d),
  'immediate',
)

async function getCookie() {
  const account = Cookies.get('account')
  const rememberMe = Cookies.get('rememberMe')
  form.value = {
    account: account || form.value.account,
    password: form.value.password,
    rememberMe: !!rememberMe,
  }
}
getCookie()

const captchaImage = ref()
function getCaptchaImageFun() {
  getCaptchaImage().then(({ data }) => {
    captchaImage.value = data.data
    form.value.uuid = data.uuid
  })
}
getCaptchaImageFun()

function submit() {
  formRef.value.validate().then(async () => {
    if (form.value.rememberMe) {
      Cookies.set('account', form.value.account, { expires: 30 })
      Cookies.set('rememberMe', form.value.rememberMe, {
        expires: 30,
      })
    } else {
      Cookies.remove('account')
      Cookies.remove('rememberMe')
    }
    loading.value = true
    login({ ...form.value })
      .then(() => {
        redirect.value ? router.push(redirect.value) : (location.href = window.sysConfig.BASE_URL)
      })
      .catch(() => getCaptchaImageFun())
      .finally(() => (loading.value = false))
  })
}
</script>

<style lang="scss" scoped>
.logo {
  height: 45px;
}

.loginTitle {
  font-size: 30px;
}
.loginSlogan {
  font-size: 15px;
  color: var(--FontBlack5);
}

.form {
  max-width: none;

  // .el-input {
  //   height: 38px;
  //   line-height: 38px;
  //   input {
  //     height: 38px;
  //   }
  // }
  .desc {
    text-align: center;
    color: var(--FontBlack7);
    font-size: 12px;
    margin: -22px 0 50px;
  }
}
.third {
  display: flex;
  justify-content: space-around;
  align-items: center;
  .SvgIcon {
    font-size: 30px;
    color: var(--FontBlack5);
  }
}
</style>
