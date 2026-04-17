<template>
  <!-- <el-scrollbar class="nav-scrollbar"> -->
  <el-menu class="top-menu" :default-active="activeMenu" mode="horizontal" @select="handleSelect">
    <el-menu-item
      v-for="(item, index) in topMenus"
      :index="item.path"
      :key="index"
      @mouseenter="mouseenter(item, index)">
      <svg-icon v-if="item.meta.icon" :icon="item.meta.icon" />
      <div>
        {{ item.meta.title.split('-')[0] }}
      </div>
    </el-menu-item>
  </el-menu>
  <!-- </el-scrollbar> -->
</template>

<script>
import { isExternal } from '@/utils/validate'
import stores from '@/stores'

export default {
  data() {
    return {
      // name: '',
      // 当前激活菜单的
      currentIndex: '',
    }
  },
  computed: {
    // 顶部显示菜单
    topMenus() {
      let topMenus = []
      stores().permission.topbarRouters.map((menu) => {
        if (menu.isHidden !== true) {
          menu.isShowChild = menu.children?.some?.((e) => !e.isHidden)
          topMenus.push(menu)
        }
      })
      return topMenus
    },
    // 激活的/高亮的一级菜单路径 eg：/drainageCode
    activeMenu() {
      const path = this.$route.path
      if (!path) return ''
      let activePath = ''
      // 兼容微服务多级路径匹配eg：/microStore/*
      if (
        window.sysConfig.MICRO_APPS &&
        Object.values(window.sysConfig.MICRO_APPS).some((item) => location.pathname.startsWith(item.activeRule))
      ) {
        activePath = path.match('/.+?/.+?/')?.[0]?.slice(0, -1) || '' // eg: /a/b
      } else {
        activePath = path.match(/\/[^\/]+/)?.[0] || '' // eg: /a
      }
      activePath && this.activeRoutes(activePath)
      return activePath
    },
  },
  mounted() {},
  methods: {
    // 菜单选择事件
    handleSelect(path, keyPath) {
      if (isExternal(path)) {
        // http(s):// 路径新窗口打开
        window.open(path, '_blank')
      } else if (path.indexOf('/redirect') !== -1) {
        // /redirect 路径内部打开
        this.$router.push({ path: path.replace('/redirect', '') })
      }
      //  else if (path.includes('/#/')) {
      //   location.href = window.sysConfig.BASE_URL.slice(window.sysConfig.BASE_URL.indexOf('/'), -1) + path
      // }
      else {
        this.activeRoutes(path)

        this.$router.push({ path })
      }
    },
    // 当前激活的侧边栏菜单
    activeRoutes(path) {
      let activeRoute = stores().permission.topbarRouters.find((e) => e.path == path)
      let routes = (activeRoute && activeRoute.children) || []
      stores().permission.sidebarRouters = routes
      return routes
    },
    mouseenter(item, index) {
      if (item.isShowChild) {
        document.getElementById('app-wrapper').classList.add('menuHover')
        this.$store.app.showMenuIndex = index
      }
    },
  },
}
</script>

<style lang="scss" scoped>
.Gbg-lg {
  // background: linear-gradient(to left, var(--Color) 0%, var(--ColorSub) 100%);
  // box-shadow: 0px 13px 16px 0px hsl(var(--HslDark), 0.2);
}
// .nav-scrollbar {
//   width: calc(100% - 580px);
//   ::v-deep.el-scrollbar__view {
//     white-space: nowrap;
//   }
// }
.top-menu {
  background-color: initial;
  border: none;
  flex: 1 1 auto;
  min-width: 0;
  z-index: 0;
  height: auto;
  margin: 8px 16px;
  overflow: auto;
  display: flex;
  align-items: center;
  & > .el-menu-item {
    display: flex;
    flex-direction: column;
    justify-content: center;
    height: 65px;
    line-height: 1 !important;
    text-align: center;
    color: var(--FontBlack5);
    border-radius: 8px;
    font-weight: bold;
    margin: 0 4px !important;
    border: 0;
    padding: 0px !important;
    .svg-icon {
      font-size: 26px;
      margin-bottom: 5px;
    }
    &::after {
      content: '';
      display: block;
      opacity: 0;
      position: absolute;
      top: 0;
      left: 0;
      z-index: -1;
      width: 100%;
      height: 100%;
      border-radius: 8px;
      transition: opacity 0.3s;
      @extend .Gbg-lg;
    }
    &:not(.is-disabled) {
      &:hover,
      &:focus {
        &::after {
          opacity: 1;
        }
        background-color: initial;
        color: var(--Color, #fff);
      }
    }
  }

  &::before,
  &::after {
    display: none;
  }

  & > .el-menu-item.is-active,
  & > .el-submenu.is-active .el-submenu__title {
    @extend .Gbg-lg;
    color: var(--Color, #fff) !important;
    border: 0;
  }

  // /* submenu item */
  // & > .el-submenu .el-submenu__title {
  //   float: left;
  //   height: 50px !important;
  //   line-height: 50px !important;
  //   color: #999093 !important;
  //   padding: 0 5px !important;
  //   margin: 0 10px !important;
  // }
}
</style>
