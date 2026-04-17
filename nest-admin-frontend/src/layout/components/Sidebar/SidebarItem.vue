<template>
  <div v-if="!route.meta?.isHidden && !route?.isHidden">
    <!-- 叶子菜单：直接点击跳转 -->
    <app-link v-if="isLeafMenu(route)" :to="resolvePath(route.path, route.query)">
      <el-menu-item :index="resolvePath(route.path, route.query)">
        <div class="menu-title" :style="{ padding: `0px ${15 * level}px` }">
          <svg-icon v-if="route.meta?.icon" :icon="route.meta.icon" class="mr10" />
          {{ route.meta?.title || route.name }}
        </div>
      </el-menu-item>
    </app-link>

    <!-- 目录菜单：显示下拉 -->
    <el-sub-menu v-else-if="route.children && route.children.length > 0" :index="resolvePath(route.path)">
      <template #title>
        <div class="menu-title" :style="{ padding: `0px ${15 * level}px` }" v-if="route.meta">
          <svg-icon v-if="route.meta.icon" :icon="route.meta.icon" class="mr10" />
          {{ route.meta?.title || route.name }}
        </div>
      </template>
      <SidebarItem
        v-for="item in route.children"
        :key="item.path"
        :isNest="true"
        :level="~~level + 1"
        :route="item"
        :basePath="resolvePath(route.path)"
        class="nest-menu" />
    </el-sub-menu>
  </div>
</template>

<script>
import path from 'path-browserify'
import { isExternal } from '@/utils/validate'
import AppLink from './Link'
// import FixiOSBug from './FixiOSBug'

export default {
  components: { AppLink },
  // mixins: [FixiOSBug],
  props: {
    // route object
    route: {
      type: Object,
      required: true,
    },
    level: {
      type: [String, Number],
      default: 1,
    },
    isNest: {
      type: Boolean,
      default: false,
    },
    basePath: {
      type: String,
      default: '',
    },
  },
  data() {
    return {}
  },
  methods: {
    // 判断是否为叶子菜单（无下拉）
    isLeafMenu(route) {
      if (!route.children || route.children.length === 0) {
        return true
      }

      const visibleChildren = route.children.filter((child) => !child.isHidden)
      return visibleChildren.length === 0
    },
    resolvePath(routePath, routeQuery) {
      if (!routePath || routePath === '/') {
        return '/'
      }

      if (isExternal(routePath)) {
        return routePath
      }
      if (isExternal(this.basePath)) {
        return this.basePath
      }

      if (/^\//.test(routePath)) {
        return routePath
      }

      if (routeQuery) {
        const query = typeof routeQuery === 'string' ? JSON.parse(routeQuery) : routeQuery
        return { path: path.resolve(this.basePath, routePath), query }
      }

      return path.resolve(this.basePath, routePath)
    },
  },
}
</script>
