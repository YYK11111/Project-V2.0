<!-- 服务包弹窗 -->
<template>
  <aside class="aside sidebar-container">
    <Logo />
    <el-menu
      class="sidebar-menu"
      ref="menu"
      :default-active="activeMenu"
      :collapse="isCollapse"
      :collapse-transition="false"
      mode="vertical">
      <el-scrollbar wrap-class="scrollbar-wrapper">
        <SidebarItem v-for="(route, index) in routes" :key="index" :route="route" level="1" :basePath="route.path" />
      </el-scrollbar>
    </el-menu>
  </aside>
</template>

<script>
import path from 'path-browserify'
import { mapState } from 'pinia'
import { useMenusStore } from '@/stores/menus'
import Logo from '../Logo'

import SidebarItem from './SidebarItem'

export default {
  components: { SidebarItem, Logo },
  computed: {
    // ...mapState(['settings']),
    ...mapState(useMenusStore, ['routes']),
    activeMenu() {
      const route = this.$route
      const { meta, path } = route
      // setTimeout(() => {
      //   this.$store.app.showMenuIndex = this.$store.app.currentMenuIndex = this.topMenus.findIndex((e) =>
      //     path.startsWith(e.path),
      //   )
      // }, 100)
      // if set path, the sidebar will highlight the path you set
      if (meta.activeMenu) {
        return meta.activeMenu
      } else if (route.meta.isHidden) {
        return route.matched.slice(-2, -1)[0].path
      }
      return path
    },
    isCollapse() {
      // return !this.sidebar.opened
      return false
    },
    topMenus() {
      return this.topbarRouters.filter((e) => !e.isHidden)
    },
  },
  data() {
    return { openeds: [], current: 0 }
  },
  mounted() {
    // this.$nextTick(() => {
    //   console.log(this.topbarRouters)
    // })
  },
  methods: {
    open(v) {
      setTimeout(() => {
        this.$refs.menu.open(v)
      }, 0)
    },
    resolvePath(pathStr, parentRoute) {
      return path.resolve(parentRoute.path, pathStr)
    },
  },
}
</script>

<style lang="scss" scoped>
::v-deep.sidebar-container {
  position: absolute;
  display: inline-flex;
  flex-direction: column;
  transition: width 0.28s;
  width: var(--SideBarWidth) !important;
  height: 100vh;
  box-shadow: 1px 0px 0px 0px var(--ColorLight9);
  bottom: 0;
  z-index: 1001;
  overflow-x: hidden;
  overflow-y: auto;
  flex: none;

  .top-title-wrap {
    padding: 20px 10px;
    border-bottom: 1px solid var(--BorderBlack10);
    border-right: 1px solid var(--BorderBlack10);
    margin-right: -1px;
    z-index: 1;
    .top-title {
      font-size: 16px;
      font-weight: bold;
    }
    .top-desc {
      color: var(--FontBlack5);
      font-size: 12px;
    }
  }

  // reset element-ui css
  .horizontal-collapse-transition {
    transition: 0s width ease-in-out, 0s padding-left ease-in-out, 0s padding-right ease-in-out;
  }

  .scrollbar-wrapper {
    overflow-x: hidden !important;
  }

  // .el-scrollbar__bar.is-vertical {
  //   right: 0px;
  // }

  .el-scrollbar {
    flex: auto;
  }

  &.has-logo {
    .el-scrollbar {
      height: calc(100% - 50px);
    }
  }

  .is-horizontal {
    display: none;
  }

  // .svg-icon {
  //   margin-right: 16px;
  // }

  > .sidebar-menu {
    overflow: hidden;
  }

  .el-menu {
    border: none;
    height: 100%;
    width: 100% !important;
    background-color: transparent;
  }

  .menuItem {
    display: none;
  }

  // 叶子菜单，目录
  .el-menu-item,
  .el-sub-menu > .el-sub-menu__title {
    padding: 0 !important;
    // margin: 4px auto;
    margin: 4px 10px;
    font-weight: 500;
    height: 40px;
    line-height: 40px;
    i {
      color: inherit;
    }
    // background-color: $subMenuBg !important;
    &:hover {
      color: var(--Color);
      background-color: transparent !important;
    }
  }
  // 叶子菜单
  .el-menu-item {
    // margin: 4px 16px;
    min-width: auto;
    // a {
    //   &:hover {
    //     color: inherit !important;
    //   }
    // }
  }
  // 当前激活菜单
  .el-menu-item.is-active {
    background: linear-gradient(to right, var(--Color) 0%, var(--ColorSub) 100%);
    box-shadow: 0px 13px 16px 0px hsla(var(--HslDark), 0.2);
    border-radius: var(--Radius);
    color: var(--FontWhite, #fff) !important;
    z-index: 1;
  }

  // 当前激活菜单所属上级菜单标题目录
  .is-active > .el-sub-menu__title {
    color: var(--Color) !important;
  }
}

.hideSidebar {
  .sidebar-container {
    width: 0 !important;
  }

  .submenu-title-noDropdown {
    padding: 0 !important;
    position: relative;

    .el-tooltip {
      padding: 0 !important;

      .svg-icon {
        margin-left: 20px;
      }
    }
  }

  .el-sub-menu {
    overflow: hidden;

    & > .el-sub-menu__title {
      padding: 0 !important;

      .svg-icon {
        margin-left: 20px;
      }

      .el-sub-menu__icon-arrow {
        display: none;
      }
    }
  }

  .el-menu--collapse {
    .el-sub-menu {
      & > .el-sub-menu__title {
        & > span {
          height: 0;
          width: 0;
          overflow: hidden;
          visibility: hidden;
          display: inline-block;
        }
      }
    }
  }
}
.menuHover {
  .sidebar-container {
    width: var(--SideBarWidth) !important;
  }
}
</style>
