<template>
  <div>
    <el-row :gutter="20">
      <el-col :span="6" :xs="24">
        <el-card class="--RadiusBig">
          <template #header>
            <div class="clearfix">
              <span>个人信息</span>
            </div>
          </template>
          <div>
            <div class="alignCenter">
              <userAvatar :user="user" />
            </div>
            <ul class="list-group">
              <li class="list-group-item">
                <div>
                  <SvgIcon icon="user" />
                  用户名称
                </div>
                <div class="floatRight">{{ user.name }}</div>
              </li>
              <li class="list-group-item">
                <div>
                  <SvgIcon icon="phone" />
                  手机号码
                </div>
                <div class="floatRight">{{ user.phone }}</div>
              </li>
              <li class="list-group-item">
                <div>
                  <SvgIcon icon="email" />
                  用户邮箱
                </div>
                <div class="floatRight">{{ user.email }}</div>
              </li>
              <li class="list-group-item">
                <div>
                  <SvgIcon icon="tree" />
                  所属部门
                </div>
                <div class="floatRight" v-if="user.dept">
                  <MultiTags v-if="user.dept?.name" :list="user.dept?.name" />
                </div>
              </li>
              <li class="list-group-item">
                <div>
                  <SvgIcon icon="peoples" />
                  所属角色
                </div>
                <div class="floatRight"><MultiTags :list="user.roles" /></div>
              </li>
              <li class="list-group-item">
                <div>
                  <SvgIcon icon="date" />
                  创建日期
                </div>
                <div class="floatRight">{{ user.createTime }}</div>
              </li>
            </ul>
          </div>
        </el-card>
      </el-col>
      <el-col :span="18" :xs="24">
        <el-card class="--RadiusBig">
          <template #header>
            <span>基本资料</span>
          </template>
          <el-tabs v-model="activeTab">
            <el-tab-pane label="基本资料" name="userinfo">
              <userInfo :user="user" />
            </el-tab-pane>
            <el-tab-pane label="修改密码" name="resetPwd">
              <resetPwd :user="user" />
            </el-tab-pane>
          </el-tabs>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script>
import userAvatar from './userAvatar'
import userInfo from './userInfo'
import resetPwd from './resetPwd'
import { getUserInfo } from '@/views/system/login/api'

export default {
  components: { userAvatar, userInfo, resetPwd },
  data() {
    return {
      user: {},
      roles: {},
      dept: {},
      activeTab: 'userinfo',
    }
  },
  created() {
    this.getUser()
  },
  methods: {
    getUser() {
      getUserInfo().then(({ data }) => {
        this.user = data
        this.roles = data.roles
        this.dept = data.dept
      })
    },
  },
}
</script>
<style lang="scss" scoped>
.SvgIcon {
  margin-right: 5px;
}
.list-group-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid var(--BorderBlack9);
  padding: 15px 0px;
  font-size: 13px;
}
</style>
