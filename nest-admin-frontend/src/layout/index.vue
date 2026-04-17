<template>
  <div class="appWrap vh100 vw100 relative main-size flex stretch" id="app-wrapper">
    <div class="side-all relative" @mouseleave="mouseleave">
      <sidebar />
    </div>
    <section class="main-container">
      <TopBar></TopBar>
      <!-- v-show="visiableSidebarRouters"  -->
      <RouterPage />
    </section>
  </div>
</template>

<script>
import RouterPage from './components/RouterPage'
import TopBar from './components/TopBar/index'
import Sidebar from './components/Sidebar/index.vue'

import ResizeMixin from './components/ResizeHandler'

import { mapState } from 'pinia'
import stores from '@/stores'

export default {
  name: 'Layout',
  components: {
    RouterPage,
    TopBar,
    Sidebar,
  },
  mixins: [],
  computed: {
    ...mapState(stores, {
      sidebar: (state) => state.app.sidebar,
      device: (state) => state.app.device,
      showSettings: (state) => state.settings.showSettings,
      sidebarRouters: (state) => state.permission.sidebarRouters,
    }),
    visiableSidebarRouters() {
      let visibleRoutes = (this.sidebarRouters || []).filter((e) => !e.isHidden)
      return visibleRoutes && visibleRoutes.length
    },
    isSidebar() {
      return this.visiableSidebarRouters && this.sidebar.opened
    },
    classObj() {
      return {
        openSidebar: this.isSidebar,
        hideSidebar: !this.isSidebar,
        withoutAnimation: this.sidebar.withoutAnimation,
        mobile: this.device === 'mobile',
      }
    },
  },
  methods: {
    handleClickOutside() {
      this.$store.closeSideBar({ withoutAnimation: false })
    },
    mouseleave() {
      document.getElementById('app-wrapper').classList.remove('menuHover')
      this.$store.app.showMenuIndex = this.$store.app.currentMenuIndex
    },
  },
}
</script>

<style lang="scss" scoped>
.dark {
  .appWrap {
    // background: var(--BgBlack11);
  }
}
.appWrap {
  // background: var(--MainBg);
  .main-container {
    min-height: 100%;
    transition: all 0.28s;
    position: relative;
    flex: auto;
    overflow: auto;
    display: flex;
    flex-direction: column;
    margin-left: var(--SideBarWidth);
  }

  &.mobile.openSidebar {
    position: fixed;
    top: 0;
  }
}

.hideSidebar {
  .main-container {
    margin-left: 0 !important;
  }
}
</style>
