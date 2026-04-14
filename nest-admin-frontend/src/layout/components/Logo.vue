<template>
  <transition name="sidebarLogoFade">
    <div class="logoWrap --TopNavHeght" :class="{ collapse: collapse }">
      <router-link key="collapse" to="/">
        <img v-if="sysConfig.LOGO" :src="sysConfig.LOGO" class="sidebar-logo mr10" />
        <span class="title alignCenter">{{ sysConfig.SYSTEM_NAME }}</span>
      </router-link>

      <!-- <Hamburger /> -->
    </div>
  </transition>
</template>

<script>
export default {
  name: 'SidebarLogo',
  props: {
    collapse: {
      type: Boolean,
    },
  },
  components: {
    // Hamburger: defineAsyncComponent(() => import('./Hamburger')),
  },
  data() {
    return {}
  },
}
</script>

<style lang="scss" scoped>
.sidebarLogoFade-enter-active {
  transition: opacity 1.5s;
}

.sidebarLogoFade-enter,
.sidebarLogoFade-leave-to {
  opacity: 0;
}

.logoWrap {
  position: relative;
  flex: none;
  display: flex;
  justify-content: center;
  align-items: center;
  & .sidebar-logo {
    max-width: 28px;
    vertical-align: middle;
  }

  & .title {
    color: var(--FontBlack);
    font-weight: 600;
    line-height: 20px;
    font-size: 16px;
    vertical-align: middle;
    text-align: center;
  }

  &.collapse {
    .sidebar-logo {
      margin-right: 0px;
    }
  }

  .el-icon-s-operation {
    color: var(--FontBlack);
    font-size: 20px;
  }
}
</style>
