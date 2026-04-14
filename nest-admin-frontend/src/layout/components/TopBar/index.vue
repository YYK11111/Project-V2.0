<template>
  <div class="TopBar flexCenterBetween flexNone --TopNavHeght">
    <Breadcrumb />

    <!-- <el-scrollbar class="nav-scrollbar">
      <template v-for="(route, index) in permission_routes" :key="index">
        <div
          v-if="!route.hidden"
          :class="['nav', $route.path.startsWith(route.path) && 'active']"
          :key="route.path + index"
          @click="goLink(route.path)"
        >
          {{ route.meta && route.meta.title }}
        </div>
      </template>
    </el-scrollbar> -->

    <div class="quick flexCenterBetween --MarginR">
      <svg-icon class="right-icon menuItem" icon="AIkefu" @click="useAppStore().AIDrawer = true"></svg-icon>
      <!-- v-if="useAppStore().sysConfig?.ai" -->

      <AIDrawer />

      <el-tooltip content="源码地址" effect="dark" placement="bottom">
        <div class="right-menu-item hover-effect">
          <svg-icon class="right-icon" icon="gitee" @click="goto('https://gitee.com/hixinla/nest-admin')" />
        </div>
      </el-tooltip>

      <el-tooltip content="文档手册" effect="dark" placement="bottom">
        <div class="right-menu-item hover-effect">
          <el-icon-reading class="el-icon-reading document right-icon" @click="goto('https://nestts.com/doc')" />
        </div>
      </el-tooltip>

      <!-- <el-tooltip content="需求墙" effect="dark" placement="bottom">
        <div class="right-menu-item hover-effect">
          <el-icon-data-board class="el-icon-data-board right-icon" @click="goto('')" />
        </div>
      </el-tooltip> -->

      <!-- <screenfull id="screenfull" class="right-menu-item hover-effect" /> -->

      <div class="pointer" @click="dark = !dark">
        <el-icon-Moon v-if="dark" class="el-icon-Moon right-icon mr5" />
        <el-icon-Sunny v-else class="el-icon-Sunny right-icon mr5" />
      </div>

      <el-dropdown class="avatar-container menuItem" trigger="hover">
        <div class="avatar-wrapper">
          <!-- <svg-icon icon="user" style="font-size: 18px" /> -->
          <img :src="avatar" class="user-avatar" />
          <!-- <div :title="name" class="user-name ellipsis">{{ name }}</div> -->
          <el-icon-arrow-down class="el-icon-arrow-down" />
        </div>
        <template #dropdown>
          <el-dropdown-menu>
            <router-link to="/user/profile">
              <el-dropdown-item>个人中心</el-dropdown-item>
            </router-link>
            <el-dropdown-item divided @click="openSettings()">
              <span>主题设置</span>
            </el-dropdown-item>
            <el-dropdown-item @click="logoutFn">
              <span>退出登录</span>
            </el-dropdown-item>
          </el-dropdown-menu>
        </template>
      </el-dropdown>
    </div>

    <Settings ref="settingsRef" />
  </div>
</template>

<script setup lang="ts">
import Breadcrumb from '../Breadcrumb.vue'
import { useUserStore } from '@/stores/user'
const { avatar, name, logout } = useUserStore()
import Settings from './Settings.vue'
import { isExternal } from '@/utils/validate'
import { mapState } from 'pinia'
import { useAppStore } from '@/stores/app'

import TopMenu from './TopMenu.vue'
import AIDrawer from './AIDrawer/index.vue'
import { useDark, useToggle } from '@vueuse/core'
let dark = useDark()
const settingsRef = ref<any>(null)

function openSettings() {
  settingsRef.value && (settingsRef.value.visible = true)
}

async function logoutFn() {
  $sdk
    .confirm('确定注销并退出系统吗？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning',
    })
    .then(() => {
      logout()
    })
}

function goto(url) {
  window.open(url)
}

// export default {
//   data() {
//     return {
//       setting: false,
//     }
//   },
//   components: {
//     Logo,
//     TopMenu,
//     Settings,
//     AIDrawer,
//   },
//   computed: {
//     ...mapState(stores, ['avatar', 'name', 'permission_routes']),
//   },
//   mounted() {},
//   methods: {

//     goLink(path) {
//       if (!isExternal(path)) {
//         this.$router.push({ path })
//       } else {
//         window.open(path, '_blank')
//       }
//     },
//   },
// }
</script>

<style lang="scss" scoped>
.hover-class {
  display: flex;
  flex-direction: column;
  align-items: center;
  span:nth-child(1) {
    font-size: 18px;
    font-weight: bold;
    line-height: 36px;
    margin-bottom: 10px;
  }
  img {
    width: 160px;
    height: 160px;
  }
  span:nth-child(3) {
    font-size: 14px;
    line-height: 16px;
    margin-top: 20px;
  }
}
.right-icon {
  font-size: 20px;
  margin-right: 10px;
  cursor: pointer;
  color: var(--Color);
}
//
.TopBar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  overflow: hidden;
  position: relative;
  color: var(--FontBlack);
  box-shadow: 0px 1px 0px 0px var(--ColorLight9);
  .errLog-container {
    display: inline-block;
    vertical-align: top;
  }

  .quick {
    text-align: center;

    .menuItem {
      // color: var(--FontBlack4);
      cursor: pointer;
      transition: background 0.3s;

      &:hover {
        color: var(--Color);
      }
    }

    .avatar-container {
      // margin-right: 30px;

      .avatar-wrapper {
        position: relative;
        outline: none;
        .user-avatar {
          // ---temp: #fafafa;
          display: inline-block;
          position: relative;
          width: 34px;
          height: 34px;
          border-radius: 50%;
          vertical-align: middle;
          // background: var(---temp);
          border: 1px solid var(--BorderBlack10);
        }
        .user-name {
          display: inline-block;
          max-width: 100px;
          vertical-align: middle;
          font-weight: 500;
          margin-left: 8px;
        }

        .el-icon-arrow-down {
          margin-left: 3px;
          font-size: 12px;
          color: var(--FontBlack);
        }
      }
    }
  }
}

// .nav-scrollbar {
//   width: calc(100% - 450px);
//   ::v-deep.el-scrollbar__view {
//     white-space: nowrap;
//     line-height: 58px;
//   }
//   .nav {
//     display: inline-block;
//     margin: 0 20px;
//     flex: none;
//     position: relative;
//     cursor: pointer;
//     &.active::after {
//       content: '';
//       display: inline-block;
//       position: absolute;
//       bottom: 2px;
//       width: 42px;
//       height: 2px;
//       left: 50%;
//       transform: translateX(-50%);
//       border-radius: 6px;
//       background: var(--BgWhite);
//     }
//   }
// }

.contact-us {
  position: fixed;
  top: 60%;
  width: 100px;
  height: 100px;
  z-index: 99;
  right: 28px;
  width: 50px;
  height: 50px;
  background: linear-gradient(225deg, var(--ColorSub) 0%, var(--Color) 100%);
  box-shadow: 0px 4px 20px 0px rgba(28, 49, 111, 0.1);
  border-radius: 50%;
  // background: var(--BgWhite);
  // color: var(--Color);
  .contact-us-icon {
    color: var(--FontWhite, #fff);
    // color: inherit;
    font-size: 30px;
  }
  // &:hover {
  //   color: var(--FontWhite, #fff);
  //   background: linear-gradient(225deg, var(--ColorSub) 0%, var(--Color) 100%);
  //   transition: all 0.3s;
  // }
}
.contact-code {
  width: 118px;
}
</style>
