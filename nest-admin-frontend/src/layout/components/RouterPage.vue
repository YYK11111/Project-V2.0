<template>
  <div class="RouterPage" v-loading="$store.loading">
    <!-- <RouterView class="page" id="page-container" /> -->
    <router-view v-slot="{ Component, route }" class="page max-h-full" id="page-container">
      <!-- <transition name="fade-transform" mode="out-in">
          <keep-alive :key="route.path">
            <component :is="Component" />
          </keep-alive>
        </transition> -->
      <keep-alive>
        <component :is="Component" :key="route.fullPath" />
      </keep-alive>
    </router-view>
  </div>
</template>
<script>
export default {
  name: 'AppMain',
  data() {
    return {
      loading: false,
    }
  },
  computed: {},
  mounted() {},
}
</script>

<style lang="scss" scoped>
// ::v-deep .el-scrollbar__wrap {
//   margin: 20px 0;
//   padding: 0 20px;
// }
.RouterPage {
  position: relative;
  flex: 0 1 auto;
  overflow-y: auto;
  overflow-x: hidden;
  scroll-behavior: smooth;
  margin-top: var(--Margin);
  height: 100%;
  padding: 0 var(--Margin);
  ::v-deep > .el-loading-mask {
    position: sticky;
    bottom: 0;
    width: 100%;
    height: 100%;
  }
}

.page {
  overflow-y: auto;
  overflow-x: hidden;
  ::v-deep > .el-loading-mask {
    position: sticky;
    bottom: 0;
    width: 100%;
    height: 100%;
  }
}
// .fixed-header + .RouterPage {
//   padding-top: 50px;
// }

// .hasTagsView {
//   .RouterPage {
//     /* 84 = navbar + tags-view = 50 + 34 */
//     height: calc(100vh - 84px);
//   }

//   .fixed-header + .RouterPage {
//     padding-top: 84px;
//   }
// }
</style>

<style lang="scss">
// fix css style bug in open el-dialog
.el-popup-parent--hidden {
  .fixed-header {
    padding-right: 15px;
  }
}
#micro-app > div {
  height: 100%;
}
</style>
